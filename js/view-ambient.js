/* ============================================================
   视图 · 环境界面（ambient）
   主张：你不在使用一个网页，你在看一个状态。
   没有卡片、没有标题栏、没有边框 —— 三章是同一片场里的三层景深，
   内容直接浮在空间里，靠字号层级与极淡的横线建立秩序。
   机制创新：**整页即状态**。按下高强度，整片场换季为火焰态，
   撤销则回到采集（苔原态），过渡长达 1.8s ——
   比任何按钮反馈都更接近"环境变了"。

   【v3 整改】
   1. 控制台从底部移到**顶部**，常驻不隐退 —— 每天都要按的东西，
      不该让人往下找。正文靠 --rail-h 从顶部让位。
   2. 声明 defaultKind = 'gather'：**采集/漫步是默认态**，
      没人按的日子自动落在它上面；只有主动施压的当天才会变成高强度。
      于是"每天要点一下"变成了"只在加压的那一天按一下"。
   3. 顶部天象改用引擎给的展示态（marks），默认日以更淡的画法区分
      "本来就是"与"我真的按过"。

   控制台用 position:fixed 呈现，但 DOM 里仍在 #exercise 内，
   因此点击事件照常冒泡到引擎的委托监听上 —— 不必为它改一行引擎代码。
   ============================================================ */
(function () {
  'use strict';

  const C = window.SMN_CONTENT;

  /* --- 一章：巨大虚影编号 + 章节名 + 英文，下面是条目 --- */
  function chapterHTML(id, ctx) {
    const ch = ctx.chapters[id];
    const entries = ch.entries.map((e) => `
      <section class="amb-entry" data-entry="${e.kind}">
        <h3 class="amb-entry-h">${e.h}</h3>
        ${C.resolveParagraphs(e, ctx).map((p) => `<p>${p}</p>`).join('')}
      </section>`).join('');

    return `
      <header class="amb-head">
        <span class="amb-head-ghost" aria-hidden="true">${ch.no}</span>
        <h2 class="amb-head-cn">${ch.cn}</h2>
        <p class="amb-head-en">${ch.en}</p>
      </header>
      <div class="amb-entries">${entries}</div>`;
  }

  /* --- 顶部天象：七格，点在上、星期字在下 ---
     默认态的日子画得更淡（is-auto），好让"这周我真的施压了哪两天"跳出来 */
  function weekHTML(ctx) {
    return ctx.weekDayCN.map((cn, i) => {
      const kind = ctx.marks[i];
      const cls = ['amb-week-cell'];
      if (kind) cls.push(kind);
      if (ctx.state[i]) cls.push('is-set');
      else if (kind) cls.push('is-auto');
      if (i === ctx.todayIdx) cls.push('is-today');
      const mark = kind ? ctx.dayKinds[kind].name : '未到';
      return `<span class="${cls.join(' ')}" title="周${cn} · ${mark}">
          <i class="amb-week-dot"></i><b class="amb-week-cn">${cn}</b>
        </span>`;
    }).join('');
  }

  /* --- 顶部常驻控制台：状态词 + 两枚开关 + 一周天象 --- */
  function hudHTML(ctx) {
    const { dayKinds, kindOrder, counts, storageOK } = ctx;

    const poles = kindOrder.map((k) => {
      const cfg = dayKinds[k];
      const daily = !!cfg.daily;
      const on = ctx.todayKind === k;
      const n = storageOK ? counts[k] : 0;
      const done = !daily && storageOK && n >= cfg.goal;

      const tip = on
        ? (daily ? `今天是${cfg.name}` : `撤销今天的${cfg.name}，回到默认的采集日`)
        : `把今天记为${cfg.name}`;

      /* 默认态那一极不报"目标"，报"这一周走了几天"；
         带目标的那一极才显示 n / goal 与达成 */
      const sub = !storageOK
        ? '记录不可用'
        : daily
          ? `${cfg.note} · 本周 ${n} 天`
          : done ? `本周已满 ${n}` : `${n} / ${cfg.goal}`;

      return `<button class="day-toggle amb-pole amb-pole--${k}${on ? ' is-on' : ''}${done ? ' is-done' : ''}${daily ? ' is-daily' : ''}${ctx.pop === k ? ' is-pop' : ''}"
                data-kind="${k}" type="button" title="${tip}" aria-pressed="${on}">
          <span class="amb-pole-orb" aria-hidden="true"></span>
          <span class="amb-pole-label">
            <span class="amb-pole-text">${done ? cfg.done : cfg.name}</span>
            <span class="amb-pole-count">${sub}</span>
          </span>
          <span class="amb-pole-check" aria-hidden="true"></span>
        </button>`;
    }).join('');

    const short = ctx.todayKind
      ? (dayKinds[ctx.todayKind].short || dayKinds[ctx.todayKind].name)
      : '未选';
    const word = !storageOK
      ? '本地记录不可用'
      : ctx.todayKind === ctx.explicitKind
        ? `今日 · ${short}`
        : `今日 · ${short}（默认）`;

    const hint = !storageOK
      ? '当前窗口不允许写入本地存储（常见于无痕模式）'
      : ctx.todayKind === 'hi'
        ? '再按一次高强度即撤销，今天自动回到采集日'
        : '采集日是每天默认的状态，不必按；只在加压的那天按高强度';

    return `
      <div class="amb-hud">
        <div class="amb-dock">
          <div class="amb-readout">
            <p class="amb-state" data-state="${ctx.todayKind || 'none'}">
              <span class="amb-state-dot" aria-hidden="true"></span>${word}
            </p>
            <p class="amb-hint">${hint}</p>
          </div>
          <div class="amb-poles">${poles}</div>
          <div class="amb-week" role="group" aria-label="本周记录">${weekHTML(ctx)}</div>
        </div>
      </div>`;
  }

  function renderExercise(ctx) {
    const el = document.getElementById('exercise');
    if (!el) return;
    // 整片场的状态由今天的取值决定 —— 这是本方案的核心表达
    document.body.dataset.state = ctx.todayKind || 'none';
    el.innerHTML = chapterHTML('exercise', ctx) + hudHTML(ctx);
  }

  function renderSleep(ctx) {
    const el = document.getElementById('sleep');
    if (!el) return;
    el.innerHTML = chapterHTML('sleep', ctx);
  }

  function renderNutrition(ctx) {
    const el = document.getElementById('nutrition');
    if (!el) return;
    el.innerHTML = chapterHTML('nutrition', ctx);
  }

  /* 章节进入视野时极缓地浮起。默认可见，这里只加位移与透明度 */
  function reveal() {
    const chapters = document.querySelectorAll('.amb-chapter');
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -8% 0px' });
    chapters.forEach((c) => io.observe(c));
  }

  window.SMN_VIEW = {
    id: 'ambient',
    /* 采集（漫步）是默认态：没记录的日子自动算作它。
       引擎据此推断 todayKind 与展示用的 marks —— 视图不自己算这个 */
    defaultKind: 'gather',
    renderExercise,
    renderSleep,
    renderNutrition,
    reveal
  };
})();
