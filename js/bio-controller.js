/* ============================================================
   Sleep-Move-Nutrition · 生物中枢控制器 (Bio Controller)
   含完整 Cloudflare KV 跨设备端到端云同步系统
   ============================================================ */
(function (global) {
  'use strict';

  const LS_KEY = 'smn_state';
  const LS_SYNC_KEY = 'smn_synckey';
  const API = '/api/state';
  const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  // 辅助函数：计算 ISO 周键 (如 "2026-W42")
  function getISOWeekKey(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const thu = new Date(t);
    thu.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3);
    const first = new Date(Date.UTC(thu.getUTCFullYear(), 0, 4));
    first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7) + 3);
    const wk = 1 + Math.round((thu - first) / (7 * 864e5));
    return `${thu.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
  }

  // 星期一为 0，星期日为 6
  function getDayIndex(d = new Date()) {
    return (d.getDay() + 6) % 7;
  }

  // 生成 20 位 Base32 同步码
  function genSyncKey() {
    const bytes = new Uint8Array(20);
    if (window.crypto && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    let s = '';
    for (const b of bytes) s += KEY_ALPHABET[b % 32];
    return s.replace(/(.{5})/g, '$1-').replace(/-$/, '');
  }

  function keyDigits(k) {
    return String(k || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  }

  function normalizeKey(k) {
    return (keyDigits(k).match(/.{1,5}/g) || []).join('-');
  }

  // 双向两端合并算法：同一周同一天取时间戳 t 最大者
  function mergeDocs(local, remote) {
    const out = JSON.parse(JSON.stringify(local || {}));
    Object.entries(remote || {}).forEach(([wk, days]) => {
      const target = out[wk] || (out[wk] = {});
      Object.entries(days || {}).forEach(([d, rec]) => {
        if (!rec || typeof rec !== 'object') return;
        const t = Number(rec.t) || 0;
        const prev = target[d];
        if (!prev || t >= (Number(prev.t) || 0)) {
          const v = rec.v === 1 ? 1 : rec.v === 2 ? 2 : 0;
          target[d] = { v, t };
        }
      });
    });
    return out;
  }

  class BioDashboard {
    constructor() {
      this.weekKey = getISOWeekKey();
      this.todayIdx = getDayIndex();
      this.stateDoc = this.loadState();
      this.quoteIdx = Math.floor(Math.random() * 12);

      // 云同步状态
      this.syncKey = this.loadSyncKey();
      this.syncMode = 'checking'; // checking | cloud | local
      this.syncStatus = 'idle';   // idle | syncing | ok | error
      this.syncMsg = '';
      this.pushTimer = null;

      this.initEngines();
      this.bindDOM();
      this.bindSync();
      this.render();

      this.initSync();
    }

    // --- 本地存储 ---
    loadState() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        console.warn('Storage read failed:', e);
        return {};
      }
    }

    saveState() {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(this.stateDoc));
      } catch (e) {
        console.warn('Storage write failed:', e);
      }
      this.schedulePush();
    }

    loadSyncKey() {
      try {
        return localStorage.getItem(LS_SYNC_KEY) || '';
      } catch {
        return '';
      }
    }

    saveSyncKey(k) {
      this.syncKey = k ? normalizeKey(k) : '';
      try {
        if (this.syncKey) localStorage.setItem(LS_SYNC_KEY, this.syncKey);
        else localStorage.removeItem(LS_SYNC_KEY);
      } catch {}
    }

    getWeekData() {
      if (!this.stateDoc[this.weekKey]) {
        this.stateDoc[this.weekKey] = {};
      }
      return this.stateDoc[this.weekKey];
    }

    getTodayKind() {
      const week = this.getWeekData();
      const rec = week[this.todayIdx];
      if (rec && rec.v === 1) return 'hi';
      return 'gather'; // 默认底座：采集日
    }

    setTodayKind(kind) {
      const week = this.getWeekData();
      const val = (kind === 'hi') ? 1 : 2;
      week[this.todayIdx] = { v: val, t: Date.now() };
      this.saveState();
      this.applyKind(kind, true);
      this.render();
    }

    toggleDayState(dayIdx) {
      const week = this.getWeekData();
      const current = week[dayIdx] ? week[dayIdx].v : 2;
      const next = (current === 1) ? 2 : 1; // 施压 ⟷ 采集互换
      week[dayIdx] = { v: next, t: Date.now() };
      this.saveState();

      if (dayIdx === this.todayIdx) {
        this.applyKind(next === 1 ? 'hi' : 'gather', true);
      }
      this.render();
    }

    initEngines() {
      // 1. 点线网格层
      const gridCanvas = document.getElementById('grid-canvas');
      if (gridCanvas && global.createGridBackground) {
        this.gridEngine = global.createGridBackground(gridCanvas);
      }

      // 2. 3D 粒子巨鲸引擎
      const whaleStage = document.getElementById('whale-stage');
      if (whaleStage && global.WhaleBioEngine) {
        this.whaleEngine = new global.WhaleBioEngine(whaleStage);
        const initialKind = this.getTodayKind();
        this.whaleEngine.setState(initialKind);
      }
    }

    applyKind(kind, triggerEffect = false) {
      document.documentElement.dataset.state = kind;
      if (this.whaleEngine) {
        this.whaleEngine.setState(kind);
      }
      const badge = document.querySelector('.brand-logo-whale');
      if (badge && triggerEffect) {
        badge.style.transform = 'scale(1.22) rotate(-8deg)';
        setTimeout(() => { badge.style.transform = ''; }, 450);
      }
    }

    bindDOM() {
      // 状态切换按钮 (采集 vs 施压)
      const switcherBtns = document.querySelectorAll('.state-btn');
      switcherBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const kind = btn.dataset.kind;
          this.setTodayKind(kind);
        });
      });

      // 信条药丸轮播
      const credoPill = document.querySelector('.credo-pill');
      if (credoPill) {
        credoPill.addEventListener('click', () => this.cycleQuote());
      }

      // 底部操作
      const pokeBtn = document.getElementById('btn-poke');
      if (pokeBtn) {
        pokeBtn.addEventListener('click', () => {
          if (this.whaleEngine) this.whaleEngine.triggerScatter();
        });
      }

      const nextCredoBtn = document.getElementById('btn-next-credo');
      if (nextCredoBtn) {
        nextCredoBtn.addEventListener('click', () => this.cycleQuote());
      }

      const fsBtn = document.getElementById('btn-fullscreen');
      if (fsBtn) {
        fsBtn.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        });
      }

      // 卡片折叠抽屉
      const expandBtns = document.querySelectorAll('.pillar-expand-btn');
      expandBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const card = e.currentTarget.closest('.pillar-card');
          if (card) {
            const isExp = card.classList.toggle('expanded');
            btn.querySelector('.expand-text').textContent = isExp ? '收起细则' : '展开关键准则';
          }
        });
      });

      // 视口尺寸变化时重新计算跑马灯
      window.addEventListener('resize', () => this.checkCredoOverflow(), { passive: true });
    }

    updateCredo(text) {
      const track = document.querySelector('.credo-track');
      const textEl = document.querySelector('.credo-text');
      const dupEl = document.querySelector('.credo-text-dup');
      const viewport = document.querySelector('.credo-viewport');
      if (!track || !textEl || !viewport) return;

      track.style.opacity = '0';
      setTimeout(() => {
        textEl.textContent = text;
        if (dupEl) dupEl.textContent = text;

        track.classList.remove('is-scrolling');
        void track.offsetWidth; // 触发 reflow

        const isOverflow = textEl.scrollWidth > (viewport.clientWidth - 12);
        if (isOverflow) {
          const distance = textEl.scrollWidth + 48;
          const duration = Math.max(14, Math.round(distance / 28));
          track.style.setProperty('--marquee-duration', `${duration}s`);
          track.classList.add('is-scrolling');
        }

        track.style.opacity = '1';
      }, 180);
    }

    checkCredoOverflow() {
      const track = document.querySelector('.credo-track');
      const textEl = document.querySelector('.credo-text');
      const viewport = document.querySelector('.credo-viewport');
      if (!track || !textEl || !viewport) return;

      const isOverflow = textEl.scrollWidth > (viewport.clientWidth - 12);
      if (isOverflow && !track.classList.contains('is-scrolling')) {
        const distance = textEl.scrollWidth + 48;
        const duration = Math.max(14, Math.round(distance / 28));
        track.style.setProperty('--marquee-duration', `${duration}s`);
        track.classList.add('is-scrolling');
      } else if (!isOverflow && track.classList.contains('is-scrolling')) {
        track.classList.remove('is-scrolling');
      }
    }

    cycleQuote() {
      const quotes = (global.SMN_CONTENT && global.SMN_CONTENT.DAILY_QUOTES) || [
        '生命需要间歇性剧烈压力，而非绝对稳定。',
        '最佳策略是两极结合：极高强度冲击配以极长时间悠闲。',
        '超补偿原理：身体的进化逻辑是破坏 - 重建 - 更强。'
      ];
      this.quoteIdx = (this.quoteIdx + 1) % quotes.length;
      this.updateCredo(quotes[this.quoteIdx]);
    }

    // --- 云同步机制 ---
    syncHeaders() {
      const h = { 'cache-control': 'no-cache' };
      if (this.syncKey) h['x-sync-key'] = this.syncKey;
      return h;
    }

    async initSync() {
      await this.detectCloud();
      this.updateSyncBadge();
      if (this.syncMode === 'cloud' && this.syncKey) {
        await this.pull();
      }

      // 切回页面或标签页时自动拉取最新
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.syncMode === 'cloud' && this.syncKey) {
          this.pull();
        }
      });
    }

    async detectCloud() {
      if (location.protocol === 'file:') {
        this.syncMode = 'local';
        this.syncMsg = '本地预览环境';
        return;
      }
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 6000);
        const res = await fetch(API, { headers: this.syncHeaders(), signal: ctl.signal, cache: 'no-store' });
        clearTimeout(timer);
        const data = await res.json();
        if (data && data.ok && typeof data.configured === 'boolean') {
          this.syncMode = 'cloud';
          return;
        }
        this.syncMode = 'local';
        this.syncMsg = data?.error || '云服务未就绪';
      } catch {
        this.syncMode = 'local';
        this.syncMsg = '无法连接云端';
      }
    }

    async pull() {
      if (this.syncMode !== 'cloud' || !this.syncKey) return;
      this.syncStatus = 'syncing';
      this.updateSyncBadge();

      try {
        const res = await fetch(API, { headers: this.syncHeaders(), cache: 'no-store' });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'pull failed');

        const remote = data.weeks || {};
        const local = this.stateDoc;
        const merged = mergeDocs(local, remote);

        if (JSON.stringify(merged) !== JSON.stringify(local)) {
          this.stateDoc = merged;
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
          this.render();
        }
        this.syncStatus = 'ok';
        this.syncMsg = '已与云端同步';
      } catch (err) {
        this.syncStatus = 'error';
        this.syncMsg = '拉取失败';
        console.warn('Sync pull failed:', err);
      }
      this.updateSyncBadge();
    }

    async push() {
      if (this.syncMode !== 'cloud' || !this.syncKey) return;
      this.syncStatus = 'syncing';
      this.updateSyncBadge();

      try {
        const res = await fetch(API, {
          method: 'PUT',
          headers: Object.assign({ 'content-type': 'application/json' }, this.syncHeaders()),
          body: JSON.stringify({ weeks: this.stateDoc })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'push failed');

        const local = this.stateDoc;
        const merged = mergeDocs(local, data.weeks || {});
        if (JSON.stringify(merged) !== JSON.stringify(local)) {
          this.stateDoc = merged;
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
          this.render();
        }
        this.syncStatus = 'ok';
        this.syncMsg = '已保存到云端';
      } catch (err) {
        this.syncStatus = 'error';
        this.syncMsg = '上传失败';
        console.warn('Sync push failed:', err);
      }
      this.updateSyncBadge();
    }

    schedulePush() {
      if (this.syncMode !== 'cloud' || !this.syncKey) return;
      clearTimeout(this.pushTimer);
      this.pushTimer = setTimeout(() => this.push(), 700);
    }

    bindSync() {
      const syncBtn = document.getElementById('btn-sync-toggle');
      const backdrop = document.getElementById('syncModalBackdrop');
      const closeBtn = document.getElementById('btn-close-sync-modal');

      if (syncBtn) {
        syncBtn.addEventListener('click', () => this.openSyncModal());
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeSyncModal());
      }
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) this.closeSyncModal();
        });
      }
    }

    openSyncModal() {
      const backdrop = document.getElementById('syncModalBackdrop');
      if (!backdrop) return;
      this.renderSyncModalContent();
      backdrop.classList.add('active');
    }

    closeSyncModal() {
      const backdrop = document.getElementById('syncModalBackdrop');
      if (backdrop) backdrop.classList.remove('active');
    }

    renderSyncModalContent() {
      const contentEl = document.getElementById('syncModalBody');
      if (!contentEl) return;

      const hasKey = !!this.syncKey;
      let html = '';

      if (hasKey) {
        html = `
          <div class="sync-modal-section">
            <span class="sync-section-label">当前设备同步码</span>
            <div class="sync-code-display">
              <code class="sync-code-val" id="mySyncCode">${this.syncKey}</code>
              <button class="sync-pill-btn" id="btn-copy-sync">复制同步码</button>
            </div>
            <p class="sync-tip-text">
              在手机或其它设备上打开本网站，填入这串同步码，两端即可自动无缝合并并共享健康记录。
            </p>
          </div>

          <div class="sync-modal-section">
            <span class="sync-section-label">改绑其它同步码</span>
            <div class="sync-input-row">
              <input type="text" class="sync-text-input" id="inputOtherKey" placeholder="粘贴已有同步码 (20位)" autocomplete="off">
              <button class="sync-pill-btn primary" id="btn-apply-other-key">绑定</button>
            </div>
          </div>

          <div class="sync-modal-footer-actions">
            <button class="sync-action-danger" id="btn-disable-sync">在此设备关闭云同步</button>
            <button class="sync-pill-btn" id="btn-manual-sync">立即同步一次</button>
          </div>
        `;
      } else {
        html = `
          <div class="sync-modal-section">
            <span class="sync-section-label">方案 1 · 在此设备启用新同步码</span>
            <p class="sync-tip-text">生成一串唯一的 20 位专属同步码，无需注册即可在云端安全加密存储。</p>
            <button class="sync-pill-btn primary" id="btn-create-key">生成新同步码并开启同步</button>
          </div>

          <div class="sync-modal-divider"><span>或者</span></div>

          <div class="sync-modal-section">
            <span class="sync-section-label">方案 2 · 输入已有同步码</span>
            <p class="sync-tip-text">若您已在手机或其它电脑上拥有同步码，请在此粘贴以连通两端：</p>
            <div class="sync-input-row">
              <input type="text" class="sync-text-input" id="inputOtherKey" placeholder="例如：7K9M2-VW4PX-..." autocomplete="off">
              <button class="sync-pill-btn primary" id="btn-apply-other-key">绑定并合并</button>
            </div>
          </div>
        `;
      }

      contentEl.innerHTML = html;

      // 绑定模态框内部交互
      const copyBtn = document.getElementById('btn-copy-sync');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(this.syncKey);
            copyBtn.textContent = '已复制！';
            setTimeout(() => { copyBtn.textContent = '复制同步码'; }, 1800);
          } catch {
            alert('复制失败，请手动选中复制：' + this.syncKey);
          }
        });
      }

      const createBtn = document.getElementById('btn-create-key');
      if (createBtn) {
        createBtn.addEventListener('click', async () => {
          this.saveSyncKey(genSyncKey());
          this.renderSyncModalContent();
          this.updateSyncBadge();
          await this.push();
        });
      }

      const applyBtn = document.getElementById('btn-apply-other-key');
      if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
          const input = document.getElementById('inputOtherKey');
          const raw = keyDigits(input ? input.value : '');
          if (raw.length < 8) {
            alert('同步码格式不正确（至少需8位）');
            return;
          }
          this.saveSyncKey(normalizeKey(raw));
          this.renderSyncModalContent();
          this.updateSyncBadge();
          await this.pull();
          this.closeSyncModal();
        });
      }

      const disableBtn = document.getElementById('btn-disable-sync');
      if (disableBtn) {
        disableBtn.addEventListener('click', () => {
          if (confirm('关闭后这台设备将仅保存在本地浏览器中，不再与云端通信。确定关闭？')) {
            this.saveSyncKey('');
            this.syncStatus = 'idle';
            this.renderSyncModalContent();
            this.updateSyncBadge();
          }
        });
      }

      const manualBtn = document.getElementById('btn-manual-sync');
      if (manualBtn) {
        manualBtn.addEventListener('click', async () => {
          manualBtn.textContent = '同步中...';
          await this.pull();
          await this.push();
          manualBtn.textContent = '同步成功！';
          setTimeout(() => { manualBtn.textContent = '立即同步一次'; }, 1500);
        });
      }
    }

    updateSyncBadge() {
      const label = document.getElementById('syncStatusLabel');
      const dot = document.querySelector('.sync-status-dot');
      if (!label) return;

      if (!this.syncKey) {
        label.textContent = '同步码 · 未设置';
        if (dot) dot.className = 'sync-status-dot off';
      } else if (this.syncStatus === 'syncing') {
        label.textContent = '云端同步中...';
        if (dot) dot.className = 'sync-status-dot syncing';
      } else if (this.syncStatus === 'error') {
        label.textContent = '同步未就绪';
        if (dot) dot.className = 'sync-status-dot err';
      } else {
        label.textContent = '云端已同步';
        if (dot) dot.className = 'sync-status-dot ok';
      }
    }

    render() {
      const todayKind = this.getTodayKind();
      document.documentElement.dataset.state = todayKind;

      // 1. 切换按钮激活态
      const switcherBtns = document.querySelectorAll('.state-btn');
      switcherBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.kind === todayKind);
      });

      // 2. 7天刻度渲染
      const week = this.getWeekData();
      const weekDaysRow = document.querySelector('.week-days-row');
      if (weekDaysRow) {
        weekDaysRow.innerHTML = '';
        const dayNames = ['一', '二', '三', '四', '五', '六', '日'];

        let stressCount = 0;
        for (let i = 0; i < 7; i++) {
          const rec = week[i];
          const isStress = rec && rec.v === 1;
          const isGather = rec ? rec.v === 2 : i <= this.todayIdx;
          if (isStress) stressCount++;

          const cell = document.createElement('div');
          cell.className = 'day-cell' + (i === this.todayIdx ? ' today' : '');
          const cellState = isStress ? 'hi' : (isGather ? 'gather' : 'empty');
          cell.dataset.state = cellState;
          cell.title = `周${dayNames[i]}：点击切换施压/采集`;

          cell.innerHTML = `
            <span class="day-name">${dayNames[i]}</span>
            <div class="day-beacon">
              <div class="day-beacon-core"></div>
            </div>
          `;

          cell.addEventListener('click', () => {
            this.toggleDayState(i);
          });

          weekDaysRow.appendChild(cell);
        }

        // 3. 统计数字与进度条 (目标每周 2 次施压)
        const bigNum = document.querySelector('.goal-big-num');
        const fillBar = document.querySelector('.goal-bar-fill');
        const goalLabel = document.querySelector('.goal-target-label');
        if (bigNum) bigNum.textContent = `${stressCount}/2`;
        if (fillBar) fillBar.style.width = `${Math.min(100, (stressCount / 2) * 100)}%`;
        if (goalLabel) {
          goalLabel.textContent = stressCount >= 2 ? '本周目标已达成 · 充分蓄力' : '目标：每周 2 次高强度突破';
        }
      }

      // 4. 今日行动建议文案
      const actionBadge = document.querySelector('.action-status-badge');
      const actionText = document.querySelector('.action-guidance-text');
      if (todayKind === 'hi') {
        if (actionBadge) actionBadge.innerHTML = '⚡ 施压日 · 启动突破';
        if (actionText) actionText.innerHTML = '今天启动高阻力与极限刺激。45分钟复合动作或短间歇爆发，制造机械张力与稳态破坏，随后把一切交给漫步与深睡超补偿。';
      } else {
        if (actionBadge) actionBadge.innerHTML = '🌱 采集日 · 静息蓄力';
        if (actionText) actionText.innerHTML = '今天是有机修复与能量积累的一天。进行 1-2 小时低强度悠闲漫步，摄入充足全营养与水分，在黑暗凉爽深海中让副交感神经掌舵。';
      }

      // 5. 哲思信条跑马灯初始化
      if (!this.initialCredoSet) {
        this.initialCredoSet = true;
        const quotes = (global.SMN_CONTENT && global.SMN_CONTENT.DAILY_QUOTES) || [];
        if (quotes.length > 0) {
          this.updateCredo(quotes[this.quoteIdx % quotes.length]);
        }
      }

      this.updateSyncBadge();
    }
  }

  // 挂载并启动
  window.addEventListener('DOMContentLoaded', () => {
    global.bioDashboard = new BioDashboard();
  });

})(window);
