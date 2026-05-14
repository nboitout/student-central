import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PreSales Central — AI-Guided Technical Demos",
  description:
    "Turn your technical docs into interactive AI-guided demos. Let an AI pre-sales agent walk prospects through your product, ask discovery questions, and surface fit signals.",
  openGraph: {
    title: "PreSales Central — AI-Guided Technical Demos",
    description:
      "AI pre-sales agent that presents your docs, discovers pain points, and qualifies prospects.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
