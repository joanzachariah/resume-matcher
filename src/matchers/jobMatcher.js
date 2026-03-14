// src/matchers/jobMatcher.js
// Rule-based job matching logic - No LLMs used
// Uses set intersection for skill matching and weighted scoring

/**
 * Normalize a skill string for comparison
 */
function normalizeSkill(skill) {
  return skill.toLowerCase().replace(/[.\s\-_/]+/g, '').trim();
}

/**
 * Check if a resume skill matches a JD skill
 * Uses exact match + normalized match + substring match for compound skills
 */
function skillsMatch(resumeSkill, jdSkill) {
  const rNorm = normalizeSkill(resumeSkill);
  const jNorm = normalizeSkill(jdSkill);

  if (rNorm === jNorm) return true;
  if (rNorm.includes(jNorm) || jNorm.includes(rNorm)) return true;

  return false;
}

/**
 * Build skills analysis array showing which JD skills are present in resume
 * Formula: check each JD skill against all resume skills
 */
function buildSkillsAnalysis(jdSkills, resumeSkills) {
  return jdSkills.map(jdSkill => {
    const presentInResume = resumeSkills.some(rSkill => skillsMatch(rSkill, jdSkill));
    return {
      skill: jdSkill,
      presentInResume,
    };
  });
}

/**
 * Calculate matching score
 * Formula: (Matched JD Skills / Total JD Skills) × 100
 * Range: 0-100
 */
function calculateMatchingScore(skillsAnalysis) {
  if (!skillsAnalysis || skillsAnalysis.length === 0) return 0;
  const matched = skillsAnalysis.filter(s => s.presentInResume).length;
  const total = skillsAnalysis.length;
  return Math.round((matched / total) * 100);
}

/**
 * Match a parsed resume against an array of parsed JDs
 * Returns the full output JSON structure as per assignment spec
 */
function matchResumeToJobs(parsedResume, parsedJDs) {
  const matchingJobs = parsedJDs.map(jd => {
    const skillsAnalysis = buildSkillsAnalysis(jd.allSkills, parsedResume.resumeSkills);
    const matchingScore = calculateMatchingScore(skillsAnalysis);

    return {
      jobId: jd.jobId,
      role: jd.role,
      salary: jd.salary,
      requiredExperience: jd.yearOfExperience,
      aboutRole: jd.aboutRole,
      requiredSkills: jd.requiredSkills,
      optionalSkills: jd.optionalSkills,
      skillsAnalysis,
      matchingScore,
      matchedSkillsCount: skillsAnalysis.filter(s => s.presentInResume).length,
      totalJDSkills: skillsAnalysis.length,
    };
  });

  // Sort by matching score descending
  matchingJobs.sort((a, b) => b.matchingScore - a.matchingScore);

  return {
    name: parsedResume.name,
    email: parsedResume.email,
    phone: parsedResume.phone,
    yearOfExperience: parsedResume.yearOfExperience,
    education: parsedResume.education,
    resumeSkills: parsedResume.resumeSkills,
    matchingJobs,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { matchResumeToJobs, buildSkillsAnalysis, calculateMatchingScore };
