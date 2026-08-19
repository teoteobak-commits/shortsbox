/* 매일 카드뉴스 한 건을 처음부터 끝까지 만든다. GitHub Actions 가 이걸 부른다.

   왜 GitHub Actions 인가:
   원래 Claude 클라우드 루틴이 하던 일인데, 그 환경은 아웃바운드 정책과 권한 분류기 때문에
   i.ytimg.com / Telegram getUpdates / Threads 발행이 막히거나 흔적 없이 끝나는 일이
   반복됐다(2026-08-10~11에 6회 연속 실패). Actions 는 네트워크가 열려 있고 시크릿을
   쓸 수 있고 실행 로그가 남는다.

   하는 일
   1. 한국시간 날짜로 오늘의 여행지를 고른다(10곳 로테이션). 날짜 계산은
      scripts/kst-date.js 한 곳에서만 한다 — 왜 UTC 가 아닌지도 거기 적어뒀다.
   2. 그날 쓸 영상을 찾는다 — generate-daily-card.js --probe 를 그대로 쓴다.
      같은 조회 로직을 두 번 구현하면 서로 어긋난다.
   3. automation/card-copy.js 에서 그 영상의 손으로 쓴 카피를 꺼낸다.
      없으면 buildFallback() 이 VIDEO_NOTES 로 안전한 카피를 만든다.
   4. 카드 PNG 를 렌더한다. 카피가 자리를 넘치면(렌더러가 종료코드 1) 폴백 카피로
      한 번 더 시도한다 — 카드가 안 나오는 것보다 심심한 카드가 낫다.
   5. 채널별 캡션 6개를 만들어 automation/pending-post.json 에 적는다.
   6. 마지막 줄에 워크플로우가 쓸 요약 JSON 을 찍는다.

   설계 원칙: **이 스크립트는 카드를 못 만드는 상황에서만 실패한다.**
   카피가 없어도, 썸네일을 못 받아도, Supabase 가 막혀도 카드는 나온다. */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const { DESTINATION_SLUGS } = require('../js/slugs.js');
const { VIDEO_NOTES } = require('../js/video-notes.js');
const { CARD_COPY, buildFallback, buildCaptions } = require('../automation/card-copy.js');
const { kstDate } = require('./kst-date.js');

/* 로테이션 10곳. automation/CARDNEWS.md 1장과 같은 목록이어야 한다.

   **여행지를 20곳으로 늘리지 말 것.** 한 번 그렇게 고쳤다가 되돌렸다.
   나중에 추가한 10곳(후쿠오카·나트랑·타이베이·세부·홍콩·삿포로·오키나와·싱가포르·
   괌·상하이)은 큐레이션된 영상이 **하나도 없다**(2026-08-19 실측). 카드가 거기로 가면
   살 것이 없는 페이지로 사람을 보내고, 카피도 "N가지 정리해뒀어요"가 거짓이 된다.
   그 10곳을 넣으려면 먼저 제품 큐레이션이 붙어야 한다.

   중복은 여행지가 아니라 **영상**을 돌려서 푼다. 아래 10곳에 큐레이션 영상이 73개
   있으므로, 최근 사용 이력으로 겹치는 영상을 피하면 두 달 넘게 안 겹친다.
   예전에는 늘 그 여행지의 1위 영상만 써서 10일마다 카드도 캡션도 똑같았다
   (8/09 와 8/19 오사카가 실제로 그랬다). */
const ROTATION = ['jeju', 'osaka', 'tokyo', 'bangkok', 'danang', 'chiangmai', 'paris', 'switzerland', 'bali', 'hawaii'];

/* 최근에 쓴 영상 이력. 같은 여행지가 다시 와도 다른 영상이 뽑히게 한다.
   여행지 수보다 넉넉히 잡아야 한 바퀴 돌아왔을 때도 겹치지 않는다. */
const HISTORY_FILE = path.join(__dirname, '..', 'automation', 'card-history.json');
const HISTORY_KEEP = 60;

