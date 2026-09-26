import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://updates.zunialab.com"),
  title: {
    default: "Zunia updates",
    template: "%s · Zunia updates",
  },
  description: "Changelog, versions, and a place to report a bug or ask for a feature.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0a09",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
