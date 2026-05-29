// ============================================================
// Orthex — LeetCode Data Extractor
// Extracts submission data from LeetCode's React SPA DOM
// ============================================================

/**
 * Main extraction function — returns a structured data object
 * from the current LeetCode submission result page.
 */
var LC_SELECTORS = {
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
    runtimeBeat:     extractRuntimeBeat(),
    memory:          extractMemory(),
    memoryBeat:      extractMemoryBeat(),
    code:            extractCode(),
    difficulty:      extractDifficulty(),
    timestamp:       Date.now(),
  };
}

function extractSubmissionId() {
  const match = window.location.pathname.match(/\/submissions\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Detects if a submission result panel is currently visible.
 * Works for both Accepted and error states.
 */
function isSubmissionResultVisible() {
  // Check for the result header text
  const verdictTexts = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded',
    'Memory Limit Exceeded', 'Runtime Error', 'Compile Error',
    'Output Limit Exceeded', 'TLE', 'MLE'];

  for (const text of verdictTexts) {
    if (findElementByText(text)) {
      console.log(`[LCA] Found verdict text: "${text}"`);
      return true;
    }
  }

  // Also check for the runtime/memory stats section
  const e2e = document.querySelector(LC_SELECTORS.submissionResult);
  if (e2e) {
    console.log('[LCA] Found e2e locator: submission-result');
    return true;
  }

  // Fallback: look for "ms" runtime element
  const rtElement = findRuntimeElement();
  return !!rtElement;
}

// ── Individual Extractors ──────────────────────────────────

function extractProblemTitle() {
  // Method 1: Page title (format: "Problem Title - LeetCode")
  if (document.title && document.title !== 'LeetCode') {
    const titleParts = document.title.split(' - ');
    if (titleParts.length >= 2) {
      return titleParts[0].trim();
    }
  }

  // Method 2: First h1 or heading on problem page
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent.trim()) return h1.textContent.trim();

  // Method 3: URL slug
  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  if (match) {
    return match[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return 'Unknown Problem';
}

function extractLanguage() {
  // Method 1: e2e locator attribute
  const langEl = document.querySelector(LC_SELECTORS.codeLangBtn);
  if (langEl) return langEl.textContent.trim();

  // Method 2: Common language tab selectors
  const selectors = LC_SELECTORS.langSelectItems;
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && isLanguageName(el.textContent.trim())) {
      return el.textContent.trim();
    }
  }

  // Method 3: Look for language names in visible text
  const languages = ['Java', 'Python3', 'Python', 'C++', 'JavaScript',
    'TypeScript', 'Go', 'Rust', 'C#', 'Swift', 'Kotlin', 'Ruby', 'Scala',
    'PHP', 'C', 'Dart', 'Racket', 'Erlang', 'Elixir', 'MySQL', 'PostgreSQL'];
  for (const lang of languages) {
    if (findElementByText(lang)) return lang;
  }

  return 'Unknown';
}

function extractVerdict() {
  // Check for e2e locator first
  const result = document.querySelector(LC_SELECTORS.submissionResult);
  if (result) return result.textContent.trim();

  const verdicts = [
    'Accepted', 'Wrong Answer', 'Time Limit Exceeded',
    'Memory Limit Exceeded', 'Runtime Error', 'Compile Error',
    'Output Limit Exceeded',
  ];
  for (const v of verdicts) {
    if (findElementByText(v)) return v;
  }
  return 'Unknown';
}

function extractRuntime() {
  // Look for elements containing ms (runtime)
  const el = findRuntimeElement();
  if (el) {
    const text = el.textContent.trim();
    const match = text.match(/(\d+)\s*ms/i);
    if (match) return match[1] + 'ms';
    if (text.endsWith('ms')) return text;
  }
  return null;
}

function extractRuntimeBeat() {
  return extractBeatPercentage('runtime') || extractBeatPercentage('time');
}

