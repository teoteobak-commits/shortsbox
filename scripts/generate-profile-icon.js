/* 프로필 사진(스레드/인스타 등)용 정사각형 브랜드 아이콘 생성.
   원형으로 크롭돼도 안전하도록 중앙에 크게 배치. */
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('@napi-rs/canvas');

const SIZE = 512;
const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext('2d');

// 배경 그라데이션 (바이올렛 → 코랄 → 골드)
const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
grad.addColorStop(0, '#7B2FF7');
grad.addColorStop(0.55, '#FF5F6D');
grad.addColorStop(1, '#FFC371');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, SIZE, SIZE);

// 중앙 흰 원 (스티커 배지 느낌) + 여행가방 이모지
const r = SIZE * 0.34;
ctx.beginPath();
ctx.arc(SIZE / 2, SIZE / 2, r, 0, Math.PI * 2);
ctx.fillStyle = '#fff';
ctx.shadowColor = 'rgba(0,0,0,.2)';
ctx.shadowBlur = 24;
ctx.shadowOffsetY = 8;
ctx.fill();
ctx.shadowColor = 'transparent';

ctx.font = `${r * 1.25}px "Segoe UI Emoji"`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('🧳', SIZE / 2, SIZE / 2 + r * 0.08);

const outPath = path.join(__dirname, '..', 'assets', 'profile-icon.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('생성 완료:', outPath);
