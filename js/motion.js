/* ============================================================
   动效层 · 手感（handfeel）

   在这之前，页面只吃了 handfeel 那份规范的"禁令" —— 别给运动章加 transform、
   别让三章用同一套登场、时长别超出档位 —— 却没吃它的配方本身。
   于是页面上的东西全是**声明式**的：过渡、关键帧、循环动画。
   它们会动，但不响应你：不跟指针、不跟滚动、不跟手，也没有重量。

   这一层把四条真正响应式的配方接上：

     ① 场跟随指针      §7.1 帧率无关的指数跟随 + §2 速度耦合
     ② 换季的冲击      §8   一次短促的冲击（不是循环动画）+ 一周刻度依次弹起
     ③ 开关球          §1   欠阻尼弹簧：过冲 → 落位 → 余震
                       §4   体积保持的形变（冲得快就把球压扁）
     ④ 滚动            §2   速度耦合：滚多快，正文歪多少；停下自动归零
                             + 章节巨编号按"元素在视口里的位置"做视差

   一条 rAF、五个订阅者（最后一个是粒子层，住在 js/particles.js —— 它共用
   这一条 rAF，不另起循环）。关掉动效时整层不启动，页面退回纯 CSS 的那一版，
   而那一版本身是设计过的，不是坏掉的一版。

   判据在下面「总闸」一节：默认开，只有用户自己关过才关。

   ⚠ 运动章内部不得出现 transform（见 ambient.css 里的同名警告）。
   本层只写 #exercise 的**内部**元素（.amb-entries / .amb-head-ghost），
   绝不碰 .amb-chapter 与 .amb-page 本身。
   ============================================================ */
