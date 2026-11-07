#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const root = __dirname;
const repo = path.resolve(root, '..');
const distDir = path.join(root, 'dist');
const cssPath = path.join(root, 'gui-neo.css');
const templatePath = path.join(root, 'inject.js');
const bootPath = path.join(root, 'boot.json');
const outJs = path.join(distDir, 'ModLoaderNeoUI.js');
const outZip = path.join(repo, 'dist', 'ModLoaderNeoUI.mod.zip');

const css = fs.readFileSync(cssPath, 'utf8');
const template = fs.readFileSync(templatePath, 'utf8');
if (!template.includes('__NEO_CSS__')) throw new Error('inject.js is missing __NEO_CSS__');
const js = template.replace('__NEO_CSS__', JSON.stringify(css));
new vm.Script(js, { filename: outJs });

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(outJs, js, 'utf8');

fs.mkdirSync(path.dirname(outZip), { recursive: true });
if (fs.existsSync(outZip)) fs.rmSync(outZip, { force: true });

const q = p => "'" + p.replace(/'/g, "''") + "'";
const cmd = [
  'Add-Type -AssemblyName System.IO.Compression',
  'Add-Type -AssemblyName System.IO.Compression.FileSystem',
  `$zip = [System.IO.Compression.ZipFile]::Open(${q(outZip)}, [System.IO.Compression.ZipArchiveMode]::Create)`,
  `[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, ${q(bootPath)}, 'boot.json', [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null`,
  `[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, ${q(outJs)}, 'dist/ModLoaderNeoUI.js', [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null`,
  '$zip.Dispose()',
].join('; ');
execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { stdio: 'inherit' });

console.log('css  :', Buffer.byteLength(css), 'bytes');
console.log('js   :', outJs, Buffer.byteLength(js), 'bytes');
console.log('zip  :', outZip, fs.statSync(outZip).size, 'bytes');
