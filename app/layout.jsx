import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Spotify Clone",
  description: "Made by Guru Ganesh",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/images/logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionWrapper>
          <Suspense>{children}</Suspense>
        </SessionWrapper>
      </body>
    </html>
  );
}
