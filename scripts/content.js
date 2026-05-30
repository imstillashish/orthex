// Orthex — Content Script
// 3 separate widgets injected at real DOM positions (from DOM inspection)
// Sequential analysis: Approach → Efficiency → Code Style (each renders as it completes)

(() => {
let btnInjected = false, analysisRan = false, lastUrl = location.href, debounce = null, lastAnalyzedSignature = null, solBtnInjected = false;

var LC_SELECTORS = {
  submissionResult: '[data-e2e-locator="submission-result"]',
  solutionButton: '[data-e2e-locator="solution-button"]',
  qdContent: 'div#qd-content',
  commentTextArea: 'textarea[placeholder="Type comment here..."]',
  noteTextArea: 'textarea[placeholder*="note"]',
  noteTextAreaCapital: 'textarea[placeholder*="Note"]',
  commentTextAreaAny: 'textarea[placeholder*="comment"]',
  textAreaFallback: 'textarea'
};

const ICON_COPY = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const ICON_PASTE = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`;
const ICON_CHECK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_SPARKLES = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;
const ICON_REGEN = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`;
const ICON_LIGHTBULB = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--lca-primary)"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;


// ─── Theme Engine ──────────────────────────────────────────
const isDark = () => {
  return document.documentElement.classList.contains('dark') ||
         document.body?.classList.contains('dark') ||
         document.documentElement.getAttribute('data-theme') === 'dark' ||
         document.body?.getAttribute('data-theme') === 'dark';
};
const getThemeClass = () => isDark() ? 'lca-dark' : 'lca-light';

function syncTheme() {
  const theme = getThemeClass();
  const els = [
    ...document.querySelectorAll('.lca-widget'),
    document.getElementById('lca-analysis-btn'),
    document.getElementById('lca-main-container')
  ];
  els.forEach(el => {
    if (!el) return;
    el.classList.remove('lca-dark', 'lca-light');
    el.classList.add(theme);
  });
}

// Watch for LeetCode theme changes
new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
let bodyObserver = new MutationObserver(() => { clearTimeout(debounce); debounce = setTimeout(tick, 900); });
let observerActive = false;

// ─── Mermaid Helpers ───────────────────────────────────────

/**
 * sanitizeMermaidSource — auto-fix common LLM Mermaid mistakes so the diagram
 * renders without a syntax error, regardless of what the model generated.
 *
 * Fixes applied:
 *  1. Node labels in [] / () / {} that contain special chars are auto-quoted.
 *  2. HTML entities from marked (&lt; &gt; &amp;) are unescaped.
 *  3. Removes any accidental trailing semicolons on node lines.
 */
function sanitizeMermaidSource(src) {
  if (!src) return src;

  // Unescape HTML entities that marked may have encoded inside the code fence
  let s = src
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  // Auto-quote unquoted node labels that contain special characters.
  // Matches patterns like:  A[some label (with parens)]  or  B(text/slashes)
  // Only touches labels that are NOT already quoted.
  // Bracket types: [ ], ( ), [[ ]], [/ /], { }
  const labelRe = /(\w[\w\s]*?)(\[{1,2}|(?<!\()\((?!\()|\{)(?!")([^"[\](){}]+?)(\]{1,2}|\)|\})/g;
  s = s.replace(labelRe, (match, id, open, label, close) => {
    // If the label has any special chars, wrap in double-quotes
    if (/[()\/\\<>{}|#!@%^&*+= ]/.test(label)) {
      return `${id}${open}"${label.replace(/"/g, "'")}"${close}`;
    }
    return match;
  });

  // Fix AI adding an extra > after link text, OR using multiple spaces after it,
  // e.g. `-->|yes|>  B` or `-->|yes|   B`. Mermaid's parser is incredibly strict
  // and will throw "got SPACE" if there is more than 1 space after the pipe!
  s = s.replace(/(--[-.=>xo]*\s*\|[^|\n]+\|)\s*>?[ \t]*/g, '$1 ');

  // Fix inner double quotes inside explicitly quoted node labels: A[" ... " ... "] -> A[" ... ' ... ' "]
  s = s.replace(/(\w[\w\s]*?\[")([\s\S]+?)("\])/g, (match, prefix, innerText, suffix) => {
    return `${prefix}${innerText.replace(/"/g, "'")}${suffix}`;
  });

  return s;
}

/**
 * renderMermaidDiagrams — uses mermaid.run() to render diagrams in place.
 * By passing suppressErrors, a single bad diagram won't crash the others.
 *
 * @param {Element} scope  - container element to search within
 */
async function renderMermaidDiagrams(scope) {
  if (!window.mermaid || !scope) return;
  const theme = isDark() ? 'dark' : 'default';
  try {
    window.mermaid.initialize({ theme, startOnLoad: false, securityLevel: 'loose' });
  } catch (_) {}

  // Let mermaid process all diagrams automatically.
  // It reads the textContent (which safely contains our escaped < > characters)
  try {
    await window.mermaid.run({ 
      querySelector: '.mermaid:not([data-processed])',
      suppressErrors: true 
    });
  } catch (err) {
    console.warn('[LCA] Mermaid run error:', err);
  }
}

function syncObserver() {
  const isProblem = /\/problems\//i.test(location.pathname);
  if (isProblem && !observerActive) {
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    observerActive = true;
    setTimeout(tick, 500);
  } else if (!isProblem && observerActive) {
    bodyObserver.disconnect();
    observerActive = false;
  }
}

syncObserver();
patchHistory();

// Listen to storage changes for hot-swapping styles dynamically
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.uiStyle) {
    const newStyle = changes.uiStyle.newValue || 'classic';
    
    // Main Analysis Panel
    const container = document.getElementById('lca-main-container');
    if (container) {
      if (newStyle === 'neubrutalist') {
        container.classList.add('lca-neubrutalist');
      } else {
        container.classList.remove('lca-neubrutalist');
      }
    }
    
    // Main Analysis Button
    const btn = document.getElementById('lca-analysis-btn');
    if (btn) {
      if (newStyle === 'neubrutalist') {
        btn.classList.add('lca-neubrutalist');
      } else {
        btn.classList.remove('lca-neubrutalist');
      }
    }

    // Solutions Panel
    const solContainer = document.getElementById('lca-solutions-container');
    if (solContainer) {
      if (newStyle === 'neubrutalist') {
        solContainer.classList.add('lca-neubrutalist');
      } else {
        solContainer.classList.remove('lca-neubrutalist');
      }
    }

    // Solutions Button
    const solBtn = document.getElementById('lca-solutions-btn');
    if (solBtn) {
      if (newStyle === 'neubrutalist') {
        solBtn.classList.add('lca-neubrutalist');
      } else {
        solBtn.classList.remove('lca-neubrutalist');
      }
    }
  }
});

function patchHistory() {
  ['pushState','replaceState'].forEach(fn => {
    const orig = history[fn].bind(history);
    history[fn] = (...a) => { orig(...a); onNav(); };
  });
  window.addEventListener('popstate', onNav);
}

function onNav() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    ['lca-main-container', 'lca-w-approach','lca-w-efficiency','lca-w-style','lca-analysis-btn', 'lca-solutions-btn-container', 'lca-solutions-container'].forEach(id => document.getElementById(id)?.remove());
    btnInjected = analysisRan = false;
    solBtnInjected = false;
    lastAnalyzedSignature = null;
    syncObserver();
  }
}

function resetAnalysisState() {
  const oldContainer = document.getElementById('lca-main-container');
  const oldBtn = document.getElementById('lca-analysis-btn');
  
  if (oldContainer) {
    oldContainer.removeAttribute('id');
    oldContainer.classList.add('lca-removing');
    setTimeout(() => oldContainer.remove(), 250);
  }
  
  if (oldBtn) {
    oldBtn.removeAttribute('id');
    oldBtn.classList.add('lca-removing');
    setTimeout(() => oldBtn.remove(), 250);
  }
  
  ['lca-w-approach', 'lca-w-efficiency', 'lca-w-style'].forEach(id => {
    const w = document.getElementById(id);
    if (w) {
      w.removeAttribute('id');
      w.classList.add('lca-removing');
      setTimeout(() => w.remove(), 250);
    }
  });

  btnInjected = false;
  analysisRan = false;
  lastAnalyzedSignature = null;
}

