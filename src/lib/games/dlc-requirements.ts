import type { StoredGameResearch } from "@/lib/json/store";
export function getAchievementDlcFromResearch(research:StoredGameResearch|null,apiName:string){if(!research)return null;for(const g of research.groups){if(g.achievementApiNames.includes(apiName))return{name:g.name,paid:g.paid};}return null;}
