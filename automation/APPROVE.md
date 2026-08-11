# 쇼츠박스 스레드 게시 지시서

> **⚠️ 2026-08-11: 이 지시서는 더 이상 자동 실행되지 않는다.**
> 승인 확인과 스레드 게시는 **GitHub Actions**(`.github/workflows/threads-post.yml`)가 맡는다.
> Claude 클라우드 루틴(`trig_014R6BbHBrpPev8WaKBXR38h`)은 비활성화했다 — 그 환경에서는
> Telegram `getUpdates`(승인 읽기)와 Threads 발행이 권한 분류기에 막혔다(사유까지 기록됨).
> 로직은 `scripts/threads-post.js` 로 옮겼고, 아래 규칙(승인 매칭 3조건, 리마인더 3시간,
> 만료 24시간, 실패 사유를 last_error 에 남기기)을 그대로 구현했다.
> 이 파일은 그 규칙의 근거 문서로 남긴다.


매시간 돈다. **사용자가 텔레그램에서 ✔ 를 누른 카드만 게시한다.** 승인 신호가 없으면 게시하지 않는다.

**대부분의 실행은 할 일이 없어 바로 끝난다. 그게 정상이다.**

> **2026-08-10 변경 — 자동 게시를 되돌렸다. 승인이 다시 필수다.**
> 8/9에 "거부 안 하면 게시"로 기본값을 뒤집었는데, 그러면 루틴이 **사용자 승인 근거가 하나도
> 없는 상태로 외부 공개 게시를 시도**하는 형태가 된다. 8/10에 세 번 연속 권한 분류기에
> 차단됐고(09:15·11:11·12:10 KST), 세 번째 실패 커밋 본문에 그대로 기록돼 있다:
> *"Claude Code 자동화 권한 분류기가 Threads 게시 요청(외부 공개 게시)을 차단"*.
> 토큰·이미지·API는 전부 정상이었다(진단 결과는 `automation/diagnosis-threads.md`).
> **무인 루틴이 사람 승인 없이 공개 게시를 하는 건 통과할 수 없는 구조다.** 우회할 방법을
> 찾는 게 아니라, 승인을 다시 필수로 두는 것이 맞는 해결이다.
>
> 8/9에 자동으로 뒤집은 이유였던 "사용자가 버튼을 안 누르는 날 게시가 통째로 빠진다"는
> 문제는 **게시 강행이 아니라 리마인더로 푼다**(4장). 카드가 3시간 넘게 대기하면 한 번
> 알리고, 24시간이 지나면 만료시켜 다음 날 카드와 겹치지 않게 한다.

---

## 1. 할 일이 있는지 먼저 확인

저장소를 pull 하고 `automation/pending-post.json` 을 읽는다.

다음이면 **아무것도 하지 말고 종료**한다. 커밋도 하지 않는다.

- 파일이 없다
- `status` 가 `pending` 이 아니다 (`posted`, `failed`, `skipped`, `expired` 등)

보고는 한 줄. 예: `대기 중인 게시물 없음 (status: posted)`

`$TELEGRAM_BOT_TOKEN` 이나 `$TELEGRAM_CHAT_ID` 가 비어 있으면 **승인을 읽을 수단이 없으므로 게시하지 않는다.** 6장의 규칙대로 `last_error` 에 `텔레그램 환경변수 미설정 — 승인 확인 불가` 를 적어 커밋·push 하고 종료한다. (승인이 전제인 구조에서는 승인을 못 읽는 게 곧 게시 불가다. 예전처럼 "그냥 게시"로 넘어가면 안 된다.)

`telegram_anchor_message_id` 가 `null` 이면 승인 버튼을 어느 카드에 대한 것인지 매칭할 수 없다 → 5장으로 가서 승인 카드를 다시 보낸다.

---

