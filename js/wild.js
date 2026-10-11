/* =========================================
   Wildness Instinct - 今日指南系统
   Version: 10.0 - 开场白 + 施压选择系统
   Philosophy: 反脆弱 + 杠铃策略 + 听身体
   ========================================= */

/* ============================================================
   1. 内容配置
   ============================================================ */

// 生命哲思语录库（每日轮换）
const DAILY_QUOTES = [
  '生命需要间歇性剧烈压力，而非绝对稳定。追求恒定只会变脆弱。',
  '史前人类从无"每周三次、定时定量"的机械锻炼日程。',
  '若无精神追求，马拉松便是一种现代发明的、匀速的枯燥消耗。',
  '"规律运动"是现代人的迷思，它误以为稳定输入必有线性回报。',
  '规律的中等强度锻炼，因缺乏极致刺激与修复，往往效率最低。',
  '最佳策略是"两极结合"：极高强度冲击配以极长时间悠闲。',
  '实践上，大量悠闲漫步为基础，穿插几次短暂但拼尽全力的锻炼。',
  '最高法则是信任身体的自适应力，提供多变信号，而非粗暴管理。',
  '超补偿原理：身体的进化逻辑是"破坏 - 重建 - 更强"。缺乏剧烈压力，就失去了"破坏"与"更强"的起点。',
  '自律神经的智慧：真正的平衡，是在交感神经的全力出击与副交感神经的彻底修复之间，实现有节奏的切换。',
  '进化塑造了我们的"应激 - 恢复"循环系统。持续温和的压力会耗尽它，而间歇的极限挑战能使其更强大。',
  '身体的"反脆弱"性，根植于用一次高质量的深度恢复，来响应一次有意义的强烈应激。两者缺一不可。'
];

// 每周高强度目标
const HI_WEEKLY_GOAL = 2;

/* 板块纹章：与背景影像同源的波形线（viewBox 600x56，横向拉伸不失真） */
const CARD_WAVES = {
  // 睡眠：慢波呼吸
  sleep: 'M0,30 C 50,30 70,14 120,14 C 170,14 190,30 240,30 C 290,30 310,10 360,10 C 410,10 430,30 480,30 C 530,30 550,22 600,22',
  // 运动：心电脉冲
  exercise: 'M0,36 H150 l12,-6 l10,-18 l8,44 l10,-30 l8,14 l6,-6 H330 l12,-6 l10,-18 l8,44 l10,-30 l8,14 l6,-6 H600',
  // 营养：有机起伏
  nutrition: 'M0,32 C 40,32 55,20 90,22 C 130,24 145,40 190,38 C 235,36 250,16 300,18 C 350,20 365,34 410,32 C 455,30 470,24 520,26 C 560,28 575,32 600,30'
};

const waveSVG = (d) =>
  `<svg class="card-wave" viewBox="0 0 600 56" preserveAspectRatio="none" aria-hidden="true">` +
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;

