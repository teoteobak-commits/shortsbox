-- 제품 큐레이션 확대 11차: /watch 스킬로 영상 4개 추가 분석
-- (발리 브랜드 하울 영상 1개는 기존 큐레이션과 중복돼 건너뜀).

insert into products (youtube_id, name, price, store) values
  -- Biu1-Wxp718: [조용한]발리 쇼핑리스트 11가지 — 주르네
  ('Biu1-Wxp718', '인도네시아 컵볶음면(미고랭맛)', null, '쿠팡'),
  ('Biu1-Wxp718', '바틱 패턴 사롱(대형 스카프)', null, '쿠팡'),
  ('Biu1-Wxp718', '발리 프린트 티셔츠', null, '쿠팡'),

  -- jviFD7dzVTs: [스위스여행] 스위스에 가면 사와야 할 것 — 여행에미치다
  ('jviFD7dzVTs', '스위스 초콜릿(린트/토블론 스타일)', null, '쿠팡'),
  ('jviFD7dzVTs', '멀티툴 캠핑 나이프', null, '쿠팡'),
  ('jviFD7dzVTs', '업사이클링 방수 가방', null, '쿠팡'),
  ('jviFD7dzVTs', '스위스 스타일 손목시계', null, '쿠팡'),

  -- KPtyPBThnG8: 현지인이 추천하는 핫템 방콕여행 — 하이짐니
  ('KPtyPBThnG8', '태국식 쿨링 스프레이(땀띠/열감 완화)', null, '쿠팡'),

  -- nmw154h4lks: 발리 추천 쇼핑리스트 — 초리 CHORI
  ('nmw154h4lks', '티크 원목 찻잔/그릇 세트', null, '쿠팡'),
  ('nmw154h4lks', '서핑 브랜드 그래픽 티셔츠', null, '쿠팡')
on conflict do nothing;
