-- ⚠️ 실행하지 말 것 — 2026-07 당시의 일회성 기록이다.
--   · products 테이블의 현재 정의는 supabase/schema.sql 에 있다(coupang_url 포함).
--   · 아래 insert 는 이미 없어진 shorts.box 컬럼을 쓰므로 지금 실행하면 에러가 난다.
--   · 여기 적힌 정확한 SKU·가격은 20260727 마이그레이션에서 카테고리 검색어로 교체됐다
--     (원작자가 추천한 특정 상품을 그대로 수익화하지 않기 위한 결정).
-- 남겨두는 이유는 "왜 제품명을 일반화했는지"의 출발점을 보여주기 때문이다.

-- 제품 테이블 추가 + 기존에 큐레이션했던 오사카 영상 2개 복원
-- Supabase SQL Editor에서 새 쿼리로 실행하세요.

create table if not exists products (
  id bigint generated always as identity primary key,
  youtube_id text not null references shorts(youtube_id) on delete cascade,
  name text not null,
  price text,
  store text
);

alter table products enable row level security;

create policy "products are publicly readable"
  on products for select
  using (true);

-- 큐레이션 영상 복원 (제품이 달린 영상 = 자동 갱신 때 보호 대상)
insert into shorts (youtube_id, destination_id, box, title, channel_name, views, thumbnail_url)
values
  ('Z02d_2UJtlk', 2, 'pre', '진짜 유용했던 여행 꿀템 3가지', '@홈리빙스타일', 698967, 'https://i.ytimg.com/vi/Z02d_2UJtlk/hqdefault.jpg'),
  ('7SuVMyq2UXM', 2, 'local', '일본 돈키호테 한국인들 싹쓸이하는 품절템 4가지', '@살란다', 723745, 'https://i.ytimg.com/vi/7SuVMyq2UXM/hqdefault.jpg')
on conflict (youtube_id) do update set
  destination_id = excluded.destination_id,
  box = excluded.box,
  title = excluded.title,
  channel_name = excluded.channel_name,
  views = excluded.views,
  thumbnail_url = excluded.thumbnail_url;

insert into products (youtube_id, name, price, store) values
  ('Z02d_2UJtlk', 'i12B 휴대용 기내용 접이식 EVA 논슬립 슬리퍼 베이지', '9,900', '쿠팡'),
  ('Z02d_2UJtlk', 'EVA 초경량 휴대용 기내용 접이식 슬리퍼 화이트', '8,900', '쿠팡'),
  ('Z02d_2UJtlk', '생활친구 캐리어 보조가방 고정 벨트 2개 세트 블랙', '재고 한정', '쿠팡'),
  ('Z02d_2UJtlk', 'PYHO 여행 휴대용 접이식 건조기 타이머 HD-03A', '30,800', '쿠팡'),
  ('Z02d_2UJtlk', '여행 캐리어 보조 가방 고정 벨트 스트랩 레인보우 1개', '5,590', '쿠팡'),
  ('Z02d_2UJtlk', '생활친구 캐리어 보조가방 고정 벨트 2개 세트 오렌지', '6,900', '쿠팡'),
  ('7SuVMyq2UXM', '란도린 패브릭 미스트 섬유탈취제 3개 세트 1.01L', '23,900', '쿠팡');
