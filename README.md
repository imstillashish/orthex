# ⚡ Orthex: Algorithmic Complexity HUD

> A 100% free Chrome extension that injects AI-powered algorithmic profiling and complexity analysis directly into LeetCode's submission result page.

Powered by **GLM-4.5 via OpenRouter** (Free tier routing).

---

## Features

- **Approach Analysis** — Current vs suggested algorithmic techniques, key idea, and a follow-up question
- **Efficiency Analysis** — Time & space complexity (current vs optimal) with improvement suggestions
- **Code Style Review** — Readability and structure ratings with actionable feedback
- **Learning Path** — Next problems to try and concepts to review
- **Supports all verdicts** — Accepted ✓, Wrong Answer, TLE, MLE, Runtime Error
- **Beautiful UI** — Replicate design system (warm cream canvas, ocean blue accents, dark code wells)
- **Shimmer loading skeleton** — Smooth feedback while Gemini processes

---

## Installation

### 1. Get a Free OpenRouter API Key
1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Sign in with your account
3. Click **Create Key**
4. Copy the key (starts with `sk-or-...`)

### 2. Load the Extension in Chrome
1. Open Chrome → navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `JAVA_Delete_15052026` folder
5. The Orthex extension icon will appear in your toolbar

### 3. Configure
1. Click the Orthex extension icon
2. Paste your OpenRouter API key
3. Click **Save**
4. The status dot turns green ✓

---

## Usage

1. Go to any [LeetCode problem](https://leetcode.com/problems/)
2. Write and submit your solution
3. When the result appears:
   - **Auto mode (default):** The AI panel appears automatically
   - **Manual mode:** Click the **"Analyze with AI"** button
4. Read your personalized feedback across all 4 panels

---

## File Structure

```
├── manifest.json              # Chrome Extension Manifest V3
├── DESIGN.md                  # Replicate design system reference
├── background/
│   └── service-worker.js      # Gemini API handler
├── scripts/
│   ├── content.js             # DOM observer + panel injector
│   └── extractor.js           # LeetCode data extraction
├── styles/
│   ├── main.css               # Design tokens (colors, typography, spacing)
│   └── panel.css              # AI panel component styles
├── popup/
│   ├── popup.html             # Settings popup
│   ├── popup.js               # Popup logic
│   └── popup.css              # Popup styles
├── assets/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── lib/
    └── marked.min.js          # Markdown renderer
```

---

## Free Tier Limits

| Resource | Limit | Impact |
|---|---|---|
| Requests/day | 1,500 | ~50 LeetCode sessions/day |
| Tokens/minute | 1,000,000 | No practical limit |
| Cost | **$0** | Permanently free |

Each analysis uses ~800 tokens total (prompt + response).

---

## Privacy

- Your code is sent **directly** from your browser to OpenRouter's API
- No intermediate server, no data storage, no account required on our end
- API key is stored securely in Chrome's local sync storage (`chrome.storage.sync`)