function getDailyQuote(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

/* ============================================================
   2. 记录系统
   本地只剩一个键 smn_state，装全部周：
     { "2026-W41": { "2": {v:1, t:1759...} } }    0=周一 ... 6=周日
     v=1 已标记高强度 / v=0 已取消（墓碑，让"取消"也能跨设备传播）
     t=写入时刻(ms)：多端合并时按天取 t 最大者，天然 last-write-wins

   云端：/api/state（Cloudflare Pages Functions + KV）。
   上不上云只决定"能不能跨设备"，本机使用不依赖它。
   ============================================================ */

const LS_DOC = 'smn_state';
const LS_SYNC_KEY = 'smn_synckey';
const LEGACY_PREFIX = 'smn_hi_';
const KEEP_WEEKS = 26;

/* 存储可用性探测：Safari 无痕模式 / 禁用存储时，localStorage 写入会直接抛错。
   提前探一次，后面各处才能"明确告知"，而不是点了没反应 */
const STORAGE_OK = (() => {
  try {
    const probe = '__smn_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
})();

function getWeekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const thu = new Date(t);
  thu.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3);
  const first = new Date(Date.UTC(thu.getUTCFullYear(), 0, 4));
  first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7) + 3);
  const wk = 1 + Math.round((thu - first) / (7 * 864e5));
  return `${thu.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}

function readJSON(key, fallback) {
  if (!STORAGE_OK) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeJSON(key, value) {
  if (!STORAGE_OK) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[wild] 本地写入失败', err);
    return false;
  }
}

/* 旧版按周分键（smn_hi_2026-W41 = {"2":"hi"}）就地迁移到统一文档，
   已经记过的周不会因为这次改版丢掉 */
function migrateLegacy() {
  if (!STORAGE_OK) return;
  try {
    const stale = Object.keys(localStorage).filter(k => k.startsWith(LEGACY_PREFIX));
    if (!stale.length) return;
    const doc = readJSON(LS_DOC, {});
    stale.forEach((k) => {
      const wk = k.slice(LEGACY_PREFIX.length);
      const week = JSON.parse(localStorage.getItem(k)) || {};
      const target = doc[wk] || (doc[wk] = {});
      Object.entries(week).forEach(([d, v]) => {
        if (v === 'hi' && !target[d]) target[d] = { v: 1, t: 0 };
      });
      localStorage.removeItem(k);
    });
    writeJSON(LS_DOC, pruneDoc(doc));
  } catch { /* 迁移失败也不影响正常使用 */ }
}

/* 只保留最近 26 周，本地与 KV 都不会无限膨胀 */
function pruneDoc(doc, keep = KEEP_WEEKS) {
  Object.keys(doc).sort().reverse().slice(keep).forEach(k => delete doc[k]);
  return doc;
}

const getDoc = () => readJSON(LS_DOC, {});

function setDoc(doc) { return writeJSON(LS_DOC, pruneDoc(doc)); }

/* 当前周的简化视图 { "2": "hi" } —— 只暴露"已标记"的日子 */
function weekView(doc, wk = getWeekKey()) {
  const out = {};
  Object.entries(doc[wk] || {}).forEach(([d, rec]) => {
    if (rec && rec.v === 1) out[d] = 'hi';
  });
  return out;
}

function getWeekState() { return weekView(getDoc()); }

/* 单按钮切换：取消时写 v=0 的墓碑而不是删键 —— 否则云端合并会把它"复活" */
function markDay(doc, dayIdx, on) {
  const wk = getWeekKey();
  const week = doc[wk] || (doc[wk] = {});
  week[dayIdx] = { v: on ? 1 : 0, t: Date.now() };
  return doc;
}

/* 两端合并：同一周同一天取 t 更大的那条 */
function mergeDocs(local, remote) {
  const out = JSON.parse(JSON.stringify(local || {}));
  Object.entries(remote || {}).forEach(([wk, days]) => {
    const target = out[wk] || (out[wk] = {});
    Object.entries(days || {}).forEach(([d, rec]) => {
      if (!rec || typeof rec !== 'object') return;
      const t = Number(rec.t) || 0;
      const prev = target[d];
      if (!prev || t >= (Number(prev.t) || 0)) target[d] = { v: rec.v === 1 ? 1 : 0, t };
    });
  });
  return out;
}

/* 渲染时刻的指纹：周 key + 当天日期。
   任何一项变化（跨天或跨周）都意味着页面上高亮的"今天"和当前周期已经过期 */
function todayStamp() {
  const d = new Date();
  return `${getWeekKey(d)}|${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const countHI = (state) => Object.values(state).filter(v => v === 'hi').length;

/* 周 key 每到本地周一 00:00 自动更换 → 新周期天然从空状态开始（即"零点清零"），
   不需要定时器，也不需要服务端参与。历史裁剪见 pruneDoc。 */

const WEEK_DAY_CN = ['一', '二', '三', '四', '五', '六', '日'];

/* ============================================================
   2b. 云同步（可选，失败不影响本机）
   服务端只是一只抽屉：GET 取回、PUT 合并写回。
   "身份"就是那串同步码 —— 同一串码 = 同一份记录，无需注册登录。
   ============================================================ */

const API = '/api/state';
const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford Base32，去掉易混的 I L O U

function loadSyncKey() {
  if (!STORAGE_OK) return '';
  try { return localStorage.getItem(LS_SYNC_KEY) || ''; } catch { return ''; }
}

function saveSyncKey(k) {
  if (!STORAGE_OK) return;
  try {
    if (k) localStorage.setItem(LS_SYNC_KEY, k);
    else localStorage.removeItem(LS_SYNC_KEY);
  } catch { /* 静默 */ }
}

const SYNC = {
  mode: 'checking',            // checking | local | cloud
  key: loadSyncKey(),
  status: 'idle',              // idle | syncing | ok | error
  reason: '',
  error: '',
  panel: false,
  copied: false
};

let pushTimer = null;

/* 20 位、约 100 bit 熵；五位一组方便抄写与核对 */
function genSyncKey() {
  const bytes = new Uint8Array(20);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  let s = '';
  for (const b of bytes) s += KEY_ALPHABET[b % 32];
  return s.replace(/(.{5})/g, '$1-').replace(/-$/, '');
}

const keyDigits = (k) => String(k || '').toUpperCase().replace(/[^0-9A-Z]/g, '');

/* 粘贴时可能带空格、小写、缺横线 —— 一律归一化 */
const normalizeKey = (k) => (keyDigits(k).match(/.{1,5}/g) || []).join('-');

function syncHeaders() {
  const h = { 'cache-control': 'no-cache' };
  if (SYNC.key) h['x-sync-key'] = SYNC.key;
  return h;
}

/* 探测后端是否就绪：file:// 一定没有；部署后即使还没填码也应答 200 */
async function detectCloud() {
  if (location.protocol === 'file:') {
    SYNC.mode = 'local';
    SYNC.reason = 'file:// 直接打开时没有后端，部署到 Pages 后自动可用';
    return;
  }
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(API, { headers: syncHeaders(), signal: ctl.signal, cache: 'no-store' });
    clearTimeout(timer);
    const data = await res.json();
    if (data && data.ok) { SYNC.mode = 'cloud'; return; }
    SYNC.mode = 'local';
    SYNC.reason = (data && data.error) || '后端未就绪';
  } catch {
    SYNC.mode = 'local';
    SYNC.reason = '连不上同步服务';
  }
}

