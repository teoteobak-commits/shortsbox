/* 공통 레이아웃 — 헤더(+검색) / 하단 탭바 / 푸터
   반응형 혼합형: 데스크탑(900px~)은 상단 헤더 내비, 모바일은 하단 탭바로 전환 */

const NAV_LINKS = [
  { href: 'index.html', page: 'home', label: '홈', icon: 'home' },
  { href: 'explore.html', page: 'explore', label: '탐색', icon: 'compass' },
  { href: 'mypage.html', page: 'mypage', label: '마이페이지', icon: 'user' },
];

function renderHeader(activePage){
  const el = document.getElementById('site-header');
  if(!el) return;

  const navHtml = NAV_LINKS.map(n =>
    `<a href="${n.href}" class="${n.page === activePage ? 'active' : ''}">${n.label}</a>`
  ).join('');

  el.innerHTML = `
    <div class="container header-inner">
      <a href="index.html" class="brand">
        <span class="brand-mark">📦</span>
        <span class="brand-name">쇼츠박스</span>
      </a>
      <form class="header-search" id="header-search-form">
        ${icon('search')}
        <input type="search" id="header-search-input" placeholder="여행지를 검색해보세요" aria-label="검색">
      </form>
      <nav class="header-nav">${navHtml}</nav>
      <div class="header-actions">
        <button class="btn btn-ghost btn-icon" id="theme-toggle" aria-label="다크모드 전환"></button>
        <a class="btn btn-ghost btn-icon" href="mypage.html" aria-label="저장한 목록">
          ${icon('bookmark')}
        </a>
      </div>
    </div>
    <div class="header-mobile-search">
      <form class="header-search" id="header-search-form-mobile">
        ${icon('search')}
        <input type="search" id="header-search-input-mobile" placeholder="여행지를 검색해보세요" aria-label="검색">
      </form>
    </div>
  `;

  const goSearch = (value) => {
    const q = value.trim();
    if(q) trackEvent('search_used', { query: q });
    window.location.href = 'explore.html' + (q ? `?q=${encodeURIComponent(q)}` : '');
  };
  document.getElementById('header-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    goSearch(document.getElementById('header-search-input').value);
  });
  document.getElementById('header-search-form-mobile').addEventListener('submit', (e) => {
    e.preventDefault();
    goSearch(document.getElementById('header-search-input-mobile').value);
  });

  updateThemeToggleIcon();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

/* ==========================================================================
   다크모드 / 라이트모드 전환 — 선택값은 localStorage에 저장돼 다음 방문에도 유지된다
   ========================================================================== */
const THEME_KEY = 'shortsbox_theme';

