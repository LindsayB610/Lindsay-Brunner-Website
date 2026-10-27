import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectScript, inspectHtml, inspectCss } from '../scripts/images/policy.mjs';

test('unsupported image sinks fail, including aliases and computed properties', () => {
  for (const source of [
    'const x = <img src="/images/new.png"/>;',
    'const alias = photo; alias.src = next;',
    'photo["src"] = next;', 'const key = "src"; photo[key] = next;',
    'photo.srcset = next;', 'photo.setAttribute("src", next);',
    'const set = photo.setAttribute; set("src", next);',
    'const {setAttribute: set} = photo; set("src", next);',
    'document.createElement("img");', 'document["createElement"]("img");',
    'const create = document.createElement; create("img");',
    'new Image();', 'const Constructor = Image; new Constructor();',
    'target.innerHTML = `<img src="${url}">`;',
    'target.innerHTML = markup;', 'target.insertAdjacentHTML("beforeend", markup);',
    'const p = {src: url}; Object.assign(photo, p);',
    'eval(code);', 'const execute = eval; execute(code);', 'new Function(code);',
    'image.setAttributeNS(null, "src", next);', 'Reflect.set(image, "src", next);',
    'style.backgroundImage = next;', 'const x = <div style={{backgroundImage: next}} />;', 'new DOMParser().parseFromString(markup, "text/html");',
  ]) assert.ok(inspectScript(source, 'src/new.tsx').length, source);
});
test('ordinary data and non-image DOM operations remain supported', () => {
  assert.deepEqual(inspectScript('const p = { src: "/images/a.png" }; document.createElement("button"); button.setAttribute("aria-label", "Next"); target.innerHTML = "";', 'src/new.tsx'), []);
});
test('exact reviewed exception does not exempt its file or identical added sink', () => {
  const source = 'function adapter() { img.src = descriptor.src; }';
  const exception = {file:'src/adapter.ts',symbol:'adapter',code:'img.src = descriptor.src',kind:'source-write',reason:'test adapter'};
  assert.deepEqual(inspectScript(source, 'src/adapter.ts', [exception]), []);
  assert.equal(inspectScript(source+' function bypass() { img.src = evil; }', 'src/adapter.ts', [exception]).length, 1);
  assert.ok(inspectScript(source.replace(' }','; img.src = descriptor.src; }'), 'src/adapter.ts', [exception]).length);
  assert.ok(inspectScript(source.replace('descriptor.src','evil'), 'src/adapter.ts', [exception]).length);
});
test('parse errors and inline scripts fail closed, JSON scripts are data', () => {
  assert.ok(inspectScript('const broken = ;', 'src/bad.js').length);
  assert.ok(inspectHtml('<script>img.src = "/new.png";</script>', 'layouts/a.html').length);
  assert.deepEqual(inspectHtml('<script type="application/json">{"src":"/new.png"}</script><script>const value = {{ .Params.value | jsonify }};</script>', 'layouts/a.html'), []);
  assert.ok(inspectHtml('<img onload="this.src=\'/new.png\'">', 'layouts/a.html').length);
});
test('CSS and inline image URLs cannot bypass responsive delivery', () => {
  assert.ok(inspectCss('.hero { background:url(/images/new.png) }', 'static/a.css').length);
  assert.ok(inspectCss('.hero { background:image-set("/images/new.png" 1x) }', 'static/a.css').length);
  assert.ok(inspectHtml('<div style="background:url(/images/new.png)"></div>', 'content/a.md').length);
  assert.deepEqual(inspectCss('filter:url(#noise); @font-face { src:url(/fonts/a.woff2) }', 'static/a.css'), []);
});

test('new bypasses in the real adapter files fail their precise exceptions', async () => {
  const fs=await import('node:fs/promises');
  for(const file of ['src/components/responsive-image.tsx','src/lib/responsive-image.ts','static/js/image-dialog.js']) {
    const source=await fs.readFile(new URL('../'+file,import.meta.url),'utf8');
    assert.deepEqual(inspectScript(source,file),[]);
    assert.ok(inspectScript(source+'\nfunction bypass() { const alias = document.querySelector("img"); alias["src"] = "/unregistered.png"; }',file).length);
    assert.ok(inspectScript(source+'\nconst newBypass = <img src="/unregistered.png"/>;',file).length);
  }
});
test('build gates remain browser-free; runtime is a separate release and CI step', async () => {
  const fs=await import('node:fs/promises');
  const pkg=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.ok(pkg.scripts.build.indexOf('images:policy')>pkg.scripts.build.indexOf('images:prepare'));
  assert.ok(pkg.scripts.build.indexOf('images:policy')<pkg.scripts.build.indexOf('build:react'));
  assert.match(pkg.scripts['test:images'],/images:policy:rendered/);
  assert.doesNotMatch(pkg.scripts.build,/runtime|playwright/);
  assert.match(pkg.scripts['test:images:release'],/test:images:runtime/);
  const workflow=await fs.readFile(new URL('../.github/workflows/image-runtime.yml',import.meta.url),'utf8');
  assert.match(workflow,/--only-shell chromium/);assert.match(workflow,/npm run test:images:runtime/);
});

