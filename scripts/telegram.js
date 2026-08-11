/* 텔레그램 Bot API 얇은 래퍼. GitHub Actions 에서만 쓴다.
   토큰은 환경변수로만 받는다 — 저장소에 절대 적지 않는다.

   모든 함수는 실패해도 던지지 않고 { ok, error } 를 돌려준다.
   호출자가 "텔레그램이 안 됐다고 게시까지 중단"할지 스스로 정하게 하려는 것이다. */

const fs = require('fs');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

function configured() {
  return Boolean(TOKEN && CHAT_ID);
}

async function call(method, body, isForm = false) {
  if (!configured()) return { ok: false, error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 미설정' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      ...(isForm ? { body } : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.ok) return { ok: false, error: `${method}: ${json.description || res.status}` };
    return { ok: true, result: json.result };
  } catch (e) {
    return { ok: false, error: `${method}: ${e.message}` };
  }
}

/* parse_mode 를 쓰지 않는다. 캡션에 링크·해시태그·괄호가 섞여 있어서
   마크다운으로 해석되면 전송이 실패하거나 글자가 깨진다. */
async function sendMessage(text, extra = {}) {
  return call('sendMessage', { chat_id: CHAT_ID, text, disable_web_page_preview: true, ...extra });
}

async function sendPhoto(filePath, caption, replyMarkup) {
  if (!configured()) return { ok: false, error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 미설정' };
  const fd = new FormData();
  fd.set('chat_id', CHAT_ID);
  if (caption) fd.set('caption', caption);
  if (replyMarkup) fd.set('reply_markup', JSON.stringify(replyMarkup));
  fd.set('photo', new Blob([fs.readFileSync(filePath)]), 'card.png');
  return call('sendPhoto', fd, true);
}

async function getUpdates(offset) {
  if (!configured()) return { ok: false, error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 미설정' };
  try {
    const url = new URL(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
    if (offset != null) url.searchParams.set('offset', String(offset));
    url.searchParams.set('timeout', '0');
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));
    if (!json.ok) return { ok: false, error: `getUpdates: ${json.description || res.status}` };
    return { ok: true, result: json.result || [] };
  } catch (e) {
    return { ok: false, error: `getUpdates: ${e.message}` };
  }
}

async function answerCallback(id, text) {
  return call('answerCallbackQuery', { callback_query_id: id, text: text || '확인했습니다' });
}

/* 이미 처리한 카드의 버튼을 지워서 두 번 눌리는 걸 막는다. */
async function clearButtons(messageId) {
  return call('editMessageReplyMarkup', { chat_id: CHAT_ID, message_id: messageId, reply_markup: { inline_keyboard: [] } });
}

module.exports = { configured, sendMessage, sendPhoto, getUpdates, answerCallback, clearButtons, CHAT_ID };
