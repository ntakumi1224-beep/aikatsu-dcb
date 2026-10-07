const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const data={};const context={window:{},Date,localStorage:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=v}};vm.createContext(context);
for(const file of ['test-fixtures/demo-data.js','store.js','binder.js']){vm.runInContext(fs.readFileSync(file,'utf8'),context);context.DCBData=context.window.DCBData;}
const {cards,coordinates}=context.DCBData,store=context.window.DCBStore,rules=context.window.DCBBinder;
for(const c of cards)store.update(c,{ownedCount:0});
const co=coordinates[0];assert.equal(rules.progress(co,cards,store),0);
for(const id of co.cardIds.slice(0,-1))store.update(cards.find(c=>c.id===id),{ownedCount:1});
assert.equal(rules.progress(co,cards,store),co.cardIds.length-1);
store.update(cards.find(c=>c.id===co.cardIds.at(-1)),{ownedCount:2});assert.equal(rules.progress(co,cards,store),co.cardIds.length);
assert.equal(rules.pockets(cards,'number','keep',store).length,24);
assert.equal(rules.pockets(cards,'number','pack',store).length,co.cardIds.length);
assert.equal(rules.pockets(cards,'registered','keep',store).length,co.cardIds.length);
const c=cards[0],registeredAt=store.get(c).registeredAt;store.update(c,{memo:'timestamp stays stable'});assert.equal(store.get(c).registeredAt,registeredAt);
assert.deepEqual(Array.from(rules.sortCards([...cards].reverse(),'number',store),c=>c.cardNumber),Array.from(cards,c=>c.cardNumber));
assert.equal(rules.sortCoordinates(coordinates,'owned',cards,store)[0].id,co.id);
console.log('PASS: 0/N, incomplete and complete coordinates; preserved/packed gaps; number order; registration timestamp');


const base={id:'a',name:'同名テスト',cardNumber:'X-1',cardKind:'ドレスカード',category:'トップス',type:'キュート',specification:'通常版',normalVersionId:''};
const variant={...base,id:'b',specification:'パラレル',normalVersionId:'a'},other={...base,id:'c',cardNumber:'Y-1'};
assert.equal(rules.groupCards([base,variant,other]).length,2);assert.equal(rules.groupCards([variant,base],[base,variant])[0].cards[0].id,'b');assert.equal(rules.groupCards([{...variant,cardNumber:'X-2'},base],[base,variant]).length,1);
for(const patch of [{cardKind:'別種'},{category:'シューズ'},{type:'クール'},{specification:''},{specification:'通常版'},{normalVersionId:'missing'}])assert.equal(rules.groupCards([base,{...variant,...patch},other]).length,3);
assert.equal(rules.groupCards([base,{...variant,normalVersionId:'wrong'}],[base,variant,{...other,id:'wrong',name:'別物'}]).length,2);
assert.equal(rules.groupCards([{...base,cardNumber:''},{...variant,cardNumber:'',normalVersionId:''}]).length,2);assert.equal(rules.groupCards([{...base,normalVersionId:'b'},variant]).length,2);
console.log('PASS: safe display grouping, visible sort order, explicit counterpart across numbers, ambiguous names/specs, missing numbers, conflicting links and cycles remain separate.');
