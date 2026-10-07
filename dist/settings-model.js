/* V0.1 profile fields persist locally; passwords exist only in this page's memory. */
window.DCBSettingsModel=(()=>{
 const key='dcb-user-v01',emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;let profile={},currentPassword=null;
 try{const saved=JSON.parse(localStorage.getItem(key)||'{}');if(saved&&typeof saved==='object')profile=saved;}catch{}
 if(!/^DCB-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(profile.id||'')){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=crypto.getRandomValues(new Uint8Array(8));const chars=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');profile.id='DCB-'+chars.slice(0,4)+'-'+chars.slice(4);}
 if(typeof profile.email!=='string'||!emailPattern.test(profile.email)||profile.email.length>254){profile.email='';try{const pref=JSON.parse(localStorage.getItem('dcb-login-preference')||'{}');if(emailPattern.test(pref.identifier||''))profile.email=pref.identifier;}catch{}}
 profile={id:profile.id,email:profile.email};try{localStorage.setItem(key,JSON.stringify(profile));}catch{}
 function setEmail(value){const email=String(value||'').trim();if(email.length>254||!emailPattern.test(email))return {ok:false,error:'メールアドレスを確認してください。'};const next={id:profile.id,email};try{localStorage.setItem(key,JSON.stringify(next));profile=next;return {ok:true};}catch{return {ok:false,error:'保存できませんでした。'};}}
 function login(identifier,password){currentPassword=password;const value=String(identifier).trim();if(emailPattern.test(value)&&value.length<=254)setEmail(value);}
 function changePassword(current,next,confirmation){if(currentPassword===null)return {ok:false,error:'現在のパスワードを確認するため、ログインし直してください。'};if(!current||current!==currentPassword)return {ok:false,error:'現在のパスワードが違います。'};if(!next)return {ok:false,error:'新しいパスワードを入力してください。'};if(next!==confirmation)return {ok:false,error:'新しいパスワードが一致していません。'};currentPassword=next;return {ok:true};}
 return {get profile(){return {...profile};},get canVerifyPassword(){return currentPassword!==null;},login,logout(){currentPassword=null;},setEmail,changePassword};
})();
