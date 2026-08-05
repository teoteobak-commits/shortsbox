-- 쇼츠 영상의 유튜브 업로드일 저장 — 일/주/월 베스트 랭킹 필터링용
alter table shorts add column if not exists published_at timestamptz;

create index if not exists idx_shorts_published_at on shorts (published_at desc);
