// Build-only, bounded source discovery. Never imported by a browser adapter.
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { canonicalImageUrl } from './resolver.mjs';

const literal = n => n && ts.isStringLiteralLike(n) ? n.text : undefined;
const registrations = [
  {file:'src/block/single-row-logo-cloud.tsx', component:'ResponsiveImage', expression:'logo.src', table:'LOGOS', field:'src'},
  {file:'src/block/contact-section-with-shader.tsx', component:'ResponsiveImage', expression:'src', owner:'TestimonialAvatar', table:'testimonials', field:'avatar'},
  {file:'src/block/contact-section-with-shader.tsx', component:'TestimonialAvatar', expression:'testimonial.avatar', owner:'TestimonialCard', table:'testimonials', field:'avatar'},
];
function owner(node) {
  for(let p=node.parent;p;p=p.parent) if(ts.isFunctionDeclaration(p)) return p.name?.text;
}
export function inspectRuntimeSources(source, file, manifest) {
  const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const sources=new Set(); const failures=[]; const tables=new Map();
  const names=new Map([['ResponsiveImage','ResponsiveImage'],['RetainedResponsiveImage','RetainedResponsiveImage'],['TestimonialAvatar','TestimonialAvatar']]);
  function fail(node,message) {const p=tree.getLineAndCharacterOfPosition(node.getStart(tree));failures.push(`${file}:${p.line+1}:${p.character+1}: ${message}`);}
  function add(node,value) {
    try {
      if(!value?.startsWith('/') || value.startsWith('//')) throw new Error('Use a root-relative local image literal');
      const key=canonicalImageUrl(value).pathname;
      if(!manifest.images[key]) throw new Error(`Missing runtime image: ${value}`);
      sources.add(key);
    } catch(e) {fail(node,e.message);}
  }
  function collect(n) {
    if(ts.isImportDeclaration(n) && /(?:^|\/)responsive-image(?:\.[cm]?[jt]sx?)?$/.test(literal(n.moduleSpecifier) ?? '')) {
      if(n.importClause?.name || (n.importClause?.namedBindings && ts.isNamespaceImport(n.importClause.namedBindings))) fail(n,'Use named ResponsiveImage imports; namespace/default image adapter imports require review.');
    }
    if(ts.isImportSpecifier(n) && ['ResponsiveImage','RetainedResponsiveImage'].includes((n.propertyName??n.name).text)) names.set(n.name.text,(n.propertyName??n.name).text);
    if(ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) tables.set(n.name.text,n.initializer);
    ts.forEachChild(n,collect);
  }
  collect(tree);
  function visit(n) {
    if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)) && names.has(n.tagName.getText(tree))) {
      const component=names.get(n.tagName.getText(tree));
      // Exact internal forwarding seam, already source-policy checked; no file exemption.
      if(file==='src/components/responsive-image.tsx' && owner(n)==='RetainedResponsiveImage' && n.getText(tree)==='<ResponsiveImage {...props} />') return;
      const attrs=n.attributes.properties;
      const src=attrs.filter(a=>ts.isJsxAttribute(a)&&a.name.getText(tree)==='src');
      if(attrs.some(ts.isJsxSpreadAttribute) || src.length!==1) fail(n,'Runtime image requires one explicit src and no spread props; use a reviewed bounded adapter.');
      else {
        const value=src[0].initializer; const expr=value&&ts.isJsxExpression(value)?value.expression:value;
        const staticValue=literal(expr);
        if(staticValue!==undefined) add(src[0],staticValue);
        else {
          const reg=registrations.find(r=>r.file===file&&r.component===component&&r.expression===expr?.getText(tree)&&(!r.owner||r.owner===owner(n)));
          const table=reg&&tables.get(reg.table);
          if(!reg || !table || !ts.isArrayLiteralExpression(table)) fail(src[0],'Unresolved runtime image src; use a literal or a reviewed bounded data registration.');
          else for(const item of table.elements) {
            const fields=ts.isObjectLiteralExpression(item) ? item.properties.filter(p=>ts.isPropertyAssignment(p)&&(literal(p.name)??p.name.getText(tree))===reg.field) : [];
            if(!ts.isObjectLiteralExpression(item)||item.properties.some(ts.isSpreadAssignment)||fields.length!==1||literal(fields[0].initializer)===undefined) fail(item,`Registered ${reg.table}.${reg.field} must contain literal image URLs without spreads.`);
            else add(fields[0],literal(fields[0].initializer));
          }
        }
      }
    }
    ts.forEachChild(n,visit);
  }
  for(const d of tree.parseDiagnostics) fail(tree,ts.flattenDiagnosticMessageText(d.messageText,' '));
  visit(tree); return {sources,failures};
}
export async function discoverRuntimeSources(root, manifest) {
  const sources=new Set(); const failures=[];
  async function walk(dir) {
    let entries;try{entries=await fs.readdir(dir,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}
    for(const e of entries) {
      const abs=path.join(dir,e.name);
      if(e.isSymbolicLink()) throw new Error(`Runtime source discovery rejects symlink: ${abs}`);
      if(e.isDirectory()) await walk(abs);
      else if(/\.[cm]?[jt]sx?$/.test(e.name)) {
        const result=inspectRuntimeSources(await fs.readFile(abs,'utf8'),path.relative(root,abs).split(path.sep).join('/'),manifest);
        result.sources.forEach(s=>sources.add(s)); failures.push(...result.failures);
      }
    }
  }
  await walk(path.join(root,'src'));
  if(failures.length) throw new Error('Runtime image source discovery failed:\n'+failures.join('\n'));
  return [...sources].sort();
}
