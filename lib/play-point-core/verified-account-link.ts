/**
 * A separately reviewed link is required before a Shot Caddy account can
 * become a Play Amplified session. Email matching alone is not a link.
 */
export type ExternalAccountLink = {
  external_account_id: string;
  play_point_user_id: string;
};

export type VerifiedPlayPointUser = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

function normalizedEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function matchesVerifiedAccountLink(input: {
  externalAccountId: string;
  handoffEmail: string;
  link: ExternalAccountLink | null;
  user: VerifiedPlayPointUser | null;
}): boolean {
  const { externalAccountId, handoffEmail, link, user } = input;
  return Boolean(
    externalAccountId &&
      normalizedEmail(handoffEmail) &&
      link?.external_account_id === externalAccountId &&
      user?.id === link?.play_point_user_id &&
      (user?.email_confirmed_at || user?.confirmed_at) &&
      normalizedEmail(user?.email) === normalizedEmail(handoffEmail),
  );
}

/** Only trusted app_metadata, never user_metadata or external Founder claims. */
export function isFounderAppMetadata(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const metadata = value as Record<string, unknown>;
  return metadata.play_point_founder === true || metadata.play_point_role === "founder";
}
