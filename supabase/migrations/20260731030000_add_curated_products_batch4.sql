-- 제품 큐레이션 확대 4차: /watch 스킬로 영상 2개 추가 분석.
-- 마찬가지로 영상 속 정확한 브랜드가 아니라 유사 상품으로 이름 일반화.

insert into products (youtube_id, name, price, store) values
  -- ry3kJCeyCzU: 일본 옷 쇼핑 여기 매장 꼭 가세요 — 울트라꿀팁 (유니클로/GU 스타일 기본템)
  ('ry3kJCeyCzU', '크루넥 반팔 티셔츠(기본템)', null, '쿠팡'),
  ('ry3kJCeyCzU', '캐주얼 조거 팬츠', null, '쿠팡'),
  ('ry3kJCeyCzU', '집업 후드 스웨트셔츠', null, '쿠팡'),

  -- xZiHHaNOPos: 꿀팁 주우재가 여행할 때 꼭 사용하는 아이템 — 오늘의 주우재
  ('xZiHHaNOPos', '카드+동전 겸용 소형 여행용 지갑', null, '쿠팡')
on conflict do nothing;
