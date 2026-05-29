// Orthex — Page World Injector
// This script runs in the PAGE's JavaScript context (not the isolated content-script world).
// It can directly access window.monaco, which content scripts cannot.
// Communication is via window.postMessage.

(function () {
  if (window.__orthexInjected) return;
  window.__orthexInjected = true;

  window.addEventListener('message', function (event) {
    // Only accept messages from the same origin
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'orthex-content') return;

    if (event.data.type === 'LCA_PASTE_CODE') {
      const code = event.data.code;
      let success = false;
      let error = null;

      try {
        // Strategy 1: Monaco editor API (most reliable for LeetCode)
        if (window.monaco && window.monaco.editor) {
          const models = window.monaco.editor.getModels();
          if (models && models.length > 0) {
            // Find the model that looks like a code editor (not a config file)
            // LeetCode usually has one model that is the solution
            const codeModel = models.find(m => {
              const lang = m.getLanguageId ? m.getLanguageId() : '';
              // Pick any language model that isn't JSON/YAML config
              return lang && !['json', 'yaml', 'markdown'].includes(lang);
            }) || models[0];

            codeModel.setValue(code);
            success = true;
          }
        }

        // Strategy 2: CodeMirror (older LeetCode editor)
        if (!success) {
          const cm = document.querySelector('.CodeMirror');
          if (cm && cm.CodeMirror) {
            cm.CodeMirror.setValue(code);
            success = true;
          }
        }
      } catch (err) {
        error = err.message;
      }

      // Report back to content script
      window.postMessage({
        source: 'orthex-page',
        type: 'LCA_PASTE_RESULT',
        success,
        error
      }, '*');
    }
  });
})();