async function pull() {
  if (SYNC.mode !== 'cloud' || !SYNC.key) return;
  SYNC.status = 'syncing';
  renderSyncBar();
  try {
    const res = await fetch(API, { headers: syncHeaders(), cache: 'no-store' });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'pull failed');

    const remote = data.weeks || {};
    const local = getDoc();
    const merged = mergeDocs(local, remote);

    if (JSON.stringify(merged) !== JSON.stringify(local)) {
      setDoc(merged);
      renderExerciseGuide();
    }
    SYNC.status = 'ok';
    SYNC.error = '';

    // 本机有、云端没有（离线期间记的）→ 补推一次
    if (JSON.stringify(merged) !== JSON.stringify(remote)) setTimeout(push, 0);
  } catch {
    SYNC.status = 'error';
    SYNC.error = '读取失败';
  }
  renderSyncBar();
}

async function push() {
  if (SYNC.mode !== 'cloud' || !SYNC.key) return;
  SYNC.status = 'syncing';
  renderSyncBar();
  try {
    const res = await fetch(API, {
      method: 'PUT',
      headers: Object.assign({ 'content-type': 'application/json' }, syncHeaders()),
      body: JSON.stringify({ weeks: getDoc() })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'push failed');

    const local = getDoc();
    const merged = mergeDocs(local, data.weeks || {});
    if (JSON.stringify(merged) !== JSON.stringify(local)) {
      setDoc(merged);
      renderExerciseGuide();
    }
    SYNC.status = 'ok';
    SYNC.error = '';
  } catch {
    SYNC.status = 'error';
    SYNC.error = '写入失败';
  }
  renderSyncBar();
}

/* 落本地是即时的，推云端延后 700ms —— 连点七下也只写一次 */
function schedulePush() {
  if (SYNC.mode !== 'cloud' || !SYNC.key) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 700);
}

function syncPanelHTML(on) {
  const tip = on
    ? '在另一台设备上打开同一个网址，展开这个面板，把这串码粘进下面的输入框，两端就通了。'
    : '在一台设备上生成同步码，再在另一台设备上把它粘进来 —— 两边从此共用同一份记录。';

  const mine = on
    ? `<div class="sync-field">
        <span class="sync-field-label">我的同步码</span>
        <code class="sync-code">${SYNC.key}</code>
        <button class="sync-btn" data-act="copy" type="button">${SYNC.copied ? '已复制' : '复制'}</button>
      </div>`
    : '';

  const tail = on
    ? `<div class="sync-field">
        <button class="sync-btn danger" data-act="off" type="button">在本机关闭同步</button>
      </div>`
    : `<div class="sync-field">
        <button class="sync-btn" data-act="new" type="button">在这台设备生成新同步码</button>
      </div>`;

  return `
    <div class="sync-panel">
      ${mine}
      <p class="sync-tip">${tip}</p>
      <div class="sync-field">
        <input class="sync-input" data-role="key" placeholder="粘贴已有的同步码" autocomplete="off" spellcheck="false">
        <button class="sync-btn" data-act="use" type="button">使用</button>
      </div>
      ${tail}
    </div>`;
}

