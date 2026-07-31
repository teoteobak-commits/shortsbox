-- 제품 큐레이션 확대 12차: /watch 스킬로 영상 4개 추가 분석.
-- 기존 큐레이션과 중복되는 항목(멀티툴 나이프, 초콜릿, 생수 등)은 건너뜀.

insert into products (youtube_id, name, price, store) values
  -- 9DVWM6qoNrw: 치앙마이에서 꼭 사야하는 기념품 — KevinTrip
  ('9DVWM6qoNrw', '패턴 프린트 버킷햇', null, '쿠팡'),
  ('9DVWM6qoNrw', '코끼리 무늬 파우치', null, '쿠팡'),
  ('9DVWM6qoNrw', '천연 에센셜 오일', null, '쿠팡'),
  ('9DVWM6qoNrw', '핸드메이드 천연 스킨케어 세트', null, '쿠팡'),

  -- tuC1BGo0cZc: 스위스 마트 쇼핑리스트 추천템 정리 — 봉오봉
  ('tuC1BGo0cZc', '파프리카맛 감자칩', null, '쿠팡'),
  ('tuC1BGo0cZc', '소프트 젤리 믹스', null, '쿠팡'),
  ('tuC1BGo0cZc', '비프저키(육포)', null, '쿠팡'),

  -- DU6pY91Si-8: [스위스 여행] 기념품 쇼핑리스트 — Hands-World
  ('DU6pY91Si-8', '프리미엄 립밤', null, '쿠팡'),

  -- S1DAbyYwq2I: 태국 방콕 여행 송크란 축제 치트키 아이템 — Where is 라온
  ('S1DAbyYwq2I', '대용량 물총(축제용)', null, '쿠팡')
on conflict do nothing;
