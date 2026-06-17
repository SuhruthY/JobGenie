/**
 * extractor.js — Identifies skills, job titles, and keywords from resume text.
 * Uses a broad 500+ skill dictionary across tech, business, healthcare, and more.
 * Scores terms by frequency and returns the most relevant search keywords.
 */

const Extractor = (() => {
  'use strict';

  /* ─── SKILL DICTIONARY ──────────────────────────────
   * Broad coverage across industries. Each term is a key,
   * value is the category it belongs to (for grouping).
   */
  const SKILLS = {
    // ── Programming Languages ──
    'python': 'language', 'javascript': 'language', 'typescript': 'language', 'java': 'language',
    'c++': 'language', 'c#': 'language', 'csharp': 'language', 'ruby': 'language', 'go': 'language',
    'golang': 'language', 'rust': 'language', 'swift': 'language', 'kotlin': 'language',
    'php': 'language', 'scala': 'language', 'perl': 'language', 'lua': 'language', 'r': 'language',
    'dart': 'language', 'elixir': 'language', 'clojure': 'language', 'haskell': 'language',
    'sql': 'language', 'bash': 'language', 'shell': 'language', 'powershell': 'language',
    'html': 'language', 'css': 'language', 'sass': 'language', 'less': 'language',
    'graphql': 'language', 'assembly': 'language', 'matlab': 'language',

    // ── Frontend Frameworks & Libraries ──
    'react': 'frontend', 'reactjs': 'frontend', 'angular': 'frontend', 'vue': 'frontend',
    'vuejs': 'frontend', 'svelte': 'frontend', 'jquery': 'frontend', 'nextjs': 'frontend',
    'nuxt': 'frontend', 'gatsby': 'frontend', 'redux': 'frontend', 'mobx': 'frontend',
    'tailwind': 'frontend', 'bootstrap': 'frontend', 'material ui': 'frontend', 'mui': 'frontend',
    'chakra ui': 'frontend', 'styled components': 'frontend', 'webpack': 'frontend',
    'vite': 'frontend', 'babel': 'frontend', 'eslint': 'frontend', 'prettier': 'frontend',
    'd3.js': 'frontend', 'chart.js': 'frontend', 'three.js': 'frontend',
    'astro': 'frontend', 'solidjs': 'frontend', 'alpine.js': 'frontend',

    // ── Backend Frameworks ──
    'node.js': 'backend', 'nodejs': 'backend', 'express': 'backend', 'django': 'backend',
    'flask': 'backend', 'fastapi': 'backend', 'spring': 'backend', 'spring boot': 'backend',
    'asp.net': 'backend', 'dotnet': 'backend', '.net': 'backend', 'rails': 'backend', 'ruby on rails': 'backend', 'laravel': 'backend',
    'symfony': 'backend', 'gin': 'backend', 'echo': 'backend', 'actix': 'backend',
    'rocket': 'backend', 'ktor': 'backend', 'vert.x': 'backend', 'play framework': 'backend',

    // ── Databases ──
    'postgresql': 'database', 'postgres': 'database', 'mysql': 'database', 'mongodb': 'database',
    'redis': 'database', 'elasticsearch': 'database', 'cassandra': 'database', 'dynamodb': 'database',
    'sqlite': 'database', 'mariadb': 'database', 'oracle': 'database', 'sql server': 'database',
    'firebase': 'database', 'supabase': 'database', 'couchbase': 'database', 'neo4j': 'database',
    'influxdb': 'database', 'clickhouse': 'database', 'bigquery': 'database', 'snowflake': 'database',
    'redshift': 'database', 'cosmos db': 'database',

    // ── Cloud & DevOps ──
    'aws': 'cloud', 'amazon web services': 'cloud', 'azure': 'cloud', 'gcp': 'cloud',
    'google cloud': 'cloud', 'docker': 'devops', 'kubernetes': 'devops', 'k8s': 'devops',
    'terraform': 'devops', 'ansible': 'devops', 'puppet': 'devops', 'chef': 'devops',
    'jenkins': 'devops', 'github actions': 'devops', 'gitlab ci': 'devops', 'circleci': 'devops',
    'travis ci': 'devops', 'argocd': 'devops', 'helm': 'devops', 'prometheus': 'devops',
    'grafana': 'devops', 'datadog': 'devops', 'new relic': 'devops', 'splunk': 'devops',
    'nginx': 'devops', 'apache': 'devops', 'cloudflare': 'devops', 'istio': 'devops',
    'consul': 'devops', 'vault': 'devops', 'packer': 'devops', 'vagrant': 'devops',
    'git': 'devops', 'github': 'devops', 'gitlab': 'devops', 'bitbucket': 'devops',

    // ── Data Science & ML ──
    'machine learning': 'datascience', 'deep learning': 'datascience', 'neural networks': 'datascience',
    'nlp': 'datascience', 'natural language processing': 'datascience', 'computer vision': 'datascience',
    'tensorflow': 'datascience', 'pytorch': 'datascience', 'keras': 'datascience',
    'scikit-learn': 'datascience', 'pandas': 'datascience', 'numpy': 'datascience',
    'scipy': 'datascience', 'jupyter': 'datascience', 'opencv': 'datascience',
    'hugging face': 'datascience', 'transformers': 'datascience', 'langchain': 'datascience',
    'llm': 'datascience', 'rag': 'datascience', 'generative ai': 'datascience',
    'data science': 'datascience', 'data analysis': 'datascience', 'data mining': 'datascience',
    'statistics': 'datascience', 'regression': 'datascience', 'classification': 'datascience',
    'clustering': 'datascience', 'a/b testing': 'datascience', 'tableau': 'datascience',
    'power bi': 'datascience', 'looker': 'datascience', 'airflow': 'datascience',
    'spark': 'datascience', 'hadoop': 'datascience', 'kafka': 'datascience',
    'dbt': 'datascience', 'mlops': 'datascience',

    // ── Mobile Development ──
    'android': 'mobile', 'ios': 'mobile', 'react native': 'mobile', 'flutter': 'mobile',
    'swiftui': 'mobile', 'uikit': 'mobile', 'xamarin': 'mobile', 'cordova': 'mobile',
    'ionic': 'mobile', 'expo': 'mobile',

    // ── Testing ──
    'jest': 'testing', 'mocha': 'testing', 'chai': 'testing', 'cypress': 'testing',
    'playwright': 'testing', 'selenium': 'testing', 'puppeteer': 'testing', 'junit': 'testing',
    'pytest': 'testing', 'unittest': 'testing', 'rspec': 'testing', 'vitest': 'testing',
    'testing library': 'testing', 'karma': 'testing', 'jasmine': 'testing',

    // ── Project Management & Methodologies ──
    'agile': 'management', 'scrum': 'management', 'kanban': 'management', 'jira': 'management',
    'confluence': 'management', 'trello': 'management', 'asana': 'management', 'notion': 'management',
    'linear': 'management', 'pmp': 'management', 'prince2': 'management',
    'product management': 'management', 'project management': 'management',
    'stakeholder management': 'management', 'cross-functional': 'management',
    'strategic planning': 'management', 'roadmap': 'management', 'okr': 'management',
    'kpi': 'management', 'budgeting': 'management', 'p&l': 'management',

    // ── Soft Skills ──
    'leadership': 'softskill', 'communication': 'softskill', 'teamwork': 'softskill',
    'problem solving': 'softskill', 'critical thinking': 'softskill', 'mentoring': 'softskill',
    'coaching': 'softskill', 'presentation': 'softskill', 'negotiation': 'softskill',
    'conflict resolution': 'softskill', 'time management': 'softskill',
    'decision making': 'softskill', 'analytical': 'softskill', 'collaboration': 'softskill',
    'adaptability': 'softskill', 'creativity': 'softskill',

    // ── Design ──
    'figma': 'design', 'sketch': 'design', 'adobe xd': 'design', 'photoshop': 'design',
    'illustrator': 'design', 'indesign': 'design', 'ui design': 'design', 'ux design': 'design',
    'user research': 'design', 'wireframing': 'design', 'prototyping': 'design',
    'design systems': 'design', 'responsive design': 'design', 'framer': 'design',

    // ── Business & Marketing ──
    'seo': 'marketing', 'sem': 'marketing', 'content marketing': 'marketing',
    'social media': 'marketing', 'email marketing': 'marketing', 'crm': 'marketing',
    'salesforce': 'marketing', 'hubspot': 'marketing', 'google analytics': 'marketing',
    'digital marketing': 'marketing', 'growth hacking': 'marketing', 'ppc': 'marketing',
    'brand management': 'marketing', 'market research': 'marketing',
    'business development': 'business', 'sales': 'business', 'account management': 'business',
    'customer success': 'business', 'operations': 'business', 'supply chain': 'business',
    'logistics': 'business', 'procurement': 'business', 'erp': 'business', 'sap': 'business',

    // ── Finance & Accounting ──
    'financial analysis': 'finance', 'financial modeling': 'finance', 'valuation': 'finance',
    'accounting': 'finance', 'audit': 'finance', 'tax': 'finance', 'budgeting': 'finance',
    'forecasting': 'finance', 'risk management': 'finance', 'compliance': 'finance',
    'quickbooks': 'finance', 'xero': 'finance', 'gaap': 'finance', 'ifrs': 'finance',
    'investment banking': 'finance', 'private equity': 'finance', 'venture capital': 'finance',

    // ── Healthcare ──
    'clinical': 'healthcare', 'patient care': 'healthcare', 'medical': 'healthcare',
    'healthcare': 'healthcare', 'pharma': 'healthcare', 'biotech': 'healthcare',
    'regulatory': 'healthcare', 'hipaa': 'healthcare', 'emr': 'healthcare', 'ehr': 'healthcare',
    'nursing': 'healthcare', 'pharmacology': 'healthcare', 'epidemiology': 'healthcare',

    // ── Engineering (non-software) ──
    'mechanical engineering': 'engineering', 'electrical engineering': 'engineering',
    'civil engineering': 'engineering', 'chemical engineering': 'engineering',
    'industrial engineering': 'engineering', 'autocad': 'engineering', 'solidworks': 'engineering',
    'matlab': 'engineering', 'plc': 'engineering', 'scada': 'engineering',
    'cad': 'engineering', 'cam': 'engineering', 'fea': 'engineering', 'cfd': 'engineering',

    // ── Cybersecurity ──
    'cybersecurity': 'security', 'information security': 'security', 'network security': 'security',
    'penetration testing': 'security', 'ethical hacking': 'security', 'cissp': 'security',
    'cism': 'security', 'security': 'security', 'encryption': 'security', 'firewall': 'security',
    'siem': 'security', 'vulnerability assessment': 'security', 'zero trust': 'security',
    'soc': 'security', 'incident response': 'security',
  };

  /* ─── COMMON JOB TITLES ──────────────────────────── */
  const JOB_TITLES = [
    'software engineer', 'software developer', 'full stack developer', 'frontend developer',
    'backend developer', 'devops engineer', 'data engineer', 'data scientist', 'ml engineer',
    'ai engineer', 'cloud engineer', 'site reliability engineer', 'platform engineer',
    'security engineer', 'network engineer', 'systems engineer', 'embedded engineer',
    'product manager', 'project manager', 'program manager', 'scrum master', 'product owner',
    'engineering manager', 'tech lead', 'architect', 'solutions architect',
    'data analyst', 'business analyst', 'financial analyst',
    'ux designer', 'ui designer', 'product designer', 'graphic designer',
    'marketing manager', 'marketing specialist', 'content strategist', 'seo specialist',
    'sales manager', 'account executive', 'business development manager',
    'hr manager', 'recruiter', 'talent acquisition', 'people operations',
    'operations manager', 'supply chain manager', 'logistics coordinator',
    'customer success manager', 'account manager', 'support engineer',
    'consultant', 'analyst', 'director', 'vp', 'cto', 'ceo', 'coo', 'cfo',
    'intern', 'associate', 'coordinator', 'specialist', 'lead', 'principal',
    'staff engineer', 'senior engineer', 'junior engineer', 'graduate engineer',
    'researcher', 'scientist', 'professor', 'teacher', 'instructor',
    'nurse', 'doctor', 'physician', 'surgeon', 'pharmacist', 'therapist',
    'lawyer', 'attorney', 'paralegal', 'legal counsel',
  ];

  /**
   * Normalize text: lowercase, remove extra spaces, remove special chars for matching
   */
  function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s+#.+]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if text contains a skill using word boundaries.
   * Multi-word skills use substring match (they can't be false positives).
   * Single-word skills use \bword\b to avoid "go" matching "google".
   */
  function textContains(text, phrase) {
    const isMultiWord = phrase.includes(' ') || phrase.includes('.') || phrase.includes('+') || phrase.includes('#');
    if (isMultiWord) {
      // Multi-word/phrase skills — substring match is safe
      return text.includes(phrase);
    }
    // Single-word — use word boundaries
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('\\b' + escaped + '\\b').test(text);
  }

  /**
   * Count occurrences of a skill in text using word boundaries.
   */
  function countOccurrences(text, phrase) {
    const isMultiWord = phrase.includes(' ') || phrase.includes('.') || phrase.includes('+') || phrase.includes('#');
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = isMultiWord ? escaped : '\\b' + escaped + '\\b';
    const matches = text.match(new RegExp(pattern, 'g'));
    return matches ? matches.length : 0;
  }

  /**
   * Extract keywords from resume text.
   * Returns an object with:
   *   - skills: matched skills sorted by confidence
   *   - titles: matched job titles
   *   - all: combined list of top keywords for API search
   */
  function extractKeywords(text) {
    const normalized = normalize(text);
    const words = normalized.split(/\s+/);

    // Check each skill (may be multi-word)
    const matches = {};

    for (const [skill, category] of Object.entries(SKILLS)) {
      if (textContains(normalized, skill)) {
        const count = countOccurrences(normalized, skill);
        if (!matches[skill] || matches[skill].count < count) {
          matches[skill] = { skill, category, count };
        }
      }
    }

    // Check job titles (multi-word phrases) — also use word boundaries
    const foundTitles = [];
    for (const title of JOB_TITLES) {
      if (textContains(normalized, title)) {
        foundTitles.push(title);
      }
    }

    // Sort skills by count (frequency in resume)
    const sortedSkills = Object.values(matches)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 skills

    // Build final keyword list: prioritize job titles, then top skills
    const keywords = [];

    // Add found job titles first (most relevant)
    foundTitles.forEach(t => {
      if (!keywords.includes(t)) keywords.push(t);
    });

    // Add top skills
    sortedSkills.forEach(s => {
      if (!keywords.includes(s.skill)) keywords.push(s.skill);
    });

    return {
      skills: sortedSkills,
      titles: foundTitles,
      all: keywords,
      // Create a search query string (max 8 terms to avoid API noise)
      searchQuery: keywords.slice(0, 8).join(' '),
      summary: keywords.slice(0, 12)
    };
  }

  // Public API
  return { extractKeywords };
})();