function renderSyncBar() {
  const el = document.getElementById('syncBar');
  if (!el) return;

  if (SYNC.mode === 'checking') { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;

  if (SYNC.mode === 'local') {
    el.innerHTML = `
      <div class="sync-line">
        <i class="ri-hard-drive-2-line"></i>
        <span>本地记录</span>
        <span class="sync-note">${SYNC.reason || '记录只保存在这台设备的浏览器里'}</span>
      </div>`;
    return;
  }

  const on = !!SYNC.key;
  const label = SYNC.status === 'error'
    ? (SYNC.error || '同步失败')
    : SYNC.status === 'syncing' ? '同步中'
      : on ? '已同步' : '跨设备同步未开启';

  el.innerHTML = `
    <div class="sync-line${SYNC.status === 'error' ? ' err' : ''}">
      <i class="ri-cloud-line"></i>
      <span class="sync-dot ${SYNC.status}"></span>
      <span>${label}</span>
      <button class="sync-btn ghost" data-act="toggle" type="button">${SYNC.panel ? '收起' : (on ? '同步码' : '设置')}</button>
    </div>
    ${SYNC.panel ? syncPanelHTML(on) : ''}`;
}

function bindSyncBar() {
  const el = document.getElementById('syncBar');
  if (!el) return;

  el.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;

    if (act === 'toggle') {
      SYNC.panel = !SYNC.panel;
      SYNC.error = '';
      renderSyncBar();
      const input = el.querySelector('[data-role="key"]');
      if (input) input.focus();
      return;
    }

    if (act === 'new') {
      SYNC.key = genSyncKey();
      saveSyncKey(SYNC.key);
      SYNC.panel = true;
      SYNC.error = '';
      renderSyncBar();
      await push();
      return;
    }

    if (act === 'copy') {
      try {
        await navigator.clipboard.writeText(SYNC.key);
        SYNC.copied = true;
        renderSyncBar();
        setTimeout(() => { SYNC.copied = false; renderSyncBar(); }, 1800);
      } catch {
        SYNC.status = 'error';
        SYNC.error = '浏览器未授权剪贴板，请手动选中复制';
        renderSyncBar();
      }
      return;
    }

    if (act === 'use') {
      const input = el.querySelector('[data-role="key"]');
      const raw = keyDigits(input && input.value);
      if (raw.length < 8) {
        SYNC.status = 'error';
        SYNC.error = '同步码太短，请核对';
        renderSyncBar();
        return;
      }
      const changed = normalizeKey(raw) !== SYNC.key;
      SYNC.key = normalizeKey(raw);
      saveSyncKey(SYNC.key);
      SYNC.panel = false;
      SYNC.status = 'idle';
      SYNC.error = '';
      renderSyncBar();
      if (changed) await pull();
      return;
    }

    if (act === 'off') {
      if (!window.confirm('关闭后这台设备不再上传记录；云端已有的记录不受影响。继续？')) return;
      SYNC.key = '';
      saveSyncKey('');
      SYNC.panel = false;
      SYNC.status = 'idle';
      SYNC.error = '';
      renderSyncBar();
    }
  });
}

async function initSync() {
  await detectCloud();
  renderSyncBar();
  if (SYNC.mode === 'cloud' && SYNC.key) await pull();

  // 在别的设备改完、切回本页时先把最新那份拿回来
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pull();
  });
}

/* ============================================================
   3. 开场白编排
   三句哲思逐句浮现 → 淡出进入主页
   ============================================================ */

function initIntro() {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) {
    document.body.classList.add('ready');
    initScrollReveal();
    return;
  }

  const finish = () => {
    if (overlay.classList.contains('hide')) return;
    overlay.classList.add('hide');
    document.body.classList.add('ready');
    setTimeout(() => overlay.remove(), 600);
    initScrollReveal();
  };

  // 三句哲思的时序由 CSS 接管（0.8 / 1.9 / 3.0s），这里只负责收场
  // Apple 语法：场景先在，文字后浮，4.5s 淡出进主页
  setTimeout(finish, 4800);
}

/* ============================================================
   4. 卷轴揭示：板块滚入视区才被点亮，一次一处焦点
   ============================================================ */

