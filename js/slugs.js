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
  11: 'fukuoka',
  12: 'nhatrang',
  13: 'taipei',
  14: 'cebu',
  15: 'hongkong',
  16: 'sapporo',
  17: 'okinawa',
  18: 'singapore',
  19: 'guam',
  20: 'shanghai',
};

/* 카드 배경 사진(assets/destinations/{slug}.jpg)이 실제로 있는 여행지.
   목록에 없으면 사진 대신 브랜드 그라데이션이 깔린다 — 사진을 새로 넣었다면 여기에도 slug를 추가할 것.
   (CSS의 var(--cover-photo, var(--grad)) 폴백은 인라인 스타일이 항상 설정되면 동작하지 않으므로,
    아예 --cover-photo를 넘기지 않는 방식으로 처리한다.) */
const DESTINATIONS_WITH_PHOTO = [
  'jeju', 'osaka', 'tokyo', 'bangkok', 'danang',
  'chiangmai', 'paris', 'switzerland', 'bali', 'hawaii',
];

function destinationSlug(id){
  return DESTINATION_SLUGS[id] || `id-${id}`;
}

/* 카드 배경용 인라인 스타일. 사진이 없으면 빈 문자열을 돌려주어 그라데이션 폴백이 살아나게 한다. */
function coverStyle(id){
  const slug = destinationSlug(id);
  return DESTINATIONS_WITH_PHOTO.includes(slug)
    ? `--cover-photo:url('/assets/destinations/${slug}.jpg')`
    : '';
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
  module.exports = { DESTINATION_SLUGS, DESTINATIONS_WITH_PHOTO, destinationSlug, coverStyle, destinationIdFromSlug, destinationUrl, videoUrl };
}
