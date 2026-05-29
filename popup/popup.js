// ============================================================
// Orthex — Popup Script
// Settings toggles, API key management, and usage stats
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadGroqKey();
  loadStats();
  updateProviderLabel();
});

// ── Load saved settings ───────────────────────────────────
function loadSettings() {
  chrome.storage.sync.get(['autoAnalyze', 'analyzeOnWrongAnswer', 'analyzeOnTLE', 'uiStyle'], (result) => {
    document.getElementById('toggle-auto').checked = result.autoAnalyze !== false;
    document.getElementById('toggle-wa').checked   = result.analyzeOnWrongAnswer !== false;
    document.getElementById('toggle-tle').checked  = result.analyzeOnTLE !== false;
    
    const currentStyle = result.uiStyle || 'classic';
    updatePopupStyleActiveSegment(currentStyle);
    applyPopupVisualTheme(currentStyle);
  });

  // Save immediately on any toggle change
  ['toggle-auto', 'toggle-wa', 'toggle-tle'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveSettings);
  });

  // Setup segmented button click listeners
  const segments = document.querySelectorAll('#style-segmented .p-segment');
  segments.forEach(seg => {
    seg.addEventListener('click', (e) => {
      const chosenStyle = e.target.getAttribute('data-style');
      updatePopupStyleActiveSegment(chosenStyle);
      applyPopupVisualTheme(chosenStyle);
      chrome.storage.sync.set({ uiStyle: chosenStyle });
    });
  });
}

function updatePopupStyleActiveSegment(style) {
  const segments = document.querySelectorAll('#style-segmented .p-segment');
  segments.forEach(seg => {
    if (seg.getAttribute('data-style') === style) {
      seg.classList.add('active');
    } else {
      seg.classList.remove('active');
    }
  });
}

function applyPopupVisualTheme(style) {
  if (style === 'neubrutalist') {
    document.body.classList.add('lca-neubrutalist');
  } else {
    document.body.classList.remove('lca-neubrutalist');
  }
}

function saveSettings() {
  chrome.storage.sync.set({
    autoAnalyze:          document.getElementById('toggle-auto').checked,
    analyzeOnWrongAnswer: document.getElementById('toggle-wa').checked,
    analyzeOnTLE:         document.getElementById('toggle-tle').checked,
  });
}

// ── Groq API Key management ───────────────────────────────
function loadGroqKey() {
  chrome.storage.sync.get(['groqApiKey'], (result) => {
    const keyInput = document.getElementById('groq-key-input');
    if (!keyInput) return;
    if (result.groqApiKey) {
      const k = result.groqApiKey;
      keyInput.placeholder = '••••••••' + k.slice(-6);
    }
  });

  const saveBtn = document.getElementById('groq-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', saveGroqKey);
  const keyInput = document.getElementById('groq-key-input');
  if (keyInput) keyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveGroqKey(); });
}

function saveGroqKey() {
  const keyInput  = document.getElementById('groq-key-input');
  const statusEl  = document.getElementById('groq-key-status');
  const statusDot = document.getElementById('status-dot');
  if (!keyInput || !statusEl) return;

  const key = keyInput.value.trim();

  // Allow clearing the key
  if (!key) {
    chrome.storage.sync.remove('groqApiKey', () => {
      statusEl.textContent = 'Groq key cleared.';
      statusEl.style.color = 'var(--lca-muted, #888)';
      keyInput.placeholder = 'gsk_...';
      updateProviderLabel();
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    });
    return;
  }

  if (!key.startsWith('gsk_')) {
    statusEl.textContent = 'Groq keys start with gsk_...';
    statusEl.style.color = 'var(--lca-error, #e74c3c)';
    return;
  }

  chrome.storage.sync.set({ groqApiKey: key }, () => {
    if (chrome.runtime.lastError) {
      statusEl.textContent = 'Failed to save. Try again.';
      statusEl.style.color = 'var(--lca-error, #e74c3c)';
      return;
    }
    keyInput.value = '';
    keyInput.placeholder = '••••••••' + key.slice(-6);
    statusEl.textContent = '⚡ Groq key saved. Solutions now ~10x faster!';
    statusEl.style.color = 'var(--lca-success, #27ae60)';
    if (statusDot) { statusDot.classList.add('p-status-dot--active'); }
    updateProviderLabel();
    setTimeout(() => { statusEl.textContent = ''; }, 4000);
  });
}

// Update the header subtitle to reflect which provider is active
function updateProviderLabel() {
  const label = document.getElementById('provider-label');
  if (!label) return;
  chrome.storage.sync.get(['groqApiKey'], (result) => {
    if (result.groqApiKey) {
      label.textContent = '⚡ Powered by Groq';
      label.style.color = 'var(--lca-primary)';
    } else {
      label.textContent = 'Please enter a Groq API Key';
      label.style.color = 'var(--lca-muted)';
    }
  });
}

// ── Load usage stats ──────────────────────────────────────
function loadStats() {
  const today = new Date().toISOString().slice(0, 10);

  chrome.storage.local.get(['analysisCount', 'analysisDates'], (result) => {
    const total = result.analysisCount || 0;
    const dates = result.analysisDates || {};
    const todayCount = dates[today] || 0;

    document.getElementById('stat-today').textContent = todayCount;
    document.getElementById('stat-total').textContent = total;
  });
}

// ── Interactive Mouse Follower for Fluid Background Animation ──
document.addEventListener('DOMContentLoaded', () => {
  const interactive = document.getElementById('lca-g-interactive');
  if (interactive) {
    let curX = 0, curY = 0;
    let tgX = 0, tgY = 0;

    function move() {
      curX += (tgX - curX) / 20;
      curY += (tgY - curY) / 20;
      interactive.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
      requestAnimationFrame(move);
    }

    window.addEventListener('mousemove', (e) => {
      // Offset relative to the absolute pointer element which starts at top-50%, left-50%
      const rect = interactive.getBoundingClientRect();
      tgX = e.clientX - window.innerWidth / 2;
      tgY = e.clientY - window.innerHeight / 2;
    });

    move();
  }
});
