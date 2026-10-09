/* Static publishing build with self-hosted pinned OCR assets. Only explicitly referenced app assets ship. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=__dirname,out=path.join(root,'dist');
const production=process.env.VERCEL_ENV==='production';
// Vercel provides scheme-less domains; explicit SITE_URL remains an optional override.
const vercelHost=process.env.VERCEL==='1'?(production?(process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL):process.env.VERCEL_URL):null;
let origin=process.env.SITE_URL||(vercelHost?'https://'+vercelHost:'http://localhost:4174');const url=new URL(origin);
if(url.username||url.password||url.pathname!=='/'||url.search||url.hash||!['http:','https:'].includes(url.protocol))throw Error('SITE_URL must be an origin without credentials, path, query or fragment.');
origin=url.origin;
if(production&&(!(process.env.SITE_URL||vercelHost)||url.protocol!=='https:'||/^(localhost|127\.)/.test(url.hostname)||/\.(example|invalid|test)$/.test(url.hostname)))throw Error('Production requires a confirmed HTTPS SITE_URL or Vercel system URL.');
const indexable=process.env.PUBLIC_INDEXING==='true'&&process.env.VERCEL_ENV!=='preview';
if(indexable&&(!process.env.SITE_URL||url.protocol!=='https:'))throw Error('Indexing requires an explicit HTTPS SITE_URL.');
// The deletion target is fixed, resolved, and verified within this workspace.
if(path.dirname(out)!==root||path.basename(out)!=='dist'||(fs.existsSync(out)&&fs.lstatSync(out).isSymbolicLink()))throw Error('Unsafe output directory');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'app'),{recursive:true});
const write=(name,text)=>fs.writeFileSync(path.join(out,name),text);
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const description='アイカツ！アンコールのカードを管理する非公式デジタルバインダー。所持・未所持、コーデ、コンプリート状況、交換候補とほしいカードを管理。V0.1ではダミーQRによるトレード候補照合を体験できます。';
function seo(title,route,allowIndex){const canonical=origin+route;const schema={'@context':'https://schema.org','@type':'WebApplication',name:'アイカツDCB',alternateName:'アイカツ！アンコール Digital Card Binder',url:origin+'/',description,applicationCategory:'UtilitiesApplication',operatingSystem:'Web browser',inLanguage:'ja',softwareVersion:'0.1',isAccessibleForFree:true};return `<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="${indexable&&allowIndex?'index, follow':'noindex, follow'}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="ja_JP"><meta property="og:site_name" content="アイカツDCB"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/share.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="アイカツDCB — カード管理・コレクション・トレードの非公式プロトタイプ"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${origin}/share.png">${route==='/'?'<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>':''}`;}
const appHTML=fs.readFileSync(path.join(root,'index.html'),'utf8');
write('app/index.html',appHTML.replace('<head>','<head><base href="/">'+'<link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/icons/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">'));
const assets=[...new Set([...JSON.parse(fs.readFileSync(path.join(root,'boot.js'),'utf8').match(/const scriptFiles = (\[[^\]]+\])/)[1]),...[...appHTML.matchAll(/(?:src|href)="([^"/]+\.(?:js|css))"/g)].map(m=>m[1])])];
for(const asset of assets){if(path.basename(asset)!==asset)throw Error('Unsupported asset '+asset);fs.copyFileSync(path.join(root,asset),path.join(out,asset));}
// Self-host pinned browser OCR assets; camera crops never leave the device.
const ocrOut=path.join(out,'vendor','ocr');fs.mkdirSync(path.join(ocrOut,'core'),{recursive:true});fs.mkdirSync(path.join(ocrOut,'lang'));
for(const name of ['tesseract.min.js','worker.min.js'])fs.copyFileSync(path.join(root,'node_modules','tesseract.js','dist',name),path.join(ocrOut,name));
const coreDir=path.join(root,'node_modules','tesseract.js-core');for(const name of fs.readdirSync(coreDir).filter(n=>/\.wasm(?:\.js)?$/.test(n)))fs.copyFileSync(path.join(coreDir,name),path.join(ocrOut,'core',name));
fs.copyFileSync(path.join(root,'node_modules','@tesseract.js-data','eng','4.0.0_best_int','eng.traineddata.gz'),path.join(ocrOut,'lang','eng.traineddata.gz'));
for(const [pkg,name] of [['tesseract.js','TESSERACT-LICENSE'],['tesseract.js-core','CORE-LICENSE']])fs.copyFileSync(path.join(root,'node_modules',pkg,pkg==='tesseract.js'?'LICENSE.md':'LICENSE'),path.join(ocrOut,name+'.txt'));
fs.mkdirSync(path.join(out,'data'));for(const name of ['cards','coordinates','news'])fs.copyFileSync(path.join(root,'data',name+'.json'),path.join(out,'data',name+'.json'));
const publicNews=JSON.parse(fs.readFileSync(path.join(root,'data/news.json'),'utf8'));
const categories={game:'ゲーム',distribution:'配布',supplement:'付録',bonus:'特典'};
const rows=publicNews.map(n=>{if(!categories[n.acquisitionType])throw Error('Unknown news category');return `<li><span class="news-category news-${n.acquisitionType}">${categories[n.acquisitionType]}</span><span>${escape(n.title)}</span></li>`;}).join('');
write('index.html',fs.readFileSync(path.join(root,'public/index.html'),'utf8').replace('{{SEO}}',seo('アイカツDCB｜アイカツ！アンコール カード管理・トレード','/',true)));
// Sample news must not be indexed as real acquisition information.
write('news.html',fs.readFileSync(path.join(root,'public/news.html'),'utf8').replace('{{SEO}}',seo('最新カードニュース（デモ）｜アイカツDCB','/news',false)).replace('{{NEWS_ROWS}}',rows));
for(const name of ['public.css','public.js','404.html','share.png'])fs.copyFileSync(path.join(root,'public',name),path.join(out,name));
fs.cpSync(path.join(root,'public/icons'),path.join(out,'icons'),{recursive:true});
write('manifest.webmanifest',JSON.stringify({id:'/app/',name:'アイカツDCB',short_name:'アイカツDCB',description:'非公式のカード管理・コレクション・トレード用プロトタイプ',lang:'ja',start_url:'/app/',scope:'/app/',display:'standalone',background_color:'#ffffff',theme_color:'#ff62a7',icons:[{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/icons/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},null,2));
write('robots.txt',indexable?'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n':'User-agent: *\nDisallow: /\n');
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+(indexable?'<url><loc>'+escape(origin)+'/</loc></url>':'')+'</urlset>\n');
console.log(`Built dist: ${assets.length} app assets; origin=${origin}; public indexing=${indexable}; app and sample news=noindex.`);
