/* 스레드·인스타용 매일 카드 1장 생성 (1080×1350).
   디자인: 검정 배경 + 라임(#D9F24E) 포인트 + Paperlogy 헤드라인 + Anton 숫자.
   왼쪽에 그날 쇼츠 썸네일을 블러로 덮고 "?"를 얹는 티저 구조다 —
   무엇이 가려졌는지는 사이트에서 확인하게 만드는 게 이 카드의 목적이다.

   사용법:
     node scripts/generate-daily-card.js <slug> \
       --badge "손에 든 게 뭐길래" \
       --headline "돈키호테 가서 이걸|안 사면 후회한다는데" \
       --sub "파스, 소화제, 비졸림 감기약.|영상이 꼽은 건 이 세 개예요." \
       --foot "세 가지 다 정리해뒀어요"

   **목적지 이름은 헤드라인에 쓰지 않는다** — 스크립트가 라임색 첫 줄로 자동으로 붙인다.
   헤드라인·보조문구의 줄바꿈은 "|" 로 직접 넣는다. 자동 줄바꿈을 쓰지 않는 이유는
   어절 단위로 기계가 끊으면 "약부터 / 담으라는 이유" 처럼 줄 길이가 들쭉날쭉해지기 때문이다.
   폭을 넘기면 조용히 잘리는 대신 에러로 멈춘다(무인 실행이라 사람이 못 본다).

   영상·조회수·아이템 개수는 이 스크립트가 직접 찾는다. 캡션에 쓸 값은 실행 결과의
   JSON 으로 나오니, 카드에 나온 영상과 캡션 링크가 어긋나지 않는다. */
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { DESTINATION_SLUGS } = require('../js/slugs.js');

const ROOT = path.join(__dirname, '..');
const FONTS = path.join(__dirname, 'vendor-fonts');
GlobalFonts.registerFromPath(path.join(FONTS, 'paperlogy-black.woff2'), 'Paperlogy Black');
GlobalFonts.registerFromPath(path.join(FONTS, 'paperlogy-extrabold.woff2'), 'Paperlogy XBold');
GlobalFonts.registerFromPath(path.join(FONTS, 'anton.ttf'), 'Anton');
GlobalFonts.registerFromPath(path.join(FONTS, 'pretendard-bold.otf'), 'Pretendard Bold');
GlobalFonts.registerFromPath(path.join(FONTS, 'pretendard-semibold.otf'), 'Pretendard SemiBold');

const SUPABASE_URL = 'https://iftolinvhwxdcclrtavw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdG9saW52aHd4ZGNjbHJ0YXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTY3NzQsImV4cCI6MjEwMDAzMjc3NH0.HMZ4-yf6SPty4wdQKJon8nRi9GfWpgFIeMx2PXF5RhU';

const W = 1080, H = 1350, PAD = 56;
const LIME = '#D9F24E', WHITE = '#fff', G1 = '#9A9A9A', G2 = '#8A8A8A', LINE = '#2A2A2A';
const OUT_DIR = path.join(ROOT, 'assets', 'card-news');

/* ── 그리기 유틸 ─────────────────────────────────────────────── */
function setFont(ctx, { size, family, lsEm = 0 }) {
  ctx.font = `${size}px "${family}"`;
  ctx.letterSpacing = lsEm ? `${(size * lsEm).toFixed(2)}px` : '0px';
}
function text(ctx, str, x, y, opt) {
  setFont(ctx, opt);
  ctx.fillStyle = opt.color;
  ctx.textAlign = opt.align || 'left';
  ctx.textBaseline = opt.baseline || 'alphabetic';
  ctx.fillText(str, x, y);
}
function widthOf(ctx, str, opt) { setFont(ctx, opt); return ctx.measureText(str).width; }
function pill(ctx, x, y, label, o) {
  const h = o.size * 1.2 + o.padY * 2;
  const w = widthOf(ctx, label, o) + o.padX * 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fillStyle = o.bg;
  ctx.fill();
  text(ctx, label, x + o.padX, y + h / 2, { ...o, color: o.fg, baseline: 'middle' });
  return { w, h };
}
function circle(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}
function drawCover(ctx, img, bx, by, bw, bh, bleed) {
  const x = bx - bleed, y = by - bleed, w = bw + bleed * 2, h = bh + bleed * 2;
  const s = Math.max(w / img.width, h / img.height);
  ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
}