// ─── Main tick ────────────────────────────────────────────
async function tick() {
  if (!chrome.runtime?.id) {
    console.warn('[LCA] Extension context invalidated. Disconnecting observers. Please refresh the page.');
    if (observerActive) {
      bodyObserver.disconnect();
      observerActive = false;
    }
    return;
  }

  // Try injecting Solutions button on any problem page description panel
  await injectSolutionsBtn();

  if (!/\/submissions\//i.test(location.pathname)) return;
  if (!isResultVisible()) return;

  const d = extractSubmissionData();
  const currentSig = d.submissionId || getHash(d.code + d.language + (d.verdict || ''));

  if (lastAnalyzedSignature && lastAnalyzedSignature !== currentSig) {
    console.log('[LCA] New submission detected. Resetting analysis state.');
    resetAnalysisState();
  }

  lastAnalyzedSignature = currentSig;

  if (!btnInjected) await injectBtn();
  if (!analysisRan) {
    const s = await getSettings();
    const v = d.verdict || '';
    const auto = s.autoAnalyze && (
      v === 'Accepted' ||
      (v === 'Wrong Answer' && s.analyzeOnWrongAnswer) ||
      (v.includes('Time Limit') && s.analyzeOnTLE)
    );
    if (auto) { analysisRan = true; runAnalysis(d); }
  }
}

function isResultVisible() {
  const e2e = document.querySelector('[data-e2e-locator="submission-result"]');
  if (e2e) return true;
  for (const w of ['Accepted','Wrong Answer','Time Limit Exceeded','Runtime Error','Compile Error']) {
    if (findExactText(w)) return true;
  }
  return false;
}

// ─── Analysis button ──────────────────────────────────────
async function injectBtn() {
  const sol = findSolutionBtn();
  if (!sol) return;
  if (document.getElementById('lca-analysis-btn')) return;
  btnInjected = true;

  const btn = document.createElement('button');
  btn.id = 'lca-analysis-btn';
  
  const s = await getSettings();
  const styleClass = s.uiStyle === 'neubrutalist' ? ' lca-neubrutalist' : '';
  
  btn.className = 'lca-btn ' + getThemeClass() + styleClass;
  btn.innerHTML = `${ICON_SPARKLES} Analysis`;
  sol.insertAdjacentElement('beforebegin', btn);

  btn.addEventListener('click', async () => {
    const allWidgets = ['lca-w-approach','lca-w-efficiency','lca-w-style'].map(id => document.getElementById(id));
    if (allWidgets.some(w => w)) { allWidgets.forEach(w => w?.remove()); analysisRan = false; return; }
    analysisRan = true;
    
    runAnalysis(extractSubmissionData());
  });
}

function findSolutionBtn() {
  const e2e = document.querySelector(LC_SELECTORS.solutionButton);
  if (e2e) return e2e;
  for (const el of document.querySelectorAll('button, a')) {
    const t = el.textContent.trim();
    if ((t === 'Solution' || t === '✓ Solution') && el.getBoundingClientRect().width > 0) return el;
  }
  return null;
}

// ─── DOM Locators (from real DOM inspection) ──────────────

// Finds the Runtime/Memory row — real selector from DOM inspection
function findRuntimeRow() {
  // Strategy 1: exact selector from DOM (div.flex.w-full.gap-3.flex-row, w=640, h=80)
  for (const sel of [
    'div.flex.w-full.gap-3.flex-row',
    'div.flex.w-full.gap-4.flex-row',
    'div.flex.w-full.gap-3',
    'div.flex.w-full.gap-4',
    'div.flex.gap-3',
    'div.flex.gap-4'
  ]) {
    for (const el of document.querySelectorAll(sel)) {
      const txt = el.textContent;
      if (txt.includes('Runtime') && txt.includes('Memory')) {
        const r = el.getBoundingClientRect();
        if (r.width > 200 && r.height > 20 && r.height < 200) return el;
      }
    }
  }
  // Strategy 2: Walk from "Runtime" text node up until parent contains "Memory"
  const rn = findExactText('Runtime');
  if (rn) {
    let el = rn;
    for (let i = 0; i < 10; i++) {
      el = el.parentElement;
      if (!el) break;
      const r = el.getBoundingClientRect();
      if (el.textContent.includes('Memory') && r.width > 200) return el;
    }
  }
  return null;
}

// Finds the Code section container — real selector from DOM inspection
// The code header is div.flex.items-center.justify-between.pb-2 (w=668, h=28)
// We want its PARENT which wraps the entire code block
function findCodeSection() {
  const langs = ['Python3','Python','Java','C++','JavaScript','TypeScript','Go','Rust','Swift','Kotlin','C#','Ruby'];
  // Strategy 1: find the code header row, then get its parent container
  for (const sel of ['div.flex.items-center.justify-between.pb-2', 'div.flex.items-center.justify-between']) {
    for (const el of document.querySelectorAll(sel)) {
      if (!langs.some(l => el.textContent.includes(l))) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 200 && r.height < 60) {
        // Walk up to find the wrapping card container
        let p = el;
        for (let i = 0; i < 4; i++) {
          p = p.parentElement;
          if (!p) break;
          const pr = p.getBoundingClientRect();
          if (pr.width > 400 && pr.height > 100) return p;
        }
        return el; // fallback to the row itself
      }
    }
  }
  // Strategy 2: find a language tab node and walk up
  for (const lang of langs) {
    const n = findExactText(lang);
    if (!n) continue;
    let el = n;
    for (let i = 0; i < 8; i++) {
      el = el.parentElement;
      if (!el) break;
      const r = el.getBoundingClientRect();
      if (r.width > 400 && r.height > 80) return el;
    }
  }
  return null;
}

// Finds the Notes/Comment section — real placeholder is "Type comment here..."
function findNotesSection() {
  // Strategy 1: exact placeholder from DOM inspection
  const ta = document.querySelector(LC_SELECTORS.commentTextArea)
          || document.querySelector(LC_SELECTORS.noteTextArea)
          || document.querySelector(LC_SELECTORS.noteTextAreaCapital)
          || document.querySelector(LC_SELECTORS.commentTextAreaAny)
          || document.querySelector(LC_SELECTORS.textAreaFallback);
  if (!ta) return null;
  // Walk up to the rounded card container (flex.w-full.flex-col.rounded-[13px])
  let el = ta;
  for (let i = 0; i < 8; i++) {
    el = el.parentElement;
    if (!el) break;
    const cls = el.className || '';
    if (cls.includes('rounded') && el.getBoundingClientRect().width > 200) return el;
  }
  // Fallback: walk up to any sizeable container
  el = ta;
  for (let i = 0; i < 6; i++) {
    el = el.parentElement;
    if (!el) break;
    if (el.getBoundingClientRect().width > 200) return el;
  }
  return ta.parentElement;
}

// Find element with exact text content
function findExactText(text) {
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = tw.nextNode())) {
    if (n.textContent.trim() === text) return n.parentElement;
  }
  return null;
}

// ─── Inject skeletons at each position ───────────────────
function isElementVisible(el) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

// Find the scrollable submission result panel (walk up from the verdict badge)
function findResultContainer() {
  const verdict = document.querySelector(LC_SELECTORS.submissionResult);
  if (verdict) {
    let el = verdict;
    // Walk up to find a container that is likely the scrollable panel
    for (let i = 0; i < 15; i++) {
      el = el.parentElement;
      if (!el) break;
      const r = el.getBoundingClientRect();
      // In 2026, the main panel is usually a flex-col with substantial height
      if (r.height > 250 && r.width > 200) return el;
    }
  }
  // Strategy 2: Look for the main content area
  return document.querySelector(LC_SELECTORS.qdContent) || document.querySelector('main') || document.body;
}

