import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal AI Genie",
  description: "Autonomous Multi-User Workspace & Personal AI Companion",
  metadataBase: new URL("https://personal-ai-canvas.vercel.app"),
  manifest: "/manifest.json",
  openGraph: {
    title: "Personal AI Genie",
    description: "Autonomous Multi-User Workspace & Personal AI Companion",
    url: "https://personal-ai-canvas.vercel.app",
    siteName: "Personal AI Genie",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/icon.svg",
    apple: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-[100dvh] w-full bg-slate-50 text-slate-900 antialiased overflow-x-hidden">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