function extractMemory() {
  const all = document.querySelectorAll('*');
  for (const el of all) {
    const text = el.childNodes[0]?.textContent?.trim();
    if (text && /^\d+\.\d+\s*MB$/i.test(text)) return text;
    if (text && /^\d+\s*MB$/i.test(text)) return text;
  }

  // Broader search
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (/^\d+\.?\d*\s*MB$/i.test(t)) return t;
  }
  return null;
}

function extractMemoryBeat() {
  return extractBeatPercentage('memory');
}

function extractCode() {
  // Method 1: Monaco editor API (most reliable when available)
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
  } catch (e) { /* monaco not available */ }

  // Method 2: CodeMirror
  try {
    const cm = document.querySelector(LC_SELECTORS.codeMirror);
    if (cm && cm.CodeMirror) {
      const val = cm.CodeMirror.getValue();
      if (val && val.length > 10) return val;
    }
  } catch (e) { /* not available */ }

  // Method 3: DOM view-lines (Monaco DOM fallback)
  const viewLines = document.querySelector(LC_SELECTORS.viewLines);
  if (viewLines) {
    const lines = viewLines.querySelectorAll('.view-line');
    if (lines.length > 0) {
      return Array.from(lines).map(l => l.textContent).join('\n');
    }
  }

  // Method 4: <textarea> or <pre> elements
  const textarea = document.querySelector(LC_SELECTORS.textAreaCode);
  if (textarea && textarea.value) return textarea.value;
  if (textarea && textarea.textContent) return textarea.textContent;

  // Method 5: Submission detail page code block
  const codeBlock = document.querySelector(LC_SELECTORS.codeAreaPre);
  if (codeBlock) return codeBlock.textContent;

  return null;
}

function extractDifficulty() {
  const difficulties = ['Easy', 'Medium', 'Hard'];
  for (const diff of difficulties) {
    const el = findElementByText(diff);
    if (el && el.className && (
      el.className.includes('difficulty') ||
      el.className.includes('Difficulty') ||
      el.className.includes('easy') ||
      el.className.includes('medium') ||
      el.className.includes('hard')
    )) return diff;
  }
  // Fallback: any element with just these words
  for (const diff of difficulties) {
    const el = findElementByText(diff);
    if (el) return diff;
  }
  return 'Unknown';
}

// ── Helper Functions ──────────────────────────────────────

function findElementByText(text) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  const target = text.toLowerCase().trim();
  while ((node = walker.nextNode())) {
    const content = node.textContent.toLowerCase().trim();
    if (content === target) {
      console.log(`[LCA] Exact match for "${text}" found in <${node.parentElement.tagName}>`);
      return node.parentElement;
    }
    // Fallback for partial matches (e.g. "Accepted " or "Runtime: 0 ms")
    if (content.includes(target) && content.length < target.length + 10) {
      console.log(`[LCA] Partial match for "${text}" found in "${content}" (<${node.parentElement.tagName}>)`);
      return node.parentElement;
    }
  }
  return null;
}

function findRuntimeElement() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    // Match "0 ms", "Runtime: 0 ms", "0ms", etc.
    if (/(\d+)\s*ms/i.test(t)) return node.parentElement;
  }
  return null;
}

function extractBeatPercentage(type) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  const beatRegex = /beats?\s+([\d.]+)%/i;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    const match = t.match(beatRegex);
    if (match) {
      // Try to disambiguate runtime vs memory beats
      const parent = node.parentElement;
      const parentText = parent?.closest('[class*="result"]')?.textContent || '';
      return match[1] + '%';
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
    LC_SELECTORS.descriptionContent,
    LC_SELECTORS.descriptionFallback1,
    LC_SELECTORS.descriptionFallback2,
    LC_SELECTORS.descriptionFallback3
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
    LC_SELECTORS.descriptionContent,
    LC_SELECTORS.descriptionFallback1,
    LC_SELECTORS.descriptionFallback2,
    LC_SELECTORS.descriptionFallback3
  ];
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el) return el;
  }
  return null;
}
