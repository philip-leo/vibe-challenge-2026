import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe Challenge 2026",
  description: "Vibe coding challenge - Lisbon offsite 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/style.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/style.css"
        />
      </head>
      <body className="m-0 min-h-dvh bg-background text-foreground">{children}</body>
    </html>
  );
}
