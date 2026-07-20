import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAchievementSummariesForUser, getGameObjectivesForUser, getGamesForUser } from "@/lib/json/store";
import { ObjectivesBoard } from "@/components/objectives/ObjectivesBoard";

export const dynamic = "force-dynamic";
export default async function ObjectivesPage(){
  const session=await getServerSession(authOptions); const userId=session!.user.id;
  const [games,summaries,objectives]=await Promise.all([getGamesForUser(userId),getAchievementSummariesForUser(userId),getGameObjectivesForUser(userId)]);
  return <div className="flex flex-col gap-6"><header><p className="text-xs uppercase tracking-[0.2em] text-steam">Suivi personnel</p><h1 className="mt-2 font-display text-2xl font-semibold text-white">Mes objectifs</h1><p className="mt-2 text-sm text-slate-400">Organise les jeux que tu veux terminer et suis les succès qu’il te reste.</p></header><ObjectivesBoard games={games} summaries={summaries} objectives={objectives}/></div>
}
