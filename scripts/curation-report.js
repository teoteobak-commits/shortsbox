/* 큐레이션 점검 리포트 — 아직 손 안 댄 영상을 찾아 curation-todo.md 에 적는다.

   왜 GitHub Actions 인가:
   원래 Claude 클라우드 루틴(trig_01Cm7X9Np…)이 2주마다 하던 일인데, 그 환경은
   아웃바운드가 허용목록 방식이라 supabase.co 가 403 으로 막힌다. 8/15 단 한 번의
   실행이 그것으로 실패했고 리포트는 한 번도 만들어진 적이 없다. 카드뉴스 루틴을
   죽인 것과 같은 종류의 실패다(그쪽은 i.ytimg.com). Actions 는 네트워크가 열려
   있고 generate-static-pages.js 가 매일 같은 Supabase 를 읽고 있다.

   하는 일: shorts 를 products / VIDEO_NOTES 와 대조해 세 그룹으로 나눈다.
     ① 미처리        — 제품도 소개문구도 없음. 실제로 손대야 할 것
     ② 제품○ 문구✗   — 소개문구만 채우면 됨
     ③ 문구○ 제품✗   — 참고용. 의도적으로 큐레이션 제외한 영상이 대부분이다
       (쇼핑 콘텐츠가 아님 / 알코올 / 럭셔리 브랜드 하울 / 이미 중복)

   **영상을 보고 제품을 판별하는 일은 여기서 하지 않는다.** 원작자 수익을 가로채지
   않도록 일반화해서 연결해야 하고, 알코올·럭셔리 브랜드처럼 건너뛸지 판단해야 하는
   것들이 있어서 사람이 /watch 로 직접 봐야 한다. 이 스크립트는 목록화까지만 한다. */

const fs = require('fs');
const path = require('path');
const { VIDEO_NOTES } = require('../js/video-notes.js');
const { destinationSlug } = require('../js/slugs.js');
const { kstDate } = require('./kst-date.js');

const SUPABASE_URL = 'https://iftolinvhwxdcclrtavw.supabase.co';
/* anon(공개) 키 — RLS로 읽기 전용만 허용됨. generate-static-pages.js 와 같은 값 */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdG9saW52aHd4ZGNjbHJ0YXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTY3NzQsImV4cCI6MjEwMDAzMjc3NH0.HMZ4-yf6SPty4wdQKJon8nRi9GfWpgFIeMx2PXF5RhU';

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'curation-todo.md');

async function fetchTable(table, query){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if(!res.ok) throw new Error(`${table} fetch 실패: ${res.status} ${await res.text()}`);
  return res.json();
}

const man = v => `${Math.floor((v || 0) / 10000)}만`;

function line(s){
  return `- **${destinationSlug(s.destination_id)}** · ${man(s.views)} — ${s.title} → https://youtube.com/shorts/${s.youtube_id}`;
}

function section(title, rows, note){
  const body = rows.length ? rows.map(line).join('\n') : '없음';
  return `## ${title} (${rows.length}개)\n${note ? note + '\n\n' : ''}${body}\n`;
}

async function main(){
  const [shorts, products] = await Promise.all([
    fetchTable('shorts', 'select=youtube_id,destination_id,title,views'),
    fetchTable('products', 'select=youtube_id'),
  ]);

  const withProduct = new Set(products.map(p => p.youtube_id));
  const withNote = new Set(Object.keys(VIDEO_NOTES));
  const byViews = (a, b) => b.views - a.views;

  const untouched   = shorts.filter(s => !withProduct.has(s.youtube_id) && !withNote.has(s.youtube_id)).sort(byViews);
  const productOnly = shorts.filter(s =>  withProduct.has(s.youtube_id) && !withNote.has(s.youtube_id)).sort(byViews);
  const noteOnly    = shorts.filter(s => !withProduct.has(s.youtube_id) &&  withNote.has(s.youtube_id)).sort(byViews);

  const { dateIso } = kstDate();
  const md = `# 큐레이션 점검 리포트 (${dateIso})

전체 쇼츠 ${shorts.length}개 · 제품 보유 영상 ${withProduct.size}개 · 소개문구 보유 ${withNote.size}개.
매월 1일·15일에 \`.github/workflows/curation-report.yml\` 이 자동 갱신한다.

**영상을 보고 제품을 고르는 일은 사람이 한다** — 대화형 세션에서 \`/watch\` 로 직접 보면서,
원작자가 추천한 정확한 상품이 아니라 같은 용도의 일반적인 상품으로 연결할 것.

${section('① 미처리 — 제품도 소개문구도 없음', untouched, '조회수 내림차순. 위에서부터 처리하면 노출 대비 효율이 가장 좋다.')}
${section('② 제품은 있는데 소개문구 없음', productOnly, '`js/video-notes.js` 에 한 문장씩 채우면 된다. 제목을 옮기지 말고 영상이 실제로 다루는 내용을 쓸 것.')}
${section('③ 소개문구는 있는데 제품 없음 (참고용)', noteOnly, '대부분 의도적으로 큐레이션에서 뺀 것들이다(쇼핑 콘텐츠가 아님 / 알코올 / 럭셔리 브랜드 하울 / 중복). 처리 대상이 아니다.')}`;

  fs.writeFileSync(OUT, md);

  console.error(`쇼츠 ${shorts.length} · 미처리 ${untouched.length} · 제품○문구✗ ${productOnly.length} · 문구○제품✗ ${noteOnly.length}`);
  /* 워크플로우가 파싱하는 유일한 stdout */
  console.log(JSON.stringify({
    date: dateIso,
    total: shorts.length,
    untouched: untouched.length,
    product_only: productOnly.length,
    note_only: noteOnly.length,
    top: untouched.slice(0, 5).map(s => ({
      slug: destinationSlug(s.destination_id), views_man: man(s.views), title: s.title, youtube_id: s.youtube_id,
    })),
  }));
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
