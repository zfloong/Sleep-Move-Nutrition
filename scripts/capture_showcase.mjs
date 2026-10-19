import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9380;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-showcase-'));

const edge = spawn(EDGE, [
  '--headless=new',
  '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${PORT}`,
  '--window-size=1440,940',
  `--user-data-dir=${tempDir}`,
  'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let i = 0; i < 50; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    if (targets.length) break;
  } catch {}
  await sleep(150);
}

const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
const pending = new Map();
let id = 0;

const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};

await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:8089/whale_icon_showcase.html' });
await sleep(2000);

const shot = await send('Page.captureScreenshot', { format: 'png' });
const outPath = 'C:/Users/65451/.gemini/antigravity/brain/47509975-dbdd-4a6c-a79e-613554cb6519/whale_icon_candidates.png';
fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
console.log('Saved showcase screenshot to:', outPath);

ws.close();
edge.kill();
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch {}
