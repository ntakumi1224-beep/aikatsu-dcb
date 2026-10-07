window.DCBBinder=(()=>{
 const compare=(a,b)=>String(a??'').localeCompare(String(b??''),'ja',{numeric:true});
 const owned=(c,store)=>store.get(c).ownedCount>0;
 const progress=(co,cards,store)=>co.cardIds.filter(id=>owned(cards.find(c=>c.id===id),store)).length;
 function sortCards(items,sort,store){return [...items].sort((a,b)=>{
  if(sort==='registered')return store.get(a).registeredAt-store.get(b).registeredAt||compare(a.cardNumber,b.cardNumber);
  if(sort==='owned')return store.get(b).ownedCount-store.get(a).ownedCount||compare(a.cardNumber,b.cardNumber);
  const key={number:'cardNumber',brand:'brand',coordinate:'coordinateId',release:'release'}[sort]||'release';
  return compare(a[key],b[key])||compare(a.cardNumber,b.cardNumber);
 });}
 function sortCoordinates(items,sort,cards,store){return [...items].sort((a,b)=>{
  const first=co=>cards.filter(c=>co.cardIds.includes(c.id)).map(c=>c.cardNumber).sort(compare)[0];
  if(sort==='number')return compare(first(a),first(b));
  if(sort==='owned')return progress(b,cards,store)/b.cardIds.length-progress(a,cards,store)/a.cardIds.length||compare(a.name,b.name);
  const key={brand:'brand',coordinate:'name',release:'release'}[sort]||'release';
  return compare(a[key],b[key])||compare(first(a),first(b));
 });}
 function pockets(cards,sort,gaps,store){const items=sortCards(cards,sort,store);return sort==='registered'||gaps==='pack'?items.filter(c=>owned(c,store)):items;}
 // A shared name alone is not evidence that two physical cards are variants.
 function groupCards(items,master=items){
  const byId=new Map(master.map(c=>[c.id,c]));
  const root=c=>{const seen=new Set();let current=c;while(current.normalVersionId){if(seen.has(current.id))return null;seen.add(current.id);const parent=byId.get(current.normalVersionId);if(!parent||parent.name!==c.name||parent.cardKind!==c.cardKind||parent.category!==c.category||parent.type!==c.type)return null;current=parent;}return current.id;};
  const compatible=(a,b)=>{
   if(!a.name||a.name!==b.name||a.cardKind!==b.cardKind||a.category!==b.category||a.type!==b.type)return false;
   if(!a.specification||!b.specification||a.specification===b.specification)return false;
   const aRoot=root(a),bRoot=root(b);
   if(a.normalVersionId||b.normalVersionId)return Boolean(aRoot&&aRoot===bRoot);
   return Boolean(a.cardNumber&&a.cardNumber===b.cardNumber);
  };
  const groups=[];
  for(const c of items){const group=groups.find(g=>g.cards.every(member=>compatible(member,c)));if(group)group.cards.push(c);else groups.push({id:c.id,cards:[c]});}
  return groups;
 }
 return {owned,progress,sortCards,sortCoordinates,pockets,groupCards};
})();
