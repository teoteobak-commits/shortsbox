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

type Destination = { id: number; name: string; country: string | null };

const TOP_N = 10;

/* 쇼핑/맛집 등 "실용 정보" 콘텐츠 판별 휴리스틱.
   과거에는 "위험/사고 단어가 없으면 통과"하는 블랙리스트 방식이라, 아이템·맛집과
   무관한 개인 브이로그(예: "신혼여행 현실 feat.반신욕")도 걸러지지 않고 통과됐다.
   그래서 지금은 반대로 "실용 정보 키워드가 있어야만 통과"하는 화이트리스트 방식으로 바꿨다.
   "템"을 어근으로 잡아서 꿀템/찐템/핫템/대박템/인생템 등 슬랭 변형을 한 번에 커버한다. */
const PRODUCT_KEYWORDS = /템|아이템|제품|쇼핑|구매|추천|필수|캐리어|가방|짐싸기|리스트|용품|굿즈|준비물|체크리스트|맛집|카페|디저트|매장|핫플|스팟|가이드/;
// "가방"처럼 제품 키워드가 섞여 있어도, 사건·사고성 경고 단어가 있으면 실용 정보로 보지 않는다
const WARNING_KEYWORDS = /소매치기|사기|도난|분실|위험|바가지|조심|주의보|당하/;
const AFFILIATE_PATTERN = /coupang\.com|link\.coupang|쿠팡\s*파트너스|amzn\.to|amazon\.[a-z.]+\/|aliexpress/i;

function classify(title: string, description: string){
  const hasAffiliate = AFFILIATE_PATTERN.test(description || "");
  const hasWarning = WARNING_KEYWORDS.test(title);
  const hasProductKeyword = !hasWarning && PRODUCT_KEYWORDS.test(title);
  return { hasAffiliate, hasProductKeyword };
}

/* 쇼핑 신호 우선 정렬: 제휴링크 있음 > 제품 키워드 있음 > 조회수.
   실용 정보 신호(hasProductKeyword)나 제휴링크가 전혀 없는 영상은 아예 후보에서 제외한다. */
function rankCandidates(items: any[]){
  return items
    .filter((it) => it.hasProductKeyword || it.hasAffiliate)
    .sort((a, b) => {
      if (a.hasAffiliate !== b.hasAffiliate) return a.hasAffiliate ? -1 : 1;
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

/* 큐레이션(제품 등록된) 영상은 아래 수집 루프에서 삭제 대상에서 빠지는데, 그 탓에 조회수도
   큐레이션한 시점 값에 그대로 멈춰버린다. 랭킹 페이지가 조회수로 정렬하기 때문에 실제로는
   틀린 순위가 나온다. 그래서 이 영상들만 따로 최신 통계를 받아와 갱신한다.
   videos.list는 한 번에 50개까지 조회할 수 있어서 호출 비용은 거의 들지 않는다. */
async function refreshCuratedStats(ids: string[]) {
  let updated = 0;
  const missing: string[] = [];

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.search = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      part: "statistics,snippet",
      id: batch.join(","),
    }).toString();

    const res = await fetch(url);
    const json = await res.json();
    const found = new Set<string>();

    for (const item of json.items ?? []) {
      found.add(item.id);
      const { error } = await supabase
        .from("shorts")
        .update({
          views: Number(item.statistics?.viewCount ?? 0),
          title: item.snippet.title,
          channel_name: item.snippet.channelTitle,
          thumbnail_url: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url,
          fetched_at: new Date().toISOString(),
        })
        .eq("youtube_id", item.id);
      if (!error) updated++;
    }

    // 유튜브에서 삭제·비공개된 영상. 제품 정보가 걸려 있으므로 지우지 않고 보고만 한다.
    for (const id of batch) if (!found.has(id)) missing.push(id);
  }

  return { updated, missing };
}

Deno.serve(async () => {
  const { data: destinations, error: destErr } = await supabase
    .from("destinations")
    .select("id, name, country");

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

      /* 반드시 "검색 먼저, 삭제 나중" 순서를 지킨다.
         예전에는 기존 쇼츠를 먼저 지우고 검색했는데, 그날 검색 결과가 0건이면
         지워진 채로 끝나서 그 여행지 페이지가 통째로 비어버렸다(타이베이·세부에서 실제 발생).
         유튜브 검색 결과는 날마다 흔들리므로, 새로 채울 게 확보됐을 때만 기존 것을 정리한다. */
      const remainingSlots = Math.max(0, TOP_N - protectedIds.length);
      const wanted = remainingSlots + protectedIds.length + claimedIds.size;

      /* 도시 이름으로는 쇼핑 콘텐츠가 거의 안 잡히는 곳이 있다(타이베이·괌에서 0건).
         그런 경우 국가 이름으로 한 번 더 찾는다. 같은 나라면 쇼핑 아이템은 대체로 통용된다.
         판단 기준은 "검색 결과 수"가 아니라 "필터를 통과해 실제로 쓸 수 있는 수"여야 한다 —
         후보가 있어도 이미 큐레이션됐거나 다른 여행지가 가져간 것뿐이면 결국 채울 게 없기 때문. */
      const usable = (list: any[]) =>
        list
          .filter((s: any) => !curatedIds.has(s.youtubeId) && !claimedIds.has(s.youtubeId))
          .slice(0, remainingSlots);

      const byCity = await searchTopShorts(`${dest.name} 여행 아이템 추천`, wanted);
      let fresh = usable(byCity);
      let usedFallback = false;
      let byCountryCount = -1;
      if (!fresh.length && dest.country && dest.country !== dest.name) {
        const byCountry = await searchTopShorts(`${dest.country} 여행 아이템 추천`, wanted);
        byCountryCount = byCountry.length;
        fresh = usable(byCountry);
        usedFallback = true;
      }
      const diag = `city:${byCity.length} country:${byCountryCount} fallback:${usedFallback}`;

      if (!fresh.length) {
        // 새로 가져온 게 없으면 기존 데이터를 그대로 둔다 (삭제하지 않음)
        results[dest.name] = `kept ${(existing ?? []).length} (no new candidates | ${diag})`;
        continue;
      }

      fresh.forEach((s: any) => claimedIds.add(s.youtubeId));

      // 새 목록에 없고 큐레이션도 안 된 기존 항목만 정리
      const keepIds = [...protectedIds, ...fresh.map((s: any) => s.youtubeId)];
      const { error: delErr } = await supabase
        .from("shorts")
        .delete()
        .eq("destination_id", dest.id)
        .not("youtube_id", "in", `(${keepIds.join(",")})`);
      if (delErr) throw new Error(`delete failed: ${delErr.message}`);

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

      results[dest.name] = fresh.length + protectedIds.length;
    } catch (e) {
      results[dest.name] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  const curatedStats = await refreshCuratedStats([...curatedIds]);

  return new Response(JSON.stringify({ ok: true, results, curatedStats }), {
    headers: { "Content-Type": "application/json" },
  });
});
