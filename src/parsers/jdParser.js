// src/parsers/jdParser.js
// Rule-based Job Description parser - No LLMs used
// Uses regex patterns and keyword matching only

const { SKILLS_DICTIONARY, SKILL_ALIASES } = require('../utils/skillDictionary');

/**
 * Extract salary from JD text using regex patterns
 * Handles formats like: $120,000, 12 LPA, ₹10,00,000, $58.65/hour
 */
function extractSalary(text) {
  const patterns = [
    // Range with $ sign: $120,000 - $145,000 or $58.65/hour to $181,000/year
    /\$[\d,]+(?:\.\d+)?(?:\/(?:hour|hr|year|yr|annum))?\s*(?:-|to|–|—)\s*\$[\d,]+(?:\.\d+)?(?:\/(?:hour|hr|year|yr|annum))?/gi,
    // LPA format
    /\d+(?:\.\d+)?\s*(?:LPA|lpa|L\.P\.A)/gi,
    // CTC format
    /CTC\s*[:=]?\s*[₹$]?\s*[\d,]+(?:\.\d+)?(?:\s*(?:per annum|PA|LPA|lakh|lac))?/gi,
    // Indian rupee
    /₹\s*[\d,]+(?:\.\d+)?(?:\s*(?:per annum|PA|lakhs?|lacs?))?/gi,
    // Labeled range with numbers only: "pay range: 61087 - 104364"
    /(?:base (?:compensation|salary|pay)|pay range|salary range|compensation range)\s*(?:for[^:]*)?[:\s]*(\$?[\d,]+(?:\.\d+)?\s*(?:-|to|–)\s*\$?[\d,]+(?:\.\d+)?)/gi,
    // Single $ amount with qualifier
    /\$[\d,]+(?:\.\d+)?(?:\s*(?:\/hour|\/hr|\/year|per year|annually|per annum))/gi,
    // Single $ amount (fallback)
    /\$[\d,]+(?:\.\d+)?/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      // For capturing-group patterns, prefer group 1 if it's a clean range
      const val = (match[1] && /\d/.test(match[1])) ? match[1] : match[0];
      return val.trim().replace(/\s+/g, ' ');
    }
  }

  return null;
}

/**
 * Extract years of experience from JD text
 * Handles: "5+ years", "3-5 years", "Bachelor's with 5+ years", "fresher", etc.
 */
function extractExperience(text) {
  const fresherPattern = /\b(fresher|entry.?level|0\s*(?:\+|years?)|no experience)\b/i;
  if (fresherPattern.test(text)) return 0;

  const patterns = [
    // "5+ years of experience"
    /(\d+)\s*\+\s*years?\s*of\s*(?:relevant\s*)?experience/i,
    // "5-7 years"
    /(\d+)\s*(?:-|to|–)\s*(\d+)\s*\+?\s*years?\s*of\s*(?:relevant\s*)?experience/i,
    // "minimum X years"
    /(?:minimum|min\.?|at least)\s*(\d+)\s*years?/i,
    // "X+ years"
    /(\d+)\s*\+\s*years?\s*(?:of\s*)?(?:experience|exp)/i,
    // Generic "X years"
    /(\d+)\s*years?\s*of\s*(?:relevant\s*)?(?:experience|exp|hands.?on)/i,
    // "Bachelor's with X+ years"
    /bachelor'?s?\s+with\s+(\d+)\s*\+?\s*years?/i,
    // "Master's with X+ years"
    /master'?s?\s+with\s+(\d+)\s*\+?\s*years?/i,
  ];

  let maxYears = null;
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseFloat(match[2] || match[1]);
      if (!maxYears || years > maxYears) maxYears = years;
    }
  }
  return maxYears;
}

/**
 * Extract role/title from JD text
 */
