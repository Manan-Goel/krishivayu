import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KrishiVayu — Burn Alert to Buyer Match",
  description: "Detect crop-residue fires in Punjab/Haryana, rank risk to Delhi air quality, and match hotspots to clean residue alternatives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Resolve DNS + open TCP connections before map component mounts */}
        <link rel="preconnect" href="https://tiles.openfreemap.org" />
        <link rel="preconnect" href="https://unpkg.com" />
        {/* MapLibre CSS — load here so it's in the <head>, not injected late by the component */}
        <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-[#020714] text-[#e8eaf0]">
        {children}
      </body>
    </html>
  );
}
