import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { prepareImages, publishImages, transformHtml, validateImages } from '../scripts/images/pipeline.mjs';
async function fixture(t, noise = false) {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'image-review-'));
 t.after(() => fs.rm(root, {recursive:true,force:true}));
 await fs.mkdir(path.join(root,'static'),{recursive:true});
 if(noise) {
  let seed=123456; const bytes=Buffer.alloc(640*640*3);
  for(let i=0;i<bytes.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;bytes[i]=seed>>>24;}
  await sharp(bytes,{raw:{width:640,height:640,channels:3}}).jpeg({quality:95}).toFile(path.join(root,'static/a.jpg'));
 } else await sharp({create:{width:1000,height:600,channels:3,background:'red'}}).png().toFile(path.join(root,'static/a.png'));
 const f={root,publishDir:path.join(root,'public'), config:{requireHeaders:false,budgetExceptions:[]}};
 const manifest=await prepareImages(f);
 await publishImages({...f,manifest});
 await fs.cp(path.join(root,'static'),f.publishDir,{recursive:true});
 return {...f,manifest};
}
async function gate(f,html){await fs.writeFile(path.join(f.publishDir,'index.html'),html);return validateImages(f);}
test('srcset-only images optimize and cannot bypass final gate',async t=>{
 const f=await fixture(t); const html='<img srcset="/a.png 1000w">';
 await assert.rejects(gate(f,html),/Unfinalized/);
 const out=transformHtml({...f,html}).html;
 assert.match(out,/srcset="\/_img/); assert.ok((await gate(f,out)).budgetedCandidates>0);
 assert.equal(transformHtml({...f,html:out}).html,out);
});
test('forged and mismatched completion markers fail transform and gate',async t=>{
 const f=await fixture(t);
 f.manifest.images['/b.png']={...f.manifest.images['/a.png'],sourceUrl:'/b.png',variants:[]};
 for(const html of ['<img src="/a.png" data-image-source="/missing.png">','<img src="/a.png" data-image-source="/a.png">',`<img src="${f.manifest.images['/a.png'].variants[0].url}" data-image-source="/b.png" data-image-profile="body">`]){
  assert.throws(()=>transformHtml({...f,html}),/marker|finalized|membership/i);
 }
 delete f.manifest.images['/b.png'];
 await assert.rejects(gate(f,'<img src="/a.png" data-image-source="/missing.png">'),/marker|finalized|membership/i);
});
test('pictures and authored sets optimize while retaining sizes/media/type',async t=>{
 const f=await fixture(t);
 const out=transformHtml({...f,html:'<picture><source media="(min-width: 600px)" sizes="50vw" type="image/png" srcset="/a.png 1000w"><img src="/a.png" sizes="80vw" srcset="/a.png 1000w"></picture>'}).html;
 assert.match(out,/type="image\/png"/);assert.match(out,/media="\(min-width: 600px\)"/);assert.match(out,/sizes="50vw"/);assert.match(out,/sizes="80vw"/);
 assert.doesNotMatch(out,/(?:src|srcset)="\/a.png/);
 assert.ok((await gate(f,out)).budgetedCandidates>0);
 assert.equal(transformHtml({...f,html:out}).html,out);
});
test('thumbnail WebP candidates exceed thumbnail budget in img and picture source',async t=>{
 const f=await fixture(t,true);
 const variants=f.manifest.images['/a.jpg'].variants.filter(v=>v.format==='webp'&&v.width===640);
 assert.ok(variants[0].bytes>100000&&variants[0].bytes<400000);
 for(const html of ['<img src="/a.jpg" data-image-profile="thumbnail">','<picture><source type="image/webp" srcset="/a.jpg 640w"><img src="/a.jpg" data-image-profile="thumbnail"></picture>']) {
  const out=transformHtml({...f,html}).html;
  await assert.rejects(gate(f,out),/budget exceeded/);
 }
});
test('real Hugo publishDate omits unpublished bundle derivatives and validates remaining site',async t=>{
 const f=await fixture(t);const bundle=path.join(f.root,'content/blog/future');
 await fs.mkdir(bundle,{recursive:true});await fs.mkdir(path.join(f.root,'layouts/_default'),{recursive:true});
 await fs.writeFile(path.join(f.root,'hugo.toml'),'baseURL="https://lindsaybrunner.com"\n[permalinks]\nblog="/blog/:year-:month-:day/:slug/"\n');
 await fs.writeFile(path.join(f.root,'layouts/index.html'),'<html><body>Visible</body></html>');
 await fs.writeFile(path.join(f.root,'layouts/_default/single.html'),'<html><body>{{ .Content }}</body></html>');
 await fs.writeFile(path.join(bundle,'index.md'),'---\ntitle: Future\ndate: 2026-01-01\npublishDate: 2099-01-01\n---\n');
 await fs.copyFile(path.join(f.root,'static/a.png'),path.join(bundle,'private.png'));
 const manifest=await prepareImages(f);const entry=manifest.images['/blog/2026-01-01/future/private.png'];
 assert.equal(entry.variants.length,0);assert.equal(entry.reason,'unpublished bundle');
 const expired=path.join(f.root,'content/blog/expired');await fs.mkdir(expired,{recursive:true});
 await fs.writeFile(path.join(expired,'index.md'),'---\ntitle: Expired\ndate: 2026-01-01\nexpiryDate: 2026-01-02\n---\n');
 await fs.copyFile(path.join(f.root,'static/a.png'),path.join(expired,'private.png'));
 const refreshed=await prepareImages(f);
 assert.equal(refreshed.images['/blog/2026-01-01/expired/private.png'].variants.length,0);
 Object.assign(manifest,refreshed);
 execFileSync('hugo',['--source',f.root,'--destination',f.publishDir,'--cleanDestinationDir'],{stdio:'pipe'});
 await publishImages({...f,manifest});await validateImages({...f,manifest});
 await assert.rejects(fs.stat(path.join(f.publishDir,'_img/blog/2026-01-01/future/private.png')),/ENOENT/);
});
test('unsupported inherited visibility fails explicitly',async t=>{
 const f=await fixture(t);const bundle=path.join(f.root,'content/blog/future');
 await fs.mkdir(bundle,{recursive:true});
 await fs.writeFile(path.join(f.root,'content/blog/_index.md'),'---\ncascade:\n  draft: true\n---\n');
 await fs.writeFile(path.join(bundle,'index.md'),'---\ndate: 2026-01-01\n---\n');
 await fs.copyFile(path.join(f.root,'static/a.png'),path.join(bundle,'private.png'));
 await assert.rejects(prepareImages(f),/Unsupported.*(?:cascade|inherited)/i);
});

test('source-element budgets are checked even when img candidates are small', async t => {
 const f=await fixture(t,true);
 const e=f.manifest.images['/a.jpg'];
 const small=e.variants.find(v=>v.format==='webp'&&v.width===320);
 const large=e.variants.find(v=>v.format==='webp'&&v.width===640);
 const html=`<picture><source type="image/webp" srcset="${large.url} 640w" data-image-source="/a.jpg" data-image-profile="thumbnail"><img src="${small.url}" data-image-source="/a.jpg" data-image-profile="thumbnail"></picture>`;
 await assert.rejects(gate(f,html),/budget exceeded/);
});
test('density sets preserve density; mixed art and unsupported type fail explicitly',async t=>{
 const f=await fixture(t);
 const out=transformHtml({...f,html:'<img src="/a.png" srcset="/a.png 1x, /a.png 2x">'}).html;
 assert.match(out,/1x, [^"]+ 2x/);assert.doesNotMatch(out, /srcset="\/a.png/);
 assert.equal(transformHtml({...f,html:out}).html,out);
 await gate(f,out);
 f.manifest.images['/b.png']={...f.manifest.images['/a.png'],sourceUrl:'/b.png',variants:[]};
 assert.throws(()=>transformHtml({...f,html:'<img src="/a.png" srcset="/b.png 1000w">'}),/Unsupported art direction.*<img>/);
 assert.throws(()=>transformHtml({...f,html:'<picture><source type="image/avif" srcset="/a.png 1000w"><img src="/a.png"></picture>'}),/Unsupported picture format/);
});

test('documented dialog placeholder passes but cannot hide srcset fetches',async t=>{
 const f=await fixture(t);
 const placeholder='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///w==';
 const html=`<img src="${placeholder}">`;
 await gate(f,transformHtml({...f,html}).html);
 const bad=`<img src="${placeholder}" srcset="/a.png 1000w">`;
 assert.throws(()=>transformHtml({...f,html:bad}),/Placeholder/);
 await assert.rejects(gate(f,bad),/Placeholder/);
});

test('matching fallback and selected candidate URL cannot bypass thumbnail budget',async t=>{
 const f=await fixture(t,true);
 const v=f.manifest.images['/a.jpg'].variants.find(v=>v.format==='jpeg'&&v.width===640);
 assert.ok(v.bytes>100000);
 await assert.rejects(gate(f,`<img src="${v.url}" srcset="${v.url} 640w" data-image-source="/a.jpg" data-image-profile="thumbnail">`),/budget exceeded/);
});

test('explicit same-art resize pairs regenerate from canonical art',async t=>{
 const f=await fixture(t);
 await sharp(path.join(f.root,'static/a.png')).resize(500).toFile(path.join(f.root,'static/a-small.png'));
 f.manifest=await prepareImages(f);await publishImages(f);await fs.cp(path.join(f.root,'static'),f.publishDir,{recursive:true});
 const html='<img src="/a.png" srcset="/a-small.png 500w, /a.png 1000w" sizes="80vw">';
 assert.throws(()=>transformHtml({...f,html}),/Unsupported art direction/);
 const out=transformHtml({...f,html,config:{...f.config,authoredSourceAliases:{'/a-small.png':'/a.png'}}}).html;
 assert.doesNotMatch(out,/a-small/);assert.match(out,/sizes="80vw"/);
 await gate(f,out);
});
