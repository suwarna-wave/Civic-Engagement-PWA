import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swatantra Aawaj — Your Voice, Your Koshi",
  description: "A modern civic participation experience for Koshi Province, Nepal.",
  applicationName: "Swatantra Aawaj",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Swatantra Aawaj",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#073f35",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
