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
    'og:image': ogImage || 'https://shortsbox.kr/assets/og-image.png',
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
