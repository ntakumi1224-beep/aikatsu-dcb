window.DCBRegistration=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let root,stream,stage='scan',selected=null,candidates=[],message='',input=DCBData.registrationExamples.exact,reading=false,busy=false,sessionCount=0,timer,revision=0,cameraMessage='',cameraPending=false;
 let autoPending=false;let mode='confirm';try{mode=localStorage.getItem('dcb-registration-mode')==='fast'?'fast':'confirm';}catch{}
 const getMode=()=>mode;
 function setMode(value){mode=value==='fast'?'fast':'confirm';try{localStorage.setItem('dcb-registration-mode',mode);}catch{}return mode;}
 function stop(){revision++;clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());stream=null;root=null;cameraPending=false;busy=false;reading=false;autoPending=false;}
 function mount(element){stop();root=element;stage='scan';selected=null;candidates=[];message='';input=DCBData.registrationExamples.exact;sessionCount=0;cameraMessage='';draw();}
 const choice=c=>`<button type="button" class="scan-choice" data-pick="${c.id}"><span class="scan-mini" style="--scan-color:${c.color}">✧</span><span><strong>${c.cardNumber}</strong><span>${esc(c.name)}</span>${c.scanVariant?`<small>${esc(c.scanVariant)}</small>`:''}</span><span>→</span></button>`;
 function draw(){if(!root)return;
  const capturing=stage==='capture',success=stage==='success';
  root.innerHTML=`<div class="registration-view">${DCBUI.header({title:'カード登録',action:`<button class="page-header-action btn-text btn-compact" type="button" data-scan="exit" ${busy?'disabled':''}>登録終了</button>`})}<main class="scan-main"><div class="scan-modes" role="group" aria-label="登録モード"><button type="button" data-mode="confirm" aria-pressed="${mode==='confirm'}" ${busy||reading?'disabled':''}>確認登録</button><button type="button" data-mode="fast" aria-pressed="${mode==='fast'}" ${busy||reading?'disabled':''}>高速登録</button></div><p class="scan-instruction" role="status">${success?'✓ 登録しました':capturing?'カード全体を映してください':'カード番号を枠内に合わせてください'}</p><div class="scan-camera ${capturing?'scan-camera-full':''}"><video autoplay muted playsinline aria-label="カード登録用カメラ"></video><div class="scan-camera-empty" ${stream?'hidden':''}>${DCBUI.icon('camera','scan-camera-icon')}<span>${cameraPending?'カメラを起動中…':'カメラプレビュー'}</span>${!cameraPending?'<button class="btn-secondary" type="button" data-scan="camera">カメラを起動</button>':''}</div><div class="scan-guide" aria-hidden="true">${capturing?'':'カード番号'}</div>${success?`<div class="scan-success"><strong>✓ 登録しました</strong><span>${selected.cardNumber}</span><span>${esc(selected.name)}</span></div>`:''}</div>${cameraMessage?`<p class="scan-message" role="status">${esc(cameraMessage)}</p>`:''}
  ${success?`<button type="button" class="scan-primary btn-primary" data-scan="next">次のカードへ</button>`:capturing?`<div class="scan-match"><span>このカードです</span>${choice(selected)}</div><div class="scan-capture-actions"><button type="button" class="scan-primary btn-primary" data-scan="capture" ${busy?'disabled':''}>${busy?'登録中…':'撮影して登録'}</button><button type="button" class="scan-outline btn-secondary" data-scan="auto" ${busy?'disabled':''}>自動撮影を試す</button><button type="button" class="scan-text btn-text" data-scan="without-photo" ${busy?'disabled':''}>写真なしで登録</button><button type="button" class="scan-text btn-text" data-scan="retry" ${busy?'disabled':''}>番号を読み直す</button></div><p class="scan-note">${stream?'カードが動かないようにしてください。写真はこの端末に保存します。':'カメラ未接続のため、仮の画像で登録します。'}</p>`:`<form id="scan-number-form"><label for="scan-number">読み取り番号 </label><div class="scan-number-row"><input class="ui-input" id="scan-number" name="number" maxlength="40" autocomplete="off" spellcheck="false" placeholder="E1-01" value="${esc(input)}" ${reading?'disabled':''}><button type="submit" class="scan-primary btn-primary" ${reading?'disabled':''}>${reading?'読み取り中…':'番号を読み取る'}</button></div></form><div class="scan-samples" aria-label="読み取りデモ"><button class="btn-text btn-compact" type="button" data-example="${esc(DCBData.registrationExamples.exact)}" ${reading?'disabled':''}>一致</button><button class="btn-text btn-compact" type="button" data-example="${esc(DCBData.registrationExamples.typo)}" ${reading?'disabled':''}>読取ミス</button><button class="btn-text btn-compact" type="button" data-example="${esc(DCBData.registrationExamples.ambiguous)}" ${reading?'disabled':''}>同一番号</button><button class="btn-text btn-compact" type="button" data-example="" ${reading?'disabled':''}>不明瞭</button></div>${message?`<p class="scan-message" role="alert">${esc(message)}</p>`:''}${candidates.length?`<div class="scan-candidates">${candidates.map(choice).join('')}</div>`:''}<p class="scan-note">${mode==='fast'?'一致したら所持枚数＋1。全体撮影を省略します。':'番号を照合してから全体を撮影します。'}</p>`}
  <div class="scan-session"><span>今回の登録</span><strong>${sessionCount}枚</strong></div></main></div>`;
  const video=root.querySelector('video');if(stream){video.srcObject=stream;video.play().catch(()=>{});}
 }
 async function camera(){if(cameraPending||stream||!root)return;const token=revision;cameraPending=true;draw();try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Unavailable');
  const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
  if(token!==revision||!root){next.getTracks().forEach(t=>t.stop());return;}if(document.hidden){next.getTracks().forEach(t=>t.stop());cameraPending=false;cameraMessage='カメラを停止しました。再起動できます。';draw();return;}
  stream=next;cameraMessage='';
 }catch{if(token!==revision||!root)return;cameraMessage='カメラを利用できません。カード番号を入力して続けられます。';}
 cameraPending=false;draw();}
 async function read(){if(!root||reading||busy||stage!=='scan')return;input=root.querySelector('#scan-number').value;reading=true;message='';candidates=[];draw();const token=revision;
  let text;try{text=await DCBOCR.readNumber({text:input});}catch{if(token!==revision||!root)return;reading=false;message='カード番号を読み取れませんでした。もう一度番号を枠内に合わせてください。';draw();return;}if(token!==revision||!root)return;reading=false;
  const result=DCBMatcher.match(text,DCBData.cards);candidates=result.candidates;
  if(result.kind==='exact'){await choose(candidates[0]);return;}
  message=result.kind==='ambiguous'?'同じ番号に複数の仕様があります。カードを確認してください。':result.kind==='suggestions'?'近い番号が見つかりました。番号を確認してください。':result.kind==='unreadable'?'カード番号を読み取れませんでした。もう一度番号を枠内に合わせてください。':result.kind==='tooMany'?'仕様の追加確認が必要です。番号を読み直してください。':'登録されているカードに一致する番号がありません。番号を確認してください。';draw();
 }
 async function choose(card){selected=card;candidates=[];message='';if(mode==='fast')await register(null);else{stage='capture';draw();}}
 async function takePhoto(){const canvas=document.createElement('canvas');canvas.width=420;canvas.height=600;const context=canvas.getContext('2d');const video=root.querySelector('video');
  if(stream){if(!video.videoWidth||video.readyState<2)throw new Error('カメラを準備中です。もう一度撮影してください。');const view=root.querySelector('.scan-camera').getBoundingClientRect(),guide=root.querySelector('.scan-guide').getBoundingClientRect();const scale=Math.max(view.width/video.videoWidth,view.height/video.videoHeight);const offsetX=(video.videoWidth*scale-view.width)/2,offsetY=(video.videoHeight*scale-view.height)/2;context.drawImage(video,(guide.left-view.left+offsetX)/scale,(guide.top-view.top+offsetY)/scale,guide.width/scale,guide.height/scale,0,0,420,600);
  }else{context.fillStyle='#fff3f8';context.fillRect(0,0,420,600);context.strokeStyle=selected.color;context.lineWidth=4;context.strokeRect(20,20,380,560);context.fillStyle=selected.color;context.textAlign='center';context.font='bold 32px sans-serif';context.fillText('DEMO CAPTURE',210,200);context.font='26px sans-serif';context.fillText(selected.cardNumber,210,300);context.font='18px sans-serif';context.fillText(selected.category,210,350);}
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('撮影できませんでした。')),'image/jpeg',.82));
 }
 async function capture(){if(busy||!root||stage!=='capture')return;try{const token=revision;const snapshot=takePhoto();busy=true;draw();const blob=await snapshot;if(token!==revision||!root)return;busy=false;await register(blob);}catch(e){busy=false;message=e.message;cameraMessage=message;draw();}}
 async function register(blob){if(busy||!root||!selected)return;const card=selected;const current=DCBStore.get(card);if(current.ownedCount>=999){message='所持枚数が上限に達しています。';stage='scan';draw();return;}
  busy=true;draw();const token=revision;let previous,photoWritten=false;
  try{
   if(blob){previous=await DCBPhotos.read(card.id);await DCBPhotos.write({cardId:card.id,blob,capturedAt:Date.now()});photoWritten=true;}
   if(token!==revision||!root)throw new Error('登録を中断しました。');
   if(DCBStore.get(card).ownedCount>=999)throw new Error('所持枚数が上限に達しています。');if(!DCBStore.update(card,{ownedCount:DCBStore.get(card).ownedCount+1}))throw new Error('所持情報を保存できませんでした。');
   busy=false;sessionCount++;stage='success';draw();clearTimeout(timer);timer=setTimeout(next,850);
  }catch(e){if(photoWritten){try{if(previous)await DCBPhotos.write(previous);else await DCBPhotos.remove(card.id);}catch{}}
   if(token!==revision||!root)return;busy=false;cameraMessage=blob?'写真または所持情報を保存できませんでした。再試行するか、写真なしで登録してください。':e.message;draw();}
 }
 function next(){if(!root||busy)return;clearTimeout(timer);stage='scan';selected=null;candidates=[];message='';input='';cameraMessage='';draw();}
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&root){stream?.getTracks().forEach(t=>t.stop());stream=null;if(autoPending){clearTimeout(timer);autoPending=false;busy=false;}if(root){cameraMessage='カメラを停止しました。再起動できます。';draw();}}});
 function handleClick(e){const button=e.target.closest('button');if(!button||!root?.contains(button))return;
  if(button.dataset.mode){if(!busy&&!reading){clearTimeout(timer);setMode(button.dataset.mode);stage='scan';selected=null;candidates=[];message='';draw();}return;}
  if(button.hasAttribute('data-example')){input=button.dataset.example;message='';candidates=[];draw();return;}
  if(button.dataset.pick){if(!reading&&!busy){const card=candidates.find(c=>c.id===button.dataset.pick);if(card)choose(card);}return;}
  switch(button.dataset.scan){case 'exit':if(!busy){stop();location.hash='#binder';}break;case 'camera':camera();break;case 'retry':if(!busy)next();break;case 'next':next();break;case 'capture':capture();break;case 'without-photo':register(null);break;case 'auto':if(!busy){autoPending=true;busy=true;cameraMessage='枠内で安定を確認中…';draw();const token=revision;timer=setTimeout(()=>{if(token!==revision||!root)return;autoPending=false;busy=false;capture();},1000);}break;}
 }
 window.addEventListener('pagehide',stop);document.addEventListener('click',handleClick);
 document.addEventListener('submit',e=>{if(e.target.id==='scan-number-form'&&root?.contains(e.target)){e.preventDefault();read();}});
 return{mount,stop,getMode,setMode};
})();




