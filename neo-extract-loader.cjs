#!/usr/bin/env node
'use strict';

/**
 * neo-extract-loader: pull the embedded ModLoader Neo runtime (and the i10n engine
 * shim it depends on) out of a built game HTML so they can be reused as the
 * standalone payloads for neo-install.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;

function parseArgs(argv) {
  const args = {
    html: '',
    out: path.join(ROOT, 'dist', 'modloader-neo.slim.js'),
    i10nOut: path.join(ROOT, 'dist', 'i10n-sc2patch.js'),
    json: '',
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const need = () => {
      if (i + 1 >= argv.length) throw new Error('missing value for ' + a);
      return argv[++i];
    };
    switch (a) {
      case '--html': args.html = need(); break;
      case '--out': args.out = need(); break;
      case '--i10n-out': args.i10nOut = need(); break;
      case '--json': args.json = need(); break;
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

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function fmt(n) {
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv);
  } catch (e) {
    console.error('error:', e.message);
    return 2;
  }
  if (args.help || !args.html) {
    console.log('Usage: node neo-extract-loader.cjs --html <built.html> [--out <bundle.js>] [--i10n-out <i10n.js>] [--json <meta.json>]');
    return args.help ? 0 : 2;
  }

  const htmlPath = path.resolve(args.html);
  const buf = fs.readFileSync(htmlPath);
  const text = buf.toString('utf8');
  const marker = '// webpackBootstrap';
  const at = text.indexOf(marker);
  if (at < 0) {
    console.error('error: // webpackBootstrap not found');
    return 2;
  }
  const open = text.lastIndexOf('<script', at);
  const gt = text.indexOf('>', open);
  const close = text.indexOf('</script>', gt);
  if (open < 0 || gt < 0 || close < at) {
    console.error('error: loader script tag not found');
    return 2;
  }
  const bundle = text.slice(gt + 1, close);
  if (!bundle.includes('modSC2DataManager')) {
    console.error('error: nearest script is not the ModLoader bundle');
    return 2;
  }

  const i10nMarker = 'window.initI10n =';
  const i10nAt = text.indexOf(i10nMarker);
  let i10nBody = '';
  let i10nTagAt = -1;
  if (i10nAt >= 0) {
    i10nTagAt = text.lastIndexOf('<script', i10nAt);
    const i10nGt = text.indexOf('>', i10nTagAt);
    const i10nClose = text.indexOf('</script>', i10nGt);
    if (i10nTagAt >= 0 && i10nGt > i10nTagAt && i10nClose > i10nAt) {
      i10nBody = text.slice(i10nGt + 1, i10nClose);
    }
  }
  if (!i10nBody) {
    console.error('error: window.initI10n engine shim not found in', htmlPath);
    return 2;
  }
  if (/<\/script/i.test(i10nBody)) {
    console.error('error: i10n shim contains </script and cannot be embedded');
    return 2;
  }

  const neo = /get\s+neoVersion\(\)\s*\{\s*return\s*'([^']+)'/.exec(bundle);
  const internal = /get\s+version\(\)\s*\{\s*return\s*'([^']+)'/.exec(bundle);
  const game = /version\s*:\s*"([0-9]+(?:\.[0-9]+){2,3})"\s*,\s*versionName/.exec(text);
  const sd = text.indexOf('<tw-storydata');
  const tag = sd >= 0 ? text.slice(sd, text.indexOf('>', sd) + 1) : '';
  const engine = /format-version="([^"]+)"/.exec(tag);

  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  fs.writeFileSync(args.out, bundle, 'utf8');
  fs.mkdirSync(path.dirname(path.resolve(args.i10nOut)), { recursive: true });
  fs.writeFileSync(args.i10nOut, i10nBody, 'utf8');

  const meta = {
    schema: 'neo-payloads/2',
    extractedAt: new Date().toISOString(),
    source: {
      file: htmlPath,
      sha256: sha256(buf),
      size: buf.length,
      gameVersion: game ? game[1] : '',
      engineVersion: engine ? engine[1] : '',
    },
    loader: {
      file: path.resolve(args.out),
      sha256: sha256(Buffer.from(bundle)),
      size: Buffer.byteLength(bundle),
      version: internal ? internal[1] : '',
      neoVersion: neo ? neo[1] : '',
    },
    i10n: {
      file: path.resolve(args.i10nOut),
      sha256: sha256(Buffer.from(i10nBody)),
      size: Buffer.byteLength(i10nBody),
      id: 'i10n-sc2patch',
      offset: i10nTagAt,
    },
  };
  const jsonPath = path.resolve(args.json || args.out.replace(/\.js$/, '') + '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');

  console.log('source :', htmlPath, fmt(buf.length), 'game', meta.source.gameVersion || '?', 'engine', meta.source.engineVersion || '?');
  console.log('loader :', 'v' + (meta.loader.neoVersion || '?'), '/ internal', meta.loader.version || '?', fmt(meta.loader.size));
  console.log('i10n   :', meta.i10n.id, fmt(meta.i10n.size));
  console.log('output :', meta.loader.file, '|', meta.i10n.file);
  console.log('meta   :', jsonPath);
  return 0;
}

process.exitCode = main();
