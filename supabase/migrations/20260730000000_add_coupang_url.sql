-- 큐레이션 제품에 실제 쿠팡파트너스 추적 링크를 저장할 컬럼 추가.
-- 없으면 코드에서 일반 검색 링크(비추적)로 폴백한다.
alter table products add column if not exists coupang_url text;
