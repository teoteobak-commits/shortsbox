/* 여행지 상세 페이지 로직 — 조회수 TOP10 꿀템 쇼츠 (나라 단위, 준비/현지 구분 없음) */
initLayout('detail');

const detailParams = new URLSearchParams(window.location.search);

(async () => {
  await loadData();
  const destination = getDestination(detailParams.get('id'));

  if(!destination){
    document.getElementById('detail-hero').innerHTML = `
      <div class="container">
        <h1>여행지를 찾을 수 없어요</h1>
        <p style="margin-top:8px"><a href="explore.html" style="text-decoration:underline">탐색으로 돌아가기</a></p>
      </div>`;
  } else {
    renderDetail(destination);
  }
})();

function renderDetail(d){
  document.title = `${d.name} 여행 꿀템 — 쇼츠박스`;
  const saved = isDestinationSaved(d.id);

  document.getElementById('detail-hero').innerHTML = `
    <div class="container">
      <div class="detail-cover">${d.emoji}</div>
      <div class="detail-info">
        <h1>${d.name} 여행 꿀템</h1>
        <div class="detail-meta">
          <span>${d.country}</span>
        </div>
        <div class="detail-actions">
          <button class="btn btn-outline ${saved ? 'saved' : ''}" id="save-btn">${icon('bookmark', 'icon-sm')}${saved ? '저장됨' : '저장'}</button>
          <button class="btn btn-outline" id="share-btn">${icon('share', 'icon-sm')}공유</button>
        </div>
      </div>
    </div>
  `;

  const guide = getDestinationGuide(d.id);
  document.getElementById('destination-guide').innerHTML = guide ? `
    <div class="editorial-guide">
      <span class="editorial-guide-tag">쇼츠박스 에디터 노트</span>
      <h3>${guide.title}</h3>
      <p>${guide.body}</p>
    </div>
  ` : '';

  document.getElementById('agoda-banner').innerHTML = `
    <a href="${getAgodaUrl(d)}" target="_blank" rel="noopener sponsored" class="agoda-banner">
      <div class="agoda-banner-text">
        <span class="agoda-banner-tag">제휴 · AD</span>
        <div class="agoda-banner-title">${d.name} 숙소 최저가 보기</div>
        <div class="agoda-banner-sub">아고다에서 지금 예약하면 더 저렴해요</div>
      </div>
      <span class="agoda-banner-icon">🏨</span>
    </a>
  `;

  renderShorts(d.id);

  const related = DESTINATIONS.filter(x => x.id !== d.id).slice(0, 4);
  document.getElementById('related-grid').innerHTML = related.map(renderDestinationCard).join('');

  document.getElementById('save-btn').addEventListener('click', (e) => {
    const nowSaved = toggleSavedDestination(d.id);
    e.currentTarget.classList.toggle('saved', nowSaved);
    e.currentTarget.innerHTML = `${icon('bookmark', 'icon-sm')}${nowSaved ? '저장됨' : '저장'}`;
    showToast(nowSaved ? '여행지를 저장했어요' : '저장을 취소했어요');
  });
  document.getElementById('share-btn').addEventListener('click', () => showToast('링크가 복사됐어요 (데모)'));
}

function renderShorts(destinationId){
  const list = getTopShorts(destinationId, 10);
  const grid = document.getElementById('shorts-grid');

  if(!list.length){
    grid.innerHTML = `<div class="empty-shorts">아직 꿀템 쇼츠가 없어요. 곧 추가할게요!</div>`;
    return;
  }

  grid.innerHTML = list.map((s, idx) => renderShortsCard(s, idx + 1)).join('');
}
