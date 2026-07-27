/* 홈페이지 로직 */
initLayout('home');

document.getElementById('hero-badge').prepend(
  (() => { const s = document.createElement('span'); s.innerHTML = icon('sparkles', 'icon-sm'); return s.firstChild; })()
);
document.getElementById('featured-more-link').insertAdjacentHTML('beforeend', icon('chevronRight', 'icon-sm'));

(async () => {
  document.getElementById('featured-grid').innerHTML = '<p class="sub">불러오는 중...</p>';
  document.getElementById('home-shorts-grid').innerHTML = '<p class="sub">불러오는 중...</p>';

  await loadData();

  /* 인기 여행지 (앞쪽 8개) */
  document.getElementById('featured-grid').innerHTML = DESTINATIONS.slice(0, 8).map(renderDestinationCard).join('');

  /* 요즘 뜨는 여행 꿀템 쇼츠 (조회수 상위) */
  const topShorts = [...SHORTS].sort(byProductsThenViews).slice(0, 8);
  document.getElementById('home-shorts-grid').innerHTML = topShorts.map(s => renderShortsCard(s)).join('');
})();
