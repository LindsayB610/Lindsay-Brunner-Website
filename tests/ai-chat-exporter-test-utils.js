const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function assert(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

function loadTsModule(relativePath) {
  const moduleCache = new Map();

  function loadFile(requestPath, parentDir = root) {
    let filename;

    if (requestPath.startsWith('@/')) {
      filename = path.join(root, 'src', requestPath.slice(2));
    } else if (requestPath.startsWith('.')) {
      filename = path.resolve(parentDir, requestPath);
    } else {
      return require(requestPath);
    }

    if (!path.extname(filename)) {
      if (fs.existsSync(`${filename}.ts`)) filename = `${filename}.ts`;
      else if (fs.existsSync(`${filename}.tsx`)) filename = `${filename}.tsx`;
      else if (fs.existsSync(`${filename}.mts`)) filename = `${filename}.mts`;
      else if (fs.existsSync(`${filename}.js`)) filename = `${filename}.js`;
    }

    if (moduleCache.has(filename)) {
      return moduleCache.get(filename).exports;
    }

    return compileFile(filename);
  }

  function compileFile(filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename.endsWith('.mts') ? filename.replace(/\.mts$/, '.ts') : filename,
    }).outputText;

    const module = { exports: {} };
    moduleCache.set(filename, module);

    const context = {
      Blob,
      Headers,
      Request,
      Response,
      URL,
      console,
      document: undefined,
      fetch,
      exports: module.exports,
      globalThis,
      module,
      require: (requestPath) => loadFile(requestPath, path.dirname(filename)),
      setTimeout,
    };

    vm.runInNewContext(compiled, context, { filename });
    return module.exports;
  }

  const filename = path.join(root, relativePath);
  return compileFile(filename);
}

function report(failures, successMessage) {
  if (failures.length > 0) {
    console.error('\n❌ AI Chat Exporter test failed:');
    failures.forEach((failure) => console.error(`   - ${failure}`));
    process.exit(1);
  }

  console.log(successMessage);
}

function pending(message) {
  console.log(`⏳ ${message}`);
}

module.exports = {
  assert,
  exists,
  loadTsModule,
  pending,
  read,
  report,
  root,
};
