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

function destinationSlug(id){
  return DESTINATION_SLUGS[id] || `id-${id}`;
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
  module.exports = { DESTINATION_SLUGS, destinationSlug, destinationIdFromSlug, destinationUrl, videoUrl };
}
