import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "FULLCLEAR // OS",
  description: "Le système de chasse et de progression Steam conçu pour atteindre le full clear.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body><AuthSessionProvider><div className="relative mx-auto min-h-screen w-full max-w-[1700px]">{children}</div></AuthSessionProvider></body></html>;
}
