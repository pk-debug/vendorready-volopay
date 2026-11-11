// Verify that application source contains no model SDK usage or model API calls.
import { readFileSync } from 'node:fs';
const paths = ['src/App.tsx', 'src/main.tsx', 'worker/index.ts', 'worker/domain.mjs'];
const forbidden = [
  /(?:api\.openai\.com|api\.anthropic\.com)/i,
  /(?:process\.env\.|env\.)(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_API_KEY)/,
  /(?:from\s+['"](?:openai|@anthropic-ai\/sdk|@google\/generative-ai)['"])/
];
let failed = false;
for (const path of paths) {
  const source = readFileSync(path, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(source)) { console.error(`Forbidden model usage found in ${path}`); failed = true; }
  }
}
if (failed) process.exit(1);
console.log('PASS: no model API calls or AI provider keys in app source.');
