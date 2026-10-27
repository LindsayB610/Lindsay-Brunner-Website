import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const ignored = new Set(['.git', 'node_modules', 'public', '.generated', '.cache', '.codex', 'reference_docs', '.netlify']);
export async function fingerprint(root) {
  const hash = createHash('sha256');
  async function walk(dir, relative = '') {
    for (const item of (await fs.readdir(dir, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const rel = path.posix.join(relative, item.name);
      if (ignored.has(item.name) || rel === 'assets/react' || rel === 'static/images/social/working-files' || item.name === '.hugo_build.lock' || item.name === '.DS_Store') continue;
      if (item.isDirectory()) await walk(path.join(dir,item.name),rel);
      else if (item.isFile()) { hash.update(rel); hash.update(await fs.readFile(path.join(dir,item.name))); }
    }
  }
  await walk(root); return hash.digest('hex');
}
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.gif':'image/gif', '.woff2':'font/woff2', '.xml':'application/xml', '.pdf':'application/pdf' };
export async function startPreview({ root=process.cwd(), port=1313, interval=750, build, fingerprint: readFingerprint=fingerprint, shutdownGraceMs=1000, log=console.log }={}) {
  const snapshot = path.join(root,'.generated','optimized-preview');
  let status='building', error='', stopped=false, timer, child, running, closing;
  const runBuild=build || (()=>new Promise((resolve,reject)=>{
    child=spawn(process.platform==='win32'?'npm.cmd':'npm',['run','build'],{cwd:root,stdio:'inherit',detached:process.platform!=='win32'});
    child.once('error',error=>{child=undefined;reject(error);}); child.once('exit',(code,signal)=>{ child=undefined; code===0?resolve():reject(new Error(`Build exited ${code ?? signal}`)); });
  }));
  const server=createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');
    if(status!=='ready') { res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8','Retry-After':'2'}); return res.end(`Optimized preview ${status}. ${error}\nReload after the next successful build.\n`); }
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      let file=path.resolve(snapshot,`.${pathname}`);
      if(file!==snapshot && !file.startsWith(snapshot+path.sep)) {res.writeHead(403);return res.end();}
      let stat=await fs.stat(file); if(stat.isDirectory()) file=path.join(file,'index.html');
      const bytes=await fs.readFile(file); res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}); res.end(req.method==='HEAD'?undefined:bytes);
    }catch {res.writeHead(404);res.end('Not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  let last;
  async function tick() {
    try {
      const before=await readFingerprint(root);
      if(stopped)return;
      if(before!==last) {
        status='building'; error=''; log('Building optimized preview…');
        try {
          await runBuild();
          if(stopped)return;
          const after=await readFingerprint(root);
          if(stopped)return;
          // Build may generate OG inputs. Recheck on next pass; never label a changed source tree fresh.
          if(after!==before) {last=undefined;return;}
          await fs.rm(snapshot,{recursive:true,force:true});
          if(stopped)return;
          await fs.mkdir(path.dirname(snapshot),{recursive:true});
          if(stopped)return;
          await fs.cp(path.join(root,'public'),snapshot,{recursive:true});
          if(stopped)return;
          const copied=await readFingerprint(root);
          if(stopped)return;
          if(copied!==after) {last=undefined;return;}
          last=after; status='ready'; log(`Optimized preview ready at http://127.0.0.1:${server.address().port}`);
        }catch(e) {if(stopped)return;last=before; status='failed';error=e.message;log(`Optimized preview failed: ${error}`);}
      }
    }catch(e) {if(stopped)return;status='failed';error=e.message;log(error);}
    finally {if(!stopped)timer=setTimeout(()=>{running=tick();},interval);}
  }
  running=tick();
  return {server,get status(){return status;},close(){
    if(closing)return closing;
    stopped=true; clearTimeout(timer);
    // Stop accepting requests before waiting for fingerprint/build work to settle.
    const listenerClosed=new Promise(resolve=>server.close(resolve));
    server.closeAllConnections();
    const pid=child?.pid;
    closing=(async()=>{
      if(pid) {
        const target=process.platform==='win32'?pid:-pid;
        const signal=name=>{try {process.kill(target,name);}catch(e){if(e.code!=='ESRCH')throw e;}};
        signal('SIGTERM');
        // Keep the group ID even if its leader exits: descendants can ignore TERM.
        await new Promise(resolve=>setTimeout(resolve,shutdownGraceMs));
        signal('SIGKILL');
      }
      await Promise.all([running,listenerClosed]);
    })();
    return closing;
  }};
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const app=await startPreview({port:Number(process.env.PORT||1313)});
  for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>app.close().then(()=>process.exit(0)));
}
