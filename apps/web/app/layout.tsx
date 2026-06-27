import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@snap-swap/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapSwap",
  description: "A real-time multiplayer outfit card race."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
