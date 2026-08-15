/* 카드뉴스가 쓰는 "오늘"은 한국시간 기준이다.

   왜 이 파일이 있나:
   예전에는 build-daily-post.js(로테이션 여행지 + pending-post 의 date)와
   generate-daily-card.js(PNG 파일명)가 각자 UTC 날짜를 계산했다. 워크플로우 cron 이
   23:04 UTC — 자정까지 56분밖에 안 남은 시각이라, GitHub 공유 러너가 그보다 오래
   밀리면 UTC 날짜가 넘어가 다음 날 슬롯을 미리 먹어버렸다.

   실제로 그랬다: 8/13 23:04 예약이 6시간 13분 늦게 8/14T05:17Z 에 돌면서
   daily-paris-2026-08-14.png 를 만들었고, 정시에 돈 8/14T23:55Z 실행은 같은 UTC
   날짜라 "변경 없음" 으로 끝났다. 워크플로우는 success 로 찍혔지만 한국시간 8/15
   아침에 사용자가 받은 건 전날과 똑같은 카드였다.

   한국시간으로 재면 08:04 에 도는 작업이 그날 자정까지 15시간 56분의 여유를 갖는다.
   지금까지 관측된 최대 지연(6시간)의 두 배가 넘는다.

   두 스크립트가 같은 함수를 부르게 해서 파일명과 date 필드가 어긋날 수 없게 한다. */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/* now(UTC) 를 한국시간으로 옮긴 뒤 UTC 게터로 읽는다.
   Date 객체 자체에는 타임존이 없으므로 이게 오프셋을 적용하는 표준적인 방법이다. */
function kstDate(now = new Date()) {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const start = Date.UTC(kst.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - start) / 86400000);
  return { dateIso: kst.toISOString().slice(0, 10), dayOfYear };
}

module.exports = { kstDate };
