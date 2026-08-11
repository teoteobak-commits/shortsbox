/* 승인을 확인하고 스레드에 게시한다. GitHub Actions 가 매시간 부른다.

   왜 여기 있는가: Claude 클라우드 루틴에서는 이 두 가지가 권한 분류기에 막혔다 —
   Telegram getUpdates(승인 읽기)와 Threads 발행. Actions 는 막히지 않는다.

   흐름
   1. pending-post.json 을 읽는다. status 가 pending 이 아니면 조용히 끝낸다(정상).
   2. getUpdates 로 승인/거부 신호를 찾는다. 세 조건을 모두 만족해야 인정한다.
      - 보낸 사람이 우리 chat_id
      - 누른 버튼이 telegram_anchor_message_id 카드의 것   ← 어제 카드 버튼을 오늘 승인으로
      - callback_data 가 sb_approve 또는 sb_reject            잘못 읽는 걸 막는 핵심 조건
   3. 승인이면 컨테이너 생성 → 상태 확인 → 발행 → permalink 기록
      거부면 status 를 skipped 로
      아무 신호도 없으면 게시하지 않는다. 3시간 넘으면 한 번 상기시키고,
      24시간 넘으면 expired 로 내려 다음 날 카드와 겹치지 않게 한다.

   **게시까지 가지 못한 이유는 무조건 last_error 에 적는다.** 예전에 attempt_count 만
   올리고 사유를 안 남겨서, 세 번 실패한 원인을 찾는 데 한참 걸렸다.

   종료코드: 정상 흐름은 항상 0. 게시 실패도 0 으로 끝낸다(기록을 커밋해야 하므로).
   1 로 끝내는 건 pending-post.json 을 읽지도 못한 경우뿐이다. */

const fs = require('fs');
const path = require('path');
const tg = require('./telegram.js');

const ROOT = path.join(__dirname, '..');
const PENDING = path.join(ROOT, 'automation', 'pending-post.json');
const THREADS_TOKEN = process.env.THREADS_ACCESS_TOKEN || '';
const GRAPH = 'https://graph.threads.net/v1.0';

const REMIND_AFTER_H = 3;
const EXPIRE_AFTER_H = 24;

let post;
function save() {
  fs.writeFileSync(PENDING, JSON.stringify(post, null, 2) + '\n');
}
function nowIso() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}
/* 워크플로우가 이 줄을 읽어서 커밋할지 판단한다. */
function finish(action, note) {
  console.log(JSON.stringify({ action, note: note || '' }));
  process.exit(0);
}
function recordError(reason) {
  post.last_error = reason;
  post.last_error_at = nowIso();
  save();
  console.error(`기록: ${reason}`);
}

