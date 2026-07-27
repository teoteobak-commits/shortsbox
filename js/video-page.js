/* 쇼츠 상세 페이지 로직 — 유튜브 임베드 + 영상 속 제품 리스트 */
initLayout('video');

const videoParams = new URLSearchParams(window.location.search);

(async () => {
  await loadData();
  const short = getShort(videoParams.get('v'));

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
  const saved = isVideoSaved(s.youtubeId);

  document.getElementById('video-layout').innerHTML = `
    <div class="video-embed">
      <iframe src="https://www.youtube.com/embed/${s.youtubeId}" title="${s.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    <a href="https://youtube.com/shorts/${s.youtubeId}" target="_blank" rel="noopener" class="video-yt-link">${icon('external', 'icon-sm')}재생이 안 되면 유튜브에서 보기</a>
    <span class="badge badge-gem" style="margin-bottom:10px">${dest.emoji} ${dest.name}</span>
    <h1 class="video-title">${s.title}</h1>
    <div class="video-channel">${s.channelHandle} · 조회수 ${formatViews(s.views)}</div>
    <div class="btn-row" style="margin-bottom:var(--space-5)">
      <button class="btn btn-outline btn-sm ${saved ? 'saved' : ''}" id="save-video-btn">${icon('bookmark', 'icon-sm')}${saved ? '저장됨' : '저장'}</button>
      <button class="btn btn-outline btn-sm" id="share-video-btn">${icon('share', 'icon-sm')}공유</button>
    </div>

    <div class="section-head" style="margin-bottom:12px">
      <h2 style="font-size:16px">${icon('tag', 'icon-sm')} 영상 속 아이템 ${s.products.length ? `(${s.products.length})` : ''}</h2>
    </div>
    <div class="product-list" id="product-list"></div>

    <a href="detail.html?id=${dest.id}" class="btn btn-outline btn-block">
      ${icon('compass', 'icon-sm')}${dest.name} 여행 꿀템 더 보기
    </a>
  `;

  document.getElementById('save-video-btn').addEventListener('click', (e) => {
    const nowSaved = toggleSavedVideo(s.youtubeId);
    e.currentTarget.classList.toggle('saved', nowSaved);
    e.currentTarget.innerHTML = `${icon('bookmark', 'icon-sm')}${nowSaved ? '저장됨' : '저장'}`;
    showToast(nowSaved ? '쇼츠를 저장했어요' : '저장을 취소했어요');
  });
  document.getElementById('share-video-btn').addEventListener('click', () => showToast('링크가 복사됐어요 (데모)'));

  const productListEl = document.getElementById('product-list');
  if(!s.products.length){
    productListEl.innerHTML = `<div class="empty-state" style="padding:var(--space-5)">${icon('tag', 'icon-lg')}<p>제품 정보는 아직 준비 중이에요.<br>영상에서 직접 확인해주세요.</p></div>`;
    return;
  }

  productListEl.innerHTML = s.products.map(p => `
    <div class="product-row">
      <div class="product-thumb">🛍️</div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">${p.store} · <strong>${/^\d/.test(p.price) ? '₩' + p.price : p.price}</strong></div>
      </div>
      <button class="btn btn-primary btn-sm buy-btn">구매</button>
    </div>
  `).join('');

  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('실제 구매 링크 연동은 PART 2(제휴 API)에서 진행돼요');
    });
  });
}
