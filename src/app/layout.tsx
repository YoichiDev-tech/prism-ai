import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// UI text face — clean, neutral, highly legible at small sizes.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Reserved for genuinely technical labels only (model name, token
// counts) — not used as a default UI face.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ultron",
  description: "Your personal AI assistant for startup success.",
  manifest: "/manifest.json",
};

// Separate `viewport` export (Next.js 14 convention) — device-width
// scaling plus viewport-fit=cover so the safe-area padding in
// globals.css can push content clear of notches/home-indicators.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0C10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body className="bg-base-bg text-ink-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
