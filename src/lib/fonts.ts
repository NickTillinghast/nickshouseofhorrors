import { Creepster, Geist, Geist_Mono, Metal_Mania } from "next/font/google";

// Every font the site uses, loaded once in the root layout as CSS variables.
// Pages pick them through the --font-* variables in src/layout/variables.css

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Heading font candidates. --font-heading in variables.css chooses which one shows
export const metalMania = Metal_Mania({
  weight: "400",
  variable: "--font-metal-mania",
  subsets: ["latin"],
});

export const creepster = Creepster({
  weight: "400",
  variable: "--font-creepster",
  subsets: ["latin"],
});

// All the variable classes, for the <html> tag
export const fontVariables = [geistSans, geistMono, metalMania, creepster]
  .map((font) => font.variable)
  .join(" ");
