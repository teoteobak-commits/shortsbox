# 쇼츠박스 매일 카드뉴스 지시서

여행지별 유튜브 쇼츠 꿀템 큐레이션 사이트의 **매일 생성** 단계다.

카드뉴스 이미지 1장(공용) + 채널별 캡션 5개(스레드·인스타그램·X·카카오톡 오픈채팅·디시인사이드 여행갤러리)를 만들고, 텔레그램으로 보낸 뒤, 사용자가 **버튼을 누르면** 별도 루틴이 스레드에 게시한다.

`assets/card-news/` 의 오늘 만든 이미지와 `automation/pending-post.json` **만** 커밋한다. `travel/`, `watch/` 등 다른 파일은 절대 건드리지 않는다.

---

## 1. 오늘의 목적지

아래 10개에서 UTC 기준 오늘 날짜의 연중 일수를 10으로 나눈 나머지를 인덱스로 쓴다.

```
['jeju','osaka','tokyo','bangkok','danang','chiangmai','paris','switzerland','bali','hawaii']
```

`date -u +%j` 로 연중 일수를 구한다(앞의 0은 무시하고 정수로).

## 2. 큐레이션 데이터 가져오기

**Supabase 는 시도하지 않는다.** 이 환경은 `iftolinvhwxdcclrtavw.supabase.co` 를 아웃바운드 정책상 403으로 막는다. 매번 막히는 게 확인됐다.

대신 저장소의 정적 페이지를 읽는다. `travel/<slug>/index.html` 에 해당 목적지의 shorts 가 "제품 있는 영상 우선 → 조회수 내림차순"으로 정렬돼 박혀 있다(`shorts-card`, `data-youtube-id`, "조회수 OOO만").

맨 위 카드의 youtube_id 로 `watch/<youtube_id>/index.html` 을 열면 제품명(`product-name`)이 있다. **제품명 1개와 조회수를 기록해둔다.**

목적지 slug 매핑은 `js/slugs.js` 의 `DESTINATION_SLUGS` 참고.

## 3. 카피 쓰기

**헤드라인** 10~16자 한 줄 후킹. 예: `그 동전 지갑, 진짜 있었다`
**보조문구** 짧은 한 줄. 예: `조회수 OOO만 쇼츠템`

### 모든 채널 공통 원칙

- 실제 조회수를 넣어 신뢰도를 준다. "조회수 OOO만 찍은 쇼츠에 나온"
- **판매·구매 유도 금지.** "구매처 확인하세요", "여기서 사세요" 안 쓴다. 대신 "어떤 건지 링크에서 확인해보세요" 처럼 정보 제공 톤으로. 원작자 수익을 가로채는 느낌을 주지 않기 위한 원칙이니 꼭 지킨다.

### 3-1. 스레드 (2~4문장)

**이 텍스트가 실제로 스레드에 자동 게시되는 본문이다.** `pending-post.json` 의 `threads_text` 로 그대로 들어간다.

- 캐주얼한 후킹으로 시작(질문형이나 "~적 있나요?")
- 본문에 이 URL을 그대로 포함: `https://shortsbox.kr/?utm_source=threads&utm_medium=social`
- 이모지 1~2개, 전체 500자 이내

### 3-2. 인스타그램 (2~4문장 + 해시태그 줄)

- 첫 줄 후킹, 이어서 짧은 설명. 스레드보다 정보 요약형
- **raw URL 을 쓰지 않는다.** 인스타는 캡션 링크를 클릭 가능하게 안 만든다. 마지막 줄은 `🔗 프로필 링크에서 확인해보세요` 로 마무리. 실제 링크(`utm_source=instagram`)는 프로필 bio 에 걸어두는 게 전제이고, 이건 최종 보고에 참고로만 언급한다
- 해시태그 5~8개를 별도 줄로. 예: `#도쿄여행 #여행꿀템 #여행준비물 #일본여행 #여행스타그램`

### 3-3. X (1~2문장)