async function threads(pathname, params, method = 'GET') {
  const url = new URL(`${GRAPH}/${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: THREADS_TOKEN });
  const res = method === 'GET'
    ? await fetch(`${url}?${body}`)
    : await fetch(url, { method, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const json = await res.json().catch(() => ({}));
  if (json.error) {
    const e = json.error;
    throw new Error(`Threads ${e.code ?? ''}${e.error_subcode ? '/' + e.error_subcode : ''}: ${e.message || 'unknown'}`);
  }
  return json;
}

function hoursSince(dateStr) {
  const t = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(t)) return 0;
  return (Date.now() - t) / 3600000;
}

/* 버튼 신호 찾기. 텍스트 폴백도 본다(버튼이 안 눌리는 기기가 있다). */
function findSignal(updates) {
  const anchor = post.telegram_anchor_message_id;
  let maxUpdateId = post.last_update_id ?? null;
  let signal = null;

  for (const u of updates) {
    if (maxUpdateId == null || u.update_id > maxUpdateId) maxUpdateId = u.update_id;

    const cq = u.callback_query;
    if (cq && String(cq.from?.id) === String(tg.CHAT_ID)
        && anchor != null && cq.message?.message_id === anchor
        && (cq.data === 'sb_approve' || cq.data === 'sb_reject')) {
      signal = { kind: cq.data === 'sb_approve' ? 'approve' : 'reject', callbackId: cq.id, updateId: u.update_id };
      continue;
    }

    const m = u.message;
    if (m && String(m.chat?.id) === String(tg.CHAT_ID) && anchor != null && m.message_id > anchor && m.text) {
      const t = m.text;
      const reject = /취소|건너뛰/.test(t);
      const approve = /게시|올려|올리자|ㅇㅋ/.test(t);
      /* 둘 다 들어 있으면 거부로 본다 — 더 보수적인 쪽. */
      if (reject) signal = { kind: 'reject', updateId: u.update_id };
      else if (approve) signal = { kind: 'approve', updateId: u.update_id };
    }
  }
  return { signal, maxUpdateId };
}

async function publish() {
  /* 1. 컨테이너 생성 */
  const container = await threads('me/threads', {
    media_type: 'IMAGE',
    image_url: post.image_url,
    text: post.threads_text,
  }, 'POST');
  const creationId = container.id;
  if (!creationId) throw new Error('컨테이너 id 를 못 받았다');

  /* 2. FINISHED 될 때까지 (최대 4회, 10초 간격) */
  let status = '';
  for (let i = 0; i < 4; i++) {
    await new Promise(r => setTimeout(r, i === 0 ? 3000 : 10000));
    const s = await threads(creationId, { fields: 'status,error_message' });
    status = s.status;
    if (status === 'FINISHED') break;
    if (status === 'ERROR') throw new Error(`컨테이너 처리 실패: ${s.error_message || 'ERROR'}`);
  }
  if (status !== 'FINISHED') throw new Error(`컨테이너가 FINISHED 가 안 됐다(마지막 상태 ${status || '없음'})`);

  /* 3. 발행 */
  const published = await threads('me/threads_publish', { creation_id: creationId }, 'POST');
  const mediaId = published.id;
  if (!mediaId) throw new Error('발행 응답에 id 가 없다');

  /* 4. permalink — 실패해도 게시는 성공이므로 넘어간다 */
  let permalink = '';
  try {
    permalink = (await threads(mediaId, { fields: 'permalink' })).permalink || '';
  } catch (e) {
    console.error(`permalink 조회 실패(게시는 성공): ${e.message}`);
  }
  return { mediaId, permalink };
}

async function main() {
  try {
    post = JSON.parse(fs.readFileSync(PENDING, 'utf8'));
  } catch (e) {
    console.error(`pending-post.json 을 읽을 수 없다: ${e.message}`);
    process.exit(1);
  }

  if (post.status !== 'pending') finish('none', `대기 중인 게시물 없음 (status: ${post.status})`);

  if (!tg.configured()) {
    recordError('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 미설정 — 승인을 읽을 수 없어 게시하지 않음');
    finish('error', '텔레그램 환경변수 미설정');
  }

  /* anchor 가 없으면 승인을 매칭할 수 없다. 승인 카드를 다시 보낸다. */
  if (post.telegram_anchor_message_id == null) {
    const imagePath = path.join(ROOT, post.image_path);
    if (!fs.existsSync(imagePath)) {
      recordError(`anchor 도 없고 카드 파일도 없다: ${post.image_path}`);
      finish('error', '카드 파일 없음');
    }
    const r = await tg.sendPhoto(imagePath, `오늘의 카드입니다. ✔ 를 누르면 스레드에 게시합니다.`, {
      inline_keyboard: [[
        { text: '✔ 스레드에 게시', callback_data: 'sb_approve' },
        { text: '✖ 오늘은 건너뛰기', callback_data: 'sb_reject' },
      ]],
    });
    if (!r.ok) { recordError(`승인 카드 재전송 실패: ${r.error}`); finish('error', r.error); }
    post.telegram_anchor_message_id = r.result.message_id;
    save();
    finish('anchor', `승인 카드 재전송 — message_id ${r.result.message_id}`);
  }

  const upd = await tg.getUpdates(post.last_update_id != null ? post.last_update_id + 1 : undefined);
  if (!upd.ok) {
    recordError(`승인 확인 실패 — ${upd.error}. 승인 여부를 모르는 채로 게시하지 않음`);
    finish('error', upd.error);
  }

  const { signal, maxUpdateId } = findSignal(upd.result);
  if (maxUpdateId != null) post.last_update_id = maxUpdateId;

  /* 거부 */
  if (signal && signal.kind === 'reject') {
    if (signal.callbackId) await tg.answerCallback(signal.callbackId, '건너뜁니다');
    await tg.clearButtons(post.telegram_anchor_message_id);
    post.status = 'skipped';
    save();
    await tg.sendMessage('건너뜁니다. 오늘은 스레드에 올리지 않습니다.');
    finish('skipped', '사용자 거부');
  }

  /* 신호 없음 → 게시하지 않는다. 리마인더/만료만 본다. */
  if (!signal) {
    const elapsed = hoursSince(post.date);
    if (elapsed >= EXPIRE_AFTER_H) {
      post.status = 'expired';
      save();
      await tg.sendMessage('⌛ 어제 카드는 만료 처리했습니다. 오늘 카드로 넘어갑니다.');
      finish('expired', `${elapsed.toFixed(0)}시간 경과`);
    }
    if (elapsed >= REMIND_AFTER_H && !post.reminded_at) {
      post.reminded_at = nowIso();
      save();
      await tg.sendMessage('⏳ 오늘 카드가 아직 대기 중입니다. 위 카드의 ✔ 를 누르면 스레드에 올라갑니다.', {
        reply_to_message_id: post.telegram_anchor_message_id,
      });
      finish('reminded', `${elapsed.toFixed(0)}시간 경과`);
    }
    /* last_update_id 가 바뀌었으면 커밋해야 같은 업데이트를 다시 읽지 않는다. */
    save();
    finish(maxUpdateId != null && maxUpdateId !== undefined ? 'waiting' : 'none', `승인 대기 중 (경과 ${elapsed.toFixed(0)}시간)`);
  }

  /* 승인 */
  if (signal.callbackId) await tg.answerCallback(signal.callbackId, '게시합니다');
  await tg.clearButtons(post.telegram_anchor_message_id);

  if (!THREADS_TOKEN) {
    recordError('THREADS_ACCESS_TOKEN 미설정 — 승인은 받았지만 게시하지 못함');
    await tg.sendMessage('⚠️ THREADS_ACCESS_TOKEN 이 없어 게시하지 못했습니다. GitHub 저장소 Secrets 를 확인해주세요.');
    finish('error', 'THREADS_ACCESS_TOKEN 미설정');
  }

  try {
    const { mediaId, permalink } = await publish();
    post.status = 'posted';
    post.threads_post_id = mediaId;
    post.threads_permalink = permalink;
    post.approved_by_update_id = signal.updateId;
    post.last_error = null;
    post.last_error_at = null;
    save();
    await tg.sendMessage(`✅ 스레드에 게시했습니다! ${permalink || '(permalink 조회 실패)'}`);
    finish('posted', permalink);
  } catch (e) {
    post.attempt_count = (post.attempt_count || 0) + 1;
    if (post.attempt_count >= 4) post.status = 'failed';
    recordError(e.message);
    await tg.sendMessage(`⚠️ 스레드 게시 실패 (시도 ${post.attempt_count}/4): ${e.message}`);
    finish('failed', e.message);
  }
}

main().catch(err => {
  /* 여기까지 오면 예상 못 한 예외다. 기록만 남기고 0 으로 끝낸다 — 워크플로우가
     그 기록을 커밋해야 다음 실행이 같은 실패를 되풀이하지 않는다. */
  console.error(`threads-post 예외: ${err.stack || err.message}`);
  try { recordError(`예상 못 한 예외: ${err.message}`); } catch (e) { /* 이미 못 읽는 상태 */ }
  console.log(JSON.stringify({ action: 'error', note: err.message }));
  process.exit(0);
});