function initScrollReveal() {
  const cards = document.querySelectorAll('.guide-card');
  if (!('IntersectionObserver' in window)) {
    cards.forEach(c => c.classList.add('in'));
    return;
  }

  let guard = null;

  const io = new IntersectionObserver((entries) => {
    let hit = false;
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      hit = true;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
    if (hit && guard) clearTimeout(guard);
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

  cards.forEach(c => io.observe(c));

  // 兜底：任何原因导致观察器没回调，1.5s 后强制点亮全部内容，绝不留下空白页
  guard = setTimeout(() => {
    cards.forEach(c => c.classList.add('in'));
    io.disconnect();
  }, 1500);
}

/* ============================================================
   5. UI 渲染
   ============================================================ */

let justAchieved = false; // 本次操作是否刚刚达成目标（用于徽章弹出动画）
let renderedStamp = '';   // 上次渲染时的时间指纹，用于检测跨天 / 跨周

function renderExerciseGuide() {
  const container = document.getElementById('exercise');
  if (!container) return;

  const state = getWeekState();
  const hiCount = countHI(state);
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=周一
  const isHI = state[todayIdx] === 'hi';
  const achieved = hiCount >= HI_WEEKLY_GOAL;

  // 常驻周进度：无论达没达成都在，周一零点随 key 自动归零重建
  const dots = WEEK_DAY_CN.map((cn, i) => {
    const cls = ['week-dot'];
    if (state[i] === 'hi') cls.push('on');
    if (i === todayIdx) cls.push('today');
    return `<span class="${cls.join(' ')}" title="周${cn}"></span>`;
  }).join('');

  // 达成后仍然报出具体次数 —— 3 次和 2 次不该长得一样
  const stripTail = !STORAGE_OK
    ? `<i class="ri-error-warning-line"></i>记录无法保存`
    : achieved
      ? `<i class="ri-check-line"></i>已达成 · ${hiCount} 次`
      : `${hiCount} / ${HI_WEEKLY_GOAL}`;

  const weekStrip = `
    <div class="week-strip${achieved && STORAGE_OK ? ' achieved' : ''}${justAchieved ? ' pop' : ''}${STORAGE_OK ? '' : ' no-store'}">
      <span class="week-label">本周强度</span>
      <div class="week-dots">${dots}</div>
      <span class="week-count">${stripTail}</span>
    </div>`;

  // 今日建议文案：存储不可用 > 今天已施压 > 本周已达成 > 默认漫步
  const adviceText = !STORAGE_OK
    ? '当前窗口不允许写入本地存储（常见于无痕模式），标记无法保存。换普通窗口打开即可正常记录。'
    : isHI
      ? '今天已施加压力。剩下的时间交给恢复——漫步、早睡，让超补偿开始。'
      : achieved
        ? '本周目标已达成。今天随心：想烧就烧，想走就走。'
        : '默认漫步日。身体允许就全力输出 5-15 分钟，不允许就漫步 1-2 小时。';

  container.innerHTML = `
    <div class="card-head">
      <div class="card-head-main">
        <div class="card-title-row">
          <span class="card-index">01</span>
          <h3>🏃 运动</h3>
        </div>
        <div class="section-en">Apply the stress.</div>
      </div>
      <button class="hi-toggle${isHI ? ' active' : ''}" data-kind="hi" type="button" aria-pressed="${isHI}">
        <i class="ri-fire-line"></i>高强度锻炼日
      </button>
    </div>
    ${weekStrip}
    ${waveSVG(CARD_WAVES.exercise)}
    <div class="core-advice">

      <div class="advice-item">
        <i class="ri-compass-3-line"></i>
        <div class="advice-text">
          <h4>今日建议</h4>
          <p>${adviceText}</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-book-open-line"></i>
        <div class="advice-text">
          <h4>生命哲思</h4>
          <p class="quote-text">"${getDailyQuote(new Date())}"</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-footprint-line"></i>
        <div class="advice-text">
          <h4>每日漫步</h4>
          <p>每天漫步 1-2 小时，模拟原始人类的平静采集日</p>
        </div>
      </div>

    </div>
  `;

  renderedStamp = todayStamp();
}

function renderNutritionGuide() {
  const container = document.getElementById('nutrition');
  if (!container) return;

  container.innerHTML = `
    <div class="card-head">
      <div class="card-head-main">
        <div class="card-title-row">
          <span class="card-index">03</span>
          <h3>🌱 营养</h3>
        </div>
        <div class="section-en">Remove the harm.</div>
      </div>
    </div>
    ${waveSVG(CARD_WAVES.nutrition)}
    <div class="core-advice">

      <div class="advice-item">
        <i class="ri-restaurant-line"></i>
        <div class="advice-text">
          <h4>饮食铁律</h4>
          <p><strong>不吃超加工食品</strong> - 只吃天然、未加工的传统食物。</p>
          <p><strong>只喝千年饮品</strong> - 水、咖啡、茶。</p>
          <p><strong>避免重糖重盐</strong></p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-leaf-line"></i>
        <div class="advice-text">
          <h4>植物常规，肉不规律</h4>
          <p>大部分日子以植物为主——传统蔬菜、坚果。偶尔大吃肉、内脏、骨髓，模仿祖先狩猎成功的日子。</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-brain-line"></i>
        <div class="advice-text">
          <h4>听身体信号</h4>
          <p>不数卡路里，不固定餐次。饿了就吃，饱了就停。偶尔跳过一餐让自噬启动。</p>
        </div>
      </div>

    </div>
  `;
}

function renderSleepGuide() {
  const container = document.getElementById('sleep');
  if (!container) return;

  container.innerHTML = `
    <div class="card-head">
      <div class="card-head-main">
        <div class="card-title-row">
          <span class="card-index">02</span>
          <h3>😴 睡眠</h3>
        </div>
        <div class="section-en">Let what recovers recover.</div>
      </div>
    </div>
    ${waveSVG(CARD_WAVES.sleep)}
    <div class="core-advice">

      <div class="advice-item">
        <i class="ri-time-line"></i>
        <div class="advice-text">
          <h4>顺其自然</h4>
          <p>不设闹钟，不排时间表。身体自然醒就起床，困了再睡。由内在节律而非外部钟表主导。</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-heart-line"></i>
        <div class="advice-text">
          <h4>无忧而眠</h4>
          <p>质量重于时长。接纳白天小睡，核心是解除对睡眠时长的焦虑，专注恢复本身。</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-refresh-line"></i>
        <div class="advice-text">
          <h4>拥抱偶发剥夺</h4>
          <p>偶发失眠是系统抗干扰训练。只要白天不大量补睡，身体自我恢复后，未来睡眠反而更稳定。</p>
        </div>
      </div>

    </div>
  `;
}

/* ============================================================
   6. 跨天 / 跨周自动重绘
   页面一直开着跨过周一 00:00 时，靠这里把界面换成新的一周，
   不必手动刷新（周 key 一换，读到空状态即为清零）
   ============================================================ */

function watchPeriodRollover() {
  const check = () => {
    if (todayStamp() !== renderedStamp) renderExerciseGuide();
  };

  setInterval(check, 30000);

  // 手机切回前台 / 电脑休眠唤醒后，先立刻核一次
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check();
  });
}

