/* 여행지/영상 상세 페이지를 빌드 시점에 실제 콘텐츠가 채워진 정적 HTML로 미리 생성한다.
   JS를 실행하지 않는 크롤러(GPTBot, ClaudeBot, PerplexityBot 등)도 실제 콘텐츠를 볼 수 있게 하기 위함.
   기존 detail.html/video.html과 완전히 동일한 <script> 태그를 포함시켜서, 브라우저에서는
   기존 client-side 렌더링이 그대로 이 위에 하이드레이션(덮어쓰기)된다 — 인터랙션(저장/공유 등)은
   기존과 동일하게 동작함. */

const fs = require('fs');
const path = require('path');

const { icon } = require('../assets/icons.js');
const { DESTINATION_GUIDES } = require('../js/destination-guides.js');
const { VIDEO_NOTES } = require('../js/video-notes.js');
const { getAgodaUrl, getKlookUrl } = require('../js/affiliate-config.js');
const { destinationSlug, coverStyle } = require('../js/slugs.js');

const SUPABASE_URL = 'https://iftolinvhwxdcclrtavw.supabase.co';
/* anon(공개) 키 — RLS로 읽기 전용만 허용됨. js/supabase-client.js에도 동일하게 이미 공개돼있음 */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdG9saW52aHd4ZGNjbHJ0YXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTY3NzQsImV4cCI6MjEwMDAzMjc3NH0.HMZ4-yf6SPty4wdQKJon8nRi9GfWpgFIeMx2PXF5RhU';

const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://shortsbox.kr';

const CURATION_NOTE = '쇼츠박스는 여행 유튜버들이 직접 추천한 여행 아이템만 모아서 보여드려요. 영상 속 정확한 제품을 특정하기 어려운 경우가 많아서, 특징이 비슷한 상품을 대신 연결해드리고 있어요. 실제 구매 전에는 영상 설명란이나 판매 페이지에서 제품 정보를 한 번 더 확인해보시는 걸 추천해요.';

