#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DEFAULT_HTML, readBundleText } = require('./lib.cjs');

const ROOT = __dirname;
const ENTRY = './src/BeforeSC2/init.ts';
const CORE_JS_PREFIX = './node_modules/core-js';
const MOMENT_LOCALE_PREFIX = './node_modules/moment/locale';
const MOMENT_LOCALE_CONTEXT = 'moment/locale sync recursive';

function parseArgs(argv) {
  const args = { html: DEFAULT_HTML, writeSrc: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--html') args.html = argv[++i];
    else if (a === '--no-src') args.writeSrc = false;
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error('unknown argument: ' + a);
  }
  return args;
}

function stripLeadingBanner(prologue) {
  const trimmed = prologue.replace(/^\s+/, '');
  if (!trimmed.startsWith('/*')) return prologue;
  const end = trimmed.indexOf('*/');
  if (end < 0) return prologue;
  return trimmed.slice(end + 2);
}

function stripModuleBanner(prefix) {
  return prefix.replace(/\/\*![\s\S]*?\*\/[ \t]*\r?\n?/, '');
}

function stripGeneratedComments(code) {
  let s = code.replace(/\s+$/, '');
  const re = /\n?\/\/# source(?:URL|MappingURL)=[^\n]*$/;
  let prev;
  do {
    prev = s;
    s = s.replace(re, '');
  } while (s !== prev);
  return s;
}

function sanitizeScriptEnd(code) {
  return code.replace(/<\/(script)/gi, '<\\/$1');
}

function parseStringAt(text, i) {
  const quote = text[i];
  if (quote !== '"' && quote !== "'") {
    throw new Error('expected string literal at ' + i + ', got ' + JSON.stringify(text.slice(i, i + 24)));
  }
  let j = i + 1;
  while (j < text.length) {
    const c = text[j];
    if (c === '\\') { j += 2; continue; }
    if (c === quote) return { raw: text.slice(i, j + 1), end: j + 1 };
    j++;
  }
  throw new Error('unterminated string literal at ' + i);
}

function decodeModules(bundle) {
  const headerRe = /\/\*\*\*\/ "((?:\\.|[^"\\])*)":/g;
  const positions = [];
  let m;
  while ((m = headerRe.exec(bundle))) positions.push({ id: m[1], at: m.index });

  const sandbox = vm.createContext(Object.create(null));
  const modules = [];

  for (let i = 0; i < positions.length; i++) {
    const id = positions[i].id;
    const at = positions[i].at;
    const nextAt = i + 1 < positions.length ? positions[i + 1].at : bundle.length;
    const segment = bundle.slice(at, nextAt);
    const mod = { id, at, segment, decoded: null, prefix: null, suffix: null, renderEnd: nextAt, deps: new Set() };

    const evalAt = segment.indexOf('eval(');
    if (evalAt >= 0) {
      let q = evalAt + 5;
      while (q < segment.length && /\s/.test(segment[q])) q++;
      const lit = parseStringAt(segment, q);
      const value = vm.runInContext('(' + lit.raw + ')', sandbox);
      if (typeof value !== 'string') throw new Error('module ' + id + ' eval literal is not a string');
      mod.decoded = sanitizeScriptEnd(stripGeneratedComments(value));
      mod.prefix = segment.slice(0, evalAt);
      let cp = lit.end;
      while (cp < segment.length && segment[cp] !== ')') cp++;
      if (cp >= segment.length) throw new Error('module ' + id + ' eval call is not closed');
      mod.suffix = segment.slice(cp + 1);
      const closeMatch = /\/\*\*\*\/ \}\),?/.exec(mod.suffix);
      if (!closeMatch) throw new Error('module ' + id + ' closing marker not found');
      mod.closeToken = closeMatch[0];
      mod.blockClose = at + (cp + 1) + closeMatch.index + mod.closeToken.length;
    } else {
      mod.closeToken = null;
      mod.blockClose = nextAt;
    }
    modules.push(mod);
  }

  return modules;
}

