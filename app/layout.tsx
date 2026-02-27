import "./globals.css";

export const metadata = {
  title: "Vibe Challenge 2026",
  description: "Vibe coding challenge - Lisbon offsite 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0">{children}</body>
    </html>
  );
}