async function fetchTable(table, query){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if(!res.ok) throw new Error(`${table} fetch 실패: ${res.status} ${await res.text()}`);
  return res.json();
}

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatViews(n){
  if(n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '만';
  return Number(n).toLocaleString();
}

function thumbUrl(s){
  return s.thumbnail_url || `https://i.ytimg.com/vi/${s.youtube_id}/hqdefault.jpg`;
}

function headHtml({ title, description, ogTitle, ogDescription, ogImage, ogImageWidth, ogImageHeight, ogType, canonicalUrl, jsonLd }){
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VKCFJ8GSRX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-VKCFJ8GSRX');
</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5788194649735645"
     crossorigin="anonymous"></script>
<script>
(function(){
  var saved = localStorage.getItem('shortsbox_theme');
  var theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
</script>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:title" content="${escapeHtml(ogTitle || title)}">
<meta property="og:description" content="${escapeHtml(ogDescription || description)}">
<meta property="og:type" content="${ogType || 'website'}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${ogImage || 'https://shortsbox.kr/assets/og-image.png'}">
<meta property="og:image:width" content="${ogImageWidth || 1200}">
<meta property="og:image:height" content="${ogImageHeight || 630}">
<script type="application/ld+json" id="page-jsonld">${JSON.stringify(jsonLd)}</script>
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/components.css">
<link rel="stylesheet" href="/css/pagestyles.css">`;
}

function scriptsHtml(pageScript, extra = []){
  const common = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    '/js/supabase-client.js',
    '/assets/icons.js',
    '/js/data.js',
    ...extra,
    '/js/utils.js',
    '/js/slugs.js',
    '/js/nav.js',
  ];
  const tags = common.map(src => `<script src="${src}" defer></script>`).join('\n');
  return `${tags}
<script src="/js/lightbox.js" defer></script>
<script src="${pageScript}" defer></script>
<script defer src="/_vercel/insights/script.js"></script>`;
}

function destinationCardHtml(d, shortsCountByDest){
  return `
    <a href="/travel/${destinationSlug(d.id)}/" class="card">
      <div class="card-cover" style="${coverStyle(d.id)}">
        <span class="card-sticker">${d.emoji}</span>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(d.name)}</div>
        <div class="card-meta"><span>${escapeHtml(d.country)}</span></div>
        <div class="card-footer"><span class="stat">${icon('tag', 'icon-sm')}꿀템 쇼츠 ${shortsCountByDest[d.id] || 0}개</span></div>
      </div>
    </a>`;
}

function shortsCardHtml(s, rank){
  return `
    <a href="/watch/${s.youtube_id}/" class="shorts-card" data-youtube-id="${s.youtube_id}">
      <div class="shorts-thumb">
        <img src="${thumbUrl(s)}" alt="${escapeHtml(s.title)}" loading="lazy">
        <span class="rank-badge">${rank}</span>
        <span class="play-badge">${icon('play', 'icon-sm')}</span>
      </div>
      <div class="shorts-card-body">
        <div class="shorts-card-title">${escapeHtml(s.title)}</div>
        <div class="shorts-card-meta">${escapeHtml(s.channel_name)} · 조회수 ${formatViews(s.views)}</div>
      </div>
    </a>`;
}

function productRowHtml(p, youtubeId){
  const trackProps = JSON.stringify({ location: 'product_list', product_name: p.name, youtube_id: youtubeId }).replace(/'/g, '&#39;');
  const link = p.coupang_url || `https://www.coupang.com/np/search?q=${encodeURIComponent(p.name)}`;
  return `
    <div class="product-row">
      <div class="product-thumb">🛍️</div>
      <div class="product-info">
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-price">${escapeHtml(p.store)}에서 비슷한 상품 찾아보기</div>
      </div>
      <a href="${link}" target="_blank" rel="noopener sponsored" class="btn btn-primary btn-sm" data-track-event="coupang_link_clicked" data-track-props='${trackProps}'>쿠팡에서 찾기</a>
    </div>`;
}

function guideBlockHtml(guide){
  const facts = (guide.bestTime || guide.budget) ? `
      <div class="guide-facts">
        ${guide.bestTime ? `<div class="guide-fact"><span class="guide-fact-label">${icon('sun', 'icon-sm')}최적 시기</span><span>${escapeHtml(guide.bestTime)}</span></div>` : ''}
        ${guide.budget ? `<div class="guide-fact"><span class="guide-fact-label">${icon('tag', 'icon-sm')}예산 감</span><span>${escapeHtml(guide.budget)}</span></div>` : ''}
      </div>` : '';

  const sections = (guide.sections && guide.sections.length) ? guide.sections.map(sec => `
      <div class="guide-section">
        <h4>${escapeHtml(sec.heading)}</h4>
        <p>${escapeHtml(sec.body)}</p>
        ${sec.cta ? `<a href="${escapeHtml(sec.cta.url)}" target="_blank" rel="noopener sponsored" class="guide-section-cta" data-track-event="guide_section_cta_clicked" data-track-props='${JSON.stringify({ label: sec.cta.label }).replace(/'/g, '&#39;')}'>${escapeHtml(sec.cta.label)} →</a>` : ''}
      </div>`).join('') : '';

  const packing = (guide.packingList && guide.packingList.length) ? `
      <div class="guide-section">
        <h4>${icon('suitcase', 'icon-sm')} 짐싸기 체크리스트</h4>
        <div class="packing-list">
          ${guide.packingList.map(item => `<span class="packing-chip">${escapeHtml(item)}</span>`).join('')}
        </div>
      </div>` : '';

  const faq = (guide.faq && guide.faq.length) ? `
      <div class="guide-section">
        <h4>${icon('search', 'icon-sm')} 자주 묻는 질문</h4>
        <div class="faq-list">
          ${guide.faq.map(f => `
            <div class="faq-item">
              <div class="faq-q">Q. ${escapeHtml(f.q)}</div>
              <div class="faq-a">${escapeHtml(f.a)}</div>
            </div>`).join('')}
        </div>
      </div>` : '';

  return `
    <div class="editorial-guide">
      <span class="editorial-guide-tag">쇼츠박스 에디터 노트</span>
      <h3>${escapeHtml(guide.title)}</h3>
      <p>${escapeHtml(guide.body)}</p>
      ${facts}
      ${sections}
      ${packing}
      ${faq}
    </div>`;
}

function buildDestinationPage(d, { topShorts, related, shortsCountByDest }){
  const guide = DESTINATION_GUIDES[d.id] || null;
  const description = `${d.name} 여행 꿀템 쇼츠 TOP10과 영상 속 제품 구매처를 모아봤어요.${guide ? ' ' + guide.body.slice(0, 80) : ''}`;
  const canonicalUrl = `${SITE_URL}/travel/${destinationSlug(d.id)}/`;

  const graph = [{
    '@type': 'TouristAttraction',
    name: `${d.name} 여행 꿀템`,
    description,
    url: canonicalUrl,
    touristType: '여행객',
  }];
  if(guide && guide.faq && guide.faq.length){
    graph.push({
      '@type': 'FAQPage',
      mainEntity: guide.faq.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  const head = headHtml({
    title: `${d.name} 여행 꿀템 — 쇼츠박스`,
    description,
    ogType: 'website',
    canonicalUrl,
    jsonLd: { '@context': 'https://schema.org', '@graph': graph },
  });

  const guideBlock = guide ? guideBlockHtml(guide) : '';

  const shortsGrid = topShorts.length
    ? topShorts.map((s, idx) => shortsCardHtml(s, idx + 1)).join('')
    : `<div class="empty-shorts">아직 꿀템 쇼츠가 없어요. 곧 추가할게요!</div>`;

  const relatedGrid = related.map(r => destinationCardHtml(r, shortsCountByDest)).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head}
</head>
<body data-page="detail">

<header id="site-header" class="site-header"></header>

<section class="detail-hero" id="detail-hero">
  <div class="container">
    <div class="detail-cover">${d.emoji}</div>
    <div class="detail-info">
      <h1>${escapeHtml(d.name)} 여행 꿀템</h1>
      <div class="detail-meta"><span>${escapeHtml(d.country)}</span></div>
      <div class="detail-actions">
        <button class="btn btn-outline" id="save-btn">${icon('bookmark', 'icon-sm')}저장</button>
        <button class="btn btn-outline" id="share-btn">${icon('share', 'icon-sm')}공유</button>
      </div>
    </div>
  </div>
</section>

<main>
  <section class="container section" style="padding-top:var(--space-5)">
    <div class="section-head">
      <h2>여행 꿀템 쇼츠</h2>
    </div>
    <div id="shorts-grid" class="shorts-grid">${shortsGrid}</div>

    <a href="/ranking/${destinationSlug(d.id)}/" class="btn btn-outline btn-block" style="margin-bottom:var(--space-5)">
      ${icon('tag', 'icon-sm')}${escapeHtml(d.name)} 여행템 랭킹 보기
    </a>
  </section>

  <section class="container" style="padding-top:var(--space-5)">
    <div id="agoda-banner">
      <a href="${getAgodaUrl(d)}" target="_blank" rel="noopener sponsored" class="agoda-banner" data-track-event="agoda_banner_clicked" data-track-props='${JSON.stringify({ destination_id: d.id, destination_name: d.name }).replace(/'/g, '&#39;')}'>
        <div class="agoda-banner-text">
          <span class="agoda-banner-tag">제휴 · AD</span>
          <div class="agoda-banner-title">${escapeHtml(d.name)} 숙소 최저가 보기</div>
          <div class="agoda-banner-sub">아고다에서 지금 예약하면 더 저렴해요</div>
        </div>
        <span class="agoda-banner-icon">🏨</span>
      </a>
    </div>
    <div id="klook-banner">${getKlookUrl(d) ? `
      <a href="${getKlookUrl(d)}" target="_blank" rel="noopener sponsored" class="agoda-banner klook-banner" data-track-event="klook_banner_clicked" data-track-props='${JSON.stringify({ destination_id: d.id, destination_name: d.name }).replace(/'/g, '&#39;')}'>
        <div class="agoda-banner-text">
          <span class="agoda-banner-tag">제휴 · AD</span>
          <div class="agoda-banner-title">${escapeHtml(d.name)} 투어&액티비티 보기</div>
          <div class="agoda-banner-sub">클룩에서 현지 액티비티를 미리 예약해보세요</div>
        </div>
        <span class="agoda-banner-icon">🎫</span>
      </a>` : ''}
    </div>
  </section>

  <section class="container" style="padding-top:var(--space-5)">
    <div id="destination-guide">${guideBlock}</div>
  </section>

  <section class="container section" style="padding-top:var(--space-5)">
    <div class="related-section">
      <div class="section-head">
        <h2>다른 여행지도 둘러보세요</h2>
      </div>
      <div class="card-grid" id="related-grid">${relatedGrid}</div>
    </div>
  </section>
</main>

<footer id="site-footer" class="site-footer"></footer>
<nav id="site-bottomnav" class="bottom-nav"></nav>

${scriptsHtml('/js/detail-page.js', ['/js/destination-guides.js', '/js/affiliate-config.js'])}
</body>
</html>
`;
}

