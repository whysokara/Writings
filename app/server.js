// Local-only webapp wrapper around the /write pipeline.
// No npm dependencies: built-in http/fs/path/child_process only.
// Never calls any model API directly — "Generate" shells out to the same
// `claude -p "/write <basename>"` invocation the terminal /write command uses,
// so it rides the Claude Code subscription login rather than metered API credits.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 5757;
const HOST = '127.0.0.1';

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PUBLISHED_DIR = path.join(ROOT, 'Published');
const DRAFT_DIR = path.join(ROOT, 'Draft');
const FINAL_DIR = path.join(ROOT, 'Final');

const STATIC_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function sanitizeBasename(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  if (!name) return null;
  if (name.includes('/') || name.includes('\\') || name.includes('\0') || name.includes('..')) {
    return null;
  }
  return name;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
}

function sendText(res, status, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5_000_000) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function listTxtBasenames(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.txt'))
    .map((f) => f.slice(0, -4))
    .sort((a, b) => a.localeCompare(b));
}

function listFinalGrouped() {
  if (!fs.existsSync(FINAL_DIR)) return {};
  const files = fs.readdirSync(FINAL_DIR).filter((f) => f.endsWith('.md'));
  const groups = {};
  for (const f of files) {
    const m = f.match(/^(.*)_v(\d+)\.md$/);
    if (!m) continue;
    const [, basename, num] = m;
    if (!groups[basename]) groups[basename] = [];
    groups[basename].push({ file: f, version: parseInt(num, 10) });
  }
  for (const basename of Object.keys(groups)) {
    groups[basename].sort((a, b) => b.version - a.version);
  }
  return groups;
}

function highestFinalVersion(basename) {
  const groups = listFinalGrouped();
  const entries = groups[basename];
  if (!entries || entries.length === 0) return null;
  return entries[0].file;
}

async function serveStatic(req, res, urlPath) {
  const rel = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(PUBLIC_DIR, rel);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendText(res, 403, 'Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) return sendText(res, 404, 'Not found');
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': STATIC_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function handleGenerate(req, res, query) {
  const basename = sanitizeBasename(query.get('basename'));
  if (!basename) return sendJson(res, 400, { error: 'Invalid or missing basename' });

  const draftPath = path.join(DRAFT_DIR, `${basename}.txt`);
  if (!fs.existsSync(draftPath)) {
    return sendJson(res, 404, { error: `Draft/${basename}.txt does not exist` });
  }
  if (fs.readFileSync(draftPath, 'utf8').trim() === '') {
    return sendJson(res, 400, { error: `Draft/${basename}.txt is empty` });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send('log', { line: `Running /write "${basename}" ...` });

  const proc = spawn('claude', ['-p', `/write ${basename}`], { cwd: ROOT });

  const forwardLines = (chunk, prefix) => {
    const text = chunk.toString('utf8');
    for (const line of text.split(/\r?\n/)) {
      if (line.length === 0) continue;
      send('log', { line: prefix ? `${prefix}${line}` : line });
    }
  };

  proc.stdout.on('data', (chunk) => forwardLines(chunk, ''));
  proc.stderr.on('data', (chunk) => forwardLines(chunk, '[stderr] '));

  proc.on('error', (err) => {
    send('error', { message: err.message });
    res.end();
  });

  proc.on('close', (code) => {
    const finalFile = highestFinalVersion(basename);
    if (code !== 0) {
      send('error', { message: `claude exited with code ${code}` });
    } else if (!finalFile) {
      send('error', { message: 'Generation finished but no Final/ file was found' });
    } else {
      send('done', { file: finalFile });
    }
    res.end();
  });

  req.on('close', () => {
    if (!proc.killed) proc.kill();
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;

    // --- Published (read-only) ---
    if (pathname === '/api/published' && req.method === 'GET') {
      return sendJson(res, 200, listTxtBasenames(PUBLISHED_DIR));
    }
    let m = pathname.match(/^\/api\/published\/(.+)$/);
    if (m && req.method === 'GET') {
      const name = sanitizeBasename(decodeURIComponent(m[1]));
      if (!name) return sendJson(res, 400, { error: 'Invalid name' });
      const filePath = path.join(PUBLISHED_DIR, `${name}.txt`);
      if (!fs.existsSync(filePath)) return sendJson(res, 404, { error: 'Not found' });
      return sendText(res, 200, fs.readFileSync(filePath, 'utf8'));
    }

    // --- Drafts (read/write) ---
    if (pathname === '/api/drafts' && req.method === 'GET') {
      return sendJson(res, 200, listTxtBasenames(DRAFT_DIR));
    }
    m = pathname.match(/^\/api\/drafts\/(.+)$/);
    if (m && req.method === 'GET') {
      const name = sanitizeBasename(decodeURIComponent(m[1]));
      if (!name) return sendJson(res, 400, { error: 'Invalid name' });
      const filePath = path.join(DRAFT_DIR, `${name}.txt`);
      const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
      return sendText(res, 200, content);
    }
    if (m && req.method === 'PUT') {
      const name = sanitizeBasename(decodeURIComponent(m[1]));
      if (!name) return sendJson(res, 400, { error: 'Invalid name' });
      const body = await readBody(req);
      fs.mkdirSync(DRAFT_DIR, { recursive: true });
      fs.writeFileSync(path.join(DRAFT_DIR, `${name}.txt`), body, 'utf8');
      return sendJson(res, 200, { ok: true });
    }

    // --- Final (read-only, generated) ---
    if (pathname === '/api/final' && req.method === 'GET') {
      return sendJson(res, 200, listFinalGrouped());
    }
    m = pathname.match(/^\/api\/final\/(.+)$/);
    if (m && req.method === 'GET') {
      const filename = decodeURIComponent(m[1]);
      if (
        filename.includes('/') ||
        filename.includes('\\') ||
        filename.includes('..') ||
        !filename.endsWith('.md')
      ) {
        return sendJson(res, 400, { error: 'Invalid filename' });
      }
      const filePath = path.join(FINAL_DIR, filename);
      if (!fs.existsSync(filePath)) return sendJson(res, 404, { error: 'Not found' });
      return sendText(res, 200, fs.readFileSync(filePath, 'utf8'));
    }

    // --- Generate (SSE) ---
    if (pathname === '/api/generate' && req.method === 'GET') {
      return handleGenerate(req, res, url.searchParams);
    }

    // --- Static frontend ---
    if (req.method === 'GET') {
      return serveStatic(req, res, pathname);
    }

    return sendText(res, 404, 'Not found');
  } catch (err) {
    console.error(err);
    return sendText(res, 500, 'Internal error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Writings app running at http://${HOST}:${PORT}`);
});
