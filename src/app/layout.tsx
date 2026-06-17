import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XAANI - Premium Streetwear",
  description: "Shop premium XAANI streetwear — graphic tees, oversized fits, and limited edition drops designed for everyday confidence.",
  keywords: ["XAANI", "streetwear", "graphic tees", "oversized tees", "fashion", "clothing", "e-commerce", "limited edition"],
  authors: [{ name: "XAANI" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "XAANI - Premium Streetwear",
    description: "Discipline. Individuality. Self-expression. Shop XAANI's latest drops.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
