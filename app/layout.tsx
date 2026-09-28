import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Geist, Geist_Mono } from "next/font/google";

// Vercel's Geist family, self-hosted by next/font. Exposed as CSS variables
// and wired to Tailwind's --font-sans / --font-mono in globals.css, so every
// element (body text, code, chart labels) inherits them without per-component
// font classes.
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "cr0ss.mind",
  description: "Personal and professional website on cr0ss.org",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex flex-col min-h-screen font-sans antialiased">
        {children}
        <Analytics/>
        <SpeedInsights/>
      </body>
    </html>
  );
}