function skeletonHtml(label) {
  const ICON_LOADING = `<svg class="lca-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--lca-primary);display:inline-block;vertical-align:middle"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;
  return `<div class="lca-wh">
    <span class="lca-wh-icon">${ICON_LOADING}</span>
    <div class="lca-wh-title">${esc(label)}</div>
  </div>
  <div class="lca-tetris-wrapper"></div>`;
}

// ── Injection Target: the main flex-col panel that holds all submission content
// DOM: div.mx-auto.flex.w-full.max-w-[700px].flex-col.gap-4.px-4.py-3
// It has 4 children (flex-col, so full width):
//   [0] header row (verdict + buttons)
//   [1] bordered card (runtime/memory stats + code analysis) ← insert AFTER this
//   [2] code section
//   [3] notes section
function findMainPanel() {
  // Most reliable: find by the max-w-[700px] + flex-col combo
  for (const el of document.querySelectorAll('div')) {
    if (!el.className) continue;
    const cls = el.className;
    if (cls.includes('max-w-[700px]') && cls.includes('flex-col') && cls.includes('gap-4') && cls.includes('px-4')) {
      const r = el.getBoundingClientRect();
      if (r.width > 200 && r.height > 100) return el;
    }
  }
  return null;
}

function findBorderedCard() {
  // The card that wraps runtime/memory stats
  // cls: "flex w-full flex-col gap-2 rounded-lg border p-3 border-border-tertiary ..."
  for (const el of document.querySelectorAll('div')) {
    if (!el.className) continue;
    const cls = el.className;
    if (cls.includes('rounded-lg') && cls.includes('border') && cls.includes('flex-col') && cls.includes('gap-2') && cls.includes('p-3')) {
      const r = el.getBoundingClientRect();
      if (r.width > 200 && el.textContent.includes('Runtime') && el.textContent.includes('Memory')) return el;
    }
  }
  return null;
}
// ── Run Analysis (sequential: Approach → Efficiency → Style) ──────
async function runAnalysis(data) {
  console.log('[LCA] runAnalysis started');
  const currentSig = data.submissionId || getHash(data.code + data.language + (data.verdict || ''));
  lastAnalyzedSignature = currentSig;

  let cacheKey = null;
  let cached = null;
  let settings = null;
  try {
    cacheKey = getCacheKey(data);
    cached = await getCachedResult(cacheKey);
    settings = await getSettings();
  } catch (e) {
    console.warn('[LCA] Cache read failed:', e);
  }
  
  // Remove any existing container/widgets
  document.getElementById('lca-main-container')?.remove();

  // Create a dedicated vertical container
  const mainContainer = document.createElement('div');
  mainContainer.id = 'lca-main-container';
  const initialStyleClass = settings?.uiStyle === 'neubrutalist' ? ' lca-neubrutalist' : '';
  mainContainer.className = 'lca-container ' + getThemeClass() + (cached ? ' lca-cached' : '') + initialStyleClass;
  
  // ── Inject Animated Gradient Background ──
  const gradBg = document.createElement('div');
  gradBg.className = 'lca-gradient-bg';
  gradBg.innerHTML = `
    <div class="lca-grad-blob lca-grad-1"></div>
    <div class="lca-grad-blob lca-grad-2"></div>
    <div class="lca-grad-blob lca-grad-3"></div>
  `;
  mainContainer.appendChild(gradBg);
  if (cached) mainContainer.setAttribute('data-cached', 'true');

  // Helper to create a widget element
  const createWidget = (id, html) => {
    const w = document.createElement('div');
    w.id = id;
    w.className = 'lca-widget ' + getThemeClass();
    w.innerHTML = html;
    return w;
  };

  // Add all 3 skeletons/cached results
  const wApp = createWidget('lca-w-approach',   cached?.approach   ? buildApproachHtml(cached.approach, cached.verdict, data, true) : skeletonHtml('Analyzing Approach...'));
  const wEff = createWidget('lca-w-efficiency', cached?.efficiency ? buildEfficiencyHtml(cached.efficiency) : skeletonHtml('Analyzing Efficiency...'));
  const wSty = createWidget('lca-w-style',      cached?.codeStyle  ? buildStyleHtml(cached.codeStyle, cached.learningPath) : skeletonHtml('Analyzing Code Style...'));
  
  mainContainer.appendChild(wApp);
  mainContainer.appendChild(wEff);
  mainContainer.appendChild(wSty);
  
  if (cached?.efficiency) {
    initEfficiencyGraph(wEff, cached.efficiency);
  }
  
  if (!cached) {
    window.lcaTetrisLoaders = [];
    mainContainer.querySelectorAll('.lca-tetris-wrapper').forEach(el => {
      window.lcaTetrisLoaders.push(new TetrisLoader(el));
    });
  }

  // ── CORRECT INJECTION STRATEGY ──────────────────────────────────────────
  // The page structure is:
  //   div.mx-auto.flex.w-full.max-w-[700px].flex-col.gap-4  ← mainPanel (flex-col → full width)
  //     [0] header row (verdict + buttons)
  //     [1] bordered card (runtime/memory)  ← insert AFTER this
  //     [2] code section
  //     [3] notes
  // We must inject into mainPanel (a flex-col) so widget gets full width.
  // NEVER inject into a flex-row container or we get crushed to a tiny column.
  let injected = false;

  const borderedCard = findBorderedCard();
  if (borderedCard) {
    // Insert our container right after the bordered card, in the same flex-col parent
    borderedCard.insertAdjacentElement('afterend', mainContainer);
    injected = true;
  }

  if (!injected) {
    const mainPanel = findMainPanel();
    if (mainPanel) {
      // Append at the top of the main panel
      mainPanel.prepend(mainContainer);
      injected = true;
    }
  }

  if (!injected) {
    // Last resort: scroll container
    const sc = findResultContainer();
    if (sc) sc.prepend(mainContainer);
    else document.body.appendChild(mainContainer);
  }

  // Ensure visibility
  mainContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Run full analysis if not cached
  if (!cached) {
    await runFullAnalysis('ANALYZE_FULL', data, cacheKey);
  }

  trackUsage();
}

async function runFullAnalysis(msgType, data, cacheKey) {
  const wApp = document.getElementById('lca-w-approach');
  const wEff = document.getElementById('lca-w-efficiency');
  const wSty = document.getElementById('lca-w-style');
  
  const cleanupLoaders = () => {
    if (window.lcaTetrisLoaders) {
      window.lcaTetrisLoaders.forEach(t => t.stop());
      window.lcaTetrisLoaders = null;
    }
  };
  
  try {
    const res = await chrome.runtime.sendMessage({ type: msgType, payload: data });
    cleanupLoaders();
    if (!res?.success) throw new Error(res?.error || 'Unknown error');
    
    const ai = res.data;
    if (wApp) wApp.innerHTML = buildApproachHtml(ai.approach, ai.verdict, data, false);
    if (wEff) {
      wEff.innerHTML = buildEfficiencyHtml(ai.efficiency);
      initEfficiencyGraph(wEff, ai.efficiency);
    }
    if (wSty) wSty.innerHTML = buildStyleHtml(ai.codeStyle, ai.learningPath);
    
    if (cacheKey) saveToCache(cacheKey, ai);
  } catch (err) {
    cleanupLoaders();
    const errorHtml = errHtml(err.message);
    if (wApp) wApp.innerHTML = errorHtml;
    if (wEff) wEff.innerHTML = errorHtml;
    if (wSty) wSty.innerHTML = errorHtml;
    
    // Attach retry listeners
    [wApp, wEff, wSty].forEach(w => {
      if (!w) return;
      const btn = w.querySelector('.lca-retry-btn');
      if (btn) {
        btn.onclick = () => {
          if (wApp) wApp.innerHTML = skeletonHtml('Analyzing Approach...');
          if (wEff) wEff.innerHTML = skeletonHtml('Analyzing Efficiency...');
          if (wSty) wSty.innerHTML = skeletonHtml('Analyzing Code Style...');
          window.lcaTetrisLoaders = [];
          document.querySelectorAll('.lca-tetris-wrapper').forEach(el => {
            window.lcaTetrisLoaders.push(new TetrisLoader(el));
          });
          runFullAnalysis(msgType, data, cacheKey);
        };
      }
    });
  }
}

// ─── HTML Builders ────────────────────────────────────────
const ICON_APPROACH = `<svg class="lca-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--lca-primary);display:inline-block;vertical-align:middle"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`;

const ICON_EFFICIENCY = `<svg class="lca-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--lca-primary);display:inline-block;vertical-align:middle"><path d="M20.38 18.2A9 9 0 1 0 3.62 18.2M12 17V8"></path></svg>`;

const ICON_STYLE = `<svg class="lca-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--lca-primary);display:inline-block;vertical-align:middle"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline><line x1="14" y1="4" x2="10" y2="20"></line></svg>`;

const ICON_PATH = `<svg class="lca-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--lca-primary);display:inline-block;vertical-align:middle"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;

const ICON_ERR = `<svg class="lca-icon-err" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:var(--lca-error);margin-right:8px;vertical-align:middle;display:inline-block"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"></path></svg>`;

function buildApproachHtml(a, verdict, sub, isCached) {
  if (!a) return errHtml('No approach data');
  return `
    ${verdict ? `<div class="lca-verdict">${esc(verdict)}</div>` : ''}
    <div class="lca-wh"><span class="lca-wh-icon">${ICON_APPROACH}</span><span class="lca-wh-title">Approach</span>${isCached ? '<span class="lca-cached-badge">Cached</span>' : ''}</div>
    ${a.current?.length  ? row('Current',   tags(a.current,  'lca-tag-s')) : ''}
    ${a.suggested?.length? row('Suggested', tags(a.suggested,'lca-tag-o')) : ''}
    ${note('Key Idea', a.keyIdea)}
    ${note('Consider', a.consider)}
  `;
}

function normalizeComplexity(c) {
  if (!c) return 'on';
  const s = c.toLowerCase().replace(/\s+/g, '');
  
  // Exponential / Factorial: 2^n, 2**n, 3^n, n!, etc. (Avoid matching '2n' which is linear O(2N))
  if (s.includes('2^n') || s.includes('2**n') || s.includes('3^n') || s.includes('n!') || s.includes('exponential') || s.includes('factorial')) return 'o2n';
  
  // Quadratic / Polynomial: n^2, n**2, n2, n*n, quadratic
  if (s.includes('n^2') || s.includes('n**2') || s.includes('n2') || s.includes('n*n') || s.includes('quadratic')) return 'on2';
  
  // Linearithmic: nlogn, n*logn, linearithmic (Must check BEFORE logarithmic logn)
  if (s.includes('nlogn') || s.includes('n*logn') || s.includes('nlog(n)') || s.includes('linearithmic')) return 'onlogn';
  
  // Logarithmic: logn, log(n), logarithmic
  if (s.includes('logn') || s.includes('log(n)') || s.includes('logarithmic')) return 'ologn';
  
  // Constant: o(1), constant
  if (s.includes('o(1)') || s.includes('constant')) return 'o1';
  
  // Default: Linear (on)
  return 'on';
}

function formatComplexity(s) {
  if (!s) return '';
  // Simplify O(log(min(m, n))) -> O(log(m, n)) and similar expressions
  return s.replace(/log\s*\(\s*min\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)\s*\)/gi, 'log($1, $2)');
}

const COMPLEXITY_COORDS = {
  o1:      { x: 320, y: 150, label: 'O(1)',      name: 'Constant (Excellent)' },
  ologn:   { x: 270, y: 133, label: 'O(log N)',  name: 'Logarithmic (Excellent)' },
  on:      { x: 220, y: 103, label: 'O(N)',      name: 'Linear (Good)' },
  onlogn:  { x: 170, y: 88,  label: 'O(N log N)', name: 'Linearithmic (Fair)' },
  on2:     { x: 120, y: 70,  label: 'O(N²)',     name: 'Quadratic (Poor)' },
  o2n:     { x: 75,  y: 50,  label: 'O(2ᴺ)',     name: 'Exponential (Poor)' }
};

