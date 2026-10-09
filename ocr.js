/* One lazy browser worker; only the number-guide crop is sent to OCR, never card artwork. */
window.DCBOCR=(()=>{
 let worker=null,loading=null,script=null,revision=0,locked=false,lastStarted=0,cancel=null;
 const assetRoot=new URL('vendor/ocr/',document.currentScript.src);
 function load(){if(window.Tesseract)return Promise.resolve();if(!script){script=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('tesseract.min.js',assetRoot);s.onload=resolve;s.onerror=()=>{s.remove();script=null;reject(Error('番号読み取りの準備に失敗しました。'));};document.head.append(s);});}return script;}
 async function engine(){if(worker)return worker;if(!loading){const token=revision;const promise=(async()=>{await load();const next=await Tesseract.createWorker('eng',1,{workerPath:new URL('worker.min.js',assetRoot).href,corePath:new URL('core/',assetRoot).href,langPath:new URL('lang/',assetRoot).href,workerBlobURL:false,cacheMethod:'none',errorHandler:e=>{if(debug())console.warn('[DCBOCR]',e);}});if(token!==revision){await next.terminate();throw Error('読み取りを中断しました。');}worker=next;await next.setParameters({tessedit_pageseg_mode:Tesseract.PSM.SINGLE_LINE,tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-',user_defined_dpi:'300'});return next;})();loading=promise;promise.then(()=>{if(loading===promise)loading=null;},()=>{if(loading===promise)loading=null;});}return loading;}
 const debug=()=>['localhost','127.0.0.1'].includes(location.hostname)||new URLSearchParams(location.search).get('debug')==='ocr';
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 async function readNumber({image}){if(!image)throw Error('番号の画像がありません。');if(locked)throw Error('読み取り中です。');locked=true;const token=revision;const cancelled=new Promise((_,reject)=>{cancel=()=>reject(Error('読み取りを中断しました。'));});const operation=(async()=>{await sleep(Math.max(0,400-(Date.now()-lastStarted)));if(token!==revision)throw Error('読み取りを中断しました。');lastStarted=Date.now();const w=await engine();if(token!==revision)throw Error('読み取りを中断しました。');const {data}=await w.recognize(image,{}, {text:true});if(token!==revision)throw Error('読み取りを中断しました。');return{text:data.text||'',confidence:Number(data.confidence)||0};})();try{return await Promise.race([operation,cancelled]);}catch(e){if(token===revision){const old=worker;worker=null;loading=null;old?.terminate().catch(()=>{});}throw e;}finally{if(token===revision){locked=false;cancel=null;}}}
 function stop(){revision++;cancel?.();cancel=null;locked=false;loading=null;const old=worker;worker=null;old?.terminate().catch(()=>{});}
 const patterns=['original','gray','contrast','invert','adaptive'];
 function crop(video,view,guide,{pattern='gray',enlarge=4}={}){if(!video.videoWidth||!video.videoHeight||video.readyState<2)throw Error('カメラの映像を待って、もう一度お試しください。');const scale=Math.max(view.width/video.videoWidth,view.height/video.videoHeight),ox=(video.videoWidth*scale-view.width)/2,oy=(video.videoHeight*scale-view.height)/2;const x=Math.max(0,(guide.left-view.left+ox)/scale),y=Math.max(0,(guide.top-view.top+oy)/scale),w=Math.min(video.videoWidth-x,guide.width/scale),h=Math.min(video.videoHeight-y,guide.height/scale);if(w<=0||h<=0)throw Error('番号の枠を確認してください。');const canvas=document.createElement('canvas'),factor=Math.min(enlarge,1200/w);canvas.width=Math.max(1,Math.round(w*factor));canvas.height=Math.max(1,Math.round(h*factor));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,x,y,w,h,0,0,canvas.width,canvas.height);
  if(pattern!=='original'){const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),data=pixels.data,gray=new Uint8Array(canvas.width*canvas.height);let sum=0;for(let i=0,j=0;i<data.length;i+=4,j++){gray[j]=.299*data[i]+.587*data[i+1]+.114*data[i+2];sum+=gray[j];}const average=sum/gray.length;let integral;
   if(pattern==='adaptive'){const width=canvas.width;integral=new Uint32Array((width+1)*(canvas.height+1));for(let y=0;y<canvas.height;y++){let row=0;for(let x=0;x<width;x++){row+=gray[y*width+x];integral[(y+1)*(width+1)+x+1]=integral[y*(width+1)+x+1]+row;}}}
   for(let j=0,i=0;j<gray.length;j++,i+=4){let value=gray[j];if(pattern==='contrast')value=(value-128)*1.35+128+(average<100?24:0);if(pattern==='invert')value=255-value;if(pattern==='adaptive'){const width=canvas.width,x=j%width,y=Math.floor(j/width),l=Math.max(0,x-8),r=Math.min(width,x+9),t=Math.max(0,y-8),b=Math.min(canvas.height,y+9),stride=width+1;const mean=(integral[b*stride+r]-integral[t*stride+r]-integral[b*stride+l]+integral[t*stride+l])/((r-l)*(b-t));value=(average<128?value>mean+8:value<mean-8)?0:255;}value=Math.max(0,Math.min(255,value));data[i]=data[i+1]=data[i+2]=value;}ctx.putImageData(pixels,0,0);}
  canvas.ocrMeta={sourceWidth:Math.round(w),sourceHeight:Math.round(h),width:canvas.width,height:canvas.height,factor,pattern};return canvas;
 }
 function debugResult(result,match,meta){if(debug())console.debug('[DCBOCR]',{raw:result.text,normalized:match.read,confidence:result.confidence,match:match.kind,level:match.level,candidateCount:match.candidates.length,crop:meta});}
 function debugConsensus(summary){if(debug())console.debug('[DCBOCR consensus]',{frames:summary.frames,auto:summary.auto,votes:summary.ranked.map(r=>({id:r.card.id,votes:r.votes,confidence:r.confidence,highExact:r.highExact}))});}
 return {readNumber,crop,stop,debugResult,debugConsensus,patterns,prepare:engine};
})();
window.DCBOCRPolicy=(()=>{
 const registered=new Map(),hold=10000;
 const canAuto=(result,match)=>result.confidence>=85&&match.kind==='exact'&&match.level==='literal'&&match.candidates.length===1;
 const available=(id,now=Date.now())=>!registered.has(id)||now-registered.get(id)>=hold;
 return {canAuto,available,mark:(id,now=Date.now())=>registered.set(id,now),hold};
})();

/* One vote per frame and Master ID; preprocessing alternatives never multiply a frame's vote. */
window.DCBOCRConsensus=(()=>{
 function summarize(samples,master){const map=new Map();for(const sample of samples){const match=sample.match||DCBMatcher.match(sample.text,master),confidence=Number(sample.confidence)||0;const cards=match.voteCandidates||match.candidates;for(const card of new Map(cards.map(c=>[c.id,c])).values()){let row=map.get(card.id);if(!row){row={card,votes:0,sum:0,highExact:0};map.set(card.id,row);}row.votes++;row.sum+=confidence;if(match.kind==='exact'&&match.level==='literal'&&match.candidates.length===1&&confidence>=85)row.highExact++;}}
  const ranked=[...map.values()].map(r=>({...r,confidence:r.sum/r.votes})).sort((a,b)=>b.votes-a.votes||b.confidence-a.confidence);const best=ranked[0],frames=samples.length;const hasVariants=best&&master.filter(c=>c.cardNumber&&DCBMatcher.normalize(c.cardNumber)===DCBMatcher.normalize(best.card.cardNumber)).length>1;
  const auto=!!(best&&!hasVariants&&best.votes>=3&&best.votes>frames/2&&best.confidence>=80&&best.highExact>=2&&(!ranked[1]||best.votes>ranked[1].votes));return {frames,ranked,candidates:ranked.slice(0,3).map(r=>r.card),auto,winner:best?.card};
 }
 return {summarize};
})();