function getTheme(){
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
function updateThemeToggleIcon(){
  const btn = document.getElementById('theme-toggle');
  if(!btn) return;
  btn.innerHTML = getTheme() === 'dark' ? icon('sun') : icon('moon');
}
function toggleTheme(){
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  const root = document.documentElement;
  root.classList.add('theme-switching'); // 전환 중 transition을 잠깐 꺼서 색이 즉시 바뀌게 한다
  root.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeToggleIcon();
  root.offsetHeight; // 강제 리플로우
  requestAnimationFrame(() => root.classList.remove('theme-switching'));
}

function renderBottomNav(activePage){
  const el = document.getElementById('site-bottomnav');
  if(!el) return;
  el.innerHTML = NAV_LINKS.map(n => `
    <a href="${n.href}" class="${n.page === activePage ? 'active' : ''}">
      ${icon(n.icon)}
      <span>${n.label}</span>
    </a>
  `).join('');
}

function renderFooter(){
  const el = document.getElementById('site-footer');
  if(!el) return;
  el.innerHTML = `
    <div class="container">
      <div class="foot-top">
        <div>
          <strong>쇼츠박스</strong>
          <p class="sub" style="margin-top:6px">여행지별 꿀템 쇼츠 큐레이션</p>
        </div>
        <div class="sub">© 2026 쇼츠박스(ShortsBox). All rights reserved.</div>
      </div>
      <p class="disclosure">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 일부 숙소 링크는 아고다 등 다른 제휴 프로그램을 통해 연결됩니다.</p>
      <p class="sub" style="margin-top:4px"><a href="https://link.coupang.com/a/fLDqJwiLng" target="_blank" rel="noopener sponsored" style="text-decoration:underline" data-track-event="coupang_link_clicked" data-track-props='{"location":"footer"}'>🧳 쿠팡에서 여행용품 보러가기</a></p>
      <p class="disclosure" style="margin-top:10px">쇼츠박스에 노출되는 모든 영상의 저작권은 각 채널(원작자)에게 있으며, 유튜브 공식 임베드 방식으로만 재생됩니다.</p>
      <p class="sub" style="margin-top:10px">이 서비스는 YouTube API Services를 사용합니다. (<a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener" style="text-decoration:underline">YouTube 서비스 약관</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style="text-decoration:underline">Google 개인정보처리방침</a>)</p>
      <a href="about.html" class="sub" style="text-decoration:underline">쇼츠박스 소개</a>
      <span class="sub"> · </span>
      <a href="privacy.html" class="sub" style="text-decoration:underline">개인정보처리방침</a>
    </div>
  `;
}

function initLayout(activePage){
  renderHeader(activePage);
  renderBottomNav(activePage);
  renderFooter();
}

/* 여행지 카드 — index.html / explore.html / mypage.html 공통 사용 */
function renderDestinationCard(d){
  const shortsCount = SHORTS.filter(s => s.destinationId === d.id).length;
  const saved = isDestinationSaved(d.id);
  return `
    <a href="${destinationUrl(d)}" class="card">
      <div class="card-cover">
        <span class="card-sticker">${d.emoji}</span>
        <button class="save-btn ${saved ? 'saved' : ''}" data-dest-id="${d.id}" aria-label="여행지 저장">${icon('bookmark')}</button>
      </div>
      <div class="card-body">
        <div class="card-title">${d.name}</div>
        <div class="card-meta">
          <span>${d.country}</span>
        </div>
        <div class="card-footer">
          <span class="stat">${icon('tag', 'icon-sm')}꿀템 쇼츠 ${shortsCount}개</span>
        </div>
      </div>
    </a>
  `;
}

/* 쇼츠 카드 — index.html / detail.html / mypage.html 공통 사용.
   rank가 있으면 순위 배지(상세 페이지), 없으면 여행지 배지(홈/마이페이지)를 보여준다. */
function renderShortsCard(s, rank){
  const d = getDestination(s.destinationId);
  const badge = rank
    ? `<span class="rank-badge">${rank}</span>`
    : `<span class="common-badge">${d.emoji} ${d.name}</span>`;
  return `
    <a href="${videoUrl(s)}" class="shorts-card" data-youtube-id="${s.youtubeId}">
      <div class="shorts-thumb">
        <img src="${thumbUrl(s)}" alt="${s.title}" loading="lazy">
        ${badge}
        <span class="play-badge">${icon('play', 'icon-sm')}</span>
      </div>
      <div class="shorts-card-body">
        <div class="shorts-card-title">${s.title}</div>
        <div class="shorts-card-meta">${s.channelHandle} · 조회수 ${formatViews(s.views)}</div>
      </div>
    </a>
  `;
}

/* 카드 안의 버튼/클릭은 매번 새로 그려지므로, 이벤트 위임으로 한 번만 등록해둔다 */
document.addEventListener('click', (e) => {
  // data-track-event 속성이 있는 링크/버튼은 어디에 있든 공통으로 트래킹한다 (쿠팡/아고다 링크 등)
  const trackEl = e.target.closest('[data-track-event]');
  if(trackEl){
    let props = {};
    try { props = JSON.parse(trackEl.dataset.trackProps || '{}'); } catch(err){ /* 무시 */ }
    trackEvent(trackEl.dataset.trackEvent, props);
  }

  const saveBtn = e.target.closest('.save-btn[data-dest-id]');
  if(saveBtn){
    e.preventDefault();
    e.stopPropagation();
    const saved = toggleSavedDestination(saveBtn.dataset.destId);
    saveBtn.classList.toggle('saved', saved);
    showToast(saved ? '여행지를 저장했어요' : '저장을 취소했어요');
    trackEvent('destination_saved', { destination_id: saveBtn.dataset.destId, action: saved ? 'save' : 'unsave' });
    return;
  }

  const shortsCard = e.target.closest('.shorts-card[data-youtube-id]');
  if(shortsCard){
    // 새 탭으로 열기(가운데 클릭·Ctrl/Cmd/Shift 클릭)는 그대로 링크 이동시키고,
    // 일반 클릭만 가로채서 사이트 안에서 바로 재생한다
    if(e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openVideoLightbox(shortsCard.dataset.youtubeId);
  }
});
