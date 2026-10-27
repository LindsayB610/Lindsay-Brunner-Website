// No build here. Run only against a completed canonical build (test:images:release).
// Playwright's dedicated bundled headless shell ONLY: no channel/executable override.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { transformHtml } from '../scripts/images/pipeline.mjs';
const root=process.cwd(), publish=path.join(root,'public');
const manifest=JSON.parse(await fs.readFile(path.join(root,'.generated/images/manifest.json'),'utf8'));
const report={checks:[],errors:[],browser:null,cleanup:null};
const requests=[];
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
// Exercise the real unused shortcode without changing authored content or public.
const zoomSource='/images/workshop/slate-library.png';
const shortcode=(await fs.readFile(path.join(root,'layouts/shortcodes/zoomable-diagram.html'),'utf8')).replace(/^{{[^\n]*}}\n/gm,'').replaceAll('{{ $id }}','runtime-zoom').replaceAll('{{ $src }}',zoomSource).replaceAll('{{ $alt }}','Runtime zoom fixture');
const zoomHtml=transformHtml({html:'<!doctype html><html><body>'+shortcode+'</body></html>',documentUrl:'/__image-runtime-zoom/',manifest}).html;
const server=http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let body;let ext;
    if(pathname==='/__image-runtime-zoom/') {body=Buffer.from(zoomHtml);ext='.html';}
    else {
      let file=path.resolve(publish,'.'+pathname);assert.ok(file===publish || file.startsWith(publish+path.sep));
      if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
      body=await fs.readFile(file);ext=path.extname(file);
    }
    requests.push({path:pathname,bytes:body.length});
    res.writeHead(200,{'Content-Type':mime[ext]??'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store'});res.end(body);
  } catch {res.writeHead(404);res.end();}
});
const ps=()=>execFileSync('ps',['-axo','pid=,ppid=,command='],{encoding:'utf8'}).trim().split('\n').map(line=>{const m=line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);return {pid:+m[1],ppid:+m[2],command:m[3]};});
let browser,origin,owned=[];
function captureChildren(){const rows=ps();const ids=new Set([process.pid]);for(let i=0;i<8;i++)for(const p of rows)if(ids.has(p.ppid))ids.add(p.pid);for(const p of rows)if(ids.has(p.pid)&&/headless|chromium/i.test(p.command)&&!owned.some(o=>o.pid===p.pid))owned.push(p);}
async function context(options={}) {
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,serviceWorkers:'block',...options});
  await ctx.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  const page=await ctx.newPage();const cdp=await ctx.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  return {ctx,page};
}
async function loaded(locator){
  await locator.waitFor();
  const image=await locator.elementHandle();
  try {
    // A lazy image may be visible before the browser starts its fetch. decode()
    // rejects in that interval; wait for a successful load, then verify decode.
    await locator.page().waitForFunction(img=>img.complete&&img.naturalWidth>0,image);
    await locator.evaluate(img=>img.decode());
  } finally {await image.dispose();}
}
function variant(url){const pathname=new URL(url,origin).pathname;for(const entry of Object.values(manifest.images)){const v=entry.variants.find(v=>v.url===pathname);if(v)return {entry,v};}throw Error('Unregistered selected derivative '+pathname);}
function noOriginal(list,source){assert.equal(list.filter(r=>r.path===source).length,0,'Unexpected original request '+source);}
function record(name,data={}){report.checks.push({name,...data});console.log('PASS '+name);}
async function cleanup(){
  if(browser){captureChildren();await browser.close();browser=null;}
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  const remaining=ps().filter(p=>owned.some(o=>o.pid===p.pid&&o.command===p.command));
  report.cleanup={owned,remaining};
  // Only our recorded children may be terminated; never touch other browser sessions.
  for(const p of remaining){try{process.kill(p.pid,'SIGTERM');}catch{}}
  await fs.mkdir(path.join(root,'.generated/images'),{recursive:true});
  await fs.writeFile(path.join(root,'.generated/images/runtime-report.json'),JSON.stringify(report,null,2));
  assert.equal(remaining.length,0,'Orphaned owned headless processes after browser.close');
}
const signal=()=>{cleanup().finally(()=>process.exit(130));};
process.once('SIGINT',signal);process.once('SIGTERM',signal);
try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true});captureChildren();
  assert.ok(owned.some(p=>/chromium[_-]headless[_-]shell/.test(p.command)),'Dedicated bundled headless shell required');
  assert.ok(owned.every(p=>!p.command.includes('/Applications/')),'Installed GUI browser forbidden');
  report.browser=browser.version();
  for(const width of [390,1440])for(const dpr of [1,2]) {
    const {ctx,page}=await context({viewport:{width,height:width===390?844:1000},deviceScaleFactor:dpr,isMobile:width===390});const start=requests.length;
    try {
      await page.goto(origin+'/christmas-2026-lucas/',{waitUntil:'load'});
      const cover=page.locator('.christmas-cover');await loaded(cover);
      const selected=await cover.evaluate(img=>({url:img.currentSrc,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,loading:img.loading,priority:img.fetchPriority}));
      const {entry,v}=variant(selected.url);const seen=requests.slice(start);
      const allowed=width===390?(dpr===1?[480,640]:[800,1200]):[1200];assert.ok(allowed.includes(v.width),JSON.stringify({width,dpr,selected:v.width}));
      assert.ok(v.bytes<entry.bytes*0.5,'Cover must halve source bytes');assert.ok(v.bytes<=(v.width<=800?150000:300000),'Cover selected response budget');
      assert.equal(seen.filter(r=>r.path===v.url).length,1);assert.equal(seen.find(r=>r.path===v.url).bytes,v.bytes);noOriginal(seen,entry.sourceUrl);
      assert.equal(selected.loading,'eager');assert.equal(selected.priority,'high');assert.ok(Math.abs(selected.width/selected.height-1200/630)<0.01);
      assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
      record(`Christmas ${width} DPR${dpr}`,{selected:v.url,bytes:v.bytes,originalBytes:entry.bytes});
    } catch(error) {report.errors.push(error.stack);console.error(error);process.exitCode=1;} finally {await ctx.close();}
  }
  for (const width of [360,390,1440]) {
    const {ctx,page}=await context({javaScriptEnabled:false,viewport:{width,height:1000}});const start=requests.length;
    try {
      await page.goto(origin+'/about/',{waitUntil:'load'});
      const portrait=page.getByRole('img',{name:'Lindsay Brunner',exact:true});await loaded(portrait);
      const state=await portrait.evaluate(img=>({url:img.currentSrc,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,loading:img.loading}));
      assert.ok(Math.abs(state.width-(width<768?192:252))<1,'No-JS portrait layout changed');
      assert.ok(Math.abs(state.height-state.width)<1,'No-JS portrait must remain square '+JSON.stringify(state));
      assert.equal(state.loading,'eager');assert.ok(await page.getByRole('heading',{level:1}).isVisible());
      assert.ok(await page.getByRole('link',{name:'Start the conversation',exact:true}).isVisible());
      variant(state.url);noOriginal(requests.slice(start),'/images/avatar-color-trans.png');
      record(`About no-JS ${width}`,state);
    } catch(error) {report.errors.push(error.stack);console.error(error);process.exitCode=1;} finally {await ctx.close();}
  }
  for (const width of [640,800,900,1440]) {
    const {ctx,page}=await context({viewport:{width,height:1000}});
    try {
      await page.goto(origin+'/nemesis/',{waitUntil:'load'});
      const photo=page.locator('.nemesis-log-photo img').first();await photo.scrollIntoViewIfNeeded();await loaded(photo);
      const state=await photo.evaluate(img=>({url:img.currentSrc,width:img.getBoundingClientRect().width,sizes:img.sizes}));
      const {entry,v}=variant(state.url);
      assert.ok(v.width>=Math.min(entry.width,state.width),JSON.stringify({width,slot:state.width,selected:v.width,sizes:state.sizes}));
      record(`Nemesis slot ${width}`,{...state,selectedWidth:v.width});
    } catch(error) {report.errors.push(error.stack);console.error(error);process.exitCode=1;} finally {await ctx.close();}
  }
  for(const item of [...[360,390,1440].map(width=>({route:'/about/',source:'/images/avatar-color-trans.png',host:'[data-image-react-host="retained"]',retain:true,width})), {route:'/',source:'/images/workshop/workshop-shelf.png',host:'#homepage-root > div'}]) {
    const {ctx,page}=await context({reducedMotion:'reduce',viewport:{width:item.width??1440,height:1000}});let release;const gate=new Promise(r=>release=r);const start=requests.length;
    try {
      await page.route('**/react/**/*.js',async route=>{await gate;await route.continue();});
      await page.goto(origin+item.route,{waitUntil:'commit'});
      const img=page.locator(`img[data-image-source="${item.source}"]`);await img.waitFor({state:'attached'});
      if(await img.getAttribute('loading') !== 'lazy') await img.evaluate(el=>el.decode());
      const before=await img.evaluate(el=>({html:el.outerHTML,src:el.getAttribute('src'),srcset:el.getAttribute('srcset'),sizes:el.sizes,current:el.currentSrc,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,alt:el.alt,loading:el.loading,priority:el.fetchPriority}));
      const originalImage=await img.elementHandle();
      release();
      await page.waitForFunction(({source,host})=>document.querySelector(`${host} img[data-image-source="${source}"]`)!==null,{source:item.source,host:item.host});
      if(item.retain) assert.equal(await img.evaluate((el,original)=>el===original,originalImage),true,'Portrait takeover replaced the original DOM image');
      await originalImage.dispose();
      await img.scrollIntoViewIfNeeded();await loaded(img);const after=await img.evaluate(el=>({src:el.getAttribute('src'),srcset:el.getAttribute('srcset'),sizes:el.sizes,current:el.currentSrc,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,alt:el.alt,loading:el.loading,priority:el.fetchPriority}));
      assert.deepEqual({src:after.src,srcset:after.srcset,sizes:after.sizes},{src:before.src,srcset:before.srcset,sizes:before.sizes},'React and fallback descriptor differ');
      if(before.current) assert.equal(after.current,before.current,'React changed an already selected fallback source');
      if(item.retain) {
        // JS-enabled fallback is intentionally hidden by head.html. Check the
        // existing 220/280px React frame minus its 30px border/padding instead.
        const expectedWidth=item.width<768?190:250;
        assert.ok(Math.abs(after.width-expectedWidth)<1,'Retained portrait changed React display width '+after.width);
        assert.ok(Math.abs(after.height-expectedWidth)<1,'Retained portrait changed React display height '+after.height);
        assert.ok(Math.abs(after.width/after.height-1)<0.01,'Retained portrait lost its square aspect ratio');
        const timelineTop=await page.getByRole('heading',{name:"Here's the timeline version",exact:true}).evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
        if(item.width<768) assert.ok(timelineTop<(item.width<=360?2550:2450),'Portrait displaced mobile timeline '+timelineTop);
        after.timelineTop=timelineTop;
        assert.equal(after.alt,before.alt);assert.equal(after.loading,'eager');assert.equal(after.priority,before.priority);
      }
      const {entry,v}=variant(after.current);const seen=requests.slice(start);noOriginal(seen,item.source);
      const derivativeRequests=seen.filter(r=>entry.variants.some(v=>v.url===r.path));
      assert.equal(derivativeRequests.length,1,'React takeover double fetched '+JSON.stringify(derivativeRequests));
      record('React takeover '+item.route+' '+(item.width??1440),{selected:v.url,requests:derivativeRequests.length,width:after.width,height:after.height,timelineTop:after.timelineTop});
    } catch(error) {report.errors.push(error.stack);console.error(error);process.exitCode=1;} finally {release();await ctx.close();}
  }
  {
    const {ctx,page}=await context();const start=requests.length;
    try {
      await page.goto(origin+'/',{waitUntil:'load'});
      const logo=page.locator('img[data-image-source="/images/logos/parasail.png"]');
      await logo.waitFor({timeout:15000});await loaded(logo);
      const selected=await logo.evaluate(img=>({current:img.currentSrc,sizes:img.sizes}));const {v}=variant(selected.current);
      assert.equal(selected.sizes,'126px');assert.ok(v.width>=126&&v.width<=320);noOriginal(requests.slice(start),'/images/logos/parasail.png');
      const avatar=page.locator('img[data-image-profile="avatar"]').first();await avatar.scrollIntoViewIfNeeded();await loaded(avatar);
      const avatarData=await avatar.evaluate(img=>({current:img.currentSrc,source:img.dataset.imageSource,sizes:img.sizes}));variant(avatarData.current);assert.equal(avatarData.sizes,'64px');noOriginal(requests.slice(start),avatarData.source);
      record('Logo rotation and visible testimonial',{logo:selected.current,avatar:avatarData.current});
    } catch(error) {report.errors.push(error.stack);console.error(error);process.exitCode=1;} finally {await ctx.close();}
  }
  for(const item of [{route:'/nemesis/',key:'nemesis'},{route:'/fate-of-the-fellowship/',key:'fate'},{route:'/__image-runtime-zoom/',key:'zoom'}]) {
    const {ctx,page}=await context();const start=requests.length;
    try {
      await page.goto(origin+item.route,{waitUntil:'load'});
      const image=page.locator('dialog img[data-image-deferred="original"]');assert.equal(await image.count(),1);
      assert.ok([null,'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='].includes(await image.getAttribute('src')));assert.equal(await image.getAttribute('srcset'),null);
      const triggers=item.key==='zoom'?page.locator('.zoomable-diagram__trigger'):page.locator(`[data-${item.key}-lightbox-src]`);
      assert.ok(await triggers.count()>0,'No gallery triggers '+item.route);
      const originals=item.key==='zoom'?[zoomSource]:await triggers.evaluateAll((nodes,key)=>nodes.map(n=>n.getAttribute(`data-${key}-lightbox-src`)),item.key);
      for(const src of originals)noOriginal(requests.slice(start),src);
      const rounds=Math.min(2,await triggers.count());
      for(let i=0;i<rounds+1;i++) {
        const index=i%rounds;const before=requests.length;await triggers.nth(index).click();await loaded(image);
        assert.equal(new URL(await image.evaluate(img=>img.currentSrc)).pathname,originals[index]);
        assert.equal(await image.getAttribute('srcset'),null);assert.equal(await image.getAttribute('sizes'),null);
        assert.ok(requests.slice(before).some(r=>r.path===originals[index]),'Original missing after click');
        await page.locator('dialog[open] button').first().click();
        await page.waitForFunction(()=>!document.querySelector('dialog img[data-image-deferred="original"]').hasAttribute('src'));
      }
      record('Deferred original open/swap/close/reopen '+item.route,{originalsTested:rounds});
    } catch(error) {report.errors.push(error.stack);console.error(error);process.exitCode=1;} finally {await ctx.close();}
  }
} catch(error) {report.error=error.stack;process.exitCode=1;console.error(error);}
finally {process.off('SIGINT',signal);process.off('SIGTERM',signal);await cleanup();}
