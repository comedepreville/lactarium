import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Atmosphere } from "@/components/atmosphere";
import { PwaRegister } from "@/components/pwa-register";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lactae",
  description: "Suivi des tirages de lait — cible 800 ml / 24 h",
  applicationName: "Lactae",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lactae",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#c9918f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="font-body relative flex min-h-full flex-col">
        <Atmosphere />
        <PwaRegister />
        <SiteHeader />
        <main className="page-shell mx-auto w-full max-w-lg flex-1 px-4 pb-20 pt-5">
          {children}
        </main>
      </body>
    </html>
  );
}