function depsOf(code) {
  const deps = new Set();
  if (!code) return deps;
  const re = /__webpack_require__\(\s*(?:\/\*!?[\s\S]*?\*\/\s*)?"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(code))) deps.add(m[1]);
  return deps;
}

function contextTargets(mod, code) {
  const out = new Set();
  if (!mod.id.includes(' sync recursive') || !code) return out;
  const re = /"\.[^"]*":\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(code))) out.add(m[1]);
  return out;
}

function transformInit(code) {
  if (!code) return code;
  return code
    .replace(/^\/\* harmony import \*\/ var core_js__WEBPACK_IMPORTED_MODULE_0__[^\n]*\n?/gm, '')
    .replace(/^\/\* harmony import \*\/ var core_js__WEBPACK_IMPORTED_MODULE_0___default[^\n]*\n?/gm, '');
}

function buildVariant(bundle, modules, opts) {
  const byId = new Map(modules.map(m => [m.id, m]));
  const excluded = new Set();
  const codeById = new Map();

  for (const mod of modules) {
    let code = mod.decoded;
    if (opts.dropCoreJs && mod.id === ENTRY) code = transformInit(code);
    codeById.set(mod.id, code);
  }

  if (opts.dropCoreJs) {
    for (const mod of modules) {
      if (mod.id.startsWith(CORE_JS_PREFIX)) excluded.add(mod.id);
    }
  }
  if (opts.dropMomentLocales) {
    const keep = new Set((opts.keepMomentLocales || []).map(l => MOMENT_LOCALE_PREFIX + '/' + l + '.js'));
    const keepContext = keep.size > 0;
    for (const mod of modules) {
      if (mod.id.includes(MOMENT_LOCALE_CONTEXT)) {
        if (!keepContext) excluded.add(mod.id);
        continue;
      }
      if (mod.id.startsWith(MOMENT_LOCALE_PREFIX) && !keep.has(mod.id)) excluded.add(mod.id);
    }
  }

  const depsById = new Map();
  for (const mod of modules) depsById.set(mod.id, depsOf(codeById.get(mod.id)));

  const reachable = new Set();
  const stack = [ENTRY];
  while (stack.length) {
    const id = stack.pop();
    if (reachable.has(id) || excluded.has(id)) continue;
    if (!byId.has(id)) {
      if (!excluded.has(id)) throw new Error('missing module referenced at build time: ' + id);
      continue;
    }
    reachable.add(id);
    for (const d of depsById.get(id)) if (!reachable.has(d) && !excluded.has(d)) stack.push(d);
    for (const t of contextTargets(byId.get(id), codeById.get(id))) if (!reachable.has(t) && !excluded.has(t)) stack.push(t);
  }

  if (opts.dropCoreJs && reachable.has('./node_modules/core-js/index.js')) {
    throw new Error('core-js is still reachable; init.ts import rewrite failed');
  }

  const dangling = [];
  for (const id of reachable) {
    for (const d of depsById.get(id)) {
      if (!reachable.has(d) && !excluded.has(d)) dangling.push([id, d]);
    }
  }

  const chunks = [stripLeadingBanner(bundle.slice(0, modules[0].at))];
  for (const mod of modules) {
    if (!reachable.has(mod.id)) continue;
    let prefix = stripModuleBanner(mod.prefix || '');
    let code = codeById.get(mod.id) || '';
    let suffix = mod.suffix || '';
    if (mod.closeToken) {
      const closeAt = suffix.indexOf(mod.closeToken);
      if (closeAt >= 0) suffix = suffix.slice(0, closeAt + mod.closeToken.length);
    }
    chunks.push(prefix + code + suffix);
  }

  const last = modules[modules.length - 1];
  const epilogue = last.blockClose != null ? bundle.slice(last.blockClose) : '';
  chunks.push(epilogue);
  const output = chunks.join('\n\n');

  return { output, reachable, excluded, codeById, dangling };
}

function writeSrcFiles(modules) {
  const srcDir = path.join(ROOT, 'src');
  const written = [];
  for (const mod of modules) {
    if (!mod.id.startsWith('./src/') || mod.decoded == null) continue;
    const rel = mod.id.slice('./src/'.length).replace(/\.ts$/, '.js');
    const target = path.join(srcDir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, mod.decoded, 'utf8');
    written.push(rel.replace(/\\/g, '/'));
  }
  return written;
}

