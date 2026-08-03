/* 쇼츠 라이트박스 — 카드를 클릭하면 페이지 이동 없이 바로 그 자리에서 재생 */

function buildLightbox(){
  if(document.getElementById('video-lightbox-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.id = 'video-lightbox-overlay';
  overlay.innerHTML = `
    <div class="lightbox">
      <button class="lightbox-close" id="lightbox-close" aria-label="닫기">${icon('close')}</button>
      <div class="lightbox-embed" id="lightbox-embed"></div>
      <div class="lightbox-info">
        <div class="lightbox-title" id="lightbox-title"></div>
        <div class="lightbox-meta" id="lightbox-meta"></div>
        <a href="#" class="btn btn-gradient btn-block" id="lightbox-detail-link">${icon('tag', 'icon-sm')}영상 속 아이템 보기</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) closeVideoLightbox();
  });
  document.getElementById('lightbox-close').addEventListener('click', closeVideoLightbox);
}

function openVideoLightbox(youtubeId){
  const s = getShort(youtubeId);
  if(!s) return;
  buildLightbox();
  trackEvent('video_played', { youtube_id: s.youtubeId, destination_id: s.destinationId, source: 'lightbox' });

  document.getElementById('lightbox-embed').innerHTML = `
    <iframe src="https://www.youtube.com/embed/${s.youtubeId}?autoplay=1" title="${escapeHtml(s.title)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  `;
  document.getElementById('lightbox-title').textContent = s.title;
  document.getElementById('lightbox-meta').textContent = `${s.channelHandle} · 조회수 ${formatViews(s.views)}`;
  document.getElementById('lightbox-detail-link').href = videoUrl(s);

  document.getElementById('video-lightbox-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoLightbox(){
  const overlay = document.getElementById('video-lightbox-overlay');
  if(!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('lightbox-embed').innerHTML = ''; // iframe 제거로 재생 중지
}

document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') closeVideoLightbox();
});
