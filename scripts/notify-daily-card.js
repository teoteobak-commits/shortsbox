/* 만들어둔 오늘 카드를 텔레그램으로 보낸다. GitHub Actions 의 매일 워크플로우가 부른다.

   두 가지를 보낸다.
   1. 카드 이미지 + [✔ 스레드에 게시] [✖ 오늘은 건너뛰기] 버튼
      → 받은 message_id 를 pending-post.json 의 telegram_anchor_message_id 에 적는다.
        이 값이 있어야 매시간 도는 게시 워크플로우가 "어느 카드에 대한 승인인지"를 판별한다.
   2. 채널별 캡션(인스타·X·카카오·디시 제목·디시 본문)을 각각 별도 메시지로
      → 폰에서 하나씩 복사할 수 있게. 한 덩이로 보내면 부분 복사가 안 된다.
        스레드용은 승인 시 워크플로우가 그대로 올리므로 보내지 않는다.

   실패해도 종료코드 0 으로 끝낸다. 카드는 이미 커밋됐고, 텔레그램이 안 갔다고
   워크플로우 전체를 실패로 표시하면 다음 단계(요약 출력)까지 날아간다.
   대신 무엇이 실패했는지 로그와 요약에 남긴다. */

const fs = require('fs');
const path = require('path');
const tg = require('./telegram.js');

const ROOT = path.join(__dirname, '..');
const PENDING = path.join(ROOT, 'automation', 'pending-post.json');

const BUTTONS = {
  inline_keyboard: [[
    { text: '✔ 스레드에 게시', callback_data: 'sb_approve' },
    { text: '✖ 오늘은 건너뛰기', callback_data: 'sb_reject' },
  ]],
};

async function main() {
  if (!tg.configured()) {
    console.error('⚠️ 텔레그램 환경변수가 없다 — 전송을 건너뛴다. GitHub 저장소 Secrets 에 TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 를 넣어야 한다.');
    process.exit(0);
  }

  const post = JSON.parse(fs.readFileSync(PENDING, 'utf8'));
  const imagePath = path.join(ROOT, post.image_path);
  if (!fs.existsSync(imagePath)) {
    await tg.sendMessage(`⚠️ 오늘 카드 파일이 없습니다: ${post.image_path}`);
    console.error(`카드 파일이 없다: ${imagePath}`);
    process.exit(0);
  }

  const failures = [];

  /* 1. 카드 + 승인 버튼 */
  const autoNote = post.copy_source === 'fallback'
    ? '\n\n⚠️ 카피가 자동 생성됐습니다(손으로 쓴 카피가 없는 영상). 확인해보세요.'
    : '';
  const caption = [
    `오늘의 목적지: ${post.destination_name}`,
    post.headline,
    '',
    '✔ 를 누르면 스레드에 게시합니다.',
    '누르지 않으면 올라가지 않습니다.',
  ].join('\n') + autoNote;

  const photo = await tg.sendPhoto(imagePath, caption, BUTTONS);
  if (photo.ok) {
    post.telegram_anchor_message_id = photo.result.message_id;
    fs.writeFileSync(PENDING, JSON.stringify(post, null, 2) + '\n');
    console.error(`카드 전송 완료 — anchor message_id ${photo.result.message_id}`);
  } else {
    failures.push(`카드 전송: ${photo.error}`);
    console.error(`카드 전송 실패: ${photo.error}`);
  }

  /* 2. 채널별 캡션. 하나 실패해도 나머지는 계속 보낸다. */
  const c = post.captions || {};
  const blocks = [
    ['[인스타그램]', c.instagram],
    ['[X]', c.x],
    ['[카카오톡 오픈채팅]', c.kakao],
    ['[디시인사이드 제목]', c.dcinside_title],
    ['[디시인사이드 본문]', c.dcinside_body],
  ].filter(([, body]) => body);

  for (const [label, body] of blocks) {
    const r = await tg.sendMessage(`${label}\n${body}`);
    if (!r.ok) failures.push(`${label}: ${r.error}`);
  }

  if (blocks.length) {
    await tg.sendMessage('디시 갤러리는 규정상 삭제·제재될 수 있으니, 올린 뒤 실제 페이지를 열어 본문이 그대로 붙었는지 확인하세요.');
  }

  if (failures.length) {
    console.error('일부 전송 실패:');
    failures.forEach(f => console.error('  -', f));
  } else {
    console.error(`캡션 ${blocks.length}건 전송 완료`);
  }

  /* 실패해도 0 으로 끝낸다 — 이유는 파일 맨 위 주석 참고. */
  process.exit(0);
}

main().catch(err => {
  console.error(`notify-daily-card 예외: ${err.message}`);
  process.exit(0);
});
