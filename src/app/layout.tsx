import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import VisitTracker from "@/components/VisitTracker";

export const metadata: Metadata = {
  title: "StudentCentral - AI Tutor for Higher Education",
  description:
    "See how students think, not just what they answer. StudentCentral turns AI into a course-grounded learning system for guided learning, assessment, and feedback.",
  openGraph: {
    title: "StudentCentral - AI Tutor for Higher Education",
    description:
      "Students explain their reasoning. Professors understand how they learn.",
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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <LanguageProvider>
            <VisitTracker />
            {children}
          </LanguageProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
