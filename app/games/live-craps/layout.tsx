import type { ReactNode } from "react";
import { LiveCrapsInviteBridge } from "./LiveCrapsInviteBridge";

export default function LiveCrapsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <LiveCrapsInviteBridge />
    </>
  );
}
