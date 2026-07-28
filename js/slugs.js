/* 여행지 id ↔ slug 매핑. 브라우저(<script> 전역)와 Node(빌드 스크립트의 require) 양쪽에서 사용 */
const DESTINATION_SLUGS = {
  1: 'jeju',
  2: 'osaka',
  3: 'tokyo',
  4: 'bangkok',
  5: 'danang',
  6: 'chiangmai',
  7: 'paris',
  8: 'switzerland',
  9: 'bali',
  10: 'hawaii',
};

/* 여행지 대표 공항 IATA 코드 — 카드/상세 페이지에 탑승권 스타일 표기용 */
const DESTINATION_AIRPORT = {
  1: 'CJU',
  2: 'KIX',
  3: 'NRT',
  4: 'BKK',
  5: 'DAD',
  6: 'CNX',
  7: 'CDG',
  8: 'ZRH',
  9: 'DPS',
  10: 'HNL',
};

function destinationSlug(id){
  return DESTINATION_SLUGS[id] || `id-${id}`;
}

function destinationAirport(id){
  return DESTINATION_AIRPORT[id] || '???';
}

/* 매핑에 없는 슬러그는 없다고 본다 — 새 여행지 추가 시 위 맵에도 슬러그를 등록해야 함 */
function destinationIdFromSlug(slug){
  const entry = Object.entries(DESTINATION_SLUGS).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}

function destinationUrl(d){
  return `/travel/${destinationSlug(d.id)}/`;
}

function videoUrl(s){
  return `/watch/${s.youtubeId}/`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DESTINATION_SLUGS, DESTINATION_AIRPORT, destinationSlug, destinationAirport, destinationIdFromSlug, destinationUrl, videoUrl };
}
