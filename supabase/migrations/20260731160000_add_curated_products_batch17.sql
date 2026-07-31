-- 제품 큐레이션 확대 17차: /watch 스킬로 영상 6개 검토, 4개에서 신규 아이템 추가
-- (스위스 시계/다낭 샤워필터 영상은 기존 큐레이션과 중복돼 건너뜀).

insert into products (youtube_id, name, price, store) values
  -- 3tA655uEmRs: 스위스에서 사야되는 아이템 아홉가지 — 정보좀
  ('3tA655uEmRs', '알프스 허브차', null, '쿠팡'),

  -- sOjlIAwny1k: 하와이 수영할 때 챙기는 것들 — 슬기의 어떤날
  ('sOjlIAwny1k', '접이식 비치매트(돗자리)', null, '쿠팡'),

  -- ZKMEFvJa1xQ: 파리 여행에서 놓치면 아쉬운 쇼핑 아이템 — 세가지 비밀을 찾아서
  ('ZKMEFvJa1xQ', '블랙 클레이 마스크팩', null, '쿠팡'),
  ('ZKMEFvJa1xQ', '프랑스산 나이프 세트(주방칼)', null, '쿠팡'),

  -- vRKxykTdgmU: 하와이 ABC스토어에서 절대 놓치면 안 되는 — trip heeya
  ('vRKxykTdgmU', '캐릭터 키링(하와이 기념품)', null, '쿠팡')
on conflict do nothing;
