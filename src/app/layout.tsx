import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tavo auto USA",
  description: "Automobiliai iš JAV Copart ir IAAI aukcionų su pristatymu į Klaipėdą.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lt" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
