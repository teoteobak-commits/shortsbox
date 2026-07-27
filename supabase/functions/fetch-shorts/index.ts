// 쇼츠박스 — 매일 배치로 유튜브에서 여행지별 꿀템 쇼츠 TOP10을 수집하는 Edge Function
// 배포: supabase functions deploy fetch-shorts
// 시크릿 등록: supabase secrets set YOUTUBE_API_KEY=발급받은키
//
// 준비박스/현지박스 구분은 검색어만으로 정확히 나누기 어려워 제거했다.
// 여행지(국가) 단위로 "여행 꿀템" 하나의 리스트만 운영한다.
// 주의: 유튜브 공개 API는 영상 속에 태그된 "제품+가격+구매링크" 정보는 제공하지 않는다.
//       그 부분은 여전히 관리자가 직접 입력해야 한다.
//
// "꿀템"이라는 단어가 실제로는 제품 추천뿐 아니라 순수 팁/노하우 영상에도 붙는 경우가 많아서
// (예: "허리 안아프게 가는법"), 제목·설명 기반 휴리스틱으로 쇼핑 콘텐츠를 우선시한다.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type Destination = { id: number; name: string };

const TOP_N = 10;

/* 쇼핑 콘텐츠 판별 휴리스틱 */
const PRODUCT_KEYWORDS = /아이템|제품|쇼핑|구매|추천템|필수템|꿀템|캐리어|가방|짐싸기|리스트|용품|굿즈/;
const TIP_ONLY_KEYWORDS = /하는법|가는법|노하우|주의사항|생존법|대처법|꿀팁|방법$/;
// "가방"처럼 제품 키워드가 섞여 있어도, 사건·사고성 경고 단어가 있으면 쇼핑 콘텐츠가 아니라고 본다
const WARNING_KEYWORDS = /소매치기|사기|도난|분실|위험|바가지|조심|주의보|당하/;
const AFFILIATE_PATTERN = /coupang\.com|link\.coupang|쿠팡\s*파트너스|amzn\.to|amazon\.[a-z.]+\/|aliexpress/i;

function classify(title: string, description: string){
  const hasAffiliate = AFFILIATE_PATTERN.test(description || "");
  const hasWarning = WARNING_KEYWORDS.test(title);
  const hasProductKeyword = !hasWarning && PRODUCT_KEYWORDS.test(title);
  const hasTipOnly = (TIP_ONLY_KEYWORDS.test(title) || hasWarning) && !hasProductKeyword;
  return { hasAffiliate, hasProductKeyword, hasTipOnly };
}

/* 쇼핑 신호 우선 정렬: 제휴링크 있음 > 제품 키워드 있음 > 조회수 */
function rankCandidates(items: any[]){
  return items
    .filter((it) => !it.hasTipOnly || it.hasAffiliate) // 순수 팁이면서 제휴링크도 없는 건 제외
    .sort((a, b) => {
      if (a.hasAffiliate !== b.hasAffiliate) return a.hasAffiliate ? -1 : 1;
      if (a.hasProductKeyword !== b.hasProductKeyword) return a.hasProductKeyword ? -1 : 1;
      return b.views - a.views;
    });
}

async function searchTopShorts(query: string, limit: number) {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.search = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: "snippet",
    q: query,
    type: "video",
    videoDuration: "short",
    order: "viewCount",
    maxResults: "25",
    relevanceLanguage: "ko",
  }).toString();

  const searchRes = await fetch(searchUrl);
  const searchJson = await searchRes.json();
  if (!searchJson.items?.length) return [];

  const ids = searchJson.items.map((it: any) => it.id.videoId).join(",");

  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.search = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: "statistics,snippet",
    id: ids,
  }).toString();

  const statsRes = await fetch(statsUrl);
  const statsJson = await statsRes.json();

  const items = (statsJson.items ?? []).map((it: any) => {
    const title = it.snippet.title;
    const description = it.snippet.description ?? "";
    return {
      youtubeId: it.id,
      title,
      channelName: it.snippet.channelTitle,
      thumbnailUrl: it.snippet.thumbnails?.high?.url ?? it.snippet.thumbnails?.default?.url,
      views: Number(it.statistics?.viewCount ?? 0),
      ...classify(title, description),
    };
  });

  return rankCandidates(items).slice(0, limit);
}

Deno.serve(async () => {
  const { data: destinations, error: destErr } = await supabase
    .from("destinations")
    .select("id, name");

  if (destErr) {
    return new Response(JSON.stringify({ error: destErr.message }), { status: 500 });
  }

  const results: Record<string, number | string> = {};

  const { data: curatedRows } = await supabase.from("products").select("youtube_id");
  const curatedIds = new Set((curatedRows ?? []).map((r: any) => r.youtube_id));
  const claimedIds = new Set<string>(); // 이번 배치 실행 중 이미 다른 여행지가 차지한 영상

  for (const dest of destinations as Destination[]) {
    try {
      const { data: existing } = await supabase
        .from("shorts")
        .select("youtube_id")
        .eq("destination_id", dest.id);

      const protectedIds = (existing ?? [])
        .map((r: any) => r.youtube_id)
        .filter((id: string) => curatedIds.has(id));

      // 큐레이션(제품 있음) 영상을 제외한 나머지만 삭제
      let delQuery = supabase.from("shorts").delete().eq("destination_id", dest.id);
      if (protectedIds.length) {
        delQuery = delQuery.not("youtube_id", "in", `(${protectedIds.join(",")})`);
      }
      const { error: delErr } = await delQuery;
      if (delErr) throw new Error(`delete failed: ${delErr.message}`);

      const remainingSlots = Math.max(0, TOP_N - protectedIds.length);
      const candidates = await searchTopShorts(`${dest.name} 여행 아이템 추천`, remainingSlots + protectedIds.length + claimedIds.size);
      const fresh = candidates
        .filter((s: any) => !curatedIds.has(s.youtubeId) && !claimedIds.has(s.youtubeId))
        .slice(0, remainingSlots);
      fresh.forEach((s: any) => claimedIds.add(s.youtubeId));

      if (fresh.length) {
        const { error: upsertErr } = await supabase.from("shorts").upsert(
          fresh.map((s: any) => ({
            youtube_id: s.youtubeId,
            destination_id: dest.id,
            title: s.title,
            channel_name: s.channelName,
            views: s.views,
            thumbnail_url: s.thumbnailUrl,
            fetched_at: new Date().toISOString(),
          })),
        );
        if (upsertErr) throw new Error(`upsert failed: ${upsertErr.message}`);
      }
      results[dest.name] = fresh.length + protectedIds.length;
    } catch (e) {
      results[dest.name] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
