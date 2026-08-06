/* 제휴 링크 설정 — 아고다 파트너 CID 발급받으면 아래 값만 채워 넣으면 된다.
   발급: https://partners.agoda.com 가입 → 대시보드에서 CID 확인 */
const AGODA_CID = '1970058';

/* 아고다는 한글 도시명 검색이 불안정해서, 도시별 영문명으로 매핑해서 링크를 만든다 */
const AGODA_CITY_NAME = {
  1: 'Jeju',
  2: 'Osaka',
  3: 'Tokyo',
  4: 'Bangkok',
  5: 'Da Nang',
  6: 'Chiang Mai',
  7: 'Paris',
  8: 'Switzerland',
  9: 'Bali',
  10: 'Hawaii',
  11: 'Fukuoka',
  12: 'Nha Trang',
  13: 'Taipei',
  14: 'Cebu',
  15: 'Hong Kong',
  16: 'Sapporo',
  17: 'Okinawa',
  18: 'Singapore',
  19: 'Guam',
  20: 'Shanghai',
};

/* 세시간전(3hoursahead) 제휴 플랫폼으로 발급받은 실제 추적 링크 —
   아고다 파트너스 직접 승인(대기 중)보다 먼저 뚫려서 우선 사용.
   승인 안 된 여행지가 있으면 아래에서 자동으로 예전 방식(직접 CID)으로 대체된다. */
const AGODA_AFFILIATE_LINKS = {
  1: 'https://3ha.in/r/580833',
  2: 'https://3ha.in/r/580834',
  3: 'https://3ha.in/r/580831',
  4: 'https://3ha.in/r/580835',
  5: 'https://3ha.in/r/580836',
  6: 'https://3ha.in/r/580838',
  7: 'https://3ha.in/r/580839',
  8: 'https://3ha.in/r/580840',
  9: 'https://3ha.in/r/580845',
  10: 'https://3ha.in/r/580846',
  11: 'https://3ha.in/r/596474', // 후쿠오카
  12: 'https://3ha.in/r/596476', // 나트랑
  13: 'https://3ha.in/r/596479', // 타이베이
  14: 'https://3ha.in/r/596496', // 세부
  15: 'https://3ha.in/r/596499', // 홍콩
  16: 'https://3ha.in/r/596502', // 삿포로
  17: 'https://3ha.in/r/596512', // 오키나와
  18: 'https://3ha.in/r/596522', // 싱가포르
  19: 'https://3ha.in/r/596541', // 괌
  20: 'https://3ha.in/r/596536', // 상하이
};

function getAgodaUrl(destination){
  if(AGODA_AFFILIATE_LINKS[destination.id]) return AGODA_AFFILIATE_LINKS[destination.id];

  const cityName = AGODA_CITY_NAME[destination.id] || destination.name;
  const params = new URLSearchParams({
    cid: AGODA_CID,
    text: cityName,
  });
  return `https://www.agoda.com/ko-kr/search?${params.toString()}`;
}

/* 클룩(Klook) 투어&액티비티 제휴 링크(세시간전) — 목적지별 "여행지 둘러보기" 개요 페이지로 연결.
   제주(콘텐츠 성격 안 맞음)와 하와이(클룩에 해당 지역 개요 페이지 없음)는 의도적으로 없음 —
   getKlookUrl은 이 경우 null을 반환하고, 호출부에서 배너 자체를 숨긴다. */
const KLOOK_AFFILIATE_LINKS = {
  2: 'https://3ha.in/r/592177', // 오사카
  3: 'https://3ha.in/r/592175', // 도쿄
  4: 'https://3ha.in/r/592179', // 방콕
  5: 'https://3ha.in/r/592182', // 다낭
  6: 'https://3ha.in/r/592184', // 치앙마이
  7: 'https://3ha.in/r/592190', // 파리
  8: 'https://3ha.in/r/592194', // 스위스
  9: 'https://3ha.in/r/592197', // 발리
};

function getKlookUrl(destination){
  return KLOOK_AFFILIATE_LINKS[destination.id] || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AGODA_CID, AGODA_CITY_NAME, AGODA_AFFILIATE_LINKS, getAgodaUrl, KLOOK_AFFILIATE_LINKS, getKlookUrl };
}
