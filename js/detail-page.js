/* 여행지 상세 페이지 로직 — 조회수 TOP10 꿀템 쇼츠 (나라 단위, 준비/현지 구분 없음) */
initLayout('detail');

const detailParams = new URLSearchParams(window.location.search);

/* /detail.html?id=3 (레거시)과 /travel/{slug}/ (신규 clean URL) 둘 다 지원 */
function resolveDestinationId(){
  const fromQuery = detailParams.get('id');
  if(fromQuery) return fromQuery;
  const match = window.location.pathname.match(/\/travel\/([^/]+)\/?$/);
  return match ? destinationIdFromSlug(match[1]) : null;
}

(async () => {
  await loadData();
  const destination = getDestination(resolveDestinationId());

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
  const guideForMeta = getDestinationGuide(d.id);
  const description = `${d.name} 여행 꿀템 쇼츠 TOP10과 영상 속 제품 구매처를 모아봤어요.${guideForMeta ? ' ' + guideForMeta.body.slice(0, 80) : ''}`;
  const canonicalUrl = `https://shortsbox.kr${destinationUrl(d)}`;
  const graph = [{
    '@type': 'TouristAttraction',
    name: `${d.name} 여행 꿀템`,
    description,
    url: canonicalUrl,
    touristType: '여행객',
  }];
  if(guideForMeta && guideForMeta.faq && guideForMeta.faq.length){
    graph.push({
      '@type': 'FAQPage',
      mainEntity: guideForMeta.faq.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }
  setPageMeta({
    description,
    ogTitle: `${d.name} 여행 꿀템 — 쇼츠박스`,
    ogDescription: description,
    url: canonicalUrl,
    jsonLd: { '@context': 'https://schema.org', '@graph': graph },
  });
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
  document.getElementById('destination-guide').innerHTML = guide ? renderGuideBlock(guide) : '';

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

function renderGuideBlock(guide){
  return `
    <div class="editorial-guide">
      <span class="editorial-guide-tag">쇼츠박스 에디터 노트</span>
      <h3>${guide.title}</h3>
      <p>${guide.body}</p>

      ${guide.bestTime || guide.budget ? `
      <div class="guide-facts">
        ${guide.bestTime ? `<div class="guide-fact"><span class="guide-fact-label">${icon('sun', 'icon-sm')}최적 시기</span><span>${guide.bestTime}</span></div>` : ''}
        ${guide.budget ? `<div class="guide-fact"><span class="guide-fact-label">${icon('tag', 'icon-sm')}예산 감</span><span>${guide.budget}</span></div>` : ''}
      </div>` : ''}

      ${guide.packingList && guide.packingList.length ? `
      <div class="guide-section">
        <h4>${icon('suitcase', 'icon-sm')} 짐싸기 체크리스트</h4>
        <div class="packing-list">
          ${guide.packingList.map(item => `<span class="packing-chip">${item}</span>`).join('')}
        </div>
      </div>` : ''}

      ${guide.faq && guide.faq.length ? `
      <div class="guide-section">
        <h4>${icon('search', 'icon-sm')} 자주 묻는 질문</h4>
        <div class="faq-list">
          ${guide.faq.map(f => `
            <div class="faq-item">
              <div class="faq-q">Q. ${f.q}</div>
              <div class="faq-a">${f.a}</div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    </div>
  `;
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
