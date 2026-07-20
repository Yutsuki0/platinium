import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MobileNav } from "@/components/nav/MobileNav";
import { CodeMatrixBackground } from "@/components/CodeMatrixBackground";
import { DesktopWorkspace } from "@/components/nav/DesktopWorkspace";
import { EditorChrome } from "@/components/nav/EditorChrome";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <CodeMatrixBackground />
      <DesktopWorkspace>{children}</DesktopWorkspace>
      <div className="relative z-10 min-h-screen pb-20 lg:hidden"><EditorChrome>{children}</EditorChrome></div>
      <MobileNav />
    </div>
  );
}
