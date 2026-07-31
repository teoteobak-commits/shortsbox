-- 제품 큐레이션 확대 3차: /watch 스킬로 영상 3개 추가 분석.
-- 마찬가지로 영상 속 정확한 브랜드가 아니라 유사 상품으로 이름 일반화.

insert into products (youtube_id, name, price, store) values
  -- Wg0GKLZsLQQ: 꼭 사야 하는 일본 돈키호테 추천템 7가지 — 투현커플
  ('Wg0GKLZsLQQ', '휴대용 쿨링 바디 미스트', null, '쿠팡'),
  ('Wg0GKLZsLQQ', '액체 탈취 스틱(화장실용)', null, '쿠팡'),
  ('Wg0GKLZsLQQ', '구취 제거 캡슐/츄잉캔디', null, '쿠팡'),
  ('Wg0GKLZsLQQ', '극세모 칫솔', null, '쿠팡'),
  ('Wg0GKLZsLQQ', '휴대용 얼룩 제거 티슈', null, '쿠팡'),
  ('Wg0GKLZsLQQ', '섬유향수 스프레이', null, '쿠팡'),

  -- sCo6gqOOVnk: 베트남 여행 추천 쇼핑리스트 11가지 — 여행어때
  ('sCo6gqOOVnk', '베트남 커피(믹스/원두)', null, '쿠팡'),
  ('sCo6gqOOVnk', '카푸치노 커피 캔디', null, '쿠팡'),
  ('sCo6gqOOVnk', '망고 젤리/과일 젤리', null, '쿠팡'),
  ('sCo6gqOOVnk', '베트남 쌀국수 컵누들', null, '쿠팡'),
  ('sCo6gqOOVnk', '무설탕 말린 과일칩', null, '쿠팡'),

  -- iWgQCHmvoDo: 약사추천 일본 여행꿀템약 19가지 1편 — 바른약
  ('iWgQCHmvoDo', '자양강장 드링크(에너지음료)', null, '쿠팡'),
  ('iWgQCHmvoDo', '마그네슘 영양제(변비완화)', null, '쿠팡'),
  ('iWgQCHmvoDo', '간 건강 영양제', null, '쿠팡'),
  ('iWgQCHmvoDo', '눈 영양제(루테인)', null, '쿠팡'),
  ('iWgQCHmvoDo', '다기능 눈 영양 안약', null, '쿠팡')
on conflict do nothing;