(function () {
  'use strict';
  if (window.SMN_MOTION) return;

  /* ------------------------------------------------------------
     总闸：默认开，只有用户自己关过才关

     这里判断过一次。原来默认跟随系统的 prefers-reduced-motion ——
     尊重无障碍设置本身是对的，但实际后果是：这台机器 Windows 关了
     「动画效果」（MinAnimate = 0），浏览器如实上报 reduce，
     于是整个场——呼吸、换季色、粒子——一起消失，屏幕上安静得像一张图，
     而页面上没有任何东西提示"这里本该有动效"。
     （实测确认过：不是无头浏览器的假象，是系统设置真的如此。）

     现在：**默认开**。判据只认用户自己的显式选择 —— 那个小开关写下的
     'off'。要静止就点一下，那是明确的、看得见的、存得下的一个动作，
     比一个用户可能从来不知道它存在过的系统开关更靠得住。
     ------------------------------------------------------------ */
  const KEY = 'smn.motion';
  let pref = null;
  try { pref = localStorage.getItem(KEY); } catch (e) { /* 无痕模式：读不到就当作没设过 */ }

  /* 只留着写按钮提示用，不再参与判断 —— 页面已经开始忽略它了 */
  const sysReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OFF = pref === 'off';

  /* CSS 侧的呼吸、换季色也跟着这个总闸走 ——
     它们原本挂在媒体查询上，而媒体查询没法被页面里的按钮覆盖 */
  document.documentElement.dataset.motion = OFF ? 'off' : 'on';

  const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
  /* §7.1 帧率无关的一阶跟随。k 是"紧度"（1/s），不是每帧比例 ——
     写成 x += d * 0.1 的话，同一行代码在 30/60/120fps 下是三种手感 */
  const follow = (x, t, k, dt) => x + (t - x) * (1 - Math.exp(-k * dt));

  /* ------------------------------------------------------------
     一条 rAF，若干订阅者
     ------------------------------------------------------------ */
  const subs = new Set();
  let running = false;
  let prev = 0;

  function loop(now) {
    /* 掉帧时把 dt 钳在 1/30 —— 否则一次 200ms 的卡顿会把所有弹簧炸开 */
    const dt = prev ? Math.min((now - prev) / 1000, 1 / 30) : 1 / 60;
    prev = now;
    for (const fn of subs) fn(dt);
    if (subs.size) requestAnimationFrame(loop);
    else { running = false; prev = 0; }
  }

  function subscribe(fn) {
    subs.add(fn);
    if (!running) { running = true; prev = 0; requestAnimationFrame(loop); }
  }

  function unsubscribe(fn) { subs.delete(fn); }

  /* ============================================================
     ① 场跟随指针
     指针位置经指数跟随落到 --fx/--fy 上，整片场的光晕跟着走。
     再加一项速度耦合：甩得快时多冲出去一点，停下自己收回来 ——
     这一项就是"顺"和"有劲"的差别（规范 §2）。
     ============================================================ */
  const field = document.querySelector('.amb-field');
  let ptrX = 0, ptrY = 0, curX = 0, curY = 0, seen = false;

  function onPointer(e) {
    if (!innerWidth || !innerHeight) return;
    seen = true;
    ptrX = (e.clientX / innerWidth - 0.5) * 2;   /* -1 … 1 */
    ptrY = (e.clientY / innerHeight - 0.5) * 2;
  }

  if (!OFF && field) {
    window.addEventListener('pointermove', onPointer, { passive: true });

    subscribe((dt) => {
      if (!seen) return;
      const nx = follow(curX, ptrX, 4.5, dt);
      const ny = follow(curY, ptrY, 4.5, dt);
      const vx = clamp((nx - curX) / Math.max(dt, 1e-3) * 0.55, -7, 7);
      const vy = clamp((ny - curY) / Math.max(dt, 1e-3) * 0.55, -7, 7);
      curX = nx; curY = ny;
      field.style.setProperty('--fx', (nx * 15 + vx).toFixed(2) + '%');
      field.style.setProperty('--fy', (ny * 12 + vy).toFixed(2) + '%');
    });
  }

  /* 开场那三行也跟着指针让一点：幅度只有场的一半 ——
     字要是晃得和光一样多，读起来就散了。开场那层被移除之后就自己摘掉 */
  const introLockup = document.querySelector('.amb-intro-lockup');
  if (!OFF && introLockup) {
    let ix = 0, iy = 0;
    const introSub = (dt) => {
      if (!introLockup.isConnected) { unsubscribe(introSub); return; }
      if (!seen) return;
      const nx = follow(ix, ptrX * 8, 3.4, dt);
      const ny = follow(iy, ptrY * 6, 3.4, dt);
      if (Math.abs(nx - ix) < 0.008 && Math.abs(ny - iy) < 0.008) return;
      ix = nx; iy = ny;
      introLockup.style.transform =
        `translate3d(${nx.toFixed(2)}px, ${ny.toFixed(2)}px, 0)`;
    };
    subscribe(introSub);
  }

  /* ============================================================
     ② 换季的冲击
     按下开关 → 引擎改判 → body[data-state] 变 → 这里只做一件事：
     让这次变化在物理上留下痕迹。三样东西同时发生 ——
     一点扩散出去的柔光波纹、一排依次弹起的一周刻度、场自己亮一下。
     §8 的两条规矩照做：幅度小、时长短、绝不叠加。
     ============================================================ */
  let hitX = 0, hitY = 0;

  document.addEventListener('pointerdown', (e) => {
    hitX = e.clientX; hitY = e.clientY;
  }, { passive: true, capture: true });

  /* 换季发生时，别的层也可能想跟着动一下（粒子层就是）。
     这里不去直接引用它们，只留一组回调 —— 层与层之间只通过这个接口说话，
     谁都可以不在，谁坏了也不拖累另一个 */
  const shockHooks = [];

  function shock(kind) {
    if (!field) return;

    /* 波纹：从按下的那一点扩出去。用柔光而不是硬环 ——
       硬环在暗场里像弹窗动画，柔光才像"光扫过来" */
    const wave = document.createElement('span');
    wave.className = 'amb-shock' + (kind === 'hi' || kind === 'gather' ? ' is-' + kind : '');
    wave.style.left = hitX + 'px';
    wave.style.top = hitY + 'px';
    field.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
    setTimeout(() => { if (wave.parentNode) wave.remove(); }, 1400);   /* 兜底 */

    /* 一周七格依次弹起：像指针扫过一排刻度，而不是七格一起跳 */
    document.querySelectorAll('.amb-week-cell').forEach((cell, i) => {
      cell.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(-3.5px)' },
        { transform: 'translateY(0)' }
      ], {
        duration: 440,
        delay: i * 36,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'backwards'
      });
    });

    /* 场自己亮一下 —— 这一下就是"环境变了"的物理证据 */
    field.classList.remove('is-kick');
    void field.offsetWidth;                 /* 强制重排，让动画从头播 */
    field.classList.add('is-kick');
    setTimeout(() => field.classList.remove('is-kick'), 900);

    for (const fn of shockHooks) {
      try { fn(kind, hitX, hitY); } catch (e) { /* 一层出事不能拖垮另一层 */ }
    }
  }

  let lastState = document.body.dataset.state;
  if (!OFF) {
    new MutationObserver(() => {
      const s = document.body.dataset.state;
      if (s === lastState) return;
      lastState = s;
      shock(s);
    }).observe(document.body, { attributes: true, attributeFilter: ['data-state'] });
  }

  /* ============================================================
     ③ 开关球：欠阻尼弹簧
     原来球的选中反馈是一条 CSS 过渡（--spring）。过渡是插值：
     单调、匀速衰减，读起来像"淡过去"。换成欠阻尼弹簧后，
     球会**冲过目标再落回来**，那一点过冲就是重量（§1）。
     再叠一层 §4 的体积保持：冲得快就把球压扁，停下自己圆回来。
     ============================================================ */
  let balls = [];
  let ballSub = null;
  /* 上一次渲染时每一极是不是"开着"。
     引擎每次改判都会整段重渲染，新 DOM 里的球永远是从 scale(1) 起步的 ——
     于是"撤销"这个方向就没有弹簧可弹，球只是瞬间缩回去。
     记一下上一帧的状态，把撤销也接上：从旧的 1.09 起步，让弹簧自己把它拉回 1 */
  const prevOn = Object.create(null);

  function bindBalls() {
    if (ballSub) { unsubscribe(ballSub); ballSub = null; }
    balls = [];

    document.querySelectorAll('.amb-pole').forEach((btn) => {
      const orb = btn.querySelector('.amb-pole-orb');
      if (!orb) return;
      const kind = btn.dataset.kind || '';
      const isOn = btn.classList.contains('is-on');
      const from = (!isOn && prevOn[kind] === true) ? 1.09 : 1;
      prevOn[kind] = isOn;
      /* 接管这个球的 transform。CSS 那条 transform 过渡必须让开 ——
         否则它会把每帧的写入再插值一次，弹簧又被抹平成过渡 */
      orb.classList.add('is-live');
      balls.push({ orb, s: from, v: 0 });
    });

    if (!balls.length || OFF) return;

    ballSub = (dt) => {
      /* 每帧 0.915 的衰减换算成帧率无关的形式 ——
         直接写 vel *= 0.915 的话，120Hz 屏上的阻尼会翻一倍。
         0.915 落在"果冻"与"沉稳"之间：实测过冲约 8%，
         够读出来是"咔"地到位，又不至于弹得像玩具 */
      const damp = Math.pow(0.915, dt * 60);
      for (const b of balls) {
        const pole = b.orb.closest('.amb-pole');
        const target = pole && pole.classList.contains('is-on') ? 1.09 : 1;
        b.v += (target - b.s) * 62 * dt;    /* 刚度 */
        b.v *= damp;                        /* 阻尼 */
        b.s += b.v * dt;
        const sq = clamp(b.v * 0.25, -0.20, 0.20);
        b.orb.style.transform =
          `scale(${(b.s * (1 + sq)).toFixed(4)}, ${(b.s * (1 - sq)).toFixed(4)})`;
      }
    };
    subscribe(ballSub);
  }

  /* ============================================================
     ④ 滚动：编号视差 + 正文速度倾斜
     视差由"元素在视口里的位置"驱动，不由滚动速度驱动 ——
     速度驱动会在你停手的一瞬把元素弹回去，读起来是"甩"；
     位置驱动才是"它本来就在那个深度"。
     倾斜反过来，由速度驱动：滚多快就歪多少，停手后自己衰减归零。
     ============================================================ */
  let ghosts = [], entries = [];
  let lastY = window.scrollY, sVel = 0, tilt = 0, appliedTilt = 0;

  function collectScroll() {
    ghosts = Array.prototype.slice.call(document.querySelectorAll('.amb-head-ghost'));
    entries = Array.prototype.slice.call(document.querySelectorAll('.amb-entries'));
  }

  if (!OFF) {
    subscribe((dt) => {
      const y = window.scrollY;
      const moved = y !== lastY;
      /* 彻底静止、且倾斜已经真的归零了，这一帧只花一次读数。
         注意判据必须是 appliedTilt（已经写出去的值）而不是 tilt 本身 ——
         用 tilt 的话它会卡在 0.006 那一档上再也回不了 0，
         于是页面上永远留着 0.2 度歪着不动的字 */
      if (!moved && appliedTilt === 0 && Math.abs(tilt) < 0.002) return;

      sVel = follow(sVel, (y - lastY) / Math.max(dt, 1e-3), 10, dt);
      lastY = y;

      /* 视差由"元素在视口里的位置"驱动，不由滚动速度驱动 */
      const vh = innerHeight || 1;
      for (const g of ghosts) {
        const r = g.getBoundingClientRect();
        const p = clamp((r.top + r.height / 2) / vh, -0.3, 1.3);
        g.style.transform = `translate3d(0, ${((0.5 - p) * 34).toFixed(1)}px, 0)`;
      }

      /* §2 速度耦合：滚多快，正文歪多少；停下时 tilt 自己衰减归零。
         40px/s 的死区是必须的 —— 速度滤波是指数衰减，永远回不到绝对值 0，
         没有死区的话页面静止后字会一直歪着零点几度不动 */
      const want = Math.abs(sVel) < 40 ? 0 : clamp(sVel * 0.0013, -0.75, 0.75);
      tilt = follow(tilt, want, 10, dt);
      const t = Math.abs(tilt) > 0.006 ? tilt : 0;
      if (t !== appliedTilt) {
        appliedTilt = t;
        const v = t ? `skewY(${t.toFixed(3)}deg)` : '';
        for (const e of entries) e.style.transform = v;
      }
    });
  }

  /* ------------------------------------------------------------
     动效开关：读数行末尾那一个小按钮
     页面默认就是动的，所以它现在的职责变成"我想让它停" ——
     夜里、专注时、电量见底时，一个动作就能让整页安静下来，
     而且这个选择存得住（下次打开还是静的）。
     ------------------------------------------------------------ */
  function mountSwitch() {
    const host = document.querySelector('.amb-state');
    if (!host || host.querySelector('.amb-motion')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'amb-motion';
    btn.dataset.on = OFF ? '0' : '1';
    /* 两套文案：宽屏给全 "动效 · 开"，窄屏收成 "动效"（状态靠颜色区分）——
       窄屏读数行要和一周天象并排，是这一页里最挤的一格 */
    btn.innerHTML = `<span class="amb-motion-full">动效 · ${OFF ? '关' : '开'}</span>`
                  + `<span class="amb-motion-min">动效</span>`;
    btn.setAttribute('aria-label', OFF ? '打开动效' : '关闭动效');
    btn.title = OFF
      ? '动效已关，整页静止。点一下打开。'
      : (sysReduce
          ? '动效已开。系统设置了「减少动画效果」，本页忽略了它 —— 点一下可以让页面安静下来。'
          : '动效已开。点一下关闭，页面就静下来了。');
    btn.addEventListener('click', () => {
      try { localStorage.setItem(KEY, OFF ? 'on' : 'off'); } catch (e) { /* 存不了就算了 */ }
      window.location.reload();      /* 整层要重开，重载比就地拆装可靠 */
    });
    host.appendChild(btn);
  }

  /* ------------------------------------------------------------
     挂载：DOM 重建后重新收集
     引擎每次渲染都会 innerHTML 重建三章，球的引用与编号的引用都会失效，
     所以三个 render 函数各自调一次 mount；合并到同一个微任务里只跑一遍。
     ------------------------------------------------------------ */
  let queued = false;

  function mount() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      collectScroll();
      bindBalls();
      mountSwitch();
    });
  }

  window.SMN_MOTION = {
    mount: mount,
    off: OFF,
    systemReduce: sysReduce,
    /* 下面几个是给粒子层用的。它要和这一层共用一条 rAF、
       共用同一套帧率无关的跟随 —— 自己另起一条 rAF 的话，
       两层的节奏会在掉帧时错开，看起来就是"各动各的" */
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    follow: follow,
    clamp: clamp,
    onShock: (fn) => { shockHooks.push(fn); }
  };

  function init() { collectScroll(); bindBalls(); mountSwitch(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