function buildVideoPage(s, dest, products){
  const guide = DESTINATION_GUIDES[dest.id] || null;
  const description = `${dest.name} 여행 꿀템 쇼츠 "${s.title}" — 영상 속 아이템${products.length ? `(${products.map(p => p.name).slice(0, 3).join(', ')} 등)` : ''}과 구매처를 확인하세요.`;
  const canonicalUrl = `${SITE_URL}/watch/${s.youtube_id}/`;

  const head = headHtml({
    title: `${s.title} — 쇼츠박스`,
    description,
    ogType: 'video.other',
    ogImage: thumbUrl(s),
    ogImageWidth: 480,
    ogImageHeight: 360,
    canonicalUrl,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: s.title,
      description,
      thumbnailUrl: thumbUrl(s),
      embedUrl: `https://www.youtube.com/embed/${s.youtube_id}`,
    },
  });

  const guideBlock = guide ? guideBlockHtml(guide) : '';

  const productList = products.length
    ? products.map(p => productRowHtml(p, s.youtube_id)).join('')
    : `<div class="empty-state" style="padding:var(--space-5)">${icon('tag', 'icon-lg')}<p>이 영상 속 정확한 아이템은 아직 정리 전이에요.<br>영상 설명란에서 확인해보시거나, 비슷한 여행용품을 둘러보세요.</p>
      <a href="https://link.coupang.com/a/fLDqJwiLng" target="_blank" rel="noopener sponsored" class="btn btn-primary btn-sm" style="margin-top:var(--space-3)" data-track-event="coupang_link_clicked" data-track-props='{"location":"product_empty_state"}'>🧳 쿠팡에서 여행용품 둘러보기</a>
    </div>`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head}
