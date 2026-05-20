// Скрипт авто-перевода ru.json -> uz.json, kaa.json через from-to.uz API.
// Запуск: node scripts/translate.mjs
// Требуется FROM_TO_API_TOKEN в .env.local или в окружении.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOCALES_DIR = join(ROOT, 'src/shared/i18n/locales');

const ENV_FILE = join(ROOT, '.env.local');
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const API_TOKEN = process.env.FROM_TO_API_TOKEN;
if (!API_TOKEN) {
  console.error('FROM_TO_API_TOKEN not set (.env.local or env)');
  process.exit(1);
}

const ENDPOINT = `https://api.from-to.uz/api/v1/external/translate?api_token=${API_TOKEN}`;

const TARGETS = [
  { file: 'uz.json', code: 'uzn_Latn' },
  { file: 'kaa.json', code: 'kaa_Latn' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const translate = async (text, langTo) => {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lang_from: 'rus_Cyrl',
      lang_to: langTo,
      text,
      resultCase: 'latin',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.result ?? text;
};

// Сохраняет интерполяции {{name}} — переводит вокруг них.
const PLACEHOLDER_RE = /\{\{[^}]+\}\}/g;
const protectPlaceholders = (text) => {
  const tokens = [];
  const masked = text.replace(PLACEHOLDER_RE, (m) => {
    tokens.push(m);
    return `__P${tokens.length - 1}__`;
  });
  return { masked, tokens };
};
const restorePlaceholders = (text, tokens) =>
  tokens.reduce((acc, tok, i) => acc.replace(new RegExp(`__P${i}__`, 'g'), tok), text);

const walk = async (node, langTo, path = '') => {
  if (typeof node === 'string') {
    if (!node.trim()) return node;
    const { masked, tokens } = protectPlaceholders(node);
    const out = await translate(masked, langTo);
    const restored = restorePlaceholders(out, tokens);
    console.log(`  ${path}: ${node.slice(0, 40)} -> ${restored.slice(0, 40)}`);
    await sleep(120); // не душить API
    return restored;
  }
  if (Array.isArray(node)) {
    const out = [];
    for (let i = 0; i < node.length; i++) {
      out.push(await walk(node[i], langTo, `${path}[${i}]`));
    }
    return out;
  }
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = await walk(v, langTo, path ? `${path}.${k}` : k);
    }
    return out;
  }
  return node;
};

const ruPath = join(LOCALES_DIR, 'ru.json');
const ru = JSON.parse(readFileSync(ruPath, 'utf8'));

for (const { file, code } of TARGETS) {
  console.log(`\n=== ${file} (${code}) ===`);
  const translated = await walk(ru, code);
  writeFileSync(join(LOCALES_DIR, file), JSON.stringify(translated, null, 2) + '\n');
  console.log(`written ${file}`);
}

console.log('\ndone');
