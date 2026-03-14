// src/utils/skillDictionary.js
// Comprehensive rule-based skill dictionary - no LLMs used

const SKILLS_DICTIONARY = [
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#", "Ruby", "Go", "Rust",
  "Swift", "Kotlin", "PHP", "Scala", "R", "MATLAB", "Fortran", "Perl", "Bash", "Shell",
  "PowerShell", "Groovy", "Elixir", "Haskell", "Clojure", "Lua", "Dart", "Julia",

  // Frontend
  "React", "Angular", "AngularJS", "Vue", "Vue.js", "jQuery", "HTML", "CSS", "SASS",
  "LESS", "Bootstrap", "Tailwind", "Webpack", "Vite", "Next.js", "Nuxt.js", "Svelte",
  "Redux", "MobX", "GraphQL", "REST", "AJAX",

  // Backend
  "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Spring Boot", "Laravel",
  "Rails", "ASP.NET", ".NET", "Hibernate", "Maven", "Gradle", "Microservices",

  // Databases
  "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", "SQL Server", "MSSQL",
  "Cassandra", "DynamoDB", "Elasticsearch", "ElasticSearch", "Firebase", "Neo4j",
  "MariaDB", "CouchDB", "InfluxDB", "Kibana", "Logstash",

  // Cloud & DevOps
  "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "GitLab",
  "GitHub", "CI/CD", "Terraform", "Ansible", "Chef", "Puppet", "Helm", "ArgoCD",
  "CircleCI", "Travis CI", "Linux", "Unix", "Nginx", "Apache",

  // Data & ML
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras", "scikit-learn",
  "Pandas", "NumPy", "Matplotlib", "Spark", "Hadoop", "Kafka", "Airflow", "Databricks",
  "Power BI", "Tableau", "Data Pipeline", "ETL", "NLP", "Computer Vision",

  // Tools & Practices
  "Git", "SVN", "Agile", "Scrum", "Kanban", "JIRA", "Confluence", "Postman",
  "Swagger", "OpenAPI", "gRPC", "REST API", "GraphQL API", "WebSockets", "OAuth",
  "JWT", "LDAP", "SAML", "Unit Testing", "TDD", "BDD", "Selenium", "Jest", "Mocha",

  // Specialized
  "MPI", "OpenMP", "CUDA", "HPC", "Embedded", "RTOS", "FPGA", "IoT", "Blockchain",
  "Microservices", "Serverless", "Event-Driven", "Message Queue", "RabbitMQ",
  "ActiveMQ", "Protobuf", "YAML", "JSON", "XML", "gRPC", "WebRTC",

  // Platforms
  "Salesforce", "SAP", "ServiceNow", "Workday", "SharePoint", "WordPress",
  "Shopify", "Magento",

  // Security
  "Cybersecurity", "Penetration Testing", "OWASP", "SSL/TLS", "Encryption",
  "IAM", "Zero Trust", "DevSecOps",

  // Applied Materials / aerospace specific
  "PyTorch", "Signal Processing", "GPU Programming", "Numerical Methods",
  "MATLAB", "Simulink", "CAD", "SolidWorks",
];

// Normalize for matching
const SKILL_ALIASES = {
  "node": "Node.js",
  "nodejs": "Node.js",
  "reactjs": "React",
  "react.js": "React",
  "vue.js": "Vue",
  "vuejs": "Vue",
  "angular": "Angular",
  "angularjs": "AngularJS",
  "postgresql": "PostgreSQL",
  "postgres": "PostgreSQL",
  "mongo": "MongoDB",
  "mongodb": "MongoDB",
  "k8s": "Kubernetes",
  "es": "Elasticsearch",
  "elk": "Elasticsearch",
  "aws": "AWS",
  "gcp": "GCP",
  "js": "JavaScript",
  "ts": "TypeScript",
  "py": "Python",
  "ml": "Machine Learning",
  "dl": "Deep Learning",
  "ai": "AI/ML",
  "ci/cd": "CI/CD",
  "cicd": "CI/CD",
  "rest api": "REST API",
  "restful": "REST API",
  "spring boot": "Spring Boot",
  "spring-boot": "Spring Boot",
  "c/c++": "C++",
  "sql server": "SQL Server",
  "ms sql": "SQL Server",
  "mssql": "SQL Server",
  "dotnet": ".NET",
  "dot net": ".NET",
  "asp.net": "ASP.NET",
};

module.exports = { SKILLS_DICTIONARY, SKILL_ALIASES };
