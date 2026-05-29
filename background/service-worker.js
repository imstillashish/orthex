// ============================================================
// Orthex — Service Worker (Background)
// 3 sequential focused API calls: Approach → Efficiency → Code Style
// Each call is small (~200-300 tokens) to avoid timeouts
// API key is stored in chrome.storage.sync (BYOK model)
// Supports two providers: OpenRouter (default) and Groq (fast)
// ============================================================

const GROQ_MODEL         = 'llama-3.3-70b-versatile';
const GROQ_BASE          = 'https://api.groq.com/openai/v1';

// Helper: get the stored Groq API key
async function getGroqKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['groqApiKey'], (result) => {
      resolve(result.groqApiKey || '');
    });
  });
}

// ── Sequential API Queue ──────────────────────────────────
let apiQueue = Promise.resolve();


// ── Batch Cache (to stay under 15 RPM) ───────────────────
let batchCache = new Map(); // key -> { data, timestamp }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[LCA] Message received:', message.type);

  if (message.type === 'ANALYZE_FULL') {
    (async () => {
      try {
        console.log('[LCA] Running full analysis...');
        const fullResult = await handleFullAnalysis(message.payload);

        sendResponse({ success: true, data: fullResult });
      } catch (err) {
        console.error(`[LCA] ANALYZE_FULL failed:`, err);
        sendResponse({ success: false, error: err.message || 'Unknown error' });
      }
    })();
    return true;
  }

  if (message.type === 'GENERATE_SOLUTIONS') {
    (async () => {
      try {
        console.log('[LCA] Running solutions generation...');
        const result = await handleGenerateSolutions(message.payload, sender.tab?.id);
        sendResponse({ success: true, data: result });
      } catch (err) {
        console.error(`[LCA] GENERATE_SOLUTIONS failed:`, err);
        sendResponse({ success: false, error: err.message || 'Unknown error' });
      }
    })();
    return true;
  }

  if (message.type === 'GENERATE_SINGLE_SOLUTION') {
    (async () => {
      try {
        console.log('[LCA] Running single solution generation for:', message.payload.solutionType);
        const result = await handleGenerateSingleSolution(message.payload, sender.tab?.id);
        sendResponse({ success: true, data: result });
      } catch (err) {
        console.error(`[LCA] GENERATE_SINGLE_SOLUTION failed:`, err);
        sendResponse({ success: false, error: err.message || 'Unknown error' });
      }
    })();
    return true;
  }

  if (message.type === 'CHECK_API_KEY') {
    getGroqKey().then(key => {
      sendResponse({ hasKey: !!key });
    });
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(['groqApiKey', 'autoAnalyze', 'analyzeOnWrongAnswer', 'analyzeOnTLE', 'uiStyle'], (result) => {
      sendResponse({
        hasKey: !!result.groqApiKey,
        autoAnalyze: result.autoAnalyze !== false,
        analyzeOnWrongAnswer: result.analyzeOnWrongAnswer !== false,
        analyzeOnTLE: result.analyzeOnTLE !== false,
        uiStyle: result.uiStyle || 'classic'
      });
    });
    return true;
  }
});

// ── Shared context builder ────────────────────────────────
function buildContext(data) {
  const {
    problemTitle, language, verdict, runtime, runtimeBeat,
    memory, memoryBeat, code, difficulty,
  } = data;

  const verdictDesc = {
    'Accepted': 'passed all test cases',
    'Wrong Answer': 'produced incorrect output',
    'Time Limit Exceeded': 'exceeded the time limit',
    'Memory Limit Exceeded': 'used too much memory',
    'Runtime Error': 'threw a runtime exception',
    'Compile Error': 'failed to compile',
  }[verdict] || verdict;

  const hasCode = code && code.trim().length > 10;
  const codeBlock = hasCode
    ? `\n\nCODE (${language}):\n\`\`\`\n${code.slice(0, 2000)}\n\`\`\``
    : '\n\n(Code unavailable — analyze from stats only)';

  return `PROBLEM: "${problemTitle}" (${difficulty || 'Unknown'})
VERDICT: ${verdict} — ${verdictDesc}
LANGUAGE: ${language}
RUNTIME: ${runtime || 'N/A'}${runtimeBeat ? ` (Beats ${runtimeBeat})` : ''}
MEMORY: ${memory || 'N/A'}${memoryBeat ? ` (Beats ${memoryBeat})` : ''}${codeBlock}`;
}


