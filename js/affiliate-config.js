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

function getAgodaUrl(destination){
  const cityName = AGODA_CITY_NAME[destination.id] || destination.name;
  const params = new URLSearchParams({
    cid: AGODA_CID,
    text: cityName,
  });
  return `https://www.agoda.com/ko-kr/search?${params.toString()}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AGODA_CID, AGODA_CITY_NAME, getAgodaUrl };
}
