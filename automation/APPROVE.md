# 쇼츠박스 스레드 게시 지시서

매시간 돈다. 게시 대기 중인 카드뉴스가 있으면 **바로 스레드에 게시한다.**

**대부분의 실행은 할 일이 없어 바로 끝난다. 그게 정상이다.**

> **2026-08-09 변경 — 승인 대기를 없앴다.**
> 예전에는 사용자가 텔레그램 버튼을 눌러야 게시했는데, 버튼을 안 누르는 날이 생기면서
> 그날 게시가 통째로 빠졌다. 8/8 카드가 하루 넘게 대기하다 안 나간 게 발단이다.
> 소셜이 지금 유일하게 살아있는 유입 경로라 게시가 끊기면 트래픽이 바로 죽는다.
> 그래서 **기본을 "게시"로 뒤집었다.** 사용자가 ✖ 버튼을 누른 날만 건너뛴다.

---

## 1. 할 일이 있는지 먼저 확인

저장소를 pull 하고 `automation/pending-post.json` 을 읽는다.

다음이면 **아무것도 하지 말고 종료**한다. 커밋도 하지 않는다.

- 파일이 없다
- `status` 가 `pending` 이 아니다 (`posted`, `failed`, `skipped` 등)

`telegram_anchor_message_id` 가 `null` 이어도 **게시는 진행한다.** 그건 텔레그램 전송이
실패했다는 뜻일 뿐이고, 이미지와 캡션은 이미 커밋돼 있어 게시에 필요한 건 다 있다.
(취소 버튼 확인만 건너뛴다 — 2장 참고)

보고는 한 줄. 예: `대기 중인 게시물 없음 (status: posted)`

`$TELEGRAM_BOT_TOKEN` 이나 `$TELEGRAM_CHAT_ID` 가 비어 있으면 **종료하지 말고 2장(취소 확인)만 건너뛰고 3장으로 간다.** 텔레그램은 취소 버튼을 읽는 통로일 뿐이고, 그게 없다고 그날 게시를 통째로 날리는 게 더 큰 손해다. 보고에만 `텔레그램 환경변수 미설정 — 취소 확인 건너뜀` 을 적는다.

> **대기 중인 카드가 있는데 게시하지 못했으면 반드시 흔적을 남긴다(2026-08-10 추가).**
> 8/9 오사카 카드가 이 지시서의 조용한 종료 경로에 걸려 두 번 연속 아무 기록도 남기지 않고
> 끝났다. 커밋도 없고 `attempt_count` 도 안 오르니, 겉보기엔 루틴이 아예 안 돈 것과 구별되지
> 않았고 원인을 좁히는 데만 20분이 걸렸다.
> **`status` 가 `pending` 인데 이번 실행에서 게시까지 가지 못했다면, 이유를 무엇이든
> `pending-post.json` 의 `last_error`·`last_error_at` 에 적고 커밋·push 한다.**
> `status` 는 `pending` 으로 유지해서 다음 주기에 다시 시도하게 둔다.
> 할 일이 없어서 끝나는 경우(`status` 가 `pending` 이 아님)는 예외다 — 그건 조용히 끝내는 게 맞다.

---

## 2. 취소를 눌렀는지만 확인

**게시가 기본이다.** 여기서는 사용자가 "오늘은 올리지 마라"고 명시적으로 막았는지만 본다.
신호가 없으면 그냥 3장으로 가서 게시한다.

`telegram_anchor_message_id` 가 `null` 이면 이 장을 통째로 건너뛰고 바로 3장으로 간다.

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates?offset=<last_update_id + 1, 없으면 생략>"
```

응답은 python3 로 파싱한다. 이 호출이 실패해도 **게시를 막지 않는다** — 취소 확인은
부가 기능이고, 못 읽었다고 그날 게시를 통째로 날리는 게 더 큰 손해다. 보고에만 남긴다.

### 2-A. 취소 버튼

`result` 배열에서 **`callback_query`** 가 있는 항목을 찾는다. 아래를 모두 만족해야 취소로 본다.

1. `callback_query.from.id` 가 `$TELEGRAM_CHAT_ID` 와 같다
2. `callback_query.message.message_id` 가 `pending-post.json` 의 `telegram_anchor_message_id` 와 **같다**
3. `callback_query.data` 가 `sb_reject`

2번이 중요하다. **어느 카드에 대한 버튼인지 정확히 매칭된다.**

`sb_approve` 가 와도 그냥 게시하면 된다(예전 버튼을 누른 경우). 결과는 같다.

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

### 2-B. 텍스트로 취소 (예비)

버튼이 없어도 본다. `message.chat.id` 가 `$TELEGRAM_CHAT_ID` 와 같고, `message.message_id` 가
`telegram_anchor_message_id` 보다 크고, `message.text` 에 `취소` 또는 `건너뛰` 가 들어간 메시지가 있으면 취소로 본다.

### 2-C. offset 갱신

`result` 의 모든 `update_id` 중 **최댓값**을 구해 `last_update_id` 로 쓴다. 이걸 안 하면 같은 업데이트를 계속 다시 읽는다.

### 취소 신호가 없으면

**그게 정상이다. 3장으로 가서 게시한다.** 기다리지 않는다.

### 취소(`sb_reject` 또는 텍스트)면

`status` 를 `skipped` 로 바꾸고 커밋·push. 텔레그램에 `건너뜁니다. 오늘은 스레드에 올리지 않습니다.` 를 보내고 종료한다.

---

## 3. 스레드에 게시

`$THREADS_ACCESS_TOKEN` 이 비어 있으면 **조용히 끝내지 말고**, `pending-post.json` 의 `status` 는 `pending` 으로 둔 채 `last_error` 에 `THREADS_ACCESS_TOKEN 미설정` 과 `last_error_at`(UTC ISO)을 적어 커밋·push 하고, 텔레그램이 가능하면 `⚠️ THREADS_ACCESS_TOKEN 이 비어 있어 게시하지 못했습니다` 를 보낸 뒤 종료한다. `attempt_count` 는 올리지 않는다(게시를 시도한 게 아니라 시도조차 못 한 것이므로).

**토큰이 있는데도 API가 인증 오류(190/OAuthException 등)를 주면** 그건 4장(게시 실패)으로 처리하되, `last_error` 에 API가 준 메시지를 그대로 옮겨 적는다 — 만료와 미설정을 구별할 수 있어야 한다.

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

`대기 중인 게시물 없음` / `✅ 게시 완료: <permalink>` / `⚠️ 게시 실패 (N/4)` / `건너뜀(사용자 취소)`

push 가 거부되면 `git pull --rebase` 후 한 번만 재시도한다. 한국어로 작업한다.
