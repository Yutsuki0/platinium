import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLATINUM.EXE",
  description: "Un tracker de succès Steam pensé comme une interface de chasse au 100 %.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body><AuthSessionProvider><div className="relative mx-auto min-h-screen w-full max-w-[1700px]">{children}</div></AuthSessionProvider></body></html>;
}
