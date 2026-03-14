// src/server.js
// Main Express server - Resume Parsing & Job Matching System
// No LLMs used - Rule-based only

const http = require('http');
const fs = require('fs');
const path = require('path');
const { parseResume } = require('./parsers/resumeParser');
const { parseJD } = require('./parsers/jdParser');
const { matchResumeToJobs } = require('./matchers/jobMatcher');
const { extractText, extractFromString } = require('./utils/textExtractor');

const PORT = process.env.PORT || 3000;

// ─── Inline Multipart Parser (no multer needed) ─────────────────────────────
function parseMultipart(body, boundary) {
  const parts = {};
  const boundaryBuf = Buffer.from('--' + boundary);
  
  let start = 0;
  while (start < body.length) {
    const bIdx = indexOf(body, boundaryBuf, start);
    if (bIdx === -1) break;
    start = bIdx + boundaryBuf.length;
    if (body[start] === 0x2D && body[start + 1] === 0x2D) break; // --boundary--
    if (body[start] === 0x0D) start += 2; else if (body[start] === 0x0A) start++;

    // Read headers
    let headerEnd = indexOf(body, Buffer.from('\r\n\r\n'), start);
    if (headerEnd === -1) headerEnd = indexOf(body, Buffer.from('\n\n'), start);
    if (headerEnd === -1) break;
    
    const headerStr = body.slice(start, headerEnd).toString('utf-8');
    start = headerEnd + 4;

    // Get field name
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    if (!nameMatch) continue;

    const fieldName = nameMatch[1];
    const filename = filenameMatch ? filenameMatch[1] : null;

    // Find next boundary
    const nextBoundary = indexOf(body, boundaryBuf, start);
    const contentEnd = nextBoundary !== -1 ? nextBoundary - 2 : body.length;
    const content = body.slice(start, contentEnd);

    if (filename) {
      parts[fieldName] = { filename, buffer: content };
    } else {
      parts[fieldName] = content.toString('utf-8');
    }
    start = nextBoundary !== -1 ? nextBoundary : body.length;
  }
  return parts;
}

function indexOf(buf, search, offset = 0) {
  for (let i = offset; i <= buf.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}

// ─── Request body reader ─────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

async function handleMatch(req, res) {
  const bodyBuf = await readBody(req);
  const contentType = req.headers['content-type'] || '';
  
  let resumeText = '';
  let jdTexts = [];

  if (contentType.includes('multipart/form-data')) {
    const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
    if (!boundaryMatch) return sendError(res, 400, 'Missing boundary');
    const parts = parseMultipart(bodyBuf, boundaryMatch[1]);

    // Resume: file upload or raw text
    if (parts.resume && parts.resume.buffer) {
      resumeText = extractText(parts.resume.buffer, parts.resume.filename);
    } else if (parts.resumeText) {
      resumeText = extractFromString(parts.resumeText);
    }

    // JDs: can be jd0, jd1... or jdText0, jdText1...
    let i = 0;
    while (parts[`jd${i}`] || parts[`jdText${i}`]) {
      if (parts[`jd${i}`] && parts[`jd${i}`].buffer) {
        jdTexts.push(extractText(parts[`jd${i}`].buffer, parts[`jd${i}`].filename));
      } else if (parts[`jdText${i}`]) {
        jdTexts.push(extractFromString(parts[`jdText${i}`]));
      }
      i++;
    }
    // Also check for single JD
    if (i === 0 && (parts.jd || parts.jdText)) {
      const t = parts.jd && parts.jd.buffer
        ? extractText(parts.jd.buffer, parts.jd.filename)
        : extractFromString(parts.jdText);
      if (t) jdTexts.push(t);
    }

  } else if (contentType.includes('application/json')) {
    let body;
    try { body = JSON.parse(bodyBuf.toString('utf-8')); } 
    catch (e) { return sendError(res, 400, 'Invalid JSON'); }
    resumeText = extractFromString(body.resumeText || body.resume);
    jdTexts = Array.isArray(body.jds) ? body.jds.map(extractFromString) 
                                       : (body.jdText ? [extractFromString(body.jdText)] : []);
  } else {
    return sendError(res, 415, 'Unsupported Content-Type. Use multipart/form-data or application/json');
  }

  if (!resumeText.trim()) return sendError(res, 400, 'Resume text is required');
  if (jdTexts.length === 0) return sendError(res, 400, 'At least one Job Description is required');

  // Parse resume
  const parsedResume = parseResume(resumeText);

  // Parse all JDs
  const parsedJDs = jdTexts.map((jdText, idx) => parseJD(jdText, `JD${String(idx + 1).padStart(3, '0')}`));

  // Match
  const result = matchResumeToJobs(parsedResume, parsedJDs);

  sendJSON(res, 200, result);
}

async function handleParseResume(req, res) {
  const bodyBuf = await readBody(req);
  const contentType = req.headers['content-type'] || '';
  let text = '';

  if (contentType.includes('multipart/form-data')) {
    const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
    const parts = parseMultipart(bodyBuf, boundaryMatch[1]);
    text = parts.resume && parts.resume.buffer
      ? extractText(parts.resume.buffer, parts.resume.filename)
      : extractFromString(parts.resumeText);
  } else {
    const body = JSON.parse(bodyBuf.toString('utf-8'));
    text = extractFromString(body.resumeText || body.text);
  }

  if (!text.trim()) return sendError(res, 400, 'Resume text is required');
  sendJSON(res, 200, parseResume(text));
}

async function handleParseJD(req, res) {
  const bodyBuf = await readBody(req);
  const body = JSON.parse(bodyBuf.toString('utf-8'));
  const text = extractFromString(body.jdText || body.text);
  const jobId = body.jobId || 'JD001';
  if (!text.trim()) return sendError(res, 400, 'JD text is required');
  sendJSON(res, 200, parseJD(text, jobId));
}

function sendJSON(res, status, data) {
  const json = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(json);
}

function sendError(res, status, message) {
  sendJSON(res, status, { error: message });
}

function serveStatic(res, filePath, contentType) {
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  try {
    // API Routes
    if (method === 'POST' && url === '/api/match') return await handleMatch(req, res);
    if (method === 'POST' && url === '/api/parse-resume') return await handleParseResume(req, res);
    if (method === 'POST' && url === '/api/parse-jd') return await handleParseJD(req, res);

    // Health check
    if (method === 'GET' && url === '/api/health') {
      return sendJSON(res, 200, { status: 'ok', service: 'Resume Matcher', version: '1.0.0' });
    }

    // Serve static files
    const publicDir = path.join(__dirname, '..', 'public');
    if (method === 'GET' && (url === '/' || url === '/index.html')) {
      return serveStatic(res, path.join(publicDir, 'index.html'), 'text/html');
    }
    if (url.startsWith('/public/')) {
      const filePath = path.join(__dirname, '..', url);
      const ext = path.extname(url);
      const types = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html' };
      return serveStatic(res, filePath, types[ext] || 'text/plain');
    }

    res.writeHead(404);
    res.end('Not Found');
  } catch (err) {
    console.error('Server error:', err);
    sendError(res, 500, 'Internal server error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Resume Matcher running at http://localhost:${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   POST /api/match       - Match resume against JDs`);
  console.log(`   POST /api/parse-resume - Parse resume only`);
  console.log(`   POST /api/parse-jd    - Parse JD only`);
  console.log(`   GET  /api/health      - Health check`);
  console.log(`   GET  /                - Web UI\n`);
});

module.exports = server;