function syntaxCheck(js, filename) {
  new vm.Script(js, { filename });
}

function applyLocalSrcOverrides(modules) {
  const srcDir = path.join(ROOT, 'src');
  let count = 0;
  for (const mod of modules) {
    if (mod.decoded == null || !mod.id.startsWith('./src/')) continue;
    const rel = mod.id.slice('./src/'.length).replace(/\.ts$/, '.js');
    const target = path.join(srcDir, rel);
    if (!fs.existsSync(target)) continue;
    mod.decoded = sanitizeScriptEnd(stripGeneratedComments(fs.readFileSync(target, 'utf8')));
    count++;
  }
  return count;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('Usage: node extract.cjs [--html <path>] [--no-src]');
    return;
  }
  if (!fs.existsSync(args.html)) throw new Error('HTML not found: ' + args.html);

  const { buf, loc, text } = readBundleText(args.html);
  const modules = decodeModules(text);
  if (modules.length === 0) throw new Error('no webpack modules found');
  if (!modules.some(m => m.id === ENTRY)) throw new Error('entry module not found: ' + ENTRY);
  const srcOverrideCount = applyLocalSrcOverrides(modules);
  if (srcOverrideCount > 0) console.log('src overrides :', srcOverrideCount);
  const decodedCount = modules.filter(m => m.decoded != null).length;

  const variants = [
    { name: 'modloader-neo.js', label: 'compat', opts: { dropCoreJs: false, dropMomentLocales: false } },
    { name: 'modloader-neo.fast.js', label: 'fast', opts: { dropCoreJs: true, dropMomentLocales: false } },
    { name: 'modloader-neo.slim.js', label: 'slim', opts: { dropCoreJs: true, dropMomentLocales: true, keepMomentLocales: ['zh-cn'] } },
  ];

  const distDir = path.join(ROOT, 'dist');
  fs.mkdirSync(distDir, { recursive: true });

  const report = {
    source: args.html,
    bundle: { contentStart: loc.contentStart, close: loc.close, bytes: loc.close - loc.contentStart },
    modules: { parsed: modules.length, decoded: decodedCount },
    entry: ENTRY,
    srcFiles: args.writeSrc ? writeSrcFiles(modules) : [],
    builds: [],
  };

  for (const v of variants) {
    const built = buildVariant(text, modules, v.opts);
    syntaxCheck(built.output, v.name);
    const outPath = path.join(distDir, v.name);
    fs.writeFileSync(outPath, built.output, 'utf8');
    const removed = modules.length - built.reachable.size;
    report.builds.push({
      file: 'dist/' + v.name,
      label: v.label,
      bytes: Buffer.byteLength(built.output),
      modules: built.reachable.size,
      removedModules: removed,
      removedGroups: summarizeRemoved(modules, built.reachable),
      danglingDeps: built.dangling,
    });
  }

  fs.writeFileSync(path.join(ROOT, 'build-report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('bundle bytes :', report.bundle.bytes);
  console.log('modules      :', modules.length, '(decoded', decodedCount + ')');
  for (const b of report.builds) {
    console.log(
      b.label.padEnd(7),
      String(b.modules).padStart(4) + ' modules',
      '->',
      (b.bytes / 1024).toFixed(1) + ' KiB',
      '(' + b.removedModules + ' removed)'
    );
  }
  console.log('src files    :', report.srcFiles.length);
}

function summarizeRemoved(modules, reachable) {
  const groups = {};
  for (const mod of modules) {
    if (reachable.has(mod.id)) continue;
    let g = 'other';
    if (mod.id.startsWith(CORE_JS_PREFIX)) g = 'core-js';
    else if (mod.id.startsWith(MOMENT_LOCALE_PREFIX) || mod.id.includes(MOMENT_LOCALE_CONTEXT)) g = 'moment-locale';
    else if (mod.id.startsWith('./src')) g = 'src';
    else if (mod.id.startsWith('./node_modules/moment')) g = 'moment';
    groups[g] = (groups[g] || 0) + 1;
  }
  return groups;
}

if (require.main === module) main();

module.exports = {
  ENTRY,
  parseArgs,
  decodeModules,
  depsOf,
  contextTargets,
  buildVariant,
  syntaxCheck,
};
