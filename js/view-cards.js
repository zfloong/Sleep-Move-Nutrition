/* ============================================================
   视图 · 原版三卡片（cards）
   引擎版本 12 之前的 renderXxxGuide 逐字搬过来，DOM 结构与类名保持一致，
   css/wild.css 不需要任何改动。作为两套新方案的对照基线保留。
   ============================================================ */
(function () {
  'use strict';

  /* 图标与波形是版式信息，属于视图，不进内容层 */
  const ICONS = {
    'exercise.0': 'ri-compass-3-line',
    'exercise.1': 'ri-book-open-line',
    'exercise.2': 'ri-footprint-line',
    'sleep.0': 'ri-time-line',
    'sleep.1': 'ri-heart-line',
    'sleep.2': 'ri-refresh-line',
    'nutrition.0': 'ri-restaurant-line',
    'nutrition.1': 'ri-leaf-line',
    'nutrition.2': 'ri-brain-line'
  };

  const KIND_ICON = { hi: 'ri-fire-line', gather: 'ri-walk-line' };

  const CARD_WAVES = {
    sleep: 'M0,30 C 50,30 70,14 120,14 C 170,14 190,30 240,30 C 290,30 310,10 360,10 C 410,10 430,30 480,30 C 530,30 550,22 600,22',
    exercise: 'M0,36 H150 l12,-6 l10,-18 l8,44 l10,-30 l8,14 l6,-6 H330 l12,-6 l10,-18 l8,44 l10,-30 l8,14 l6,-6 H600',
    nutrition: 'M0,32 C 40,32 55,20 90,22 C 130,24 145,40 190,38 C 235,36 250,16 300,18 C 350,20 365,34 410,32 C 455,30 470,24 520,26 C 560,28 575,32 600,30'
  };

  const waveSVG = (d) =>
    `<svg class="card-wave" viewBox="0 0 600 56" preserveAspectRatio="none" aria-hidden="true">` +
    `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;

  /* 章节头：编号 + 中文标题 + 英文哲思；右侧留给两择按钮 */
  function head(id, ctx, right) {
    const ch = ctx.chapters[id];
    return `
      <div class="card-head">
        <div class="card-head-main">
          <div class="card-title-row">
            <span class="card-index">${ch.no}</span>
            <h3>${ch.glyph} ${ch.cn}</h3>
          </div>
          <div class="section-en">${ch.en}</div>
        </div>
        ${right || ''}
      </div>`;
  }

  function adviceBlock(id, ctx) {
    const ch = ctx.chapters[id];
    return `<div class="core-advice">` + ch.entries.map((entry, i) => {
      const paras = window.SMN_CONTENT.resolveParagraphs(entry, ctx)
        .map((p) => `<p${entry.kind === 'quote' ? ' class="quote-text"' : ''}>${p}</p>`).join('');
      return `${i ? '<div class="divider"></div>' : ''}
        <div class="advice-item">
          <i class="${ICONS[id + '.' + i]}"></i>
          <div class="advice-text">
            <h4>${entry.h}</h4>
            ${paras}
          </div>
        </div>`;
    }).join('') + `</div>`;
  }

  function renderExercise(ctx) {
    const el = document.getElementById('exercise');
    if (!el) return;

    const { dayKinds, kindOrder, counts, state, todayIdx, storageOK, weekDayCN } = ctx;

    // 常驻周进度：七颗点按当天所属种类着色，周一零点随周 key 自动归零重建
    const dots = weekDayCN.map((cn, i) => {
      const kind = state[i];
      const cls = ['week-dot'];
      if (kind) cls.push(kind);
      if (i === todayIdx) cls.push('today');
      return `<span class="${cls.join(' ')}" title="周${cn}${kind ? ' · ' + dayKinds[kind].name : ''}"></span>`;
    }).join('');

    // 两极各自报数，达成后换成"已达成"；超额补出 ×N —— 3 次和 2 次不该长得一样
    const stripTail = !storageOK
      ? `<span class="week-count"><i class="ri-error-warning-line"></i>记录无法保存</span>`
      : kindOrder.map((k) => {
          const { goal, short } = dayKinds[k];
          const n = counts[k];
          if (n < goal) return `<span class="week-count ${k}">${short} ${n}/${goal}</span>`;
          return `<span class="week-count ${k} done"><i class="ri-check-line"></i>${short}已达成${
            n > goal ? ` ×${n}` : ''
          }</span>`;
        }).join('');

    const options = kindOrder.map((k) => {
      const cfg = dayKinds[k];
      const on = ctx.todayKind === k;
      const done = counts[k] >= cfg.goal;
      const tip = on ? `取消今天的${cfg.name}` : `把今天记为${cfg.name}`;
      return `<button class="day-toggle${on ? ' active' : ''}${done ? ' done' : ''}${ctx.pop === k ? ' pop' : ''}"
                data-kind="${k}" type="button" title="${tip}" aria-pressed="${on}">
          <i class="${KIND_ICON[k]}"></i>${done ? cfg.done : cfg.name}
        </button>`;
    }).join('');

    el.innerHTML = head('exercise', ctx, `<div class="day-toggle-group">${options}</div>`) + `
      <div class="week-strip${storageOK ? '' : ' no-store'}">
        <span class="week-label">本周</span>
        <div class="week-dots">${dots}</div>
        ${stripTail}
      </div>
      ${waveSVG(CARD_WAVES.exercise)}
      ${adviceBlock('exercise', ctx)}`;
  }

  function renderSleep(ctx) {
    const el = document.getElementById('sleep');
    if (!el) return;
    el.innerHTML = head('sleep', ctx) + waveSVG(CARD_WAVES.sleep) + adviceBlock('sleep', ctx);
  }

  function renderNutrition(ctx) {
    const el = document.getElementById('nutrition');
    if (!el) return;
    el.innerHTML = head('nutrition', ctx) + waveSVG(CARD_WAVES.nutrition) + adviceBlock('nutrition', ctx);
  }

  /* 卷轴揭示：板块滚入视区才被点亮。
     注意这里只负责"从未点亮到点亮"，页面的默认可见性由 CSS 保证 ——
     所以本函数即使完全不执行，内容也照样看得见 */
  function reveal() {
    const cards = document.querySelectorAll('.guide-card');
    if (!('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    cards.forEach(c => io.observe(c));
  }

  window.SMN_VIEW = {
    id: 'cards',
    renderExercise,
    renderSleep,
    renderNutrition,
    reveal
  };
})();