</head>
<body data-page="video">

<header id="site-header" class="site-header"></header>

<main>
  <section class="container section" style="padding-top:var(--space-5)">
    <div class="video-layout" id="video-layout">
      <span class="badge badge-gem" style="margin-bottom:10px">${dest.emoji} ${escapeHtml(dest.name)}</span>
      <h1 class="video-title">${escapeHtml(s.title)}</h1>
      <div class="video-channel">${escapeHtml(s.channel_name)} · 조회수 ${formatViews(s.views)}</div>
      ${VIDEO_NOTES[s.youtube_id] ? `<p class="video-note">${escapeHtml(VIDEO_NOTES[s.youtube_id])}</p>` : ''}

      <div class="video-embed">
        <iframe src="https://www.youtube.com/embed/${s.youtube_id}" title="${escapeHtml(s.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      <a href="https://youtube.com/shorts/${s.youtube_id}" target="_blank" rel="noopener" class="video-yt-link">${icon('external', 'icon-sm')}재생이 안 되면 유튜브에서 보기</a>

      <div class="btn-row" style="margin-bottom:var(--space-5)">
        <button class="btn btn-outline btn-sm" id="save-video-btn">${icon('bookmark', 'icon-sm')}저장</button>
        <button class="btn btn-outline btn-sm" id="share-video-btn">${icon('share', 'icon-sm')}공유</button>
      </div>

      <div class="section-head" style="margin-bottom:12px">
        <h2 style="font-size:16px">${icon('tag', 'icon-sm')} 영상 속 아이템 종류 ${products.length ? `(${products.length})` : ''}</h2>
      </div>
      ${products.length ? `<p class="sub" style="margin:-4px 0 var(--space-3)">정확히 같은 제품이 아니라, 비슷한 종류를 검색해서 보여드려요.</p>` : ''}
      <div class="product-list" id="product-list">${productList}</div>

      <div class="editorial-guide" style="margin-bottom:var(--space-4)">
        <span class="editorial-guide-tag">쇼츠박스 큐레이션 안내</span>
        <p>${CURATION_NOTE}</p>
      </div>

      ${guideBlock}

      <a href="/travel/${destinationSlug(dest.id)}/" class="btn btn-outline btn-block" style="margin-top:var(--space-4)">
        ${icon('compass', 'icon-sm')}${escapeHtml(dest.name)} 여행 꿀템 더 보기
      </a>
    </div>
  </section>
