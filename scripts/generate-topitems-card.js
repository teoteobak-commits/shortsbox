/* 목적지별 "꿀템 TOP3" 카드뉴스 생성 — 스레드/인스타그램 매일 포스팅용.
   사용법: node scripts/generate-topitems-card.js <destination-slug>
   예: node scripts/generate-topitems-card.js tokyo

   기존 generate-card-news.js와 같은 브랜드 비주얼(그라데이션/스티커/폰트)을 쓰되,
   내용은 실제 큐레이션된 제품 데이터에서 조회수 상위 영상 기준으로 자동으로 뽑아온다.
   목적지 슬러그만 바꿔서 매일 다른 카드를 만들 수 있게 만든 재사용 스크립트. */
const path = require('path');
const fs = require('fs');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { DESTINATION_SLUGS } = require('../js/slugs.js');

GlobalFonts.registerFromPath(path.join(__dirname, 'vendor-fonts', 'cafe24.ttf'), 'Cafe24 Ssurround');
GlobalFonts.registerFromPath(path.join(__dirname, 'vendor-fonts', 'pretendard-bold.otf'), 'Pretendard Bold');
GlobalFonts.registerFromPath(path.join(__dirname, 'vendor-fonts', 'pretendard-semibold.otf'), 'Pretendard SemiBold');

const SUPABASE_URL = 'https://iftolinvhwxdcclrtavw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdG9saW52aHd4ZGNjbHJ0YXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTY3NzQsImV4cCI6MjEwMDAzMjc3NH0.HMZ4-yf6SPty4wdQKJon8nRi9GfWpgFIeMx2PXF5RhU';

const W = 1080, H = 1350;
const CX = W / 2;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'card-news');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function fetchTable(table, query){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if(!res.ok) throw new Error(`${table} fetch 실패: ${res.status} ${await res.text()}`);
  return res.json();
}

function drawBg(ctx){
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#7B2FF7');
  grad.addColorStop(0.55, '#FF5F6D');
  grad.addColorStop(1, '#FFC371');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawSticker(ctx, cx, cy, r, rot, emoji){
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot * Math.PI / 180);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,.2)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.font = `${r * 1.15}px "Segoe UI Emoji"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, r * 0.08);
  ctx.restore();
}

function drawPill(ctx, cx, topY, text, fontSize = 30){
  ctx.font = `${fontSize}px "Pretendard Bold"`;
  const textW = ctx.measureText(text).width;
  const padX = 34, h = fontSize + 34;
  const w = textW + padX * 2;
  const x = cx - w / 2;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, topY, w, h, h / 2) : ctx.rect(x, topY, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, topY + h / 2 + 2);
  return topY + h;
}

function drawHeadline(ctx, cx, startY, lines, fontSize = 76, lineHeight = 1.25){
  ctx.font = `${fontSize}px "Cafe24 Ssurround"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,.15)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * fontSize * lineHeight));
  ctx.shadowColor = 'transparent';
  return startY + (lines.length - 1) * fontSize * lineHeight;
}

function drawSub(ctx, cx, startY, text, fontSize = 34, lineHeight = 1.4){
  const lines = Array.isArray(text) ? text : [text];
  ctx.font = `${fontSize}px "Pretendard SemiBold"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * fontSize * lineHeight));
}

function drawPageIndicator(ctx, page, total){
  ctx.font = '28px "Pretendard SemiBold"';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillText(`${page}/${total}`, W - 56, H - 56);
}

function newCanvas(){
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBg(ctx);
  return { canvas, ctx };
}

function save(canvas, name){
  fs.writeFileSync(path.join(OUT_DIR, name), canvas.toBuffer('image/png'));
  console.log('생성 완료:', name);
}

/* 랭크 숫자를 큰 원형 배지로(스티커 대신 순위 강조용) */
function drawRankBadge(ctx, cx, cy, r, rank){
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,.2)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#7B2FF7';
  ctx.font = `700 ${r * 1.1}px "Cafe24 Ssurround"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(rank), cx, cy + r * 0.08);
}

