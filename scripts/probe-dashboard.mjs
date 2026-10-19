import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9365;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-probe-'));

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

if (!targets || !targets.length) {
  console.error('Failed to connect to Edge target');
  edge.kill();
  process.exit(1);
}

const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
const pending = new Map();
let id = 0;
const events = [];

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
    return;
  }
  if (m.method === 'Runtime.exceptionThrown') {
    events.push('[exception] ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || ''));
  }
  if (m.method === 'Runtime.consoleAPICalled') {
    events.push('[console.' + m.params.type + '] ' + m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  }
};

await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Runtime.enable');

console.log('Navigating to http://127.0.0.1:8089/index.html...');
await send('Page.navigate', { url: 'http://127.0.0.1:8089/index.html' });
await sleep(3500);

const evalRes = await send('Runtime.evaluate', {
  expression: `(() => {
    const out = {};
    out.title = document.title;
    out.state = document.documentElement.dataset.state;
    out.hasGridCanvas = !!document.getElementById('grid-canvas');
    out.hasWhaleStage = !!document.getElementById('whale-stage');
    out.whaleCanvas = document.querySelector('#whale-stage canvas') ? {
      w: document.querySelector('#whale-stage canvas').width,
      h: document.querySelector('#whale-stage canvas').height
    } : null;
    out.gridCanvas = document.querySelector('#grid-canvas') ? {
      w: document.querySelector('#grid-canvas').width,
      h: document.querySelector('#grid-canvas').height
    } : null;
    out.pillarsCount = document.querySelectorAll('.pillar-card').length;
    out.dayCellsCount = document.querySelectorAll('.day-cell').length;
    out.goalText = document.querySelector('.goal-big-num')?.textContent;
    out.credoText = document.querySelector('.credo-text')?.textContent;
    return JSON.stringify(out);
  })()`,
  returnByValue: true
});

console.log('=== Page Diagnostic ===');
console.log(JSON.stringify(JSON.parse(evalRes.result.value), null, 2));

console.log('=== Console Logs & Exceptions ===');
for (const e of events) {
  console.log(e);
}

// 截图验证
const shot = await send('Page.captureScreenshot', { format: 'png' });
if (shot && shot.data) {
  const buf = Buffer.from(shot.data, 'base64');
  const outPath = 'C:/Users/65451/.gemini/antigravity/brain/47509975-dbdd-4a6c-a79e-613554cb6519/whale_dashboard_preview.png';
  fs.writeFileSync(outPath, buf);
  console.log('Saved preview to:', outPath);
}

// 模拟点击切换到施压日
console.log('Testing click on [施压日] button...');
await send('Runtime.evaluate', {
  expression: `(() => {
    const stressBtn = document.querySelector('.state-btn[data-kind="hi"]');
    if (stressBtn) stressBtn.click();
  })()`
});
await sleep(1500);

const stressEval = await send('Runtime.evaluate', {
  expression: `(() => {
    return {
      state: document.documentElement.dataset.state,
      todayBadge: document.querySelector('.action-status-badge')?.textContent,
      goalNum: document.querySelector('.goal-big-num')?.textContent
    };
  })()`,
  returnByValue: true
});
console.log('=== After Switching to Stress State ===', stressEval.result.value);

// 移动端排版测试 (iPhone 14 / 390x844)
console.log('Capturing mobile view...');
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true
});
await sleep(1000);

const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
if (mobileShot && mobileShot.data) {
  const mobPath = 'C:/Users/65451/.gemini/antigravity/brain/47509975-dbdd-4a6c-a79e-613554cb6519/whale_mobile_preview.png';
  fs.writeFileSync(mobPath, Buffer.from(mobileShot.data, 'base64'));
  console.log('Saved mobile preview to:', mobPath);
}

ws.close();
edge.kill();
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch {}
console.log('Probe finished successfully.');
