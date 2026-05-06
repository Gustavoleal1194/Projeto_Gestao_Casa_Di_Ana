'use strict';
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { spawn } = require('child_process');

const PORT         = 7700;
const ROOT         = __dirname;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  const parsed = new URL(req.url, 'http://localhost');

  if (parsed.pathname === '/open') {
    const file = parsed.searchParams.get('file');
    if (!file) { res.writeHead(400); res.end('missing file'); return; }
    // file = 'docs/brain/04_MODULOS/FOO.md' → strip vault prefix → '04_MODULOS/FOO.md'
    const VAULT_PREFIX = 'docs/brain/';
    const fileInVault = file.startsWith(VAULT_PREFIX) ? file.slice(VAULT_PREFIX.length) : file;
    const uri = 'obsidian://open?vault=brain&file=' + encodeURIComponent(fileInVault);
    spawn('cmd.exe', ['/c', 'start', '', uri], { shell: false, stdio: 'ignore', detached: true }).unref();
    res.writeHead(204, { 'Access-Control-Allow-Origin': 'null' });
    res.end();
    return;
  }

  const filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  const file = path.join(ROOT, filePath);
  try {
    const data = fs.readFileSync(file);
    const ext  = path.extname(file);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'text/plain',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found: ' + filePath);
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log('[BrainOS] Servidor rodando em http://localhost:' + PORT);
  console.log('[BrainOS] Pressione Ctrl+C para parar.');
});
