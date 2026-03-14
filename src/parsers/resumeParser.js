// src/parsers/resumeParser.js
// Rule-based Resume parser - No LLMs used
// Uses regex patterns, keyword matching, and heuristics

const { extractSkills, extractSalary } = require('./jdParser');

/**
 * Extract candidate name from resume text
 * Heuristic: usually in first few lines, title-cased, no keywords
 */
function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 15);

  const skipWords = [
    'resume', 'curriculum', 'vitae', 'cv', 'profile', 'summary', 'objective',
    'experience', 'education', 'skills', 'contact', 'email', 'phone', 'address',
    'linkedin', 'github', 'portfolio', 'www', 'http'
  ];

  for (const line of lines) {
    if (line.length < 3 || line.length > 50) continue;
    const lower = line.toLowerCase();
    if (skipWords.some(w => lower.includes(w))) continue;
    if (/^\d/.test(line)) continue; // starts with number
    if (/@/.test(line)) continue; // email
    if (/[|•\-–—]/.test(line)) continue; // has separators (likely not a name)

    // Check if it looks like a name: title-case words, 2-4 words
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      const isNameLike = words.every(w =>
        /^[A-Z][a-z]+$/.test(w) || /^[A-Z]+$/.test(w) || /^[A-Z][a-z]+\.?$/.test(w)
      );
      if (isNameLike) return line;
    }
  }

  // Fallback: first line that looks like a name
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 40 && /^[A-Z]/.test(line) && !/\d/.test(line)) {
      return line;
    }
  }
  return "Unknown Candidate";
}

/**
 * Extract email from resume
 */
function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

/**
 * Extract phone from resume
 */
function extractPhone(text) {
  const patterns = [
    /\+?[\d\s\-().]{10,15}/,
    /\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/,
    /\+\d{1,3}[\s\-]?\d{5,12}/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].trim();
  }
  return null;
}

/**
 * Extract years of experience from resume
 * Strategy:
 * 1. Look for explicit "X years of experience" statements
 * 2. Calculate from date ranges in work experience section
 * 3. Fallback to 0
 */
function extractExperience(text) {
  // Explicit mention
  const explicit = [
    /(\d+)\s*\+?\s*years?\s*of\s*(?:total\s*)?(?:professional\s*)?(?:work\s*)?experience/i,
    /(?:total|overall)\s*(?:work\s*)?experience\s*(?:of|:)?\s*(\d+)\s*\+?\s*years?/i,
    /(\d+(?:\.\d+)?)\s*years?\s*(?:of\s*)?(?:industry|professional|work|hands.?on)\s*experience/i,
  ];
  for (const p of explicit) {
    const m = text.match(p);
    if (m) return parseFloat(m[1]);
  }

  // Date range extraction
  // Matches: Jan 2018 - Dec 2022, 2018 - 2022, 01/2018 - 12/2022, etc.
  const dateRangePatterns = [
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})\s*(?:–|-|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(\d{4}|present|current|now)/gi,
    /(\d{4})\s*(?:–|-|to)\s*(\d{4}|present|current|now)/gi,
    /(\d{2})\/(\d{4})\s*(?:–|-|to)\s*(?:\d{2}\/)?(\d{4}|present|current)/gi,
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  let totalMonths = 0;
  const ranges = [];

  for (const pattern of dateRangePatterns) {
    let match;
    const textCopy = text;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(textCopy)) !== null) {
      const groups = match.slice(1);
      let startYear, endYear;

      // Find years in groups
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        if (!g) continue;
        const isPresent = /present|current|now/i.test(g);
        const year = isPresent ? currentYear : parseInt(g);
        if (!isNaN(year) && year > 1980 && year <= currentYear + 1) {
          if (!startYear) startYear = year;
          else if (year >= startYear) endYear = year;
        }
        if (isPresent) endYear = currentYear;
      }

      if (startYear && endYear) {
        ranges.push([startYear, endYear]);
      }
    }
  }

  if (ranges.length > 0) {
    // Sort and calculate non-overlapping total experience
    ranges.sort((a, b) => a[0] - b[0]);
    let merged = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const last = merged[merged.length - 1];
      if (ranges[i][0] <= last[1]) {
        last[1] = Math.max(last[1], ranges[i][1]);
      } else {
        merged.push(ranges[i]);
      }
    }
    let years = 0;
    for (const [s, e] of merged) years += (e - s);
    if (years > 0 && years < 50) return Math.round(years * 10) / 10;
  }

  return null;
}

/**
 * Extract education from resume
 */
function extractEducation(text) {
  const degrees = [];
  const degreePattern = /(?:B\.?S\.?|B\.?E\.?|B\.?Tech\.?|M\.?S\.?|M\.?E\.?|M\.?Tech\.?|MBA|Ph\.?D\.?|Bachelor'?s?|Master'?s?|Doctorate)[^\n]{0,80}/gi;
  let match;
  while ((match = degreePattern.exec(text)) !== null) {
    degrees.push(match[0].trim());
    if (degrees.length >= 3) break;
  }
  return degrees;
}

/**
 * Main resume parser
 */
function parseResume(text) {
  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const yearOfExperience = extractExperience(text);
  const resumeSkills = extractSkills(text);
  const education = extractEducation(text);

  return {
    name,
    email,
    phone,
    yearOfExperience,
    resumeSkills,
    education,
  };
}

module.exports = { parseResume };
