// Real built pages, one dedicated headless browser, no GUI-browser fallback.
// VISUAL_AUDIT_ORIGIN optionally repeats these same assertions against production.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const root=process.cwd(), output=path.join(root,'.generated/images/visual-layout');
const requested=process.argv.find(arg=>arg.startsWith('--group='))?.split('=')[1];
const report={checks:[],failures:[],cleanup:null};
const articles=[
 '/blog/2026-09-25/build-e-ink-codex-usage-display-with-ai/',
 '/blog/2025-06-25/what-is-developer-marketing-guide/',
 '/blog/2025-06-13/meet-guideforge/',
];
const widths=[320,360,390,600,768,1440];
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try{
  let file=path.resolve(root,'public','.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  assert.ok(file===path.join(root,'public')||file.startsWith(path.join(root,'public')+path.sep));
  if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}
});
const ps=()=>execFileSync('ps',['-axo','pid=,ppid=,command='],{encoding:'utf8'}).trim().split('\n').map(line=>{const m=line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);return {pid:+m[1],ppid:+m[2],command:m[3]};});
let browser,origin,owned=[];
function captureChildren(){const rows=ps(),ids=new Set([process.pid]);for(let i=0;i<8;i++)for(const p of rows)if(ids.has(p.ppid))ids.add(p.pid);for(const p of rows)if(ids.has(p.pid)&&/headless|chromium/i.test(p.command)&&!owned.some(o=>o.pid===p.pid))owned.push(p);}
async function cleanup(){
 if(browser){captureChildren();await browser.close();browser=null;}
 if(server.listening){server.closeAllConnections();await new Promise(r=>server.close(r));}
 report.cleanup=ps().filter(p=>owned.some(o=>o.pid===p.pid&&o.command===p.command));
 await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 assert.equal(report.cleanup.length,0,'Owned browser processes must exit');
}
const signal=()=>cleanup().finally(()=>process.exit(130));process.once('SIGINT',signal);process.once('SIGTERM',signal);
async function check(name,fn){try{const data=await fn();report.checks.push({name,...data});console.log('PASS '+name);}catch(error){report.failures.push({name,error:error.stack});console.error('FAIL '+name+'\n'+error.message);}}
async function pageFor(width){
 const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 await ctx.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(u.pathname==='/__layout-test-font.ttf')return r.fulfill({path:path.join(root,'tests/fixtures/fonts/cinzel-decorative-900.ttf'),contentType:'font/ttf'});
  return u.origin===origin?r.continue():r.abort();
 });
 return {ctx,page:await ctx.newPage()};
}
async function visit(page,route){const response=await page.goto(origin+route,{waitUntil:'load'});assert.equal(response.status(),200,route);}
try{
 await fs.mkdir(output,{recursive:true});
 if(process.env.VISUAL_AUDIT_ORIGIN)origin=new URL(process.env.VISUAL_AUDIT_ORIGIN).origin;
 else{await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;}
 report.origin=origin;
 browser=await chromium.launch({headless:true});captureChildren();assert.ok(owned.some(p=>/chromium[_-]headless[_-]shell/.test(p.command)),'Dedicated headless shell required');assert.ok(owned.every(p=>!p.command.includes('/Applications/')));
 for(const width of widths){
  const {ctx,page}=await pageFor(width);
  try{
   if(!requested||requested==='tables')for(const route of articles)await check(`tables ${width} ${route}`,async()=>{
    await visit(page,route);
    const tables=page.locator('.article-content table');assert.ok(await tables.count()>0);
    const metrics=await tables.evaluateAll(nodes=>nodes.map(t=>{
     const wrapper=t.parentElement, wr=wrapper.getBoundingClientRect();
     return {height:t.clientHeight,display:getComputedStyle(t).display,headers:Array.from(t.querySelectorAll('th')).map(h=>({text:h.textContent.trim(),width:h.clientWidth,top:h.getBoundingClientRect().top})),wrapper:{left:wr.left,right:wr.right,overflow:getComputedStyle(wrapper).overflowX,tabindex:wrapper.tabIndex,label:wrapper.getAttribute('aria-label')},cells:Array.from(t.querySelectorAll('td')).map(c=>{const s=getComputedStyle(c);return {text:c.textContent.trim(),display:s.display,contentWidth:c.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),height:c.clientHeight};})};
    }));
    for(const t of metrics){assert.ok(t.cells.every(c=>c.contentWidth>=90),'Table text needs readable column width: '+JSON.stringify(t.cells.slice(0,2)));assert.equal(t.display,'table');assert.ok(t.headers.every(h=>h.text&&h.width>0&&h.top>-100),'Column headers must remain visible');assert.ok(t.height<5000,'Table must not become a vertical character column');assert.ok(t.wrapper.left>=-1&&t.wrapper.right<=width+1,'Scroll container must fit viewport');if(width<=600){assert.equal(t.wrapper.overflow,'auto');assert.equal(t.wrapper.tabindex,0);assert.ok(t.wrapper.label);}}
    if(width<=600){const wrapper=tables.first().locator('..');await wrapper.focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.activeElement.scrollLeft>0);const scroll=await wrapper.evaluate(e=>({left:e.scrollLeft,max:e.scrollWidth-e.clientWidth}));assert.ok(scroll.max>0&&scroll.left>0,'Keyboard must reach offscreen columns');await wrapper.evaluate(e=>e.scrollLeft=e.scrollWidth);await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>{const e=document.activeElement;return e.scrollLeft<e.scrollWidth-e.clientWidth-1;});}
    if(width===360&&route===articles[0])await tables.first().locator('..').screenshot({path:path.join(output,'mobile-table.png')});
    return {tables:metrics.length};
   });
   if(!requested||requested==='fellowship')await check(`fellowship containment ${width}`,async()=>{
    await visit(page,'/fate-of-the-fellowship/');
    await page.addStyleTag({content:`@font-face{font-family:'Cinzel Decorative';font-style:normal;font-weight:900;src:url('/__layout-test-font.ttf') format('truetype');font-display:block;}`});
    const loaded=await page.evaluate(async()=>{const faces=await document.fonts.load('900 44.8px "Cinzel Decorative"');return faces.length>0&&faces.every(f=>f.status==='loaded');});assert.ok(loaded,'Actual display font must load');
    const clipped=await page.locator('.fate-ledger').evaluate(ledger=>{
     const failures=[];
     for(const el of ledger.querySelectorAll('h1,h2,h3,p,a,button')){
      if(el.closest('dialog')||!el.clientWidth||!el.clientHeight)continue;
      const r=el.getBoundingClientRect();let p=el.parentElement;
      while(p){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(['hidden','clip'].includes(s.overflowX)&&(r.left<b.left-1||r.right>b.right+1))failures.push({text:el.textContent.trim().slice(0,70),left:r.left,right:r.right,container:b.toJSON()});p=p.parentElement;}
     }
     const title=ledger.querySelector('h1');const range=document.createRange();range.selectNodeContents(title);const box=title.getBoundingClientRect();for(const r of range.getClientRects())if(r.left<box.left-1||r.right>box.right+1)failures.push({text:'Title glyphs overflow their box',box:box.toJSON(),glyph:r.toJSON()});
     return failures;
    });assert.deepEqual(clipped,[],'Text and controls must fit their clipping ancestors');
    if(width===360)await page.screenshot({path:path.join(output,'fellowship-mobile.png')});return {fontLoaded:loaded};
   });
   if(!requested||requested==='menu')await check(`open menu ${width}`,async()=>{
    await visit(page,'/');await page.locator('summary.nav-link').click();const menu=page.locator('.dropdown-menu');await menu.waitFor({state:'visible'});
    const box=await menu.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width,JSON.stringify(box));
    const links=menu.locator('a');assert.equal(await links.count(),5);
    for(const link of await links.all()){const b=await link.boundingBox();assert.ok(b.x>=0&&b.x+b.width<=width,'Menu label clipped');await link.focus();assert.ok(await link.evaluate(e=>document.activeElement===e));}
    if(width===390)await page.screenshot({path:path.join(output,'mobile-menu.png')});
    await page.keyboard.press('Escape');assert.equal(await menu.isVisible(),false,'Escape must dismiss menu');return {box};
   });
  }finally{await ctx.close();}
 }
 if(!requested||requested==='print'){
  const {ctx,page}=await pageFor(816);
  try{await page.emulateMedia({media:'print'});for(const route of articles)await check(`print table contrast ${route}`,async()=>{
   await visit(page,route);const cells=await page.locator('.article-content th,.article-content td,.article-content td strong').evaluateAll(nodes=>nodes.map(e=>({text:e.textContent.trim(),color:getComputedStyle(e).color,fill:getComputedStyle(e).webkitTextFillColor,background:(()=>{let p=e;while(p){const color=getComputedStyle(p).backgroundColor;if(color!=='rgba(0, 0, 0, 0)')return color;p=p.parentElement;}return 'rgb(255, 255, 255)';})()})));
   assert.ok(cells.length>0);for(const cell of cells){assert.equal(cell.color,'rgb(0, 0, 0)','Print text must be black: '+JSON.stringify(cell));assert.equal(cell.fill,'rgb(0, 0, 0)');assert.ok(['rgb(255, 255, 255)','rgb(245, 245, 245)'].includes(cell.background),'Print text needs a light background: '+JSON.stringify(cell));}
   if(route===articles[1])await page.locator('table').first().screenshot({path:path.join(output,'printed-table.png')});return {cells:cells.length};
  });}finally{await ctx.close();}
 }
 assert.deepEqual(report.failures,[],'Visual layout regressions');
}catch(error){process.exitCode=1;console.error(error.message);}finally{process.off('SIGINT',signal);process.off('SIGTERM',signal);await cleanup();}