</main>

<footer id="site-footer" class="site-footer"></footer>
<nav id="site-bottomnav" class="bottom-nav"></nav>

${scriptsHtml('/js/video-page.js', ['/js/destination-guides.js', '/js/video-notes.js'])}
</body>
</html>
`;
}

function rankingRowHtml(entry, rank){
  const { product: p, short: s, dest } = entry;
  const trackProps = JSON.stringify({ location: 'ranking_page', product_name: p.name, youtube_id: s.youtube_id }).replace(/'/g, '&#39;');
  const link = p.coupang_url || `https://www.coupang.com/np/search?q=${encodeURIComponent(p.name)}`;
  return `
    <div class="product-row">
      <div class="product-thumb rank-num">${rank}</div>
      <div class="product-info">
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-price"><a href="/watch/${s.youtube_id}/" style="text-decoration:underline">${dest.emoji} ${escapeHtml(dest.name)}</a> 쇼츠 · 조회수 ${formatViews(s.views)}</div>
      </div>
      <a href="${link}" target="_blank" rel="noopener sponsored" class="btn btn-primary btn-sm" data-track-event="coupang_link_clicked" data-track-props='${trackProps}'>쿠팡에서 찾기</a>
    </div>`;
}

function buildRankingPage(destinations, shorts, products){
  const shortsById = {};
  for(const s of shorts) shortsById[s.youtube_id] = s;
  const destById = {};
  for(const d of destinations) destById[d.id] = d;

  const entries = products
    .map(p => {
      const short = shortsById[p.youtube_id];
      const dest = short && destById[short.destination_id];
      return short && dest ? { product: p, short, dest } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.short.views - a.short.views)
    .slice(0, 30);

  const description = '여행 유튜버들이 쇼츠에서 소개한 여행 아이템을 영상 조회수 기준으로 모아봤어요. 정확히 같은 제품이 아니라 비슷한 상품으로 연결해드려요.';
  const canonicalUrl = `${SITE_URL}/ranking/`;

  const head = headHtml({
    title: '여행 유튜버 추천템 랭킹 TOP 30 — 쇼츠박스',
    description,
    ogType: 'website',
    canonicalUrl,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: '여행 유튜버 추천템 랭킹',
      itemListElement: entries.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: e.product.name,
        url: `${SITE_URL}/watch/${e.short.youtube_id}/`,
      })),
    },
  });

  const rows = entries.map((e, i) => rankingRowHtml(e, i + 1)).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head}
</head>
<body data-page="ranking">

<header id="site-header" class="site-header"></header>

