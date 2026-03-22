import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "Student Central — Reasoning-Aware Assessment for Higher Education",
  description:
    "See whether students understood the answer — not just whether they clicked it. Student Central combines MCQs with AI-guided explanation to help educators assess reasoning, detect misconceptions, and measure real topic mastery.",
  openGraph: {
    title: "Student Central — Reasoning-Aware Assessment",
    description:
      "Assessment beyond the multiple-choice score. Faculty-facing assessment intelligence for higher education.",
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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
