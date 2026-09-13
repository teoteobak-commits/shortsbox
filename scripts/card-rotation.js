/* 매일 카드가 "어느 날 어느 여행지의 어느 영상"을 쓸지 정하는 규칙 — 한 곳에만 둔다.

   이걸 부르는 곳이 셋이다.
   - scripts/build-daily-post.js   그날의 여행지를 정하고 이력을 쌓는다
   - scripts/generate-daily-card.js  그 여행지에서 영상을 고른다
   - scripts/curation-report.js    앞으로 2주 동안 뽑힐 영상을 미리 계산한다

   세 번째가 생기면서 모았다. 리포트가 규칙을 따로 흉내 내면, 나중에 카드 쪽 규칙이
   바뀌었을 때 리포트는 틀린 영상 목록을 자신 있게 내놓는다 — 그게 제일 나쁜 실패다.
   규칙을 바꾸려면 여기만 바꾸면 되고, 셋이 같이 따라간다. */

const { kstDate } = require('./kst-date.js');

/* 로테이션 10곳. automation/CARDNEWS.md 1장과 같은 목록이어야 한다.

   **여행지를 20곳으로 늘리지 말 것.** 한 번 그렇게 고쳤다가 되돌렸다.
   나중에 추가한 10곳(후쿠오카·나트랑·타이베이·세부·홍콩·삿포로·오키나와·싱가포르·
   괌·상하이)은 2026-08-19 실측 때 큐레이션된 영상이 **하나도 없었다**. 카드가 거기로
   가면 살 것이 없는 페이지로 사람을 보낸다. 그 10곳을 넣으려면 먼저 제품 큐레이션이
   충분히 붙어야 한다(9/13 기준 후쿠오카·괌·타이베이·삿포로에 몇 개 생겼다 — 아직 부족).

   중복은 여행지가 아니라 **영상**을 돌려서 푼다. 최근 사용 이력(HISTORY_KEEP)으로
   겹치는 영상을 피한다. 예전에는 늘 그 여행지의 1위 영상만 써서 10일마다 카드도
   캡션도 똑같았다(8/09 와 8/19 오사카가 실제로 그랬다). */
const ROTATION = ['jeju', 'osaka', 'tokyo', 'bangkok', 'danang', 'chiangmai', 'paris', 'switzerland', 'bali', 'hawaii'];

/* 최근에 쓴 영상 이력의 길이. 여행지 수보다 넉넉히 잡아야 한 바퀴 돌아왔을 때도 겹치지
   않는다. 대가: 여행지가 10일마다 돌아오므로 60장이면 여행지당 영상 6개가 필요하고,
   그만큼 손 카피(automation/card-copy.js)가 있어야 폴백이 안 나간다. */
const HISTORY_KEEP = 60;

/* 한국시간 연중 일수 % 10. 워크플로우가 23:04 UTC = 한국시간 08:04 에 돈다. */
function slugForDate(now = new Date()) {
  const { dateIso, dayOfYear } = kstDate(now);
  return { slug: ROTATION[dayOfYear % ROTATION.length], dayOfYear, dateIso };
}

/* 사이트와 같은 정렬 — 제품이 달린 영상을 먼저, 그다음 조회수. */
function orderCandidates(shorts, withProducts) {
  return [...shorts].sort((a, b) => {
    const d = (withProducts.has(b.youtube_id) ? 1 : 0) - (withProducts.has(a.youtube_id) ? 1 : 0);
    return d !== 0 ? d : b.views - a.views;
  });
}

/* 최근에 쓴 영상은 건너뛴다. 전부 최근에 썼으면 맨 위를 쓴다 —
   카드가 안 나오는 것보다 겹치는 게 낫다. */
function pickCandidate(ordered, exclude) {
  return ordered.find(s => !exclude.has(s.youtube_id)) || ordered[0];
}

/* 오늘 쓴 영상을 이력 맨 앞에 넣고 길이를 자른다. */
function pushHistory(history, entry) {
  return [entry, ...history.filter(h => h.youtube_id !== entry.youtube_id)].slice(0, HISTORY_KEEP);
}

/* 앞으로 days 일 동안 뽑힐 영상을 계산한다. 실제 카드와 같은 함수만 쓴다.
   orderedBySlug: { slug: orderCandidates(...) 결과 }
   from: 첫날(Date). 오늘 카드가 이미 나갔으면 내일부터 넘길 것. */
function simulate({ history, orderedBySlug, from, days }) {
  let h = history;
  const out = [];
  for (let i = 0; i < days; i++) {
    const { slug, dateIso } = slugForDate(new Date(from.getTime() + i * 86400000));
    const ordered = orderedBySlug[slug] || [];
    if (!ordered.length) { out.push({ date: dateIso, slug, video: null }); continue; }
    const video = pickCandidate(ordered, new Set(h.map(x => x.youtube_id)));
    out.push({ date: dateIso, slug, video });
    h = pushHistory(h, { date: dateIso, slug, youtube_id: video.youtube_id });
  }
  return out;
}

module.exports = { ROTATION, HISTORY_KEEP, slugForDate, orderCandidates, pickCandidate, pushHistory, simulate };
