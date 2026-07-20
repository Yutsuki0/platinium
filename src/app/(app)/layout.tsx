import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/nav/Sidebar";
import { MobileNav } from "@/components/nav/MobileNav";
import { CodeMatrixBackground } from "@/components/CodeMatrixBackground";

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
    <div className="relative flex min-h-screen w-full overflow-hidden">
      <CodeMatrixBackground />
      <Sidebar />
      <main className="relative z-10 flex-1 px-4 pb-24 pt-4 lg:px-7 lg:pb-7 lg:pt-7">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
