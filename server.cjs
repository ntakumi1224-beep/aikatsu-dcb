const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const publicMode=process.argv.includes('--public'),root=publicMode?path.join(__dirname,'dist'):__dirname,port=Number(process.env.PORT)||(publicMode?4174:4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json; charset=utf-8','.wasm':'application/wasm','.gz':'application/gzip'};
const appAssets=new Set([...fs.readFileSync(path.join(__dirname,'index.html'),'utf8').matchAll(/(?:src|href)="([^"/]+\.(?:js|css))"/g)].map(m=>'/'+m[1]));
for(const name of JSON.parse(fs.readFileSync(path.join(__dirname,'boot.js'),'utf8').match(/const scriptFiles = (\[[^\]]+\])/)[1]))appAssets.add('/'+name);for(const name of ['cards','coordinates','news'])appAssets.add('/data/'+name+'.json');
const ocrAssets=new Map([['/vendor/ocr/tesseract.min.js','node_modules/tesseract.js/dist/tesseract.min.js'],['/vendor/ocr/worker.min.js','node_modules/tesseract.js/dist/worker.min.js'],['/vendor/ocr/lang/eng.traineddata.gz','node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz']]);
for(const n of fs.readdirSync(path.join(__dirname,'node_modules/tesseract.js-core')).filter(n=>/\.wasm(?:\.js)?$/.test(n)))ocrAssets.set('/vendor/ocr/core/'+n,'node_modules/tesseract.js-core/'+n);
http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
if(publicMode&&name==='/app'){res.writeHead(308,{'Location':'/app/'}).end();return;}
let rel=name==='/'?'/index.html':name;
if(publicMode){if(name.startsWith('/app/'))rel='/app/index.html';else if(name==='/news')rel='/news.html';}
else if(!(name==='/'||name==='/index.html'||appAssets.has(name)||ocrAssets.has(name))){res.writeHead(404).end('Not found');return;}
const file=path.resolve(root,!publicMode&&ocrAssets.has(name)?ocrAssets.get(name):'.'+rel);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
const send=(status,body,type)=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':publicMode?'public, max-age=0, must-revalidate':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',...(name.startsWith('/app')||name==='/news'?{'X-Robots-Tag':'noindex, follow'}:{})});res.end(req.method==='HEAD'?undefined:body);};
fs.readFile(file,(err,data)=>{if(err){if(publicMode)fs.readFile(path.join(root,'404.html'),(e,d)=>send(404,e?'Not found':d,mime['.html']));else send(404,'Not found',mime['.txt']);return;}send(200,data,mime[path.extname(file)]||'application/octet-stream');});
}).listen(port,'0.0.0.0',()=>console.log(`DCB ${publicMode?'public preview':'prototype'}: http://localhost:${port}`));
