// Fallback for fetch_photos.py: shops that refuse plain downloads (bot protection) often allow a real browser.
// Opens each listing in headless Chromium, reads its main photo URL, and saves the photo as <out>/<id>.img.
// Usage: node browser_fetch.js items.json id1,id2,... outdir   (needs the playwright package)
// Set SPKI_TRUST to a base64 SHA-256 SPKI hash to trust one extra CA (for example a corporate or sandbox proxy).
const {chromium}=require('playwright');const fs=require('fs');
const items=JSON.parse(fs.readFileSync(process.argv[2]));const ids=process.argv[3].split(',');const out=process.argv[4];
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({channel:'chromium',args:['--disable-blink-features=AutomationControlled'].concat(process.env.SPKI_TRUST?['--ignore-certificate-errors-spki-list='+process.env.SPKI_TRUST]:[])});
 const ctx=await b.newContext({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',locale:'en-GB',viewport:{width:1280,height:900}});
 const res={};let i=0;
 async function one(id){
  const p=await ctx.newPage();
  try{
   await p.goto(items[id].url,{waitUntil:'domcontentloaded',timeout:30000});
   await p.waitForTimeout(1500);
   let src=await p.evaluate(()=>{
     const q=s=>{const e=document.querySelector(s);return e&&(e.content||e.getAttribute('content'));};
     let u=q('meta[property="og:image"]')||q('meta[property="og:image:secure_url"]')||q('meta[name="twitter:image"]');
     if(!u){for(const s of document.querySelectorAll('script[type="application/ld+json"]')){try{const j=JSON.parse(s.textContent);const arr=[].concat(j);for(const o of arr){let im=o.image||(o['@graph']||[]).map(g=>g.image).find(Boolean);if(im){im=[].concat(im)[0];u=typeof im==='string'?im:im.url;break;}}}catch(e){}if(u)break;}}
     return u?new URL(u,location.href).href:null;});
   if(!src){res[id]='no photo tag ('+(await p.title()).slice(0,40)+')';return;}
   let buf=null;
   const r=await ctx.request.get(src,{headers:{Referer:items[id].url},timeout:30000});
   if(r.ok()){buf=await r.body();}
   else{const r2=await p.goto(src,{timeout:30000});if(r2&&r2.ok()){buf=await r2.body();}}
   if(!buf){res[id]='image refused';return;}
   fs.writeFileSync(out+'/'+id+'.img',buf);res[id]='ok';
  }catch(e){res[id]='failed: '+String(e.message).split('\n')[0].slice(0,80);}
  finally{await p.close();}
 }
 const q=ids.slice();await Promise.all(Array.from({length:6},async()=>{while(q.length){await one(q.shift());}}));
 fs.writeFileSync(out+'/report.json',JSON.stringify(res,null,1));
 await b.close();
 const ok=Object.values(res).filter(v=>v==='ok').length;console.log(ok+' of '+ids.length+' ok');
 for(const [k,v] of Object.entries(res)) if(v!=='ok') console.log('- '+k+': '+v);
})();
