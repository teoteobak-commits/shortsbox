-- 제품 큐레이션 확대 13차: /watch 스킬로 영상 6개 검토, 3개에서 신규 아이템 추가
-- (다낭 시장 팁 영상, 지수 파리 명품룩 영상, 발리 맥주/중복템 영상은 건너뜀).

insert into products (youtube_id, name, price, store) values
  -- buyp9UQ8SuQ: 발리 여행 무조건 사 와야 하는 쇼핑리스트 — 타이거투어
  ('buyp9UQ8SuQ', '그래픽 프린트 후드티', null, '쿠팡'),
  ('buyp9UQ8SuQ', '천연 보디워시/오일 세트(식물성)', null, '쿠팡'),
  ('buyp9UQ8SuQ', '립틴트', null, '쿠팡'),

  -- SOI3msWyJV4: 물가 비싼 스위스에서 꼭 사야하는 아이템 — 긴동효
  ('SOI3msWyJV4', '스위스 브랜드 주방용 과도 세트', null, '쿠팡'),
  ('SOI3msWyJV4', '냉장고 자석(여행 기념품)', null, '쿠팡'),

  -- 0HLvb5rYLBE: 프랑스 약국에 가면 반드시 사야하는 아이템 — 트레비앙
  ('0HLvb5rYLBE', '프랑스 약국 스킨케어 오일', null, '쿠팡')
on conflict do nothing;
