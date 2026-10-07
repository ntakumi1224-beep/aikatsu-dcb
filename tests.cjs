const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let saved=new Map();const context={window:{},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},Date};vm.createContext(context);
for(const file of ['test-fixtures/demo-data.js','store.js']){vm.runInContext(fs.readFileSync(file,'utf8'),context);context.DCBData=context.window.DCBData;}
const {cards,coordinates}=context.DCBData,store=context.window.DCBStore;
assert.equal(cards.length,24);assert.equal(new Set(cards.map(c=>c.id)).size,24);assert(coordinates.some(c=>c.cardIds.length===3));assert(coordinates.some(c=>c.cardIds.length===4));
for(const co of coordinates)for(const id of co.cardIds)assert(cards.some(c=>c.id===id&&c.coordinateId===co.id));
const card=cards[0];assert(store.update(card,{ownedCount:3,tradeCount:2,favorite:true,memo:'検証メモ <script>'}));assert.equal(store.get(card).tradeCount,2);
store.update(card,{ownedCount:1});assert.equal(store.get(card).tradeCount,0);store.update(card,{ownedCount:-10});assert.equal(store.get(card).ownedCount,0);assert.equal(store.get(card).tradeCount,0);
vm.runInContext(fs.readFileSync('store.js','utf8'),context);assert.equal(context.window.DCBStore.get(card).memo,'検証メモ <script>');assert.equal(context.window.DCBStore.get(card).favorite,true);
const before=store.get(card).ownedCount;context.localStorage.setItem=()=>{throw new Error('quota');};assert.equal(store.update(card,{ownedCount:9}),false);assert.equal(store.get(card).ownedCount,before);
assert.equal(Object.keys(JSON.parse(store.export()).inventory).length,24);console.log('PASS: card data, 3/4-card coordinates, ownership limits, persistence, export, save failure');
vm.runInContext(fs.readFileSync('matcher.js','utf8'),context);const matcher=context.window.DCBMatcher;
assert.equal(matcher.match('０１—００１',cards).kind,'exact');assert.equal(matcher.match('PR-001',cards).kind,'ambiguous');assert.equal(matcher.match('',cards).kind,'unreadable');assert.equal(matcher.match('ZZ-999',cards).kind,'missing');assert(matcher.match('OI-OO1',cards).candidates.length<=3);
assert.equal(matcher.match('01-001',Array.from({length:4},(_,i)=>({id:String(i),cardNumber:'01-001'}))).kind,'tooMany');
console.log('PASS: scan aliases, Unicode normalization, ambiguity, candidate limits, unknown numbers');