## 2. 승인·거부 확인 — 게시의 전제

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates?offset=<last_update_id + 1, 없으면 생략>"
```

응답은 python3 로 파싱한다. **이 호출이 실패하면 게시하지 않는다** — 승인 여부를 모르는 채로 공개 게시를 하면 안 된다. 6장 규칙대로 `last_error` 에 사유를 적고 커밋·종료한다.

### 2-A. 버튼

`result` 배열에서 **`callback_query`** 가 있는 항목을 찾는다. 아래 셋을 모두 만족해야 그 카드에 대한 신호로 인정한다.

1. `callback_query.from.id` 가 `$TELEGRAM_CHAT_ID` 와 같다
2. `callback_query.message.message_id` 가 `pending-post.json` 의 `telegram_anchor_message_id` 와 **같다**
3. `callback_query.data` 가 `sb_approve` 또는 `sb_reject`

2번이 중요하다. **어느 카드에 대한 버튼인지 정확히 매칭된다.** 어제 카드의 버튼을 오늘 카드의 승인으로 잘못 읽으면 승인받지 않은 게시가 된다.

신호를 찾았으면 **먼저 응답부터 준다.** 안 하면 버튼에 로딩 표시가 계속 돈다.

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

버튼이 안 눌리는 경우를 위한 폴백. `message.chat.id` 가 `$TELEGRAM_CHAT_ID` 와 같고 `message.message_id` 가 `telegram_anchor_message_id` 보다 큰 메시지 중에서:

- `게시` · `올려` · `올리자` · `ㅇㅋ` 가 들어 있으면 **승인**
- `취소` · `건너뛰` 가 들어 있으면 **거부**

둘 다 들어 있으면 **거부로 본다**(더 보수적인 쪽).

### 2-C. offset 갱신

`result` 의 모든 `update_id` 중 **최댓값**을 구해 `last_update_id` 로 쓴다. 이걸 안 하면 같은 업데이트를 계속 다시 읽는다. **승인/거부를 처리했든 안 했든 갱신한다.**

### 판정

| 신호 | 처리 |
|---|---|
| `sb_approve` 또는 승인 텍스트 | **3장으로 가서 게시한다** |
| `sb_reject` 또는 거부 텍스트 | `status` 를 `skipped` 로 바꿔 커밋·push. 텔레그램에 `건너뜁니다. 오늘은 스레드에 올리지 않습니다.` 를 보내고 종료 |
| 아무 신호 없음 | **게시하지 않는다.** `last_update_id` 만 갱신하고 4장(리마인더)으로 |

**"신호가 없으면 게시"가 아니다.** 이 문장을 다시 뒤집지 말 것 — 그렇게 했다가 8/10에 세 번 차단됐다.

---

## 3. 스레드에 게시 — 승인이 확인된 경우에만

`$THREADS_ACCESS_TOKEN` 이 비어 있으면 6장 규칙대로 `last_error` 를 적어 커밋하고 종료한다. `attempt_count` 는 올리지 않는다(시도조차 못 한 것이므로).

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

`FINISHED` 가 될 때까지. `ERROR` 면 즉시 7장(실패 처리)으로.

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

`pending-post.json` 을 갱신한다 — `status` 를 `posted` 로, `threads_post_id`·`threads_permalink` 추가, `last_update_id` 갱신, `approved_by_update_id` 에 승인 근거가 된 `update_id` 를 기록. 커밋(`스레드 게시 완료 (날짜) — 사용자 승인 update_id <N>`)·push.

승인 근거를 남기는 이유: 나중에 "이 게시물이 승인받은 것인지"를 저장소만 보고 확인할 수 있어야 한다.

> **개인 토큰(PAT)을 쓰지 마라.** GitHub 쓰기는 Claude GitHub App 이 담당한다. PAT 는 어떤 형식이든 403 이다(2026-08-06 확인).

텔레그램 알림:

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -F chat_id="$TELEGRAM_CHAT_ID" -F text="✅ 스레드에 게시했습니다! <permalink>"
```

---

## 4. 승인 신호가 없을 때 — 리마인더

승인을 기다리는 게 기본이므로, 신호가 없는 건 **정상 상태**다. 다만 사용자가 잊는 경우가 있어서(8/8 카드가 하루 넘게 대기했다) 한 번만 상기시킨다.

`date` 필드(카드 생성 날짜)와 지금 시각을 비교한다.

- **3시간 미만** → 조용히 종료. 커밋하지 않는다. 보고는 `승인 대기 중 (경과 N시간)`
- **3시간 이상이고 `reminded_at` 이 없으면** → 리마인더 한 번 보내고 `reminded_at`(UTC ISO)을 기록해 커밋·push

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -F chat_id="$TELEGRAM_CHAT_ID" \
  -F text="⏳ 오늘 카드가 아직 대기 중입니다. 위 카드의 ✔ 를 누르면 스레드에 올라갑니다." \
  -F reply_to_message_id="<telegram_anchor_message_id>"
