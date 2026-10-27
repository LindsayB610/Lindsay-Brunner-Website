import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "parse5";
import { transformHtml } from "../scripts/images/pipeline.mjs";
import { resolveImage } from "../scripts/images/resolver.mjs";
const require = createRequire(import.meta.url);
const read = (p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8");
const manifest = JSON.parse(await read(".generated/images/runtime-manifest.json"));
async function loadTs(path, mockLifecycle = false) {
  let source = await read(path);
  if (mockLifecycle) source = source.replace('import { useLayoutEffect, useRef, type ImgHTMLAttributes } from "react";',
    'const useRef = () => globalThis.__retainedTest.ref; const useLayoutEffect = effect => { globalThis.__retainedTest.effect = effect; };');
  source = source.replace(/import manifest from [^;]+;/, `const manifest = ${JSON.stringify(manifest)};`);
  let js = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  js = js.replaceAll('"../../scripts/images/resolver.mjs"', JSON.stringify(new URL("../scripts/images/resolver.mjs", import.meta.url).href));
  js = js.replaceAll('"react/jsx-runtime"', JSON.stringify(pathToFileURL(require.resolve("react/jsx-runtime")).href));
  js = js.replaceAll('"react"', JSON.stringify(pathToFileURL(require.resolve("react")).href));
  return import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
}
const { ResponsiveImage, RetainedResponsiveImage } = await loadTs("src/components/responsive-image.tsx");
const { setResponsiveImage } = await loadTs("src/lib/responsive-image.ts");
function elements(html, tag) {
 const found = [];
 function walk(n) { if(n.tagName === tag) found.push(Object.fromEntries(n.attrs.map(a => [a.name,a.value]))); for(const c of n.childNodes || []) walk(c); }
 walk(parse(html)); return found;
}
function fakeImage() {
 const attributes = new Map([["srcset","stale.webp 800w"],["sizes","100vw"],["src","old.jpg"],["fetchpriority","high"]]);
 const sources = [{ removed: false, remove() { this.removed = true; } }];
 const image = { dataset: {}, ownerDocument: {baseURI:"https://lindsaybrunner.com/about/"}, attributes, sources,
  closest: () => ({querySelectorAll: () => sources}), removeAttribute: (name) => attributes.delete(name) };
 for(const name of ["src","srcset","sizes","fetchPriority","width","height","loading"]) Object.defineProperty(image,name,{set(value){attributes.set(name.toLowerCase(),String(value));},get(){return attributes.get(name.toLowerCase());}});
 return image;
}
test("actual React adapter matches finalized Hugo initial image descriptors", async () => {
 for(const [file,src,profile] of [["layouts/index.html","/images/workshop/workshop-shelf.png","homepage-workshop"],["layouts/about/single.html","/images/avatar-color-trans.png","portrait"]]) {
  const source = await read(file);
  const tag = source.match(new RegExp('<img[^>]*src="'+src+'"[^>]*>'))[0];
  const fallback = elements(transformHtml({html:tag,manifest}).html,"img")[0];
  const react = elements(renderToStaticMarkup(React.createElement(ResponsiveImage,{src,profile,alt:"test"})),"img")[0];
  for(const key of ["src","srcset","sizes","loading","fetchpriority","width","height"]) assert.equal(react[key],fallback[key],`${profile}: ${key}`);
 }
});
test("every rotating logo and testimonial source resolves through the real adapter", async () => {
 for(const [file,profile] of [["src/block/single-row-logo-cloud.tsx","logo"],["src/block/contact-section-with-shader.tsx","avatar"]]) {
  const source = await read(file);
  const urls = [...new Set(source.match(/\/images\/(?:logos|testimonials)\/[^"']+/g))];
  assert.ok(urls.length >= 5);
  for(const src of urls) {
   const img = elements(renderToStaticMarkup(React.createElement(ResponsiveImage,{src,profile,alt:""})),"img")[0];
   const expected = resolveImage(manifest,src,{profile});
   assert.equal(img.src,expected.src); assert.equal(img.srcset,expected.webpSrcSet);
   assert.equal(img.loading,profile === "logo" ? "eager" : "lazy");
  }
 }
 assert.ok(JSON.stringify(manifest).length < 30000);
 assert.doesNotMatch(JSON.stringify(manifest),/sourcePath|sha256|sourceSha256|encoder/);
});
test("responsive swap removes stale picture selection and uses the new descriptor", () => {
 const img = fakeImage();
 const d = setResponsiveImage(img,manifest,"/images/logos/parasail.png",{profile:"logo"});
 assert.ok(img.sources.every(s => s.removed)); assert.equal(img.src,d.src); assert.equal(img.srcset,d.webpSrcSet); assert.equal(img.sizes,"126px");
 setResponsiveImage(img,manifest,"/images/logos/okta.svg",{profile:"logo",sizes:"118px"});
 assert.equal(img.srcset,undefined); assert.equal(img.src,"/images/logos/okta.svg"); assert.equal(img.fetchPriority,undefined); assert.equal(img.sizes,"118px");
});
test("dialog adapter clears responsive sources on open and on close", async () => {
 const context = {window:{},document:{baseURI:"https://lindsaybrunner.com/blog/"},location:{origin:"https://lindsaybrunner.com"},URL};
 vm.runInNewContext(await read("static/js/image-dialog.js"),context);
 const img = fakeImage(); context.window.ImageDelivery.openOriginal(img,"/images/original.png");
 assert.equal(img.src,"https://lindsaybrunner.com/images/original.png"); assert.equal(img.srcset,undefined); assert.equal(img.sizes,undefined); assert.ok(img.sources[0].removed);
 context.window.ImageDelivery.clearImage(img); assert.equal(img.src,undefined);
 assert.throws(()=>context.window.ImageDelivery.openOriginal(img,"https://external.example/image.png"),/local/);
});
test("zoom shortcode does no original assignment until click; close and reopen work", async () => {
 const source = await read("layouts/shortcodes/zoomable-diagram.html");
 const deferred = elements(source,"img").find(i=>i["data-image-deferred"]);
 assert.ok(deferred); assert.match(deferred.src,/^data:image\/gif;base64,/); assert.equal(deferred.srcset,undefined);
 const listeners = {}; const image = {dataset:{originalSrc:"/images/full.png"}};
 const dialog = {querySelector: s=>s === "[data-original-src]" ? image : {addEventListener(){}},addEventListener:(name,fn)=>listeners[name]=fn,showModal(){this.open=true;},close(){this.open=false;listeners.close();}};
 const trigger = {addEventListener:(name,fn)=>listeners["trigger:"+name]=fn};
 let requests = []; let clears=0;
 const context = {document:{getElementById:()=>dialog,querySelector:()=>trigger},window:{ImageDelivery:{openOriginal:(img,src)=>requests.push(src),clearImage:()=>clears++}}};
 vm.runInNewContext(source.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 assert.deepEqual(requests,[]); listeners["trigger:click"](); assert.deepEqual(requests,["/images/full.png"]); assert.equal(dialog.open,true);
 dialog.close(); assert.equal(clears,1); listeners["trigger:click"](); assert.equal(requests.length,2);
});
test("tracker dialogs stay empty initially and route swaps through interaction adapter", async () => {
 for(const name of ["nemesis","fate-of-the-fellowship"]) {
  const source = await read(`layouts/${name}/list.html`);
  const deferred = elements(source,"img").filter(i=>i["data-image-deferred"]);
  assert.equal(deferred.length,1); assert.match(deferred[0].src,/^data:image\/gif;base64,/); assert.equal(deferred[0].srcset,undefined);
  assert.match(source,/ImageDelivery\.openOriginal\(dialogImage, trigger\.dataset\./);
  assert.match(source,/ImageDelivery\.clearImage\(dialogImage\)/);
  assert.doesNotMatch(source,/dialogImage\.src\s*=/);
 }
});

test("tracker rendered buttons retain the exact original-source trigger attribute", async () => {
 for (const [route, key] of [["nemesis", "nemesis"], ["fate-of-the-fellowship", "fate"]]) {
  const html = await read(`public/${route}/index.html`);
  const buttons = elements(html, "button").filter(b => b.class?.split(" ").includes(`${key}-log-photo-trigger`));
  assert.ok(buttons.length > 0, `${key}: rendered photo buttons missing`);
  for (const button of buttons) {
   assert.match(button[`data-${key}-lightbox-src`] ?? "", /^\/images\//, `${key}: missing original-source trigger`);
   assert.equal(button.src, undefined, `${key}: source belongs in data attribute, not button src`);
   assert.ok(button["aria-label"]);
  }
 }
});

test("retained adapter adopts only the matching fallback descriptor", () => {
 const props = {src:"/images/avatar-color-trans.png",profile:"portrait",alt:"Lindsay Brunner",className:"aspect-square w-full object-contain"};
 const attrs = elements(renderToStaticMarkup(React.createElement(ResponsiveImage,props)),"img")[0];
 const fallbackImage = {getAttribute:key=>attrs[key] ?? null};
 const retained = renderToStaticMarkup(React.createElement(RetainedResponsiveImage,{...props,fallbackImage}));
 assert.equal(elements(retained,"img").length,0,"must not create a second image");
 assert.equal(elements(retained,"span")[0]["data-image-react-host"],"retained");
 for (const fallback of [null, {getAttribute:key=>key === "srcset" ? "stale.webp 320w" : attrs[key] ?? null}]) {
  const output=renderToStaticMarkup(React.createElement(RetainedResponsiveImage,{...props,fallbackImage:fallback}));
  assert.equal(elements(output,"img")[0].src,attrs.src,"missing/stale fallback uses normal resolver");
 }
});

test("retained image effect survives StrictMode replay without source writes", async () => {
 const {RetainedResponsiveImage: Retained}=await loadTs("src/components/responsive-image.tsx",true);
 const props={src:"/images/avatar-color-trans.png",profile:"portrait",alt:"Lindsay Brunner",className:"aspect-square w-full object-contain"};
 const attrs=elements(renderToStaticMarkup(React.createElement(ResponsiveImage,props)),"img")[0];
 const image={getAttribute:key=>attrs[key]??null,parentNode:null};
 for(const key of ["src","srcset","sizes","loading","fetchPriority"]) Object.defineProperty(image,key,{set(){assert.fail(`retention rewrote ${key}`);}});
 const host={child:null,appendChild(node){this.child=node;node.parentNode=this;},removeChild(node){assert.equal(this.child,node);this.child=null;node.parentNode=null;}};
 globalThis.__retainedTest={ref:{current:host},effect:null};
 try {
  const element=Retained({...props,fallbackImage:image});element.type(element.props);
  const effect=globalThis.__retainedTest.effect;
  const cleanup=effect();assert.equal(host.child,image);assert.equal(image.alt,props.alt);assert.equal(image.className,props.className);
  cleanup();assert.equal(host.child,null);
  const cleanupReplay=effect();assert.equal(host.child,image);
  const otherHost={};image.parentNode=otherHost;cleanupReplay();assert.equal(image.parentNode,otherHost,"old cleanup must not detach another owner's node");
 } finally {delete globalThis.__retainedTest;}
});
