import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlipBook — Realistic PDF page turning",
  description: "Upload a PDF and read it as a realistic interactive flipbook on any device.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