```

- **이미 `reminded_at` 이 있으면** → 조용히 종료. 두 번 이상 보내지 않는다
- **24시간 이상 경과** → `status` 를 `expired` 로 바꿔 커밋·push 하고 텔레그램에 `⌛ 어제 카드는 만료 처리했습니다. 오늘 카드로 넘어갑니다.` 를 보낸다. 다음 날 카드와 겹치지 않게 하는 게 목적이다

---

## 5. anchor 가 없으면 승인 카드를 다시 보낸다

`telegram_anchor_message_id` 가 `null` 이면 생성 루틴의 텔레그램 전송이 실패한 것이다. 승인 버튼을 매칭할 수 없으므로 이 상태로는 게시할 수 없다.

`image_path` 의 PNG 를 승인 버튼과 함께 다시 보내고, 받은 `result.message_id` 를 `telegram_anchor_message_id` 에 기록해 커밋·push 한다.

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendPhoto" \
  -F chat_id="$TELEGRAM_CHAT_ID" \
  -F photo=@<image_path> \
  -F caption="오늘의 카드입니다. ✔ 를 누르면 스레드에 게시합니다." \
  -F reply_markup='{"inline_keyboard":[[{"text":"✔ 스레드에 게시","callback_data":"sb_approve"},{"text":"✖ 오늘은 건너뛰기","callback_data":"sb_reject"}]]}'
```

이번 주기에는 여기까지만 하고 종료한다. 다음 주기에 승인을 확인한다.

---

## 6. 실패·차단 사유를 남기는 규칙

**`status` 가 `pending` 인데 이번 실행에서 게시까지 가지 못했다면, 이유를 무엇이든 `pending-post.json` 의 `last_error`·`last_error_at`(UTC ISO)에 적고 커밋·push 한다.** `status` 는 `pending` 으로 유지해 다음 주기에 다시 시도하게 둔다.

예외: **승인 대기(4장)와 할 일 없음(1장)은 실패가 아니다** — 그건 조용히 끝내는 게 맞다.

사유는 짐작이 아니라 **받은 그대로** 적는다.

- API 가 응답을 줬으면 `error.message`·`error.code`·`error.error_subcode` 를 그대로
- 도구·권한 차원에서 막혔으면 그 문구를 그대로(예: `권한 분류기가 외부 공개 게시를 차단`)
- 타임아웃이면 어느 단계에서 몇 초 만에 끊겼는지

**커밋 메시지 본문이 아니라 `pending-post.json` 안에 적는다.** 8/10에 세 번 실패했는데 사유가 세 번째 커밋 메시지 본문에만 있었고, `git log --format=%B` 를 봐야 나와서 아무도 못 찾았다.

---

## 7. 게시 실패하면

`attempt_count` 를 1 올리고 `status` 는 `pending` 으로 둔다(다음 주기에 재시도). 이미 3 이상이었으면(이번이 4번째) `status` 를 `failed` 로 바꿔 더는 재시도하지 않는다. `last_update_id` 도 갱신. 6장 규칙대로 `last_error`·`last_error_at` 을 채운다. 커밋(`스레드 게시 실패 기록 (날짜)`)·push.

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -F chat_id="$TELEGRAM_CHAT_ID" -F text="⚠️ 스레드 게시 실패 (시도 <n>/4): <에러>"
```

**재시도해도 같은 사유로 계속 막히면 자동화로 풀 문제가 아니다.** 그때는 보고에 그 사실을 명시하고, 사용자가 스레드 앱에서 직접 올리는 쪽을 권한다 — 카드와 캡션은 이미 만들어져 있다.

> **2026-08-10 실측 — 이 루틴에서 막히는 건 발행만이 아니다.**
> 승인 필수로 바꾼 뒤 첫 실행에서 **`getUpdates`(승인 확인) 자체가 차단**됐다:
> *"Permission for this action was denied by the Claude Code auto mode classifier."*
> 같은 실행에서 `sendPhoto`(승인 카드 전송)는 통과했다. 즉 어떤 외부 호출이 막히는지가
> 일정하지 않고, "승인을 받으면 통과한다"는 보장이 없다.
> **그래서 지금 이 루틴은 카드 생성·전달까지만 신뢰할 수 있고, 게시는 사람이 직접 하는 게
> 현실적이다.** 분류기를 우회하는 방향은 시도하지 않는다 — 무인 세션이 승인 없이 외부에
> 공개 게시하는 걸 막는 장치이고, 그건 맞는 동작이다.
> 이 상태에서 매시간 재시도는 같은 실패 기록만 쌓는다. `status` 를 `skipped` 로 두고
> 수동 게시로 넘기는 판단은 사용자가 한다.

---

## 8. 최종 보고

한 줄이면 된다. 이 루틴은 매시간 조용히 도는 게 목적이라 장황한 보고가 필요 없다.

`대기 중인 게시물 없음` / `승인 대기 중 (경과 N시간)` / `리마인더 전송` / `✅ 게시 완료: <permalink>` / `⚠️ 게시 실패 (N/4): <사유>` / `건너뜀(사용자 거부)` / `만료 처리`

push 가 거부되면 `git pull --rebase` 후 한 번만 재시도한다. 한국어로 작업한다.