function getSubmissionKey(data) {
  return `${data.problemTitle}_${data.language}_${data.code.slice(0, 100)}_${data.verdict}`;
}

async function handleFullAnalysis(data) {
  const cacheKey = `analysis_${cyrb53(data.problemTitle + data.language + data.code)}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log('[LCA] Cache hit for FULL_ANALYSIS');
    return cached;
  }

  const ctx = buildContext(data);
  const prompt = `You are a world-class competitive programming coach. 
Analyze this LeetCode submission and provide a comprehensive review.

${ctx}

Return ONLY a single valid JSON object with this structure:
{
  "verdict": "One encouraging sentence about the result.",
  "approach": {
    "current": ["Tag"],
    "suggested": ["Tag"],
    "keyIdea": "One sentence about the core algorithmic insight.",
    "consider": "One follow-up question."
  },
  "efficiency": {
    "currentTime": "O(?)",
    "suggestedTime": "O(?)",
    "currentSpace": "O(?)",
    "suggestedSpace": "O(?)",
    "suggestions": "One or two sentences on efficiency."
  },
  "codeStyle": {
    "readability": "Excellent/Good/Fair/Poor",
    "structure": "Excellent/Good/Fair/Poor",
    "suggestions": "One or two sentences on code quality."
  },
  "learningPath": {
    "nextProblems": ["Problem Name 1", "Problem Name 2"],
    "conceptsToReview": ["Concept 1"]
  }
}

Rules:
- Complexity: Use O(N) notation.
- Tags: 1-3 tags (DFS, BFS, DP, Greedy, etc.)
- Style: readability/structure MUST be one of: Excellent, Good, Fair, Poor.
- Be extremely concise.`;

  const raw = await callGroqWithRetry(prompt, 1200);
  const parsed = parseSection(raw, ['approach', 'efficiency', 'codeStyle']);
  
  await setCache(cacheKey, parsed);
  return parsed;
}



// ── callGroq with Retry & Exponential Backoff ───────────
async function callGroqWithRetry(prompt, maxTokens = 800, retries = 5, model = GROQ_MODEL) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      // Exponential backoff: 0s, 2s, 4s, 8s, 16s + jitter
      const wait = i === 0 ? 0 : (Math.pow(2, i) * 1000) + (Math.random() * 1000);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));

      const res = await callGroq(prompt, maxTokens, model);

      // Extract content from OpenRouter structure
      const content = res?.choices?.[0]?.message?.content;
      if (!content || content.trim().length < 2) {
        throw new Error('EMPTY_RESPONSE');
      }

      return res;
    } catch (err) {
      lastErr = err;
      console.warn(`[LCA] Retry ${i + 1}/${retries} after error:`, err.message);
      if (err.message === 'INVALID_API_KEY') throw err;
    }
  }
  throw lastErr;
}

// ── Base Groq API Call ────────────────────────────
async function callGroq(prompt, maxTokens = 800, model = GROQ_MODEL) {
  const apiKey = await getGroqKey();
  if (!apiKey) throw new Error('INVALID_API_KEY');

  const controller = new AbortController();
  const timeoutMs = 40000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${GROQ_BASE}/chat/completions`;

  const body = {
    model: model,
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: maxTokens
  };

  console.log(`[LCA] Calling Groq (${model}) (max_tokens: ${maxTokens})...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://leetcode.com',
        'X-Title': 'Orthex'
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP ${response.status}`;

      if (response.status === 401 || (response.status === 400 && errMsg.includes('API key'))) throw new Error('INVALID_API_KEY');
      if (response.status === 429) throw new Error('RATE_LIMIT');

      throw new Error(`Groq API error: ${errMsg}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}

// ── Unified Streaming API Call (Groq) ──────────
async function callGroqStreaming(prompt, maxTokens, model, tabId, solutionType) {
  const apiKey = await getGroqKey();
  if (!apiKey) throw new Error('INVALID_API_KEY');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 3-min timeout
  const url = `${GROQ_BASE}/chat/completions`;

  const body = {
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: maxTokens,
    stream: true
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Groq Streaming error: HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const chunk = data.choices?.[0]?.delta?.content || '';
            if (chunk) {
              fullText += chunk;
              if (tabId) {
                chrome.tabs.sendMessage(tabId, { type: 'ANALYZE_STREAM_CHUNK', solutionType, chunk });
              }
            }
          } catch (e) {
            // Ignore parse errors on chunks
          }
        }
      }
    }
    
    // Process any remaining buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
        try {
          const data = JSON.parse(trimmed.slice(6));
          const chunk = data.choices?.[0]?.delta?.content || '';
          if (chunk) {
            fullText += chunk;
            if (tabId) {
              chrome.tabs.sendMessage(tabId, { type: 'ANALYZE_STREAM_CHUNK', solutionType, chunk });
            }
          }
        } catch (e) {}
      }
    }
    
    // Notify stream complete
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { type: 'ANALYZE_STREAM_DONE', solutionType });
    }
    
    return fullText;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}

// ── Response Parser (Updated with Deep Repair) ───
function parseSection(data, requiredKeys) {
  let text = '';
  try {
    text = data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Empty response from Groq');
    }

    console.log('[LCA] Raw text (first 120):', text.slice(0, 120));

    // Strip potential markdown fences
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      const m = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (m) cleaned = m[1];
    }

    // Extract JSON block
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last !== -1) cleaned = cleaned.substring(first, last + 1);

    // Deep JSON repair and parse
    let parsed;
    try {
      // 1. Remove comments
      let commentCleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
      // 2. Remove trailing commas
      commentCleaned = commentCleaned.replace(/,\s*([\]}])/g, '$1');
      // 3. Escape bare control characters (literal newlines/tabs) inside JSON strings
      //    This is the most common cause of "Bad control character" errors when AI
      //    embeds real newlines in code fields instead of escaped \n sequences.
      commentCleaned = sanitizeControlChars(commentCleaned);
      parsed = JSON.parse(commentCleaned.trim());
    } catch (parseErr) {
      console.warn('[LCA] Standard JSON parse failed, attempting deep repair...', parseErr.message);
      try {
        const repaired = deepRepair(sanitizeControlChars(cleaned));
        parsed = JSON.parse(repaired);
      } catch (deepErr) {
        console.error('[LCA] Deep repair failed:', deepErr.message);
        throw parseErr; // throw original parse error
      }
    }

    const hasAny = requiredKeys.some(k => parsed[k] !== undefined);
    if (!hasAny) throw new Error(`Missing fields: ${requiredKeys.join(', ')}`);

    return parsed;
  } catch (e) {
    console.error('[LCA] Parse error detail:', e.message);
    console.error('[LCA] Faulty text:', text);

    // If it's a truncation error, provide a cleaner message
    if (e.message.includes('Unterminated') || e.message.includes('Unexpected end')) {
      throw new Error('Analysis truncated by AI — please Retry the section.');
    }
    throw new Error(`Parse failed: ${e.message}`);
  }
}

// ── Sanitize control characters inside JSON string values ──────────────────
// Walks the raw JSON char-by-char and escapes any bare control characters
// (actual newlines, tabs, carriage returns, etc.) found INSIDE string literals.
// This is the #1 cause of "Bad control character in string literal" errors when
// an LLM embeds real whitespace in a "code" field instead of \\n / \\t sequences.
function sanitizeControlChars(str) {
  let result = '';
  let inString = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    // Track escape sequences — the char after a backslash is never structural
    if (inString && ch === '\\') {
      result += ch;
      if (i + 1 < str.length) {
        result += str[i + 1];
        i++;
      }
      continue;
    }

    // Toggle string mode on unescaped double-quote
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    // Inside a string: escape bare control characters
    if (inString) {
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        // Map common ones to their JSON escape equivalents
        if (ch === '\n')  { result += '\\n';  continue; }
        if (ch === '\r')  { result += '\\r';  continue; }
        if (ch === '\t')  { result += '\\t';  continue; }
        if (ch === '\b')  { result += '\\b';  continue; }
        if (ch === '\f')  { result += '\\f';  continue; }
        // All other control characters: use unicode escape
        result += '\\u' + code.toString(16).padStart(4, '0');
        continue;
      }
    }

    result += ch;
  }
  return result;
}

// ── Deep JSON Heuristic Repair (Inner Quote Easing & Truncation Fixing) ──
function deepRepair(str) {
  let result = '';
  let inString = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    // If it's a backslash, keep it and the next char verbatim
    if (char === '\\') {
      result += '\\';
      if (i + 1 < str.length) {
        result += str[i + 1];
        i++;
      }
      continue;
    }

    if (char === '"') {
      // Look ahead to check if this quote is structural
      let isStructural = false;
      let nextNonWs = '';
      for (let j = i + 1; j < str.length; j++) {
        if (!/\s/.test(str[j])) {
          nextNonWs = str[j];
          break;
        }
      }

      // In JSON, structural quotes are followed by:
      // - ':' (end of a key)
      // - ',' (end of a value in list)
      // - '}' or ']' (end of object or array)
      // Or, if we are NOT currently in a string, the opening quote is always structural!
      if (!inString || [':', ',', '}', ']'].includes(nextNonWs)) {
        isStructural = true;
      }

      if (isStructural) {
        inString = !inString;
        result += '"';
      } else {
        // Inner unescaped quote! Escape it.
        result += '\\"';
      }
    } else {
      result += char;
    }
  }

  // Also auto-close any truncated brackets
  return autoCloseJSON(result);
}

function autoCloseJSON(str) {
  let inString = false;
  let escaped = false;
  const stack = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char === '{' ? '}' : ']');
      } else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  let closed = str;
  if (inString) {
    closed += '"';
  }
  while (stack.length > 0) {
    closed += stack.pop();
  }
  return closed;
}

async function handleGenerateSolutions(data, tabId) {
  const { problemTitle, difficulty, language, description, defaultCode } = data;

  // ── PASS 1: Generate all solutions (code + complexity only) ──────────────────
  // Keeping stepByStep OUT of the first pass avoids JSON truncation on large outputs.
  const pass1Prompt = `You are a world-class competitive programming coach.
Given the following LeetCode problem, generate ALL distinct solution approaches:
- The Intern Approach
- L5 Engineer Approach (if a meaningfully different middle approach exists)
- Staff Architect Approach

Problem Title: "${problemTitle}"
Difficulty: "${difficulty}"
Language: "${language}"

PROBLEM DESCRIPTION:
${description || 'Description not extracted.'}

DEFAULT CODE BOILERPLATE:
${defaultCode || 'Not provided. Use standard boilerplate.'}

IMPORTANT: Always generate at least 2 solutions (The Intern Approach + Staff Architect Approach). Generate 3 if a distinct L5 Engineer Approach exists.

Return ONLY a valid JSON object:
{
  "solutions": [
    {
      "type": "The Intern Approach",
      "name": "Short descriptive name",
      "timeComplexity": "O(?)",
      "spaceComplexity": "O(?)",
      "code": "Complete syntactically correct ${language} code here"
    },
    {
      "type": "Staff Architect Approach",
      "name": "Short descriptive name",
      "timeComplexity": "O(?)",
      "spaceComplexity": "O(?)",
      "code": "Complete syntactically correct ${language} code here"
    }
  ]
}

Rules:
1. Output ONLY the raw JSON object — no markdown fences, no commentary, no extra keys.
2. Each code value MUST be a complete, syntactically correct, properly indented ${language} solution.
3. ALWAYS use the exact class/function signature from DEFAULT CODE BOILERPLATE — do not rename it.
4. Each solution must be directly runnable on LeetCode — include all required imports at the top if needed.
5. Use double-quoted strings in JSON. Escape all inner double quotes as \\" and newlines as \\n.
6. Preserve proper indentation using spaces (2 or 4 based on language convention). Do NOT collapse code to a single line.
7. Each solution must use a clearly different algorithmic approach.`;

  console.log('[LCA] Solutions Pass 1: generating code...');
  const pass1Raw = await callGroqWithRetry(pass1Prompt, 1500, 5, GROQ_MODEL);
  const pass1Result = parseSection(pass1Raw, ['solutions']);
  const solutions = pass1Result.solutions || [];

  if (solutions.length === 0) throw new Error('No solutions returned in Pass 1.');

  if (tabId) {
    chrome.tabs.sendMessage(tabId, { type: 'ANALYZE_PASS1_DONE_ALL', solutions });
  }

  // ── PASS 2: Generate stepByStep markdown for each solution individually ───────
  for (let i = 0; i < solutions.length; i++) {
    const sol = solutions[i];
    const pass2Prompt = `You are a world-class competitive programming coach explaining code to a complete beginner.

For the following ${sol.type} solution to "${problemTitle}" (${difficulty}) in ${language}, write a beautiful step-by-step markdown explanation.

Solution Code:
\`\`\`${language}
${sol.code}
\`\`\`

Write ONLY the markdown text (NOT JSON). Follow this exact structure:

1. Start with 1-2 plain-English sentences: "Here is a step-by-step breakdown of how the ${sol.type} solution works. The core idea is..."
2. Then a horizontal divider: ---
3. Then a section: ## Step-by-Step Breakdown
4. Then numbered subsections (### 1. Name, ### 2. Name, etc.) for each logical part of the code. Under each subsection:
   - Explain the logic in 2-4 beginner-friendly bullet points (using * for bullets)
   - Use **bold** for key terms and \`inline code\` for variable/function names or code keywords
   - DO NOT write any block of code (\`\`\` code fences). You may only use inline code snippets.
5. Then another horizontal divider: ---
6. Then a section: ## Visual Example: Tracing the Code
7. Create a beautiful, colorful top-to-bottom Mermaid flowchart (\`\`\`mermaid\\ngraph TD\\n...\\n\`\`\`) to visualize the core algorithm.
8. Trace the code with 2 example inputs (Trace A: a valid/passing input, Trace B: an edge/failing input). Show step-by-step variable changes.

Additional rules:
- Use simple everyday language. No jargon without explanation.
- Enclose all math expressions in $dollar signs$ (e.g., $O(n)$, $n = 5$).
- Do NOT include any JSON. Output ONLY markdown text.`;

    console.log(`[LCA] Solutions Pass 2: stepByStep for ${sol.type}...`);
    try {
      const fullText = await callGroqStreaming(pass2Prompt, 4000, GROQ_MODEL, tabId, sol.type);
      solutions[i].stepByStep = fullText.trim();
    } catch (err) {
      console.warn(`[LCA] Pass 2 stepByStep failed for ${sol.type}:`, err.message);
      solutions[i].stepByStep = `**Step-by-step breakdown could not be generated.** (Error: ${err.message}) Please regenerate.`;
    }
  }

  const finalResult = { solutions };
  return finalResult;
}

// ── Single Solution Generator ─────────────────────────────
// Generates exactly one solution type (e.g. 'The Intern Approach', 'L5 Engineer Approach', 'Staff Architect Approach')
// and its step-by-step breakdown via two sequential API calls.
async function handleGenerateSingleSolution(data, tabId) {
  const { problemTitle, difficulty, language, description, defaultCode, solutionType } = data;

  // ── PASS 1: Generate the single solution (code + complexity) ──
  const pass1Prompt = `You are a world-class competitive programming coach.
Generate ONLY the ${solutionType} solution for the following LeetCode problem.

Problem Title: "${problemTitle}"
Difficulty: "${difficulty}"
Language: "${language}"

PROBLEM DESCRIPTION:
${description || 'Description not extracted.'}

DEFAULT CODE BOILERPLATE:
${defaultCode || 'Not provided. Use standard boilerplate.'}

Return ONLY a single valid JSON object (not an array):
{
  "type": "${solutionType}",
  "name": "Short descriptive name (e.g. 'Hash Map', 'Two Pointers')",
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "code": "Complete, syntactically correct ${language} code here. You MUST wrap your logic inside the exact class/function signature provided in the DEFAULT CODE BOILERPLATE."
}

Rules:
1. Output ONLY raw JSON — no markdown fences, no commentary, no extra keys.
2. The code MUST be complete, syntactically correct, and properly indented for ${language}.
3. You MUST use the exact class/function signature from DEFAULT CODE BOILERPLATE — do not rename it.
4. The code must be directly runnable on LeetCode — include all required imports at the top if needed.
5. Use double-quoted strings in JSON. Escape all inner double quotes as \\" and newlines as \\n.
6. Preserve proper indentation using spaces (2 or 4 depending on language convention). Do NOT collapse the code to a single line.`;

  console.log(`[LCA] Single Solution Pass 1: generating ${solutionType} code...`);
  const pass1Raw = await callGroqWithRetry(pass1Prompt, 1500, 5, GROQ_MODEL);
  const sol = parseSection(pass1Raw, ['type', 'code']);
  if (!sol || !sol.code) throw new Error(`Failed to generate ${solutionType} solution code.`);

  if (tabId) {
    chrome.tabs.sendMessage(tabId, { type: 'ANALYZE_PASS1_DONE', solutionType, code: sol.code, timeComplexity: sol.timeComplexity, spaceComplexity: sol.spaceComplexity });
  }

  // ── PASS 2: Generate step-by-step markdown for this solution ──
  const pass2Prompt = `You are a world-class competitive programming coach explaining code to a complete beginner.

For the following ${sol.type} solution to "${problemTitle}" (${difficulty}) in ${language}, write a beautiful step-by-step markdown explanation.

Solution Code:
\`\`\`${language}
${sol.code}
\`\`\`

Write ONLY the markdown text (NOT JSON). Follow this exact structure:

1. Start with 1-2 plain-English sentences: "Here is a step-by-step breakdown of how the ${sol.type} solution works. The core idea is..."
2. Then a horizontal divider: ---
3. Then a section: ## Step-by-Step Breakdown
4. Then numbered subsections (### 1. Name, ### 2. Name, etc.) for each logical part of the code. Under each subsection:
   - Explain the logic in 2-4 beginner-friendly bullet points (using * for bullets)
   - Use **bold** for key terms and \`inline code\` for variable/function names or code keywords
   - DO NOT write any block of code (\`\`\` code fences). You may only use inline code snippets.
5. Then another horizontal divider: ---
6. Then a section: ## Visual Example: Tracing the Code
7. Create a beautiful, colorful top-to-bottom Mermaid flowchart (\`\`\`mermaid\\ngraph TD\\n...\\n\`\`\`) to visualize the core algorithm.
8. Trace the code with 2 example inputs (Trace A: a valid/passing input, Trace B: an edge/failing input). Show step-by-step variable changes.

Additional rules:
- Use simple everyday language. No jargon without explanation.
- Enclose all math expressions in $dollar signs$ (e.g., $O(n)$, $n = 5$).
- Do NOT include any JSON. Output ONLY markdown text.`;

  console.log(`[LCA] Single Solution Pass 2: stepByStep for ${sol.type}...`);
  try {
    const fullText = await callGroqStreaming(pass2Prompt, 4000, GROQ_MODEL, tabId, sol.type);
    sol.stepByStep = fullText.trim();
  } catch (err) {
    console.warn(`[LCA] Single Solution Pass 2 stepByStep failed:`, err.message);
    sol.stepByStep = `**Step-by-step breakdown could not be generated.** (Error: ${err.message}) Please try again.`;
  }

  const finalResult = { solution: sol };
  return finalResult;
}
