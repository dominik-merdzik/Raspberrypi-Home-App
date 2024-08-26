import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav"; // Make sure the path is correct based on where your Nav component is located

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dom's Raspberry Pi 3",
  description: "Dominik's Personal Raspberry Pi 3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
