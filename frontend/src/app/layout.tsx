import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal AI Canvas",
  description: "Your private AI assistant with multilingual voice support and executive tools.",
  openGraph: {
    title: "Personal AI Canvas",
    description: "Your private AI assistant with multilingual voice support and executive tools.",
    url: "https://personal-ai-canvas.vercel.app",
    siteName: "Personal AI Canvas",
    images: [
      {
        url: "https://personal-ai-canvas.vercel.app/avatar.svg",
        width: 512,
        height: 512,
        alt: "Personal AI Canvas Icon",
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/avatar.svg",
    shortcut: "/avatar.svg",
    apple: "/avatar.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
