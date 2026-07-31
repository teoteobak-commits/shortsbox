-- 제품 큐레이션 확대 10차: /watch 스킬로 영상 5개 추가 분석.
-- 마찬가지로 영상 속 정확한 브랜드가 아니라 유사 상품으로 이름 일반화
-- (기존 큐레이션과 중복되는 항목은 건너뜀).

insert into products (youtube_id, name, price, store) values
  -- gIEuIZXNVR0: 파리여행 필수 쇼핑 브랜드 추천 — 옷입는 망고
  ('gIEuIZXNVR0', '스트리트 브랜드 선글라스', null, '쿠팡'),
  ('gIEuIZXNVR0', '캔버스 토트백', null, '쿠팡'),
  ('gIEuIZXNVR0', '캔버스 크로스백(슬링백)', null, '쿠팡'),

  -- 1j3SZiQiGkw: 발리 여행 필수템 best5 — 연트립
  ('1j3SZiQiGkw', '여행용 석회 방지 필터 세트', null, '쿠팡'),
  ('1j3SZiQiGkw', '모기 물림 방지 패치(휴대용)', null, '쿠팡'),
  ('1j3SZiQiGkw', '휴대용 물티슈', null, '쿠팡'),

  -- e6qqC2NXq8w: 태국 여행 기념품 쇼핑 추천 9가지 — MaVeLog
  ('e6qqC2NXq8w', '태국식 다이어트 허브차', null, '쿠팡'),
  ('e6qqC2NXq8w', '구취 제거 알갱이 치약', null, '쿠팡'),
  ('e6qqC2NXq8w', '근육통 완화 크림', null, '쿠팡'),
  ('e6qqC2NXq8w', '헤어 에센스(윤기 케어)', null, '쿠팡'),
  ('e6qqC2NXq8w', '짜먹는 연유(휴대용 스틱)', null, '쿠팡'),

  -- 7IBiVpBIXR0: 베트남 약국 쇼핑 꿀팁 대공개 — 다낭 가이드
  ('7IBiVpBIXR0', '피부 재생 연고(상처/화상용)', null, '쿠팡'),

  -- ovrD-83VK2Q: 발리 가면 꼭 사세요 후회 없는 기념품 — 신플스토리
  ('ovrD-83VK2Q', '코코넛칩', null, '쿠팡'),
  ('ovrD-83VK2Q', '초코바나나 그래놀라바이트', null, '쿠팡'),
  ('ovrD-83VK2Q', '매콤 스낵칩', null, '쿠팡'),
  ('ovrD-83VK2Q', '캡슐형 헤어에센스 앰플', null, '쿠팡')
on conflict do nothing;
