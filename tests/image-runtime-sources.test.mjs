import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { inspectRuntimeSources, discoverRuntimeSources } from '../scripts/images/runtime-sources.mjs';
import { prepareImages, pickBrowserManifest } from '../scripts/images/pipeline.mjs';
const require=createRequire(import.meta.url);
const read=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');
const manifest={images:{'/images/unrelated/new.png':{}}};

test('static literals, expression literals and named import aliases are automatic',()=>{
 for(const src of ['"/images/unrelated/new.png"','{"/images/unrelated/new.png"}','{`/images/unrelated/new.png`}']) {
  const result=inspectRuntimeSources(`import {ResponsiveImage as Photo} from './responsive-image'; const x=<Photo src=${src} />;`,'src/new.tsx',manifest);
  assert.deepEqual(result.failures,[]); assert.deepEqual([...result.sources],['/images/unrelated/new.png']);
 }
});
test('missing, unsupported, unresolved, spread and absent sources fail with location',()=>{
 for(const props of ['src="/missing.png"','src={next}','src="https://elsewhere/a.png"','src="relative.png"','src="/images/unrelated/new.png?resize=20"','src="/images/unrelated/new.png" {...props}','']) {
  const result=inspectRuntimeSources(`const x=<ResponsiveImage ${props} />;`,'src/new.tsx',manifest);
  assert.ok(result.failures.length,props); assert.match(result.failures[0],/^src\/new.tsx:1:\d+:/);
 }
});
test('unsupported namespace/default adapter imports fail explicitly',()=>{
 for(const source of ["import * as Images from './responsive-image';", "import Photo from './responsive-image';"]) assert.ok(inspectRuntimeSources(source,'src/new.tsx',manifest).failures.length);
});
test('registered arrays validate literal members; arbitrary dynamics in same file fail',()=>{
 const file='src/block/single-row-logo-cloud.tsx';
 const good='const LOGOS=[{src:"/images/unrelated/new.png"}]; const x=<ResponsiveImage src={logo.src} />;';
 assert.deepEqual(inspectRuntimeSources(good,file,manifest).failures,[]);
 for(const source of [good.replace('logo.src','other.src'),good.replace('"/images/unrelated/new.png"','next'),good.replace('{src:', '{...other,src:'),good.replace('/images/unrelated/new.png','/missing.png')]) assert.ok(inspectRuntimeSources(source,file,manifest).failures.length);
});
test('new unrelated raster and authored component render through real lean-manifest adapter',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'runtime-discovery-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'static/images/unrelated'),{recursive:true}); await fs.mkdir(path.join(root,'src'));
 await sharp({create:{width:320,height:180,channels:3,background:'#aabbcc'}}).png().toFile(path.join(root,'static/images/unrelated/new.png'));
 const authored='export function NewImage() { return <ResponsiveImage src="/images/unrelated/new.png" alt="New ordinary image" />; }';
 await fs.writeFile(path.join(root,'src/new.tsx'),authored);
 const full=await prepareImages({root});
 const lean=JSON.parse(await fs.readFile(path.join(root,'.generated/images/runtime-manifest.json'),'utf8'));
 assert.deepEqual(lean,pickBrowserManifest(full,await discoverRuntimeSources(root,full)));
 assert.deepEqual(Object.keys(lean.images),['/images/unrelated/new.png']);
 assert.doesNotMatch(JSON.stringify(lean),/sourcePath|sha256|sourceSha256|encoder/);
 let code=(await read('src/components/responsive-image.tsx')).replace(/import manifest from [^;]+;/,`const manifest=${JSON.stringify(lean)};`)+'\n'+authored;
 code=ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const name of ['react','react/jsx-runtime']) code=code.replaceAll(JSON.stringify(name),JSON.stringify(pathToFileURL(require.resolve(name)).href));
 code=code.replaceAll('"../../scripts/images/resolver.mjs"',JSON.stringify(new URL('../scripts/images/resolver.mjs',import.meta.url).href));
 const {NewImage}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const html=renderToStaticMarkup(React.createElement(NewImage));
 assert.match(html,/data-image-source="\/images\/unrelated\/new.png"/); assert.match(html,/srcSet="\/_img\//);
 await fs.writeFile(path.join(root,'src/new.tsx'),authored.replace('new.png','missing.png'));
 await assert.rejects(discoverRuntimeSources(root,full),/src\/new.tsx:1:.*Missing runtime image/);
 await assert.rejects(prepareImages({root}),/src\/new.tsx:1:.*Missing runtime image/);
 await fs.writeFile(path.join(root,'src/new.tsx'),authored.replace('src="/images/unrelated/new.png"','src={unresolved}'));
 await assert.rejects(prepareImages({root}),/src\/new.tsx:1:.*Unresolved runtime image/);
});

test('browser resolver bundle excludes build-only policy and alias metadata',async()=>{
 const {build}=await import('vite');
 const result=await build({configFile:false,publicDir:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry:new URL('../scripts/images/resolver.mjs',import.meta.url).pathname,formats:['es'],fileName:'resolver'}}});
 const outputs=Array.isArray(result)?result:[result];
 const js=outputs.flatMap(r=>r.output).filter(o=>o.type==='chunk').map(o=>o.code).join('\n');
 assert.match(js,/lindsaybrunner\.com/);
 assert.doesNotMatch(js,/sourceSha256|targetSha256|sourcePath|authoredSourceAliases|runtime-sources|photoSources|concurrency/);
});
