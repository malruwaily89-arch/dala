import type { Metadata } from "next";
import { Tajawal, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
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
    <html
      lang="ar"
      dir="rtl"
      className={`h-full antialiased ${tajawal.variable} ${playfairDisplay.variable} ${inter.variable}`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
