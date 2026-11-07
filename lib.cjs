'use strict';

const DEFAULT_HTML = 'E:\\DoL-ModLoader-0.5.12.13-v2.101.1\\Degrees of Lewdity.html';

function locateBundle(buf) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('locateBundle expects a Buffer');
  const marker = Buffer.from('// webpackBootstrap', 'ascii');
  const b = buf.indexOf(marker);
  if (b < 0) throw new Error('webpackBootstrap not found');
  const open = buf.lastIndexOf(Buffer.from('<script', 'ascii'), b);
  if (open < 0) throw new Error('<script before webpackBootstrap not found');
  const gt = buf.indexOf(0x3e, open);
  if (gt < 0) throw new Error('script tag is not closed');
  const contentStart = gt + 1;
  const close = buf.indexOf(Buffer.from('</script>', 'ascii'), contentStart);
  if (close < 0) throw new Error('bundle </script> not found');
  return { open, gt, contentStart, close };
}

function readBundleText(htmlPath) {
  const fs = require('fs');
  const buf = fs.readFileSync(htmlPath);
  const loc = locateBundle(buf);
  return { buf, loc, text: buf.slice(loc.contentStart, loc.close).toString('utf8') };
}

module.exports = { DEFAULT_HTML, locateBundle, readBundleText };