function generateComplexitySvg(currVal, optVal, isSpace) {
  const currKey = normalizeComplexity(currVal);
  const optKey = normalizeComplexity(optVal);
  const currCoord = COMPLEXITY_COORDS[currKey] || COMPLEXITY_COORDS.on;
  const optCoord = COMPLEXITY_COORDS[optKey] || COMPLEXITY_COORDS.on;
  const isSame = currKey === optKey;


  // Precise mathematical slope calculations for high-density HUD readouts
  const currMidX = (40 + currCoord.x) / 2;
  const currMidY = (155 + currCoord.y) / 2;
  const currAngle = Math.atan2(currCoord.y - 155, currCoord.x - 40) * 180 / Math.PI;
  const currSlope = (currCoord.x - 40) > 0 ? ((155 - currCoord.y) / (currCoord.x - 40)).toFixed(2) : '0.00';

  const optMidX = (40 + optCoord.x) / 2;
  const optMidY = (155 + optCoord.y) / 2;
  const optAngle = Math.atan2(optCoord.y - 155, optCoord.x - 40) * 180 / Math.PI;
  const optSlope = (optCoord.x - 40) > 0 ? ((155 - optCoord.y) / (optCoord.x - 40)).toFixed(2) : '0.00';

  return `
    <svg class="lca-svg-graph" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Glassmorphic Gradient Dream Defs -->
        <linearGradient id="lca-glass-grad-curr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E040FB" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#2196F3" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="lca-glass-grad-opt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00E676" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#00E676" stop-opacity="0" />
        </linearGradient>

        <!-- Cyberpunk Tron Defs -->
        <linearGradient id="lca-tron-grad-curr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FF5252" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#FF5252" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="lca-tron-grad-opt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00E676" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#00E676" stop-opacity="0" />
        </linearGradient>

        <!-- Scientific Oscilloscope Dot Pattern -->
        <pattern id="lca-hud-dot" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.6" fill="#00e5ff" opacity="0.15" />
        </pattern>
      </defs>

      <!-- Matrix Canvas for HUD style -->
      <rect class="lca-hud-matrix" x="40" y="20" width="340" height="140" fill="url(#lca-hud-dot)" style="display:none;" />

      <!-- Sweeping HUD Oscilloscope Scan line -->
      <line class="lca-hud-scanner" x1="40" y1="20" x2="380" y2="20" stroke="#00e5ff" stroke-width="1.2" opacity="0" style="display:none;" />

      <!-- Grid Lines -->
      <line class="lca-grid-line" x1="40" y1="50" x2="380" y2="50" />
      <line class="lca-grid-line" x1="40" y1="100" x2="380" y2="100" />
      <line class="lca-grid-line" x1="40" y1="150" x2="380" y2="150" />
      <line class="lca-grid-line" x1="100" y1="20" x2="100" y2="160" />
      <line class="lca-grid-line" x1="200" y1="20" x2="200" y2="160" />
      <line class="lca-grid-line" x1="300" y1="20" x2="300" y2="160" />



      <!-- Dynamic Right-Angle indicators (Sandberg Minimalist Mode) -->
      <path class="lca-right-angle lca-ra-curr" d="M ${currCoord.x - 6},155 L ${currCoord.x - 6},149 L ${currCoord.x},149" />
      ${!isSame ? `
        <path class="lca-right-angle lca-ra-opt" d="M ${optCoord.x - 6},155 L ${optCoord.x - 6},149 L ${optCoord.x},149" />
      ` : ''}

      <!-- Axes -->
      <path class="lca-axis" d="M 40,20 L 40,160 L 380,160" stroke-linecap="round" stroke-linejoin="round" />
      <path class="lca-axis" d="M 375,157 L 380,160 L 375,163" fill="none" stroke-linecap="round" />
      <path class="lca-axis" d="M 37,25 L 40,20 L 43,25" fill="none" stroke-linecap="round" />

      <!-- Interactive Telemetry HUD Labels inside the graph (Style 5 HUD mode) -->
      <text class="lca-hud-label lca-hl-curr-dx" x="${currMidX}" y="166" text-anchor="middle">[dX: ${(currCoord.x - 40).toFixed(0)}]</text>
      <text class="lca-hud-label lca-hl-curr-dy" x="${currCoord.x + 6}" y="${currMidY + 3}" text-anchor="start">[dY: ${(155 - currCoord.y).toFixed(0)}]</text>
      <text class="lca-hud-label lca-hl-curr-slope" x="${currMidX}" y="${currMidY - 6}" text-anchor="middle" transform="rotate(${currAngle} ${currMidX} ${currMidY - 6})">[SLOPE: ${currSlope}]</text>
      ${!isSame ? `
        <text class="lca-hud-label lca-hl-opt-dx" x="${optMidX}" y="166" text-anchor="middle">[dX: ${(optCoord.x - 40).toFixed(0)}]</text>
        <text class="lca-hud-label lca-hl-opt-dy" x="${optCoord.x + 6}" y="${optMidY + 3}" text-anchor="start">[dY: ${(155 - optCoord.y).toFixed(0)}]</text>
        <text class="lca-hud-label lca-hl-opt-slope" x="${optMidX}" y="${optMidY - 6}" text-anchor="middle" transform="rotate(${optAngle} ${optMidX} ${optMidY - 6})">[SLOPE: ${optSlope}]</text>
      ` : ''}

      <!-- Axis Labels -->
      <text class="lca-axis-label" x="380" y="175" text-anchor="end">Size (N)</text>
      <text class="lca-axis-label" x="35" y="25" text-anchor="end" transform="rotate(-90 35 25)">${isSpace ? 'Memory' : 'Operations'}</text>

      <!-- Complexity Background Curves -->
      <path class="lca-curve-bg" d="M 40,150 L 380,150" />
      <path class="lca-curve-bg" d="M 40,155 Q 150,135 380,130" />
      <path class="lca-curve-bg" d="M 40,155 L 380,60" />
      <path class="lca-curve-bg" d="M 40,155 Q 200,105 380,35" />
      <path class="lca-curve-bg" d="M 40,155 Q 120,150 250,30" />
      <path class="lca-curve-bg" d="M 40,155 Q 60,150 100,30" />

      <!-- Colored Complexity Curves (Highlighted if active) -->
      <path class="lca-curve lca-c-o1 ${currKey==='o1' || optKey==='o1' ? 'active' : ''}" d="M 40,150 L 380,150" />
      <path class="lca-curve lca-c-ologn ${currKey==='ologn' || optKey==='ologn' ? 'active' : ''}" d="M 40,155 Q 150,135 380,130" />
      <path class="lca-curve lca-c-on ${currKey==='on' || optKey==='on' ? 'active' : ''}" d="M 40,155 L 380,60" />
      <path class="lca-curve lca-c-onlogn ${currKey==='onlogn' || optKey==='onlogn' ? 'active' : ''}" d="M 40,155 Q 200,105 380,35" />
      <path class="lca-curve lca-c-on2 ${currKey==='on2' || optKey==='on2' ? 'active' : ''}" d="M 40,155 Q 120,150 250,30" />
      <path class="lca-curve lca-c-o2n ${currKey==='o2n' || optKey==='o2n' ? 'active' : ''}" d="M 40,155 Q 60,150 100,30" />

      <!-- Optimization Target Path Line -->
      ${!isSame ? `
        <path class="lca-target-path" d="M ${currCoord.x},${currCoord.y} L ${optCoord.x},${optCoord.y}" />
      ` : ''}

      <!-- Cyberpunk Neon Concentric Pulse Halo Rings -->
      <circle class="lca-tron-pulse lca-tp-curr" cx="${currCoord.x}" cy="${currCoord.y}" r="5" stroke="#FF5252" />
      ${!isSame ? `<circle class="lca-tron-pulse lca-tp-opt" cx="${optCoord.x}" cy="${optCoord.y}" r="5" stroke="#00E676" />` : ''}

      <!-- Pulsing Rings under Dots -->
      ${isSame ? `
        <circle class="lca-pulse-ring lca-pulse-same" cx="${currCoord.x}" cy="${currCoord.y}" r="6" />
      ` : `
        <circle class="lca-pulse-ring lca-pulse-current" cx="${currCoord.x}" cy="${currCoord.y}" r="6" />
        <circle class="lca-pulse-ring lca-pulse-optimal" cx="${optCoord.x}" cy="${optCoord.y}" r="6" />
      `}

      <!-- Plotted Interactive Dots -->
      ${isSame ? `
        <circle class="lca-graph-dot lca-dot-same" cx="${currCoord.x}" cy="${currCoord.y}" r="5.5" data-type="same" data-val="${esc(currVal)}" />
        <text class="lca-graph-label" x="${currCoord.x}" y="${currCoord.y - 12}" text-anchor="middle">Submitted & Optimal</text>
      ` : `
        <circle class="lca-graph-dot lca-dot-current" cx="${currCoord.x}" cy="${currCoord.y}" r="5.5" data-type="current" data-val="${esc(currVal)}" />
        <circle class="lca-graph-dot lca-dot-optimal" cx="${optCoord.x}" cy="${optCoord.y}" r="5.5" data-type="optimal" data-val="${esc(optVal)}" />
        <text class="lca-graph-label" x="${currCoord.x}" y="${currCoord.y - 12}" text-anchor="middle">Submitted</text>
        <text class="lca-graph-label" x="${optCoord.x}" y="${optCoord.y - 12}" text-anchor="middle">Optimal</text>
      `}
    </svg>
  `;
}

