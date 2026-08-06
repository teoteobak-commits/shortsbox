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
   20곳 전부 링크가 있다. 다만 getKlookUrl은 여전히 null을 돌려줄 수 있고(여행지를 새로 추가하면
   그 즉시 이 구멍이 생긴다), 호출부는 그 경우 배너를 숨긴다 — 컨테이너 자체는 항상 렌더링해야 한다.
   컨테이너를 통째로 빼면 클라이언트 하이드레이션이 조용히 깨진다. */
const KLOOK_AFFILIATE_LINKS = {
  1: 'https://3ha.in/r/596726', // 제주
  2: 'https://3ha.in/r/592177', // 오사카
  3: 'https://3ha.in/r/592175', // 도쿄
  4: 'https://3ha.in/r/592179', // 방콕
  5: 'https://3ha.in/r/592182', // 다낭
  6: 'https://3ha.in/r/592184', // 치앙마이
  7: 'https://3ha.in/r/592190', // 파리
  8: 'https://3ha.in/r/592194', // 스위스
  9: 'https://3ha.in/r/592197', // 발리
  10: 'https://3ha.in/r/596725', // 하와이
  11: 'https://3ha.in/r/596634', // 후쿠오카
  12: 'https://3ha.in/r/596647', // 나트랑
  13: 'https://3ha.in/r/596653', // 타이베이
  14: 'https://3ha.in/r/596657', // 세부
  15: 'https://3ha.in/r/596678', // 홍콩
  16: 'https://3ha.in/r/596683', // 삿포로
  17: 'https://3ha.in/r/596688', // 오키나와
  18: 'https://3ha.in/r/596699', // 싱가포르
  19: 'https://3ha.in/r/596716', // 괌
  20: 'https://3ha.in/r/596707', // 상하이
};

function getKlookUrl(destination){
  return KLOOK_AFFILIATE_LINKS[destination.id] || null;
}

/* 쿠팡 검색어 정제.
   products.name은 사람이 읽으라고 붙인 라벨이라 괄호 부연설명("(외화 동전 분류용)")이나
   병기 표기("벨트/스트랩")가 섞여 있는데, 그대로 검색창에 넣으면 결과가 거의 안 나온다.
   화면에 보이는 이름은 그대로 두고 링크를 만들 때만 다듬는다.

   어절 수로 자르지는 않는다. "접이식 대용량 여행 더플백", "휴대용 화장품 소분 용기 세트"처럼
   길어도 그대로 검색이 잘 되는 이름이 대부분이라, 잘라내면 멀쩡한 이름이 오히려 망가진다. */
function coupangSearchQuery(name){
  const cleaned = String(name ?? '')
    .replace(/[（(\[][^）)\]]*[）)\]]/g, ' ')  // 괄호 안 부연설명
    .split(/[\/·]/)[0]                        // "벨트/스트랩" → 앞의 것만
    .replace(/[&+]/g, ' ')                    // 검색창에서 의미 없는 기호
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || String(name ?? '').trim();  // 통째로 괄호였던 경우 원본으로 되돌림
}

/* 추적 링크(coupang_url)가 있으면 그걸 쓰고, 없으면 정제한 이름으로 검색 링크를 만든다.
   주의: 검색 링크는 파트너스 추적 링크가 아니라 수수료가 붙지 않는다 —
   coupang_url을 채우는 게 본 해결책이고 이건 그때까지의 임시 경로다(coupang-link-todo.md). */
function getCoupangUrl(product){
  const direct = product.coupang_url || product.coupangUrl;
  if (direct && String(direct).trim()) return String(direct).trim();
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(coupangSearchQuery(product.name))}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AGODA_CID, AGODA_CITY_NAME, AGODA_AFFILIATE_LINKS, getAgodaUrl, KLOOK_AFFILIATE_LINKS, getKlookUrl, coupangSearchQuery, getCoupangUrl };
}