- 더 짧고 위트있게. 반말 섞은 구어체 허용("~함", "~ㄱㄱ")
- 본문에 포함: `https://shortsbox.kr/?utm_source=x&utm_medium=social`
- 이모지 1개, 해시태그는 없거나 최대 1개

### 3-4. 카카오톡 오픈채팅 (2~3줄)

- 친구한테 톡 보내듯 친근한 구어체
- 본문에 포함: `https://shortsbox.kr/?utm_source=kakao&utm_medium=social`
- 이모지 1~2개

### 3-5. 디시인사이드 여행갤러리 (제목 + 본문 분리)

- **제목**: 질문형이나 "~함?ㅋㅋ" 같은 디시 톤. 광고 느낌이 절대 안 나게, 실제 유저 후기·질문처럼
- **본문**: 2~3문장 반말. 조회수는 자연스럽게 녹인다("조회수 OOO만 찍은 쇼츠 보니까 다들 챙기더라")
- 끝에 포함: `https://shortsbox.kr/?utm_source=dcinside&utm_medium=social`
- 광고·구매 유도 절대 금지. 디시는 광고 냄새 나면 삭제·제재 대상이다. "그냥 발견한 정보 공유하는 유저" 느낌으로
- 최종 보고에 `디시 갤러리는 규정상 삭제·제재될 수 있으니 처음 몇 번은 직접 확인하며 올리는 걸 권장` 한 줄 포함

---

## 4. 카드 이미지 생성

먼저 `npm install`. `node_modules` 는 커밋돼 있지 않아 매번 새로 받아야 한다(`@napi-rs/canvas` 가 devDependencies 에 있다).

```bash
node scripts/generate-daily-card.js <slug> "<헤드라인>" "<보조문구>"
```

결과: `assets/card-news/daily-<slug>-<YYYY-MM-DD>.png` (UTC 기준)

### 알려진 렌더링 버그

실행 전에 `scripts/generate-daily-card.js` 를 Read 로 확인하고, 아래가 남아 있으면 고쳐서 실행한다. 이미 패치돼 있으면 손대지 않는다.

**(a) Supabase 조회 실패** — destinations 테이블 조회는 항상 실패한다고 보고 try/catch 로 감싼다. 실패 시 로컬 폴백을 쓴다.

```
jeju:제주/🍊  osaka:오사카/🏯  tokyo:도쿄/🗼  bangkok:방콕/🛺  danang:다낭/☕
chiangmai:치앙마이/🐘  paris:파리/🥐  switzerland:스위스/🧀  bali:발리/🌴  hawaii:하와이/🌺
```

국기처럼 여러 코드포인트가 합쳐지는 이모지는 렌더러에서 깨지니 피한다.

**(b) 이모지가 빈 네모로 나옴** — `@napi-rs/canvas` 가 "Segoe UI Emoji" 를 못 찾는 것이다. `GlobalFonts.registerFromPath('/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', 'Noto Color Emoji')` 로 명시 등록하고, 이모지를 그리는 곳(sticker, pill)의 font 를 그 패밀리로 바꾼다. pill 처럼 이모지와 한글을 같이 그리는 곳은 한 `fillText` 에 섞지 말고 따로 그린다.

## 5. 헬스체크

PNG 가 실제로 생겼고 0바이트가 아닌지 확인하고, **Read 로 열어서 헤드라인과 이모지가 안 깨졌는지 눈으로 본다.**

실패했으면 이후 단계(커밋·텔레그램)를 전부 건너뛰고 최종 보고 첫 줄에 `⚠️ 실패` 를 크게 적고 어느 단계에서 무슨 에러인지 정확히 쓴다. **절대 실패를 성공처럼 보고하지 않는다.**

---

## 6. 커밋

이미지가 공개 URL로 접근돼야 스레드 게시가 된다. 그래서 반드시 커밋한다.

```bash
git config user.email "noreply@anthropic.com"
git config user.name "shortsbox cardnews"
git add assets/card-news/daily-<slug>-<날짜>.png automation/pending-post.json
git commit -m "카드뉴스 자동 생성 및 게시 대기 (날짜)"
git push
```