function initEfficiencyGraph(container, e) {
  const placeholder = container.querySelector('.lca-graph-placeholder');
  const tooltip = container.querySelector('.lca-graph-tooltip');
  
  if (!placeholder || !e) return;

  function renderGraph(isSpace) {
    const currVal = formatComplexity(isSpace ? e.currentSpace : e.currentTime);
    const optVal = formatComplexity(isSpace ? e.suggestedSpace : e.suggestedTime);
    
    if (!currVal || !optVal) {
      placeholder.innerHTML = '<div style="text-align:center;padding:24px 10px;font-size:12px;color:var(--lca-text-dim);font-family:\'Inter\',sans-serif">No data available for this complexity graph.</div>';
      return;
    }

    placeholder.innerHTML = generateComplexitySvg(currVal, optVal, isSpace);

    // Setup interactive tooltips
    const dots = placeholder.querySelectorAll('.lca-graph-dot');
    dots.forEach(dot => {
      dot.addEventListener('mouseenter', () => {
        const type = dot.getAttribute('data-type');
        const val = dot.getAttribute('data-val');
        const cx = parseFloat(dot.getAttribute('cx'));
        const cy = parseFloat(dot.getAttribute('cy'));
        
        let title = 'Complexity';
        let desc = '';

        if (type === 'current') {
          title = isSpace ? 'Current Space Complexity' : 'Current Time Complexity';
          desc = `Complexity: <strong>${esc(val)}</strong><br>Tier: ${COMPLEXITY_COORDS[normalizeComplexity(val)]?.name || 'N/A'}`;
        } else if (type === 'optimal') {
          title = isSpace ? 'Optimal Space Complexity' : 'Optimal Time Complexity';
          desc = `Complexity: <strong>${esc(val)}</strong><br>Tier: ${COMPLEXITY_COORDS[normalizeComplexity(val)]?.name || 'N/A'}`;
        } else {
          title = isSpace ? 'Space Complexity (Optimal)' : 'Time Complexity (Optimal)';
          desc = `Complexity: <strong>${esc(val)}</strong><br>Tier: ${COMPLEXITY_COORDS[normalizeComplexity(val)]?.name || 'N/A'}`;
        }

        tooltip.innerHTML = `<strong>${title}</strong>${desc}`;
        tooltip.className = 'lca-graph-tooltip visible';
        // Offset by SVG padding (16px left) to align tooltip over the dot
        const svgPadLeft = 16;
        const svgPadTop  = 16;
        const svgWidth  = 400;
        const svgHeight = 200;
        const wrapperRect = placeholder.getBoundingClientRect();
        const drawW = wrapperRect.width  - svgPadLeft * 2;
        const drawH = wrapperRect.height - svgPadTop  * 2;
        tooltip.style.left = `${svgPadLeft + (cx / svgWidth)  * drawW}px`;
        tooltip.style.top  = `${svgPadTop  + (cy / svgHeight) * drawH}px`;
        tooltip.style.transform = 'translate(-50%, -120%) scale(1)';
      });

      dot.addEventListener('mouseleave', () => {
        tooltip.className = 'lca-graph-tooltip';
      });
    });
  }

  // Initial draw
  renderGraph(false);

  // Tabs click handlers
  const tabs = container.querySelectorAll('.lca-graph-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isSpace = tab.getAttribute('data-tab') === 'space';
      renderGraph(isSpace);
    });
  });
}

function buildEfficiencyHtml(e) {
  if (!e) return errHtml('No efficiency data');
  const hasGraph = e.currentTime && e.suggestedTime;

  return `
    <div class="lca-wh"><span class="lca-wh-icon">${ICON_EFFICIENCY}</span><span class="lca-wh-title">Efficiency</span></div>
    <div class="lca-grid">
      ${card('Time · Current',  formatComplexity(e.currentTime),   true)}
      ${card('Time · Optimal',  formatComplexity(e.suggestedTime), true)}
      ${e.currentSpace   ? card('Space · Current',  formatComplexity(e.currentSpace),   true) : ''}
      ${e.suggestedSpace ? card('Space · Optimal', formatComplexity(e.suggestedSpace), true) : ''}
    </div>
    
    ${hasGraph ? `
      <div class="lca-graph-header">
        <div class="lca-lbl" style="padding-top: 8px">Complexity Curve</div>
        ${(e.currentSpace && e.suggestedSpace) ? `
          <div class="lca-graph-tabs">
            <button class="lca-graph-tab active" data-tab="time">Time</button>
            <button class="lca-graph-tab" data-tab="space">Space</button>
          </div>
        ` : ''}
      </div>
      <div class="lca-graph-wrapper">
        <div class="lca-graph-placeholder"></div>
        <div class="lca-graph-tooltip"></div>
        <div class="lca-graph-legend">
          <div class="lca-legend-item"><span class="lca-legend-color lca-leg-exc"></span>O(1) / O(log N)</div>
          <div class="lca-legend-item"><span class="lca-legend-color lca-leg-good"></span>O(N)</div>
          <div class="lca-legend-item"><span class="lca-legend-color lca-leg-fair"></span>O(N log N)</div>
          <div class="lca-legend-item"><span class="lca-legend-color lca-leg-poor"></span>O(N²) / O(2ᴺ)</div>
        </div>
      </div>
    ` : ''}
    
    ${note('Suggestions', e.suggestions)}
  `;
}

function buildStyleHtml(cs) {
  const styleHtml = cs ? `
    <div class="lca-wh"><span class="lca-wh-icon">${ICON_STYLE}</span><span class="lca-wh-title">Code Style</span></div>
    <div class="lca-grid">
      ${cs.readability ? ratingCard('Readability', cs.readability) : ''}
      ${cs.structure ? ratingCard('Structure', cs.structure) : ''}
    </div>
    ${note('Suggestions', cs.suggestions)}
  ` : '';
  return styleHtml || errHtml('No style data');
}




// ── Tetris Loader (Vanilla JS adaptation) ────────────────
const TETRIS_PIECES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0], [1, 0], [1, 1]], // L
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[0, 1], [0, 1], [1, 1]], // J
];

class TetrisLoader {
  constructor(container) {
    this.container = container;
    this.cols = 10;
    this.rows = 12;
    this.speed = 40;
    this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    this.cells = [];
    this.fallingPiece = null;
    this.isClearing = false;
    this.reqId = null;
    this.lastUpdate = 0;
    this.stopped = false;
    
    this.initDOM();
    this.loop = this.loop.bind(this);
    this.reqId = requestAnimationFrame(this.loop);
  }

  initDOM() {
    this.container.innerHTML = '';
    this.container.className = 'lca-tetris';
    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      let rowDiv = document.createElement('div');
      rowDiv.className = 'lca-tetris-row';
      for (let c = 0; c < this.cols; c++) {
        let cell = document.createElement('div');
        cell.className = 'lca-tetris-cell';
        rowDiv.appendChild(cell);
        this.cells[r][c] = cell;
      }
      this.container.appendChild(rowDiv);
    }
  }

  rotate(shape) {
    const rows = shape.length, cols = shape[0].length;
    const rot = Array(cols).fill().map(() => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rot[c][rows - 1 - r] = shape[r][c];
      }
    }
    return rot;
  }

  spawn() {
    let shape = TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)];
    const rots = Math.floor(Math.random() * 4);
    for (let i = 0; i < rots; i++) shape = this.rotate(shape);
    
    this.fallingPiece = {
      shape,
      x: Math.floor(Math.random() * (this.cols - shape[0].length + 1)),
      y: -shape.length
    };
  }

  canPlace(p, newX, newY) {
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c]) {
          let gx = newX + c, gy = newY + r;
          if (gx < 0 || gx >= this.cols || gy >= this.rows) return false;
          if (gy >= 0 && this.grid[gy][gx]) return false;
        }
      }
    }
    return true;
  }

  place(p) {
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c]) {
          let gx = p.x + c, gy = p.y + r;
          if (gy >= 0 && gy < this.rows && gx >= 0 && gx < this.cols) {
            this.grid[gy][gx] = 1;
          }
        }
      }
    }
  }

  clearLines() {
    let lines = [];
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r].every(c => c)) lines.push(r);
    }
    if (lines.length > 0) {
      this.isClearing = true;
      lines.forEach(r => {
        for (let c = 0; c < this.cols; c++) {
          if (this.cells[r] && this.cells[r][c]) this.cells[r][c].classList.add('clearing');
        }
      });
      setTimeout(() => {
        if (!this.reqId) return; // stopped
        lines.forEach(r => {
          this.grid.splice(r, 1);
          this.grid.unshift(Array(this.cols).fill(0));
        });
        this.isClearing = false;
      }, 200);
    }
  }

  checkReset() {
    for (let r = 0; r < 3; r++) {
      if (this.grid[r].filter(c => c).length > this.cols * 0.7) {
        this.isClearing = true;
        setTimeout(() => {
          if (!this.reqId) return;
          this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
          this.fallingPiece = null;
          this.isClearing = false;
        }, 500);
        return true;
      }
    }
    return false;
  }

  loop(timestamp) {
    if (this.stopped) return;
    if (!this.lastUpdate) this.lastUpdate = timestamp;
    if (timestamp - this.lastUpdate >= this.speed) {
      this.lastUpdate = timestamp;
      if (!this.isClearing && !this.checkReset()) {
        if (!this.fallingPiece) {
          this.spawn();
        } else {
          let newY = this.fallingPiece.y + 1;
          if (this.canPlace(this.fallingPiece, this.fallingPiece.x, newY)) {
            this.fallingPiece.y = newY;
          } else {
            this.place(this.fallingPiece);
            setTimeout(() => this.clearLines(), 50);
            this.spawn();
          }
        }
      }
      this.render();
    }
    this.reqId = requestAnimationFrame(this.loop);
  }

  render() {
    let disp = this.grid.map(r => [...r]);
    if (this.fallingPiece && !this.isClearing) {
      let p = this.fallingPiece;
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c]) {
            let gx = p.x + c, gy = p.y + r;
            if (gy >= 0 && gy < this.rows && gx >= 0 && gx < this.cols) {
              disp[gy][gx] = 1;
            }
          }
        }
      }
    }
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let cell = this.cells[r][c];
        if (!this.isClearing) cell.classList.remove('clearing');
        if (disp[r][c]) cell.classList.add('filled');
        else cell.classList.remove('filled');
      }
    }
  }

  stop() {
    this.stopped = true;
    if (this.reqId) {
      cancelAnimationFrame(this.reqId);
      this.reqId = null;
    }
  }
}

