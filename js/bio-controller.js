/* ============================================================
   Sleep-Move-Nutrition · 生物中枢控制器 (Bio Controller)
   ============================================================ */
(function (global) {
  'use strict';

  const LS_KEY = 'smn_state';

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

  class BioDashboard {
    constructor() {
      this.weekKey = getISOWeekKey();
      this.todayIdx = getDayIndex();
      this.stateDoc = this.loadState();
      this.quoteIdx = Math.floor(Math.random() * 12);

      this.initEngines();
      this.bindDOM();
      this.render();
    }

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
      // 触发展开卡片微动态
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
    }

    cycleQuote() {
      const quotes = (global.SMN_CONTENT && global.SMN_CONTENT.DAILY_QUOTES) || [
        '生命需要间歇性剧烈压力，而非绝对稳定。',
        '最佳策略是两极结合：极高强度冲击配以极长时间悠闲。',
        '超补偿原理：身体的进化逻辑是破坏 - 重建 - 更强。'
      ];
      this.quoteIdx = (this.quoteIdx + 1) % quotes.length;
      const qText = document.querySelector('.credo-text');
      if (qText) {
        qText.style.opacity = '0';
        setTimeout(() => {
          qText.textContent = quotes[this.quoteIdx];
          qText.style.opacity = '1';
        }, 200);
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
          const isGather = rec ? rec.v === 2 : i <= this.todayIdx; // 过去或今天默认采集
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

      // 5. 哲思信条
      const qText = document.querySelector('.credo-text');
      const quotes = (global.SMN_CONTENT && global.SMN_CONTENT.DAILY_QUOTES) || [];
      if (qText && !qText.textContent && quotes.length > 0) {
        qText.textContent = quotes[this.quoteIdx % quotes.length];
      }
    }
  }

  // 挂载并启动
  window.addEventListener('DOMContentLoaded', () => {
    global.bioDashboard = new BioDashboard();
  });

})(window);