test('CSS shorthand/CSSOM and reflective spelling/extraction gaps fail in adapter files', () => {
  const cases = [
    'const view = <div style={{backgroundImage}} />;',
    'element.style.setProperty("background-image", next);',
    'element.style["setProperty"](key, next);',
    'const set = element.style.setProperty; set("background", next);',
    'const {setProperty: set} = element.style;',
    'Reflect["set"](image, "src", next);',
    'Object["assign"](image, {src: next});',
    'const make = Reflect["set"];',
    'const {set: make} = Reflect;',
    'const {"assign": make} = Object;',
    'const define = Object["defineProperty"];',
    'const {["set"]: make} = Reflect;',
    'const {["assign"]: make} = Object;',
    'Reflect["defineProperty"](image, "src", descriptor);',
    'Object["defineProperties"](image, descriptors);',
    'const { ["setProperty"]: set } = element.style;',
    'element.style.setProperty("mask", next);',
    'element.style.setProperty("list-style-image", next);',
  ];
  for (const source of cases) {
    assert.ok(inspectScript(source, 'src/lib/responsive-image.ts').length, source);
    assert.ok(inspectHtml(`<script>${source}</script>`, 'layouts/a.html').length, source);
  }
  assert.deepEqual(inspectScript('element.style.setProperty("color", next); const view = <div style={{color}} />;', 'src/a.tsx'), []);
});


test('direct image properties share CSSOM classification in source and inline scripts', () => {
  const keys = ['background', 'backgroundImage', 'mask', 'maskImage', 'webkitMask', 'webkitMaskImage', 'WebkitMask', 'WebkitMaskImage', 'listStyle', 'listStyleImage', 'borderImage', 'borderImageSource', 'content'];
  for (const key of keys) {
    for (const source of [`element.style.${key} = next;`, `element.style["${key}"] = next;`, `element.style.setProperty("${key}", next);`]) {
      assert.ok(inspectScript(source, 'src/lib/responsive-image.ts').length, source);
      assert.ok(inspectHtml(`<script>${source}</script>`, 'layouts/a.html').length, source);
    }
  }
  const allowed = 'element.style.color = next; element.style.borderWidth = next; element.textContent = next; element.style.mask = ""; element.style.webkitMaskImage = "";';
  assert.deepEqual(inspectScript(allowed, 'src/a.ts'), []);
  assert.deepEqual(inspectHtml(`<script>${allowed}</script>`, 'layouts/a.html'), []);
});

test('parenthesized reflective receivers fail for calls and capability extraction', () => {
  for (const [receiver, methods] of Object.entries({Object: ['assign', 'defineProperty', 'defineProperties'], Reflect: ['set', 'defineProperty']})) {
    for (const method of methods) {
      for (const source of [
        `((${receiver})).${method}(image, "src", next);`,
        `(${receiver})["${method}"](image, "src", next);`,
        `const mutate = ((${receiver})).${method};`,
        `const mutate = (${receiver})["${method}"];`,
        `const {${method}: mutate} = ((${receiver}));`,
        `const {["${method}"]: mutate} = (${receiver});`,
      ]) {
        assert.ok(inspectScript(source, 'src/lib/responsive-image.ts').length, source);
        assert.ok(inspectHtml(`<script>${source}</script>`, 'layouts/a.html').length, source);
      }
    }
  }
  const allowed = '(Object).keys(data); (Reflect)["get"](data, "name"); const {keys} = (Object); const get = (Reflect).get;';
  assert.deepEqual(inspectScript(allowed, 'src/a.ts'), []);
  assert.deepEqual(inspectHtml(`<script>${allowed}</script>`, 'layouts/a.html'), []);
});

test('new sink normalization preserves exact exception scope and occurrence limits', () => {
  for (const [code, kind] of [['element.style.mask = next', 'html-injection'], ['(Reflect).set(image, "src", next)', 'computed-write'], ['const mutate = (Reflect)["set"]', 'capability-alias']]) {
    // Capability exceptions refer to the member node, not its declaration.
    const reviewed = kind === 'capability-alias' ? '(Reflect)["set"]' : code;
    for (const inline of [false, true]) {
      const file = inline ? 'layouts/a.html' : 'src/adapter.ts';
      const approved = [{file, symbol:'adapter', kind, code:reviewed}];
      const inspect = source => inline ? inspectHtml(`<script>${source}</script>`, file, approved) : inspectScript(source, file, approved);
      assert.deepEqual(inspect(`function adapter() { ${code}; }`), []);
      assert.ok(inspect(`function adapter() { ${code}; ${code}; }`).length);
      assert.ok(inspect(`function other() { ${code}; }`).length);
      assert.ok(inspect(`function adapter() { ${code.replace('next', 'other').replace('(Reflect)', '((Reflect))')}; }`).length);
    }
  }
});
