import { headers } from "next/headers";
import type { ReactNode } from "react";
import { isPlayAmplifiedShell, type SiteShellSection } from "@/lib/site-shell-brand";
import { SiteShellClient } from "./SiteShellClient";

type SiteShellProps = {
  children: ReactNode;
  current?: SiteShellSection;
  showAccessNotice?: boolean;
  variant?: "auto" | "company" | "play-amplified";
};

export async function SiteShell({
  children,
  current,
  showAccessNotice = false,
  variant = "auto",
}: SiteShellProps) {
  const requestHeaderSection =
    current === "play" ||
    current === "games" ||
    current === "account" ||
    current === "score-caddy" ||
    current === "shot-caddy";
  const requestHeaders = requestHeaderSection ? await headers() : null;
  const hostname = requestHeaders?.get("host") ?? requestHeaders?.get("x-forwarded-host");
  const detectedPlayAmplifiedHost = isPlayAmplifiedShell(hostname, current);
  const isPlayAmplifiedHost =
    variant === "play-amplified" ||
    (variant === "auto" && detectedPlayAmplifiedHost);

  return (
    <SiteShellClient
      current={current}
      showAccessNotice={showAccessNotice}
      isPlayAmplifiedHost={isPlayAmplifiedHost}
    >
      {children}
    </SiteShellClient>
  );
}
