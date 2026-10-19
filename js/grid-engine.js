/* ============================================================
   Sleep-Move-Nutrition · 点线弹性网格层 (Grid Background Engine)
   逆向自 deepseek.com/harness 的 Hero 背景层 (dsh-plugin-backdrop)
   90px 点阵 + 鼠标 140px 推开（弹簧回位 + 阻尼）+ 邻点微连线
   ============================================================ */
(function (global) {
  'use strict';

  const DEFAULTS = {
    lineColor: 'rgba(255, 255, 255,',
    lineOpacity: 0.05,
    dotColor: 'rgba(255, 255, 255,',
    dotOpacity: 0.12,
    spacing: 85,
    mouseRadius: 140,
    fps: 30
  };

  function createGridBackground(canvas, userParams) {
    if (!canvas) return { dispose() {} };
    const params = Object.assign({}, DEFAULTS, userParams);
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dispose() {} };

    // 触摸屏设备无需此重度计算
    if (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) {
      return { dispose() {} };
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cols = 0, rows = 0, W = 0, H = 0;
    let points = [];
    const mouse = { x: NaN, y: NaN };
    let sleeping = false;
    let rafId = 0, lastFrame = 0, running = true;

    function layout() {
      W = canvas.clientWidth || window.innerWidth;
      H = canvas.clientHeight || window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(W / params.spacing) + 1;
      rows = Math.ceil(H / params.spacing) + 1;
      const ox = (W - (cols - 1) * params.spacing) / 2;
      const oy = (H - (rows - 1) * params.spacing) / 2;

      points = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = ox + params.spacing * c;
          const y = oy + params.spacing * r;
          points.push({ restX: x, restY: y, x, y, vx: 0, vy: 0 });
        }
      }
      sleeping = false;
      if (!rafId) rafId = requestAnimationFrame(frame);
    }

    let resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    }
    window.addEventListener('resize', onResize, { passive: true });

    function onMouse(e) {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      if (sleeping) {
        sleeping = false;
        rafId = requestAnimationFrame(frame);
      }
    }
    window.addEventListener('mousemove', onMouse, { passive: true });

    function frame(t) {
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      if (!lastFrame) lastFrame = t;
      if (t - lastFrame < 1000 / params.fps) return;
      lastFrame = t;

      ctx.clearRect(0, 0, W, H);
      const mx = mouse.x, my = mouse.y;
      let maxSpeed = 0;

      // 更新：鼠标推开 + 弹簧回位 + 阻尼
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (!isNaN(mx) && !isNaN(my)) {
          const dx = p.x - mx, dy = p.y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < params.mouseRadius && d > 0.1) {
            const f = (1 - d / params.mouseRadius) * 28;
            const nx = dx / d, ny = dy / d;
            p.vx += nx * f * 0.1;
            p.vy += ny * f * 0.1;
          }
        }
        p.vx += 0.05 * (p.restX - p.x);
        p.vy += 0.05 * (p.restY - p.y);
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
        const sp = Math.abs(p.vx) + Math.abs(p.vy);
        if (sp > maxSpeed) maxSpeed = sp;
      }

      // 连线（同行/同列，两端各微缩 10px）
      ctx.strokeStyle = params.lineColor + params.lineOpacity + ')';
      ctx.lineWidth = 0.5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const a = points[r * cols + c], b = points[r * cols + c + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 20) continue;
          const nx = dx / d, ny = dy / d;
          ctx.beginPath();
          ctx.moveTo(a.x + 10 * nx, a.y + 10 * ny);
          ctx.lineTo(b.x - 10 * nx, b.y - 10 * ny);
          ctx.stroke();
        }
      }

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
          const a = points[r * cols + c], b = points[(r + 1) * cols + c];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 20) continue;
          const nx = dx / d, ny = dy / d;
          ctx.beginPath();
          ctx.moveTo(a.x + 10 * nx, a.y + 10 * ny);
          ctx.lineTo(b.x - 10 * nx, b.y - 10 * ny);
          ctx.stroke();
        }
      }

      // 画点（鼠标附近柔和放大）
      ctx.fillStyle = params.dotColor + params.dotOpacity + ')';
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        let r = 1.6, op = params.dotOpacity;
        if (!isNaN(mx) && !isNaN(my)) {
          const d = Math.sqrt((p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my));
          const f = Math.max(0, 1 - d / params.mouseRadius);
          r = 1.6 + 1.8 * f;
          op = params.dotOpacity + 0.35 * f;
        }
        ctx.globalAlpha = op;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      // 静止自停节能
      if (maxSpeed < 0.01) sleeping = true;
    }

    layout();

    return {
      dispose() {
        running = false;
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('mousemove', onMouse);
      }
    };
  }

  global.createGridBackground = createGridBackground;
})(window);
