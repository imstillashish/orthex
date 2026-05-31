// ============================================================
// Orthex — Popup Script (Multi-Page SPA)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initFluidBackground();
  
  loadSettings();
  loadGroqKey();
  loadStats();
  loadUpdates();
});

// ── SPA Router ──────────────────────────────────────────────
const pages = ['home', 'settings', 'stats'];
let currentPage = 'home';

function initRouter() {
  const tabs = document.querySelectorAll('.tab-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetPage = e.currentTarget.closest('.tab-item').getAttribute('data-page');
      if (targetPage !== currentPage) {
        navigateTo(targetPage);
      }
    });
  });
}

function navigateTo(targetPage) {
  const currentIndex = pages.indexOf(currentPage);
  const targetIndex = pages.indexOf(targetPage);
  const isForward = targetIndex > currentIndex;
  
  // Update Tabs
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab-item[data-page="${targetPage}"]`).classList.add('active');
  
  // Update Pages
  const currentEl = document.getElementById(`page-${currentPage}`);
  const targetEl = document.getElementById(`page-${targetPage}`);
  
  // Slide out current
  currentEl.classList.remove('active');
  currentEl.classList.add(isForward ? 'hidden-left' : 'hidden-right');
  
  // Slide in target
  // Reset target position instantly without transition
  targetEl.style.transition = 'none';
  targetEl.classList.remove('hidden-left', 'hidden-right', 'active');
  targetEl.classList.add(isForward ? 'hidden-right' : 'hidden-left');
  
  // Force reflow
  void targetEl.offsetWidth;
  
  // Add transition back and activate
  targetEl.style.transition = '';
  targetEl.classList.remove('hidden-left', 'hidden-right');
  targetEl.classList.add('active');
  
  currentPage = targetPage;
}

// ── Background Animation ─────────────────────────────────────
function initFluidBackground() {
  const interactive = document.getElementById('lca-g-interactive');
  if (interactive) {
    let curX = 0, curY = 0;
    let tgX = 0, tgY = 0;

    let animationId;
    function move() {
      if (Math.abs(tgX - curX) < 0.5 && Math.abs(tgY - curY) < 0.5) {
        animationId = null;
        return;
      }
      curX += (tgX - curX) / 30; // Slower, more ethereal than before
      curY += (tgY - curY) / 30;
      interactive.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
      animationId = requestAnimationFrame(move);
    }

    window.addEventListener('mousemove', (e) => {
      tgX = e.clientX - window.innerWidth / 2;
      tgY = e.clientY - window.innerHeight / 2;
      if (!animationId) move();
    });

    move();
  }
}

// ── Page: Home ───────────────────────────────────────────────
function updateHomeStatus(hasKey) {
  const dot = document.getElementById('status-dot-home');
  if (hasKey) {
    dot.classList.add('p-status-dot--active');
  } else {
    dot.classList.remove('p-status-dot--active');
  }
}
// Removed setupActionButtons

// ── Page: Settings ───────────────────────────────────────────
function loadSettings() {
  chrome.storage.sync.get(['autoAnalyze', 'analyzeOnWrongAnswer', 'analyzeOnTLE', 'uiStyle', 'onlyMajorUpdates'], (result) => {
    const ta = document.getElementById('toggle-auto');
    if (ta) ta.checked = result.autoAnalyze !== false;
    const tw = document.getElementById('toggle-wa');
    if (tw) tw.checked = result.analyzeOnWrongAnswer !== false;
    const tt = document.getElementById('toggle-tle');
    if (tt) tt.checked = result.analyzeOnTLE !== false;
    const tmu = document.getElementById('toggle-only-major');
    if (tmu) tmu.checked = result.onlyMajorUpdates !== false;
    
    const currentStyle = result.uiStyle || 'classic';
    updatePopupStyleActiveSegment(currentStyle);
    applyPopupVisualTheme(currentStyle);
  });

  // Save immediately on any toggle change
  ['toggle-auto', 'toggle-wa', 'toggle-tle', 'toggle-only-major'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', saveSettings);
  });

  // Setup segmented button click listeners
  const segments = document.querySelectorAll('#style-segmented .p-segment');
  segments.forEach(seg => {
    seg.addEventListener('click', (e) => {
      const chosenStyle = e.currentTarget.getAttribute('data-style');
      if (!chosenStyle) return; // safety
      
      updatePopupStyleActiveSegment(chosenStyle);
      applyPopupVisualTheme(chosenStyle);
      chrome.storage.sync.set({ uiStyle: chosenStyle });
      
      // Also notify the active tab to update its style if a LeetCode problem is open
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url.includes("leetcode.com")) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "update_ui_style", uiStyle: chosenStyle });
        }
      });
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
    autoAnalyze:          document.getElementById('toggle-auto')?.checked ?? true,
    analyzeOnWrongAnswer: document.getElementById('toggle-wa')?.checked ?? true,
    analyzeOnTLE:         document.getElementById('toggle-tle')?.checked ?? true,
    onlyMajorUpdates:     document.getElementById('toggle-only-major')?.checked ?? true,
  });
}

// Groq Key Logic
function loadGroqKey() {
  chrome.storage.sync.get(['groqApiKey'], (result) => {
    updateKeyDisplay(result.groqApiKey);
  });

  const clearBtn = document.getElementById('groq-key-clear');
  const keyInput = document.getElementById('groq-key-input');
  const eyeBtn = document.getElementById('groq-key-eye');
  
  if (clearBtn) clearBtn.addEventListener('click', clearGroqKey);
  if (keyInput) {
    keyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveGroqKey(); });
    keyInput.addEventListener('blur', () => {
      if (keyInput.value.trim() !== (keyInput.dataset.originalValue || '')) saveGroqKey();
    });
    keyInput.dataset.originalValue = keyInput.value;
  }
  if (eyeBtn) {
    eyeBtn.addEventListener('click', () => {
      if (keyInput.type === 'password') {
        keyInput.type = 'text';
      } else {
        keyInput.type = 'password';
      }
    });
  }
}

function updateKeyDisplay(key) {
  const preview = document.getElementById('groq-key-preview');
  const clearBtn = document.getElementById('groq-key-clear');
  const keyInput = document.getElementById('groq-key-input');
  
  updateHomeStatus(!!key);
  
  if (key) {
    if(preview) {
      preview.textContent = 'Connected';
      preview.className = 's-status-badge connected';
    }
    if(clearBtn) clearBtn.style.display = 'flex';
    if(keyInput) { keyInput.value = key; keyInput.dataset.originalValue = key; }
  } else {
    if(preview) {
      preview.textContent = 'Not configured';
      preview.className = 's-status-badge missing';
    }
    if(clearBtn) clearBtn.style.display = 'none';
    if(keyInput) { keyInput.value = ''; keyInput.dataset.originalValue = ''; }
  }
}

function saveGroqKey() {
  const keyInput  = document.getElementById('groq-key-input');
  const statusEl  = document.getElementById('groq-key-status');
  
  if (!keyInput) return;
  const key = keyInput.value.trim();

  if (!key) return; // Allow clear to handle empty state

  if (!key.startsWith('gsk_')) {
    if(statusEl) {
      statusEl.textContent = 'Groq keys start with gsk_...';
      statusEl.style.color = 'var(--lca-error)';
      statusEl.style.display = 'block';
      setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
    }
    return;
  }

  chrome.storage.sync.set({ groqApiKey: key }, () => {
    if (chrome.runtime.lastError) {
      if(statusEl) {
        statusEl.textContent = 'Failed to save.';
        statusEl.style.color = 'var(--lca-error)';
        statusEl.style.display = 'block';
        setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
      }
      return;
    }
    updateKeyDisplay(key);
    if(statusEl) {
      statusEl.textContent = 'Key saved securely.';
      statusEl.style.color = 'var(--lca-success)';
      statusEl.style.display = 'block';
      setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
    }
  });
}

function clearGroqKey() {
  chrome.storage.sync.remove('groqApiKey', () => {
    updateKeyDisplay(null);
    const statusEl = document.getElementById('groq-key-status');
    if(statusEl) {
      statusEl.textContent = 'Key removed.';
      statusEl.style.color = 'var(--lca-ink)';
      statusEl.style.display = 'block';
      setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
    }
  });
}

// ── Page: Stats ──────────────────────────────────────────────
function animateCounter(elementId, targetValue, duration = 800) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  let startValue = 0;
  let startTime = null;
  
  function updateCounter(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // easeOutExpo
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    
    const currentValue = Math.floor(easeProgress * targetValue);
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = targetValue;
    }
  }
  
  requestAnimationFrame(updateCounter);
}

function loadStats() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  const todayStr = new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);

  chrome.storage.local.get(['analysisCount', 'analysisDates'], (result) => {
    const total = result.analysisCount || 0;
    const dates = result.analysisDates || {};
    const todayCount = dates[todayStr] || 0;

    // Home
    animateCounter('stat-today-home', todayCount);
    
    // Stats Page
    animateCounter('stat-val-today', todayCount);
    animateCounter('stat-val-total', total);
    
    // Calculate streak (consecutive days ending yesterday or today)
    let streak = 0;
    let checkDate = new Date();
    
    // If no activity today, check yesterday
    if (!dates[todayStr]) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while(true) {
      // FIX: Use tzOffset to ensure dStr matches the local timezone logic used to save it
      const dStr = new Date(checkDate.getTime() - tzOffset).toISOString().slice(0, 10);
      if (dates[dStr] && dates[dStr] > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    const streakValEl = document.getElementById('streak-val');
    if (streakValEl) streakValEl.textContent = streak;
    
    // Animate ring (264 is max dasharray for r=42)
    // Formula: dashoffset = 264 - (264 * percentage)
    // Let's say max expected streak is 7 for full ring for visualization
    const maxStreak = Math.max(streak, 7); 
    const percentage = maxStreak === 0 ? 0 : streak / maxStreak;
    const offset = 264 - (264 * percentage);
    
    setTimeout(() => {
      const circle = document.getElementById('streak-circle');
      if (circle) circle.style.strokeDashoffset = offset;
    }, 100); // small delay to allow CSS transition to kick in
  });
}

// ── Updates ──────────────────────────────────────────────────
function loadUpdates() {
  chrome.storage.local.get(['updateAvailable'], (result) => {
    const container = document.getElementById('update-notification-container');
    if (result.updateAvailable && container) {
      const { version, url } = result.updateAvailable;
      const currentVersion = chrome.runtime.getManifest().version;
      container.innerHTML = `
        <div style="margin: 16px 16px 0 16px; padding: 12px; border-radius: 8px; background: rgba(0, 229, 255, 0.05); border: 1px solid var(--lca-primary); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="background: var(--lca-primary); color: #000; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">UPDATE</div>
              <div style="font-size: 12px; font-weight: 600; color: var(--lca-ink);">v${version} is out!</div>
            </div>
            <div style="font-size: 10px; color: var(--lca-muted);">Current: v${currentVersion}</div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button id="btn-get-update" style="flex: 1; background: var(--lca-primary); color: #000; border: none; padding: 6px 0; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">Get Update</button>
            <button id="btn-dismiss-update" style="flex: 1; background: transparent; color: var(--lca-muted); border: 1px solid var(--lca-border); padding: 6px 0; border-radius: 4px; font-size: 12px; cursor: pointer;">Dismiss</button>
          </div>
        </div>
      `;
      
      document.getElementById('btn-get-update').addEventListener('click', () => {
        chrome.tabs.create({ url });
      });
      document.getElementById('btn-dismiss-update').addEventListener('click', () => {
        chrome.storage.local.remove('updateAvailable', () => {
          container.innerHTML = '';
        });
      });
    }
  });

  const btnManual = document.getElementById('btn-manual-update-check');
  const txtStatus = document.getElementById('txt-update-check-status');
  if (btnManual) {
    btnManual.addEventListener('click', () => {
      txtStatus.textContent = "Checking...";
      chrome.runtime.sendMessage({ type: 'CHECK_FOR_UPDATES_MANUAL' }, (response) => {
        if (!response || !response.success) {
          txtStatus.textContent = "Check failed";
        } else if (response.update) {
          txtStatus.textContent = "Update found!";
          loadUpdates(); // Reload UI
        } else {
          txtStatus.textContent = "Up to date";
        }
        setTimeout(() => { if(txtStatus.textContent !== 'Checking...') txtStatus.textContent = ''; }, 3000);
      });
    });
  }
}