/* ── 데이터 수집 ─────────────────────────────────────────────── */
async function fetchTable(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`${table} ${res.status}`);
  return res.json();
}

/* 클라우드 루틴 환경에서는 Supabase 로 나가는 요청이 403 으로 막힌다.
   그때는 이미 만들어져 있는 정적 페이지에서 같은 값을 읽는다 —
   travel/{slug}/index.html 의 쇼츠 순서가 "제품 있는 영상 우선 → 조회수" 로
   이미 정렬돼 있어서, 맨 위 카드가 우리가 쓰려는 그 영상이다. */
function readFromStatic(slug) {
  const file = path.join(ROOT, 'travel', slug, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const card = html.match(/<a href="\/watch\/([^/"]+)\/" class="shorts-card"[\s\S]*?shorts-card-meta">([^<]*)<\/div>/);
  if (!card) throw new Error(`${slug}: 정적 페이지에서 쇼츠를 못 찾았다`);
  const youtubeId = card[1];
  const meta = card[2];
  const viewText = (meta.match(/조회수\s*([\d.,]+)(만?)/) || [])[0] || '';
  const num = parseFloat((viewText.match(/([\d.,]+)/) || [0, '0'])[1].replace(/,/g, ''));
  const views = /만/.test(viewText) ? Math.round(num * 10000) : num;

  let productCount = 0;
  try {
    const watchHtml = fs.readFileSync(path.join(ROOT, 'watch', youtubeId, 'index.html'), 'utf8');
    productCount = (watchHtml.match(/class="product-name"/g) || []).length;
  } catch (e) { /* 영상 페이지가 아직 없으면 0 */ }

  return { youtubeId, views, productCount, source: 'static' };
}

async function readFromSupabase(destId) {
  const [shorts, products] = await Promise.all([
    fetchTable('shorts', `select=youtube_id,title,channel_name,views&destination_id=eq.${destId}&order=views.desc`),
    fetchTable('products', 'select=youtube_id'),
  ]);
  if (!shorts.length) throw new Error('쇼츠가 없다');
  const withProducts = new Set(products.map(p => p.youtube_id));
  /* 사이트와 같은 정렬을 쓴다 — 제품이 달린 영상을 먼저, 그다음 조회수. */
  shorts.sort((a, b) => {
    const d = (withProducts.has(b.youtube_id) ? 1 : 0) - (withProducts.has(a.youtube_id) ? 1 : 0);
    return d !== 0 ? d : b.views - a.views;
  });
  const top = shorts[0];
  return {
    youtubeId: top.youtube_id,
    views: top.views,
    title: top.title,
    channel: top.channel_name,
    productCount: products.filter(p => p.youtube_id === top.youtube_id).length,
    source: 'supabase',
  };
}

/* 쇼츠는 세로 원본(oardefault)이 따로 있다. maxresdefault 는 가로 프레임 안에
   세로 영상을 넣고 좌우를 흐린 띠로 채운 것이라, 세로 박스에 맞추면 그 띠가 같이 들어온다. */
async function loadThumb(youtubeId) {
  for (const kind of ['oardefault', 'maxresdefault', 'hqdefault']) {
    try {
      const img = await loadImage(`https://i.ytimg.com/vi/${youtubeId}/${kind}.jpg`);
      if (img.width >= 320) return { img, kind };
    } catch (e) { /* 다음 후보 */ }
  }
  throw new Error(`${youtubeId}: 썸네일을 못 받았다`);
}

