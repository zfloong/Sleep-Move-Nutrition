/* ============================================================
   粒子层 · 场的密度

   这一层是来解决"场太空"的。原来场里只有 7 颗余烬和 5 颗孢子，
   而且是纯 CSS 关键帧：每颗按自己那条固定轨道走，互不相干，
   读起来像几个被钉住的小点在各自循环 —— 有量，但没有"空气"。

   现在换成一块 canvas，粒子数按屏幕面积给（桌面约 90、手机约 35），
   关键是每一颗都自带**深度**：

     远（z 小）→ 小、暗、动得慢、被指针推得近
     近（z 大）→ 大、亮、动得快、被指针推得远

   深度这一件事，就是"一片浮尘"和"几个贴纸"的全部区别。

   三种角色混着放，密度才不会被读成一层平铺的贴纸：

     dust   尘埃   大而极淡、走得慢 —— 像镜头前的浮灰，负责空气感
     core   主体   中间那一档，占绝大多数
     spark  火星   小而极亮、闪得快 —— 负责"这一片真的在烧/在飘"

   颜色仍然只有两种，和场里那两片换季色同源：

     hi     余烬   从底部升起，左右微微摆动，被指针吹偏
     gather 孢子   从左侧横漂，上下轻轻浮动，绕开指针

   换季时颜色**不是硬切**：每颗粒子按同一个 mix 值在暖/冷两张贴图上
   交叉淡替，速度与尺寸也跟着这个值混合。于是切换的那一秒多里，
   粒子会斜着往上飘一段 —— 像风真的换了方向。

   共用 motion.js 那条 rAF，不另起循环：两层节奏必须同源，
   否则掉帧时它们会错开，看起来就是各动各的。

   ⚠ 与 motion.js 同一条纪律：只写 .amb-field 的**内部**元素。
   ============================================================ */
