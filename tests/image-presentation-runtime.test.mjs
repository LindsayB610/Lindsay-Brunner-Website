import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { isProcessRunning } from './helpers/process-lifecycle.mjs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const base=fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');
const require=createRequire(base+'/package.json');
const sharp=require('sharp');
const {chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
let browser;let owned=[];
const {prepareImages,publishImages,transformHtml,validateImages}=await import(base+'/scripts/images/pipeline.mjs');
const root=await fs.mkdtemp('/tmp/image-presentation-');
let checks=0;
try {
 await fs.mkdir(root+'/static');
 await sharp({create:{width:640,height:384,channels:3,background:'red'}}).png().toFile(root+'/static/a.png');
 await sharp(root+'/static/a.png').resize(320).toFile(root+'/static/small.png');
 const f={root,publishDir:root+'/public',config:{requireHeaders:false,budgetExceptions:[],authoredSourceAliases:{}}};
 f.manifest=await prepareImages(f);
 f.config.authoredSourceAliases['/small.png']={target:'/a.png',sourceSha256:f.manifest.images['/small.png'].sourceSha256,targetSha256:f.manifest.images['/a.png'].sourceSha256};
 await publishImages(f);await fs.cp(root+'/static',f.publishDir,{recursive:true});
 browser=await chromium.launch({headless:true});
 const rows=execFileSync('ps',['-axo','pid=,ppid=,command='],{encoding:'utf8'}).trim().split('\n').map(r=>{const m=r.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);return {pid:+m[1],ppid:+m[2],command:m[3]};});
 const ids=new Set([process.pid]);for(let i=0;i<8;i++)for(const r of rows)if(ids.has(r.ppid))ids.add(r.pid);owned=rows.filter(r=>ids.has(r.pid)&&/headless|chromium/i.test(r.command));assert.ok(owned.some(r=>/chromium[_-]headless[_-]shell/.test(r.command)));
 const failures=[];
 for (const dpr of [1, 2]) {
 const page=await browser.newPage({deviceScaleFactor:dpr});
 await page.route('https://lindsaybrunner.com/**',async route=>{const url=new URL(route.request().url());if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html></html>'});const b=await fs.readFile(f.publishDir+url.pathname);await route.fulfill({body:b,contentType:url.pathname.endsWith('.webp')?'image/webp':'image/png'});});
 await page.goto('https://lindsaybrunner.com/');
 const measure=async html=>{await page.setContent(html);await page.locator('img').evaluate(async img=>{img.loading='eager';await img.decode()});return page.locator('img').evaluate(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,naturalWidth:img.naturalWidth,currentSrc:img.currentSrc}));};
 const cases={picture:'<picture><source type="image/png" srcset="/small.png 1x, /a.png 2x"><img src="/a.png"></picture>',alias:'<img src="/small.png">',density:'<img src="/small.png" srcset="/small.png 1x, /a.png 2x">'};
 Object.assign(cases, {
 fallbackSizes: '<picture><source media="(min-width: 600px)" type="image/png" srcset="/small.png 1x, /a.png 2x"><img src="/a.png" sizes="80vw"></picture>',
 media: '<picture><source media="(min-width: 600px)" type="image/png" srcset="/small.png 1x, /a.png 2x"><img src="/a.png"></picture>',
 widthSet: '<img src="/a.png" srcset="/small.png 320w, /a.png 640w" sizes="50vw">',
 defaultWidthSet: '<img src="/a.png" srcset="/small.png 320w, /a.png 640w">',
 pictureWidth: '<picture><source type="image/png" sizes="50vw" srcset="/small.png 320w, /a.png 640w"><img src="/a.png"></picture>',
 });
 for (const [name, html] of Object.entries({...cases})) for (const dims of ['width="100"', 'height="60"', 'width="100" height="100"']) cases[name+':'+dims] = html.replace('<img ', '<img '+dims+' ');
 for (const viewport of [390, 1000]) {
 await page.setViewportSize({width: viewport, height: 800});
 for(const [name,html] of Object.entries(cases)){
  const out=transformHtml({...f,html}).html;
  assert.equal(transformHtml({...f,html:out}).html,out);
  await fs.writeFile(f.publishDir+'/index.html',out);
  await validateImages(f);
  checks++;
  const before=await measure(html), after=await measure(out);
  if(Math.abs(before.width-after.width)>1 || Math.abs(before.height-after.height)>1) failures.push({name, viewport,dpr,before,after});
 }
 }
 await page.close();
 }
 console.log(JSON.stringify({cases:checks, failures},null,2));
 assert.deepEqual(failures,[]);
 for(const html of ['<img src="/small.png" srcset="/small.png 1x, /a.png 1x">','<img src="/a.png" width="50%">','<img src="/a.png" srcset="/small.png 320w, /a.png 2x">']) assert.throws(()=>transformHtml({...f,html}));
 console.log('invalid dimensions, duplicate and mixed densities rejected');
} finally {
 try {
  if(browser) await browser.close();
  for(const r of owned){
   assert.equal(await isProcessRunning(r.pid),false,'live orphan '+r.pid);
  }
  console.log('owned headless processes closed');
 } finally { await fs.rm(root,{recursive:true,force:true}); }
}
