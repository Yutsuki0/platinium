import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/nav/Sidebar";
import { MobileNav } from "@/components/nav/MobileNav";
import { CodeMatrixBackground } from "@/components/CodeMatrixBackground";
import { EditorChrome } from "@/components/nav/EditorChrome";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden p-0 lg:p-3">
      <CodeMatrixBackground />
      <div className="relative z-10 flex min-h-screen lg:min-h-[calc(100vh-24px)]">
        <Sidebar />
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <EditorChrome>{children}</EditorChrome>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