/* ── 카드 ───────────────────────────────────────────────────── */
function renderCard({ img, destName, viewsMan, copy }) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const overflow = [];
  const fit = (label, lines, opt, maxW) => {
    for (const l of lines) {
      const w = widthOf(ctx, l, opt);
      if (w > maxW) overflow.push(`${label} "${l}" ${Math.round(w)}px > ${Math.round(maxW)}px`);
    }
  };

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  /* 헤더는 브랜드만 둔다.
     원래 오른쪽에 "08.10 오사카"를 넣었는데, 목적지를 헤드라인 첫 줄로 올렸으므로
     같은 정보를 두 번 보여줄 이유가 없다. 날짜는 피드에서 쓸모가 없어 뺐다. */
  const headerBase = PAD + 32;
  text(ctx, '쇼츠박스', PAD, headerBase, { size: 32, family: 'Paperlogy XBold', color: WHITE, lsEm: -0.02 });

  const footerLineY = (H - PAD) - 27 * 1.2 - 28;
  const bodyTop = headerBase + 12 + 44;
  const bodyBottom = footerLineY - 36;

  // 왼쪽 — 블러 썸네일 + "?"
  const tw = 394, tx = PAD, ty = bodyTop, th = bodyBottom - bodyTop;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, 24);
  ctx.clip();
  ctx.fillStyle = '#111';
  ctx.fillRect(tx, ty, tw, th);
  ctx.filter = 'blur(14px)';
  drawCover(ctx, img, tx, ty, tw, th, 40);
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(tx, ty, tw, th);
  circle(ctx, tx + tw / 2, ty + th / 2, 75, LIME);
  text(ctx, '?', tx + tw / 2, ty + th / 2 + 4, {
    size: 76, family: 'Paperlogy Black', color: '#000', align: 'center', baseline: 'middle',
  });
  ctx.restore();

  // 오른쪽 — 카피
  const colX = tx + tw + 34, colW = W - PAD - colX;
  let y = bodyTop + 4;

  const badge = pill(ctx, colX, y, copy.badge, {
    size: 24, family: 'Pretendard Bold', bg: LIME, fg: '#000', padX: 18, padY: 10,
  });
  fit('배지', [copy.badge], { size: 24, family: 'Pretendard Bold' }, colW - 36);
  y += badge.h + 22;

  /* 목적지를 헤드라인 첫 줄로 올린다(라임). 헤더 오른쪽에 있던 "08.10 오사카" 라벨을
     없앤 자리를 이게 대신한다. 카드에서 여행지를 알 수 있는 곳이 이제 여기 하나뿐이라,
     색을 달리해서 카피 문장과 섞여 읽히지 않게 한다. */
  const hl = { size: 76, family: 'Paperlogy Black', color: WHITE, lsEm: -0.045 };
  const headLines = [destName, ...copy.headline];
  fit('헤드라인', headLines, hl, colW);
  y += hl.size * 0.82;
  headLines.forEach((l, i) => text(ctx, l, colX, y + i * hl.size * 1.1, { ...hl, color: i === 0 ? LIME : WHITE }));
  y += (headLines.length - 1) * hl.size * 1.1 + hl.size * 0.3 + 22;

  const sub = { size: 31, family: 'Pretendard SemiBold', color: G1 };
  fit('보조문구', copy.sub, sub, colW);
  y += sub.size * 0.8;
  copy.sub.forEach((l, i) => text(ctx, l, colX, y + i * sub.size * 1.6, sub));

  // 조회수 — 컬럼 바닥에 붙인다
  const viewsBase = bodyBottom - 4;
  text(ctx, String(viewsMan), colX, viewsBase, { size: 96, family: 'Anton', color: WHITE });
  const numW = widthOf(ctx, String(viewsMan), { size: 96, family: 'Anton' });
  text(ctx, '만이 봤어요', colX + numW + 12, viewsBase - 8, { size: 34, family: 'Paperlogy XBold', color: G2 });

  /* 푸터 — 이미지는 피드에서 클릭이 안 되므로 버튼처럼 보이는 요소를 쓰지 않는다.
     왼쪽은 사이트에 뭐가 있는지, 오른쪽은 주소. */
  ctx.fillStyle = LINE;
  ctx.fillRect(PAD, footerLineY, W - PAD * 2, 2);
  const fBase = footerLineY + 28 + 27 * 0.8;
  const addr = { size: 26, family: 'Paperlogy XBold', color: LIME };
  const footOpt = { size: 27, family: 'Pretendard SemiBold', color: G2 };
  fit('푸터', [copy.foot], footOpt, W - PAD * 2 - widthOf(ctx, 'shortsbox.kr', addr) - 24);
  text(ctx, copy.foot, PAD, fBase, footOpt);
  text(ctx, 'shortsbox.kr', W - PAD, fBase, { ...addr, align: 'right' });

  return { canvas, overflow };
}

