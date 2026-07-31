-- 제품 큐레이션 확대 16차: /watch 스킬로 영상 5개 추가 분석.

insert into products (youtube_id, name, price, store) values
  -- aIkjfeU4ytI: 파리지앵이 파리여행 온다면 꼭 추천하는 — daily hyunjung
  ('aIkjfeU4ytI', '프랑스 초콜릿 비스킷(쁘띠 에콜리에 스타일)', null, '쿠팡'),
  ('aIkjfeU4ytI', '초콜릿 카라멜 웨하스', null, '쿠팡'),

  -- 6xm7RIGdIkY: 하와이 기념품 BEST 4 — tinytreetop
  ('6xm7RIGdIkY', '동물 모양 솔트&페퍼 통 세트', null, '쿠팡'),

  -- zEom7NuEZdY: 파리 여행 전에 꼭 저장해야 할 쇼핑 — 에디
  ('zEom7NuEZdY', '크루아상 모양 봉제인형', null, '쿠팡'),
  ('zEom7NuEZdY', '스트라이프 캔버스 에코백', null, '쿠팡'),

  -- NIwnWTfw10s: 파리 여행 가서 사온 현실적인 쇼핑 리스트 — 우드번
  ('NIwnWTfw10s', '가죽 벨트(맞춤형)', null, '쿠팡'),
  ('NIwnWTfw10s', '크루넥 니트 스웨터', null, '쿠팡'),

  -- QauvX8xXXVk: 치앙마이 추천 필수 쇼핑 아이템 TOP10 — 케이케이데이
  ('QauvX8xXXVk', '코코넛 오일(로컬 브랜드)', null, '쿠팡'),
  ('QauvX8xXXVk', '천연 허브 스파 비누', null, '쿠팡'),
  ('QauvX8xXXVk', '코끼리 모티브 수공예 장식품', null, '쿠팡'),
  ('QauvX8xXXVk', '실버 세공 액세서리', null, '쿠팡'),
  ('QauvX8xXXVk', '타이 실크 패브릭', null, '쿠팡'),
  ('QauvX8xXXVk', '모링가 오일', null, '쿠팡'),
  ('QauvX8xXXVk', '태국 전통 커피(드립백/원두)', null, '쿠팡'),
  ('QauvX8xXXVk', '똠얌/쏨땀맛 컵라면', null, '쿠팡')
on conflict do nothing;
