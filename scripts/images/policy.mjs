// Deliberately bounded source policy, not general JavaScript data-flow analysis.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parse } from 'parse5';
import { exceptions } from './policy-exceptions.mjs';

const normalize = text => text.replace(/\s+/g, ' ').trim();
const literal = node => node && (ts.isStringLiteralLike(node) ? node.text : undefined);
const memberName = node => node && ts.isComputedPropertyName(node) ? literal(node.expression) : literal(node) ?? node?.getText();
function property(node) {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (ts.isElementAccessExpression(node)) return literal(node.argumentExpression);
}
const imageStyle = key => /^(background|background-image|mask|mask-image|-?webkit-mask|-?webkit-mask-image|list-style|list-style-image|border-image|border-image-source|content)$/i.test((key ?? '').replace(/[A-Z]/g, c => '-'+c.toLowerCase()));
// Grouping does not change the known receiver; do not infer aliases or data flow.
function ungroup(node) {
  while (node && ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
}
const reflectiveReceiver = node => {
  const receiver = ungroup(node);
  return receiver && ts.isIdentifier(receiver) ? receiver.text : undefined;
};
const reflectiveNames = {Object: ['assign','defineProperty','defineProperties'], Reflect: ['set','defineProperty']};
const reflective = node => (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) && reflectiveNames[reflectiveReceiver(node.expression)]?.includes(property(node));
function symbol(node) {
  for (let p = node.parent; p; p = p.parent) {
    if ((ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) && p.name) return p.name.getText();
    if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && ts.isVariableDeclaration(p.parent)) return p.parent.name.getText();
  }
  return '<top-level>';
}
export function inspectScript(source, file, approved = exceptions) {
  const tree = ts.createSourceFile(file.endsWith('.tsx') ? file : file+'.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const failures = []; const used = new Set();
  const fail = (node, kind, detail) => {
    const code = normalize(node.getText(tree));
    const index = approved.findIndex(e => e.file === file && e.symbol === symbol(node) && e.kind === kind && normalize(e.code) === code);
    if (index >= 0 && !used.has(index)) { used.add(index); return; }
    const pos = tree.getLineAndCharacterOfPosition(node.getStart(tree));
    failures.push({file, line:pos.line+1, column:pos.character+1, kind, symbol:symbol(node), code, message:detail});
  };
  for (const d of tree.parseDiagnostics) {
    const p = tree.getLineAndCharacterOfPosition(d.start ?? 0);
    failures.push({file,line:p.line+1,column:p.character+1,kind:'parse',message:ts.flattenDiagnosticMessageText(d.messageText, ' ')});
  }
  const visit = node => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ['img','source','picture'].includes(node.tagName.getText(tree))) fail(node, 'raw-jsx-image', 'Use ResponsiveImage; raw image/source/picture JSX requires an exact reviewed adapter.');
    if ((ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) && imageStyle(memberName(node.name)) && ((memberName(node.name)) !== 'content' || (ts.isJsxExpression(node.parent.parent) && ts.isJsxAttribute(node.parent.parent.parent) && node.parent.parent.parent.name.getText(tree) === 'style')) && (ts.isShorthandPropertyAssignment(node) || literal(node.initializer) === undefined)) fail(node,'css-image','Dynamic CSS image properties require explicit review.');
    if (ts.isJsxAttribute(node) && node.name.getText(tree) === 'dangerouslySetInnerHTML') fail(node,'html-injection','Executable HTML injection is unsupported.');
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
      const key = property(node.left);
      if (/^(src|srcset)$/i.test(key ?? '')) fail(node,'source-write','Use the registered responsive/original adapter.');
      if (ts.isElementAccessExpression(node.left) && key === undefined) fail(node,'computed-write','Dynamic property writes require explicit review.');
      if ((['innerHTML','outerHTML','cssText'].includes(key) || imageStyle(key)) && literal(node.right) !== '') fail(node,'html-injection','Dynamic HTML/CSS injection is unsupported.');
    }
    if (ts.isCallExpression(node)) {
      const method = property(node.expression) ?? (ts.isIdentifier(node.expression) ? node.expression.text : undefined);
      if (method === 'createElement' && (literal(node.arguments[0]) === undefined || /^(img|source|picture)$/i.test(literal(node.arguments[0])))) fail(node,'image-construction','Dynamic/image createElement requires an adapter.');
      if (method === 'setAttributeNS') fail(node,'source-write','Namespaced attribute writes require explicit review.');
      if (method === 'setAttribute' && (literal(node.arguments[0]) === undefined || /^(src|srcset|style|on\w+)$/i.test(literal(node.arguments[0])))) fail(node,'source-write','Dynamic/source attributes require an adapter.');
      if (['insertAdjacentHTML','write','writeln','eval','Function','parseFromString'].includes(method)) fail(node,'html-injection','Dynamic markup/code is unsupported.');
      if (method === 'setProperty' && (literal(node.arguments[0]) === undefined || imageStyle(literal(node.arguments[0])))) fail(node,'css-image','Image-bearing or unresolved CSSOM properties require explicit review.');
      if (reflective(node.expression)) fail(node,'computed-write','Object.assign can hide image source writes; use explicit properties.');
      if (ts.isElementAccessExpression(node.expression) && property(node.expression) === undefined) fail(node,'computed-call','Dynamic method calls require explicit review.');
    }
    // Reject capability extraction, including destructuring, instead of attempting alias flow.
    if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) && ['createElement','setAttribute','setAttributeNS','insertAdjacentHTML','parseFromString','write','writeln','setProperty'].includes(property(node)) && !(ts.isCallExpression(node.parent) && node.parent.expression === node)) fail(node,'capability-alias','Aliased DOM construction/mutation is unsupported.');
    if (reflective(node) && !(ts.isCallExpression(node.parent) && node.parent.expression === node)) fail(node,'capability-alias','Aliased reflective mutation is unsupported.');
    if (ts.isBindingElement(node) && ['createElement','setAttribute','setAttributeNS','insertAdjacentHTML','parseFromString','Image','setProperty'].includes(memberName(node.propertyName ?? node.name))) fail(node,'capability-alias','Destructured DOM mutation is unsupported.');
    if (ts.isBindingElement(node) && ts.isVariableDeclaration(node.parent.parent) && reflectiveNames[reflectiveReceiver(node.parent.parent.initializer)]?.includes(memberName(node.propertyName ?? node.name))) fail(node,'capability-alias','Destructured reflective mutation is unsupported.');
    if (ts.isIdentifier(node) && ['Image','Function','eval'].includes(node.text)) fail(node,'image-construction','Image/Function constructors and aliases are unsupported.');
    if (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) {
      const text = node.getText(tree);
      if (/<\s*(img|picture|source)\b/i.test(text)) fail(node,'html-injection','Image markup strings require an adapter.');
      failures.push(...inspectCss(text,file));
    }
    ts.forEachChild(node,visit);
  };
  visit(tree); return failures;
}

