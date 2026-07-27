/* Supabase에서 실시간으로 불러오는 여행지 / 쇼츠 데이터
   매일 1회 배치(supabase/functions/fetch-shorts)가 유튜브에서 여행지별 TOP10을 갱신한다.
   제품 리스트는 자동 수집 불가 영역이라 관리자가 직접 추가한 영상만 존재한다. */

let DESTINATIONS = [];
let SHORTS = [];
let dataLoaded = false;

async function loadData(){
  const [{ data: destinations, error: destErr }, { data: shorts, error: shortsErr }, { data: products, error: prodErr }] =
    await Promise.all([
      db.from('destinations').select('*').order('id'),
      db.from('shorts').select('*').order('views', { ascending: false }),
      db.from('products').select('*'),
    ]);

  if(destErr || shortsErr || prodErr){
    console.error('데이터 로드 실패', destErr || shortsErr || prodErr);
    dataLoaded = true;
    return;
  }

  const productsByVideo = {};
  (products || []).forEach(p => {
    (productsByVideo[p.youtube_id] ||= []).push({ name: p.name, price: p.price, store: p.store });
  });

  DESTINATIONS = (destinations || []).map(d => ({
    id: d.id, name: d.name, country: d.country, emoji: d.emoji,
  }));

  SHORTS = (shorts || []).map(s => ({
    destinationId: s.destination_id,
    youtubeId: s.youtube_id,
    title: s.title,
    channelHandle: s.channel_name,
    views: s.views,
    thumbnailUrl: s.thumbnail_url,
    hashtags: [],
    products: productsByVideo[s.youtube_id] || [],
  }));

  dataLoaded = true;
}

function getDestination(id){
  return DESTINATIONS.find(d => String(d.id) === String(id));
}
/* 제품 정보(구매 가능) 있는 영상을 우선 노출 — 조회수만으로 정렬하면
   제품 없는 자동 수집 영상에 밀려 "바로 살 수 있는" 핵심 가치가 묻힌다 */
function byProductsThenViews(a, b){
  const productDiff = (b.products.length > 0) - (a.products.length > 0);
  if(productDiff !== 0) return productDiff;
  return b.views - a.views;
}
function getTopShorts(destinationId, limit = 10){
  return SHORTS
    .filter(s => String(s.destinationId) === String(destinationId))
    .sort(byProductsThenViews)
    .slice(0, limit);
}
function getShort(youtubeId){
  return SHORTS.find(s => s.youtubeId === youtubeId);
}
function formatViews(n){
  if(n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '만';
  return n.toLocaleString();
}
function thumbUrl(s){
  return s.thumbnailUrl || `https://i.ytimg.com/vi/${s.youtubeId}/hqdefault.jpg`;
}

/* ==========================================================================
   저장 기능 — 계정 없이 브라우저 localStorage로 저장 (회원가입 불필요)
   ========================================================================== */
const SAVE_KEYS = { destinations: 'shortsbox_saved_destinations', videos: 'shortsbox_saved_videos' };

function readSavedIds(key){
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch(e){
    return [];
  }
}
function writeSavedIds(key, ids){
  localStorage.setItem(key, JSON.stringify(ids));
}
function isDestinationSaved(id){
  return readSavedIds(SAVE_KEYS.destinations).some(x => String(x) === String(id));
}
function toggleSavedDestination(id){
  const ids = readSavedIds(SAVE_KEYS.destinations);
  const idx = ids.findIndex(x => String(x) === String(id));
  if(idx === -1) ids.push(id); else ids.splice(idx, 1);
  writeSavedIds(SAVE_KEYS.destinations, ids);
  return idx === -1; // true면 방금 저장됨
}
function isVideoSaved(youtubeId){
  return readSavedIds(SAVE_KEYS.videos).includes(youtubeId);
}
function toggleSavedVideo(youtubeId){
  const ids = readSavedIds(SAVE_KEYS.videos);
  const idx = ids.indexOf(youtubeId);
  if(idx === -1) ids.push(youtubeId); else ids.splice(idx, 1);
  writeSavedIds(SAVE_KEYS.videos, ids);
  return idx === -1;
}
