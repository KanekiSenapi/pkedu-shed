import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Plan Zajęć PK - Informatyka",
  description: "Portal planu zajęć dla studentów Politechniki Krakowskiej",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#083575" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Plan PK" />
      </head>
      <body className="antialiased">
        <SessionProvider>
          {children}
          <Toaster position="top-right" />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
