/* Adapter for generated JSON. Workbook values and stable IDs remain unchanged. */
window.DCBCreateData=({cards,coordinates,news})=>{
 if(!Array.isArray(cards)||!Array.isArray(coordinates)||!Array.isArray(news))throw Error('Master format');
 const ids=new Set();for(const c of cards){if(!c.id||ids.has(c.id)||!c.name)throw Error('Master ID/name');ids.add(c.id);}
 for(const co of coordinates)if(!co.cardIds.length||co.cardIds.some(id=>!ids.has(id)))throw Error('Coordinate members');
 const cardKindLabel=value=>value.replace(/[（(].*[）)]$/,'');
 const cardKinds=[...new Set(cards.map(c=>c.cardKind).filter(Boolean))].map(value=>({value,label:cardKindLabel(value)}));
 const isDressCard=c=>!c.cardKind||c.cardKind==='ドレスカード';
 const numbers=c=>[c.cardNumber,...(c.scanNumbers||[])].filter(Boolean);const first=cards.find(c=>numbers(c).some(n=>cards.filter(x=>numbers(x).includes(n)).length===1))||cards.find(c=>numbers(c).length);const number=first?.scanNumbers?.[0]||first?.cardNumber||'';const repeated=cards.flatMap(numbers).find(n=>cards.filter(c=>numbers(c).includes(n)).length>1)||'';
 return {cards,coordinates,news,cardKinds,cardKindLabel,isDressCard,registrationExamples:{exact:number,typo:number.replace(/0/g,'O').replace(/1/g,'I'),ambiguous:repeated},newsCategories:{game:{label:'ゲーム',color:'var(--color-pink)'},distribution:{label:'配布',color:'var(--color-blue)'},supplement:{label:'付録',color:'var(--color-orange)'},bonus:{label:'特典',color:'var(--color-purple)'}}};
};
