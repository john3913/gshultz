import type { Metadata } from "next";
import { Geist, Geist_Mono, Abril_Fatface } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const abrilFatface = Abril_Fatface({ variable: "--font-abril", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Higgsfield Explorer — Multi-Node GPU Orchestration",
  description:
    "Interactive explorer for Higgsfield: fault-tolerant distributed LLM training with ZeRO-3 sharding, PyTorch FSDP, and GitHub Actions CI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${abrilFatface.variable}`}>
      <body>{children}</body>
    </html>
  );
}
