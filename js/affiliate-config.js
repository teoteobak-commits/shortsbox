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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AGODA_CID, AGODA_CITY_NAME, AGODA_AFFILIATE_LINKS, getAgodaUrl };
}
