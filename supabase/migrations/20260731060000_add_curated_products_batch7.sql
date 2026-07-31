-- 제품 큐레이션 확대 7차: /watch 스킬로 영상 3개 추가 분석
-- (스위스 액티비티 영상, 제주 면세점 위스키 영상 2개는 큐레이션 모델과
--  안 맞아 건너뜀 — 쇼핑 콘텐츠 아님/주류라 온라인 판매 제약).
-- 마찬가지로 영상 속 정확한 브랜드가 아니라 유사 상품으로 이름 일반화.

insert into products (youtube_id, name, price, store) values
  -- XhIxJk0Vl24: 프랑스 여행 쇼핑리스트 기념품 이거 꼭 사세요 — 여행하마
  ('XhIxJk0Vl24', '프랑스식 감기약(발포정)', null, '쿠팡'),
  ('XhIxJk0Vl24', '프랑스 홍차/녹차 틴', null, '쿠팡'),
  ('XhIxJk0Vl24', '밤 크림잼(마롱글라세 스프레드)', null, '쿠팡'),
  ('XhIxJk0Vl24', '프랑스풍 꽃무늬 도자기 접시', null, '쿠팡'),

  -- qL92rirXfq4: 태국 방콕 쇼핑리스트 TOP12 (feat.빅씨마트) — 리뷰하자매
  ('qL92rirXfq4', '옥수수맛 젤리', null, '쿠팡'),
  ('qL92rirXfq4', '건조 딸기칩', null, '쿠팡'),
  ('qL92rirXfq4', '타이티 믹스(태국 밀크티 분말)', null, '쿠팡'),
  ('qL92rirXfq4', '초코바나나맛 스틱 과자', null, '쿠팡'),

  -- RlUXxYAxQJQ: [수수료 발생] 무조건 챙기는 쿠팡 여행 준비물 — 딩굴다현
  ('RlUXxYAxQJQ', '미니 크로스 슬링백', null, '쿠팡'),
  ('RlUXxYAxQJQ', '휴대용 전기 미니 포트(다용도 조리기)', null, '쿠팡'),
  ('RlUXxYAxQJQ', '벌레 기피 스프레이(모기퇴치)', null, '쿠팡'),
  ('RlUXxYAxQJQ', '대용량 가죽 화장품 파우치', null, '쿠팡')
on conflict do nothing;
