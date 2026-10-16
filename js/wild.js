/* =========================================
   Wildness Instinct - 今日指南系统
   Version: 12.0 - 引擎 / 视图分离
   Philosophy: 反脆弱 + 杠铃策略 + 听身体

   本文件是【引擎】，不含任何具体版式：
     存储 · 云同步 · 周键与跨天逻辑 · 开场白编排 · 交互接线
   版式由页面上加载的视图提供（window.SMN_VIEW）：
     js/view-ambient.js 环境界面（当前主页）
   视图可插拔：换一套版式只需换这一个文件，引擎与内容不必动。

   视图契约（三个方法 + 两个可选）：
     renderExercise(ctx) / renderSleep(ctx) / renderNutrition(ctx)
       把内容画进 #exercise / #sleep / #nutrition
     reveal()  可选：入场揭示。**只能增加动效，不得把内容藏起来**
       旧版把"点亮内容"放在开场白回调里，一旦初始化前段抛错就整页全黑；
       现在内容默认可见，reveal 只是锦上添花，从结构上杜绝空白页
     defaultKind  可选：声明"哪一极是默认态"（如 'gather'）。
       声明后，今天若没有显式记录，就自动落在这一极上 ——
       即"每日漫步自动点亮，只有主动施压的那一天才会变"。
       不声明则保持原样：没记录就是没记录。
     "今天的二选一"按钮必须带 class="day-toggle" 与 data-kind="hi|gather"

   内容全部来自 js/content.js（window.SMN_CONTENT），视图与引擎共用一份文案。
   ========================================= */
