import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header.tsx";

export const metadata: Metadata = {
  title: "Tavo auto USA",
  description: "Automobiliai iš JAV Copart ir IAAI aukcionų su pristatymu į Klaipėdą.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lt" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
