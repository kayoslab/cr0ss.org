import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter } from "next/font/google";
import { SiteChrome } from './../components/site-chrome';

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <SiteChrome>{children}</SiteChrome>
        <Analytics/>
        <SpeedInsights/>
      </body>
    </html>
  );
}
