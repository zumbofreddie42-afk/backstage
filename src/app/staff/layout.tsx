import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/app/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Pannello · Backstage", template: "%s · Pannello Backstage" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#241347" };

export default function StaffRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={fontVariables} data-scroll-behavior="smooth">
      <body className="min-h-dvh bg-muted">{children}</body>
    </html>
  );
}
