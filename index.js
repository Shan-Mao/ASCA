const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const port = Number(process.env.SERVER_PORT || process.env.PORT || 25798);
const publicRoot = path.resolve(__dirname, 'public');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function send(req, res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}

function isInside(root, target) {
  const relative = path.relative(root, target);
  return relative !== '' && relative !== '..'
    && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    send(req, res, 405, 'Method Not Allowed\n');
    return;
  }

  const rawPath = (req.url || '/').split('?', 1)[0];
  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    send(req, res, 400, 'Bad Request\n');
    return;
  }

  if (!pathname.startsWith('/') || pathname.includes('\0')) {
    send(req, res, 400, 'Bad Request\n');
    return;
  }

  // Check before normalization so encoded traversal cannot disappear into a safe-looking path.
  if (/%(?:2f|5c)/i.test(rawPath) || pathname.includes('\\') || pathname.includes(':')
    || pathname.split('/').some((segment) => segment === '.' || segment === '..')) {
    send(req, res, 403, 'Forbidden\n');
    return;
  }

  const normalizedPath = path.posix.normalize(pathname);
  if (normalizedPath === '/health') {
    send(req, res, 200, JSON.stringify({ status: 'ok' }), 'application/json; charset=utf-8');
    return;
  }

  const requestedPath = normalizedPath === '/' ? '/index.html' : normalizedPath;
  const filePath = path.resolve(publicRoot, `.${requestedPath}`);
  if (!isInside(publicRoot, filePath)) {
    send(req, res, 403, 'Forbidden\n');
    return;
  }

  try {
    const realRoot = await fs.realpath(publicRoot);
    const realFile = await fs.realpath(filePath);
    // A symlink inside public must not expose files outside the static root.
    if (!isInside(realRoot, realFile)) {
      send(req, res, 403, 'Forbidden\n');
      return;
    }

    const stats = await fs.stat(realFile);
    if (!stats.isFile()) {
      send(req, res, 404, 'Not Found\n');
      return;
    }

    const body = req.method === 'HEAD' ? undefined : await fs.readFile(realFile);
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(realFile).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body === undefined ? stats.size : body.length,
    });
    res.end(body);
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) {
      send(req, res, 404, 'Not Found\n');
    } else if (['EACCES', 'EPERM', 'ELOOP'].includes(error.code)) {
      send(req, res, 403, 'Forbidden\n');
    } else if (['EINVAL', 'ENAMETOOLONG'].includes(error.code)) {
      send(req, res, 400, 'Bad Request\n');
    } else {
      send(req, res, 500, 'Internal Server Error\n');
    }
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${server.address().port}`);
});
