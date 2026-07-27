-- 쇼츠박스 DB 스키마
-- Supabase 프로젝트의 SQL Editor에서 이 파일 내용을 그대로 실행하세요.

create table if not exists destinations (
  id integer primary key,
  name text not null,
  country text,
  emoji text
);

create table if not exists shorts (
  youtube_id text primary key,
  destination_id integer not null references destinations(id) on delete cascade,
  box text not null check (box in ('pre', 'local')),
  title text not null,
  channel_name text,
  views bigint not null default 0,
  thumbnail_url text,
  fetched_at timestamptz not null default now()
);

create index if not exists idx_shorts_dest_box_views
  on shorts (destination_id, box, views desc);

-- 인기 여행지 10곳 시드 데이터
insert into destinations (id, name, country, emoji) values
  (1, '제주도', '대한민국', '🏖️'),
  (2, '오사카', '일본', '🎡'),
  (3, '도쿄', '일본', '🗼'),
  (4, '방콕', '태국', '🌴'),
  (5, '다낭', '베트남', '💑'),
  (6, '치앙마이', '태국', '🧳'),
  (7, '파리', '프랑스', '🗼'),
  (8, '스위스', '스위스', '🏔️'),
  (9, '발리', '인도네시아', '🌺'),
  (10, '하와이', '미국', '🌊')
on conflict (id) do nothing;

-- 누구나 읽을 수 있도록 공개 (쓰기는 Edge Function이 service role 키로 수행하므로 별도 정책 불필요)
alter table destinations enable row level security;
alter table shorts enable row level security;

create policy "destinations are publicly readable"
  on destinations for select
  using (true);

create policy "shorts are publicly readable"
  on shorts for select
  using (true);
