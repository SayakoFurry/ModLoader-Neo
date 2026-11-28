#!/usr/bin/env node
'use strict';

/**
 * neo-install: inject the ModLoader Neo runtime into a stock Degrees of Lewdity HTML.
 *
 * Forge-style model:
 *   stock game HTML (user supplied) + loader payload + per-version patch spec
 *   -> a patched, standalone game HTML + manifest
 *
 * The original file is never modified. No game content is redistributed.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const ROOT = __dirname;
const DEFAULT_LOADER = path.join(ROOT, 'dist', 'modloader-neo.slim.js');
const DEFAULT_I10N = path.join(ROOT, 'dist', 'i10n-sc2patch.js');
const DEFAULT_VERSIONS = path.join(ROOT, 'versions');
const TOOL_VERSION = '0.3.0';

const ENGINE_HOOK = `
// inject ModLoader on there
if (typeof window.modSC2DataManager !== 'undefined') {
window.modSC2DataManager.startInit().then(() => window.jsPreloader.startLoad()).then(() => {window.mainStart();window.initI10n(l10nStrings);}).catch(err => {console.error(err);});}else {window.mainStart();window.initI10n(l10nStrings);
}`;

function parseArgs(argv) {
  const args = {
    html: '',
    loader: DEFAULT_LOADER,
    i10n: DEFAULT_I10N,
    versions: DEFAULT_VERSIONS,
    out: '',
    manifest: '',
    packs: [],
    replacePack: false,
    isolateMods: true,
    force: false,
    dryRun: false,
    strict: false,
    allowFallback: false,
    quiet: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const need = () => {
      if (i + 1 >= argv.length) throw new Error('missing value for ' + a);
      return argv[++i];
    };
    switch (a) {
      case '--html': args.html = need(); break;
      case '--loader': args.loader = need(); break;
      case '--i10n': args.i10n = need(); break;
      case '--versions': args.versions = need(); break;
      case '--out': args.out = need(); break;
      case '--manifest': args.manifest = need(); break;
      case '--pack': args.packs.push(need()); break;
      case '--replace-pack': args.replacePack = true; break;
      case '--shared-mod-storage': args.isolateMods = false; break;
      case '--force': args.force = true; break;
      case '--dry-run': args.dryRun = true; break;
      case '--strict': args.strict = true; break;
      case '--allow-fallback-anchor': args.allowFallback = true; break;
      case '--quiet': args.quiet = true; break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        throw new Error('unknown argument: ' + a);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage: node neo-install.cjs --html <Degrees of Lewdity.html> [options]

Options:
  --html <file>              stock game HTML (required)
  --loader <file>            loader bundle (default: dist/modloader-neo.slim.js)
  --i10n <file>              i10n engine shim (default: dist/i10n-sc2patch.js)
  --versions <dir>           version spec directory (default: versions/)
  --pack <zip>               built-in mod zip to embed; repeatable
  --replace-pack             replace an existing window.modDataValueZipList array
  --shared-mod-storage       reuse the old ModLoader storage namespace (not recommended)
  --out <file>               output HTML path
  --manifest <file>          manifest path (default: <out>.manifest.json)
  --force                    allow an already-patched input (loader is replaced)
  --dry-run                  inspect and patch in memory, write nothing
  --strict                   fail when the game version has no verified spec
  --allow-fallback-anchor    allow <head> injection when script-libraries is absent
  --quiet                    suppress the report

Exit codes: 0 ok, 2 input problem, 3 patch problem, 4 verification problem`);
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function fmt(n) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(1) + ' KB';
  return n + ' B';
}

function readText(file) {
  const buf = fs.readFileSync(file);
  const raw = buf.toString('utf8');
  const bom = raw.charCodeAt(0) === 0xFEFF ? '\uFEFF' : '';
  const text = bom ? raw.slice(1) : raw;
  return { buf, text, bom };
}

function detectGameVersion(text, file) {
  const near = /version\s*:\s*"([0-9]+(?:\.[0-9]+){2,3})"\s*,\s*versionName\s*:\s*/i.exec(text);
  if (near) {
    const name = /^`?"([^"]+)"/.exec(text.slice(near.index + near[0].length, near.index + near[0].length + 80));
    return { version: near[1], versionName: name ? name[1] : '' };
  }
  const fn = /(\d+\.\d+\.\d+(?:\.\d+)?)/.exec(path.basename(file));
  return { version: fn ? fn[1] : '', versionName: '' };
}

function detectEngine(text) {
  const at = text.indexOf('<tw-storydata');
  if (at < 0) return { engine: '', storyName: '' };
  const gt = text.indexOf('>', at);
  const tag = text.slice(at, gt + 1);
  const engine = /format-version="([^"]+)"/i.exec(tag);
  const name = /name="([^"]*)"/i.exec(tag);
  return { engine: engine ? engine[1] : '', storyName: name ? name[1] : '' };
}

function detectLoaderVersion(bundle) {
  const neo = /get\s+neoVersion\(\)\s*\{\s*return\s*'([^']+)'/.exec(bundle)
    || /neoVersion[\s\S]{0,80}?return\s*'([0-9][0-9.]*)'/.exec(bundle);
  const internal = /get\s+version\(\)\s*\{\s*return\s*'([^']+)'/.exec(bundle);
  return {
    neo: neo ? neo[1] : '',
    internal: internal ? internal[1] : '',
  };
}

function locateScriptByMarker(text, marker, bodyTest) {
  const at = text.indexOf(marker);
  if (at < 0) return null;
  const open = text.lastIndexOf('<script', at);
  if (open < 0) return null;
  const gt = text.indexOf('>', open);
  if (gt < 0 || gt > at) return null;
  const close = text.indexOf('</script>', gt);
  if (close < 0 || close < at) return null;
  const body = text.slice(gt + 1, close);
  if (bodyTest && !bodyTest(body)) return null;
  return { open, gt, close, end: close + '</script>'.length, body };
}

function locateLoader(text) {
  return locateScriptByMarker(text, '// webpackBootstrap', body => body.includes('modSC2DataManager'));
}

function locatePack(text) {
  return locateScriptByMarker(text, 'window.modDataValueZipList', body => /^\s*window\.modDataValueZipList\s*=/.test(body));
}

function locateAnchor(text, allowFallback) {
  const strategies = [
    { how: 'script-libraries', re: /<script\s+id="script-libraries"[^>]*>/i },
    { how: "script-libraries-single-quote", re: /<script\s+id='script-libraries'[^>]*>/i },
    { how: 'script-libraries-id-any-order', re: /<script[^>]*\bid\s*=\s*["']script-libraries["'][^>]*>/i },
  ];
  for (const s of strategies) {
    const m = s.re.exec(text);
    if (m) return { index: m.index, how: s.how, warning: false };
  }
  if (allowFallback) {
    const head = /<head[^>]*>/i.exec(text);
    if (head) {
      return { index: head.index + head[0].length, how: 'head-fallback', warning: true };
    }
  }
  return null;
}

function applyPatches(text, patches, report) {
  for (const p of patches) {
    if (!p || typeof p.find !== 'string' || typeof p.replace !== 'string') {
      throw new Error('invalid patch entry: ' + JSON.stringify(p && p.id));
    }
    const id = p.id || 'patch';
    if (p.already && text.includes(p.already)) {
      report.push({ id, status: 'already' });
      continue;
    }
    const at = text.indexOf(p.find);
    if (at < 0) {
      if (p.required) {
        const err = new Error('required patch anchor not found: ' + id);
        err.code = 'PATCH_MISSING';
        throw err;
      }
      report.push({ id, status: 'missing' });
      continue;
    }
    const second = text.indexOf(p.find, at + p.find.length);
    if (second >= 0 && p.unique !== false) {
      if (p.required) {
        const err = new Error('required patch anchor is not unique: ' + id);
        err.code = 'PATCH_AMBIGUOUS';
        throw err;
      }
      report.push({ id, status: 'ambiguous' });
      continue;
    }
    text = text.slice(0, at) + p.replace + text.slice(at + p.find.length);
    report.push({ id, status: 'applied', offset: at });
  }
  return text;
}

function locateScriptById(text, id) {
  const re = new RegExp('<script[^>]*\\bid\\s*=\\s*["\']' + id + '["\'][^>]*>', 'i');
  const m = re.exec(text);
  if (!m) return null;
  const open = m.index;
  const gt = text.indexOf('>', open);
  const close = text.indexOf('</script>', gt);
  if (gt < 0 || close < gt) return null;
  return { open, gt, close, end: close + '</script>'.length, body: text.slice(gt + 1, close) };
}

function countOf(hay, needle) {
  return hay.split(needle).length - 1;
}

function hasI10n(text) {
  return text.includes('id="i10n-sc2patch"')
    || text.includes("id='i10n-sc2patch'")
    || /\bwindow\.initI10n\s*=\s*/.test(text);
}

/**
 * The stock game runs its SugarCube boot body immediately.  Neo needs it deferred
 * until mods are initialized, so we move the same body behind window.mainStart
 * and append the loader hook.  Only the boot wrapper changes; game code is kept.
 */
function refactorMinifiedBoot(body) {
  const start = 'jQuery((()=>{try{const lockId=LoadScreen.lock();';
  const replacement = 'window.mainStart=((()=>{try{const lockId=LoadScreen.lock();';
  const end = '})(window,window.document,jQuery);}';
  if (countOf(body, start) !== 1 || countOf(body, end) !== 1) return null;
  const next = body.replace(start, replacement);
  const endAt = next.lastIndexOf(end);
  if (endAt < 0) return null;
  return next.slice(0, endAt) + ENGINE_HOOK + next.slice(endAt);
}

function refactorPrettyBoot(body) {
  const start = 'jQuery(() => {';
  const end = '\n});\n\n})(window, window.document, jQuery);';
  if (countOf(body, start) !== 1 || countOf(body, end) !== 1) return null;
  return body
    .replace(start, 'window.mainStart = () => {')
    .replace(end, '\n};\n' + ENGINE_HOOK + '\n})(window, window.document, jQuery);');
}

function integrateEngine(text, spec, i10nPayload) {
  const loc = locateScriptById(text, 'script-sugarcube');
  if (!loc) {
    if (spec && spec.integrate) {
      const err = new Error('script id="script-sugarcube" not found');
      err.code = 'ENGINE_MISSING';
      throw err;
    }
    return { text, info: { selector: 'script-sugarcube', mode: 'absent', pattern: '', i10n: 'absent' } };
  }
  const beforeBody = loc.body;
  const beforeSha = sha256(Buffer.from(beforeBody));
  const cfg = spec && spec.integrate ? spec.integrate : null;
  const alreadyNeo = beforeBody.includes('window.mainStart');

  let mode = 'neo';
  let pattern = '';
  let nextBody = null;
  if (!alreadyNeo) {
    if (!cfg || cfg.mode === 'none') {
      const err = new Error('stock SugarCube boot found but the version spec has no engine integration rule');
      err.code = 'ENGINE_UNSUPPORTED';
      throw err;
    }
    const patterns = Array.isArray(cfg.patterns) ? cfg.patterns : [];
    for (const p of patterns) {
      if (p === 'sc2-minified') nextBody = refactorMinifiedBoot(beforeBody);
      else if (p === 'sc2-pretty') nextBody = refactorPrettyBoot(beforeBody);
      else continue;
      if (nextBody) { pattern = p; break; }
    }
    if (!nextBody) {
      const err = new Error('no engine boot pattern matched this build (tried: ' + (patterns.join(', ') || 'none') + ')');
      err.code = 'ENGINE_UNSUPPORTED';
      throw err;
    }
    mode = 'refactored';
  }

  let out = text;
  if (nextBody) {
    out = out.slice(0, loc.gt + 1) + nextBody + out.slice(loc.close);
  }

  let i10nMode = 'present';
  if (cfg && !hasI10n(out)) {
    if (!i10nPayload) {
      const err = new Error('i10n payload is required to define window.initI10n for this build');
      err.code = 'I10N_MISSING';
      throw err;
    }
    const tag = `<script id="i10n-sc2patch" type="text/javascript">${i10nPayload}</script>\n`;
    out = out.slice(0, loc.open) + tag + out.slice(loc.open);
    i10nMode = 'injected';
  }

  const afterLoc = locateScriptById(out, 'script-sugarcube');
  return {
    text: out,
    info: {
      selector: 'script-sugarcube',
      mode,
      pattern,
      offset: loc.open,
      beforeSha,
      afterSha: afterLoc ? sha256(Buffer.from(afterLoc.body)) : '',
      bodyDelta: afterLoc ? Buffer.byteLength(afterLoc.body) - Buffer.byteLength(beforeBody) : 0,
      i10n: i10nMode,
    },
  };
}

function findPackItems(text) {
  const loc = locatePack(text);
  if (!loc) return null;
  const m = /^\s*window\.modDataValueZipList\s*=\s*([\s\S]*)\s*;\s*$/.exec(loc.body);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[1]);
    return Array.isArray(arr) ? { loc, items: arr } : null;
  } catch (e) {
    return null;
  }
}

function buildPackTag(packFiles) {
  const items = [];
  for (const file of packFiles) {
    const buf = fs.readFileSync(file);
    if (buf.length < 4 || buf.readUInt32LE(0) !== 0x04034b50) {
      throw new Error('not a zip file: ' + file);
    }
    items.push(buf.toString('base64'));
  }
  return {
    tag: `<script id="neo-mod-pack" type="text/javascript">window.modDataValueZipList = ${JSON.stringify(items)};</script>`,
    count: items.length,
    sha256: sha256(Buffer.from(items.join('\n'))),
  };
}

function buildLoaderTag(bundle) {
  if (/<\/script/i.test(bundle)) throw new Error('loader bundle contains </script and cannot be embedded');
  return `<script id="neo-loader" type="text/javascript">\n${bundle}\n</script>`;
}

/**
 * Give every Neo build its own ModLoader storage namespace.
 *
 * The loader reads old sideloaded mods from localStorage/IndexedDB on every
 * start.  A mod left behind by an older build can patch the game script and
 * abort the whole SugarCube boot with a syntax error.  Setting a namespace
 * before the loader runs keeps the built-in packs, but ignores stale legacy
 * caches.  Game saves use separate keys and are not affected.
 */
function buildStorageTag(info, loaderVersion) {
  const raw = 'NeoDoL-' + (info.version || 'unknown') + '-' + (loaderVersion.neo || 'tool');
  const ns = raw.replace(/[^0-9A-Za-z_.-]+/g, '_');
  const keys = [
    'modDataLocalStorageZipList',
    'modDataLocalStorageZipPrefix',
    'ModLoader_IndexDBLoader',
    'modDataIndexDBZipList',
    'modDataIndexDBZipListHidden',
    'modDataIndexDBZipPrefix',
  ];
  const body = `(function(){var ns=${JSON.stringify(ns)};var keys=${JSON.stringify(keys)};` +
    `window.modLoaderKeyConfigWinHookFunction=function(cfg){for(var i=0;i<keys.length;i++){cfg.config.set(keys[i],keys[i]+'-'+ns);}};})();`;
  if (/<\/script/i.test(body)) throw new Error('storage tag contains </script and cannot be embedded');
  return {
    tag: `<script id="neo-storage" type="text/javascript">${body}</script>`,
    namespace: ns,
  };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv);
  } catch (e) {
    console.error('error:', e.message);
    usage();
    return 2;
  }
  if (args.help) {
    usage();
    return 0;
  }
  if (!args.html) {
    console.error('error: --html is required');
    usage();
    return 2;
  }

  const htmlPath = path.resolve(args.html);
  const loaderPath = path.resolve(args.loader);
  for (const p of [htmlPath, loaderPath]) {
    if (!fs.existsSync(p)) {
      console.error('error: not found:', p);
      return 2;
    }
  }
  for (const p of args.packs) {
    if (!fs.existsSync(p)) {
      console.error('error: pack not found:', p);
      return 2;
    }
  }

  const { buf: originalBuf, text: originalText, bom } = readText(htmlPath);
  const originalSha = sha256(originalBuf);
  const info = { ...detectGameVersion(originalText, htmlPath), ...detectEngine(originalText) };
  const loaderBundle = fs.readFileSync(loaderPath, 'utf8');
  const loaderVersion = detectLoaderVersion(loaderBundle);
  try {
    new vm.Script(loaderBundle, { filename: loaderPath });
  } catch (e) {
    console.error('error: loader bundle is not valid JS:', e.message);
    return 2;
  }

  const i10nPath = path.resolve(args.i10n);
  let i10nPayload = null;
  if (fs.existsSync(i10nPath)) {
    i10nPayload = fs.readFileSync(i10nPath, 'utf8');
    if (/<\/script/i.test(i10nPayload)) {
      console.error('error: i10n payload contains </script and cannot be embedded');
      return 2;
    }
    try {
      new vm.Script(i10nPayload, { filename: i10nPath });
    } catch (e) {
      console.error('error: i10n payload is not valid JS:', e.message);
      return 2;
    }
  }

  const specPath = info.version ? path.join(path.resolve(args.versions), info.version + '.json') : '';
  const genericPath = path.join(path.resolve(args.versions), '_generic.json');
  let specPathUsed = '';
  let spec = null;
  let specGeneric = false;
  if (specPath && fs.existsSync(specPath)) {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    specPathUsed = specPath;
  } else if (!args.strict && fs.existsSync(genericPath)) {
    spec = JSON.parse(fs.readFileSync(genericPath, 'utf8'));
    specPathUsed = genericPath;
    specGeneric = true;
  } else if (args.strict) {
    console.error('error: no verified version spec for game version', info.version || '(unknown)');
    console.error('       add', specPath || 'versions/<version>.json', 'or run without --strict');
    return 2;
  } else {
    console.error('error: no version spec and no versions/_generic.json');
    return 2;
  }

  let text = originalText;
  let engineReport = { selector: 'script-sugarcube', mode: 'not-configured', pattern: '', i10n: 'not-configured' };
  if (spec && spec.integrate) {
    try {
      const result = integrateEngine(text, spec, i10nPayload);
      text = result.text;
      engineReport = result.info;
    } catch (e) {
      console.error('error:', e.message);
      if (e.code === 'ENGINE_UNSUPPORTED') {
        console.error('       this build\'s SugarCube boot layout is not covered by the version spec');
      }
      return 3;
    }
  }
  const afterEngineText = text;
  const engineDelta = Buffer.byteLength(afterEngineText, 'utf8') - originalBuf.length;

  const patchReport = [];
  if (spec && Array.isArray(spec.patches) && spec.patches.length) {
    try {
      text = applyPatches(text, spec.patches, patchReport);
    } catch (e) {
      console.error('error:', e.message);
      return 3;
    }
  }
  const patchedText = text;
  const patchDelta = Buffer.byteLength(patchedText, 'utf8') - Buffer.byteLength(afterEngineText, 'utf8');
  let removedBytes = 0;

  let loaderExisting = locateLoader(text);
  if (loaderExisting && !args.force) {
    console.error('error: input already contains a ModLoader bundle (use --force to replace it)');
    return 2;
  }
  let storageExisting = locateScriptById(text, 'neo-storage');
  if (storageExisting && !args.force) {
    console.error('error: input already contains a Neo storage namespace tag (use --force to replace it)');
    return 2;
  }

  const packExisting = findPackItems(text);
  let packMode = packExisting ? 'kept' : 'none';
  let packItemsCount = packExisting ? packExisting.items.length : 0;

  if (args.packs.length) {
    if (packExisting && !args.replacePack) {
      console.error('error: input already has window.modDataValueZipList (' + packExisting.items.length + ' items); use --replace-pack');
      return 2;
    }
    packMode = packExisting ? 'replaced' : 'injected';
  }

  if (loaderExisting && args.force) {
    removedBytes += loaderExisting.end - loaderExisting.open;
    text = text.slice(0, loaderExisting.open) + text.slice(loaderExisting.end);
    loaderExisting = null;
  }
  if (packExisting && args.replacePack && args.packs.length) {
    // Re-locate after any earlier edits; the pack tag precedes the loader.
    const cur = findPackItems(text);
    if (cur) {
      removedBytes += cur.loc.end - cur.loc.open;
      text = text.slice(0, cur.loc.open) + text.slice(cur.loc.end);
    }
  }
  if (storageExisting && args.force) {
    removedBytes += storageExisting.end - storageExisting.open;
    text = text.slice(0, storageExisting.open) + text.slice(storageExisting.end);
    storageExisting = null;
  }

  const anchor = locateAnchor(text, args.allowFallback);
  if (!anchor) {
    console.error('error: injection anchor not found (expected <script id="script-libraries">)');
    console.error('       the build template may have changed; use --allow-fallback-anchor to inject after <head>');
    return 2;
  }

  const packBuild = args.packs.length ? buildPackTag(args.packs) : null;
  const loaderTag = buildLoaderTag(loaderBundle);
  const storageBuild = args.isolateMods ? buildStorageTag(info, loaderVersion) : null;
  const injected = (storageBuild ? storageBuild.tag + '\n' : '') + (packBuild ? packBuild.tag + '\n' : '') + loaderTag;
  const outDir = path.dirname(path.resolve(args.out || path.join(path.dirname(htmlPath),
    `Degrees of Lewdity [${info.version || 'unknown'}] Neo ${loaderVersion.neo || ''}`.trim() + '.html')));
  const outPath = path.resolve(args.out || path.join(outDir,
    `Degrees of Lewdity [${info.version || 'unknown'}] Neo ${loaderVersion.neo || ''}`.trim() + '.html'));
  if (packBuild) packItemsCount = packBuild.count;

  const outText = text.slice(0, anchor.index) + injected + text.slice(anchor.index);
  const outBuf = Buffer.from(bom + outText, 'utf8');
  const injectBytes = Buffer.byteLength(injected, 'utf8');
  const checks = {
    lengthDelta: outBuf.length - originalBuf.length,
    engineDelta,
    patchDelta,
    removedDelta: -removedBytes,
    injectDelta: injectBytes,
    prefixIntact: outText.slice(0, anchor.index) === text.slice(0, anchor.index),
    suffixIntact: outText.slice(anchor.index + injected.length) === text.slice(anchor.index),
    anchorOnce: (outText.match(/<script[^>]*id="script-libraries"/gi) || []).length === 1,
    loaderOnce: (outText.match(/id="neo-loader"/g) || []).length === 1,
    storageOnce: storageBuild ? (outText.match(/id="neo-storage"/g) || []).length === 1 : true,
    engineOnce: (outText.match(/<script[^>]*\bid=["']script-sugarcube["']/gi) || []).length === 1,
    versionUnchanged: detectGameVersion(outText, htmlPath).version === info.version,
    bootHook: outText.includes('// inject ModLoader on there'),
    engineBootHook: outText.includes('window.mainStart()'),
    i10nPresent: hasI10n(outText),
    packParsed: packBuild ? findPackItems(outText) && findPackItems(outText).items.length === packBuild.count : true,
    deltaMatches: outBuf.length - Buffer.byteLength(text, 'utf8') === injectBytes + (bom ? 3 : 0),
  };

  const manifest = {
    schema: 'neo-install/1',
    generatedAt: new Date().toISOString(),
    tool: { name: 'neo-install', version: TOOL_VERSION },
    base: {
      file: htmlPath,
      sha256: originalSha,
      size: originalBuf.length,
      gameVersion: info.version,
      versionName: info.versionName,
      engineVersion: info.engine,
      storyName: info.storyName,
    },
    versionSpec: spec ? {
      file: specPathUsed,
      verified: !!spec.verified,
      generic: specGeneric,
      engineVersion: spec.engineVersion || '',
      patches: patchReport,
      integrate: engineReport,
    } : { file: null, verified: false, generic: false, patches: patchReport },
    engine: engineReport,
    i10n: {
      file: i10nPath,
      sha256: i10nPayload ? sha256(Buffer.from(i10nPayload)) : '',
      size: i10nPayload ? Buffer.byteLength(i10nPayload) : 0,
      present: hasI10n(outText),
    },
    storage: {
      mode: storageBuild ? 'isolated' : 'shared',
      namespace: storageBuild ? storageBuild.namespace : '',
      tag: storageBuild ? 'neo-storage' : '',
    },
    pack: {
      mode: packMode,
      count: packItemsCount,
      files: args.packs.map(p => path.resolve(p)),
      sha256: packBuild ? packBuild.sha256 : '',
    },
    loader: {
      file: loaderPath,
      sha256: sha256(Buffer.from(loaderBundle)),
      size: Buffer.byteLength(loaderBundle),
      version: loaderVersion,
      tag: 'neo-loader',
    },
    anchor: { strategy: anchor.how, offset: anchor.index, warning: !!anchor.warning },
    output: {
      file: outPath,
      sha256: '',
      size: 0,
    },
    checks,
  };

  if (args.dryRun) {
    if (!args.quiet) {
      console.log('[dry-run] game      :', info.version || '(unknown)', '/ engine', info.engine || '(unknown)');
      console.log('[dry-run] spec      :', specPathUsed ? path.relative(ROOT, specPathUsed) + (specGeneric ? ' (generic)' : '') : '(none)');
      console.log('[dry-run] engine    :', engineReport.mode + (engineReport.pattern ? ' (' + engineReport.pattern + ')' : ''), '/ i10n', engineReport.i10n);
      console.log('[dry-run] anchor    :', anchor.how, '@', anchor.index, anchor.warning ? '(fallback)' : '');
      console.log('[dry-run] loader    :', 'v' + (loaderVersion.neo || '?'), '/ internal', loaderVersion.internal || '?');
      console.log('[dry-run] pack      :', packMode, packItemsCount);
      console.log('[dry-run] storage   :', storageBuild ? 'isolated (' + storageBuild.namespace + ')' : 'shared');
      console.log('[dry-run] would add :', fmt(injectBytes), '->', fmt(outBuf.length));
      console.log('[dry-run] output    :', outPath);
    }
    return 0;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, outBuf);
  manifest.output = { file: outPath, sha256: sha256(outBuf), size: outBuf.length };

  const manifestPath = path.resolve(args.manifest || outPath + '.manifest.json');
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  if (!args.quiet) {
    console.log('source    :', htmlPath, fmt(originalBuf.length), 'sha', originalSha.slice(0, 12));
    console.log('game      :', info.version || '(unknown)', info.versionName ? `(${info.versionName})` : '', '/ engine', info.engine || '(unknown)');
    console.log('spec      :', specPathUsed ? path.relative(ROOT, specPathUsed) + (specGeneric ? ' (generic, unverified)' : '') : '(none)');
    if (specGeneric) {
      console.log('warning   :', 'game version', info.version || '(unknown)', 'has no dedicated spec; generic anchors were used');
    }
    console.log('engine    :', engineReport.mode + (engineReport.pattern ? ' (' + engineReport.pattern + ')' : ''), '/ i10n', engineReport.i10n);
    console.log('patches   :', patchReport.length ? patchReport.map(p => `${p.id}=${p.status}`).join(', ') : '(none)');
    console.log('pack      :', packMode, packItemsCount ? `(${packItemsCount} items)` : '');
    console.log('storage   :', storageBuild ? 'isolated (' + storageBuild.namespace + ')' : 'shared (legacy mods may load)');
    console.log('loader    :', 'v' + (loaderVersion.neo || '?'), '/ internal', loaderVersion.internal || '?', fmt(Buffer.byteLength(loaderBundle)));
    console.log('anchor    :', anchor.how, '@', anchor.index, anchor.warning ? '(fallback warning)' : '');
    console.log('output    :', outPath, fmt(outBuf.length), 'delta', (manifest.checks.lengthDelta >= 0 ? '+' : '') + manifest.checks.lengthDelta,
      `(engine ${manifest.checks.engineDelta >= 0 ? '+' : ''}${manifest.checks.engineDelta}` +
      `, patch ${manifest.checks.patchDelta >= 0 ? '+' : ''}${manifest.checks.patchDelta}` +
      (manifest.checks.removedDelta ? `, strip ${manifest.checks.removedDelta}` : '') +
      `, loader +${manifest.checks.injectDelta})`);
    console.log('manifest  :', manifestPath);
    const failed = Object.entries(checks).filter(([k, v]) => typeof v === 'boolean' && !v);
    if (failed.length) {
      console.error('verify    : FAILED', failed.map(([k]) => k).join(', '));
      return 4;
    }
    console.log('verify    : prefix/suffix intact, loader once, engine boot hook, i10n present, version unchanged');
  }
  return 0;
}

const code = main();
process.exitCode = code;
