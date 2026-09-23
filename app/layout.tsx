import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سيدة — نظام إدارة مواعيد الصالونات",
  description: "حجوزات منظمة، عربون محصّل، وعميلات لا تختفي.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 font-sans">
        {children}
      </body>
    </html>
  );
}
