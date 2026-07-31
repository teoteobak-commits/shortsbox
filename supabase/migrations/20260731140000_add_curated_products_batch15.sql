-- 제품 큐레이션 확대 15차: /watch 스킬로 영상 4개 추가 분석.

insert into products (youtube_id, name, price, store) values
  -- OuOBugwnKII: 짐싸기 전에 이 영상부터! 여행 고수들의 팁 — 디어서아
  ('OuOBugwnKII', '여행용 소분 공병 파우치', null, '쿠팡'),
  ('OuOBugwnKII', '대형 바디 샤워 티슈', null, '쿠팡'),
  ('OuOBugwnKII', '수면안대+귀마개 세트', null, '쿠팡'),
  ('OuOBugwnKII', '일회용 베개 커버', null, '쿠팡'),
  ('OuOBugwnKII', '캐리어 바퀴 커버(캐릭터형)', null, '쿠팡'),

  -- zhGgjZNQcyY: 태국 치앙마이 여행 기념품 추천 — 난다난다
  ('zhGgjZNQcyY', '코끼리 모양 도자기 컵', null, '쿠팡'),
  ('zhGgjZNQcyY', '말린 망고', null, '쿠팡'),
  ('zhGgjZNQcyY', '에스닉 패턴 패치워크 자켓', null, '쿠팡'),

  -- qDr-sevJ8ds: 제주 선물 추천 제주도 핫 아이템 — 해피스마일JH
  ('qDr-sevJ8ds', '감귤 모양 아동용 버킷햇', null, '쿠팡'),

  -- DeBkIqeNAAo: 괌, 하와이여행선물 추천템 호놀룰루쿠키 — Yoomi In Vegas
  ('DeBkIqeNAAo', '파인애플 패턴 접이식 에코백', null, '쿠팡'),
  ('DeBkIqeNAAo', '하와이 파인애플 쿠키', null, '쿠팡')
on conflict do nothing;
