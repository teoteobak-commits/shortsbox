-- 매일 새벽 4시(UTC, 한국시간 오후 1시)에 fetch-shorts Edge Function을 자동 실행
-- Supabase 대시보드 → Database → Extensions 에서 pg_cron, pg_net 활성화 후 실행하세요.
--
-- <SERVICE_ROLE_KEY>는 Supabase 프로젝트 설정(Project Settings → API)의 service_role 키로
-- 반드시 바꿔서 실행하세요. 플레이스홀더를 그대로 두면 매일 실행은 되지만 함수 호출이
-- 401 UNAUTHORIZED_INVALID_JWT_FORMAT으로 조용히 실패해서, 데이터가 갱신되지 않은 채
-- 몇 주가 지나갈 수 있습니다. (2026-08-05에 실제로 15일치가 이렇게 멈춰 있었습니다.)
--
-- timeout_milliseconds는 넉넉히 둡니다. 이 함수는 여행지 10곳 × 유튜브 API 호출이라
-- pg_net 기본값(5초)을 훌쩍 넘깁니다. 타임아웃이 나도 함수 자체는 끝까지 실행되지만,
-- 응답이 기록되지 않아서 나중에 실패 원인을 추적할 수 없게 됩니다.

select cron.schedule(
  'fetch-shorts-daily',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://iftolinvhwxdcclrtavw.supabase.co/functions/v1/fetch-shorts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 120000
  );
  $$
);

-- 스케줄 확인:   select jobid, jobname, schedule, active from cron.job;
-- 스케줄 삭제:   select cron.unschedule('fetch-shorts-daily');
--
-- 실제로 갱신되고 있는지 확인하는 방법 (cron.job_run_details의 'succeeded'는
-- 요청을 큐에 넣는 데 성공했다는 뜻일 뿐, 함수가 성공했다는 뜻이 아닙니다):
--   select id, status_code, created, left(coalesce(content, error_msg, ''), 200)
--     from net._http_response order by created desc limit 5;
--   select max(fetched_at) from shorts;   -- 하루 이내여야 정상