/* ── 실행 ───────────────────────────────────────────────────── */
function parseArgs(argv) {
  const slug = argv[0];
  const opts = {};
  for (let i = 1; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--')) throw new Error(`알 수 없는 인자: ${argv[i]}`);
    opts[argv[i].slice(2)] = argv[i + 1];
  }
  return { slug, opts };
}

function usage() {
  console.error(`사용법: node scripts/generate-daily-card.js <slug> --badge "..." --headline "1줄|2줄|3줄" --sub "1줄|2줄" --foot "..."`);
  console.error(`슬러그: ${Object.values(DESTINATION_SLUGS).join(', ')}`);
}

async function main() {
  const { slug, opts } = parseArgs(process.argv.slice(2));
  if (!slug || !opts.badge || !opts.headline || !opts.sub || !opts.foot) {
    usage();
    process.exit(1);
  }
  const destId = Object.entries(DESTINATION_SLUGS).find(([, s]) => s === slug)?.[0];
  if (!destId) { console.error(`알 수 없는 슬러그: ${slug}`); usage(); process.exit(1); }

  const copy = {
    badge: opts.badge.trim(),
    headline: opts.headline.split('|').map(s => s.trim()).filter(Boolean),
    sub: opts.sub.split('|').map(s => s.trim()).filter(Boolean),
    foot: opts.foot.trim(),
  };
  /* 목적지 한 줄이 앞에 자동으로 붙으므로 카피는 3줄까지다(총 4줄). */
  if (copy.headline.length > 3) throw new Error('헤드라인 카피는 최대 3줄 — 목적지 줄이 자동으로 앞에 붙는다');
  if (copy.sub.length > 3) throw new Error('보조문구는 최대 3줄');

  let dest, data;
  try {
    dest = (await fetchTable('destinations', `select=id,name&id=eq.${destId}`))[0];
    data = await readFromSupabase(destId);
  } catch (err) {
    console.error(`Supabase 실패(${err.message}) → 정적 페이지에서 읽는다`);
    dest = { id: Number(destId), name: null };
    data = readFromStatic(slug);
  }
  /* 목적지 이름은 정적 페이지의 h1 에서 가져온다(Supabase 가 막힌 경우). */
  if (!dest.name) {
    const html = fs.readFileSync(path.join(ROOT, 'travel', slug, 'index.html'), 'utf8');
    dest.name = (html.match(/<h1>([^<]*?)\s*여행 꿀템<\/h1>/) || [, slug])[1];
  }

  const { img, kind } = await loadThumb(data.youtubeId);
  const now = new Date();
  const dateIso = now.toISOString().slice(0, 10);
  const { canvas, overflow } = renderCard({
    img,
    destName: dest.name,
    viewsMan: Math.floor(data.views / 10000),
    copy,
  });

  if (overflow.length) {
    console.error('⚠️ 카피가 자리를 넘친다 — 줄바꿈을 다시 잡을 것:');
    overflow.forEach(o => console.error('  -', o));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outName = `daily-${slug}-${dateIso}.png`;
  fs.writeFileSync(path.join(OUT_DIR, outName), canvas.toBuffer('image/png'));

  console.log(JSON.stringify({
    file: `assets/card-news/${outName}`,
    slug,
    destination: dest.name,
    youtube_id: data.youtubeId,
    views: data.views,
    views_man: Math.floor(data.views / 10000),
    product_count: data.productCount,
    title: data.title,
    channel: data.channel,
    thumb_source: kind,
    data_source: data.source,
  }, null, 2));
}

main().catch(err => { console.error(err.message || err); process.exit(1); });