> **개인 토큰(PAT)을 쓰지 마라.** GitHub 쓰기는 **Claude GitHub App** 이 담당한다. 2026-08-06 확인: PAT 는 어떤 URL 형식으로도 403 이고 REST Contents API 와 GitHub MCP 도 같다. 프록시가 이렇게 답한다 — *"Write access to this GitHub API path is not permitted through this proxy."* 읽기만 통과한다.

push 가 거부되면 `git pull --rebase` 후 한 번만 재시도한다.

push 후 1~2분이면 `https://shortsbox.kr/assets/card-news/daily-<slug>-<날짜>.png` 로 공개된다.

`pending-post.json` 구조:

```json
{
  "status": "pending",
  "date": "YYYY-MM-DD",
  "destination_slug": "<slug>",
  "destination_name": "<이모지+이름, 예: 🥐 파리>",
  "headline": "<헤드라인>",
  "subline": "<보조문구>",
  "image_path": "assets/card-news/daily-<slug>-<날짜>.png",
  "image_url": "https://shortsbox.kr/assets/card-news/daily-<slug>-<날짜>.png",
  "threads_text": "<3-1 스레드 캡션 전문>",
  "telegram_anchor_message_id": null,
  "last_update_id": null,
  "attempt_count": 0
}
```

---

## 7. 텔레그램 전송 — 버튼을 단다

`$TELEGRAM_BOT_TOKEN`, `$TELEGRAM_CHAT_ID` 를 쓴다. 비어 있으면 이 단계를 건너뛰고 보고에 적는다.

### 7-1. 카드 + 승인 버튼

**사용자가 "승인"이라고 타이핑하게 하지 않는다.** 버튼을 누르면 된다.

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendPhoto" \
  -F chat_id="$TELEGRAM_CHAT_ID" \
  -F photo=@<PNG 경로> \
  -F caption="오늘의 목적지: <이모지+이름> — 쇼츠박스 카드뉴스

아래 버튼으로 정해주세요." \
  -F reply_markup='{"inline_keyboard":[[{"text":"✅ 스레드 게시","callback_data":"sb_approve"},{"text":"✖ 건너뛰기","callback_data":"sb_reject"}]]}'
```

응답의 `result.message_id` 를 **반드시 기록**한다(python3 로 JSON 파싱 권장). 이걸 `pending-post.json` 의 `telegram_anchor_message_id` 에 채워 넣고 다시 커밋·push 한다(작은 추가 커밋 하나 더 생겨도 괜찮다).

**이 message_id 가 핵심이다.** 승인 루틴이 "어느 카드에 대한 버튼인지"를 이걸로 판단한다.

### 7-2. 채널별 캡션 전송

아래 8번 최종 보고와 같은 텍스트를 저장소 밖 임시 디렉토리에 파일로 쓰고 그대로 보낸다.

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -F chat_id="$TELEGRAM_CHAT_ID" -F text=<캡션모음.txt
```

각 응답이 `{"ok":true` 인지 확인한다. 실패하면 보고에 에러를 정확히 남긴다.

### 7-3. SendUserFile

생성된 PNG 를 `status: "proactive"` 로 사용자에게 전달한다.

---

## 8. 최종 보고

사용자가 바로 복사해 쓸 수 있게 채널별로 구분해서 남긴다.

- 오늘의 목적지
- 이미지 전달 사실 + `텔레그램 카드의 버튼을 누르면 15분 이내에 스레드에 게시됩니다` 안내
- **[스레드용]** 캡션 전문 (utm_source=threads)
- **[인스타그램용]** 캡션 + 해시태그 (프로필 링크 안내 포함)
- **[X용]** 캡션 전문 (utm_source=x)
- **[카카오톡용]** 캡션 전문 (utm_source=kakao)
- **[디시인사이드용]** 제목 + 본문 (utm_source=dcinside) + 규정 확인 권장 한 줄

한국어로 작업한다.
