#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DEFAULT_HTML, locateBundle } = require('./lib.cjs');

const ROOT = __dirname;

function parseArgs(argv) {
  const args = {
    html: DEFAULT_HTML,
    bundle: path.join(ROOT, 'dist', 'modloader-neo.slim.js'),
    out: path.join(ROOT, '..', '游戏本体', 'Degrees of Lewdity.neo.html'),
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--html') args.html = argv[++i];
    else if (a === '--bundle') args.bundle = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error('unknown argument: ' + a);
  }
  return args;
}

function sha(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const GAME_PATCHES = [
  {
    name: 'importSave empty-file guard',
    search: 'function importSave(saveFile) {\n\t\tif (!window.FileReader) return; // Browser is not compatible\n\n\t\tconst reader = new FileReader();',
    replace: 'function importSave(saveFile) {\n\t\tif (!window.FileReader) return; // Browser is not compatible\n\t\tif (!saveFile || !saveFile.length || !saveFile[0] || typeof saveFile[0].size !== "number") return; // no file selected\n\n\t\tconst reader = new FileReader();',
    already: 'if (!saveFile || !saveFile.length || !saveFile[0] || typeof saveFile[0].size !== "number") return;',
  },
  {
    name: 'importSettings empty-file guard',
    search: '\t\tcase "file":\n\t\t\treader = new FileReader();',
    replace: '\t\tcase "file":\n\t\t\tif (!data || !data.length || !data[0] || typeof data[0].size !== "number") break; // no file selected\n\t\t\treader = new FileReader();',
    already: 'if (!data || !data.length || !data[0] || typeof data[0].size !== "number") break;',
  },
];

function applyGamePatches(buf) {
  let current = buf;
  const report = [];
  for (const patch of GAME_PATCHES) {
    const search = Buffer.from(patch.search, 'utf8');
    const replace = Buffer.from(patch.replace, 'utf8');
    if (current.indexOf(Buffer.from(patch.already, 'utf8')) >= 0) {
      report.push(patch.name + ' (already applied)');
      continue;
    }
    const at = current.indexOf(search);
    if (at < 0) {
      throw new Error('game patch not found: ' + patch.name);
    }
    if (current.indexOf(search, at + search.length) >= 0) {
      throw new Error('game patch is not unique: ' + patch.name);
    }
    current = Buffer.concat([
      current.slice(0, at),
      replace,
      current.slice(at + search.length),
    ]);
    report.push(patch.name);
  }
  return { buf: current, patches: report };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('Usage: node patch-html.cjs [--html <source.html>] [--bundle <js>] [--out <target.html>]');
    return;
  }

  for (const p of [args.html, args.bundle]) {
    if (!fs.existsSync(p)) throw new Error('not found: ' + p);
  }

  const original = fs.readFileSync(args.html);
  const patched = applyGamePatches(original);
  const src = patched.buf;
  const bundleText = fs.readFileSync(args.bundle, 'utf8');
  if (/<\/script/i.test(bundleText)) throw new Error('bundle contains </script and cannot be embedded safely');

  const loc = locateBundle(src);
  const next = Buffer.concat([
    src.slice(0, loc.contentStart),
    Buffer.from(bundleText, 'utf8'),
    src.slice(loc.close),
  ]);

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, next);

  const check = locateBundle(next);
  const written = next.slice(check.contentStart, check.close).toString('utf8');
  if (written !== bundleText) throw new Error('verification failed: embedded bundle differs');

  console.log('source   :', args.html, original.length, 'bytes');
  console.log('game fix :', patched.patches.join(', '));
  console.log('patched  :', src.length, 'bytes');
  console.log('bundle   :', args.bundle, Buffer.byteLength(bundleText), 'bytes');
  console.log('output   :', args.out, next.length, 'bytes');
  console.log('delta    :', next.length - original.length, 'bytes');
  console.log('prefix sha:', sha(src.slice(0, loc.contentStart)) === sha(next.slice(0, check.contentStart)) ? 'same' : 'CHANGED');
  console.log('suffix sha:', sha(src.slice(loc.close)) === sha(next.slice(check.close)) ? 'same' : 'CHANGED');
  console.log('embedded :', 'verified');
}

main();
