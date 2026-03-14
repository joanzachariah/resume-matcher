# Resume Job Matcher

A **rule-based** Resume Parsing and Job Matching System built with vanilla Node.js. **No LLMs or AI APIs used** — all extraction and matching is done via regex, pattern matching, and a curated skill dictionary.

---

## Tech Stack

- **Runtime**: Node.js (zero npm dependencies for core logic)
- **Server**: Built-in `http` module
- **Parsing**: Regex, pattern matching, heuristics
- **Skill Extraction**: Curated dictionary of 100+ skills + alias normalization
- **UI**: Vanilla HTML/CSS/JS (single file, no frameworks)

---

## Features

- ✅ Resume parsing: name, email, phone, experience, skills, education
- ✅ JD parsing: salary, experience required, required vs optional skills
- ✅ Skill matching with normalized comparison (aliases, case-insensitive)
- ✅ Match score: `(matched JD skills / total JD skills) × 100`
- ✅ Match multiple JDs at once, ranked by score
- ✅ Web UI with skill-by-skill analysis
- ✅ REST API (JSON input/output)
- ✅ Docker support

---

## Project Structure

```
resume-matcher/
├── src/
│   ├── server.js                  # HTTP server + route handlers
│   ├── parsers/
│   │   ├── resumeParser.js        # Resume text parsing
│   │   └── jdParser.js            # JD text parsing
│   ├── matchers/
│   │   └── jobMatcher.js          # Skill matching + score calculation
│   └── utils/
│       ├── skillDictionary.js     # Skill list + aliases (100+ skills)
│       └── textExtractor.js       # Text extraction from buffers
├── public/
│   └── index.html                 # Web UI (single file)
├── sample-data/
│   └── sample-input.json          # Sample resume + JDs for testing
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Setup & Run

### Option 1: Run directly with Node.js

```bash
# Clone or download the project
cd resume-matcher

# Install dependencies (only express for optional enhancements — core runs without it)
npm install

# Start the server
node src/server.js

# Server runs at http://localhost:3000
```

### Option 2: Docker

```bash
# Build and run
docker-compose up --build

# Or manually
docker build -t resume-matcher .
docker run -p 3000:3000 resume-matcher
```

### Option 3: Deploy to Railway / Render / Fly.io

```bash
# Railway (free tier)
npm install -g @railway/cli
railway login
railway init
railway up

# Render: connect GitHub repo, set start command to: node src/server.js
# Fly.io: fly launch --now
```

---

## API Reference

### `POST /api/match` — Match resume against JDs

**Request (JSON):**
```json
{
  "resumeText": "John Doe\n...",
  "jds": [
    "Job Description 1 text...",
    "Job Description 2 text..."
  ]
}
```

**Response:**
```json
{
  "name": "John Doe",
  "email": "john.doe@email.com",
  "phone": "+1-555-0123",
  "yearOfExperience": 6,
  "education": ["B.S. Computer Science - State University (2018)"],
  "resumeSkills": ["Python", "Java", "Spring Boot", "React", "Docker", "Kubernetes"],
  "matchingJobs": [
    {
      "jobId": "JD001",
      "role": "Backend Developer",
      "salary": "$61,087 - $104,364",
      "requiredExperience": 7,
      "aboutRole": "...",
      "requiredSkills": ["Java", "Spring Boot", "Kafka"],
      "optionalSkills": ["Python", "Azure"],
      "skillsAnalysis": [
        { "skill": "Java", "presentInResume": true },
        { "skill": "Kafka", "presentInResume": true },
        { "skill": "Angular", "presentInResume": false }
      ],
      "matchingScore": 78,
      "matchedSkillsCount": 7,
      "totalJDSkills": 9
    }
  ],
  "generatedAt": "2025-01-01T12:00:00.000Z"
}
```

### `POST /api/parse-resume` — Parse resume only

```json
// Request
{ "resumeText": "..." }

// Response: parsed resume object
```

### `POST /api/parse-jd` — Parse JD only

```json
// Request
{ "jdText": "...", "jobId": "JD001" }

// Response: parsed JD object with salary, experience, skills
```

### `GET /api/health` — Health check

```json
{ "status": "ok", "service": "Resume Matcher", "version": "1.0.0" }
```

---

## Quick Test with curl

```bash
# Health check
curl http://localhost:3000/api/health

# Match resume against JDs
curl -X POST http://localhost:3000/api/match \
  -H "Content-Type: application/json" \
  -d @sample-data/sample-input.json

# Parse resume only
curl -X POST http://localhost:3000/api/parse-resume \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "John Doe\njohn@email.com\nPython, Java, Docker, AWS\n3 years of experience"}'
```

---

## How It Works (Rule-Based Logic)

### Skill Extraction
- Maintains a dictionary of **100+ skills** (languages, frameworks, databases, cloud, tools)
- Uses **regex word-boundary matching** to find skills in text
- Normalizes aliases: `"nodejs"` → `"Node.js"`, `"k8s"` → `"Kubernetes"`, etc.

### Salary Extraction
- Regex patterns for: `$120,000 - $145,000`, `12 LPA`, `₹10,00,000`, `$58/hour`
- Handles ranges, single values, Indian formats

### Experience Extraction
- Explicit mentions: `"5+ years of experience"`
- Date range calculation: extracts start/end years from work history, merges overlapping ranges
- Handles: `"Jan 2018 - Present"`, `"2018 - 2022"`, `"01/2018 - 12/2022"`

### Name Extraction
- Heuristic: first 15 lines, 2-4 title-cased words, no special characters or keywords

### Matching Score
```
Score = (Matched JD Skills / Total JD Skills) × 100
```
- Skill comparison uses normalized matching (case-insensitive, strips punctuation)
- Substring matching handles partial overlaps (e.g., `"Spring"` matches `"Spring Boot"`)

---

## Deployment Notes

| Platform | Command |
|----------|---------|
| Railway  | `railway up` |
| Render   | Connect repo, start: `node src/server.js` |
| Fly.io   | `fly launch --now` |
| Heroku   | `git push heroku main` |
| Docker   | `docker-compose up --build` |
| VPS      | `PORT=3000 node src/server.js` |

---

## Evaluation Criteria Coverage

| Criteria | Coverage |
|----------|----------|
| Extraction Accuracy (40%) | Salary, experience, skills extracted via regex + dictionary |
| Matching Logic (25%) | Formula-based score, skill-by-skill analysis |
| Code Quality (20%) | Modular: separate parsers, matchers, utils |
| Performance (10%) | No external calls, pure in-memory processing |
| Documentation (5%) | This README + inline comments |
| Bonus: API | ✅ REST API with 3 endpoints |
| Bonus: UI | ✅ Web UI with skill analysis visualization |
| Bonus: Docker | ✅ Dockerfile + docker-compose |
