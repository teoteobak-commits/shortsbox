/* 탐색 페이지 로직 — 여행지 정렬/필터 */
initLayout('explore');

const params = new URLSearchParams(window.location.search);
const state = {
  sort: params.get('sort') || 'shorts',
};

document.getElementById('filter-sort').value = state.sort;

function updateUrl(){
  const p = new URLSearchParams();
  if(state.sort !== 'shorts') p.set('sort', state.sort);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `explore.html?${qs}` : 'explore.html');
}

function shortsCount(destId){
  return SHORTS.filter(s => s.destinationId === destId).length;
}

function applyFilters(){
  updateUrl();

  const results = state.sort === 'name'
    ? DESTINATIONS.slice().sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    : DESTINATIONS.slice().sort((a, b) => shortsCount(b.id) - shortsCount(a.id));

  const grid = document.getElementById('explore-grid');
  const empty = document.getElementById('explore-empty');
  const countEl = document.getElementById('result-count');

  countEl.innerHTML = `총 <strong>${results.length}개</strong>의 여행지`;

  if(results.length === 0){
    grid.style.display = 'none';
    empty.style.display = 'block';
    empty.innerHTML = `${icon('compass', 'icon-lg')}<p>아직 등록된 여행지가 없어요.</p>`;
  } else {
    grid.style.display = 'grid';
    empty.style.display = 'none';
    grid.innerHTML = results.map(renderDestinationCard).join('');
  }
}

document.getElementById('explore-grid').innerHTML = '';
document.getElementById('result-count').innerHTML = '불러오는 중...';
(async () => {
  await loadData();
  applyFilters();
})();

document.getElementById('filter-sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  applyFilters();
});
document.getElementById('filter-reset').addEventListener('click', (e) => {
  e.preventDefault();
  state.sort = 'shorts';
  document.getElementById('filter-sort').value = 'shorts';
  applyFilters();
});
