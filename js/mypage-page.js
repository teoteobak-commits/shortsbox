/* 저장한 목록 페이지 — 회원가입 없이 브라우저 localStorage 기반 */
initLayout('mypage');

function renderProfileHero(destCount, shortsCount){
  document.getElementById('profile-hero').innerHTML = `
    <div class="container" style="flex-direction:column;align-items:flex-start;gap:8px">
      <h1 style="font-size:20px">저장한 목록</h1>
      <p style="font-size:13px;color:rgba(255,255,255,.9)">회원가입 없이 이 브라우저에 바로 저장돼요.</p>
      ${(destCount + shortsCount) > 0 ? `<button class="btn btn-outline" id="clear-all-btn" style="background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.5);color:#fff">${icon('bookmark', 'icon-sm')}전체 삭제</button>` : ''}
    </div>
  `;
  const clearBtn = document.getElementById('clear-all-btn');
  if(clearBtn){
    clearBtn.addEventListener('click', () => {
      writeSavedIds(SAVE_KEYS.destinations, []);
      writeSavedIds(SAVE_KEYS.videos, []);
      showToast('저장한 목록을 모두 삭제했어요');
      renderSaved();
    });
  }
}

async function renderSaved(){
  const savedDestinations = readSavedIds(SAVE_KEYS.destinations).map(id => getDestination(id)).filter(Boolean);
  const savedShorts = readSavedIds(SAVE_KEYS.videos).map(id => getShort(id)).filter(Boolean);

  renderProfileHero(savedDestinations.length, savedShorts.length);

  document.getElementById('stat-row').innerHTML = `
    <div class="stat-cell"><span class="num">${savedDestinations.length}</span><span class="label">저장한 여행지</span></div>
    <div class="stat-cell"><span class="num">${savedShorts.length}</span><span class="label">저장한 쇼츠</span></div>
  `;

  const destGrid = document.getElementById('saved-destinations');
  if(!savedDestinations.length){
    destGrid.innerHTML = `<div class="mypage-empty" style="grid-column:1/-1">${icon('bookmark', 'icon-lg')}<p>아직 저장한 여행지가 없어요.</p><a href="explore.html" class="btn btn-gradient">여행지 둘러보기</a></div>`;
  } else {
    destGrid.innerHTML = savedDestinations.map(renderDestinationCard).join('');
  }

  const shortsGrid = document.getElementById('saved-shorts');
  if(!savedShorts.length){
    shortsGrid.innerHTML = `<div class="mypage-empty" style="grid-column:1/-1">${icon('bookmark', 'icon-lg')}<p>아직 저장한 쇼츠가 없어요.</p></div>`;
  } else {
    shortsGrid.innerHTML = savedShorts.map(s => renderShortsCard(s)).join('');
  }
}

(async () => {
  document.getElementById('saved-destinations').innerHTML = '<p class="sub">불러오는 중...</p>';
  document.getElementById('saved-shorts').innerHTML = '<p class="sub">불러오는 중...</p>';
  await loadData();
  renderSaved();
})();
