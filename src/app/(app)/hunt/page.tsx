import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readStore } from "@/lib/json/store";
import { HuntModeClient } from "@/components/games/HuntModeClient";
import { todayKey } from "@/lib/fullclear/hunt";
export const dynamic="force-dynamic";
export default async function HuntPage(){
 const session=await getServerSession(authOptions); const userId=session!.user.id; const store=await readStore();
 const games=new Map(store.games.filter(g=>g.userId===userId).map(g=>[g.appId,g])); const summaries=new Map(store.achievementSummaries.filter(s=>s.userId===userId).map(s=>[s.appId,s]));
 const entries=store.achievements.filter(a=>a.userId===userId&&!a.achieved).map(a=>{const game=games.get(a.appId);const summary=summaries.get(a.appId);if(!game||!summary)return null;return {achievement:{appId:a.appId,apiName:a.apiName,displayName:a.displayName,iconGrayUrl:a.iconGrayUrl,iconUrl:a.iconUrl},game:{appId:game.appId,name:game.name},summary:{total:summary.total,unlocked:summary.unlocked,percentage:summary.percentage},score:0}}).filter(Boolean) as any[];
 const initialHunt=store.dailyHunts.find(h=>h.userId===userId&&h.dateKey===todayKey())??null;
 return <HuntModeClient entries={entries} initialHunt={initialHunt}/>;
}
