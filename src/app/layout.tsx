import type { Metadata } from "next";
import "@fontsource-variable/open-sans";
import "./globals.css";
import Header from "@/components/Header.tsx";
import Footer from "@/components/Footer.tsx";

export const metadata: Metadata = {
  title: "Tavo auto USA — automobiliai iš JAV aukcionų",
  description: "Automobiliai iš JAV Copart ir IAAI aukcionų su pristatymu į Klaipėdą. Paieška, statymai, transportas ir muitinė.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lt" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
