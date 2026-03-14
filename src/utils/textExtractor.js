// src/utils/textExtractor.js
// Extracts text from various file types using built-in Node.js modules only
// Supports: .txt, .pdf (basic), raw text

const fs = require('fs');
const path = require('path');

/**
 * Extract text from a plain text file
 */
function extractFromTxt(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Basic PDF text extraction without external libraries
 * Reads PDF binary and extracts readable text portions using regex
 * Not perfect but works for text-based PDFs
 */
function extractFromPdfBuffer(buffer) {
  const raw = buffer.toString('latin1');

  // Extract text between stream markers
  let text = '';
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamPattern.exec(raw)) !== null) {
    const chunk = match[1];
    // Extract readable ASCII text
    const readable = chunk.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    text += readable + '\n';
  }

  // Also try to extract text objects (Tj, TJ operators in PDF)
  const tjPattern = /\(((?:[^()\\]|\\[^])*)\)\s*Tj/g;
  let tjText = '';
  while ((match = tjPattern.exec(raw)) !== null) {
    const decoded = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
    tjText += decoded + ' ';
  }

  // TJ arrays
  const tjArrPattern = /\[([^\]]*)\]\s*TJ/g;
  while ((match = tjArrPattern.exec(raw)) !== null) {
    const inner = match[1];
    const strings = inner.match(/\(([^)]*)\)/g) || [];
    tjText += strings.map(s => s.slice(1, -1)).join('') + ' ';
  }

  const combined = (tjText.length > text.length ? tjText : text)
    .replace(/\s+/g, ' ')
    .trim();

  return combined || text;
}

/**
 * Extract text from uploaded file buffer
 * filetype: 'txt', 'pdf', or 'text' (raw)
 */
function extractText(buffer, filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  
  if (ext === 'pdf') {
    return extractFromPdfBuffer(buffer);
  } else {
    // txt, md, or any text format
    return buffer.toString('utf-8');
  }
}

/**
 * Extract text from raw string (for API/form inputs)
 */
function extractFromString(str) {
  return str || '';
}

module.exports = { extractText, extractFromString, extractFromPdfBuffer };
