-- 준비박스/현지박스 구분 제거 — 여행지(국가) 단위 단일 리스트로 단순화
-- 검색어만으로 "가기 전/가서"를 나누는 게 실제로는 애매한 케이스가 많아서 제거함.
-- SQL Editor에서 실행하세요.

alter table shorts drop column if exists box;
