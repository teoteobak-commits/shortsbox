-- 쇼츠박스 DB 스키마 — 현재 상태 기준 (2026-08-09 실제 DB와 대조해서 갱신)
--
-- 이 파일은 "빈 프로젝트에 처음부터 만들 때 실행하는 전체 스키마"다.
-- 이미 돌아가고 있는 프로젝트를 바꿀 때는 이 파일을 고치는 게 아니라
-- supabase/migrations/ 에 새 마이그레이션을 추가하고, 그 결과를 여기에도 반영한다.
-- (예전에 이 파일이 box 컬럼과 여행지 10곳 시드에 멈춰 있어서, 이것만 보면
--  실제 스키마를 잘못 파악하게 됐다.)
--
-- 지금까지 반영된 변경:
--   20260720 shorts.box 컬럼 제거 (준비박스/현지박스 구분 폐지)
--   20260727 products 를 정확한 SKU 대신 카테고리 검색어로 전환
--   20260730 products.coupang_url 추가 (쿠팡파트너스 추적 링크)
--   20260806 shorts.published_at 추가 (VideoObject 의 uploadDate 용)

create table if not exists destinations (
  id integer primary key,
  name text not null,
  country text,
  emoji text
);

create table if not exists shorts (
  youtube_id text primary key,
  destination_id integer not null references destinations(id) on delete cascade,
  title text not null,
  channel_name text,
  views bigint not null default 0,
  thumbnail_url text,
  -- 유튜브의 실제 업로드 날짜(snippet.publishedAt). VideoObject 구조화 데이터의
  -- uploadDate 에 쓴다 — 빠지면 구글이 동영상으로 인식하지 않는다.
  -- fetched_at(우리가 수집한 시각)으로 대신 채우면 안 된다.
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

-- 여행지 페이지가 "그 여행지의 조회수 상위 10개"를 뽑는 패턴에 맞춘 인덱스.
-- 원래는 (destination_id, box, views desc) 였는데, box 컬럼을 드롭할 때
-- 이 인덱스도 같이 사라졌다. 현재 200행 규모라 성능상 의미는 없지만 선언은 맞춰둔다.
create index if not exists idx_shorts_dest_views
  on shorts (destination_id, views desc);

-- 영상 속 아이템. 자동 수집 대상이 아니라 관리자가 영상을 직접 보고 넣는다.
-- name 은 브랜드/SKU 가 아니라 카테고리·기능 단위로 적는다("확장형 캐리어(무게측정 기능)").
-- 원작자가 추천한 특정 상품을 그대로 수익화하지 않기 위한 의도적 규칙이다.
create table if not exists products (
  id bigint generated always as identity primary key,
  youtube_id text not null references shorts(youtube_id) on delete cascade,
  name text not null,
  price text,
  store text,
  -- 쿠팡파트너스 추적 링크. 비어 있으면 코드가 name 으로 일반 검색 링크를 만들지만
  -- 그건 추적이 안 되어 수수료가 0원이다(js/affiliate-config.js 의 getCoupangUrl).
  coupang_url text
);

-- 여행지 시드 (20곳). 새 여행지를 추가할 때는 여기 말고 아래 4곳도 같이 손대야 한다:
--   js/slugs.js 의 DESTINATION_SLUGS (없으면 /travel/id-{n}/ 로 폴백)
--   js/destination-guides.js 의 DESTINATION_GUIDES (페이지의 유일한 자체 텍스트)
--   assets/destinations/{slug}.jpg + js/slugs.js 의 DESTINATIONS_WITH_PHOTO
--   js/affiliate-config.js 의 AGODA_AFFILIATE_LINKS / KLOOK_AFFILIATE_LINKS
insert into destinations (id, name, country, emoji) values
  (1,  '제주도',   '대한민국',   '🏖️'),
  (2,  '오사카',   '일본',       '🎡'),
  (3,  '도쿄',     '일본',       '🗼'),
  (4,  '방콕',     '태국',       '🌴'),
  (5,  '다낭',     '베트남',     '💑'),
  (6,  '치앙마이', '태국',       '🧳'),
  (7,  '파리',     '프랑스',     '🗼'),
  (8,  '스위스',   '스위스',     '🏔️'),
  (9,  '발리',     '인도네시아', '🌺'),
  (10, '하와이',   '미국',       '🌊'),
  (11, '후쿠오카', '일본',       '🍜'),
  (12, '나트랑',   '베트남',     '🏝️'),
  (13, '타이베이', '대만',       '🏮'),
  (14, '세부',     '필리핀',     '🐠'),
  (15, '홍콩',     '홍콩',       '🌃'),
  (16, '삿포로',   '일본',       '❄️'),
  (17, '오키나와', '일본',       '🐠'),
  (18, '싱가포르', '싱가포르',   '🦁'),
  (19, '괌',       '미국',       '🌺'),
  (20, '상하이',   '중국',       '🏙️')
on conflict (id) do nothing;

-- 누구나 읽을 수 있도록 공개 (쓰기는 Edge Function 이 service role 키로 수행하므로 별도 정책 불필요)
alter table destinations enable row level security;
alter table shorts enable row level security;
alter table products enable row level security;

create policy "destinations are publicly readable"
  on destinations for select
  using (true);

create policy "shorts are publicly readable"
  on shorts for select
  using (true);

create policy "products are publicly readable"
  on products for select
  using (true);
