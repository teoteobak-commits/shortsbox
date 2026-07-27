/* Supabase 연결 — anon(공개) 키 사용, RLS로 읽기 전용만 허용됨 */
const SUPABASE_URL = 'https://iftolinvhwxdcclrtavw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdG9saW52aHd4ZGNjbHJ0YXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTY3NzQsImV4cCI6MjEwMDAzMjc3NH0.HMZ4-yf6SPty4wdQKJon8nRi9GfWpgFIeMx2PXF5RhU';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
