<div align="center">
  <img src="assets/orthex_presentation_banner.png" alt="Orthex Banner" width="100%">
  <br/><br/>

  <img src="https://img.shields.io/badge/AI%20Powered-Groq%20%2F%20LLaMA%203.3-1591dc?style=for-the-badge&logo=lightning&logoColor=white" alt="AI Powered"/>
  <img src="https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-2c5ead?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Extension"/>
  <img src="https://img.shields.io/badge/LeetCode-Integrated-5db8a6?style=for-the-badge&logo=leetcode&logoColor=white" alt="LeetCode"/>
  <img src="https://img.shields.io/badge/Cost-Free-e8a55a?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="Free"/>
  <br/><br/>

  <h1>
    <strong><span style="color:#1591dc"><img src="assets/anim-tetris.svg" width="32" height="32" align="middle" alt="Tetris"/> Orthex</span></strong>
  </h1>
  <p><em>LeetCode AI Code Review &amp; Big-O Checker</em></p>
  <p>
    A multi-pass AI debrief that runs directly inside LeetCode.<br/>
    Analyze your approach. Visualize complexity. Learn what to study next.
  </p>
  <p>
    <strong>No account &nbsp;·&nbsp; No server &nbsp;·&nbsp; No cost</strong>
  </p>
</div>

---

## What it does

Orthex runs **three sequential analysis passes** on your submission, then generates a personalized learning path.

<table>
  <thead>
    <tr>
      <th style="background:#1591dc;color:#fff;padding:8px 14px">Pass</th>
      <th style="background:#1591dc;color:#fff;padding:8px 14px">Feature</th>
      <th style="background:#1591dc;color:#fff;padding:8px 14px">What you get</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><kbd>01</kbd></td>
      <td>
        <img src="assets/anim-spark.svg" width="16" height="16" align="middle" style="margin-right:8px;" alt="AI"/>
        <strong>Approach Analysis</strong>
      </td>
      <td>Identifies your algorithmic technique (DFS, DP, Two Pointers…), compares it to the optimal, and leaves you with one sharp follow-up question.</td>
    </tr>
    <tr>
      <td align="center"><kbd>02</kbd></td>
      <td>
        <img src="assets/anim-chart.svg" width="16" height="16" align="middle" style="margin-right:8px;" alt="Chart"/>
        <strong>Complexity Visualization</strong>
      </td>
      <td>Estimates your current time &amp; space complexity and the theoretical optimum, plotting both on an animated SVG graph — O(1) → O(2ⁿ).</td>
    </tr>
    <tr>
      <td align="center"><kbd>03</kbd></td>
      <td>
        <img src="assets/anim-check.svg" width="16" height="16" align="middle" style="margin-right:8px;" alt="Code"/>
        <strong>Code Style Review</strong>
      </td>
      <td>Rates readability and structure: <code>Excellent</code> / <code>Good</code> / <code>Fair</code> / <code>Poor</code> — with concise, actionable critique.</td>
    </tr>
    <tr>
      <td align="center"><kbd>04</kbd></td>
      <td>
        <img src="assets/anim-path.svg" width="16" height="16" align="middle" style="margin-right:8px;" alt="Path"/>
        <strong>Learning Path</strong>
      </td>
      <td>Recommends 2–3 specific LeetCode problems and the concepts behind them based on what the analysis found.</td>
    </tr>
    <tr>
      <td align="center"><kbd>✦</kbd></td>
      <td>
        <img src="assets/anim-gear.svg" width="16" height="16" align="middle" style="margin-right:8px;" alt="Solutions"/>
        <strong>Solutions</strong>
      </td>
      <td>Generates <em>Intern · L5 Engineer · Staff Architect</em> approaches, streamed with step-by-step Mermaid flowchart explanations.</td>
    </tr>
  </tbody>
</table>

> **Supported verdicts:** 
> <img src="https://www.google.com/s2/favicons?domain=leetcode.com&sz=16" width="16" height="16" align="middle" alt="LeetCode"/> Accepted &nbsp;·&nbsp; Wrong Answer &nbsp;·&nbsp; TLE &nbsp;·&nbsp; MLE &nbsp;·&nbsp; Runtime Error &nbsp;·&nbsp; Compile Error

<br/>
<div align="center">
  <img src="assets/screenshot_analysis_light.png" alt="Orthex Analysis Panel in Light Mode" width="48%">
  <img src="assets/screenshot_analysis_dark.png" alt="Orthex Analysis Panel in Dark Mode" width="48%">
  <p><em>The main analysis panel matching your LeetCode theme.</em></p>
</div>

---

## How it works

```
Submit on LeetCode
        ↓
  content.js extracts problem title, difficulty,
  language, verdict, runtime, memory, and code
        ↓
  service-worker.js sends a structured prompt
  to Groq  →  llama-3.3-70b-versatile
        ↓
  JSON response parsed into 4 analysis panels
        ↓
  Result cached in chrome.storage.local
  (repeat views cost zero API tokens)
```

---

## Requirements

