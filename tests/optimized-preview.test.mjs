import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startPreview, fingerprint } from '../scripts/preview-optimized.mjs';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function linuxProcessIsRunning(stat) {
 const state=stat.slice(stat.lastIndexOf(')')+1).trim().split(/\s+/)[0];
 assert.match(state,/^[RSDZTWtXxKPI]$/, 'Unrecognized Linux process state');
 return !['Z','X','x'].includes(state);
}
test('cleanup distinguishes terminated processes from live container children',()=>{
 for(const state of ['Z','X','x']) assert.equal(linuxProcessIsRunning(`123 (test child) ${state} 1 2 3`),false);
 for(const state of ['R','S','D','T','t','I']) assert.equal(linuxProcessIsRunning(`123 (test child) ${state} 1 2 3`),true);
 assert.throws(()=>linuxProcessIsRunning('invalid'));
});
async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await wait(20);}throw Error('Timed out');}
test('optimized preview serializes edits, additions, deletions, failures and serves completed output',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'image-preview-'));let active=0,max=0,builds=0,fail=false,hold=false;
 await fs.mkdir(path.join(root,'static'));await fs.writeFile(path.join(root,'static','image.txt'),'one');
 const app=await startPreview({root,port:0,interval:20,log:()=>{},build:async()=>{active++;max=Math.max(max,active);builds++;try{while(hold)await wait(10);if(fail)throw Error('fixture failure');await fs.mkdir(path.join(root,'public'),{recursive:true});let names=await fs.readdir(path.join(root,'static'));await fs.writeFile(path.join(root,'public','index.html'),await Promise.all(names.map(n=>fs.readFile(path.join(root,'static',n),'utf8'))).then(v=>v.join(',')));}finally{active--;}}});
 const url=`http://127.0.0.1:${app.server.address().port}`;
 try{
  await until(()=>app.status==='ready');assert.equal(await (await fetch(url)).text(),'one');
  hold=true;await fs.writeFile(path.join(root,'static','image.txt'),'two');await until(()=>active===1);assert.equal((await fetch(url)).status,503);
  await fs.writeFile(path.join(root,'static','added.txt'),'new');hold=false;
  await until(async()=>app.status==='ready'&&(await (await fetch(url)).text()).includes('new'));assert.equal(max,1);
  await fs.rm(path.join(root,'static','added.txt'));await until(async()=>app.status==='ready'&&(await (await fetch(url)).text())==='two');
  fail=true;await fs.writeFile(path.join(root,'static','image.txt'),'bad');await until(()=>app.status==='failed');assert.equal((await fetch(url)).status,503);const count=builds;await wait(100);assert.equal(builds,count);
  fail=false;await fs.writeFile(path.join(root,'static','image.txt'),'fixed');await until(()=>app.status==='ready');assert.equal(await (await fetch(url)).text(),'fixed');
 }finally{hold=false;await app.close();await fs.rm(root,{recursive:true,force:true});}
});


test('edit/revert after a discarded build retries without another edit',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'image-preview-revert-'));
 const source=path.join(root,'source.txt');let builds=0,revert=false;
 await fs.writeFile(source,'one');
 const app=await startPreview({root,port:0,interval:20,log:()=>{},fingerprint:async root=>{
  const value=await fingerprint(root);
  if(revert){revert=false;await fs.writeFile(source,'two');}
  return value;
 },build:async()=>{
  builds++;await fs.mkdir(path.join(root,'public'),{recursive:true});
  await fs.writeFile(path.join(root,'public','index.html'),await fs.readFile(source));
  if(builds===2){await fs.writeFile(source,'three');revert=true;}
 }});
 try{
  await until(()=>app.status==='ready');await fs.writeFile(source,'two');
  await until(()=>builds>=3&&app.status==='ready');
  assert.equal(await (await fetch(`http://127.0.0.1:${app.server.address().port}`)).text(),'two');
 }finally{await app.close();await fs.rm(root,{recursive:true,force:true});}
});

test('close during initial fingerprint never starts a build and closes HTTP immediately',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'image-preview-cancel-'));
 let release,entered,builds=0;
 const gate=new Promise(r=>{release=r;});const started=new Promise(r=>{entered=r;});
 const app=await startPreview({root,port:0,log:()=>{},fingerprint:async()=>{entered();await gate;return 'source';},build:async()=>{builds++;}});
 try{
  await Promise.race([started,wait(500).then(()=>{throw Error('Fingerprint hook was not entered');})]);
  const closing=app.close();assert.equal(app.server.listening,false);
  release();await closing;assert.equal(builds,0);
 }finally{release();await app.close();await fs.rm(root,{recursive:true,force:true});}
});

