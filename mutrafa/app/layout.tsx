import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "مُترَفة — عميلتك تحجز وتدفع العربون من واتساب",
    template: "%s | مُترَفة",
  },
  description: "نظام حجز وعربون لصالونات التجميل: صفحة حجز خاصة بصالونك، عربون إلكتروني يمنع الغياب، وتذكيرات واتساب.",
  applicationName: "مُترَفة",
};

export const viewport: Viewport = {
  themeColor: "#8a1538",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
