/* Display preferences are independent of profile and inventory data. */
window.DCBDisplay=(()=>{
 const key='dcb-display-v01';
 const colors=[{id:'cute',label:'キュート',color:'var(--color-pink)'},{id:'cool',label:'クール',color:'var(--color-blue)'},{id:'sexy',label:'セクシー',color:'var(--color-purple)'},{id:'pop',label:'ポップ',color:'var(--color-orange)'}];
 const themes=[{id:'white',label:'ホワイト'},{id:'dark',label:'ダーク'}];
 // Add supported locales here when their translations become available.
 const languages=[{id:'ja',label:'日本語'}];
 const defaults={color:'cute',theme:'white',language:'ja'};
 const choices={color:colors,theme:themes,language:languages};
 const valid=(name,value)=>choices[name]?.some(item=>item.id===value);
 let preferences={...defaults};try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const name of Object.keys(defaults))if(valid(name,saved?.[name]))preferences[name]=saved[name];}catch{}
 function apply(){const root=document.documentElement;root.dataset.mainColor=preferences.color;root.dataset.theme=preferences.theme;root.lang=preferences.language;}
 function set(name,value){if(!valid(name,value))return false;const next={...preferences,[name]:value};try{localStorage.setItem(key,JSON.stringify(next));preferences=next;apply();return true;}catch{return false;}}
 apply();return {colors,themes,languages,get preferences(){return {...preferences};},set};
})();
