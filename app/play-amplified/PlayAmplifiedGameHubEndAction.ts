import type { ResumeCandidate } from "./PlayAmplifiedResumeRuntime";

type EndAction = NonNullable<ResumeCandidate["endAction"]>;

async function requestShotCaddyEnd(sessionCode: string, hostPlayerId: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const credentialKey = "sc_device_credential";
  const expiryKey = "sc_device_credential_expires_at";
  const playerKey = "sc_player_id";
  const recoveryKey = "sc_recovery_code";
  const storage = window.localStorage;
  const sessionStorage = window.sessionStorage;
  const currentCredential = sessionStorage.getItem(credentialKey) || storage.getItem(credentialKey);
  const expiry = sessionStorage.getItem(expiryKey) || storage.getItem(expiryKey);

  if (currentCredential && expiry && Date.parse(expiry) > Date.now() + 60_000) {
    headers["x-sc-device-credential"] = currentCredential;
  } else {
    const storedPlayerId = sessionStorage.getItem(playerKey) || storage.getItem(playerKey) || "";
    const recoveryCode = sessionStorage.getItem(recoveryKey) || storage.getItem(recoveryKey) || "";
    if (storedPlayerId === hostPlayerId && recoveryCode) {
      const credentialResponse = await fetch("/api/auth/anonymous/ensure", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ existingPlayerId: hostPlayerId, recoveryCode }),
      });
      const credential = await credentialResponse.json().catch(() => ({}));
      if (credentialResponse.ok && typeof credential.deviceCredential === "string") {
        headers["x-sc-device-credential"] = credential.deviceCredential;
        if (typeof credential.deviceCredentialExpiresAt === "string") {
          for (const target of [sessionStorage, storage]) {
            target.setItem(credentialKey, credential.deviceCredential);
            target.setItem(expiryKey, credential.deviceCredentialExpiresAt);
          }
        }
      }
    }
  }

  const sendEnd = () => fetch(`/api/sessions/${encodeURIComponent(sessionCode)}/end`, {
    method: "POST",
    cache: "no-store",
    headers,
    body: JSON.stringify({ submittedByPlayerId: hostPlayerId }),
  });
  let response = await sendEnd();
  if (response.status === 409) response = await sendEnd();
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not end the game. Reconnect and try again.");

  const raw = storage.getItem("sc_active_round_resumes_v1");
  if (raw) {
    try {
      const resumes = JSON.parse(raw) as Record<string, { sessionCode?: string }>;
      for (const [mode, resume] of Object.entries(resumes)) {
        if (resume?.sessionCode?.toUpperCase() === sessionCode) delete resumes[mode];
      }
      storage.setItem("sc_active_round_resumes_v1", JSON.stringify(resumes));
    } catch { storage.removeItem("sc_active_round_resumes_v1"); }
  }
  for (const target of [sessionStorage, storage]) {
    if (target.getItem("sc_last_session_code")?.toUpperCase() === sessionCode) {
      target.removeItem("sc_last_session_code");
      target.removeItem("sc_last_player_id");
      target.removeItem("sc_last_player_name");
    }
  }
}

export async function endPlayAmplifiedSession(action: EndAction) {
  if (action.type === "shot-caddy") {
    await requestShotCaddyEnd(action.sessionCode, action.hostPlayerId);
    return;
  }

  let response: Response;
  if (action.type === "clear-stack") {
    response = await fetch("/api/games/clear-the-stack/room", {
      method: "PATCH",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: action.roomId, version: action.version, action: "close" }),
    });
  } else if (action.type === "social-room") {
    response = await fetch("/api/games/social-room-control", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "quit", game: action.game, code: action.code, playerId: action.playerId, token: action.token }),
    });
  } else {
    response = await fetch(`/api/trivia/sessions/${encodeURIComponent(action.sessionId)}/end`, {
      method: "POST",
      cache: "no-store",
    });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not end the game. Reconnect and try again.");

  if (action.type === "clear-stack") window.localStorage.removeItem("pps-clear-stack-host-room");
  if (action.type === "trivia") window.localStorage.removeItem("play-point-trivia-host-connection-v2");
}
