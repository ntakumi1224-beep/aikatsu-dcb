(()=>{'use strict';
const {cards,coordinates,news,newsCategories}=DCBData,store=DCBStore,app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',binder:'M12 6c-2-2-6-3-10-2v15c4-1 8 0 10 2 2-2 6-3 10-2V4c-4-1-8 0-10 2ZM12 6v15',trade:'M3 7h17l-4-4M21 17H4l4 4',news:'M5 3h16v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8h2M5 3v16a2 2 0 0 0 2 2M8 6h10M8 10h4v4H8zM15 10h3M15 14h3M8 17h10',settings:'M9.17 5.16L10.34 4.79L10.26 2.15L13.74 2.15L13.66 4.79L14.83 5.16L15.92 5.72L17.74 3.81L20.19 6.26L18.28 8.08L18.84 9.17L19.21 10.34L21.85 10.26L21.85 13.74L19.21 13.66L18.84 14.83L18.28 15.92L20.19 17.74L17.74 20.19L15.92 18.28L14.83 18.84L13.66 19.21L13.74 21.85L10.26 21.85L10.34 19.21L9.17 18.84L8.08 18.28L6.26 20.19L3.81 17.74L5.72 15.92L5.16 14.83L4.79 13.66L2.15 13.74L2.15 10.26L4.79 10.34L5.16 9.17L5.72 8.08L3.81 6.26L6.26 3.81L8.08 5.72ZM15.2 12a3.2 3.2 0 1 1-6.4 0 3.2 3.2 0 0 1 6.4 0',search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14M15 15l6 6',filter:'M3 5h18M6 12h12M9 19h6',back:'M15 5l-7 7 7 7',grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',list:'M4 6h16M4 12h16M4 18h16'};
const icon=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.binder}"/></svg>`;
const go=hash=>{if(location.hash===hash)render();else location.hash=hash;};
let filters={},query='',mode='cards',showFilters=false,user='コレクター',toastTimer;
const binderRules=DCBBinder;
let cardSort='release',cardPreset='',coordinateState={type:'',status:'',sort:'release'},albumState={sort:'registered',gaps:'keep',cardKind:''},binderPhotoURLs=[],binderPhotoRevision=0;
let cardView='grid',mergeNames=false;
try{mergeNames=localStorage.getItem('dcb-binder-merge-names')==='true';}catch{}
try{if(localStorage.getItem('dcb-binder-view')==='list')cardView='list';}catch{}
const sortOptions=[['release','登場順'],['number','カード番号順'],['brand','ブランド順'],['coordinate','コーデ順'],['owned','所持状況']];
const selectOptions=(items,value)=>items.map(([v,l])=>`<option value="${v}" ${v===value?'selected':''}>${l}</option>`).join('');
try{user=localStorage.getItem('dcb-name')||user;}catch{}
const toast=text=>{const el=document.getElementById('toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2200);};
const garment=category=>{
const shapes={トップス:'<path d="M30 20 12 33l12 20 12-7-3 47h54l-3-47 12 7 12-20-18-13-17-7q-13 18-26 0Z"/><path d="M44 60h33M55 24v62" stroke="white" stroke-width="3" fill="none"/><path d="m42 52 18 8 18-8-6 15H49Z" fill="white" opacity=".8"/>',ボトムス:'<path d="M40 25h40l21 70H19Z"/><path d="m47 31-10 55M60 31v57M73 31l10 55" fill="none" stroke="white" stroke-width="3" opacity=".6"/><path d="M36 26h48v10H36Z" fill="white" opacity=".8"/>',シューズ:'<path d="M20 23h27v43l14 10v16H13V76l7-8ZM72 23h27v43l14 10v16H65V76l7-8Z"/><path d="M19 45h27M71 45h27M15 84h42M67 84h42" stroke="white" stroke-width="4" fill="none"/>',アイカツパス:'<rect x="20" y="15" width="80" height="96" rx="9"/><path d="m60 30 6 18 18 1-14 12 4 18-14-10-14 10 4-18-14-12 18-1Z" fill="white"/><path d="M37 91h46" stroke="white" stroke-width="4"/>',アクセサリー:'<path d="M58 52 18 28v53l40-21 44 21V28Z"/><circle cx="60" cy="56" r="12" fill="white"/><circle cx="60" cy="56" r="6"/><path d="m52 65-12 37 20-13 19 13-12-37"/>'};
return `<svg viewBox="0 0 120 125" aria-hidden="true" fill="currentColor">${shapes[category]||shapes['トップス']}</svg>`;};
const art=(c,badges=true)=>{const s=store.get(c);return `<div class="art" style="--color:${c.color}">${c.image?`<img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" decoding="async">`:`<span class="art-brand">${esc(c.brand==='該当なし'?'':c.brand)}</span><span class="sparkle">✧</span>${garment(c.category)}<span class="art-bottom">${esc(c.rarity==='該当なし'?'':c.rarity)}</span>`}${badges&&s.favorite?'<span class="heart">♥</span>':''}${badges&&s.ownedCount>1?`<span class="badge">×${s.ownedCount}</span>`:''}</div>`;};
const card=c=>`<button class="card" data-go="#card/${c.id}" aria-label="${esc(c.name)} ${c.cardNumber}">${art(c)}<div class="card-number">${c.cardNumber}</div><div class="card-name">${esc(c.name)}</div><div class="owned ${store.get(c).ownedCount?'yes':''}">${store.get(c).ownedCount?'● 所持 '+store.get(c).ownedCount+'枚':'○ 未所持'}</div></button>`;
const list=(items,cls='')=>items.length?`<div class="grid ${cls}">${items.map(card).join('')}</div>`:'<div class="empty"><span class="symbol">⌕</span><h2>カードが見つかりません</h2><p>検索ワードや絞り込みを変更してください。</p></div>';
const title=(en,jp,sub='')=>`<div class="welcome"><div><div class="eyebrow">${en}</div><h1>${jp}</h1>${sub?`<p class="muted">${sub}</p>`:''}</div><span class="pill">個人用プロトタイプ · V0.1</span></div>`;
const back=()=>`<button class="back btn-text" data-action="back">${icon('back')} 戻る</button>`;
const fields=[['cardKind','カード種別'],['release','登場弾'],['brand','ブランド'],['character','キャラクター'],['type','タイプ'],['category','カテゴリ'],['rarity','レアリティ'],['coordinateId','コーデ'],['acquisition','入手区分']];
const metadata=(obj,includeConcept=false)=>!includeConcept&&!DCBData.isDressCard(obj)?`<dl>${[['cardKind','カード種別'],['specification','デザイン / 仕様'],['character','キャラクター'],['acquisitionMethod','具体的な入手方法'],['startDate','登場・配布開始'],['endDate','配布終了'],['target','対象店舗 / イベント / 商品'],['conditions','入手条件'],['availability','提供状況'],['schoolName','学校名'],['passDesign','デザイン名'],['motif','モチーフ']].filter(([key])=>obj[key]&&obj[key]!=='該当なし').map(([key,label])=>`<dt>${label}</dt><dd>${esc(obj[key])}</dd>`).join('')}</dl>`:`<dl>${[['brand','ブランド'],['type','タイプ'],['character','キャラクター'],['release','登場時期'],['series','シリーズ'],...(includeConcept?[['concept','コンセプト']]:[['category','カテゴリ']]),['acquisition','入手方法'],['rarity','レアリティ'],...(!includeConcept?[['specification','仕様'],['acquisitionMethod','具体的な入手方法'],['startDate','登場・配布開始'],['endDate','配布終了'],['availability','提供状況'],['verificationStatus','確認状態']]:[])].map(([key,label])=>`<dt>${label}</dt><dd>${esc(obj[key])}</dd>`).join('')}</dl>`;
const typeColor=c=>({'キュート':'var(--color-pink)','クール':'var(--color-blue)','セクシー':'var(--color-purple)','ポップ':'var(--color-orange)'}[c.type]||'var(--color-muted)');
function binderArt(c,badge=true){const count=store.get(c).ownedCount;return `<div class="art compact-art ${count?'is-owned':'is-missing'}" style="--color:${count?typeColor(c):'var(--color-muted)'}"><span class="binder-image-frame" ${count?`data-photo-card="${c.id}"`:''}>${garment(c.category)}</span>${badge&&count?`<span class="inventory-badge">×${count}</span>`:''}</div>`;}
// Official numbers can identify multiple print variants; internal IDs remain route keys.
const binderNumberCounts=cards.reduce((counts,c)=>{if(c.cardNumber)counts.set(c.cardNumber,(counts.get(c.cardNumber)||0)+1);return counts;},new Map());
const binderSpecification=c=>(binderNumberCounts.get(c.cardNumber)||0)>1?(/パラレル/.test(c.specification||'')?'パラレル':c.specification||''):'';
const binderStartDate=c=>{const value=c.startDate||'';return /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(value)?value.slice(0,10).replaceAll('-','.'):value;};
function binderCard(c){
 const count=store.get(c).ownedCount,dress=DCBData.isDressCard(c),spec=dress?binderSpecification(c):c.specification||'';
 const information=(!dress?[spec,binderStartDate(c)]:cardView==='list'?[c.cardNumber,c.rarity,spec,binderStartDate(c)]:[c.cardNumber,spec]).filter(Boolean).join('　');
 return `<button class="card ${cardView==='list'?'binder-row':'binder-card'}" data-go="#card/${c.id}" aria-label="${esc(c.name)} ${esc(information)} ${count?'所持 '+count+'枚':'未所持'}">${binderArt(c,cardView==='grid')}<span class="binder-card-info"><span class="card-name" title="${esc(c.name)}">${esc(c.name)}</span>${!dress&&cardView==='grid'?`<span class="card-number" title="${esc(spec)}">${esc(spec)}</span><span class="card-number">${esc(binderStartDate(c))}</span>`:`<span class="card-number" title="${esc(information)}">${esc(information)}</span>`}</span>${cardView==='list'&&count?`<span class="list-owned-count">×${count}</span>`:''}</button>`;
}
const shortSpecification=c=>/パラレル/.test(c.specification||'')?'パラレル':c.specification||'仕様未確認';
function binderGroups(items){return mergeNames?binderRules.groupCards(items,cards):items.map(c=>({id:c.id,cards:[c]}));}
function binderGroup(group){
 if(group.cards.length===1)return binderCard(group.cards[0]);
 const representative=group.cards.find(c=>store.get(c).ownedCount>0)||group.cards[0];
 const info=[...new Set(group.cards.map(c=>c.cardNumber).filter(Boolean))].join(' / ')+'　'+[...new Set(group.cards.map(c=>c.rarity).filter(r=>r&&r!=='該当なし'))].join(' / ')+'　'+group.cards.length+'仕様';
 return `<button class="card ${cardView==='list'?'binder-row':'binder-card'}" data-card-group="${group.id}" aria-label="${esc(representative.name)} ${group.cards.length}仕様を選ぶ">${binderArt(representative,false)}<span class="binder-card-info"><span class="card-name" title="${esc(representative.name)}">${esc(representative.name)}</span><span class="card-number" title="${esc(info)}">${esc(info)}</span></span></button>`;
}
const mergeToggle=()=>`<label class="binder-merge-toggle"><input type="checkbox" data-merge-names ${mergeNames?'checked':''}><span>同名カードを統合</span></label>`;
const binderCount=items=>mode==='cards'&&mergeNames?`${binderGroups(items).length}件（${items.length}枚）`:`${items.length}${mode==='cards'?'枚のカード':'件のコーデ'}`;
const coordinate=co=>`<button class="coord" data-go="#coordinate/${co.id}"><div class="coord-preview">${co.cardIds.map(id=>binderArt(cards.find(c=>c.id===id),false)).join('')}</div><h2>${esc(co.name)}</h2><small>${co.type}　｜　${binderRules.progress(co,cards,store)} / ${co.cardIds.length} 所持</small></button>`;
const cardViewToggle=()=>`<div class="card-view-toggle" role="group" aria-label="カードの表示形式">${[['grid','グリッド表示'],['list','リスト表示']].map(([value,label])=>`<button class="btn-text btn-icon" data-card-view="${value}" aria-label="${label}" aria-pressed="${cardView===value}">${icon(value)}</button>`).join('')}</div>`;
const newsItems=()=>news.filter(item=>newsCategories[item.acquisitionType]).sort((a,b)=>b.date.localeCompare(a.date));
const newsLabel=item=>{const category=newsCategories[item.acquisitionType];return `<span class="news-acquisition" style="--news-color:${category.color}">${category.label}</span>`;};
const newsRow=item=>`<button class="home-news-row" data-go="#news/${item.id}">${newsLabel(item)}<span class="home-news-title">${esc(item.title)}</span></button>`;
function home(){
 const owned=cards.filter(c=>store.get(c).ownedCount>0),rate=(owned.length/cards.length*100).toFixed(1);
 const latest=owned.filter(c=>store.get(c).updatedAt>0).sort((a,b)=>store.get(b).updatedAt-store.get(a).updatedAt)[0];
 return `<section class="home-news" aria-labelledby="home-news-heading"><div class="home-section-heading"><h1 id="home-news-heading">最新カードニュース</h1><button class="btn-secondary btn-compact" data-go="#news">もっと見る <span aria-hidden="true">→</span></button></div><div class="home-news-list">${newsItems().slice(0,3).map(newsRow).join('')}</div></section><section class="home-binder" aria-labelledby="home-binder-heading"><div class="home-binder-heading"><h2 id="home-binder-heading">バインダー</h2><button class="home-binder-link btn-secondary btn-compact" data-go="#binder">バインダーを開く <span aria-hidden="true">→</span></button></div><dl class="home-binder-stats"><div><dt>総登録数</dt><dd><strong>${owned.length}</strong><span> / ${cards.length}</span></dd></div><div><dt>収集率</dt><dd><strong>${rate}</strong><span>%</span></dd></div><div><dt>最近の記録</dt><dd class="home-latest">${latest?latest.cardNumber:'—'}</dd></div></dl></section><button class="home-open btn-primary" data-go="#register">＋ カード登録</button><section class="home-trade" aria-labelledby="home-trade-heading"><h2 id="home-trade-heading">トレード</h2><button class="home-trade-link btn-secondary btn-compact" data-action="trade-cards">交換候補を見る <span aria-hidden="true">→</span></button></section>`;
}
function newsScreen(id){
 if(id){const item=news.find(n=>n.id===id);if(!item)return missing();return `<article class="panel">${newsLabel(item)}<h1 style="font-size:20px;margin-top:14px">${esc(item.title)}</h1><p>${esc(item.body)}</p></article>`;}
 return `<section class="panel"><div class="home-news-list">${newsItems().map(newsRow).join('')}</div></section>`;
}
function matches(c){const s=store.get(c);return (!query||[c.name,c.cardNumber,c.brand,c.character,c.coordinateName,c.specification,c.cardKind,c.target,...(c.scanNumbers||[])].join(' ').toLowerCase().includes(query.toLowerCase()))&&(!cardPreset||(cardPreset==='trade'?s.tradeCount>0:s.favorite))&&Object.entries(filters).every(([key,val])=>!val||(key==='status'?val==='owned'?s.ownedCount>0:s.ownedCount===0:c[key]===val));}
function binderItems(){
 if(mode==='cards')return binderRules.sortCards(cards.filter(matches),cardSort,store);
 if(mode==='album')return binderRules.pockets(cards.filter(c=>!albumState.cardKind||c.cardKind===albumState.cardKind),albumState.sort,albumState.gaps,store);
 return binderRules.sortCoordinates(coordinates.filter(co=>{
  const complete=binderRules.progress(co,cards,store)===co.cardIds.length;
  return (!coordinateState.type||co.type===coordinateState.type)&&(!coordinateState.status||(coordinateState.status==='complete'?complete:!complete));
 }),coordinateState.sort,cards,store);
}
function binder(){
 const tabs=`<div class="tabs binder-tabs" role="tablist" aria-label="バインダーの表示方法">${[['cards','全カード一覧'],['coordinates','コレクション / コーデ'],['album','バインダーモード']].map(([value,label])=>`<button id="tab-${value}" role="tab" aria-selected="${mode===value}" aria-controls="binder-panel" tabindex="${mode===value?0:-1}" class="${mode===value?'active':''}" data-mode="${value}">${label}</button>`).join('')}</div>`;
 let controls='';
 if(mode==='cards'){
  controls=`<div class="toolbar"><label class="search">${icon('search')}<input class="ui-input" id="search" aria-label="カードを検索" placeholder="カード名・番号・ブランドを検索" value="${esc(query)}"></label><button class="filter-toggle btn-secondary" data-action="filters" aria-expanded="${showFilters}" aria-controls="filters">${icon('filter')} 絞り込み${Object.values(filters).some(Boolean)?' ●':''}</button></div>
  <div id="filters" class="filters" ${showFilters?'':'hidden'}>${fields.map(([key,label])=>`<label>${label}<select class="ui-select" data-filter="${key}"><option value="">すべて</option>${[...new Set((key==='category'?cards.filter(DCBData.isDressCard):cards).map(c=>c[key]).filter(value=>value!==null&&value!==undefined&&value!==''))].map(value=>`<option value="${esc(value)}" ${filters[key]===value?'selected':''}>${esc(key==='coordinateId'?coordinates.find(co=>co.id===value)?.name||'未確認':key==='cardKind'?DCBData.cardKindLabel(value):value)}</option>`).join('')}</select></label>`).join('')}</div>
  ${cardPreset?`<div class="binder-preset">${cardPreset==='trade'?'交換候補':'お気に入り'}</div>`:''}
  <div class="binder-controls"><label>所持状態<select class="ui-select" data-filter="status">${selectOptions([['','すべて'],['owned','所持のみ'],['missing','未所持のみ']],filters.status||'')}</select></label><label>並び替え<select class="ui-select" data-binder-sort="cards">${selectOptions(sortOptions,cardSort)}</select></label></div>`;
 }else if(mode==='coordinates'){
  controls=`<div class="type-tabs" role="group" aria-label="コーデのタイプ">${[['キュート','pink'],['クール','blue'],['セクシー','purple'],['ポップ','orange']].map(([type,color])=>`<button style="--type-color:var(--color-${color})" data-coordinate-type="${type}" aria-pressed="${coordinateState.type===type}">${type}</button>`).join('')}</div>
  <div class="binder-controls"><label>所持状態<select class="ui-select" data-coordinate-status>${selectOptions([['','すべて'],['complete','コンプリート'],['incomplete','未コンプリート']],coordinateState.status)}</select></label><label>並び替え<select class="ui-select" data-binder-sort="coordinates">${selectOptions(sortOptions,coordinateState.sort)}</select></label></div>`;
 }else{
  controls=`<label class="album-kind-filter">カード種別<select class="ui-select" data-album-kind>${selectOptions([['','すべて'],...DCBData.cardKinds.map(k=>[k.value,k.label])],albumState.cardKind)}</select></label><div class="binder-controls album-controls"><label>並び替え<select class="ui-select" data-binder-sort="album">${selectOptions([['registered','登録順'],['number','カード番号順'],['coordinate','コーデ順']],albumState.sort)}</select></label>${albumState.sort==='registered'?'':`<label>空欄の扱い<select class="ui-select" data-album-gaps>${selectOptions([['keep','空欄を残す'],['pack','詰めて表示']],albumState.gaps)}</select></label>`}</div>`;
 }
 const items=binderItems();
 return `<section class="binder-page">${tabs}<div id="binder-panel" role="tabpanel" aria-labelledby="tab-${mode}">${controls}${mode==='album'?'':`<div class="binder-count"><span id="result-count">${binderCount(items)}</span>${mode==='cards'?mergeToggle():''}<div class="binder-count-actions"><button class="btn-text btn-compact" data-action="clear">条件をクリア</button>${mode==='cards'?cardViewToggle():''}</div></div>`}<div id="results">${results(items)}</div></div></section>`;
}
function results(items){
 if(mode==='cards')return items.length?`<div class="${cardView==='grid'?'grid binder-grid':'binder-list'}">${binderGroups(items).map(binderGroup).join('')}</div>`:list([]);
 if(mode==='coordinates')return items.length?`<div class="coord-grid">${items.map(coordinate).join('')}</div>`:'<div class="empty">条件に一致するコーデはありません。</div>';
 return `<div class="album-grid" aria-label="カードバインダー">${items.map(c=>binderRules.owned(c,store)?`<button class="album-card" data-go="#card/${c.id}" aria-label="${esc(c.name)}"><span class="art album-pocket" data-photo-card="${c.id}" style="--color:${c.color}">${c.image?`<img src="${esc(c.image)}" alt="">`:garment(c.category)}</span></button>`:`<div class="album-blank" role="img" aria-label="空のポケット ${esc(c.cardNumber)}"></div>`).join('')}</div>`;
}
function clearBinderPhotos(){binderPhotoRevision++;binderPhotoURLs.forEach(url=>URL.revokeObjectURL(url));binderPhotoURLs=[];}
function loadBinderPhotos(){
 clearBinderPhotos();if(!location.hash.startsWith('#binder')&&!location.hash.startsWith('#trade'))return;
 const token=binderPhotoRevision;
 app.querySelectorAll('[data-photo-card]').forEach(target=>DCBPhotos.read(target.dataset.photoCard).then(record=>{
  if(!record?.blob||token!==binderPhotoRevision||!target.isConnected)return;
  const url=URL.createObjectURL(record.blob);binderPhotoURLs.push(url);
  const image=document.createElement('img');image.src=url;image.alt='';target.replaceChildren(image);target.closest('.compact-art')?.classList.add('has-photo');
 }).catch(()=>{}));
}
try{history.scrollRestoration='manual';}catch{}
let detailContext=history.state?.dcbDetail||null,detailSlide=0;
const binderSnapshot=()=>({filters:{...filters},query,mode,showFilters,cardSort,cardPreset,coordinateState:{...coordinateState},albumState:{...albumState},cardView,mergeNames});
function restoreBinderSnapshot(s){if(!s)return;filters={...s.filters};query=s.query;mode=s.mode;showFilters=s.showFilters;cardSort=s.cardSort;cardPreset=s.cardPreset;coordinateState={...s.coordinateState};albumState={...s.albumState};cardView=s.cardView;mergeNames=s.mergeNames;}
function captureDetailContext(id){
 if(location.hash.startsWith('#card/'))return;
 let ids;
 if(location.hash==='#binder'){
  const items=binderItems();ids=mode==='cards'?binderGroups(items).flatMap(g=>g.cards.map(c=>c.id)):mode==='album'?items.filter(c=>binderRules.owned(c,store)).map(c=>c.id):[];
 }else ids=[...app.querySelectorAll('main [data-go^="#card/"],main [data-trade="detail"]')].map(el=>el.dataset.id||el.dataset.go.split('/')[1]);
 ids=[...new Set(ids)].filter(value=>cards.some(c=>c.id===value));if(!ids.includes(id))ids=[id];
 const origin={route:location.hash,scroll:window.scrollY,binder:binderSnapshot()};
 detailContext={ids,origin};history.replaceState({...history.state,dcbList:origin},'',location.href);
}
function moveDetail(delta){
 const id=location.hash.split('/')[1],index=detailContext?.ids.indexOf(id)??-1,next=detailContext?.ids[index+delta];
 if(index<0||!next)return;detailSlide=delta;
 history.replaceState({...history.state,dcbDetail:detailContext},'',location.pathname+location.search+'#card/'+next);render();window.scrollTo(0,0);
}
function detailArrow(id,delta){const index=detailContext?.ids.indexOf(id)??-1,enabled=index>=0&&Boolean(detailContext.ids[index+delta]);return `<button class="detail-arrow btn-text btn-icon btn-neutral" data-detail-move="${delta}" aria-label="${delta<0?'前のカード':'次のカード'}" ${enabled?'':'disabled'}><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${delta<0?'m15 5-7 7 7 7':'m9 5 7 7-7 7'}"/></svg></button>`;}
function openVariantSheet(id){
 const group=binderGroups(binderItems()).find(g=>g.id===id);if(!group)return;
 captureDetailContext(group.cards[0].id);
 const opener=app.querySelector(`[data-card-group="${id}"]`),dialog=document.createElement('dialog');dialog.className='variant-dialog';
 dialog.innerHTML=`<div class="variant-sheet-heading"><h2 id="variant-sheet-title">${esc(group.cards[0].name)}</h2><button class="btn-text btn-icon btn-neutral" data-close-variants aria-label="閉じる">×</button></div><div class="variant-options">${group.cards.map(c=>`<button class="variant-option btn-secondary" data-go="#card/${c.id}">${binderArt(c,false)}<span><strong>${esc(shortSpecification(c))}</strong><small>${esc([c.cardNumber,c.rarity,binderStartDate(c)].filter(v=>v&&v!=='該当なし').join('　'))}</small></span><span class="variant-owned">×${store.get(c).ownedCount}</span></button>`).join('')}</div>`;
 dialog.setAttribute('aria-labelledby','variant-sheet-title');app.append(dialog);dialog.showModal();loadBinderPhotos();
 dialog.addEventListener('close',()=>{dialog.remove();opener?.focus({preventScroll:true});});
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-close-variants]'))dialog.close();else if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
}
app.addEventListener('click',e=>{const target=e.target.closest('[data-go^="#card/"],[data-trade="detail"]');if(target&&!target.closest('.variant-dialog'))captureDetailContext(target.dataset.id||target.dataset.go.split('/')[1]);},true);
let swipeStart=null;
app.addEventListener('pointerdown',e=>{if(e.isPrimary!==false&&e.target.closest('.detail-image .art')&&!e.target.closest('button')){swipeStart={x:e.clientX,y:e.clientY,id:e.pointerId};e.target.closest('.art').setPointerCapture?.(e.pointerId);}});
app.addEventListener('pointerup',e=>{if(!swipeStart||swipeStart.id!==e.pointerId)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;swipeStart=null;if(Math.abs(dx)>=60&&Math.abs(dx)>Math.abs(dy)*1.8)moveDetail(dx<0?1:-1);});
app.addEventListener('pointercancel',()=>swipeStart=null);
function cardDetail(id){const c=cards.find(c=>c.id===id);if(!c)return missing();const s=store.get(c);return `<div class="detail"><div class="detail-image">${detailArrow(id,-1)}${art(c,false)}${detailArrow(id,1)}</div><div class="details">${c.cardNumber?`<div class="eyebrow">${esc(c.cardNumber)}</div>`:''}<h1>${esc(c.name)}</h1><div class="tags">${[c.rarity,c.category,c.type].filter(value=>value&&value!=='該当なし').map(value=>`<span>${esc(value)}</span>`).join('')}</div><section class="inventory"><div class="row"><span>所持枚数</span>${stepper('ownedCount',s.ownedCount,999)}</div><label class="row card-retain-label"><span>保管枚数</span><select class="ui-select" id="card-retain-count" aria-label="このカードの保管枚数">${[1,2,3,4,5].map(n=>`<option value="${n}" ${s.retainCount===n?'selected':''}>${n}枚</option>`).join('')}</select></label><div class="row"><span>交換候補枚数</span>${stepper('tradeCount',s.tradeCount,Math.max(0,s.ownedCount-s.retainCount))}</div><button class="fav-button ${s.favorite?'selected':''} btn-secondary" data-action="favorite" aria-pressed="${s.favorite}">${s.favorite?'♥ お気に入り登録済み':'♡ お気に入りに登録'}</button><label class="memo">メモ（この端末に保存）<textarea id="memo" maxlength="2000" placeholder="入手した場所やカードの状態など">${esc(s.memo)}</textarea></label><p class="muted" style="font-size:10px;margin-bottom:0">変更は自動保存されます</p></section>${metadata(c)}${/^https:\/\//.test(c.officialImageURL||'')?`<a class="btn-text" href="${esc(c.officialImageURL)}" target="_blank" rel="noopener noreferrer">公式の画像を確認 ↗</a>`:''}<h2>このカードから探す</h2><div class="related-links">${c.coordinateId?`<button class="btn-secondary" data-go="#coordinate/${c.coordinateId}">このカードを含むコーデ <span>→</span></button>`:''}${[['brand','同じブランド'],['character','同じキャラクター'],['series','同じシリーズ'],['type','類似 / 関連カード']].map(([key,label])=>`<button class="btn-secondary" data-go="#related/${c.id}/${key}">${label}<span>→</span></button>`).join('')}</div></div></div>`;}
function stepper(key,n,max){return `<div class="stepper"><button class="btn-secondary btn-icon" data-step="${key}" data-delta="-1" ${n<=0?'disabled':''} aria-label="${key==='ownedCount'?'所持':'交換候補'}枚数を減らす">−</button><strong>${n}</strong><button class="btn-secondary btn-icon" data-step="${key}" data-delta="1" ${n>=max?'disabled':''} aria-label="${key==='ownedCount'?'所持':'交換候補'}枚数を増やす">＋</button></div>`;}
function coordinateDetail(id){const co=coordinates.find(co=>co.id===id);if(!co)return missing();return `<div class="coord-detail"><h2 class="coordinate-name">${esc(co.name)}</h2><div class="tags"><span>${co.brand}</span><span>${co.type}</span></div>${list(co.cardIds.map(id=>cards.find(c=>c.id===id)))}<section class="panel">${metadata(co,true)}<button class="secondary wide btn-secondary" data-coordinate-filter="${co.id}">このコーデをバインダーで見る →</button></section></div>`;}
function related(id,key){const c=cards.find(c=>c.id===id);if(!c||!['brand','character','series','type'].includes(key))return missing();return `<p class="relation-context">${esc(c[key])} のカード</p>`+list(cards.filter(x=>x.id!==id&&x[key]===c[key]));}
function missing(){return '<div class="empty"><h2>ページが見つかりません</h2><button class="secondary btn-secondary" data-go="#home">ホームへ戻る</button></div>';}
// Both screens share the exact same symbol and wordmark; replace here for a future logo asset.
function brandLogo(extraClass=''){return `<div class="opening-logo ${extraClass}" role="img" aria-label="Aikatsu! ENCORE Digital Card Binder"><span class="opening-spark" aria-hidden="true"></span><span class="opening-aikatsu">Aikatsu!</span><span class="opening-encore">ENCORE</span><span class="opening-subtitle">Digital Card Binder</span></div>`;}
function login(){
 let preference={};try{preference=JSON.parse(localStorage.getItem('dcb-login-preference')||'{}')||{};}catch{}
 app.innerHTML=`<div class="login-shell"><section class="login-screen" aria-label="ログイン">${brandLogo('login-logo')}<form id="login-form" class="login-form"><label class="login-field"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 5l9 7 9-7"/></svg><input class="ui-input" name="identifier" type="text" required maxlength="100" autocomplete="username" autocapitalize="none" spellcheck="false" aria-label="メールアドレスまたはコレクターID" placeholder="メールアドレスまたはコレクターID" value="${esc(preference.remember?preference.identifier||'':'')}"></label><label class="login-field"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4M12 14v3"/></svg><input class="ui-input" name="password" type="password" required autocomplete="current-password" aria-label="パスワード" placeholder="パスワード"></label><button class="login-submit btn-primary" type="submit">ログイン</button><button class="login-create btn-secondary" type="button" data-go="#signup">はじめての方 / アカウント作成</button><label class="login-remember"><input name="remember" type="checkbox" ${preference.remember?'checked':''}><span>ログインしたままにする</span></label><a class="login-forgot btn-text" href="#password-reset" data-action="forgot-password">パスワードをお忘れの方</a></form></section></div>`;
}
function signup(){app.innerHTML=`<div class="login-shell"><section class="login-screen" aria-label="アカウント作成">${brandLogo('login-logo')}<div class="login-form signup-placeholder"><h1>アカウント作成</h1><p>準備中</p><button class="login-create btn-secondary" type="button" data-go="#login">ログイン画面に戻る</button></div></section></div>`;}
const pageTitles={binder:'バインダー',card:'カード詳細',coordinate:'コーデ詳細',related:'関連カード',news:'ニュース',settings:'設定',trade:'トレード'};
let photoURL=null,viewRevision=0;
function render(){
 DCBRegistration.stop();DCBTrade.stopCamera();clearBinderPhotos();viewRevision++;if(photoURL){URL.revokeObjectURL(photoURL);photoURL=null;}
 const [page,id,key]=location.hash.slice(1).split('/');if(page!=='trade')DCBTrade.afterRender(null);
 if(page==='login'){login();return;}if(page==='signup'){signup();return;}if(page==='register'){DCBRegistration.mount(app,{retakeId:id==='retake'?key:null,history:id==='history'});return;}
 const section=['binder','card','coordinate','related'].includes(page)?'binder':['trade','news','settings'].includes(page)?page:'home';
 const body=page==='binder'?binder():page==='card'?cardDetail(id):page==='coordinate'?coordinateDetail(id):page==='related'?related(id,key):page==='settings'?DCBSettings.screen(id):page==='news'?newsScreen(id):page==='trade'?DCBTrade.screen(id):home();
 const isHome=section==='home';
 const header=isHome?`<header class="home-header"><button class="home-logo" data-go="#home" aria-label="ホーム">${brandLogo('home-brand')}</button></header>`:DCBUI.header({title:page==='trade'?DCBTrade.title(id):page==='settings'?DCBSettings.title(id):pageTitles[page]||'ページ',iconName:page==='trade'?(id==='scan'?'camera':id==='qr'?'qr-show':''):'',back:['card','coordinate','related'].includes(page)||(page==='news'&&Boolean(id))||(page==='trade'&&Boolean(id))||(page==='settings'&&Boolean(id)),action:page==='card'?`<button class="page-header-action btn-secondary btn-compact" data-go="#register/retake/${id}">撮り直す</button>`:page==='binder'?'<button class="page-header-action binder-register btn-primary btn-compact" data-go="#register">＋ カード登録</button>':page==='trade'&&!id?DCBTrade.headerAction():''});
 app.innerHTML=`<div class="${isHome?'home-view':'app-view'}">${header}<main class="${isHome?'home-main':'app-main'}">${body}${store.available?'':'<p role="alert">このブラウザでは保存を利用できません。設定を確認してください。</p>'}</main><nav aria-label="メインナビゲーション">${[['home','ホーム'],['binder','バインダー'],['trade','トレード'],['news','ニュース'],['settings','設定']].map(([key,label])=>`<button data-go="#${key}" class="${section===key?'active':''}" ${section===key?'aria-current="page"':''}>${icon(key)}${label}</button>`).join('')}</nav></div>`;
 if(page==='binder'||page==='trade')loadBinderPhotos();if(page==='trade')DCBTrade.afterRender(id);
 if(page==='card'&&detailSlide){const direction=detailSlide;detailSlide=0;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)app.querySelector('.detail-image .art')?.animate([{opacity:.55,transform:`translateX(${direction*18}px)`},{opacity:1,transform:'translateX(0)'}],{duration:180,easing:'ease-out'});}
 if(page==='card'&&cards.some(c=>c.id===id)){const token=viewRevision;DCBPhotos.read(id).then(record=>{if(!record?.blob||token!==viewRevision)return;const image=document.createElement('img');photoURL=URL.createObjectURL(record.blob);image.src=photoURL;image.alt='自分で撮影したカード写真';const target=app.querySelector('.detail-image .art');if(target){target.replaceChildren(image);}}).catch(()=>{});}
}
function updateResults(){const items=binderItems();document.getElementById('results').innerHTML=results(items);const count=document.getElementById('result-count');if(count)count.textContent=binderCount(items);loadBinderPhotos();}
function save(c,patch){const ok=store.update(c,patch);if(!ok)toast(store.available?'交換候補は50種類までです。':'保存できませんでした。ブラウザの保存設定・空き容量を確認してください。');return ok;}
app.addEventListener('error',e=>{if(e.target.tagName==='IMG'&&e.target.closest('.art')){const target=e.target.closest('.art');const id=target.dataset.photoCard||target.closest('[data-photo-card]')?.dataset.photoCard;const c=cards.find(c=>c.id===id)||cards.find(c=>c.id===location.hash.split('/')[1]);if(c){target.classList.remove('has-photo');target.innerHTML=garment(c.category);}else e.target.remove();}},true);
app.addEventListener('click',e=>{if(e.target.closest('.registration-view,.trade-page,.settings-page'))return;if(e.target.closest('[data-action="forgot-password"]')){e.preventDefault();toast('パスワード再設定は今後対応予定です');return;}const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-detail-move')){moveDetail(Number(b.dataset.detailMove));return;}if(b.dataset.cardGroup){openVariantSheet(b.dataset.cardGroup);return;}if(b.dataset.go){b.closest('.variant-dialog')?.close();go(b.dataset.go);return;}if(b.dataset.cardView){cardView=b.dataset.cardView;try{localStorage.setItem('dcb-binder-view',cardView);}catch{}render();return;}if(b.dataset.mode){mode=b.dataset.mode;render();return;}if(b.dataset.coordinateType){coordinateState.type=coordinateState.type===b.dataset.coordinateType?'':b.dataset.coordinateType;render();return;}if(b.dataset.coordinateFilter){history.replaceState({},'',location.href);detailContext=null;cardPreset='';filters={coordinateId:b.dataset.coordinateFilter};query='';mode='cards';go('#binder');return;}const current=cards.find(c=>c.id===location.hash.split('/')[1]);if(b.dataset.step&&current){const y=window.scrollY;const s=store.get(current);save(current,{[b.dataset.step]:s[b.dataset.step]+Number(b.dataset.delta)});render();window.scrollTo(0,y);return;}switch(b.dataset.action){case 'back':if(location.hash.startsWith('#settings/')){go(DCBSettings.parent(location.hash.split('/')[1]));break;}if(history.length>1)history.back();else go('#binder');break;case 'filters':showFilters=!showFilters;render();break;case 'clear':if(mode==='coordinates'){coordinateState.type='';coordinateState.status='';}else{filters={};query='';cardPreset='';}render();break;case 'favorites':filters={};cardPreset='favorite';query='';mode='cards';go('#binder');break;case 'coordinates':filters={};query='';mode='coordinates';go('#binder');break;case 'trade-cards':go('#trade/offers');break;case 'favorite':if(current){const y=window.scrollY;save(current,{favorite:!store.get(current).favorite});render();window.scrollTo(0,y);}break;case 'logout':DCBSettingsModel.logout();go('#login');break;case 'export':{const url=URL.createObjectURL(new Blob([store.export()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='aikatsu-dcb-inventory.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('所持データを書き出しました');break;}}});
app.addEventListener('input',e=>{if(e.target.name==='identifier')e.target.setCustomValidity('');if(e.target.id==='search'){query=e.target.value;updateResults();}if(e.target.id==='memo'){const c=cards.find(c=>c.id===location.hash.split('/')[1]);if(c)save(c,{memo:e.target.value});}});
app.addEventListener('change',e=>{if(e.target.hasAttribute('data-merge-names')){const value=e.target.checked;try{localStorage.setItem('dcb-binder-merge-names',String(value));mergeNames=value;render();}catch{e.target.checked=mergeNames;toast('表示設定を保存できませんでした');}return;}if(e.target.id==='card-retain-count'){const c=cards.find(c=>c.id===location.hash.split('/')[1]);if(c){save(c,{retainCount:Number(e.target.value)});render();}}if(e.target.dataset.filter){filters[e.target.dataset.filter]=e.target.value;render();}if(e.target.hasAttribute('data-coordinate-status')){coordinateState.status=e.target.value;render();}if(e.target.dataset.binderSort){const kind=e.target.dataset.binderSort;if(kind==='cards')cardSort=e.target.value;else if(kind==='coordinates')coordinateState.sort=e.target.value;else albumState.sort=e.target.value;render();}if(e.target.hasAttribute('data-album-kind')){albumState.cardKind=e.target.value;render();}if(e.target.hasAttribute('data-album-gaps')){albumState.gaps=e.target.value;render();}});
app.addEventListener('submit',e=>{
 if(e.target.id!=='login-form')return;e.preventDefault();
 const form=new FormData(e.target),identifier=String(form.get('identifier')||'').trim();
 if(!identifier){e.target.elements.identifier.setCustomValidity('メールアドレスまたはコレクターIDを入力してください');e.target.elements.identifier.reportValidity();return;}
 const remember=form.get('remember')==='on';
 user=identifier.split('@')[0].slice(0,30)||'コレクター';
 // V0.1 only: no authentication request; passwords are never stored or sent.
 try{localStorage.setItem('dcb-name',user);localStorage.setItem('dcb-login-preference',JSON.stringify({remember,identifier:remember?identifier:''}));}catch{}
 DCBSettingsModel.login(identifier,String(form.get('password')||''));e.target.elements.password.value='';go('#home');
});
app.addEventListener('keydown',e=>{const tab=e.target.closest('[data-mode]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const modes=['cards','coordinates','album'];const index=modes.indexOf(mode);mode=e.key==='Home'?modes[0]:e.key==='End'?modes[2]:modes[(index+(e.key==='ArrowRight'?1:2))%3];render();document.getElementById('tab-'+mode).focus();});
DCBTrade.configure({render,art:binderArt,esc,toast});
DCBSettings.configure({render,esc,toast,go});
function routeChanged(){
 const id=location.hash.startsWith('#card/')?location.hash.split('/')[1]:null;
 if(id){const saved=history.state?.dcbDetail;if(saved?.ids?.includes(id))detailContext=saved;if(detailContext?.ids.includes(id))history.replaceState({...history.state,dcbDetail:detailContext},'',location.href);else detailContext=null;}
 const origin=!id&&history.state?.dcbList?.route===location.hash?history.state.dcbList:null;
 if(origin)restoreBinderSnapshot(origin.binder);render();window.scrollTo(0,origin?.scroll||0);if(origin)requestAnimationFrame(()=>window.scrollTo(0,origin.scroll));
}
window.addEventListener('hashchange',routeChanged);
// Keep the opening artwork isolated so an original logo image can replace its contents.
const opening=document.createElement('div');
opening.className='opening';
opening.innerHTML=`<section class="opening-screen" aria-label="アイカツDCB オープニング">${brandLogo()}<div class="opening-loading"><div class="opening-track" role="progressbar" aria-label="読み込み中" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="opening-fill"></span></div><div class="opening-caption" role="status">Loading...</div></div></section>`;
document.body.append(opening);
app.inert=true;
const initialRoute=location.hash;
const destination=['','#home','#login','#opening'].includes(initialRoute)?'#login':initialRoute;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration=reducedMotion?150:1500;
const track=opening.querySelector('.opening-track'),fill=opening.querySelector('.opening-fill');
let started;
function advanceOpening(time){
  started??=time;
  const fraction=Math.min(1,(time-started)/duration);
  const progress=1-Math.pow(1-fraction,1.35);
  fill.style.transform=`scaleX(${progress})`;
  track.setAttribute('aria-valuenow',String(Math.round(progress*100)));
  if(fraction<1){requestAnimationFrame(advanceOpening);return;}
  // Don't overwrite navigation if the user changed the route during loading.
  if(location.hash===initialRoute)history.replaceState(null,'',location.pathname+location.search+destination);
  render();
  const toLogin=location.hash==='#login';
  const transitionForm=toLogin?app.querySelector('.login-form'):null;
  if(toLogin){
    // Animate the existing logo, then reveal its identical counterpart underneath.
    opening.classList.add('opening-to-login');
    transitionForm.inert=true;opening.querySelector('.opening-screen').append(transitionForm);
  }else opening.classList.add('opening-complete');
  setTimeout(()=>{if(transitionForm&&location.hash==='#login'){app.querySelector('.login-screen')?.append(transitionForm);transitionForm.inert=false;}opening.remove();app.inert=false;},reducedMotion?0:toLogin?950:320);
}
requestAnimationFrame(advanceOpening);
})();









