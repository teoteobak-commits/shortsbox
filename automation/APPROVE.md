# 쇼츠박스 승인 체크 → 스레드 게시 지시서

매시간 돈다. 카드뉴스에 달린 **버튼을 사용자가 눌렀는지** 확인하고, 눌렀으면 스레드에 게시한다.

**대부분의 실행은 할 일이 없어 바로 끝난다. 그게 정상이다.**

---

## 1. 할 일이 있는지 먼저 확인

저장소를 pull 하고 `automation/pending-post.json` 을 읽는다.

다음이면 **아무것도 하지 말고 종료**한다. 커밋도 하지 않는다.

- 파일이 없다
- `status` 가 `pending` 이 아니다 (`posted`, `failed` 등)
- `telegram_anchor_message_id` 가 `null` 이다 — 아직 준비가 덜 됐다

보고는 한 줄. 예: `대기 중인 게시물 없음 (status: posted)`

`$TELEGRAM_BOT_TOKEN` 이나 `$TELEGRAM_CHAT_ID` 가 비어 있으면 `⚠️ 텔레그램 환경변수 미설정` 을 남기고 종료한다.

---

## 2. 버튼을 눌렀는지 확인

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates?offset=<last_update_id + 1, 없으면 생략>"
```

응답은 python3 로 파싱한다.

### 2-A. 버튼 (이게 기본이다)

`result` 배열에서 **`callback_query`** 가 있는 항목을 찾는다. 아래를 모두 만족해야 한다.

1. `callback_query.from.id` 가 `$TELEGRAM_CHAT_ID` 와 같다
2. `callback_query.message.message_id` 가 `pending-post.json` 의 `telegram_anchor_message_id` 와 **같다**
3. `callback_query.data` 가 `sb_approve` (게시) 또는 `sb_reject` (건너뛰기)

2번이 중요하다. **어느 카드에 대한 버튼인지 정확히 매칭된다.** 예전 텍스트 방식은 이게 안 돼서 추측해야 했다.

버튼을 찾았으면 **먼저 응답부터 준다.** 안 하면 버튼에 로딩 표시가 계속 돈다.

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/answerCallbackQuery" \
  -F callback_query_id="<callback_query.id>" \
  -F text="확인했습니다"
```

그리고 버튼을 지워서 이미 처리됐음을 보인다.

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/editMessageReplyMarkup" \
  -F chat_id="$TELEGRAM_CHAT_ID" -F message_id="<anchor id>" -F reply_markup='{"inline_keyboard":[]}'
```

### 2-B. 텍스트 (예비)

버튼이 없으면 예전 방식도 본다. `message.chat.id` 가 `$TELEGRAM_CHAT_ID` 와 같고, `message.message_id` 가 `telegram_anchor_message_id` 보다 크고, `message.text` 에 `승인` 이 들어간 메시지.

버튼을 쓰기 시작한 뒤에도 이 경로를 남겨둔다. 버튼이 안 뜨는 구형 클라이언트가 있을 수 있다.

### 2-C. offset 갱신

승인 여부와 무관하게 `result` 의 모든 `update_id` 중 **최댓값**을 구해 `last_update_id` 로 쓴다. 이걸 안 하면 같은 업데이트를 계속 다시 읽는다.

### 신호가 없으면

`last_update_id` 가 바뀌었으면 그것만 갱신해 커밋(`텔레그램 offset 갱신`)·push 하고 종료. 바뀔 게 없으면 아무것도 커밋하지 말고 `승인 대기 중 (아직 답 없음)` 을 남기고 종료한다.

### 건너뛰기(`sb_reject`)면

`status` 를 `skipped` 로 바꾸고 커밋·push. 텔레그램에 `건너뜁니다. 오늘은 스레드에 올리지 않습니다.` 를 보내고 종료한다.

---

## 3. 스레드에 게시

`$THREADS_ACCESS_TOKEN` 이 비어 있으면 `⚠️ THREADS_ACCESS_TOKEN 미설정으로 게시 불가` 를 남기고, `pending-post.json` 은 **그대로 둔다**(재시도 가능하게). 종료.

`image_url`, `threads_text` 를 쓴다.

**3-1. 이미지 컨테이너 생성**

```bash
curl -s -X POST "https://graph.threads.net/v1.0/me/threads" \
  --data-urlencode "media_type=IMAGE" \
  --data-urlencode "image_url=<image_url>" \
  --data-urlencode "text=<threads_text>" \
  --data-urlencode "access_token=$THREADS_ACCESS_TOKEN"
```

응답의 `id` 가 `creation_id`. 실패하면 Vercel 배포가 아직 전파 중일 수 있으니 30초 뒤 한 번만 재시도한다.

**3-2. 상태 확인** (최대 4회, 10초 간격)

```bash
curl -s "https://graph.threads.net/v1.0/<creation_id>?fields=status,error_message&access_token=$THREADS_ACCESS_TOKEN"
```

`FINISHED` 가 될 때까지. `ERROR` 면 즉시 4번(실패 처리)으로.

**3-3. 발행**

```bash
curl -s -X POST "https://graph.threads.net/v1.0/me/threads_publish" \
  --data-urlencode "creation_id=<creation_id>" \
  --data-urlencode "access_token=$THREADS_ACCESS_TOKEN"
```

**3-4. permalink**

```bash
curl -s "https://graph.threads.net/v1.0/<media_id>?fields=permalink&access_token=$THREADS_ACCESS_TOKEN"
```

### 성공하면

`pending-post.json` 을 갱신한다 — `status` 를 `posted` 로, `threads_post_id` 와 `threads_permalink` 추가, `last_update_id` 갱신. 커밋(`스레드 자동 게시 완료 (날짜)`)·push.

> **개인 토큰(PAT)을 쓰지 마라.** GitHub 쓰기는 Claude GitHub App 이 담당한다. PAT 는 어떤 형식이든 403 이다(2026-08-06 확인).

텔레그램 알림:

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -F chat_id="$TELEGRAM_CHAT_ID" -F text="✅ 스레드에 게시했습니다! <permalink>"
```

---

## 4. 게시 실패하면

`attempt_count` 를 1 올리고 `status` 는 `pending` 으로 둔다(다음 주기에 재시도). 이미 3 이상이었으면(이번이 4번째) `status` 를 `failed` 로 바꿔 더는 재시도하지 않는다. `last_update_id` 도 갱신. 커밋(`스레드 게시 실패 기록 (날짜)`)·push.

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -F chat_id="$TELEGRAM_CHAT_ID" -F text="⚠️ 스레드 게시 실패 (시도 <n>/4): <에러>"
```

---

## 5. 최종 보고

한 줄이면 된다. 이 루틴은 매시간 조용히 도는 게 목적이라 장황한 보고가 필요 없다.

`대기 중인 게시물 없음` / `승인 대기 중` / `✅ 게시 완료: <permalink>` / `⚠️ 게시 실패 (N/4)` / `건너뜀`

push 가 거부되면 `git pull --rebase` 후 한 번만 재시도한다. 한국어로 작업한다.
