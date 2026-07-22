import { permanentRedirect } from "next/navigation";

export default function ListenRedirectPage() {
  permanentRedirect("/music");
}
