import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Modex Engineers Architects", template: "%s — Modex Engineers Architects" },
  description: "Architecture, civil engineering and construction solutions in Kasaragod, Kerala — from concept to completion.",
  metadataBase: new URL("https://example.com"),
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body className={`${manrope.variable} ${cormorant.variable}`}><SmoothScroll>{children}</SmoothScroll></body></html>;
}