/* ============================================================
   7. 交互：选择今天的状态（可改选、可取消）
   ============================================================ */

function bindExerciseChoice() {
  const container = document.getElementById('exercise');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.hi-toggle');
    if (!btn) return;

    // 存不了就别假装存了：重绘一次，让周条上的"记录无法保存"被看到
    if (!STORAGE_OK) {
      renderExerciseGuide();
      return;
    }

    const doc = getDoc();
    const todayIdx = (new Date().getDay() + 6) % 7;
    const week = doc[getWeekKey()] || {};
    const isOn = !!(week[todayIdx] && week[todayIdx].v === 1);
    const prev = countHI(weekView(doc));

    // 单按钮切换：点=标记高强度，再点=取消（回到默认漫步）
    markDay(doc, todayIdx, !isOn);
    setDoc(doc);

    const now = countHI(weekView(doc));
    justAchieved = prev < HI_WEEKLY_GOAL && now >= HI_WEEKLY_GOAL;
    renderExerciseGuide();
    justAchieved = false;

    schedulePush();
  });

  // 同一浏览器开了多个标签页时，别的页改动立刻同步过来
  window.addEventListener('storage', (e) => {
    if (e.key === LS_DOC) renderExerciseGuide();
  });
}

/* ============================================================
   8. 初始化
   ============================================================ */

/* 顺序纪律：先出内容，再上编排。
   开场环节出问题也绝不能让主页变成空白（卡片是 opacity:0 起手的） */
function initWildPage() {
  migrateLegacy();
  renderExerciseGuide();
  renderNutritionGuide();
  renderSleepGuide();
  bindExerciseChoice();
  bindSyncBar();
  watchPeriodRollover();
  initSync();   // 异步探测后端，绝不阻塞首屏

  try {
    initIntro();
  } catch (err) {
    console.error('[wild] 开场编排异常，已跳过动画直接进主页', err);
    document.body.classList.add('ready');
    initScrollReveal();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWildPage);
} else {
  initWildPage();
}
