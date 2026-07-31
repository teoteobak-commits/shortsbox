-- 제품 큐레이션 확대 18차: /watch 스킬로 영상 6개 검토, 3개에서 신규 아이템 추가
-- (제주 수학여행 단체룩/방콕 곤약젤리 중복/방콕 흔들림 심한 영상은 건너뜀).

insert into products (youtube_id, name, price, store) values
  -- A3yYru2Ez5k: 스위스 마트 추천템 — 니자 Nija
  ('A3yYru2Ez5k', '커리맛 소스 튜브(스위스식)', null, '쿠팡'),
  ('A3yYru2Ez5k', '커리 케첩', null, '쿠팡'),

  -- EVgK6V0j1yY: 파리 여행 기념품 추천(봉마르쉐 식품관) — 파리밥빵걸스
  ('EVgK6V0j1yY', '건조 곰보버섯(모렐버섯)', null, '쿠팡'),
  ('EVgK6V0j1yY', '트러플 감자칩', null, '쿠팡'),
  ('EVgK6V0j1yY', '트러플 선물세트(오일+소금 등)', null, '쿠팡'),

  -- Hsr2FnK0seU: 긴 여행시 필요한 아이템 — 스마트뷰티 이박사
  ('Hsr2FnK0seU', '접이식 휴대용 스테인리스 컵', null, '쿠팡')
on conflict do nothing;
