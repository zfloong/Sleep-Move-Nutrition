import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9395;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-credo-'));

const edge = spawn(EDGE, [
  '--headless=new',
  '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${PORT}`,
  '--window-size=1440,900',
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
await send('Runtime.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:8089/index.html' });
await sleep(2500);

// 注入用户截图中出现的超长长句测试
const testLongQuote = '自律神经的智慧：真正的平衡，是在交感神经的全力出击与副交感神经的彻底修复之间，实现有节奏的切换。';
console.log('Testing long quote marquee injection...');

const evalRes = await send('Runtime.evaluate', {
  expression: `(() => {
    window.bioDashboard.updateCredo("${testLongQuote}");
    return {
      textLength: "${testLongQuote}".length
    };
  })()`,
  returnByValue: true
});
console.log('Injected:', evalRes.result.value);

// 等待 500ms 让 DOM 测量并启动滚动
await sleep(600);

const checkRes = await send('Runtime.evaluate', {
  expression: `(() => {
    const track = document.querySelector('.credo-track');
    const viewport = document.querySelector('.credo-viewport');
    const textEl = document.querySelector('.credo-text');
    return {
      isScrolling: track ? track.classList.contains('is-scrolling') : false,
      textWidth: textEl ? textEl.scrollWidth : 0,
      viewportWidth: viewport ? viewport.clientWidth : 0,
      duration: track ? track.style.getPropertyValue('--marquee-duration') : '',
      text: textEl ? textEl.textContent : ''
    };
  })()`,
  returnByValue: true
});

console.log('=== Marquee Diagnostic ===', JSON.stringify(checkRes.result.value, null, 2));

// 截图验证顶部信条药丸跑马灯效果
const shot = await send('Page.captureScreenshot', { format: 'png' });
const outPath = 'C:/Users/65451/.gemini/antigravity/brain/47509975-dbdd-4a6c-a79e-613554cb6519/whale_credo_marquee.png';
fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
console.log('Saved marquee screenshot to:', outPath);

ws.close();
edge.kill();
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch {}
