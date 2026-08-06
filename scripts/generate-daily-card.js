/* 스레드 매일 포스팅용 — 카드 "1장"만 만드는 버전.
   그날 스레드 멘트를 요약하는 한 줄 카피를 헤드라인으로 박아서 만든다.
   사용법: node scripts/generate-daily-card.js <destination-slug> "헤드라인 한 줄" ["보조 문구"]
   예:    node scripts/generate-daily-card.js tokyo "그 동전 지갑, 진짜 있었다" "조회수 598만 쇼츠템"
   줄바꿈을 직접 넣고 싶으면 헤드라인에 \n 사용: "일본 가면\n동전 처치 곤란" */
const path = require('path');
const fs = require('fs');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { DESTINATION_SLUGS } = require('../js/slugs.js');

GlobalFonts.registerFromPath(path.join(__dirname, 'vendor-fonts', 'cafe24.ttf'), 'Cafe24 Ssurround');
GlobalFonts.registerFromPath(path.join(__dirname, 'vendor-fonts', 'pretendard-bold.otf'), 'Pretendard Bold');
GlobalFonts.registerFromPath(path.join(__dirname, 'vendor-fonts', 'pretendard-semibold.otf'), 'Pretendard SemiBold');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', 'Noto Color Emoji');

const SUPABASE_URL = 'https://iftolinvhwxdcclrtavw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdG9saW52aHd4ZGNjbHJ0YXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTY3NzQsImV4cCI6MjEwMDAzMjc3NH0.HMZ4-yf6SPty4wdQKJon8nRi9GfWpgFIeMx2PXF5RhU';

/* Supabase 조회 실패 시 로컬 폴백. 국기 등 복합 이모지는 렌더러에서 깨지므로 피한다. */
const FALLBACK_DESTINATIONS = {
  jeju: { name: '제주', emoji: '🍊' },
  osaka: { name: '오사카', emoji: '🏯' },
  tokyo: { name: '도쿄', emoji: '🗼' },
  bangkok: { name: '방콕', emoji: '🛺' },
  danang: { name: '다낭', emoji: '☕' },
  chiangmai: { name: '치앙마이', emoji: '🐘' },
  paris: { name: '파리', emoji: '🥐' },
  switzerland: { name: '스위스', emoji: '🧀' },
  bali: { name: '발리', emoji: '🌴' },
  hawaii: { name: '하와이', emoji: '🌺' },
};

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
  ctx.font = `${r * 1.15}px "Noto Color Emoji"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, r * 0.08);
  ctx.restore();
}

/* 이모지와 한글을 한 fillText 에 섞으면 이모지 폰트가 적용 안 되니 따로 그린다. */
function drawPill(ctx, cx, topY, emoji, label, fontSize = 30){
  const textFont = `${fontSize}px "Pretendard Bold"`;
  const emojiFont = `${fontSize}px "Noto Color Emoji"`;
  const gap = fontSize * 0.35;

  ctx.font = emojiFont;
  const emojiW = ctx.measureText(emoji).width;
  ctx.font = textFont;
  const labelW = ctx.measureText(label).width;

  const contentW = emojiW + gap + labelW;
  const padX = 34, h = fontSize + 34;
  const w = contentW + padX * 2;
  const x = cx - w / 2;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, topY, w, h, h / 2) : ctx.rect(x, topY, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.fill();

  const contentStartX = cx - contentW / 2;
  const midY = topY + h / 2 + 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = emojiFont;
  ctx.fillText(emoji, contentStartX, midY);
  ctx.fillStyle = '#fff';
  ctx.font = textFont;
  ctx.fillText(label, contentStartX + emojiW + gap, midY);
  return topY + h;
}

function wrapByWords(ctx, text, fontSize, maxWidth){
  ctx.font = `${fontSize}px "Cafe24 Ssurround"`;
  const paragraphs = text.split('\n');
  const lines = [];
  for(const para of paragraphs){
    const words = para.split(' ');
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
  }
  return lines;
}

function drawHeadline(ctx, cx, startY, lines, fontSize, lineHeight = 1.25){
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

/* 카드 하단에 항상 고정으로 박아두는 사이트 주소 배지 — 헤드라인/보조문구와 무관하게 항상 노출 */
function drawUrlBadge(ctx, cx, bottomY){
  const text = 'shortsbox.kr';
  ctx.font = '38px "Cafe24 Ssurround"';
  const textW = ctx.measureText(text).width;
  const padX = 40, h = 38 + 40;
  const w = textW + padX * 2;
  const y = bottomY - h;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(cx - w / 2, y, w, h, h / 2) : ctx.rect(cx - w / 2, y, w, h);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.fillStyle = '#7B2FF7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + h / 2 + 3);
}

async function main(){
  const [slug, headline, subline] = process.argv.slice(2);
  if(!slug || !headline){
    console.error('사용법: node scripts/generate-daily-card.js <destination-slug> "헤드라인 한 줄" ["보조 문구"]');
    console.error('가능한 슬러그:', Object.values(DESTINATION_SLUGS).join(', '));
    process.exit(1);
  }
  const destId = Object.entries(DESTINATION_SLUGS).find(([, s]) => s === slug)?.[0];
  if(!destId){
    console.error(`알 수 없는 슬러그: ${slug}`);
    process.exit(1);
  }
  let dest;
  try {
    const destinations = await fetchTable('destinations', `select=*&id=eq.${destId}`);
    dest = destinations[0];
    if(!dest) throw new Error('여행지를 찾을 수 없음');
  } catch(err) {
    console.error('Supabase 조회 실패, 로컬 폴백 사용:', err.message);
    dest = FALLBACK_DESTINATIONS[slug];
    if(!dest) throw new Error(`폴백에도 없는 슬러그: ${slug}`);
  }

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBg(ctx);

  drawPill(ctx, CX, 140, dest.emoji, dest.name);
  drawSticker(ctx, CX, 560, 150, -8, dest.emoji);

  let fontSize = 78;
  let lines = wrapByWords(ctx, headline, fontSize, 900);
  if(lines.length > 3){
    fontSize = 58;
    lines = wrapByWords(ctx, headline, fontSize, 940);
  }
  const startY = 830 - (lines.length - 1) * fontSize * 1.25 / 2;
  const headlineEnd = drawHeadline(ctx, CX, startY, lines, fontSize);
  if(subline) drawSub(ctx, CX, headlineEnd + 80, subline, 32);
  drawUrlBadge(ctx, CX, H - 90);

  const today = new Date().toISOString().slice(0, 10);
  const outName = `daily-${slug}-${today}.png`;
  fs.writeFileSync(path.join(OUT_DIR, outName), canvas.toBuffer('image/png'));
  console.log('생성 완료:', outName);
}

main().catch(err => { console.error(err); process.exit(1); });
