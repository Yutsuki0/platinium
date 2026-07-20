import { getServerSession } from "next-auth";
import { Trophy } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { readStore } from "@/lib/json/store";
import { GlobalAchievementsExplorer } from "@/components/achievements/GlobalAchievementsExplorer";
export const dynamic = "force-dynamic";
export default async function AchievementsPage() {
  const session = await getServerSession(authOptions); const userId = session!.user.id; const store = await readStore();
  const achievements = store.achievements.filter((a) => a.userId === userId); const games = store.games.filter((g) => g.userId === userId);
  return <div className="flex flex-col gap-6"><header><p className="text-xs uppercase tracking-[0.22em] text-steam">Collection complète</p><h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-white"><Trophy className="h-7 w-7 text-steam" /> Tous mes succès</h1><p className="mt-2 text-sm text-slate-400">Retrouve et filtre tous les succès enregistrés depuis Steam.</p></header><GlobalAchievementsExplorer achievements={achievements} games={games} /></div>;
}
