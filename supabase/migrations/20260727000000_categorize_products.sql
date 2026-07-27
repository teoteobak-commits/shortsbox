-- 오사카 큐레이션 영상의 제품을 "정확한 SKU"에서 "카테고리 검색어"로 교체.
-- 원작자가 고른 정확한 상품을 그대로 재판매 링크로 거는 대신,
-- 비슷한 종류를 검색할 수 있게만 안내해서 원작자 수익과 직접 경쟁하지 않도록 한다.

delete from products where youtube_id in ('Z02d_2UJtlk', '7SuVMyq2UXM');

insert into products (youtube_id, name, price, store) values
  ('Z02d_2UJtlk', '여행용 접이식 슬리퍼', null, '쿠팡'),
  ('Z02d_2UJtlk', '캐리어 고정 벨트/스트랩', null, '쿠팡'),
  ('Z02d_2UJtlk', '휴대용 접이식 건조기', null, '쿠팡'),
  ('7SuVMyq2UXM', '섬유탈취제 패브릭 미스트', null, '쿠팡');
