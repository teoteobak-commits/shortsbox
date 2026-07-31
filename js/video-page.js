/* 쇼츠 상세 페이지 로직 — 유튜브 임베드 + 영상 속 제품 리스트 */
initLayout('video');

/* 쇼츠박스 자체 작성 콘텐츠 — 모든 영상 페이지 공통 노출 (외부 콘텐츠 비중 완화용) */
const CURATION_NOTE = '쇼츠박스는 여행 유튜버들이 직접 추천한 여행 아이템만 모아서 보여드려요. 영상 속 정확한 제품을 특정하기 어려운 경우가 많아서, 특징이 비슷한 상품을 대신 연결해드리고 있어요. 실제 구매 전에는 영상 설명란이나 판매 페이지에서 제품 정보를 한 번 더 확인해보시는 걸 추천해요.';

const videoParams = new URLSearchParams(window.location.search);

/* /video.html?v=xxx (레거시)과 /watch/{youtubeId}/ (신규 clean URL) 둘 다 지원 */
function resolveVideoId(){
  const fromQuery = videoParams.get('v');
  if(fromQuery) return fromQuery;
  const match = window.location.pathname.match(/\/watch\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

(async () => {
  await loadData();
  const short = getShort(resolveVideoId());

  if(!short){
    document.getElementById('video-layout').innerHTML = `
      <h1>영상을 찾을 수 없어요</h1>
      <p style="margin-top:8px"><a href="explore.html" style="text-decoration:underline">탐색으로 돌아가기</a></p>
    `;
  } else {
    renderVideo(short);
  }
})();

function renderVideo(s){
  document.title = `${s.title} — 쇼츠박스`;

  const dest = getDestination(s.destinationId);
  const description = `${dest.name} 여행 꿀템 쇼츠 "${s.title}" — 영상 속 아이템${s.products.length ? `(${s.products.map(p => p.name).slice(0, 3).join(', ')} 등)` : ''}과 구매처를 확인하세요.`;
  setPageMeta({
    description,
    ogTitle: `${s.title} — 쇼츠박스`,
    ogDescription: description,
    ogImage: thumbUrl(s),
    url: `https://shortsbox.kr${videoUrl(s)}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: s.title,
      description,
      thumbnailUrl: `https://i.ytimg.com/vi/${s.youtubeId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${s.youtubeId}`,
      uploadDate: s.uploadedAt || undefined,
    },
  });
  const saved = isVideoSaved(s.youtubeId);

  const guide = getDestinationGuide(dest.id);

  document.getElementById('video-layout').innerHTML = `
    <span class="badge badge-gem" style="margin-bottom:10px">${dest.emoji} ${dest.name}</span>
    <h1 class="video-title">${s.title}</h1>
    <div class="video-channel">${s.channelHandle} · 조회수 ${formatViews(s.views)}</div>
    ${VIDEO_NOTES[s.youtubeId] ? `<p class="video-note">${VIDEO_NOTES[s.youtubeId]}</p>` : ''}

    <div class="video-embed">
      <iframe src="https://www.youtube.com/embed/${s.youtubeId}" title="${s.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    <a href="https://youtube.com/shorts/${s.youtubeId}" target="_blank" rel="noopener" class="video-yt-link">${icon('external', 'icon-sm')}재생이 안 되면 유튜브에서 보기</a>

    <div class="btn-row" style="margin-bottom:var(--space-5)">
      <button class="btn btn-outline btn-sm ${saved ? 'saved' : ''}" id="save-video-btn">${icon('bookmark', 'icon-sm')}${saved ? '저장됨' : '저장'}</button>
      <button class="btn btn-outline btn-sm" id="share-video-btn">${icon('share', 'icon-sm')}공유</button>
    </div>

    <div class="section-head" style="margin-bottom:12px">
      <h2 style="font-size:16px">${icon('tag', 'icon-sm')} 영상 속 아이템 종류 ${s.products.length ? `(${s.products.length})` : ''}</h2>
    </div>
    ${s.products.length ? `<p class="sub" style="margin:-4px 0 var(--space-3)">정확히 같은 제품이 아니라, 비슷한 종류를 검색해서 보여드려요.</p>` : ''}
    <div class="product-list" id="product-list"></div>

    <div class="editorial-guide" style="margin-bottom:var(--space-4)">
      <span class="editorial-guide-tag">쇼츠박스 큐레이션 안내</span>
      <p>${CURATION_NOTE}</p>
    </div>

    ${guide ? renderGuideBlockHtml(guide) : ''}

    <a href="${destinationUrl(dest)}" class="btn btn-outline btn-block" style="margin-top:var(--space-4)">
      ${icon('compass', 'icon-sm')}${dest.name} 여행 꿀템 더 보기
    </a>
  `;

  document.getElementById('save-video-btn').addEventListener('click', (e) => {
    const nowSaved = toggleSavedVideo(s.youtubeId);
    e.currentTarget.classList.toggle('saved', nowSaved);
    e.currentTarget.innerHTML = `${icon('bookmark', 'icon-sm')}${nowSaved ? '저장됨' : '저장'}`;
    showToast(nowSaved ? '쇼츠를 저장했어요' : '저장을 취소했어요');
    trackEvent('video_saved', { youtube_id: s.youtubeId, action: nowSaved ? 'save' : 'unsave' });
  });
  document.getElementById('share-video-btn').addEventListener('click', () => shareUrl({
    title: `${s.title} — 쇼츠박스`,
    text: `${dest.name} 여행 꿀템 쇼츠 "${s.title}"`,
    url: `https://shortsbox.kr${videoUrl(s)}`,
    trackName: 'video_detail',
  }));

  const productListEl = document.getElementById('product-list');
  if(!s.products.length){
    productListEl.innerHTML = `<div class="empty-state" style="padding:var(--space-5)">${icon('tag', 'icon-lg')}<p>이 영상 속 정확한 아이템은 아직 정리 전이에요.<br>영상 설명란에서 확인해보시거나, 비슷한 여행용품을 둘러보세요.</p>
      <a href="https://link.coupang.com/a/fLDqJwiLng" target="_blank" rel="noopener sponsored" class="btn btn-primary btn-sm" style="margin-top:var(--space-3)" data-track-event="coupang_link_clicked" data-track-props='{"location":"product_empty_state"}'>🧳 쿠팡에서 여행용품 둘러보기</a>
    </div>`;
    return;
  }

  productListEl.innerHTML = s.products.map(p => {
    const trackProps = JSON.stringify({ location: 'product_list', product_name: p.name, youtube_id: s.youtubeId }).replace(/'/g, '&#39;');
    const link = p.coupangUrl || `https://www.coupang.com/np/search?q=${encodeURIComponent(p.name)}`;
    return `
    <div class="product-row">
      <div class="product-thumb">🛍️</div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">${p.store}에서 비슷한 상품 찾아보기</div>
      </div>
      <a href="${link}" target="_blank" rel="noopener sponsored" class="btn btn-primary btn-sm" data-track-event="coupang_link_clicked" data-track-props='${trackProps}'>쿠팡에서 찾기</a>
    </div>
  `;
  }).join('');
}