function readHistory(){
  try {
    const h = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    return Array.isArray(h) ? h : [];
  } catch (e) {
    return [];   // 파일이 없으면 빈 이력으로 시작한다 — 실패시키지 않는다
  }
}

function todaySlug(now) {
  /* 한국시간 연중 일수 % 10. 워크플로우가 23:04 UTC = 한국시간 08:04 에 돈다. */
  const { dateIso, dayOfYear } = kstDate(now);
  return { slug: ROTATION[dayOfYear % ROTATION.length], dayOfYear, dateIso };
}

function node(args) {
  return execFileSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

/* 이모지는 정적 페이지의 히어로에서 읽는다 — Supabase 가 막혀도 되게. */
function destEmoji(slug) {
  try {
    const html = fs.readFileSync(path.join(ROOT, 'travel', slug, 'index.html'), 'utf8');
    return (html.match(/<div class="detail-cover">([^<]*)<\/div>/) || [, ''])[1].trim();
  } catch (e) {
    return '';
  }
}

/* 같은 날 카드를 다시 만들 때 파일명을 바꾼다.

   **같은 URL 에 내용만 바꿔 올리면 Vercel CDN 이 한동안 옛 이미지를 준다.**
   스레드·인스타는 게시 시점에 이미지를 내려받으므로 구 카드가 그대로 박힌다.
   그래서 이미 그 날짜의 카드가 있는데 영상이 달라졌으면 -v2, -v3 로 붙인다.
   같은 영상을 다시 렌더하는 경우(재실행)는 덮어써도 내용이 같으니 그대로 둔다. */
function cardSuffix(slug, dateIso, youtubeId){
  const dir = path.join(ROOT, 'assets', 'card-news');
  const base = `daily-${slug}-${dateIso}`;
  if (!fs.existsSync(path.join(dir, `${base}.png`))) return '';
  try {
    const prev = JSON.parse(fs.readFileSync(path.join(ROOT, 'automation', 'pending-post.json'), 'utf8'));
    if (prev.date === dateIso && prev.youtube_id === youtubeId) return '';   // 같은 카드 재생성
  } catch (e) { /* 없으면 접미사를 붙이는 쪽이 안전하다 */ }
  let n = 2;
  while (fs.existsSync(path.join(dir, `${base}-v${n}.png`))) n++;
  return `-v${n}`;
}

function renderCard(slug, copy, exclude, suffix) {
  const args = [
    path.join('scripts', 'generate-daily-card.js'), slug,
    '--badge', copy.badge,
    '--headline', copy.headline.join('|'),
    '--sub', copy.sub.join('|'),
    '--foot', copy.foot,
    '--exclude', exclude,
    '--suffix', suffix,
  ];
  return JSON.parse(node(args));
}

function main() {
  const now = new Date();
  const { slug, dayOfYear, dateIso } = todaySlug(now);
  console.error(`오늘: ${dateIso} (한국시간 연중 ${dayOfYear}일) → ${slug}`);

  /* 1. 그날 쓸 영상 확인.
     최근에 쓴 영상은 빼고 고르게 한다 — 안 그러면 그 여행지의 1위 영상이 계속 뽑혀서
     로테이션이 한 바퀴 돌 때마다 같은 카드가 나온다. probe 와 실제 렌더에 같은
     exclude 를 넘겨야 둘이 다른 영상을 고르지 않는다. */
  const history = readHistory();
  const exclude = history.map(h => h.youtube_id).join(',');
  const probe = JSON.parse(node([path.join('scripts', 'generate-daily-card.js'), slug, '--probe', '--exclude', exclude]));
  console.error(`영상: ${probe.youtube_id} (조회수 ${probe.views_man}만, 아이템 ${probe.product_count}개, ${probe.data_source})`);
  if (history.some(h => h.youtube_id === probe.youtube_id)) {
    console.error(`⚠️ ${slug} 의 영상이 전부 최근에 쓰였다 — 1위 영상을 다시 쓴다`);
  }

  /* 2. 카피 선택 */
  const handWritten = CARD_COPY[probe.youtube_id];
  let copy = handWritten || buildFallback({
    destName: probe.destination,
    note: VIDEO_NOTES[probe.youtube_id],
    productCount: probe.product_count,
    youtubeId: probe.youtube_id,
  });
  if (!handWritten) {
    console.error(`⚠️ ${probe.youtube_id} 의 손으로 쓴 카피가 없다 — 폴백으로 만든다. automation/card-copy.js 에 추가할 것.`);
  }

  const suffix = cardSuffix(slug, dateIso, probe.youtube_id);
  if (suffix) console.error(`같은 날 다른 영상이라 파일명에 ${suffix} 를 붙인다(CDN 캐시)`);

  /* 3. 렌더. 카피가 자리를 넘치면 폴백으로 한 번 더. */
  let card;
  try {
    card = renderCard(slug, copy, exclude, suffix);
  } catch (err) {
    console.error(`카드 렌더 실패(${err.status ?? err.message}) → 폴백 카피로 재시도`);
    copy = buildFallback({
      destName: probe.destination,
      note: VIDEO_NOTES[probe.youtube_id],
      productCount: probe.product_count,
    });
    card = renderCard(slug, copy, exclude, suffix);   // 여기서도 실패하면 진짜 문제다 — 그대로 던진다
  }

  /* 4. 캡션 */
  const captions = buildCaptions({
    copy,
    slug,
    views: probe.views_man,
    youtubeId: probe.youtube_id,
  });

  /* 5. pending-post.json.
     image_url 은 www 를 붙인다 — non-www 는 308 이고, 스레드 페처가 리다이렉트를
     한 번 더 타게 만들 이유가 없다. */
  const emoji = destEmoji(slug);
  /* status 는 남겨둔다 — 사람이 올렸는지 표시해두면 나중에 확인할 수 있다.
     자동 게시를 걷어냈으므로 이 값을 읽고 동작하는 코드는 이제 없다. */
  const pending = {
    status: 'ready',
    date: dateIso,
    destination_slug: slug,
    destination_name: emoji ? `${emoji} ${probe.destination}` : probe.destination,
    youtube_id: probe.youtube_id,
    /* 카드에 실제로 찍히는 문장 그대로 적는다 — 렌더러가 목적지를 첫 줄로 얹으므로
       여기서도 붙여야 기록과 카드가 어긋나지 않는다(card-copy.js 의 headline 규칙 참고). */
    headline: `${probe.destination} ${copy.headline.join(' ')}`,
    subline: copy.sub.join(' '),
    image_path: card.file,
    image_url: `https://www.shortsbox.kr/${card.file}`,
    threads_text: captions.threads,
    captions,
    copy_source: handWritten ? 'card-copy.js' : 'fallback',
  };
  fs.writeFileSync(path.join(ROOT, 'automation', 'pending-post.json'), JSON.stringify(pending, null, 2) + '\n');

  /* 6. 이력 기록. 맨 앞이 최신이고 오래된 건 잘라낸다.
        이 파일이 커밋돼야 다음 실행이 오늘 쓴 영상을 피할 수 있다 —
        워크플로우의 git add 에 들어가 있는지 확인할 것. */
  const nextHistory = [{ date: dateIso, slug, youtube_id: probe.youtube_id }, ...history.filter(h => h.youtube_id !== probe.youtube_id)]
    .slice(0, HISTORY_KEEP);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(nextHistory, null, 2) + '\n');

  console.error(`카드: ${card.file} (썸네일 ${card.thumb_source})`);
  /* 워크플로우가 파싱하는 유일한 stdout. 위의 진행 로그는 전부 stderr 로 보낸다. */
  console.log(JSON.stringify({
    slug,
    date: dateIso,
    destination_name: pending.destination_name,
    youtube_id: probe.youtube_id,
    views_man: probe.views_man,
    product_count: probe.product_count,
    image_path: card.file,
    image_url: pending.image_url,
    thumb_source: card.thumb_source,
    copy_source: pending.copy_source,
  }));
}

main();