(function () {
  'use strict';

  const C = window.SMN_CONTENT;
  if (!C) {
    console.error('[wild] 缺少 js/content.js，引擎无法启动');
    return;
  }

  const DAY_KINDS = C.DAY_KINDS;
  const KIND_ORDER = C.KIND_ORDER;
  const WEEK_DAY_CN = C.WEEK_DAY_CN;
  const CHAPTERS = C.CHAPTERS;
  const CHAPTER_ORDER = C.CHAPTER_ORDER;

  const VIEW = window.SMN_VIEW || {};

  /* 视图声明的"默认态"。声明了它，就表示这一极不需要用户每天按 ——
     没记录的日子自动算作它。环境界面用它来表达"漫步是底座，施压才是事件" */
  const DEFAULT_KIND = DAY_KINDS[VIEW.defaultKind] ? VIEW.defaultKind : '';

  /* ============================================================
     1. 记录系统
     本地只剩一个键 smn_state，装全部周：
       { "2026-W41": { "2": {v:2, t:1759...} } }    0=周一 ... 6=周日
       v=1 高强度锻炼日 / v=2 模拟采集日 / v=0 已取消（墓碑）
          —— 一天只存一个值，因此两种日子天然互斥、不可能同时选中
       v=0 的墓碑让"取消"也能跨设备传播，而不是被云端旧记录复活
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

  /* 单日取值归一：1=高强度 / 2=模拟采集 / 0=取消（墓碑）。
     任何脏值（旧版布尔、云端异常数据）一律落回 0，避免污染计数 */
  const normV = (v) => (v === 1 ? 1 : v === 2 ? 2 : 0);

  const V_KIND = { 1: 'hi', 2: 'gather' };

  /* 当前周的简化视图 { "2": "hi" | "gather" } —— 只暴露"已标记"的日子 */
  function weekView(doc, wk = getWeekKey()) {
    const out = {};
    Object.entries(doc[wk] || {}).forEach(([d, rec]) => {
      const kind = V_KIND[normV(rec && rec.v)];
      if (kind) out[d] = kind;
    });
    return out;
  }

  function getWeekState() { return weekView(getDoc()); }

  /* 一天一个值：写入即覆盖 —— "两种日子一天只能选一个"由数据结构天然保证，
     不需要额外的互斥判断。取消时写 v=0 的墓碑而不是删键，
     否则云端合并会把它"复活" */
  function markDay(doc, dayIdx, v) {
    const wk = getWeekKey();
    const week = doc[wk] || (doc[wk] = {});
    week[dayIdx] = { v: normV(v), t: Date.now() };
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
        if (!prev || t >= (Number(prev.t) || 0)) target[d] = { v: normV(rec.v), t };
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

  const countKind = (state, kind) => Object.values(state).filter(v => v === kind).length;

  /* 周 key 每到本地周一 00:00 自动更换 → 新周期天然从空状态开始（即"零点清零"），
     不需要定时器，也不需要服务端参与。历史裁剪见 pruneDoc。 */

  /* ============================================================
     2. 云同步（可选，失败不影响本机）
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
      // 认形状而不是只认 ok：真后端一定会带回 configured 布尔字段，
      // 免得中间层注入一个碰巧含 ok:true 的 JSON 就被当成"后端就绪"
      if (data && data.ok && typeof data.configured === 'boolean') { SYNC.mode = 'cloud'; return; }
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
        renderExercise();
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
        renderExercise();
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
     3. 渲染调度
     引擎负责把状态整理成一个 ctx 交给视图；视图只管画。
     视图不碰存储、不碰同步、不碰日期计算。
     ============================================================ */

  let renderedStamp = '';   // 上次渲染时的时间指纹，用于检测跨天 / 跨周

  function buildCtx(pop = null) {
    const now = new Date();
    const state = getWeekState();                     // { "2": "hi" | "gather" } —— 只含显式记录
    const todayIdx = (now.getDay() + 6) % 7;          // 0=周一
    const explicitKind = state[todayIdx] || '';
    const todayKind = explicitKind || DEFAULT_KIND;   // 声明了默认态的视图：今天永远有值

    /* 展示态 marks：显式记录优先；启用默认态时，已经到达的日子
       （含今天）若没有任何记录，就落在默认那一极上。
       未来的日子不算 —— 明天的漫步还没有发生 */
    const marks = {};
    for (let i = 0; i < 7; i++) {
      if (state[i]) marks[i] = state[i];
      else if (DEFAULT_KIND && i <= todayIdx) marks[i] = DEFAULT_KIND;
    }

    /* 计数：需要主动施加的那一极只数显式记录；
       daily 的默认极走展示态，于是它天然等于"这一周已经走了几天" */
    const counts = {};
    KIND_ORDER.forEach((k) => {
      counts[k] = countKind(DAY_KINDS[k].daily ? marks : state, k);
    });

    /* 只有带目标的极才有"达成"；提醒刻度达到即算达成，超额不改变结论 */
    const goalKinds = KIND_ORDER.filter((k) => !DAY_KINDS[k].daily);
    const doneKinds = goalKinds.filter((k) => counts[k] >= DAY_KINDS[k].goal);

    const ctx = {
      pop,                        // 刚达成的那一极，只驱动一次动画
      now,
      weekKey: getWeekKey(now),
      todayIdx,
      todayKind,
      explicitKind,
      autoGather: DEFAULT_KIND === 'gather',
      state,                      // 显式记录（数据真相）
      marks,                      // 展示态（含默认推断）
      counts,
      hiDone: counts.hi >= DAY_KINDS.hi.goal,
      allDone: goalKinds.length > 0 && doneKinds.length === goalKinds.length,
      elapsed: todayIdx + 1,      // 本周已经过了几天（含今天）
      storageOK: STORAGE_OK,
      advice: '',                 // 下面按 ctx 自身算，避免把同一组条件写两遍
      quote: C.getDailyQuote(now),
      dayKinds: DAY_KINDS,
      kindOrder: KIND_ORDER,
      weekDayCN: WEEK_DAY_CN,
      chapters: CHAPTERS
    };
    ctx.advice = C.adviceFor(ctx);
    return ctx;
  }

  /* 视图缺席时的保底渲染：把内容以最朴素的形式摊开，
     绝不让页面因为"少加载了一个 js"而变成空白 */
  function fallbackRender(id, ctx) {
    const el = document.getElementById(id);
    if (!el) return;
    const ch = CHAPTERS[id];
    if (!ch) return;
    el.innerHTML =
      `<h3>${ch.cn}</h3><p><em>${ch.en}</em></p>` +
      ch.entries.map((e) =>
        `<h4>${e.h}</h4>` + C.resolveParagraphs(e, ctx).map((p) => `<p>${p}</p>`).join('')
      ).join('');
  }

  function paint(id, ctx) {
    const fn = VIEW['render' + id.charAt(0).toUpperCase() + id.slice(1)];
    if (typeof fn === 'function') {
      fn(ctx);
    } else {
      if (!VIEW.__warned) {
        VIEW.__warned = true;
        console.error('[wild] 未找到视图（window.SMN_VIEW），已降级为纯文本渲染');
      }
      fallbackRender(id, ctx);
    }
  }

  /* pop 传入刚达成的那一极（'hi' | 'gather' | null），只驱动一次动画 */
  function renderExercise(pop = null) {
    const ctx = buildCtx(pop);
    paint('exercise', ctx);
    if (VIEW.mount) { try { VIEW.mount(ctx); } catch (err) { console.error('[wild] 视图 mount 失败', err); } }
    renderedStamp = todayStamp();
  }

  function renderSleep() { paint('sleep', buildCtx()); }

  function renderNutrition() { paint('nutrition', buildCtx()); }

  function renderAll(pop = null) {
    renderExercise(pop);
    renderSleep();
    renderNutrition();
  }

  /* 入场揭示：只允许"加动效"，不允许"藏内容"。
     任何失败都只是少一段动画，页面该有的东西一样不少 */
  function revealView() {
    try {
      if (typeof VIEW.reveal === 'function') VIEW.reveal();
    } catch (err) {
      console.error('[wild] 入场揭示失败，内容保持可见', err);
    }
  }

  /* ============================================================
     4. 开场白编排
     三句箴言轮流上台：逐词浮现 → 停住让人读完 → 整句退回景深 → 下一句，
     三句演完遮罩散开，进主页。
     时序与排版全在 CSS 里（改文案、改节奏不用动这里），这里只管收场。

     整场 5.65s（三句各一遍浮出 + 停留 + 退净），比原来长了一倍，
     所以出口更要紧：点一下、敲任意键，立刻进主页。
     JS 整个没跑起来时也接得住 —— CSS 里还挂着一条定时兜底（7.1s）。
     ============================================================ */

  function initIntro(onDone) {
    const overlay = document.getElementById('introOverlay');
    if (!overlay) { onDone(); return; }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', finish);
      overlay.classList.add('hide');
      setTimeout(() => overlay.remove(), 1000);
      onDone();
    };

    overlay.addEventListener('click', finish);
    window.addEventListener('keydown', finish);

    // 最后一句退净（--d 3.89 + --line-life 1.3 + --line-out 0.46）之后收场
    setTimeout(finish, 5700);
  }

  /* ============================================================
     5. 跨天 / 跨周自动重绘
     页面一直开着跨过周一 00:00 时，靠这里把界面换成新的一周，
     不必手动刷新（周 key 一换，读到空状态即为清零）
     ============================================================ */

  function watchPeriodRollover() {
    const check = () => {
      if (todayStamp() !== renderedStamp) renderExercise();
    };

    setInterval(check, 30000);

    // 手机切回前台 / 电脑休眠唤醒后，先立刻核一次
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) check();
    });
  }

  /* ============================================================
     6. 交互：为今天二选一（可改选、可撤销）
     两个按钮共用同一格数据，所以"选了一个另一个就点不动"不是靠禁用实现的，
     而是那格已经被占：点另一个直接改选，不存在同时选中的中间态。
     在声明了默认态的视图里（如 ambient 的"漫步"），撤销 = 回到默认那一极：
       按下高强度 → 今天变火焰态；再按一次高强度 → 今天自动回到漫步，
     所以用户每天只需要在"加压"时动一次手，其余日子什么都不用做。
     视图只需保证按钮带 class="day-toggle" 与 data-kind。
     ============================================================ */

  function bindExerciseChoice() {
    const container = document.getElementById('exercise');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.day-toggle');
      if (!btn) return;

      // 存不了就别假装存了：重绘一次，让"记录无法保存"被看到
      if (!STORAGE_OK) {
        renderExercise();
        return;
      }

      const kind = btn.dataset.kind;
      if (!DAY_KINDS[kind]) return;
      const want = DAY_KINDS[kind].v;

      const doc = getDoc();
      const todayIdx = (new Date().getDay() + 6) % 7;
      const week = doc[getWeekKey()] || {};
      const cur = normV(week[todayIdx] && week[todayIdx].v);
      const before = buildCtx().counts[kind];

      // 再点同一个 = 撤销今天的记录；点另一个 = 今天改判给它
      markDay(doc, todayIdx, cur === want ? 0 : want);
      setDoc(doc);

      // 计数涨了才放一次脉冲动画（撤销不放）
      const after = buildCtx().counts[kind];
      renderExercise(after > before ? kind : null);

      schedulePush();
    });

    // 同一浏览器开了多个标签页时，别的页改动立刻同步过来
    window.addEventListener('storage', (e) => {
      if (e.key === LS_DOC) renderExercise();
    });
  }

  /* ============================================================
     7. 初始化
     纪律：先出内容，再上编排；每一步各自兜底。
     旧版把"点亮内容"塞在开场白回调里，前段一抛错就整页全黑 —— 现在不会了。
     ============================================================ */

  function initWildPage() {
    const steps = [migrateLegacy, renderAll, bindExerciseChoice, bindSyncBar, watchPeriodRollover];
    steps.forEach((step) => {
      try {
        step();
      } catch (err) {
        console.error(`[wild] 初始化步骤 ${step.name} 失败，已跳过并继续`, err);
      }
    });

    try {
      initIntro(revealView);
    } catch (err) {
      console.error('[wild] 开场编排异常，已跳过动画直接进主页', err);
      revealView();
    }

    initSync();   // 异步探测后端，绝不阻塞首屏
  }

  /* 暴露给自检脚本与调试用，视图不依赖这些 */
  window.SMN_ENGINE = {
    getWeekKey, weekView, normV, countKind, markDay, getDoc, setDoc,
    mergeDocs, todayStamp, buildCtx, renderAll, renderExercise,
    detectCloud, sync: SYNC, defaultKind: DEFAULT_KIND
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWildPage);
  } else {
    initWildPage();
  }
})();
