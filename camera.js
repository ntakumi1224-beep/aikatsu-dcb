/* Shared camera lifecycle. No automatic permission request on card-registration entry. */
window.DCBCamera=(()=>{
 const controllers=new Set();let active=null;
 const messages={NotAllowedError:'カメラへのアクセスが許可されていません。ブラウザまたは端末の設定からカメラを許可してください。',NotFoundError:'利用できるカメラが見つかりません。',NotReadableError:'カメラを開始できません。他のアプリがカメラを使用していないか確認してください。',SecurityError:'この環境ではカメラを使用できません。',OverconstrainedError:'利用できるカメラが見つかりません。',AbortError:'カメラを開始できませんでした。'};
 const constraints={video:{facingMode:{ideal:'environment'}},audio:false};
 function environment(){return {secureContext:window.isSecureContext,mediaDevices:!!navigator.mediaDevices,getUserMedia:typeof navigator.mediaDevices?.getUserMedia==='function',cameraPolicy:(document.permissionsPolicy||document.featurePolicy)?.allowsFeature?.('camera')??null};}
 function report(error,phase){console.warn('[DCBCamera]',phase,error.name||'Error',error.message||'');}
 function prepare(video){video.autoplay=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.setAttribute('autoplay','');video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');}
 function create(onChange=()=>{},options={}){
  let version=0,stream=null,video=null,pending=false,error=null;
  let zoom={supported:false,value:1,min:1,max:1,step:.1,base:1,busy:false,message:''};
  const state=()=>({stream,pending,error,zoom:{...zoom}});const notify=()=>onChange(state());
  function stop(reason=''){version++;zoom={supported:false,value:1,min:1,max:1,step:.1,base:1,busy:false,message:''};pending=false;const old=stream;stream=null;old?.getTracks().forEach(t=>t.stop());if(video){video.pause();video.srcObject=null;}video=null;if(active===api)active=null;error=null;if(reason){error={name:'Stopped',message:'カメラを停止しました。カメラを起動して再開できます。'};notify();}}
  function fail(e,phase,token){if(token!==version)return;report(e,phase);stop();error={name:e.name||'Error',message:phase==='play'&&e.name==='NotAllowedError'?'映像を再生できませんでした。「もう一度試す」をタップしてください。':messages[e.name]||'カメラを開始できませんでした。'};notify();}
  async function start(target){if(pending)return;stop();if(active&&active!==api)active.stop('switch');active=api;const token=version;video=target;pending=true;error=null;prepare(video);notify();let phase='getUserMedia';try{
   const info=environment();console.info('[DCBCamera] environment',info);
   if(!info.secureContext||info.cameraPolicy===false)throw new DOMException('Camera requires a secure context and an allowed camera policy.','SecurityError');
   if(!info.getUserMedia)throw new DOMException('mediaDevices.getUserMedia is unavailable.','SecurityError');
   let next;try{next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},...(options.highResolution?{width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:15}}:{})},audio:false});}catch(e){report(e,'preferred camera');if(token!==version||document.hidden)return;if(['NotAllowedError','SecurityError'].includes(e.name))throw e;next=await navigator.mediaDevices.getUserMedia({video:true,audio:false});}
   if(token!==version||document.hidden||!target.isConnected){next.getTracks().forEach(t=>t.stop());if(token===version)stop('inactive');return;}
   stream=next;inspectZoom();if(zoom.supported&&options.defaultZoom)await setZoom(options.defaultZoom,false);if(token!==version)return;prepare(video);video.srcObject=next;phase='play';await video.play();
   if(token!==version)return;if(document.hidden||!target.isConnected){stop('inactive');return;}
   pending=false;next.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>fail(new DOMException('Camera track ended.','NotReadableError'),'track',token),{once:true}));notify();
  }catch(e){fail(e,phase,token);}}
  function inspectZoom(){const track=stream?.getVideoTracks()[0];try{const cap=track?.getCapabilities?.().zoom,setting=track?.getSettings?.().zoom;if(cap&&Number.isFinite(cap.min)&&Number.isFinite(cap.max)&&cap.max>cap.min&&typeof track.applyConstraints==='function'){const value=Number.isFinite(setting)?setting:Math.max(cap.min,Math.min(cap.max,1));zoom={supported:true,min:cap.min,max:cap.max,step:cap.step>0?cap.step:.1,value,base:value,busy:false,message:''};}}catch{ /* Capability discovery is optional. */ }}
  async function setZoom(value,notifyChange=true){if(!zoom.supported||zoom.busy||!stream)return false;const token=version,track=stream.getVideoTracks()[0];const target=Math.max(zoom.min,Math.min(zoom.max,zoom.min+Math.round((Number(value)-zoom.min)/zoom.step)*zoom.step));if(!Number.isFinite(target))return false;zoom.busy=true;if(notifyChange)notify();try{const previous=track.getConstraints?.()||{};await track.applyConstraints({...previous,advanced:[...(previous.advanced||[]).filter(c=>!('zoom' in c)),{zoom:target}]});if(token!==version)return false;const actual=track.getSettings?.().zoom;if(!Number.isFinite(actual))throw Error('Camera did not report applied zoom.');zoom.value=actual;zoom.message='';return true;}catch(e){if(token!==version)return false;report(e,'zoom');try{const previous=track.getConstraints?.()||{};await track.applyConstraints({...previous,advanced:[...(previous.advanced||[]).filter(c=>!('zoom' in c)),{zoom:zoom.value}]});}catch{}if(token!==version)return false;zoom.supported=false;zoom.message='倍率を変更できません。このまま番号を読み取れます。';return false;}finally{if(token===version){zoom.busy=false;if(notifyChange)notify();}}}
  const zoomInfo=()=>({...zoom});
  // Reuse the existing video node across registration renders; avoid another stream assignment.
  function attach(target){prepare(target);if(!stream||pending)return;video=target;if(target.srcObject!==stream)target.srcObject=stream;if(target.paused){const token=version;target.play().catch(e=>fail(e,'play',token));}}
  const api={start,stop,attach,state,setZoom,zoomInfo};controllers.add(api);return api;
 }
 const suspend=()=>controllers.forEach(c=>c.stop('hidden'));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('pagehide',suspend);
 return {create,environment,constraints};
})();
