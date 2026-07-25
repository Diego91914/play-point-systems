import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  buildTriviaLiveHostSnapshot,
  buildTriviaLivePlayerSnapshot,
  isTriviaLiveAuthorizationError,
  readTriviaLiveHostToken,
  readTriviaLivePlayerToken,
} from "../../../../../games/trivia/play/trivia-live-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const encoder = new TextEncoder();
const HEARTBEAT_MS = 15000;
const STREAM_LIFETIME_MS = 4 * 60 * 1000;

function encodeEvent(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const playerId = new URL(request.url).searchParams.get("playerId");
  const token = playerId
    ? readTriviaLivePlayerToken(request, playerId)
    : readTriviaLiveHostToken(request, sessionId);
  const origin = new URL(request.url).origin;

  const loadSnapshot = () => playerId
    ? buildTriviaLivePlayerSnapshot(sessionId, playerId, token)
    : buildTriviaLiveHostSnapshot(sessionId, origin, token);

  let initialSnapshot;

  try {
    initialSnapshot = await loadSnapshot();
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to open the trivia stream." },
      { status: isTriviaLiveAuthorizationError(error) ? 401 : 404 },
    );
  }

  const supabase = getSupabaseServerClient();
  let stopStream = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let refreshInFlight = false;
      let refreshPending = false;
      let refreshTimer: ReturnType<typeof setTimeout> | null = null;
      let phaseTimer: ReturnType<typeof setTimeout> | null = null;

      const send = (event: string, data: unknown) => {
        if (!closed) {
          controller.enqueue(encodeEvent(event, data));
        }
      };

      const channel = supabase
        .channel(`trivia-stream-${sessionId}-${randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "ppl_trivia_sessions",
            filter: `id=eq.${sessionId}`,
          },
          () => {
            if (refreshTimer) {
              clearTimeout(refreshTimer);
            }
            refreshTimer = setTimeout(() => void refreshSnapshot(), 25);
          },
        );

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }
        if (phaseTimer) {
          clearTimeout(phaseTimer);
        }
        clearInterval(heartbeat);
        clearTimeout(lifetime);
        request.signal.removeEventListener("abort", close);
        void supabase.removeChannel(channel);

        try {
          controller.close();
        } catch {
          // The browser may have already canceled the stream.
        }
      };

      const scheduleQuestionOpen = (snapshot: unknown) => {
        if (phaseTimer) {
          clearTimeout(phaseTimer);
          phaseTimer = null;
        }

        const timedSnapshot = snapshot as { phase?: string; questionOpenedAtMs?: number | null };
        if (timedSnapshot.phase !== "question-countdown" || timedSnapshot.questionOpenedAtMs == null) {
          return;
        }

        phaseTimer = setTimeout(
          () => void refreshSnapshot(),
          Math.max(0, timedSnapshot.questionOpenedAtMs - Date.now()) + 25,
        );
      };

      const refreshSnapshot = async () => {
        if (closed) {
          return;
        }
        if (refreshInFlight) {
          refreshPending = true;
          return;
        }

        refreshInFlight = true;

        try {
          const nextSnapshot = await loadSnapshot();
          send("snapshot", nextSnapshot);
          scheduleQuestionOpen(nextSnapshot);
        } catch (error) {
          send("expired", {
            error: error instanceof Error ? error.message : "The trivia room is no longer available.",
          });
          close();
        } finally {
          refreshInFlight = false;
          if (refreshPending && !closed) {
            refreshPending = false;
            refreshTimer = setTimeout(() => void refreshSnapshot(), 25);
          }
        }
      };

      const heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        }
      }, HEARTBEAT_MS);

      const lifetime = setTimeout(() => {
        send("reconnect", { reason: "stream-refresh" });
        close();
      }, STREAM_LIFETIME_MS);

      stopStream = close;
      request.signal.addEventListener("abort", close, { once: true });
      controller.enqueue(encoder.encode(`: ${" ".repeat(2048)}\nretry: 1500\n\n`));
      send("snapshot", initialSnapshot);
      scheduleQuestionOpen(initialSnapshot);

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          send("ready", { connected: true });
        } else if (!closed && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          send("fallback", { reason: status.toLowerCase() });
          close();
        }
      });
    },
    cancel() {
      stopStream();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
