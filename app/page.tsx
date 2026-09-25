import { LocaleProvider } from "@/lib/i18n/locale-context";
import { HomeShell } from "./home-shell";

export default function Home() {
  return (
    <LocaleProvider>
      <HomeShell />
    </LocaleProvider>
  );
}
