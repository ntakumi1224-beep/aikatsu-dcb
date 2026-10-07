const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const saved=new Map(),ctx={window:{},Date,crypto:{randomUUID},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)}};vm.createContext(ctx);
for(const file of ['test-fixtures/demo-data.js','store.js','trade-model.js']){vm.runInContext(fs.readFileSync(file,'utf8'),ctx);ctx.DCBData=ctx.window.DCBData;ctx.DCBStore=ctx.window.DCBStore;}
const M=ctx.window.DCBTradeModel,S=ctx.DCBStore,cards=ctx.DCBData.cards,c=cards[0];
S.update(c,{ownedCount:3});assert.equal(M.remaining(c),2);assert(M.addOffer(c).ok);assert.equal(M.remaining(c),1);assert(M.addOffer(c).ok);assert.equal(M.remaining(c),0);assert(!M.addOffer(c).ok);assert.equal(S.get(c).tradeCount,2);S.update(c,{ownedCount:1});assert.equal(S.get(c).tradeCount,0);
S.update(c,{ownedCount:3});M.addOffer(c);M.changeWant(cards[1],true);const q=M.session();assert.equal(q.offers.length,1);assert.equal(q.wants.length,1);assert(!JSON.stringify(q).includes('email'));assert(M.parse(JSON.stringify(q)).sessionId);
const peer=M.demo(),matches=M.match(M.parse(JSON.stringify(peer)));assert.equal(matches.give.length,1);assert.equal(matches.receive.length,1);assert.equal(matches.total,2);
assert.throws(()=>M.parse(JSON.stringify({...q,expiresAt:Date.now()-1,createdAt:Date.now()-100})),/有効期限/);assert.throws(()=>M.parse(JSON.stringify({...q,version:99})),/対応/);assert.throws(()=>M.parse(JSON.stringify({...q,offers:[{id:'unknown',count:1}]})),/カード情報/);assert.throws(()=>M.parse(JSON.stringify({...q,offers:[q.offers[0],q.offers[0]]})),/カード情報/);assert.throws(()=>M.parse('not json'),/読み取れ/);assert.throws(()=>M.parse(JSON.stringify({...q,offers:[{id:c.id,count:0}]})),/カード情報/);
const rare=cards[1].rarity;assert(M.scope([rare]).wants.length);assert.equal(M.scope(['absent']).offers.length,0);
const without=M.match(M.parse(JSON.stringify({...q,offers:[],wants:[]})));assert.equal(without.total,0);
// Independent offer/want rarity conditions permit cross-rarity exchanges.
const rareWant=cards.find(c=>c.rarity==='R');assert(M.changeWant(rareWant,true).ok);
const criteria={offers:['premium'],wants:['rare']};const independent=M.session(criteria);
assert.equal(independent.offers.length,1);assert.equal(independent.wants.length,1);assert.equal(independent.wants[0].id,rareWant.id);
assert.equal(independent.filters.offers[0],'premium');assert.equal(independent.filters.wants[0],'rare');
const crossPeer=M.parse(JSON.stringify({...independent,offers:independent.wants,wants:independent.offers,filters:{offers:['rare'],wants:['premium']}}));
assert.equal(M.match(crossPeer,criteria).total,2);assert.equal(M.scope({offers:['rare'],wants:['premium']}).offers.length,0);assert.equal(M.scope({offers:['rare'],wants:['premium']}).wants.length,1);
assert.throws(()=>M.parse(JSON.stringify({...independent,filters:{offers:['bad'],wants:[]}})),/レア度/);
// Synthetic future master: validate caps above today's 24-card sample catalog.
ctx.DCBData.cards=Array.from({length:60},(_,i)=>({...c,id:'future-'+i,ownedCount:3,rarity:'R',favorite:false}));
vm.runInContext(fs.readFileSync('store.js','utf8'),ctx);ctx.DCBStore=ctx.window.DCBStore;vm.runInContext(fs.readFileSync('trade-model.js','utf8'),ctx);const big=ctx.window.DCBTradeModel;
for(let i=0;i<50;i++){assert(big.addOffer(ctx.DCBData.cards[i]).ok);assert(big.changeWant(ctx.DCBData.cards[i],true).ok);}
assert.equal(big.offers().length,50);assert.equal(big.wants().length,50);assert(!big.addOffer(ctx.DCBData.cards[50]).ok);assert(!ctx.DCBStore.update(ctx.DCBData.cards[50],{tradeCount:1}));assert(!big.changeWant(ctx.DCBData.cards[50],true).ok);assert(big.addOffer(ctx.DCBData.cards[0]).ok);assert.equal(big.offers().length,50);
assert.throws(()=>big.parse(JSON.stringify({...big.session(),offers:ctx.DCBData.cards.slice(0,51).map(c=>({id:c.id,count:1}))})),/50種類/);
big.changeWant(ctx.DCBData.cards[0],false);assert(big.changeWant(ctx.DCBData.cards[50],true).ok);
const before=big.wants().length;ctx.localStorage.setItem=()=>{throw Error('quota');};assert(!big.changeWant(ctx.DCBData.cards[50],false).ok);assert.equal(big.wants().length,before);const amount=ctx.DCBStore.get(ctx.DCBData.cards[1]).tradeCount;assert(!big.addOffer(ctx.DCBData.cards[1]).ok);assert.equal(ctx.DCBStore.get(ctx.DCBData.cards[1]).tradeCount,amount);
console.log('PASS: retained copy, remaining surplus, both 50-type caps, existing-type additions, rarity scope, bilateral matching, empty matching, invalid/expired payloads, failed saves');