<main>
  <section class="container" style="padding-top:var(--space-5)">
    <h1 style="font-size:22px;margin-bottom:8px">여행 유튜버들이 진짜 많이 추천한 아이템</h1>
    <p class="sub" style="margin-bottom:var(--space-4)">쇼츠에 나온 아이템을 그 영상의 조회수 기준으로 모아봤어요. 정확히 같은 제품이 아니라 비슷한 상품으로 연결해드려요.</p>

    <div class="product-list">${rows}</div>

    <div class="section-head" style="margin-top:var(--space-6)">
      <h2 style="font-size:16px">목적지별 랭킹도 있어요</h2>
    </div>
    <div class="card-grid" style="margin-bottom:var(--space-4)">
      ${destinations.map(d => `
        <a href="/ranking/${destinationSlug(d.id)}/" class="card">
          <div class="card-body" style="padding:var(--space-3) var(--space-4)">
            <div class="card-title" style="font-size:14px">${d.emoji} ${escapeHtml(d.name)}</div>
          </div>
        </a>`).join('')}
    </div>

    <a href="/explore.html" class="btn btn-outline btn-block" style="margin-top:var(--space-4)">
      ${icon('compass', 'icon-sm')}목적지별로 더 둘러보기
    </a>
  </section>
</main>

<footer id="site-footer" class="site-footer"></footer>
<nav id="site-bottomnav" class="bottom-nav"></nav>

<script src="/assets/icons.js" defer></script>
<script src="/js/utils.js" defer></script>
<script src="/js/nav.js" defer></script>
<script>document.addEventListener('DOMContentLoaded', () => initLayout('ranking'));</script>
</body>
</html>
`;
}

function buildDestinationRankingPage(dest, entries){
  const description = `${dest.name} 여행 유튜버들이 쇼츠에서 소개한 아이템을 영상 조회수 기준으로 모아봤어요. 정확히 같은 제품이 아니라 비슷한 상품으로 연결해드려요.`;
  const slug = destinationSlug(dest.id);
  const canonicalUrl = `${SITE_URL}/ranking/${slug}/`;

  const head = headHtml({
    title: `${dest.name} 여행템 랭킹 — 쇼츠박스`,
    description,
    ogType: 'website',
    canonicalUrl,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${dest.name} 여행 유튜버 추천템 랭킹`,
      itemListElement: entries.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: e.product.name,
        url: `${SITE_URL}/watch/${e.short.youtube_id}/`,
      })),
    },
  });

  const rows = entries.length
    ? entries.map((e, i) => rankingRowHtml(e, i + 1)).join('')
    : `<div class="empty-shorts">아직 정리된 아이템이 없어요.</div>`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head}
</head>
<body data-page="ranking">

<header id="site-header" class="site-header"></header>

<main>
  <section class="container" style="padding-top:var(--space-5)">
    <h1 style="font-size:22px;margin-bottom:8px">${dest.emoji} ${escapeHtml(dest.name)} 여행템 랭킹</h1>
    <p class="sub" style="margin-bottom:var(--space-4)">${escapeHtml(dest.name)} 쇼츠에 나온 아이템을 그 영상의 조회수 기준으로 모아봤어요. 정확히 같은 제품이 아니라 비슷한 상품으로 연결해드려요.</p>

    <div class="product-list">${rows}</div>

    <div class="btn-row" style="margin-top:var(--space-4)">
      <a href="/travel/${slug}/" class="btn btn-outline" style="flex:1">${icon('compass', 'icon-sm')}${escapeHtml(dest.name)} 여행 꿀템 쇼츠 보기</a>
      <a href="/ranking/" class="btn btn-outline" style="flex:1">전체 랭킹 보기</a>
    </div>
  </section>
</main>

<footer id="site-footer" class="site-footer"></footer>
<nav id="site-bottomnav" class="bottom-nav"></nav>