async function main(){
  const slug = process.argv[2];
  if(!slug){
    console.error('사용법: node scripts/generate-topitems-card.js <destination-slug>');
    console.error('가능한 슬러그:', Object.values(DESTINATION_SLUGS).join(', '));
    process.exit(1);
  }
  const destId = Object.entries(DESTINATION_SLUGS).find(([, s]) => s === slug)?.[0];
  if(!destId){
    console.error(`알 수 없는 슬러그: ${slug}`);
    process.exit(1);
  }

  const [destinations, shorts, products] = await Promise.all([
    fetchTable('destinations', `select=*&id=eq.${destId}`),
    fetchTable('shorts', `select=*&destination_id=eq.${destId}&order=views.desc`),
    fetchTable('products', 'select=youtube_id,name'),
  ]);
  const dest = destinations[0];
  if(!dest) throw new Error('여행지를 찾을 수 없음');

  const productsByVideo = {};
  products.forEach(p => (productsByVideo[p.youtube_id] ||= []).push(p.name));

  // 제품 있는 영상 중 조회수 1위부터 순서대로, 영상당 아이템 1개씩 뽑아서 TOP3 구성
  const picks = [];
  for(const s of shorts){
    const names = productsByVideo[s.youtube_id];
    if(names && names.length){
      picks.push({ name: names[0], views: s.views });
      if(picks.length >= 3) break;
    }
  }
  if(picks.length < 3){
    console.error(`${dest.name}에 큐레이션된 제품이 3개 미만이라 카드를 만들 수 없어요 (${picks.length}개 있음).`);
    process.exit(1);
  }

  const TOTAL = 5;
  const fmtViews = n => n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '만' : String(n);

  // 1장 — 후킹
  {
    const { canvas, ctx } = newCanvas();
    drawPill(ctx, CX, 140, `${dest.emoji} ${dest.name} 꿀템`);
    drawSticker(ctx, CX, 560, 150, -8, dest.emoji);
    const headlineEnd = drawHeadline(ctx, CX, 830, [`${dest.name} 갈 때`, '꼭 챙길 꿀템 TOP3'], 76);
    drawSub(ctx, CX, headlineEnd + 80, `조회수 ${fmtViews(picks[0].views)} 쇼츠에\n나온 아이템 모음`.split('\n'), 32);
    drawPageIndicator(ctx, 1, TOTAL);
    save(canvas, `topitems-${slug}-1.png`);
  }

  // 2~4장 — 아이템별. 단어(공백) 단위로만 줄바꿈해서 글자가 잘리지 않게 한다
  function wrapByWords(ctx, text, fontSize, maxWidth){
    ctx.font = `${fontSize}px "Cafe24 Ssurround"`;
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for(const word of words){
      const candidate = line ? `${line} ${word}` : word;
      if(ctx.measureText(candidate).width > maxWidth && line){
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if(line) lines.push(line);
    return lines;
  }

  picks.forEach((pick, i) => {
    const { canvas, ctx } = newCanvas();
    drawPill(ctx, CX, 140, `조회수 ${fmtViews(pick.views)} 쇼츠`);
    drawRankBadge(ctx, CX, 560, 150, i + 1);
    let fontSize = 68;
    let nameLines = wrapByWords(ctx, pick.name, fontSize, 900);
    if(nameLines.length > 2){
      fontSize = 54;
      nameLines = wrapByWords(ctx, pick.name, fontSize, 940);
    }
    const headlineEnd = drawHeadline(ctx, CX, 830, nameLines, fontSize);
    drawSub(ctx, CX, headlineEnd + 80, '구매처는 쇼츠박스에서\n바로 확인 가능해요'.split('\n'), 32);
    drawPageIndicator(ctx, i + 2, TOTAL);
    save(canvas, `topitems-${slug}-${i + 2}.png`);
  });

  // 5장 — CTA
  {
    const { canvas, ctx } = newCanvas();
    drawPill(ctx, CX, 140, '회원가입 없이 바로');
    drawSticker(ctx, CX, 540, 150, -6, '✈️');
    const headlineEnd = drawHeadline(ctx, CX, 800, [`${dest.name} 꿀템`, '더 보러가기'], 76);
    ctx.font = '52px "Cafe24 Ssurround"';
    ctx.textAlign = 'center';
    const pillY = headlineEnd + 75;
    const text = 'shortsbox.kr';
    const textW = ctx.measureText(text).width;
    const padX = 48, pillH = 52 + 48;
    const pillW = textW + padX * 2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(CX - pillW / 2, pillY, pillW, pillH, pillH / 2) : ctx.rect(CX - pillW / 2, pillY, pillW, pillH);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = '#7B2FF7';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CX, pillY + pillH / 2 + 4);
    drawPageIndicator(ctx, 5, TOTAL);
    save(canvas, `topitems-${slug}-5.png`);
  }

  console.log(`\n${dest.name} 카드 5장 완성! (assets/card-news/topitems-${slug}-1~5.png)`);
}

main().catch(err => { console.error(err); process.exit(1); });
