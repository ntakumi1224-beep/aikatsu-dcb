const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const c={window:{},URL,document:{currentScript:{src:'https://dcb.test/ocr.js'}},location:{hostname:'dcb.test',search:''},Date,setTimeout,clearTimeout};vm.createContext(c);vm.runInContext(fs.readFileSync('matcher.js','utf8'),c);vm.runInContext(fs.readFileSync('ocr.js','utf8'),c);const m=c.window.DCBMatcher;c.DCBMatcher=m;const p=c.window.DCBOCRPolicy;const cards=['E1-01','EP-001','TEST-01','AB-018'].map((cardNumber,i)=>({id:String(i),cardNumber}));
for(const n of ['E1-01','EP-001','TEST-01']){const r=m.match(n,cards);assert.equal(r.kind,'exact');assert.equal(r.level,'literal');assert(p.canAuto({confidence:90},r));assert(!p.canAuto({confidence:40},r));}
for(const n of ['ｅ１—０１',' e1 - 01\n','E1 -01','E1_01','E1-01!']){const r=m.match(n,cards);assert.equal(r.kind,'exact');assert.equal(r.level,'normalized');assert(!p.canAuto({confidence:99},r));}
for(const n of ['E1-O1','EI-01','EL-01','E101','EP-OOI','TEST-O1','TE5T-01','A8-OI8']){const r=m.match(n,cards);assert.equal(r.kind,'suggestions',n);assert(r.candidates.length>0&&r.candidates.length<=3);assert(!p.canAuto({confidence:99},r));}
let r=m.match('E1-01',[...cards,{id:'parallel',cardNumber:'E1-01'}]);assert.equal(r.kind,'ambiguous');assert.equal(r.candidates.length,2);assert(!p.canAuto({confidence:99},r));assert.equal(m.match('ZZ-999',cards).kind,'missing');assert.equal(m.match('',cards).kind,'unreadable');assert.equal(m.match('E1-01',Array.from({length:4},(_,i)=>({id:String(i),cardNumber:'E1-01'}))).kind,'tooMany');
assert(p.available('x',100));p.mark('x',100);assert(!p.available('x',1000));assert(p.available('other',1000));assert(p.available('x',10100));
assert.equal(m.match('TEST-01',[{id:'raw',cardNumber:'TEST-01'},{id:'normalized',cardNumber:'test-01'}]).candidates.length,1);
c.window.DCBOCR.readNumber({text:'E1-01'}).then(()=>{throw Error('Text accepted as OCR');},e=>assert.match(e.message,/画像/));
console.log('PASS: extensible formats, literal/normalized priority, O0/I1/L1/S5/B8 candidates, missing hyphen, whitespace/case, variants, no match, candidate caps, confidence safety, duplicate lock and image-only OCR adapter.');

const consensus=c.window.DCBOCRConsensus;
const sample=(text,confidence=90)=>({text,confidence,match:m.match(text,cards)});
let summary=consensus.summarize(['E1-O1','E1-01','E1-01','E1-O1','E1-01'].map(t=>sample(t)),cards);assert.equal(summary.winner.id,'0');assert.equal(summary.ranked[0].votes,5);assert(summary.auto);assert.equal(summary.frames,5);
summary=consensus.summarize(['E1 01','E1—01','E1-O1'].map(t=>sample(t)),cards);assert.equal(summary.ranked[0].votes,3);assert(!summary.auto); // No two high-confidence uncorrected anchors.
for(const texts of [['E1-01','E1-01'],['E1-01','E1-01','E1-01','EP-001','EP-001','EP-001'],['E1-01','E1-01','ZZ-999','ZZ-999','ZZ-999']])assert(!consensus.summarize(texts.map(t=>sample(t)),cards).auto);
assert(!consensus.summarize(Array.from({length:5},()=>sample('E1-01',20)),cards).auto);
const variants=[...cards,{id:'parallel',cardNumber:'E1-01'}];summary=consensus.summarize(Array.from({length:5},()=>({text:'E1-01',confidence:99,match:m.match('E1-01',variants)})),variants);assert.equal(summary.candidates.length,2);assert(!summary.auto);
summary=consensus.summarize([{text:'E1-01',confidence:99,match:{kind:'exact',level:'literal',candidates:[cards[0]],voteCandidates:[cards[0],cards[0]]}}],cards);assert.equal(summary.ranked[0].votes,1);
assert(consensus.summarize(['E1-01','E1-01','E1-01'].map(t=>sample(t)),cards).auto);
assert(consensus.summarize(Array.from({length:5},()=>sample('ZZ-999')),cards).candidates.length<=3);
console.log('PASS: Master-ID majority combines corrected/normalized results, only strongest candidates vote, one vote per frame, strict majority/three votes/confidence/anchors, ties/low confidence/variants never auto-confirm.');