// ─── HTML helpers ─────────────────────────────────────────
function row(label, content) {
  return `<div class="lca-row"><span class="lca-lbl">${label}</span>${content}</div>`;
}
function tags(arr, cls) {
  return `<div class="lca-tags">${arr.map(t=>`<span class="lca-tag ${cls}">${esc(t)}</span>`).join('')}</div>`;
}
function problemTags(arr, cls) {
  const getProblemSlug = (name) => name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `<div class="lca-tags">${arr.map(t=>`<a href="/problems/${getProblemSlug(t)}/" target="_blank" class="lca-tag ${cls}" style="text-decoration: none !important; cursor: pointer !important;">${esc(t)}</a>`).join('')}</div>`;
}
function note(label, text) {
  if (!text) return '';
  return `<div class="lca-note"><div class="lca-note-lbl">${label}</div><div class="lca-note-txt">${esc(text)}</div></div>`;
}
function card(label, val, mono) {
  if (!val) return '';
  return `<div class="lca-card"><div class="lca-card-lbl">${label}</div><div class="lca-card-val${mono?' mono':''}">${esc(val)}</div></div>`;
}
function ratingCard(label, val) {
  if (!val) return '';
  const cls = {excellent:'c-e',good:'c-g',fair:'c-f',poor:'c-p'}[val.toLowerCase()]||'c-f';
  return `<div class="lca-card"><div class="lca-card-lbl">${label}</div><div class="lca-card-val ${cls}">${esc(val)}</div></div>`;
}
function errHtml(msg, type, id, data, renderFn) {
  const safeMsg = msg || 'Unknown error';
  const isRateLimit = safeMsg.includes('RATE_LIMIT') || safeMsg.includes('Rate limit') || safeMsg.includes('rate_limit');
  const isInvalidKey = safeMsg.includes('INVALID_API_KEY') || safeMsg.includes('Invalid API key') || safeMsg.includes('401');

  let displayMsg, extraHtml = '';
  if (isInvalidKey) {
    displayMsg = 'Invalid or missing API key.';
    extraHtml = `<div style="margin-top:6px;font-size:12px;color:var(--lca-text-sub);">
      Click the <strong>Orthex extension icon</strong> in your toolbar to enter a valid Groq API key.
    </div>`;
  } else if (isRateLimit) {
    displayMsg = 'Rate limited by API provider. Please wait and retry.';
  } else {
    displayMsg = safeMsg;
  }

  return `<div class="lca-err">
    <span>${ICON_ERR}</span>
    <div class="lca-err-txt">
      <strong>Error:</strong> ${esc(displayMsg)}
      ${extraHtml}
      <div style="margin-top:8px;">
        <button class="lca-retry-btn" style="display:inline-flex; align-items:center; justify-content:center; gap:4px; padding:4px 12px; height:26px;">${ICON_REGEN} Retry</button>
      </div>
    </div>
  </div>`;
}
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function highlightSyntax(code) {
  if (!code) return '';
  const placeholders = {};
  let pIdx = 0;
  let text = code;
  
  const extractAndReplace = (regex, cls) => {
    text = text.replace(regex, (match) => {
      const ph = `__LCA_PH_${pIdx++}__`;
      placeholders[ph] = `<span class="${cls}">${esc(match)}</span>`;
      return ph;
    });
  };
  
  extractAndReplace(/\/\*[\s\S]*?\*\//g, 'lca-token-cmt');
  extractAndReplace(/(\/\/|#).*?$/gm, 'lca-token-cmt');
  extractAndReplace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, 'lca-token-str');
  
  text = esc(text);
  
  const keywords = /\b(return|if|else|while|for|do|break|continue|switch|case|default|try|catch|finally|throw|new|this|super|class|extends|implements|interface|function|var|let|const|import|export|from|yield|await|async|def|pass|None|True|False|elif|public|private|protected|static|final|void|int|float|double|char|boolean|bool|string|String|auto|namespace|using|struct|enum|typedef|inline|virtual|override)\b/g;
  text = text.replace(keywords, '<span class="lca-token-kw">$1</span>');
  
  const builtins = /\b(console|window|document|Math|JSON|Promise|print|System|out|println|cout|cin|endl|vector|map|set|list|dict|len|range|self)\b/g;
  text = text.replace(builtins, '<span class="lca-token-blt">$1</span>');
  
  text = text.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, '<span class="lca-token-fn">$1</span>');
  text = text.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="lca-token-num">$1</span>');
  
  for (const ph in placeholders) {
    text = text.replace(ph, placeholders[ph]);
  }
  return text;
}

// ─── Error on all widgets ─────────────────────────────────
function showErrAll(code) {
  const msgs = { INVALID_API_KEY:'Invalid API key.', RATE_LIMIT:'Rate limited — wait and retry.' };
  const msg = msgs[code] || code;
  ['lca-w-approach','lca-w-efficiency','lca-w-style'].forEach(id => {
    const w = document.getElementById(id);
    if (w) w.innerHTML = `<div class="lca-err"><span>${ICON_ERR}</span><div class="lca-err-txt"><strong>Analysis failed:</strong> ${esc(msg)}<br><button class="lca-retry" onclick="(function(){document.querySelectorAll('.lca-widget').forEach(el=>el.remove());})()">Dismiss</button></div></div>`;
  });
}

// ─── Utilities ────────────────────────────────────────────
async function getSettings() {
  if (!chrome.runtime?.id) {
    console.warn('[LCA] Extension context invalidated. Please refresh the page.');
    return { hasKey: false, autoAnalyze: false, analyzeOnWrongAnswer: false, analyzeOnTLE: false, uiStyle: 'classic' };
  }
  return new Promise(r => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, res => {
        if (chrome.runtime.lastError) {
          r({ hasKey: false, autoAnalyze: false, uiStyle: 'classic' });
        } else {
          r(res || { hasKey: false, autoAnalyze: true, uiStyle: 'classic' });
        }
      });
    } catch (e) {
      r({ hasKey: false, autoAnalyze: false, uiStyle: 'classic' });
    }
  });
}

// ─── Caching Utilities ─────────────────────────────────────
function getHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return Math.abs(h).toString(36);
}
function getCacheKey(data) {
  if (data.submissionId) return `lca_c_${data.submissionId}`;
  return `lca_c_${getHash(data.code + data.language + (data.verdict||''))}`;
}
function getSolCacheKey(problemTitle, language, solutionType) {
  return `lca_sol_${getHash(problemTitle + language + solutionType)}`;
}
async function getCachedResult(key) {
  try {
    if (!chrome.storage || !chrome.storage.local) return null;
    return await new Promise(resolve => {
      chrome.storage.local.get([key], (res) => {
        if (chrome.runtime.lastError) {
          console.warn('[LCA] Cache read error:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(res[key] || null);
        }
      });
    });
  } catch (e) {
    console.warn('[LCA] Exception reading cache:', e);
    return null;
  }
}
async function saveToCache(key, result) {
  try {
    if (!chrome.storage || !chrome.storage.local) return;
    return await new Promise(resolve => {
      chrome.storage.local.get(['lca_cache_keys'], (res) => {
        if (chrome.runtime.lastError) return resolve();
        let keys = res.lca_cache_keys || [];
        keys = keys.filter(k => k !== key);
        keys.push(key);
        
        const MAX_CACHE_SIZE = 50;
        let keysToRemove = [];
        if (keys.length > MAX_CACHE_SIZE) {
          keysToRemove = keys.splice(0, keys.length - MAX_CACHE_SIZE);
        }
        
        const toSet = { lca_cache_keys: keys, [key]: result };
        chrome.storage.local.set(toSet, () => {
          if (chrome.runtime.lastError) return resolve();
          if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, resolve);
          } else {
            resolve();
          }
        });
      });
    });
  } catch (e) {
    console.warn('[LCA] Exception writing cache:', e);
  }
}

function trackUsage() {
  const d = new Date().toISOString().slice(0,10);
  chrome.storage.local.get(['analysisCount','analysisDates'], r => {
    chrome.storage.local.set({ analysisCount:(r.analysisCount||0)+1,
      analysisDates:{...(r.analysisDates||{}),[d]:((r.analysisDates||{})[d]||0)+1} });
  });
}

// ─── Solutions Generator Functions ──────────────────────

