/* 탐색 페이지 로직 — 여행지 검색 */
initLayout('explore');

const params = new URLSearchParams(window.location.search);
const state = {
  sort: params.get('sort') || 'shorts',
  q: params.get('q') || '',
};

document.getElementById('filter-sort').value = state.sort;

function updateUrl(){
  const p = new URLSearchParams();
  if(state.sort !== 'shorts') p.set('sort', state.sort);
  if(state.q) p.set('q', state.q);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `explore.html?${qs}` : 'explore.html');
}

function shortsCount(destId){
  return SHORTS.filter(s => s.destinationId === destId).length;
}

function applyFilters(){
  updateUrl();

  let results = DESTINATIONS.filter(d => {
    if(state.q){
      const haystack = `${d.name} ${d.country}`.toLowerCase();
      if(!haystack.includes(state.q.toLowerCase())) return false;
    }
    return true;
  });

  results = state.sort === 'name'
    ? results.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    : results.sort((a, b) => shortsCount(b.id) - shortsCount(a.id));

  const grid = document.getElementById('explore-grid');
  const empty = document.getElementById('explore-empty');
  const countEl = document.getElementById('result-count');
  const queryDesc = document.getElementById('explore-query-desc');

  countEl.innerHTML = `총 <strong>${results.length}개</strong>의 여행지`;
  queryDesc.textContent = state.q
    ? `"${state.q}" 검색 결과예요.`
    : '여행지를 검색해서 꿀템 쇼츠를 찾아보세요.';

  if(results.length === 0){
    grid.style.display = 'none';
    empty.style.display = 'block';
    empty.innerHTML = `${icon('compass', 'icon-lg')}<p>조건에 맞는 여행지가 없어요.<br>다른 키워드로 검색해보세요.</p>`;
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
  state.sort = 'shorts'; state.q = '';
  document.getElementById('filter-sort').value = 'shorts';
  applyFilters();
});
