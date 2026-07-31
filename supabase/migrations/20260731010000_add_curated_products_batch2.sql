-- 제품 큐레이션 확대 2차: /watch 스킬로 영상 5개 추가 분석.
-- 마찬가지로 영상 속 정확한 브랜드가 아니라 유사 상품으로 이름 일반화.

insert into products (youtube_id, name, price, store) values
  -- aqwQJ6a09IM: 여돌들이 핵강추한 '일본 편의점 찐템들' — 패션탐정냥
  ('aqwQJ6a09IM', '일본풍 버터 샌드 쿠키', null, '쿠팡'),
  ('aqwQJ6a09IM', '일본식 돈코츠 컵라면', null, '쿠팡'),

  -- 5a1cZh6okns: 일본여행 N년차의 알짜선물추천 6가지 — 이웃집라이프
  ('5a1cZh6okns', '브랜드 캐릭터 자수 손수건', null, '쿠팡'),
  ('5a1cZh6okns', '휴대용 고체 치약', null, '쿠팡'),

  -- -AIxUudNClg: 10년차 일본 자취생의 돈키호테 필수 쇼핑리스트 — 여행톡톡
  ('-AIxUudNClg', '일본식 컵라면', null, '쿠팡'),
  ('-AIxUudNClg', '김 후리카케 조미료', null, '쿠팡'),
  ('-AIxUudNClg', '휴대용 시트 마스크', null, '쿠팡'),

  -- su4MacHxRJs: 꼭 챙기세요! 다이소 여행 꿀템 6가지 — 진쓰 JINSS
  ('su4MacHxRJs', 'RFID 차단 카드 케이스', null, '쿠팡'),
  ('su4MacHxRJs', '스마트폰 안전 스트랩', null, '쿠팡'),
  ('su4MacHxRJs', '접이식 숄더백', null, '쿠팡'),
  ('su4MacHxRJs', '걸이형 실리콘 소분 용기', null, '쿠팡'),

  -- duejQqWCFds: 여행갈 때 꼭 챙겨야할 패션아이템 5가지 — 미드라이프 GML
  ('duejQqWCFds', '자외선 차단 커버업(반팔/민소매)', null, '쿠팡'),
  ('duejQqWCFds', '휴양지 원피스', null, '쿠팡'),
  ('duejQqWCFds', '편안한 여행용 샌들', null, '쿠팡'),
  ('duejQqWCFds', '가벼운 대형 여행 가방', null, '쿠팡'),
  ('duejQqWCFds', '선글라스+햇 세트', null, '쿠팡')
on conflict do nothing;