async function injectSolutionsBtn() {
  const descPanel = findDescriptionPanel();
  if (!descPanel) return;
  if (document.getElementById('lca-solutions-btn-container')) return;
  solBtnInjected = true;

  const btnContainer = document.createElement('div');
  btnContainer.id = 'lca-solutions-btn-container';
  btnContainer.style.margin = '16px 0 0 0';
  btnContainer.style.display = 'flex';
  btnContainer.style.justifyContent = 'flex-start';

  const btn = document.createElement('button');
  btn.id = 'lca-solutions-btn';
  
  const s = await getSettings();
  const styleClass = s.uiStyle === 'neubrutalist' ? ' lca-neubrutalist' : '';
  btn.className = 'lca-btn ' + getThemeClass() + styleClass;
  btn.innerHTML = `${ICON_SPARKLES} Reference Solutions`;
  
  btnContainer.appendChild(btn);
  descPanel.insertAdjacentElement('afterend', btnContainer);
  
  console.log('[LCA] Injected solutions button.');

  btn.addEventListener('click', () => {
    const existing = document.getElementById('lca-solutions-container');
    if (existing) { existing.remove(); return; }
    openSolutionsPanel();
  });
}

// ── Open the solutions panel (tabbed, per-tab generate) ───────────────────────
async function openSolutionsPanel() {
  const descPanel = findDescriptionPanel();
  if (!descPanel) return;

  document.getElementById('lca-solutions-container')?.remove();

  const container = document.createElement('div');
  container.id = 'lca-solutions-container';

  const s = await getSettings();
  const styleClass = s.uiStyle === 'neubrutalist' ? ' lca-neubrutalist' : '';
  container.className = 'lca-container ' + getThemeClass() + styleClass;
  container.style.marginTop = '12px';

  // Gradient background
  if (s.uiStyle !== 'neubrutalist') {
    const gradBg = document.createElement('div');
    gradBg.className = 'lca-gradient-bg';
    gradBg.innerHTML = `
      <div class="lca-grad-blob lca-grad-1"></div>
      <div class="lca-grad-blob lca-grad-2"></div>
      <div class="lca-grad-blob lca-grad-3"></div>
    `;
    container.appendChild(gradBg);
  }

  const btnContainer = document.getElementById('lca-solutions-btn-container');
  if (btnContainer) btnContainer.insertAdjacentElement('afterend', container);
  else descPanel.insertAdjacentElement('afterend', container);

  // Problem meta needed for generation
  const problemTitle   = extractProblemTitle();
  const language       = extractLanguage();
  const difficulty     = extractDifficulty();
  const description    = extractProblemDescription();
  const defaultCode    = extractCode();

  // Tab definitions — fixed 3 types always shown
  const SOL_TYPES = ['The Intern Approach', 'L5 Engineer Approach', 'Staff Architect Approach'];
  // Store generated solutions keyed by type
  const generated = {}; // type -> solution object

  // ── Pre-load all 3 types from cache immediately ───────────────────────────
  // We do this BEFORE setting up the listener so cache hits render instantly
  // with no race condition.
  for (const t of SOL_TYPES) {
    const key = getSolCacheKey(problemTitle, language, t);
    getCachedResult(key).then(cached => {
      if (cached) {
        console.log('[LCA] Cache hit for solution:', t);
        generated[t] = cached;
        // If this tab is already active, render it now
        if (typeof activeType !== 'undefined' && activeType === t) {
          renderTabBody(t);
        }
      }
    });
  }

  if (window.orthexSolListener) {
    chrome.runtime.onMessage.removeListener(window.orthexSolListener);
  }

  let renderTimeout = null;
  window.orthexSolListener = (msg) => {
    if (msg.type === 'ANALYZE_PASS1_DONE') {
      generated[msg.solutionType] = {
        type: msg.solutionType,
        name: msg.solutionType,
        timeComplexity: msg.timeComplexity,
        spaceComplexity: msg.spaceComplexity,
        code: msg.code,
        stepByStep: ''
      };
      if (activeType === msg.solutionType) renderTabBody(msg.solutionType);
      
      // Re-enable tabs
      const tabs = document.querySelectorAll('#lca-solutions-container .lca-graph-tab');
      tabs.forEach(t => { t.disabled = false; t.style.opacity = ''; });

      // Mark the step-by-step div as streaming so the blink cursor shows
      const contentDiv = document.getElementById('lca-sol-body')?.querySelector('.lca-step-by-step-approach');
      if (contentDiv) {
        contentDiv.classList.add('is-streaming');
        contentDiv.innerHTML = '<p style="color:var(--lca-muted);font-size:13px;">Generating explanation…</p>';
      }
    } else if (msg.type === 'ANALYZE_STREAM_CHUNK') {
      if (generated[msg.solutionType]) {
        generated[msg.solutionType].stepByStep += msg.chunk;
        if (activeType === msg.solutionType) {
          // During streaming, do a lightweight debounced render (partial markdown)
          if (!renderTimeout) {
            renderTimeout = setTimeout(() => {
              const contentDiv = document.getElementById('lca-sol-body')?.querySelector('.lca-step-by-step-approach');
              if (contentDiv) {
                contentDiv.innerHTML = renderMarkdown(generated[msg.solutionType].stepByStep);
                contentDiv.classList.add('is-streaming');
              }
              renderTimeout = null;
            }, 80);
          }
        }
      }
    } else if (msg.type === 'ANALYZE_STREAM_DONE') {
      if (renderTimeout) { clearTimeout(renderTimeout); renderTimeout = null; }
      // Store full text regardless of active tab so switching tabs shows it
      if (generated[msg.solutionType]) {
        // Save to persistent cache so next panel open is instant
        const solCacheKey = getSolCacheKey(problemTitle, language, msg.solutionType);
        saveToCache(solCacheKey, generated[msg.solutionType]);
        // If the tab is active, render now; otherwise it will render when user switches
        if (activeType === msg.solutionType) {
          const contentDiv = document.getElementById('lca-sol-body')?.querySelector('.lca-step-by-step-approach');
          if (contentDiv) {
            contentDiv.classList.remove('is-streaming');
            contentDiv.innerHTML = renderMarkdown(generated[msg.solutionType].stepByStep);
          }
          if (window.mermaid) {
            renderMermaidDiagrams(contentDiv);
          }
        }
      }
    }
  };
  chrome.runtime.onMessage.addListener(window.orthexSolListener);

  // ── Widget ───────────────────────────────────────────────────────────
  const widget = document.createElement('div');
  widget.className = 'lca-widget';

  widget.innerHTML = `
    <div class="lca-wh" style="justify-content:space-between; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:7px;">
        <span class="lca-wh-icon" style="display:flex;align-items:center;">${ICON_SPARKLES}</span>
        <span class="lca-wh-title">Reference Solutions</span>
      </div>
    </div>

    <div class="lca-graph-tabs" style="margin-bottom:16px; margin-top:0;">
      ${SOL_TYPES.map((t, i) => `<button class="lca-graph-tab${i === 0 ? ' active' : ''}" data-sol-type="${t}">${t}</button>`).join('')}
    </div>

    <div id="lca-sol-body"></div>
  `;
  container.appendChild(widget);

  const bodyEl = widget.querySelector('#lca-sol-body');
  const tabs   = widget.querySelectorAll('.lca-graph-tab');
  let activeType = SOL_TYPES[0];

  if (window.marked) {
    const renderer = new window.marked.Renderer();
    renderer.code = function({text, lang}) {
      if (lang === 'mermaid') {
        // Sanitize the Mermaid source, then ESCAPE HTML chars so the browser
        // doesn't parse `<` or `>` as tags when this is injected into innerHTML.
        const clean = sanitizeMermaidSource(text);
        const escaped = clean.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<div class="mermaid">${escaped}</div>`;
      }
      const unescapedCode = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      return `<div class="lca-note lca-code-block" style="border:1px solid var(--lca-primary-border);border-radius:6px;padding:12px 14px;position:relative;overflow:hidden;background:rgba(0,0,0,0.02);margin:12px 0;"><pre style="margin:0;font-family:'JetBrains Mono',monospace;font-size:12.5px;overflow-x:auto;color:var(--lca-ink);padding-top:4px;line-height:1.5;">${highlightSyntax ? highlightSyntax(unescapedCode) : unescapedCode}</pre></div>`;
    };
    window.marked.use({ renderer: renderer });
  }

  // ── Markdown renderer ──────────────
  function renderMarkdown(md) {
    if (!md) return '';
    if (window.marked) {
      return window.marked.parse(md);
    }
    return md;
  }

  // ── Render the body for the active tab ───────────────────────────────
  function renderTabBody(type) {
    const sol = generated[type];

    if (!sol) {
      // Empty state — show a "Generate" button
      bodyEl.innerHTML = `
        <div style="text-align:center; padding:40px 20px 32px;">
          <div style="margin-bottom:12px; display:flex; justify-content:center; align-items:center;">${ICON_LIGHTBULB}</div>
          <div class="lca-sol-empty-title">${type} Solution</div>
          <div style="font-size:13px; color:var(--lca-muted); margin-bottom:24px; max-width:320px; margin-left:auto; margin-right:auto; line-height:1.5;">
            Click the button below to generate the ${type.toLowerCase()} approach with a full step-by-step breakdown.
          </div>
          <button id="lca-gen-single-btn" class="lca-btn ${getThemeClass()}" style="margin:0 auto; display:inline-flex; align-items:center; gap:6px; font-size:13px; padding:10px 22px;">
            ${ICON_SPARKLES} Generate ${type}
          </button>
        </div>
      `;
      const genBtn = bodyEl.querySelector('#lca-gen-single-btn');
      genBtn.addEventListener('click', () => generateSingle(type));
      return;
    }

    // Rendered solution
    const timeBadgeClass = sol.type === 'Staff Architect Approach' ? 'c-g' : sol.type === 'L5 Engineer Approach' ? 'c-e' : 'c-f';
    bodyEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h4 class="lca-sol-h4">${esc(sol.name || type)}</h4>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <span class="${timeBadgeClass}" style="font-size:11px; padding:2px 8px; font-family:'Inter',sans-serif; font-weight:600; border-radius:4px;">Time: ${esc(sol.timeComplexity || '?')}</span>
          <span class="c-p" style="font-size:11px; padding:2px 8px; font-family:'Inter',sans-serif; font-weight:600; border-radius:4px;">Space: ${esc(sol.spaceComplexity || '?')}</span>
          <button id="lca-sol-regen-btn" class="lca-retry-btn" style="font-size:11px; padding:3px 8px; height:26px; display:flex; align-items:center; gap:4px;">${ICON_REGEN} Regenerate</button>
        </div>
      </div>

      <div class="lca-note lca-code-block" style="border:1px solid var(--lca-primary-border); border-radius:6px; padding:12px 14px; position:relative; overflow:hidden; margin-bottom:16px;">
        <div style="position:absolute; right:8px; top:8px; display:flex; gap:6px;">
          <button id="lca-sol-paste-btn" class="lca-retry-btn" style="font-size:10px; padding:4px 8px; height:26px; display:inline-flex; align-items:center; justify-content:center; gap:4px;">${ICON_PASTE} Paste to Editor</button>
          <button id="lca-sol-copy-btn" class="lca-retry-btn" style="font-size:10px; padding:4px 8px; height:26px; display:inline-flex; align-items:center; justify-content:center; gap:4px;">${ICON_COPY} Copy</button>
        </div>
        <pre style="margin:0; font-family:'JetBrains Mono',monospace; font-size:12.5px; overflow-x:auto; color:var(--lca-ink); padding-top:4px; line-height:1.5;">${highlightSyntax(sol.code)}</pre>
      </div>

      <div class="lca-step-by-step-approach" style="margin-top:16px;">
        ${renderMarkdown(sol.stepByStep)}
      </div>
    `;

    bodyEl.querySelector('#lca-sol-copy-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(sol.code).then(() => {
        const btn = bodyEl.querySelector('#lca-sol-copy-btn');
        if (btn) { btn.innerHTML = `${ICON_CHECK} Copied`; setTimeout(() => { btn.innerHTML = `${ICON_COPY} Copy`; }, 2000); }
      });
    });

    bodyEl.querySelector('#lca-sol-paste-btn')?.addEventListener('click', () => {
      handlePasteClick(sol.code, language, defaultCode);
    });

    bodyEl.querySelector('#lca-sol-regen-btn')?.addEventListener('click', () => {
      // Clear persistent cache for this solution type so a fresh generation is forced
      const solCacheKey = getSolCacheKey(problemTitle, language, type);
      chrome.storage.local.remove(solCacheKey, () => {
        console.log('[LCA] Cleared cache for:', type);
      });
      delete generated[type];
      renderTabBody(type);
      generateSingle(type);
    });

    if (window.mermaid) {
      setTimeout(() => {
        const scope = bodyEl.querySelector('.lca-step-by-step-approach');
        if (scope) renderMermaidDiagrams(scope);
      }, 50); // slight delay for DOM insertion
    }
  }

  // ── Generate a single solution type via service worker ───────────────
  async function generateSingle(type) {
    // Show loading state in body
    bodyEl.innerHTML = `
      <div style="padding:32px 20px;">
        <div class="lca-wh" style="margin-bottom:16px;">
          <span class="lca-wh-icon" style="display:flex;align-items:center;">${ICON_SPARKLES}</span>
          <span class="lca-wh-title">Generating ${type} Solution...</span>
        </div>
        <div class="lca-tetris-wrapper"></div>
        <div style="text-align:center; font-family:'Inter',sans-serif; font-size:13px; color:var(--lca-muted); margin-top:16px;">
          Building code + step-by-step breakdown. This may take up to 30 seconds…
        </div>
      </div>
    `;
    const loaderEl = bodyEl.querySelector('.lca-tetris-wrapper');
    let loader = null;
    if (loaderEl) loader = new TetrisLoader(loaderEl);

    // Disable the active tab button during generation
    tabs.forEach(t => { t.disabled = true; t.style.opacity = '0.6'; });

    try {
      chrome.runtime.sendMessage({
        type: 'GENERATE_SINGLE_SOLUTION',
        payload: { problemTitle, difficulty, language, description, defaultCode, solutionType: type }
      }, (res) => {
        if (loader) loader.stop();
        if (chrome.runtime.lastError || !chrome.runtime?.id) return;
        
        if (!res || !res.success) {
          tabs.forEach(t => { t.disabled = false; t.style.opacity = ''; });
          // Error state
          bodyEl.innerHTML = `
            <div style="padding:24px 20px;">
              <div class="lca-wh" style="margin-bottom:12px;">
                <span class="lca-wh-icon" style="color:var(--lca-error); display:flex; align-items:center;">${ICON_ERR}</span>
                <span class="lca-wh-title">Generation Failed</span>
              </div>
              <div style="font-size:13px; color:var(--lca-error); margin-bottom:16px;">${res?.error || 'Unknown error. Check your API key and internet connection.'}</div>
              <button id="lca-gen-retry-btn" class="lca-btn ${getThemeClass()}" style="display:inline-flex; align-items:center; gap:6px; font-size:13px; padding:8px 18px;">
                ${ICON_REGEN} Retry
              </button>
            </div>
          `;
          bodyEl.querySelector('#lca-gen-retry-btn')?.addEventListener('click', () => generateSingle(type));
        }
      });
    } catch (e) {
      if (loader) loader.stop();
      tabs.forEach(t => { t.disabled = false; t.style.opacity = ''; });
      alert('Extension context invalidated. Please refresh the page.');
    }
  }

  // ── Wire up tab switching ─────────────────────────────────────────────
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.disabled) return;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeType = tab.getAttribute('data-sol-type');
      renderTabBody(activeType);
    });
  });

  // Show initial empty state for first tab
  renderTabBody(activeType);
}

