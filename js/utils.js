/* 공용 유틸 — HTML 이스케이프. 영상 제목/채널명 등은 매일 자동으로 유튜브에서 수집되는
   외부 데이터라, innerHTML에 그대로 넣기 전에 반드시 이스케이프해야 함(저장형 XSS 방지) */
function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* 공용 유틸 — Vercel Analytics 커스텀 이벤트 트래킹.
   va 큐 스텁 — 스크립트 로드 전에 호출돼도 큐에 쌓였다가 로드 후 처리됨 */
window.va = window.va || function(){ (window.vaq = window.vaq || []).push(arguments); };
function trackEvent(name, data){
  try { window.va('event', { name, data }); } catch(e){ /* 트래킹 실패는 무시 — 기능에 영향 없어야 함 */ }
}

/* 공용 유틸 — SEO 메타 태그 갱신 (동적 페이지에서 title 외에 description/OG/JSON-LD도 실제 콘텐츠에 맞게 덮어쓰기 위함) */
function setPageMeta({ description, ogTitle, ogDescription, ogImage, url, jsonLd }){
  if(description){
    let metaDesc = document.querySelector('meta[name="description"]');
    if(!metaDesc){
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }

  const ogTags = {
    'og:title': ogTitle || document.title,
    'og:description': ogDescription || description,
    'og:type': 'website',
    'og:url': url || window.location.href,
    'og:image': ogImage || 'https://www.shortsbox.kr/assets/og-image.png',
  };
  Object.entries(ogTags).forEach(([prop, content]) => {
    if(!content) return;
    let tag = document.querySelector(`meta[property="${prop}"]`);
    if(!tag){
      tag = document.createElement('meta');
      tag.setAttribute('property', prop);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  });

  let canonical = document.querySelector('link[rel="canonical"]');
  if(!canonical){
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url || window.location.href);

  if(jsonLd){
    let script = document.getElementById('page-jsonld');
    if(!script){
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'page-jsonld';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  }
}

/* 공용 유틸 — 실제 공유 기능. 모바일은 네이티브 공유 시트(카톡/인스타 DM 등 원탭 공유),
   지원 안 하면 클립보드 복사로 대체 */
async function shareUrl({ title, text, url, trackName }){
  const shareUrl = url || window.location.href;
  if(navigator.share){
    try{
      await navigator.share({ title, text, url: shareUrl });
      trackEvent('share_used', { method: 'native', name: trackName });
      return;
    }catch(err){
      if(err.name === 'AbortError') return; // 사용자가 공유 취소함 — 토스트 띄우지 않음
    }
  }
  try{
    await navigator.clipboard.writeText(shareUrl);
    showToast('링크가 복사됐어요');
    trackEvent('share_used', { method: 'clipboard', name: trackName });
  }catch(err){
    showToast(shareUrl);
  }
}

/* 공용 유틸 — 토스트 알림 */
let toastTimer = null;
function showToast(message){
  let el = document.getElementById('toast');
  if(!el){
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
