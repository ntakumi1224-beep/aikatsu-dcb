/* Number matching is independent of camera/OCR and never guesses from card artwork. */
window.DCBMatcher=(()=>{
 const normalize=value=>String(value??'').normalize('NFKC').toUpperCase().trim().replace(/[\s]/g,'').replace(/[‐‑‒–—―−_]/g,'-').replace(/[^A-Z0-9-]/g,'');
 const correct=value=>normalize(value).replace(/O/g,'0').replace(/[IL]/g,'1').replace(/S/g,'5').replace(/B/g,'8');
 const distance=(a,b)=>{let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return row[b.length];};
 const numbers=card=>[card.cardNumber,...(card.scanNumbers||[])].filter(Boolean).map(normalize);
 function match(text,master){
  const read=normalize(text);if(!read||read.length>40||!/[0-9OIL]/.test(read))return{kind:'unreadable',read,candidates:[]};
  const literal=master.filter(c=>[c.cardNumber,...(c.scanNumbers||[])].filter(Boolean).includes(String(text).trim()));
  const exact=literal.length?literal:master.filter(c=>numbers(c).includes(read));
  if(exact.length>3)return{kind:'tooMany',read,candidates:[]};
  if(exact.length)return{kind:exact.length===1?'exact':'ambiguous',level:literal.length?'literal':'normalized',read,candidates:exact,voteCandidates:exact};
  const fixed=correct(read);
  const scored=master.map(c=>({card:c,score:Math.min(...numbers(c).map(n=>correct(n)===fixed||correct(n).replace(/-/g,'')===fixed.replace(/-/g,'')?0:distance(fixed,correct(n))))})).filter(x=>x.score<=1).sort((a,b)=>a.score-b.score);
  return{kind:scored.length?'suggestions':'missing',level:scored[0]?.score===0?'corrected':'similar',read,candidates:scored.slice(0,3).map(x=>x.card),voteCandidates:scored.filter(x=>x.score===scored[0]?.score).slice(0,3).map(x=>x.card)};
 }
 return{normalize,match};
})();