function extractRole(text) {
  const lines = text.split('\n').slice(0, 30); // check first 30 lines
  const titlePatterns = [
    /^(?:position|job title|role|title)\s*:?\s*(.+)/i,
    /^((?:senior|junior|mid|lead|principal|staff)?\s*(?:software|full.?stack|backend|frontend|data|ml|devops|cloud|security|embedded|systems?)\s+engineer(?:ing)?)/im,
    /^(software engineer.*)/im,
  ];
  for (const line of lines) {
    const trimmed = line.trim();
    for (const pattern of titlePatterns) {
      const match = trimmed.match(pattern);
      if (match && match[1] && match[1].length < 80) {
        return match[1].trim();
      }
    }
  }
  // fallback: first non-empty, non-boilerplate line
  for (const line of lines) {
    const t = line.trim();
    if (t.length > 5 && t.length < 80 && !/^(our|the|at |about|overview|who we|join)/i.test(t)) {
      return t;
    }
  }
  return "Software Engineer";
}

/**
 * Extract about/summary from JD text
 */
function extractAboutRole(text) {
  const patterns = [
    /(?:position overview|job description|about the role|the opportunity|overview)\s*[:\n]+([^\n]{50,300})/i,
    /(?:we are seeking|we're seeking|seeking a|looking for a)[^\n]{20,200}/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].replace(/\n/g, ' ').trim().slice(0, 300) + (m[0].length > 300 ? '...' : '');
  }
  // Return first meaningful paragraph
  const paras = text.split(/\n\n+/);
  for (const para of paras) {
    const t = para.trim();
    if (t.length > 80 && t.length < 400) return t.replace(/\n/g, ' ');
  }
  return text.slice(0, 250).replace(/\n/g, ' ') + '...';
}

/**
 * Determine if a skill is in the required vs optional/desired section
 */
function classifySkills(text, skills) {
  const requiredSkills = [];
  const optionalSkills = [];

  // Split text into required vs optional sections
  const requiredSection = extractSection(text, [
    'required', 'must have', 'basic qualifications', 'minimum qualifications',
    'required qualifications', 'required skills', 'what you need', 'key requirements'
  ]);
  const optionalSection = extractSection(text, [
    'preferred', 'desired', 'nice to have', 'good to have', 'bonus', 'optional',
    'desired qualifications', 'preferred qualifications', 'desired skills', 'desired multipliers'
  ]);

  for (const skill of skills) {
    const skillLower = skill.toLowerCase();
    const inRequired = requiredSection && requiredSection.toLowerCase().includes(skillLower);
    const inOptional = optionalSection && optionalSection.toLowerCase().includes(skillLower);

    if (inOptional && !inRequired) {
      optionalSkills.push(skill);
    } else {
      requiredSkills.push(skill);
    }
  }

  return { requiredSkills, optionalSkills };
}

function extractSection(text, headers) {
  const headerPattern = new RegExp(
    `(${headers.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'i'
  );
  const match = text.match(headerPattern);
  if (!match) return '';
  const start = match.index;
  const nextSection = text.slice(start + match[0].length).match(
    /\n(?:required|preferred|desired|qualifications|responsibilities|about|overview|minimum|basic|additional|other)/i
  );
  const end = nextSection ? start + match[0].length + nextSection.index : start + 1000;
  return text.slice(start, Math.min(end, text.length));
}

/**
 * Core skill extraction using regex matching against skill dictionary
 * No LLMs — pure pattern/dictionary matching
 */
function extractSkills(text) {
  const foundSkills = new Set();
  const normalizedText = text.toLowerCase();

  for (const skill of SKILLS_DICTIONARY) {
    // Build regex: match whole word or phrase
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
    if (pattern.test(normalizedText)) {
      foundSkills.add(skill);
    }
  }

  // Check aliases
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
    if (pattern.test(normalizedText)) {
      foundSkills.add(canonical);
    }
  }

  return [...foundSkills];
}

/**
 * Main JD parser function
 */
function parseJD(text, jobId) {
  const salary = extractSalary(text);
  const yearOfExperience = extractExperience(text);
  const role = extractRole(text);
  const aboutRole = extractAboutRole(text);
  const allSkills = extractSkills(text);
  const { requiredSkills, optionalSkills } = classifySkills(text, allSkills);

  return {
    jobId,
    role,
    aboutRole,
    salary,
    yearOfExperience,
    requiredSkills,
    optionalSkills,
    allSkills,
  };
}

module.exports = { parseJD, extractSkills, extractSalary, extractExperience };
