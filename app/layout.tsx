import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "دلال — نظام إدارة مواعيد مراكز التجميل والعناية",
  description: "حجوزات منظمة، عربون محصّل، وعميلات لا تختفي — كل هذا باسم علامتك.",
  icons: {
    icon: [{ url: "/dalal-icon.png", type: "image/png" }],
    apple: [{ url: "/dalal-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "دلال — نظام إدارة مواعيد مراكز التجميل والعناية",
    description: "حجوزات منظمة، عربون محصّل، وعميلات لا تختفي — كل هذا باسم علامتك.",
    locale: "ar_SA",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`h-full antialiased ${tajawal.variable}`}>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 font-sans">
        {children}
      </body>
    </html>
  );
}