// Paste to Editor feature
// Uses a page-world script (scripts/page-injector.js) loaded as a
// web_accessible_resource. Content scripts live in an isolated world and
// cannot access window.monaco directly; the injector bridges that gap via
// window.postMessage so we never violate LeetCode's Content Security Policy.

let _injectorReady = false;

function ensureInjector() {
  if (_injectorReady) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('scripts/page-injector.js');
    script.onload = () => {
      _injectorReady = true;
      script.remove(); // clean up the tag; the listener stays alive
      resolve();
    };
    (document.head || document.documentElement).appendChild(script);
  });
}

function injectCodeToEditor(code) {
  ensureInjector().then(() => {
    // One-time listener for the result
    const handler = (event) => {
      if (!event.data || event.data.source !== 'orthex-page') return;
      if (event.data.type !== 'LCA_PASTE_RESULT') return;
      window.removeEventListener('message', handler);
      if (!event.data.success) {
        console.error('[LCA] Paste failed:', event.data.error);
        // Fallback: copy to clipboard and inform user
        navigator.clipboard.writeText(code).then(() => {
          alert('Could not inject directly into the editor. The code has been copied to your clipboard — just press Ctrl+A then Ctrl+V in the editor!');
        });
      }
    };
    window.addEventListener('message', handler);

    // Send the code to the page world
    window.postMessage({ source: 'orthex-content', type: 'LCA_PASTE_CODE', code }, '*');
  });
}

function showConfirmModal(title, message, onConfirm) {
  const existing = document.getElementById('lca-confirm-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'lca-confirm-modal';
  overlay.className = 'lca-modal-overlay';
  overlay.innerHTML = `
    <div class="lca-modal-box">
      <h3 style="margin:0 0 8px 0; font-size:16px; font-family:'Bricolage Grotesque',sans-serif; font-weight:700; color:var(--lca-text-head);">${title}</h3>
      <p style="margin:0 0 20px 0; font-size:13px; font-family:'Inter',sans-serif; color:var(--lca-muted); line-height:1.5;">${message}</p>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button id="lca-modal-cancel" class="lca-btn" style="background:var(--lca-panel-bg); color:var(--lca-text-head); border:1px solid var(--lca-primary-border);">Cancel</button>
        <button id="lca-modal-confirm" class="lca-btn" style="background:var(--lca-primary); color:#fff; border:none;">Overwrite</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('lca-modal-cancel').addEventListener('click', () => overlay.remove());
  document.getElementById('lca-modal-confirm').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

function handlePasteClick(solutionCode, solutionLang, defaultCode) {
  const currentLang = extractLanguage();
  const currentCode = extractCode();
  
  if (currentLang && currentLang.toLowerCase() !== solutionLang.toLowerCase() && currentLang !== 'Unknown') {
    showConfirmModal(
      'Language Mismatch',
      `You are pasting a <b>${solutionLang}</b> solution into an editor currently set to <b>${currentLang}</b>. Are you sure you want to overwrite it?`,
      () => injectCodeToEditor(solutionCode)
    );
    return;
  }

  // If current code is significantly different from defaultCode, warn.
  const c1 = (currentCode||'').trim();
  const c2 = (defaultCode||'').trim();
  
  if (c1 && c1 !== c2 && c1.length > 10) {
    showConfirmModal(
      'Overwrite Editor?',
      'This will replace your current custom code in the editor with the Reference Solution. This cannot be undone. Are you sure?',
      () => injectCodeToEditor(solutionCode)
    );
  } else {
    injectCodeToEditor(solutionCode);
  }
}

})();
