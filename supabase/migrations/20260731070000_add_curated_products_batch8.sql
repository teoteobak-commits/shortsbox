-- 제품 큐레이션 확대 8차: /watch 스킬로 영상 3개 추가 분석.
-- 마찬가지로 영상 속 정확한 브랜드가 아니라 유사 상품으로 이름 일반화
-- (기존 큐레이션과 중복되는 항목·럭셔리 디자이너 브랜드 단품은 건너뜀).

insert into products (youtube_id, name, price, store) values
  -- 1fPZT7-mWy4: 이효리 인스타 속 스위스 여행룩 아이템들 — 패션선도부
  ('1fPZT7-mWy4', '코듀로이 미니스커트', null, '쿠팡'),
  ('1fPZT7-mWy4', '블랙 카라 원피스(휴양지룩)', null, '쿠팡'),
  ('1fPZT7-mWy4', '로고 볼캡', null, '쿠팡'),

  -- n-dUgOGAnDA: 오직 도쿄에서만 구매가능한 힙한 기념품 — 사히
  ('n-dUgOGAnDA', '브랜드 콜라보 머그컵', null, '쿠팡'),
  ('n-dUgOGAnDA', '스트리트웨어 그래픽 티셔츠', null, '쿠팡'),
  ('n-dUgOGAnDA', '디자이너 볼캡', null, '쿠팡'),
  ('n-dUgOGAnDA', '브랜드 콜라보 드링크웨어 세트', null, '쿠팡'),

  -- UGqLdN9MUGs: 일본여행 쇼핑 추천 아이템 — 봄솔하루
  ('UGqLdN9MUGs', '바나나 크림 카스테라', null, '쿠팡'),
  ('UGqLdN9MUGs', '일본식 팥 도라야키', null, '쿠팡'),
  ('UGqLdN9MUGs', '초콜릿 코팅 감자칩', null, '쿠팡'),
  ('UGqLdN9MUGs', '일본식 야키소바 컵면', null, '쿠팡')
on conflict do nothing;
