import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "apex-team",
  description: "BMAD-style multi-agent orchestration on top of apex-engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
