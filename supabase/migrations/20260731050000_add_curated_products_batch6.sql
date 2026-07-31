-- 제품 큐레이션 확대 6차: /watch 스킬로 영상 5개 추가 분석.
-- 마찬가지로 영상 속 정확한 브랜드가 아니라 유사 상품으로 이름 일반화.
-- (다이소 엔화 동전지갑/파스모 앱/트래블로그 카드는 기존 큐레이션과 중복되거나
--  물리적 구매 대상이 아니라 건너뜀)

insert into products (youtube_id, name, price, store) values
  -- srdbXMcEozc: 일본여행에서 가장 잘 쓴 아이템들 — 영민 minmin
  ('srdbXMcEozc', '접이식 보스턴백(여행가방)', null, '쿠팡'),
  ('srdbXMcEozc', '여행용 메쉬 파우치(캐리어 정리용)', null, '쿠팡'),
  ('srdbXMcEozc', '액세서리 정리용 미니파우치', null, '쿠팡'),
  ('srdbXMcEozc', 'LED 잔량표시 보조배터리', null, '쿠팡'),

  -- gdy9DgHBYtY: 베트남 다낭 여행 한시장 추천 쇼핑리스트 — 여행어때
  ('gdy9DgHBYtY', '라탄 가방', null, '쿠팡'),
  ('gdy9DgHBYtY', '라탄 모자', null, '쿠팡'),
  ('gdy9DgHBYtY', '냉장고 바지(무늬 홈웨어 바지)', null, '쿠팡'),
  ('gdy9DgHBYtY', '기본 나시(민소매) 티셔츠', null, '쿠팡'),

  -- enIVg9mK064: 안사면 후회하는 베트남 추천 쇼핑리스트 9가지 — 여행어때
  ('enIVg9mK064', '패션후르츠 원액/시럽', null, '쿠팡'),
  ('enIVg9mK064', '베트남 칠리소스', null, '쿠팡'),
  ('enIVg9mK064', '치즈롤 과자', null, '쿠팡'),

  -- dehphwm-amk: 여행 전 비행기 탈 때 꼭 챙겨야 할 기내 필수템 — 켜나 KYUNA
  ('dehphwm-amk', '수분 가습 마스크(기내용)', null, '쿠팡'),
  ('dehphwm-amk', '온열 아이마스크(눈찜질)', null, '쿠팡'),
  ('dehphwm-amk', '오버나잇 립 마스크(립밤)', null, '쿠팡'),

  -- U0NGCRbzEyo: 일본여행 쇼핑 로프트 필수 구매 아이템 — 달콤한강군
  ('U0NGCRbzEyo', '프리미엄 밥주걱(논스틱)', null, '쿠팡'),
  ('U0NGCRbzEyo', '쌀 씻기 전용 실리콘 장갑', null, '쿠팡')
on conflict do nothing;