(function () {
  'use strict';
  const M = window.SMN_MOTION;
  if (!M || window.SMN_PARTICLES) return;
  window.SMN_PARTICLES = true;

  const field = document.querySelector('.amb-field');
  const cv = field && field.querySelector('.amb-veil');
  if (!cv || !cv.getContext) return;

  /* 关掉动效时整层不启动 —— canvas 留白，页面上什么都不画。
     场自己的呼吸与换季色由 CSS 那组 html[data-motion="off"] 接管 */
  if (M.off) return;

  const ctx = cv.getContext('2d', { alpha: true });
  if (!ctx) return;

  const clamp = M.clamp;
  const follow = M.follow;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ------------------------------------------------------------
     画布：尺寸跟视口，像素密度封顶 2

     DPR 3 的手机上，1440×2500 的物理画布每帧要清一次、再叠 ~200 次
     绘制。封在 2 之后肉眼几乎看不出差别，但省掉将近一半的填充率。
     ------------------------------------------------------------ */
  let W = 0, H = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth || window.innerWidth || 1;
    H = cv.clientHeight || window.innerHeight || 1;
    cv.width = Math.max(1, Math.round(W * dpr));
    cv.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  }

  /* ------------------------------------------------------------
     贴图：一张软光斑，离屏只画一次

     不用每帧 createRadialGradient —— 那是每颗粒子每帧新建一个渐变对象，
     90 颗就是每秒 5400 个。预渲染成位图之后，每帧只是 drawImage，
     这是整层能跑到 60fps 的关键。
     停止点手写成"中心亮、边缘迅速化开"，而不是线性衰减：
     线性衰减的光斑中心是糊的，读起来像绿豆，不像光。
     ------------------------------------------------------------ */
  function sprite(rgb) {
    const S = 64;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0.00, 'rgba(' + rgb + ',1)');
    grd.addColorStop(0.14, 'rgba(' + rgb + ',0.78)');
    grd.addColorStop(0.34, 'rgba(' + rgb + ',0.28)');
    grd.addColorStop(0.62, 'rgba(' + rgb + ',0.07)');
    grd.addColorStop(1.00, 'rgba(' + rgb + ',0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    return c;
  }

  const WARM = sprite('255, 179, 122');   /* 施压之火 */
  const COOL = sprite('143, 211, 176');   /* 采集之野 */

  /* ------------------------------------------------------------
     三种角色
     r 是视觉半径（px），a 是基础不透明度，z 是深度，sp 是速度倍率。
     dust 那种大而淡的粒子存在的意义不是被看见，是让"空"看起来有厚度。

     这几个数是量出来的，不是拍的。第一版 r 取 0.6–1.5、a 取 0.20–0.50，
     截图一看就露馅：屏幕上是一层均匀的小亮点，读起来像相机噪点，
     不像浮尘 —— 因为**尺寸差异太小**，没有近大远小，就没有景深。
     现在把直径拉开到 3 倍以上（最大的光斑约 30px，最小的约 5px），
     亮度同步提了一档，密度从每 14500 平方像素一颗收到 10000。

     亮度上限刻意留在 1.0 —— 再往上是纯白点，在一片暖色里会扎眼。
     这一层的美感来自"层次"，不来自"亮"。
     ------------------------------------------------------------ */
  const ROLES = [
    { n: 0.14, r: [3.0, 6.2], a: [0.060, 0.145], z: [0.18, 0.44], sp: 0.32 }, /* dust  */
    { n: 0.74, r: [1.5, 3.4], a: [0.30, 0.70],   z: [0.55, 0.95], sp: 1.00 }, /* core  */
    { n: 0.12, r: [1.0, 2.0], a: [0.72, 1.00],   z: [0.88, 1.00], sp: 1.85 }  /* spark */
  ];

  let parts = [];

  function make(role) {
    const p = { role: role, r: 0, a0: 0, z: 0, sp: 0, seed: 0, k: 0, x: 0, y: 0, vx: 0, vy: 0 };
    seed(p);
    /* 初次铺满整屏，而不是让它们从底部/左侧慢慢涌出来 ——
       首屏那三句开场白只有五秒，等粒子漫上来，场已经散场了 */
    p.x = Math.random() * W;
    p.y = Math.random() * H;
    return p;
  }

  function seed(p) {
    const R = p.role;
    p.r = rand(R.r[0], R.r[1]);
    p.a0 = rand(R.a[0], R.a[1]);
    p.z = rand(R.z[0], R.z[1]);
    p.sp = R.sp * rand(0.75, 1.30);
    p.seed = Math.random() * Math.PI * 2;
    /* 贴图里能看见的那一圈约占整张的 1/5，所以绘制尺寸给 5 倍半径 */
    p.k = 5;
  }

  /* 出界就绕到对面接着走，不看当前是哪种模式 ——
     这样换季过渡中那些斜着飘的粒子也不会突然跳位置 */
  function recycle(p) {
    if (p.x > W + 160) { p.x = -160; p.y = Math.random() * H; }
    else if (p.x < -160) { p.x = W + 160; p.y = Math.random() * H; }
    else if (p.y < -160) { p.y = H + 160; p.x = Math.random() * W; }
    else if (p.y > H + 160) { p.y = -160; p.x = Math.random() * W; }
    else return;
    p.vx = 0; p.vy = 0;
  }

  function build() {
    const area = W * H;
    /* 桌面约 110 颗，手机约 44 颗。「一眼看不出数得清」是这条线的意思：
       再多就开始成噪点，再少又回到"几颗小点在循环"。
       下限给到 44 而不是按比例算出来的 29 —— 手机屏幕小，按比例给的量
       在视觉上会稀得不成场，而 44 颗粒子在这个尺寸上并不压性能 */
    const n = Math.round(clamp(area / 10000, 44, 150));
    let acc = 0, ri = 0;
    parts = [];
    for (let i = 0; i < n; i++) {
      /* 按权重轮流取角色，而不是每颗掷一次骰子 ——
         掷骰子在小样本上会失衡（34 颗时可能一颗 dust 都没有） */
      const want = (i + 0.5) / n;
      while (ri < ROLES.length - 1 && acc + ROLES[ri].n < want) { acc += ROLES[ri].n; ri++; }
      parts.push(make(ROLES[ri]));
    }
  }

  resize();
  build();

  window.addEventListener('resize', () => {
    resize();
    /* 尺寸变了，密度跟着变，但已有粒子不重建 —— 重建会让它们集体闪一下 */
    const want = Math.round(clamp(W * H / 10000, 44, 150));
    while (parts.length < want) parts.push(make(ROLES[parts.length % ROLES.length]));
    while (parts.length > want) parts.pop();
  }, { passive: true });

  /* ------------------------------------------------------------
     指针：粒子在它附近被推开 + 被点亮

     推开是"空气被搅动"，点亮是"光落在浮尘上"。两个都要有 ——
     只推开的话，鼠标扫过是一片被拨开的小点；加上点亮之后，
     那一片会先亮一下再散开，才像真的有一束光经过。
     ------------------------------------------------------------ */
  let ptrX = 0, ptrY = 0, ptrOn = false;

  window.addEventListener('pointermove', (e) => {
    ptrX = e.clientX; ptrY = e.clientY; ptrOn = true;
  }, { passive: true });

  window.addEventListener('pointerleave', () => { ptrOn = false; }, { passive: true });

  /* ------------------------------------------------------------
     换季：从指尖向外的一记冲量

     和 motion.js 的涟漪、场闪是同一件事的三个面。这里给它一个
     初速度，之后交给阻尼自己衰减 —— 所以它是"被吹了一下"，
     不是"开始绕圈跑"。
     ------------------------------------------------------------ */
  M.onShock((kind, x, y) => {
    const R = 470;
    for (const p of parts) {
      const dx = p.x - x, dy = p.y - y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d > R) continue;
      const f = 1 - d / R;
      const f2 = f * f;
      const amp = 360 * (0.35 + p.z);
      p.vx += (dx / d) * f2 * amp;
      p.vy += (dy / d) * f2 * amp;
    }
  });

  /* ------------------------------------------------------------
     主循环
     ------------------------------------------------------------ */
  let t = 0;
  let mix = 0;                 /* 0 = 采集（冷）/ 1 = 施压（暖） */
  let lastY = window.scrollY;
  let air = 0;                 /* 滚动带起的气流 */

  M.subscribe((dt) => {
    t += dt;

    /* 开场渐入：首屏那三句英文还没散，粒子先慢慢显影 */
    const g = Math.min(1, t / 2.6);
    const gate = g * g * (3 - 2 * g);

    /* 换季的交叉淡替。2.2/s 对应大约 1.4 秒过渡完，
       和 CSS 那条 1.8s 的换季色是同一个呼吸 */
    const target = document.body.dataset.state === 'hi' ? 1 : 0;
    mix = follow(mix, target, 2.2, dt);

    /* 滚动气流：往下滚，粒子被带得往上飘一点。这是"页在动"而不是
       "粒子在动"——所以幅度要小，且要跟着速度走，不能是常数 */
    const y = window.scrollY;
    air = follow(air, clamp(-(y - lastY) / Math.max(dt, 1e-3) * 0.045, -90, 90), 8, dt);
    lastY = y;

    ctx.clearRect(0, 0, W, H);
    /* 叠加发光：两颗粒子相遇时不是互相盖住，而是亮起来。
       暗场里这一句比任何模糊滤镜都管用 */
    ctx.globalCompositeOperation = 'lighter';

    const cold = 1 - mix;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const z = p.z;

      /* 基础漂移。两极的速度在这里混合，所以过渡期是"斜着飘"。
         余烬靠 vy 上升、孢子靠 vx 横漂 —— 各自主速度差一个轴，
         混合出来才不会互相抵消 */
      let tx = mix * 0 + cold * (6.5 + 15 * z);
      let ty = mix * -(13 + 27 * z) + cold * 0;

      /* 摆动：余烬左右摆，孢子上下浮 */
      const sway = Math.sin(t * 0.55 + p.seed) * (2 + 7 * z);
      tx += mix * sway * 0.75;
      ty += cold * sway * 0.45;

      /* 指针：推开 + 点亮 */
      let glow = 0;
      if (ptrOn) {
        const dx = p.x - ptrX, dy = p.y - ptrY;
        const d2 = dx * dx + dy * dy;
        const R = 200;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const f = 1 - d / R;
          const f2 = f * f;
          const push = 200 * (0.3 + z);
          tx += (dx / d) * f2 * push;
          ty += (dy / d) * f2 * push;
          glow = f2;
        }
      }

      ty += air * (0.35 + z);

      /* 跟手：k 只有 3.4/s，粒子才有惯性感 ——
         调大到几十的话它们会贴着目标速度走，看起来是"轨迹"不是"飘" */
      const k = 3.4 * p.sp;
      p.vx = follow(p.vx, tx, k, dt);
      p.vy = follow(p.vy, ty, k, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      recycle(p);

      /* 明灭。下限不能压到 0 —— 粒子暗到看不见再亮起来，那是"闪"，
         不是"呼吸"；留 0.4 的底，它才是同一颗在明暗之间浮动 */
      const pulse = 0.70 + 0.30 * Math.sin(t * (0.55 + z * 1.05) + p.seed);
      let a = p.a0 * pulse * gate;
      if (glow > 0) a *= 1 + glow * 1.25;
      if (a > 1) a = 1;
      if (a < 0.004) continue;

      /* 明灭时尺寸也跟着胀缩一下。只改不透明度的话，粒子是"在闪"；
         连尺寸一起呼吸，它才是"在烧"。而这一步不需要多花任何东西 */
      const s = p.r * p.k * (0.93 + 0.14 * pulse);
      const hx = p.x - s / 2, hy = p.y - s / 2;

      /* 双色交叉：接近某一端时就不画另一张，省掉一半的绘制 */
      if (mix > 0.015) {
        ctx.globalAlpha = a * mix;
        ctx.drawImage(WARM, hx, hy, s, s);
      }
      if (cold > 0.015) {
        ctx.globalAlpha = a * cold;
        ctx.drawImage(COOL, hx, hy, s, s);
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  });

  /* 对外的读数口。snapshot 是给验证用的：帧间比对坐标是最直接的
     "到底动没动"的证据 —— 光看代码看不出来，截图也看不出来 */
  window.SMN_PARTICLES = {
    count: () => parts.length,
    mix: () => mix,
    snapshot: () => parts.map((p) => [Math.round(p.x), Math.round(p.y)])
  };
})();
