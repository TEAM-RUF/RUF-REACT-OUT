import "./globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FullScreenBtn } from "@/components/FullscreenBtn";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from '@vercel/analytics/react';
// Vercel Analytics

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Movenet",
  description: "",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Theme>{children}</Theme>
        <FullScreenBtn />
        <Toaster />
        <Analytics />
        <script src="https://code.responsivevoice.org/responsivevoice.js?key=UNPi4Kwz"></script>
      </body>
    </html>
  );
}
