-- 제품 큐레이션 확대 14차: /watch 스킬로 영상 6개 추가 분석
-- (치앙마이 길거리 신선식품 영상은 건너뜀).

insert into products (youtube_id, name, price, store) values
  -- Ss3JVLR5ZTY: 태국 방콕 여행 선물하기 좋은 쇼핑 리스트 — 링고 Ringo
  ('Ss3JVLR5ZTY', '마카다미아넛', null, '쿠팡'),
  ('Ss3JVLR5ZTY', '롤온 향수(에센셜 오일)', null, '쿠팡'),

  -- lokhMOLpNcY: [미니홈] 하와이 쇼핑하울 — 미니홈
  ('lokhMOLpNcY', '캔버스 에코백(하와이 리조트 스타일)', null, '쿠팡'),

  -- MZNTGGkE9e8: 태국 쇼핑 아이템 추천 하이젠 방향제 — 링고 Ringo
  ('MZNTGGkE9e8', '태국식 섬유향 캡슐 방향제', null, '쿠팡'),

  -- NcmjiyZjyp0: 방콕여행 쇼핑리스트 추천 — 선아씨
  ('NcmjiyZjyp0', '밀크 태블릿 캔디', null, '쿠팡'),
  ('NcmjiyZjyp0', '똠얌쉬림프맛 감자칩', null, '쿠팡'),
  ('NcmjiyZjyp0', '코코넛 보습 페이셜 마스크', null, '쿠팡'),

  -- wK1hOo_ltpc: 미국 하와이 월마트 쇼핑리스트 — 허니문리조트
  ('wK1hOo_ltpc', '하와이안 코나 커피', null, '쿠팡'),
  ('wK1hOo_ltpc', '초콜릿 캐러멜(마카다미아 코팅)', null, '쿠팡'),
  ('wK1hOo_ltpc', '핸드/풋 케어 선물세트', null, '쿠팡'),

  -- qeW2WQ8rDVM: 4박6일 하와이 여행 짐싸기 — 트웜블리Twombly
  ('qeW2WQ8rDVM', '여행용 압축 파우치(옷 압축백)', null, '쿠팡'),
  ('qeW2WQ8rDVM', '미니 화장품 파우치(패브릭)', null, '쿠팡')
on conflict do nothing;
