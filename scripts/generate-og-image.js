/* OG(오픈그래프) 공유 이미지 생성 — 스레드/카카오톡 등에 링크 공유 시 뜨는 썸네일.
   @napi-rs/canvas로 직접 그려서 assets/og-image.png로 저장한다. */
const path = require('path');
const fs = require('fs');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

const FONT_PATH = path.join(__dirname, 'vendor-fonts', 'cafe24.ttf');
GlobalFonts.registerFromPath(FONT_PATH, 'Cafe24 Ssurround');

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// 배경 그라데이션 (바이올렛 → 코랄 → 골드)
const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, '#7B2FF7');
grad.addColorStop(0.55, '#FF5F6D');
grad.addColorStop(1, '#FFC371');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// 스티커 배지 (여행 이모지)
function sticker(cx, cy, r, rot, emoji){
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot * Math.PI / 180);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,.25)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.font = `${r * 1.15}px "Segoe UI Emoji"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, r * 0.08);
  ctx.restore();
}
sticker(150, 130, 62, -12, '🧳');
sticker(1060, 155, 62, 10, '🗼');
sticker(190, 500, 62, 8, '🏖️');
sticker(1030, 500, 62, -9, '✈️');

// 브랜드 타이틀
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = '#fff';
ctx.shadowColor = 'rgba(0,0,0,.18)';
ctx.shadowBlur = 24;
ctx.shadowOffsetY = 6;
ctx.font = '110px "Cafe24 Ssurround"';
ctx.fillText('쇼츠박스', W / 2, H / 2 - 30);
ctx.shadowColor = 'transparent';

// 태그라인 (필 배경)
ctx.font = 'bold 32px "Malgun Gothic", sans-serif';
const tagline = '여행지별 꿀템 쇼츠 모음';
const metrics = ctx.measureText(tagline);
const padX = 34, padY = 16;
const pillW = metrics.width + padX * 2;
const pillH = 32 + padY * 2;
const pillX = W / 2 - pillW / 2;
const pillY = H / 2 + 40 - pillH / 2;
ctx.beginPath();
ctx.roundRect ? ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2) : ctx.rect(pillX, pillY, pillW, pillH);
ctx.fillStyle = 'rgba(255,255,255,.2)';
ctx.fill();
ctx.fillStyle = '#fff';
ctx.fillText(tagline, W / 2, pillY + pillH / 2 + 2);

const outPath = path.join(__dirname, '..', 'assets', 'og-image.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('생성 완료:', outPath);
