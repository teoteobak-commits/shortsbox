/* 인스타그램/스레드용 카드뉴스 5장 생성. 1080x1350(4:5, 인스타 캐러셀 권장 비율).
   기존 og-image/profile-icon과 같은 브랜드 시스템(바이올렛→코랄→골드 그라데이션,
   Cafe24 Ssurround 헤드라인 + Pretendard 본문)을 그대로 사용해 통일감을 준다. */
const path = require('path');
const fs = require('fs');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

GlobalFonts.registerFromPath(path.join(__dirname, 'vendor-fonts', 'cafe24.ttf'), 'Cafe24 Ssurround');
GlobalFonts.registerFromPath(path.join(__dirname, 'vendor-fonts', 'pretendard-bold.otf'), 'Pretendard Bold');
GlobalFonts.registerFromPath(path.join(__dirname, 'vendor-fonts', 'pretendard-semibold.otf'), 'Pretendard SemiBold');

const W = 1080, H = 1350;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'card-news');
fs.mkdirSync(OUT_DIR, { recursive: true });

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

/* 줄바꿈 문자(\n) 기준으로 나눠서 굵은 헤드라인을 여러 줄로 중앙 정렬 렌더링 */
function drawHeadline(ctx, cx, startY, lines, fontSize = 76, lineHeight = 1.25){
  ctx.font = `${fontSize}px "Cafe24 Ssurround"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,.15)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, startY + i * fontSize * lineHeight);
  });
  ctx.shadowColor = 'transparent';
  return startY + (lines.length - 1) * fontSize * lineHeight;
}

function drawSub(ctx, cx, startY, text, fontSize = 34, lineHeight = 1.4){
  const lines = Array.isArray(text) ? text : [text];
  ctx.font = `${fontSize}px "Pretendard SemiBold"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, startY + i * fontSize * lineHeight);
  });
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

const CX = W / 2;
const TOTAL = 5;

/* 1장 — 후킹 */
{
  const { canvas, ctx } = newCanvas();
  drawPill(ctx, CX, 140, '쇼츠박스');
  drawSticker(ctx, CX, 560, 150, -8, '🧳');
  const headlineEnd = drawHeadline(ctx, CX, 830, ['여행 꿀템 쇼츠,', '또 놓치셨나요?'], 84);
  drawSub(ctx, CX, headlineEnd + 80, '유튜브에서 본 그 아이템,\n다시 찾을 수 있어요'.split('\n'), 32);
  drawPageIndicator(ctx, 1, TOTAL);
  save(canvas, 'card-1.png');
}

/* 2장 — 공감 포인트 */
{
  const { canvas, ctx } = newCanvas();
  drawPill(ctx, CX, 140, '이런 적 있으시죠');
  drawSticker(ctx, CX, 560, 150, 6, '😩');
  const headlineEnd = drawHeadline(ctx, CX, 830, ['유튜브에서 본 꿀템,', '나중엔 못 찾겠더라고요'], 72);
  drawSub(ctx, CX, headlineEnd + 75, '분명 봤는데... 그 영상이 어디 갔지?', 32);
  drawPageIndicator(ctx, 2, TOTAL);
  save(canvas, 'card-2.png');
}

/* 3장 — 솔루션 소개 */
{
  const { canvas, ctx } = newCanvas();
  drawPill(ctx, CX, 140, '그래서 만들었어요');
  drawSticker(ctx, CX, 560, 150, -10, '📦');
  const headlineEnd = drawHeadline(ctx, CX, 830, ['여행지별', '꿀템 쇼츠 모음'], 84);
  drawSub(ctx, CX, headlineEnd + 80, '제주도·오사카·도쿄·파리 등\n10개 여행지'.split('\n'), 32);
  drawPageIndicator(ctx, 3, TOTAL);
  save(canvas, 'card-3.png');
}

/* 4장 — 핵심 기능 */
{
  const { canvas, ctx } = newCanvas();
  drawPill(ctx, CX, 140, '보는 걸로 끝이 아니에요');
  drawSticker(ctx, CX, 560, 150, 8, '🛍️');
  const headlineEnd = drawHeadline(ctx, CX, 830, ['어디서 파는지도', '같이 알려드려요'], 72);
  drawSub(ctx, CX, headlineEnd + 75, ['+ 여행지별 최적 시기·예산·짐싸기', '체크리스트까지 한 번에'], 30);
  drawPageIndicator(ctx, 4, TOTAL);
  save(canvas, 'card-4.png');
}

/* 5장 — CTA */
{
  const { canvas, ctx } = newCanvas();
  drawPill(ctx, CX, 140, '회원가입 없이 바로');
  drawSticker(ctx, CX, 540, 150, -6, '✈️');
  const headlineEnd = drawHeadline(ctx, CX, 800, ['지금 바로', '둘러보세요'], 84);
  ctx.font = '56px "Cafe24 Ssurround"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  const pillY = headlineEnd + 75;
  const text = 'shortsbox.kr';
  const textW = ctx.measureText(text).width;
  const padX = 48, pillH = 56 + 48;
  const pillW = textW + padX * 2;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(CX - pillW / 2, pillY, pillW, pillH, pillH / 2) : ctx.rect(CX - pillW / 2, pillY, pillW, pillH);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.fillStyle = '#7B2FF7';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, CX, pillY + pillH / 2 + 4);
  drawPageIndicator(ctx, 5, TOTAL);
  save(canvas, 'card-5.png');
}