- <img src="https://www.google.com/s2/favicons?domain=google.com&sz=16" width="16" height="16" align="middle" alt="Chrome"/> **Browser**: Google Chrome or any Chromium-based browser
- <img src="https://www.google.com/s2/favicons?domain=groq.com&sz=16" width="16" height="16" align="middle" alt="Groq"/> **API Key**: A free [Groq API key](https://console.groq.com/keys) — the free tier is more than enough for daily practice

---

## Installation

> Orthex is not yet published to the Chrome Web Store. Load it as an unpacked extension:

1. Download or clone this repository.
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (toggle, top-right).
4. Click **Load unpacked** → select the project folder.
5. The Orthex icon appears in your toolbar.

**Configure your API key:**

1. Click the Orthex icon.
2. Paste your Groq API key → click **Save**.
3. The status indicator turns `🟢 green` when stored. The key lives in `chrome.storage.sync` and never leaves your browser.

<br/>
<div align="center">
  <img src="assets/screenshot_popup.png" alt="Orthex Settings Popup" width="300">
  <p><em>Securely store your API key in Chrome's synced storage.</em></p>
</div>

---

## Usage

Navigate to any [LeetCode problem](https://leetcode.com/problems/), write a solution, and submit.

| Mode | How to trigger | Behavior |
|---|---|---|
| <img src="https://www.google.com/s2/favicons?domain=developer.chrome.com&sz=16" width="16" height="16" align="middle" alt="Extension"/> **Auto** *(default)* | Submit a solution | Panel appears automatically for Accepted, WA, and TLE. Configurable in settings. |
| <img src="https://www.google.com/s2/favicons?domain=developer.chrome.com&sz=16" width="16" height="16" align="middle" alt="Extension"/> **Manual** | Click **Analysis** button | Trigger on demand. Click again to dismiss. |
| <img src="https://www.google.com/s2/favicons?domain=leetcode.com&sz=16" width="16" height="16" align="middle" alt="LeetCode"/> **Solutions** | Click **Solutions** button | Streams 2–3 approaches with Mermaid flowcharts. |

<br/>
<div align="center">
  <img src="assets/screenshot_solutions.png" alt="Orthex Reference Solutions Panel" width="80%">
  <p><em>Explore multiple reference solutions ranging from Intern to Staff Architect approaches.</em></p>
</div>

---

## Privacy

Your code goes **directly from your browser → Groq's API**. Orthex has:

- ✦ No backend server
- ✦ No database
- ✦ No telemetry

Your API key is stored locally in Chrome's sync storage. **We never see your code.**

> The BYOK (Bring Your Own Key) model is not a workaround — it is the architecture. We will not offer a tier that routes your code through our servers.

---

## File Structure

```text
├── manifest.json              — Chrome Extension Manifest V3
├── DESIGN.md                  — Design system reference
├── BRAND.md                   — Brand guidelines and voice
├── background/
│   └── service-worker.js      — Groq API calls, caching, response parsing
├── scripts/
│   ├── content.js             — DOM injection, analysis panels, theme sync
│   └── extractor.js           — Extracts submission data from LeetCode's DOM
├── styles/
│   ├── main.css               — Design tokens: colors, typography, spacing
│   └── panel.css              — Analysis panel component styles
├── popup/
│   ├── popup.html             — Settings popup
│   ├── popup.js               — API key storage, settings logic
│   └── popup.css              — Popup styles
├── assets/
│   └── icon.svg               — Premium Tetris brand icon
└── lib/
    ├── marked.min.js          — Markdown renderer
    └── mermaid.min.js         — Flowchart renderer
```

---

## Model & API

| Property | Value |
|---|---|
| <img src="https://www.google.com/s2/favicons?domain=meta.com&sz=16" width="16" height="16" align="middle" alt="Meta"/> **Model** | `llama-3.3-70b-versatile` via Groq |
| **Tokens / analysis** | ~800 (prompt + response) |
| **Tokens / solution** | Up to 4,000 per approach |
| <img src="https://www.google.com/s2/favicons?domain=groq.com&sz=16" width="16" height="16" align="middle" alt="Groq"/> **Rate limit handling** | Exponential backoff in service worker |

---

## Permissions

| Permission | Reason |
|---|---|
| <img src="https://www.google.com/s2/favicons?domain=developer.chrome.com&sz=16" width="16" height="16" align="middle" alt="Chrome"/> `storage` | Store your API key and analysis cache |
| <img src="https://www.google.com/s2/favicons?domain=developer.chrome.com&sz=16" width="16" height="16" align="middle" alt="Chrome"/> `unlimitedStorage` | Cache results across many submissions |
| <img src="https://www.google.com/s2/favicons?domain=developer.chrome.com&sz=16" width="16" height="16" align="middle" alt="Chrome"/> `activeTab` | Read the current LeetCode submission page |
| <img src="https://www.google.com/s2/favicons?domain=developer.chrome.com&sz=16" width="16" height="16" align="middle" alt="Chrome"/> `scripting` | Inject the analysis panel into the page |
| <img src="https://www.google.com/s2/favicons?domain=leetcode.com&sz=16" width="16" height="16" align="middle" alt="LeetCode"/> `https://leetcode.com/*` | Run on LeetCode problem and submission pages |
| <img src="https://www.google.com/s2/favicons?domain=groq.com&sz=16" width="16" height="16" align="middle" alt="Groq"/> `https://api.groq.com/*` | Send requests to Groq's API |

---

## Limitations

- **DOM dependency** — Orthex reads submitted code from the DOM. LeetCode UI updates may break the code extraction selector. If only stats appear without code, the selector likely changed.
- **AI estimates** — Complexity grades and approach suggestions reflect the model's pattern recognition. Treat them as a starting point, not absolute ground truth.
- **Mermaid edge cases** — Syntax errors in complex auto-generated diagrams are caught and suppressed. The step-by-step explanation text still renders.
