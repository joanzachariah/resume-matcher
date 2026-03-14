# Resume Job Matcher

A **rule-based Resume Parsing and Job Matching system** built with Node.js.  
The system extracts information from resumes and job descriptions (skills, experience, salary, etc.) using **regex, heuristics, and a curated skill dictionary**, then calculates a **matching score** between resumes and jobs.

---
### Live Demo
https://resume-matcher-production-efa9.up.railway.app

## Tech Stack

- Node.js
- Built-in `http` module
- Regex & pattern matching
- Vanilla HTML/CSS/JS (frontend)

---

## Features

- Resume parsing: name, email, phone, experience, skills, education
- Job description parsing: salary, required experience, skills
- Skill matching with normalized comparison
- Match score calculation
- Match multiple job descriptions at once
- Simple web UI
- REST API endpoints

---

## Project Structure

```
resume-matcher/
├── src/
│   ├── server.js
│   ├── parsers/
│   │   ├── resumeParser.js
│   │   └── jdParser.js
│   ├── matchers/
│   │   └── jobMatcher.js
│   └── utils/
│       ├── skillDictionary.js
│       └── textExtractor.js
├── public/
│   └── index.html
├── sample-data/
│   └── sample-input.json
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Setup & Run

### 1. Clone the repository

```bash
git clone https://github.com/joanzachariah/resume-matcher.git
cd resume-matcher
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
node src/server.js
```

Server will run at:

```
http://localhost:3000
```

Open it in a browser to use the web interface.

---

## API Endpoints

### Match Resume with Job Descriptions

```
POST /api/match
```

Example request:

```json
{
  "resumeText": "Joan Zachariah\nPython, Java, Docker\n6 months experience",
  "jds": [
    "Backend Developer requiring Java and Spring Boot",
    "ML Engineer requiring Python and TensorFlow"
  ]
}
```

---

### Parse Resume Only

```
POST /api/parse-resume
```

Example:

```json
{
  "resumeText": "Joan Zachariah\nPython, Java, Docker"
}
```

---

### Parse Job Description Only

```
POST /api/parse-jd
```

Example:

```json
{
  "jdText": "Backend Developer with Java and Spring Boot",
  "jobId": "JD001"
}
```

---

## Quick Test

Health check:

```bash
curl http://localhost:3000/api/health
```

Match sample data:

```bash
curl -X POST http://localhost:3000/api/match \
-H "Content-Type: application/json" \
-d @sample-data/sample-input.json
```