export function inspectCss(source, file) {
  const failures=[];
  // Escapes/comments cannot split tokens to smuggle a network image through this bounded grammar.
  const clean = source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\\([0-9a-f]{1,6})\s?/gi,(_,h)=>String.fromCodePoint(parseInt(h,16))).replace(/\\([^\n\r])/g,'$1');
  for (const match of clean.matchAll(/url\s*\(\s*(['"]?)(.*?)\1\s*\)|(?:-webkit-)?image-set\s*\(/gi)) {
    const url = match[2]?.trim();
    if (url && (url.startsWith('#') || /\.(woff2?|ttf|otf)(?:[?#].*)?$/i.test(url))) continue;
    failures.push({file,line:clean.slice(0,match.index).split('\n').length,kind:'css-image',message:'CSS network images/image-set need a reviewed delivery policy; use responsive markup.',code:match[0]});
  }
  return failures;
}
export function inspectHtml(source, file, approved = exceptions) {
  // Mask Hugo actions BEFORE parsing HTML, including nested quote characters.
  const masked = source.replace(/{{[\s\S]*?}}/g, token => '0'+token.slice(1).replace(/[^\n]/g,' '));
  const tree = parse(masked, {sourceCodeLocationInfo:true}); const failures=[];
  function walk(node) {
    const attrs=Object.fromEntries((node.attrs??[]).map(a=>[a.name,a.value]));
    if (node.tagName === 'script' && !attrs.src && !['application/json','application/ld+json','importmap'].includes(attrs.type)) {
      const loc=node.sourceCodeLocation;
      if (!loc?.endTag) failures.push({file,kind:'parse',message:'Unclosed inline script.'});
      else { const offset=masked.slice(0,loc.startTag.endOffset).split('\n').length-1; failures.push(...inspectScript(masked.slice(loc.startTag.endOffset,loc.endTag.startOffset),file,approved).map(f=>({...f,line:(f.line??1)+offset}))); }
    }
    if(node.tagName === 'style') failures.push(...inspectCss((node.childNodes??[]).map(n=>n.value??'').join(''),file));
    for(const [name,value] of Object.entries(attrs)) {
      if(name === 'style') failures.push(...inspectCss(value,file));
      if(name.startsWith('on')) failures.push(...inspectScript(value,file,approved));
    }
    for(const child of node.childNodes??[]) walk(child);
    if(node.content) walk(node.content);
  }
  walk(tree); return failures;
}
async function files(dir) {
  let entries; try {entries=await fs.readdir(dir,{withFileTypes:true});} catch(e) {if(e.code==='ENOENT') return [];throw e;}
  const result=[];for(const entry of entries){const p=path.join(dir,entry.name);if(entry.isDirectory()) result.push(...await files(p));else if(entry.isFile()) result.push(p);else if(entry.isSymbolicLink()) throw new Error('Source policy does not follow symlinks: '+p);}
  return result;
}
export async function checkPolicy(root, {rendered = false} = {}) {
  const failures=[];let count=0;
  const roots=rendered?['public']:['src','layouts','static','content'];
  for(const dir of roots) for(const abs of await files(path.join(root,dir))) {
    const file=path.relative(root,abs).split(path.sep).join('/');
    // Generated bundles are validated through authored modules plus runtime tests.
    if(/^(static|public)\/react\//.test(file)) continue;
    const ext=path.extname(file);if(!['.js','.mjs','.cjs','.ts','.tsx','.jsx','.html','.htm','.md','.markdown','.css'].includes(ext))continue;
    if(rendered && !['.html','.css'].includes(ext))continue;
    const source=await fs.readFile(abs,'utf8');count++;
    failures.push(...(['.html','.htm','.md','.markdown'].includes(ext)?inspectHtml(source,file):ext==='.css'?inspectCss(source,file):inspectScript(source,file)));
  }
  return {files:count,failures};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=await checkPolicy(process.cwd(),{rendered:process.argv.includes('--rendered')});
  for(const f of result.failures) console.error(`${f.file}:${f.line??1}:${f.column??1} [${f.kind}] ${f.message}\n  ${f.code??''}`);
  console.log(`Image source policy: ${result.files} files; ${result.failures.length} violations.`);
  if(result.failures.length) process.exitCode=1;
}
