// ============================================================
// Orthex — LeetCode Data Extractor
// Extracts submission data from LeetCode's React SPA DOM
// ============================================================

/**
 * Main extraction function — returns a structured data object
 * from the current LeetCode submission result page.
 */
const EXTRACTOR_LC_SELECTORS = {
  submissionResult: '[data-e2e-locator="submission-result"]',
  codeLangBtn: '[data-e2e-locator="code-lang-button"]',
  descriptionContent: 'div[data-track-load="description_content"]',
  descriptionFallback1: '.elfjS',
  descriptionFallback2: 'div[class*="description__"]',
  descriptionFallback3: 'div[data-layout-path="/ts0/tb0"]',
  codeMirror: '.CodeMirror',
  viewLines: '.view-lines',
  textAreaCode: 'textarea[class*="code"], pre[class*="code"]',
  codeAreaPre: '[class*="code-area"] pre, [class*="code_"] pre',
  langSelectItems: [
    '.ant-select-selection-item',
    '[class*="lang-select"]',
    '[class*="language-select"]',
    'button[class*="rounded"][class*="text-"]'
  ]
};

function extractSubmissionData() {
  return {
    problemTitle:    extractProblemTitle(),
    problemUrl:      window.location.href,
    submissionId:    extractSubmissionId(),
    language:        extractLanguage(),
    verdict:         extractVerdict(),
    runtime:         extractRuntime(),
    runtimeBeat:     extractBeatPercentage('runtime'),
    memory:          extractMemory(),
    memoryBeat:      extractBeatPercentage('memory'),
    code:            extractCode(),
    difficulty:      extractDifficulty(),
    timestamp:       Date.now(),
  };
}

function extractSubmissionId() {
  const match = window.location.pathname.match(/\/submissions\/(\d+)/);
  return match ? match[1] : null;
}

// ── Individual Extractors ──────────────────────────────────

function extractProblemTitle() {
  if (document.title && document.title !== 'LeetCode') {
    const titleParts = document.title.split(' - ');
    if (titleParts.length >= 2) {
      return titleParts[0].trim();
    }
  }

  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent.trim()) return h1.textContent.trim();

  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  if (match) {
    return match[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return 'Unknown Problem';
}

function extractLanguage() {
  const langEl = document.querySelector(EXTRACTOR_LC_SELECTORS.codeLangBtn);
  if (langEl) return langEl.textContent.trim();

  for (const sel of EXTRACTOR_LC_SELECTORS.langSelectItems) {
    const el = document.querySelector(sel);
    if (el && isLanguageName(el.textContent.trim())) {
      return el.textContent.trim();
    }
  }

  const languages = ['Java', 'Python3', 'Python', 'C++', 'JavaScript',
    'TypeScript', 'Go', 'Rust', 'C#', 'Swift', 'Kotlin', 'Ruby', 'Scala',
    'PHP', 'C', 'Dart', 'Racket', 'Erlang', 'Elixir', 'MySQL', 'PostgreSQL'];
  
  for (const lang of languages) {
    if (findElementByText(lang, true)) return lang;
  }

  return 'Unknown';
}

function extractVerdict() {
  const result = document.querySelector(EXTRACTOR_LC_SELECTORS.submissionResult);
  if (result) return result.textContent.trim();

  const verdicts = [
    'Accepted', 'Wrong Answer', 'Time Limit Exceeded',
    'Memory Limit Exceeded', 'Runtime Error', 'Compile Error',
    'Output Limit Exceeded',
  ];
  for (const v of verdicts) {
    if (findElementByText(v, true)) return v; // Exact match required
  }
  return 'Unknown';
}

function extractRuntime() {
  const el = findRuntimeElement();
  if (el) {
    const text = el.textContent.trim();
    const match = text.match(/(\d+)\s*ms/i);
    if (match) return match[1] + ' ms';
    if (text.endsWith('ms')) return text;
  }
  return null;
}

function extractMemory() {
  const selectors = [
    '[class*="memory"]', '[class*="Memory"]',
    '[data-e2e-locator*="memory"]',
    '[class*="space"]'
  ];
  for (const sel of selectors) {
    for (const el of document.querySelectorAll(sel)) {
      const text = el.textContent.trim();
      const match = text.match(/(\d+\.?\d*\s*MB)/i);
      if (match) return match[1];
    }
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (/^\d+\.?\d*\s*MB$/i.test(t)) return t;
  }
  return null;
}

function extractCode() {
  try {
    if (window.monaco) {
      const models = window.monaco.editor.getModels();
      if (models && models.length > 0) {
        for (const model of models) {
          const val = model.getValue();
          if (val && val.length > 10) return val;
        }
      }
    }
  } catch (e) { }

  try {
    const cm = document.querySelector(EXTRACTOR_LC_SELECTORS.codeMirror);
    if (cm && cm.CodeMirror) {
      const val = cm.CodeMirror.getValue();
      if (val && val.length > 10) return val;
    }
  } catch (e) { }

  const viewLines = document.querySelector(EXTRACTOR_LC_SELECTORS.viewLines);
  if (viewLines) {
    const lines = viewLines.querySelectorAll('.view-line');
    if (lines.length > 0) {
      return Array.from(lines).map(l => l.textContent).join('\n');
    }
  }

  const textarea = document.querySelector(EXTRACTOR_LC_SELECTORS.textAreaCode);
  if (textarea && textarea.value) return textarea.value;
  if (textarea && textarea.textContent) return textarea.textContent;

  const codeBlock = document.querySelector(EXTRACTOR_LC_SELECTORS.codeAreaPre);
  if (codeBlock) return codeBlock.textContent;

  return null;
}

function extractDifficulty() {
  const difficulties = ['Easy', 'Medium', 'Hard'];
  for (const diff of difficulties) {
    const el = findElementByText(diff, true);
    if (el && el.className && (
      el.className.includes('difficulty') ||
      el.className.includes('Difficulty') ||
      el.className.includes('easy') ||
      el.className.includes('medium') ||
      el.className.includes('hard')
    )) return diff;
  }
  for (const diff of difficulties) {
    if (findElementByText(diff, true)) return diff;
  }
  return 'Unknown';
}

// ── Helper Functions ──────────────────────────────────────

function findElementByText(text, exactOnly = false) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  const target = text.toLowerCase().trim();
  while ((node = walker.nextNode())) {
    const content = node.textContent.toLowerCase().trim();
    if (content === target) {
      return node.parentElement;
    }
    if (!exactOnly && content.includes(target) && content.length < target.length + 10) {
      return node.parentElement;
    }
  }
  return null;
}

