const fs = require('fs');
let code = fs.readFileSync('scripts/content.js', 'utf8');

const target = `    chrome.runtime.sendMessage({
      type: 'GENERATE_SINGLE_SOLUTION',
      payload: { problemTitle, difficulty, language, description, defaultCode, solutionType: type }
    }, (res) => {`;

const replacement = `    try {
      chrome.runtime.sendMessage({
        type: 'GENERATE_SINGLE_SOLUTION',
        payload: { problemTitle, difficulty, language, description, defaultCode, solutionType: type }
      }, (res) => {
        if (chrome.runtime.lastError) {
            console.warn('[LCA] Runtime error:', chrome.runtime.lastError);
            res = { success: false, error: 'Extension context invalidated. Please refresh the page.' };
        }`;

code = code.replace(target, replacement);

const target2 = `        document.getElementById('lca-gen-retry-btn')?.addEventListener('click', () => {
          renderTabBody(type);
        });
        return;
      }
    });`;

const replacement2 = `        document.getElementById('lca-gen-retry-btn')?.addEventListener('click', () => {
          renderTabBody(type);
        });
        return;
      }
    });
    } catch (err) {
      if (loader) loader.stop();
      tabs.forEach(t => { t.disabled = false; t.style.opacity = ''; });
      alert('Extension context invalidated. Please refresh the page.');
    }`;

code = code.replace(target2, replacement2);

fs.writeFileSync('scripts/content.js', code);
