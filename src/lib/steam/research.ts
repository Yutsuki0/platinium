import "server-only";
import type { StoredAchievement, StoredDlcGroup, StoredGameResearch } from "@/lib/json/store";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150 Safari/537.36";

function decodeHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchTextDirect(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "fr-FR,fr;q=0.9,en;q=0.7",
      referer: "https://www.google.com/",
      "cache-control": "no-cache",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchText(url: string): Promise<string> {
  try {
    return await fetchTextDirect(url);
  } catch (directError) {
    const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`;
    try {
      return await fetchTextDirect(jinaUrl);
    } catch {
      throw directError;
    }
  }
}

function normalize(value: string): string {
  return decodeHtml(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/\b(the|a|an|le|la|les|un|une|des|de|du|d|l)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyGameName(name: string): string {
  return normalize(name)
    .replace(/\bcomplete edition\b|\bdirector s cut\b|\bremastered\b|\bfull burst\b/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function similarity(a: string, b: string): number {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.93;
  const aWords = new Set(left.split(" "));
  const bWords = new Set(right.split(" "));
  const common = [...aWords].filter((word) => bWords.has(word)).length;
  const union = new Set([...aWords, ...bWords]).size;
  return union ? common / union : 0;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const re = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      links.push(new URL(match[1], baseUrl).toString());
    } catch {}
  }
  return [...new Set(links)];
}

function extractPageTitle(html: string): string {
  const candidates = [
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1],
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
    html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1],
  ].filter(Boolean) as string[];
  return candidates.length ? decodeHtml(candidates[0]).replace(/\s*[-|].*$/, "").trim() : "DLC";
}

function extractTrophyEntries(html: string): { title: string; description: string | null }[] {
  const entries: { title: string; description: string | null }[] = [];
  const blocks = html.match(/<(?:article|li|div|tr)[^>]*(?:troph|succes|achievement)[^>]*>[\s\S]*?<\/(?:article|li|div|tr)>/gi) ?? [];

  for (const block of blocks) {
    const titleMatch = block.match(/<(?:h2|h3|h4|strong|b|a)[^>]*>([\s\S]{2,180}?)<\/(?:h2|h3|h4|strong|b|a)>/i);
    if (!titleMatch) continue;
    const title = decodeHtml(titleMatch[1]);
    if (!title || /guide|trophées?|succès|dlc|bronze|argent|or|platine/i.test(title) && title.split(" ").length < 3) continue;
    const descriptionCandidates = [...block.matchAll(/<(?:p|span|div)[^>]*>([\s\S]{4,500}?)<\/(?:p|span|div)>/gi)]
      .map((match) => decodeHtml(match[1]))
      .filter((text) => text && text !== title && text.length > 5);
    entries.push({ title, description: descriptionCandidates[0] ?? null });
  }

  if (entries.length === 0) {
    const textLines = html
      .split(/\n|<br\s*\/?\s*>/i)
      .map(decodeHtml)
      .filter((line) => line.length >= 3 && line.length <= 180);
    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      if (/^(bronze|argent|or|platine|secret|caché)$/i.test(line)) continue;
      if (/trophée|succès|guide/i.test(line) && line.length < 40) continue;
      const next = textLines[i + 1];
      if (next && next.length > 10 && !entries.some((entry) => normalize(entry.title) === normalize(line))) {
        entries.push({ title: line, description: next });
      }
    }
  }

  return entries.filter((entry, index, all) => all.findIndex((other) => normalize(other.title) === normalize(entry.title)) === index);
}

async function searchPsthcGamePage(gameName: string): Promise<string | null> {
  const query = encodeURIComponent(`site:psthc.fr/unjeu/ \"${gameName}\" guide trophées`);
  const searchUrls = [
    `https://html.duckduckgo.com/html/?q=${query}`,
    `https://www.google.com/search?q=${query}`,
  ];

  for (const searchUrl of searchUrls) {
    try {
      const html = await fetchText(searchUrl);
      const links = extractLinks(html, searchUrl)
        .map((link) => {
          const uddg = new URL(link).searchParams.get("uddg");
          return uddg ? decodeURIComponent(uddg) : link;
        })
        .filter((link) => /psthc\.fr\/unjeu\//i.test(link) && /guide-trophees/i.test(link));
      if (links.length) return links[0].replace(/&amp;/g, "&");
    } catch {}
  }

  const slug = slugifyGameName(gameName);
  const candidates = [
    `https://www.psthc.fr/unjeu/${slug}-ps5/guide-trophees.htm`,
    `https://www.psthc.fr/unjeu/${slug}-ps4/guide-trophees.htm`,
    `https://www.psthc.fr/unjeu/${slug}/guide-trophees.htm`,
  ];
  for (const candidate of candidates) {
    try {
      await fetchText(candidate);
      return candidate;
    } catch {}
  }
  return null;
}

async function researchWithPsthc(gameName: string, achievements: StoredAchievement[]) {
  const baseUrl = await searchPsthcGamePage(gameName);
  if (!baseUrl) return null;

  const baseHtml = await fetchText(baseUrl);
  const allLinks = extractLinks(baseHtml, baseUrl);
  const dlcLinks = allLinks.filter((url) => /guide-trophees-dlc\d*\.html/i.test(url));

  const groups: StoredDlcGroup[] = [];
  const descriptions = new Map<string, string>();
  const sources = [{ name: "PSTHC – guide principal", url: baseUrl }];

  for (const dlcUrl of dlcLinks) {
    try {
      const html = await fetchText(dlcUrl);
      const entries = extractTrophyEntries(html);
      const matched = new Set<string>();

      for (const entry of entries) {
        const candidates = achievements
          .map((achievement) => ({ achievement, score: similarity(entry.title, achievement.displayName) }))
          .sort((a, b) => b.score - a.score);
        const best = candidates[0];
        if (!best || best.score < 0.72) continue;
        matched.add(best.achievement.apiName);
        if (!best.achievement.description && entry.description) descriptions.set(best.achievement.apiName, entry.description);
      }

      if (matched.size > 0) {
        const title = extractPageTitle(html)
          .replace(/guide\s*(des\s*)?trophées?/i, "")
          .replace(/assassin'?s creed origins/i, "")
          .replace(/^\s*[-–|:]\s*/, "")
          .trim() || `DLC ${groups.length + 1}`;
        groups.push({ name: title, paid: true, achievementApiNames: [...matched] });
        sources.push({ name: `PSTHC – ${title}`, url: dlcUrl });
      }
    } catch {}
  }

  const baseEntries = extractTrophyEntries(baseHtml);
  for (const entry of baseEntries) {
    const candidates = achievements
      .filter((achievement) => achievement.hidden && !achievement.description)
      .map((achievement) => ({ achievement, score: similarity(entry.title, achievement.displayName) }))
      .sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (best && best.score >= 0.72 && entry.description) descriptions.set(best.achievement.apiName, entry.description);
  }

  return { groups, descriptions, sources, baseUrl, hadDlcPages: dlcLinks.length > 0 };
}

function hiddenDescriptionsFromSteam(html: string, achievements: StoredAchievement[]) {
  const updates = new Map<string, string>();
  const visibleText = decodeHtml(html);
  for (const achievement of achievements.filter((item) => item.hidden && !item.description)) {
    const title = normalize(achievement.displayName);
    if (!title || !normalize(visibleText).includes(title)) continue;
    const safe = achievement.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexes = [
      new RegExp(`${safe}[\\s\\S]{0,1200}?class=["'][^"']*(?:achieveTxt|description)[^"']*["'][^>]*>([\\s\\S]{2,500}?)<`, "i"),
      new RegExp(`${safe}[\\s\\S]{0,700}?<p[^>]*>([\\s\\S]{2,500}?)<\\/p>`, "i"),
    ];
    for (const regex of regexes) {
      const match = html.match(regex);
      const value = match ? decodeHtml(match[1]) : "";
      if (value && !/hidden achievement|succès caché/i.test(value)) {
        updates.set(achievement.apiName, value);
        break;
      }
    }
  }
  return updates;
}

export async function researchGame(
  userId: string,
  appId: number,
  gameName: string,
  achievements: StoredAchievement[]
): Promise<{ research: StoredGameResearch; descriptions: Map<string, string> }> {
  const sources: { name: string; url: string }[] = [];
  const descriptions = new Map<string, string>();
  const errors: string[] = [];
  let groups: StoredDlcGroup[] = [];
  let psthcFound = false;
  let psthcHadDlcPages = false;

  try {
    const psthc = await researchWithPsthc(gameName, achievements);
    if (psthc) {
      psthcFound = true;
      psthcHadDlcPages = psthc.hadDlcPages;
      groups = psthc.groups;
      sources.push(...psthc.sources);
      for (const [key, value] of psthc.descriptions) descriptions.set(key, value);
    } else {
      errors.push("PSTHC : page du jeu introuvable ou inaccessible");
    }
  } catch (error) {
    errors.push(`PSTHC : ${error instanceof Error ? error.message : String(error)}`);
  }

  const steamUrls = [
    `https://steamcommunity.com/stats/${appId}/achievements/?l=french`,
    `https://steamcommunity.com/stats/${appId}/achievements/?l=english`,
  ];
  for (const steamUrl of steamUrls) {
    try {
      const html = await fetchText(steamUrl);
      sources.push({ name: steamUrl.includes("english") ? "Steam – succès généraux (anglais)" : "Steam – succès généraux", url: steamUrl });
      for (const [key, value] of hiddenDescriptionsFromSteam(html, achievements)) {
        if (!descriptions.has(key)) descriptions.set(key, value);
      }
    } catch (error) {
      errors.push(`Steam : ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const uniqueGroups = groups
    .map((group) => ({ ...group, achievementApiNames: [...new Set(group.achievementApiNames)] }))
    .filter((group) => group.achievementApiNames.length > 0)
    .filter((group, index, all) => all.findIndex((other) => normalize(other.name) === normalize(group.name)) === index);

  const status: StoredGameResearch["status"] =
    uniqueGroups.length > 0
      ? "VERIFIED"
      : psthcFound && !psthcHadDlcPages
        ? "NO_DLC_FOUND"
        : errors.length >= 3
          ? "FAILED"
          : "UNVERIFIED";

  return {
    descriptions,
    research: {
      userId,
      appId,
      status,
      requiresPaidDlc: uniqueGroups.some((group) => group.paid),
      hiddenDescriptionsFound: descriptions.size,
      groups: uniqueGroups,
      sources,
      checkedAt: new Date().toISOString(),
      error: errors.length ? errors.join(" | ") : null,
    },
  };
}