for(const parentExits of [false,true])test(`close kills TERM-resistant descendants when parent ${parentExits?'exits':'ignores TERM'}`,{skip:process.platform==='win32',timeout:10000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'image-preview-process-'));
 const bin=path.join(root,'bin'),state=path.join(root,'.cache');
 await fs.mkdir(bin);await fs.mkdir(state);
 const script=`#!${process.execPath}
const fs=require('node:fs');
const {spawn}=require('node:child_process');
process.on('SIGTERM',()=>{${parentExits?'process.exit(0);':''}});
fs.writeFileSync('.cache/parent.pid',String(process.pid));
spawn(process.execPath,['-e',\`process.on('SIGTERM',()=>{});require('node:fs').writeFileSync('.cache/descendant.pid',String(process.pid));require('node:fs').writeFileSync('.cache/descendant-heartbeat','started');setInterval(()=>require('node:fs').writeFileSync('.cache/descendant-heartbeat',String(Date.now())),20)\`],{stdio:'inherit'});
setInterval(()=>{},1000);
`;
 await fs.writeFile(path.join(bin,'npm'),script,{mode:0o755});
 const previous=process.env.PATH;process.env.PATH=bin+path.delimiter+previous;
 let app,pid,descendant;
 const alive=async id=>{
  try {
   process.kill(id,0);
   if(process.platform==='linux') {
    // Container PID 1 may retain an exited grandchild as a zombie. It cannot
    // execute or be killed again; distinguish it from a live orphan.
    const stat=await fs.readFile(`/proc/${id}/stat`,'utf8');
    const running=linuxProcessIsRunning(stat);
    if(!running) console.log(`Confirmed terminated container child ${id}: ${stat.slice(stat.lastIndexOf(')')+1).trim().split(/\s+/)[0]}`);
    return running;
   }
   return true;
  }catch(e){if(e.code==='ESRCH'||e.code==='ENOENT')return false;throw e;}
 };
 try{
  app=await startPreview({root,port:0,interval:20,log:()=>{},shutdownGraceMs:100});
  await until(async()=>{try{pid=Number(await fs.readFile(path.join(state,'parent.pid'),'utf8'));descendant=Number(await fs.readFile(path.join(state,'descendant.pid'),'utf8'));return true;}catch{return false;}});
  const closing=app.close();assert.equal(app.server.listening,false);
  await Promise.race([closing,wait(2000).then(()=>{throw Error('Shutdown deadline exceeded');})]);
  await until(async()=>!(await alive(pid))&&!(await alive(descendant)));
  assert.equal(await alive(pid),false);assert.equal(await alive(descendant),false);
  const heartbeat=path.join(state,'descendant-heartbeat');
  const stopped=await fs.readFile(heartbeat,'utf8');await wait(100);
  assert.equal(await fs.readFile(heartbeat,'utf8'),stopped,'Descendant must stop executing after preview closes');
 }finally{
  process.env.PATH=previous;
  if(pid){try{process.kill(-pid,'SIGKILL');}catch{}}
  if(app)await app.close();await fs.rm(root,{recursive:true,force:true});
 }
});


test('edit/revert during snapshot copying retries without publishing stale output',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'image-preview-copy-'));
 const source=path.join(root,'source.txt');let builds=0,checks=0;
 await fs.writeFile(source,'one');
 const app=await startPreview({root,port:0,interval:20,log:()=>{},fingerprint:async root=>{
  // The second check after build 2 is the post-copy freshness check.
  const revert=builds===2&&++checks===2;
  if(revert)await fs.writeFile(source,'three');
  const value=await fingerprint(root);
  if(revert)await fs.writeFile(source,'two');
  return value;
 },build:async()=>{
  builds++;await fs.mkdir(path.join(root,'public'),{recursive:true});
  await fs.writeFile(path.join(root,'public','index.html'),await fs.readFile(source));
 }});
 try{
  await until(()=>app.status==='ready');await fs.writeFile(source,'two');
  await until(()=>builds>=3&&app.status==='ready');
  assert.equal(await (await fetch(`http://127.0.0.1:${app.server.address().port}`)).text(),'two');
 }finally{await app.close();await fs.rm(root,{recursive:true,force:true});}
});
