import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Raj's Insurance CRM",
  description: "Insurance CRM with LiveKit telephony and Gemini voice agents.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