function findRuntimeElement() {
  const resultPanel = document.querySelector(EXTRACTOR_LC_SELECTORS.submissionResult)?.closest('div[class*="result"], div[class*="layout"]');
  const root = resultPanel || document.body;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (/^(\d+)\s*ms$/i.test(t)) return node.parentElement;
    if (/Runtime:\s*(\d+)\s*ms/i.test(t)) return node.parentElement;
  }
  return null;
}

function extractBeatPercentage(type) {
  const resultPanel = document.querySelector(EXTRACTOR_LC_SELECTORS.submissionResult)?.closest('div[class*="result"], div[class*="layout"]');
  const root = resultPanel || document.body;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  const beatRegex = /beats?\s+([\d.]+)%/i;
  
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    const match = t.match(beatRegex);
    if (match) {
      // Find the closest stat container to avoid cross-contamination
      const parent = node.parentElement;
      const sectionText = parent?.closest('[class*="flex"], [class*="layout"]')?.textContent?.toLowerCase() || '';
      
      if (type === 'runtime' && (sectionText.includes('runtime') || sectionText.includes('time') || t.toLowerCase().includes('runtime'))) {
        return match[1] + '%';
      }
      if (type === 'memory' && (sectionText.includes('memory') || t.toLowerCase().includes('memory'))) {
        return match[1] + '%';
      }
      
      // If we can't determine the type from the context, we just skip to avoid guessing wrong
    }
  }
  return null;
}

function isLanguageName(text) {
  const languages = ['Java', 'Python3', 'Python', 'C++', 'JavaScript',
    'TypeScript', 'Go', 'Rust', 'C#', 'Swift', 'Kotlin', 'Ruby'];
  return languages.includes(text);
}

function extractProblemDescription() {
  const selectors = [
    EXTRACTOR_LC_SELECTORS.descriptionContent,
    EXTRACTOR_LC_SELECTORS.descriptionFallback1,
    EXTRACTOR_LC_SELECTORS.descriptionFallback2,
    EXTRACTOR_LC_SELECTORS.descriptionFallback3
  ];
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el && el.textContent.trim().length > 20) {
      return el.textContent.trim();
    }
  }
  return '';
}

function findDescriptionPanel() {
  const selectors = [
    EXTRACTOR_LC_SELECTORS.descriptionContent,
    EXTRACTOR_LC_SELECTORS.descriptionFallback1,
    EXTRACTOR_LC_SELECTORS.descriptionFallback2,
    EXTRACTOR_LC_SELECTORS.descriptionFallback3
  ];
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el) return el;
  }
  return null;
}
