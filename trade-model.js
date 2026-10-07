/* Local trade lists and versioned, temporary exchange payloads. No network calls. */
window.DCBTradeModel=(()=>{
 const limit=50,key='dcb-trade-wants-v01';let wanted=[];
 try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))wanted=[...new Set(saved.filter(id=>typeof id==='string'&&DCBData.cards.some(c=>c.id===id)))].slice(0,limit);}catch{}
 const offers=()=>DCBData.cards.filter(c=>DCBStore.get(c).tradeCount>0);
 const wants=()=>DCBData.cards.filter(c=>wanted.includes(c.id));
 const remaining=c=>{const s=DCBStore.get(c);return Math.max(0,s.ownedCount-s.retainCount-s.tradeCount);};
 function addOffer(c){if(!c||remaining(c)<1)return {ok:false,error:'追加できる余剰カードがありません。'};if(DCBStore.get(c).tradeCount===0&&offers().length>=limit)return {ok:false,error:'交換候補は50種類までです。'};return DCBStore.update(c,{tradeCount:DCBStore.get(c).tradeCount+1})?{ok:true}:{ok:false,error:'保存できませんでした。'};}
 function changeWant(c,add){if(!c)return {ok:false,error:'カードが見つかりません。'};if(add&&wanted.includes(c.id))return {ok:true};if(add&&wanted.length>=limit)return {ok:false,error:'ほしいカードは50種類までです。'};const next=add?[...wanted,c.id]:wanted.filter(id=>id!==c.id);try{localStorage.setItem(key,JSON.stringify(next));wanted=next;return {ok:true};}catch{return {ok:false,error:'保存できませんでした。'};}}
 const rarityTypes=[{id:'parallel',label:'パラレル',values:['パラレル']},{id:'premium',label:'プレミアム',values:['PR','プレミアム']},{id:'encore',label:'アンコール',values:['アンコール']},{id:'rare',label:'レア',values:['R','レア']},{id:'normal',label:'ノーマル',values:['N','ノーマル']}];
 const rarityOf=c=>c.cardKind&&c.cardKind!=='ドレスカード'?null:c.tradeRarity||rarityTypes.find(r=>r.values.includes(c.rarity))?.id||c.rarity;
 const includes=(c,selected)=>!selected.length||(rarityOf(c)!==null&&(selected.includes(c.rarity)||selected.includes(rarityOf(c))));
 const selections=filters=>Array.isArray(filters)?{offers:filters,wants:filters}:{offers:filters?.offers||[],wants:filters?.wants||[]};
 function scope(filters={}){const selected=selections(filters);return {offers:offers().filter(c=>(!filters.cardKind||c.cardKind===filters.cardKind)&&includes(c,selected.offers)),wants:wants().filter(c=>(!filters.cardKind||c.cardKind===filters.cardKind)&&includes(c,selected.wants))};}
 const uid=()=>crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
 function session(filters={}){const selected=scope(filters),criteria=selections(filters),now=Date.now();return {protocol:'aikatsu-dcb-trade',version:1,sessionId:uid(),nonce:uid(),createdAt:now,expiresAt:now+15*60*1000,rarities:Array.isArray(filters)?[...filters]:[],filters:{offers:[...criteria.offers],wants:[...criteria.wants],...(filters.cardKind?{cardKind:filters.cardKind}:{})},offers:selected.offers.map(c=>({id:c.id,count:DCBStore.get(c).tradeCount})),wants:selected.wants.map(c=>({id:c.id,count:1}))};}
 function parse(raw,now=Date.now()){
  if(typeof raw!=='string'||raw.length>30000)throw new Error('交換データが大きすぎます。');let value;try{value=JSON.parse(raw);}catch{throw new Error('交換データを読み取れませんでした。');}
  if(!value||value.protocol!=='aikatsu-dcb-trade'||value.version!==1)throw new Error('対応していない交換データです。');
  if(typeof value.sessionId!=='string'||!value.sessionId.length||value.sessionId.length>100||typeof value.nonce!=='string'||!value.nonce.length||value.nonce.length>100||!Number.isFinite(value.createdAt)||!Number.isFinite(value.expiresAt)||value.expiresAt<=value.createdAt||value.createdAt>now+60000)throw new Error('セッション情報が正しくありません。');
  if(value.expiresAt<=now)throw new Error('有効期限が切れています。相手に再生成してもらってください。');
  if(!Array.isArray(value.rarities)||value.rarities.length>20||value.rarities.some(r=>typeof r!=='string'||!DCBData.cards.some(c=>c.rarity===r)))throw new Error('レア度の情報が正しくありません。');
  const validFilter=list=>Array.isArray(list)&&list.length<=20&&list.every(r=>typeof r==='string'&&(rarityTypes.some(type=>type.id===r)||DCBData.cards.some(c=>c.rarity===r)));
  const filters=value.filters||{offers:value.rarities,wants:value.rarities};if(!validFilter(filters.offers)||!validFilter(filters.wants))throw new Error('レア度の情報が正しくありません。');
  if(filters.cardKind!==undefined&&(typeof filters.cardKind!=='string'||(filters.cardKind&&!DCBData.cards.some(c=>c.cardKind===filters.cardKind))))throw new Error('カード種別の情報が正しくありません。');
  const clean=entries=>{if(!Array.isArray(entries)||entries.length>limit)throw new Error('交換リストは各50種類までです。');const ids=new Set();return entries.map(e=>{if(!e||typeof e.id!=='string'||!DCBData.cards.some(c=>c.id===e.id)||ids.has(e.id)||!Number.isInteger(e.count)||e.count<1||e.count>999)throw new Error('カード情報が正しくありません。');ids.add(e.id);return {id:e.id,count:e.count};});};
  return {protocol:value.protocol,version:1,sessionId:value.sessionId,nonce:value.nonce,createdAt:value.createdAt,expiresAt:value.expiresAt,rarities:[...value.rarities],filters:{offers:[...filters.offers],wants:[...filters.wants],...(filters.cardKind?{cardKind:filters.cardKind}:{})},offers:clean(value.offers),wants:clean(value.wants)};
 }
 function match(peer,filters={}){const mine=scope(filters);const give=mine.offers.flatMap(c=>{const other=peer.wants.find(e=>e.id===c.id);return other?[{card:c,count:Math.min(DCBStore.get(c).tradeCount,other.count)}]:[];});const receive=mine.wants.flatMap(c=>{const other=peer.offers.find(e=>e.id===c.id);return other?[{card:c,count:Math.min(1,other.count)}]:[];});return {give,receive,total:give.length+receive.length};}
 function demo(filters={}){const mine=scope(filters),now=Date.now();return {protocol:'aikatsu-dcb-trade',version:1,sessionId:uid(),nonce:uid(),createdAt:now,expiresAt:now+900000,rarities:[],offers:mine.wants.slice(0,3).map(c=>({id:c.id,count:1})),wants:mine.offers.slice(0,3).map(c=>({id:c.id,count:1}))};}
 return {limit,rarityTypes,offers,wants,remaining,addOffer,changeWant,scope,session,parse,match,demo};
})();
