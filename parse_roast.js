const fs = require('fs');
const lines = fs.readFileSync('/home/asp/.gemini/antigravity-ide/brain/0b3a604b-f257-4e38-a73a-b96bf2a26786/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');
for (const line of lines) {
  if (line) {
    const obj = JSON.parse(line);
    if (obj.content && obj.content.includes("Orthex Codebase Bug Roast")) {
      console.log(obj.content);
      break;
    }
  }
}