<script src="/assets/icons.js" defer></script>
<script src="/js/utils.js" defer></script>
<script src="/js/nav.js" defer></script>
<script>document.addEventListener('DOMContentLoaded', () => initLayout('ranking'));</script>
</body>
</html>
`;
}

function writeFile(relPath, content){
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

/* travel/, watch/ 밑에 더 이상 존재하지 않는 여행지·영상의 정적 페이지가 남아있으면 지운다.
   (예: DB에서 영상을 삭제해도 이전에 생성된 정적 파일은 자동으로 안 없어지는 문제 방지) */
function cleanupStaleDirs(dirName, validNames){
  const dirPath = path.join(ROOT, dirName);
  if(!fs.existsSync(dirPath)) return 0;
  const validSet = new Set(validNames);
  let removed = 0;
  for(const entry of fs.readdirSync(dirPath, { withFileTypes: true })){
    if(entry.isDirectory() && !validSet.has(entry.name)){
      fs.rmSync(path.join(dirPath, entry.name), { recursive: true, force: true });
      removed++;
    }
  }
  return removed;
}

function buildSitemap(destinations, shorts){
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/explore.html`, priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE_URL}/privacy.html`, priority: '0.2', changefreq: 'yearly' },
    { loc: `${SITE_URL}/about.html`, priority: '0.4', changefreq: 'monthly' },
    { loc: `${SITE_URL}/ranking/`, priority: '0.7', changefreq: 'weekly' },
    ...destinations.map(d => ({ loc: `${SITE_URL}/ranking/${destinationSlug(d.id)}/`, priority: '0.65', changefreq: 'weekly' })),
    ...destinations.map(d => ({ loc: `${SITE_URL}/travel/${destinationSlug(d.id)}/`, priority: '0.8', changefreq: 'weekly' })),
    ...shorts.map(s => ({ loc: `${SITE_URL}/watch/${s.youtube_id}/`, priority: '0.6', changefreq: 'weekly' })),
  ];
  const body = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function main(){
  console.log('Supabase에서 데이터 가져오는 중...');
  const [destinations, shorts, products] = await Promise.all([
    fetchTable('destinations', 'select=*&order=id'),
    fetchTable('shorts', 'select=*'),
    fetchTable('products', 'select=*'),
  ]);
  console.log(`destinations: ${destinations.length}, shorts: ${shorts.length}, products: ${products.length}`);

  const productsByVideo = {};
  for(const p of products){
    (productsByVideo[p.youtube_id] ||= []).push(p);
  }

  const shortsCountByDest = {};
  for(const s of shorts){
    shortsCountByDest[s.destination_id] = (shortsCountByDest[s.destination_id] || 0) + 1;
  }

  let destPages = 0;
  let videoPages = 0;

  for(const d of destinations){
    const destShorts = shorts
      .filter(s => s.destination_id === d.id)
      .sort((a, b) => {
        const aHas = (productsByVideo[a.youtube_id] || []).length > 0;
        const bHas = (productsByVideo[b.youtube_id] || []).length > 0;
        if(aHas !== bHas) return bHas - aHas;
        return b.views - a.views;
      })
      .slice(0, 10);

    const related = destinations.filter(x => x.id !== d.id).slice(0, 4);

    const html = buildDestinationPage(d, { topShorts: destShorts, related, shortsCountByDest });
    writeFile(`travel/${destinationSlug(d.id)}/index.html`, html);
    destPages++;
  }

  for(const s of shorts){
    const dest = destinations.find(d => d.id === s.destination_id);
    if(!dest) continue;
    const html = buildVideoPage(s, dest, productsByVideo[s.youtube_id] || []);
    writeFile(`watch/${s.youtube_id}/index.html`, html);
    videoPages++;
  }

  writeFile('ranking/index.html', buildRankingPage(destinations, shorts, products));

  const shortsById = {};
  for(const s of shorts) shortsById[s.youtube_id] = s;
  for(const d of destinations){
    const destEntries = products
      .map(p => {
        const short = shortsById[p.youtube_id];
        return short && short.destination_id === d.id ? { product: p, short, dest: d } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.short.views - a.short.views);
    writeFile(`ranking/${destinationSlug(d.id)}/index.html`, buildDestinationRankingPage(d, destEntries));
  }

  writeFile('sitemap.xml', buildSitemap(destinations, shorts));

  const removedTravel = cleanupStaleDirs('travel', destinations.map(d => destinationSlug(d.id)));
  const removedWatch = cleanupStaleDirs('watch', shorts.map(s => s.youtube_id));
  cleanupStaleDirs('ranking', destinations.map(d => destinationSlug(d.id)));

  console.log(`완료: 여행지 페이지 ${destPages}개, 영상 페이지 ${videoPages}개, sitemap.xml 갱신 (제거된 페이지: 여행지 ${removedTravel}개, 영상 ${removedWatch}개)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
