-- 제품 큐레이션 확대 1차: /watch 스킬로 영상을 직접 보고 아이템 식별.
-- 영상 속 정확한 브랜드가 아니라 같은 용도의 유사 상품으로 이름을 일반화해서 연결함
-- (원작자가 추천한 특정 상품 자체를 그대로 가져다 수익화하지 않기 위함).

insert into products (youtube_id, name, price, store) values
  -- OBgmsEFrAwg: 일본인들이 보면 놀라자빠지는 아이템(동전지갑) — @라쿠 RAKU
  ('OBgmsEFrAwg', '여행용 동전 정리 지갑 (외화 동전 분류용)', null, '쿠팡'),

  -- AtrVvqPm-XQ: 무조건 사와야하는 초가성비 일본 꿀템 — @시누의 패션꿀템
  ('AtrVvqPm-XQ', '휴대용 진통 소염 파스 대용량', null, '쿠팡'),
  ('AtrVvqPm-XQ', '여행용 소화제·위장약', null, '쿠팡'),
  ('AtrVvqPm-XQ', '비졸림 종합감기약', null, '쿠팡'),

  -- 0GFp_yy0MBE: 전직 7년차 승무원 찐추천 여행꿀템 3가지 — @됴미
  ('0GFp_yy0MBE', '무게측정 기능 있는 확장형 기내용 캐리어', null, '쿠팡'),
  ('0GFp_yy0MBE', '캐리어 거치형 접이식 보조가방', null, '쿠팡'),
  ('0GFp_yy0MBE', '접이식 대용량 여행 더플백', null, '쿠팡'),
  ('0GFp_yy0MBE', '휴대용 화장품 소분 용기 세트', null, '쿠팡')
on conflict do nothing;
