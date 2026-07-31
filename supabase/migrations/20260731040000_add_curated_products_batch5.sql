-- 제품 큐레이션 확대 5차: /watch 스킬로 영상 4개 추가 분석
-- (럭셔리 브랜드 하울 영상 1개는 큐레이션 모델과 안 맞아 건너뜀).
-- 마찬가지로 영상 속 정확한 브랜드가 아니라 유사 상품으로 이름 일반화.

insert into products (youtube_id, name, price, store) values
  -- fVyh8q5hFt8: 베트남 여행 기념품 쇼핑리스트 추천 — 여행하마
  ('fVyh8q5hFt8', '코끼리 무늬 하렘팬츠', null, '쿠팡'),
  ('fVyh8q5hFt8', '라탄 가방', null, '쿠팡'),
  ('fVyh8q5hFt8', '캐슈넛', null, '쿠팡'),
  ('fVyh8q5hFt8', '여드름 트러블 진정 크림', null, '쿠팡'),
  ('fVyh8q5hFt8', '아티초크 추출물 영양제', null, '쿠팡'),

  -- WFiDnPHyRL8: 현지인이 추천하는 일본 쇼핑리스트 7가지 — 리짜리짜
  ('WFiDnPHyRL8', '체지방 감소 유산균 음료', null, '쿠팡'),
  ('WFiDnPHyRL8', '초코 스틱 과자', null, '쿠팡'),
  ('WFiDnPHyRL8', '곤약 과일 젤리', null, '쿠팡'),
  ('WFiDnPHyRL8', '보리새싹 분말 청즙', null, '쿠팡'),

  -- uk1yHqQmYXg: 일본여행 쇼핑 드럭스토어 쇼핑 추천 아이템 — 달콤한강군
  ('uk1yHqQmYXg', '화장실용 액체 방향제(한방울형)', null, '쿠팡'),
  ('uk1yHqQmYXg', '콩물 성분 아이크림', null, '쿠팡'),
  ('uk1yHqQmYXg', '콜라겐 젤리(뷰티드링크)', null, '쿠팡'),
  ('uk1yHqQmYXg', 'SPF50 UV 미스트 선크림', null, '쿠팡'),

  -- x6x2leOAPzo: 일본 마트 필수 쇼핑 추천템 — 트리플
  ('x6x2leOAPzo', '계란덮밥용 특제 간장소스', null, '쿠팡'),
  ('x6x2leOAPzo', '일본식 카레 루(고형카레)', null, '쿠팡'),
  ('x6x2leOAPzo', '스시용 맛초(조미식초)', null, '쿠팡')
on conflict do nothing;
