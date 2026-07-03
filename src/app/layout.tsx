import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guerilla Planter — tree registry",
  description:
    "Map, track and care for guerilla-planted trees. Record where you plant, and keep saplings alive.",
  themeColor: "#2f9e44",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
