-- 매일 새벽 4시(UTC, 한국시간 오후 1시)에 fetch-shorts Edge Function을 자동 실행
-- Supabase 대시보드 → Database → Extensions 에서 pg_cron, pg_net 활성화 후 실행하세요.
--
-- <PROJECT_REF>와 <SERVICE_ROLE_KEY>는 Supabase 프로젝트 설정(Project Settings → API)에서 확인해
-- 아래 값을 실제 값으로 바꿔서 실행하세요.

select cron.schedule(
  'fetch-shorts-daily',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/fetch-shorts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- 스케줄 확인: select * from cron.job;
-- 스케줄 삭제:  select cron.unschedule('fetch-shorts-daily');
