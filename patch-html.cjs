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

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('Usage: node patch-html.cjs [--html <source.html>] [--bundle <js>] [--out <target.html>]');
    return;
  }

  for (const p of [args.html, args.bundle]) {
    if (!fs.existsSync(p)) throw new Error('not found: ' + p);
  }

  const src = fs.readFileSync(args.html);
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

  console.log('source   :', args.html, src.length, 'bytes');
  console.log('bundle   :', args.bundle, Buffer.byteLength(bundleText), 'bytes');
  console.log('output   :', args.out, next.length, 'bytes');
  console.log('delta    :', next.length - src.length, 'bytes');
  console.log('prefix sha:', sha(src.slice(0, loc.contentStart)) === sha(next.slice(0, check.contentStart)) ? 'same' : 'CHANGED');
  console.log('suffix sha:', sha(src.slice(loc.close)) === sha(next.slice(check.close)) ? 'same' : 'CHANGED');
  console.log('embedded :', 'verified');
}

main();
