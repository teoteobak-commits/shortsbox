-- 영상의 실제 유튜브 업로드 날짜. VideoObject 구조화 데이터의 uploadDate에 쓴다.
-- 서치콘솔이 "'uploadDate' 입력란이 누락되었습니다"를 심각한 문제로 보고했고(2026-08-06),
-- 이게 없으면 동영상이 구글 검색 결과에 표시되지 않는다.
--
-- fetched_at으로 대신하면 안 된다. 그건 우리가 수집한 시각이라 실제 업로드 날짜와 무관하고,
-- 구조화 데이터에 사실과 다른 값을 넣는 셈이 된다.
alter table shorts add column if not exists published_at timestamptz;
