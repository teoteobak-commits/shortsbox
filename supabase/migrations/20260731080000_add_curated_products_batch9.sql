-- 제품 큐레이션 확대 9차: /watch 스킬로 영상 6개 추가 분석
-- (베트남 유심칩 영상은 물리적 상품이 아니라 건너뜀, 일부 영상은
--  기존 큐레이션과 중복되는 항목만 있어 일부만 추가함).

insert into products (youtube_id, name, price, store) values
  -- GAYVIkEoLz4: 발리 가면 꼭 사오는 쇼핑리스트 — 러블리쭈
  ('GAYVIkEoLz4', '원목 우드 트레이(다양한 사이즈)', null, '쿠팡'),
  ('GAYVIkEoLz4', '헤어 오일 비타민 캡슐', null, '쿠팡'),
  ('GAYVIkEoLz4', '라탄 가방', null, '쿠팡'),
  ('GAYVIkEoLz4', '라탄 목걸이/팔찌(수공예 액세서리)', null, '쿠팡'),

  -- J3doH5dJ-Lk: 베트남 다낭여행 필수준비물 3가지 — EDTV
  ('J3doH5dJ-Lk', '바퀴벌레/개미 살충 스프레이(휴대용)', null, '쿠팡'),
  ('J3doH5dJ-Lk', '필터 샤워헤드', null, '쿠팡'),

  -- mP_xlH9WBVg: 발리 여행가면 하나씩 사온다는 그 가방 — 버블리
  ('mP_xlH9WBVg', '캐주얼 슬링백(크로스백)', null, '쿠팡'),
  ('mP_xlH9WBVg', '미니 크로스백(파우치형)', null, '쿠팡'),

  -- AzlB9itzhj4: 태국 쇼핑템 추천리스트 — 영서 Youngseo
  ('AzlB9itzhj4', '프로폴리스 목스프레이', null, '쿠팡'),
  ('AzlB9itzhj4', '헤어 트리트먼트(태국식)', null, '쿠팡'),
  ('AzlB9itzhj4', '글루타치온 미백 로션', null, '쿠팡'),

  -- 38_NDhcZ-SA: 태국 여행 국룰 패션 아이템 — 윤 제주삶
  ('38_NDhcZ-SA', '화이트 베이직 탱크탑', null, '쿠팡')
on conflict do nothing;
