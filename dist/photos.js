/* User captures stay on this browser; no network or cloud service is used. */
window.DCBPhotos=(()=>{
 let database;
 function open(){if(database)return database;database=new Promise((resolve,reject)=>{if(!window.indexedDB){reject(new Error('Photo storage unavailable'));return;}const request=indexedDB.open('aikatsu-dcb-photos-v01',1);request.onupgradeneeded=()=>request.result.createObjectStore('photos',{keyPath:'cardId'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Photo storage blocked'));});database.catch(()=>{database=null;});return database;}
 async function transaction(mode,work){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('photos',mode);let result;const req=work(tx.objectStore('photos'));req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result??null);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Photo write aborted'));});}
 return{read:cardId=>transaction('readonly',s=>s.get(cardId)),write:record=>transaction('readwrite',s=>s.put(record)),remove:cardId=>transaction('readwrite',s=>s.delete(cardId))};
})();
