/* Shared camera lifecycle. No automatic permission request on card-registration entry. */
window.DCBCamera=(()=>{
 const controllers=new Set();let active=null;
 const messages={NotAllowedError:'カメラへのアクセスが許可されていません。ブラウザまたは端末の設定からカメラを許可してください。',NotFoundError:'利用できるカメラが見つかりません。',NotReadableError:'カメラを開始できません。他のアプリがカメラを使用していないか確認してください。',SecurityError:'この環境ではカメラを使用できません。',OverconstrainedError:'利用できるカメラが見つかりません。',AbortError:'カメラを開始できませんでした。'};
 const constraints={video:{facingMode:{ideal:'environment'}},audio:false};
 function environment(){return {secureContext:window.isSecureContext,mediaDevices:!!navigator.mediaDevices,getUserMedia:typeof navigator.mediaDevices?.getUserMedia==='function',cameraPolicy:(document.permissionsPolicy||document.featurePolicy)?.allowsFeature?.('camera')??null};}
 function report(error,phase){console.warn('[DCBCamera]',phase,error.name||'Error',error.message||'');}
 function prepare(video){video.autoplay=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.setAttribute('autoplay','');video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');}
 function create(onChange=()=>{}){
  let version=0,stream=null,video=null,pending=false,error=null;
  const state=()=>({stream,pending,error});const notify=()=>onChange(state());
  function stop(reason=''){version++;pending=false;const old=stream;stream=null;old?.getTracks().forEach(t=>t.stop());if(video){video.pause();video.srcObject=null;}video=null;if(active===api)active=null;error=null;if(reason){error={name:'Stopped',message:'カメラを停止しました。カメラを起動して再開できます。'};notify();}}
  function fail(e,phase,token){if(token!==version)return;report(e,phase);stop();error={name:e.name||'Error',message:phase==='play'&&e.name==='NotAllowedError'?'映像を再生できませんでした。「もう一度試す」をタップしてください。':messages[e.name]||'カメラを開始できませんでした。'};notify();}
  async function start(target){if(pending)return;stop();if(active&&active!==api)active.stop('switch');active=api;const token=version;video=target;pending=true;error=null;prepare(video);notify();let phase='getUserMedia';try{
   const info=environment();console.info('[DCBCamera] environment',info);
   if(!info.secureContext||info.cameraPolicy===false)throw new DOMException('Camera requires a secure context and an allowed camera policy.','SecurityError');
   if(!info.getUserMedia)throw new DOMException('mediaDevices.getUserMedia is unavailable.','SecurityError');
   let next;try{next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});}catch(e){report(e,'preferred camera');if(token!==version||document.hidden)return;if(['NotAllowedError','SecurityError'].includes(e.name))throw e;next=await navigator.mediaDevices.getUserMedia({video:true,audio:false});}
   if(token!==version||document.hidden||!target.isConnected){next.getTracks().forEach(t=>t.stop());if(token===version)stop('inactive');return;}
   stream=next;prepare(video);video.srcObject=next;phase='play';await video.play();
   if(token!==version)return;if(document.hidden||!target.isConnected){stop('inactive');return;}
   pending=false;next.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>fail(new DOMException('Camera track ended.','NotReadableError'),'track',token),{once:true}));notify();
  }catch(e){fail(e,phase,token);}}
  // Reuse the existing video node across registration renders; avoid another stream assignment.
  function attach(target){prepare(target);if(!stream||pending)return;video=target;if(target.srcObject!==stream)target.srcObject=stream;if(target.paused){const token=version;target.play().catch(e=>fail(e,'play',token));}}
  const api={start,stop,attach,state};controllers.add(api);return api;
 }
 const suspend=()=>controllers.forEach(c=>c.stop('hidden'));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('pagehide',suspend);
 return {create,environment,constraints};
})();
