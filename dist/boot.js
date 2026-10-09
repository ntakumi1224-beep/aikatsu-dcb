/* Read generated JSON before loading modules that depend on the Master. */
(()=>{
 const assetRoot=new URL('.',document.currentScript.src);
 const scriptFiles = ["store.js", "matcher.js", "photos.js", "ui.js", "camera.js", "ocr.js", "capture.js", "registration.js", "binder.js", "trade-model.js", "trade.js", "settings-model.js", "settings.js", "app.js"];
 const loadScript=file=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(file,assetRoot);s.onload=resolve;s.onerror=()=>reject(Error('Module unavailable'));document.head.append(s);});
 window.DCBReady=(async()=>{
  const names=['cards','coordinates','news'];const values=await Promise.all(names.map(async name=>{const r=await fetch(new URL('data/'+name+'.json',assetRoot));if(!r.ok)throw Error('Master unavailable');return r.json();}));
  window.DCBData=DCBCreateData(Object.fromEntries(names.map((name,i)=>[name,values[i]])));
  for(const file of scriptFiles)await loadScript(file);
 })();
 window.DCBReady.catch(()=>{const app=document.getElementById('app');app.innerHTML='<main class="app-main" role="alert"><h1>カードデータを読み込めませんでした</h1><p>接続を確認して、もう一度お試しください。</p><button class="btn-primary" type="button">再読み込み</button></main>';app.querySelector('button').onclick=()=>location.reload();});
})();
