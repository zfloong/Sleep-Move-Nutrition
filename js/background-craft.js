/* ============================================================
   Sleep-Move-Nutrition · 人文工艺背景中枢 (Background Craft Engine)
   彻底抛弃廉价的“AI光晕跟随鼠标”套路，提供 4 种大师级背景哲学：
     1. charcoal: 📜 深墨银盐（纯净深墨纸本 + 物理微银盐胶片颗粒 + 暗房印记）
     2. contour:  🏔️ 生物等高线（大地地脉与生命筋膜律动暗纹，清晰优雅流动）
     3. grid:     📐 博物志坐标（达芬奇解剖手稿/瑞士制图精密经纬网与十字标尺）
     4. void:     ⬛ 极黑展厅（纯粹绝对黑室，极简留白）
   ============================================================ */
(function () {
  'use strict';

  const M = window.SMN_MOTION;
  if (!M) return;

  const STORAGE_KEY = 'smn_craft_bg_mode';
  // 经用户最终确认选定：达芬奇博物志手稿经纬与瑞士制图坐标体系 (Vitruvian Archival Grid)
  let mode = localStorage.getItem(STORAGE_KEY) || 'grid';

  const field = document.querySelector('.amb-field') || document.body;
  let canvas = field.querySelector('.amb-craft-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'amb-craft-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const veil = field.querySelector('.amb-veil');
    if (veil) {
      field.insertBefore(canvas, veil);
    } else {
      field.appendChild(canvas);
    }
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W = 0, H = 0;
  let t = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(0);
  }

  window.addEventListener('resize', resize, { passive: true });

  /* ============================================================
     方案 1：深墨银盐与暗房印记 (Charcoal & Gelatin Silver)
     ============================================================ */
  function renderCharcoal() {
    ctx.save();
    const pad = Math.max(24, Math.round(Math.min(W, H) * 0.04));
    const isHi = document.body.dataset.state === 'hi';
    const isGather = document.body.dataset.state === 'gather';
    const accentCol = isHi ? '240, 130, 60' : isGather ? '60, 205, 190' : '175, 192, 210';

    // 细边画幅相纸定位线
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = `rgba(${accentCol}, 0.14)`;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

    // 四角银盐相纸十字定位裁切标记 (Registration Crop Crosses)
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = `rgba(${accentCol}, 0.38)`;
    const clen = 9;
    const corners = [
      [pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]
    ];
    ctx.beginPath();
    for (const [cx, cy] of corners) {
      ctx.moveTo(cx - clen, cy); ctx.lineTo(cx + clen, cy);
      ctx.moveTo(cx, cy - clen); ctx.lineTo(cx, cy + clen);
    }
    ctx.stroke();

    // 底部人文暗房胶片排版印记
    if (W > 540) {
      ctx.font = '9px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillStyle = `rgba(${accentCol}, 0.30)`;
      ctx.fillText('EMULSION REF. #400-SILVER-GELATIN · ARCHIVAL PRINT', pad + 14, H - pad - 12);
      ctx.fillText('CIRCADIAN INK // 24H', W - pad - 156, H - pad - 12);
    }
    ctx.restore();
  }

  /* ============================================================
     方案 2：生物等高线与大地地脉 (Biological Contours)
     ============================================================ */
  function renderContours() {
    const isHi = document.body.dataset.state === 'hi';
    const isGather = document.body.dataset.state === 'gather';
    // 施压之火：火山岩浆暖琥珀金；采集之息：冰川湖泊与青岚极光；默认：远山墨青
    const baseRgb = isHi ? '250, 135, 55' : isGather ? '45, 212, 191' : '155, 190, 218';

    ctx.save();
    const lines = 16;
    for (let k = 0; k <= lines; k++) {
      const progress = k / lines;
      const yBase = H * (progress * 0.94 + 0.03);
      const isMajor = (k % 4 === 0);

      // 主等高线鲜明有质感（0.28-0.42），次等高线清晰可见（0.13-0.20）
      const alpha = isMajor
        ? (0.28 + 0.14 * Math.sin(progress * Math.PI))
        : (0.13 + 0.08 * Math.sin(progress * Math.PI));

      ctx.lineWidth = isMajor ? 1.25 : 0.8;
      ctx.strokeStyle = `rgba(${baseRgb}, ${alpha})`;

      ctx.beginPath();
      for (let x = 0; x <= W + 24; x += 18) {
        const nx = x * 0.0016;
        const ny = yBase * 0.0016;
        // 地貌地壳级舒缓波动，自主呼吸，绝不随鼠标晃动
        const elevation =
          Math.sin(nx * 1.8 + k * 0.40 + t * 0.045) * Math.cos(ny * 1.5 - t * 0.035) * 42 +
          Math.sin(nx * 3.4 + ny * 2.0 + k * 0.22) * 15 +
          Math.cos(nx * 5.0 - k * 0.45) * 7;

        const y = yBase + elevation;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 在主要等高线右侧标注微型高程与生物律动度数
      if (isMajor && W > 460) {
        ctx.font = '9px ui-monospace, Menlo, Consolas, monospace';
        ctx.fillStyle = `rgba(${baseRgb}, ${alpha * 1.25})`;
        const elevM = Math.round(160 + k * 72);
        ctx.fillText(`▲ ${elevM}m`, W - 78, yBase + 3);
      }
    }
    ctx.restore();
  }

  /* ============================================================
     方案 3：达芬奇解剖手稿与博物志经纬 (Vitruvian Archival Grid)
     ============================================================ */
  function renderArchivalGrid() {
    ctx.save();
    const isHi = document.body.dataset.state === 'hi';
    const isGather = document.body.dataset.state === 'gather';
    const gridCol = isHi ? '245, 140, 65' : isGather ? '45, 215, 195' : '160, 192, 222';

    const step = 48;
    const majorStep = step * 3; // 144px

    // 1. 次级极细经纬底网（清晰可见，不喧宾夺主）
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = `rgba(${gridCol}, 0.09)`;
    ctx.beginPath();
    for (let x = step; x < W; x += step) {
      if (x % majorStep !== 0) {
        ctx.moveTo(x, 0); ctx.lineTo(x, H);
      }
    }
    for (let y = step; y < H; y += step) {
      if (y % majorStep !== 0) {
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
    }
    ctx.stroke();

    // 2. 主经纬坐标网线（清晰规整）
    ctx.lineWidth = 0.95;
    ctx.strokeStyle = `rgba(${gridCol}, 0.20)`;
    ctx.beginPath();
    for (let x = majorStep; x < W; x += majorStep) {
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
    }
    for (let y = majorStep; y < H; y += majorStep) {
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    ctx.stroke();

    // 3. 主经纬交点高精十字准星 (Precision Crosshairs)
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = `rgba(${gridCol}, 0.55)`;
    const crossSize = 5;
    ctx.beginPath();
    for (let x = majorStep; x < W; x += majorStep) {
      for (let y = majorStep; y < H; y += majorStep) {
        ctx.moveTo(x - crossSize, y); ctx.lineTo(x + crossSize, y);
        ctx.moveTo(x, y - crossSize); ctx.lineTo(x, y + crossSize);
      }
    }
    ctx.stroke();

    // 4. 达芬奇黄金比例标尺环 (Vitruvian Reticle)
    const cx = W / 2, cy = H / 2;
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = `rgba(${gridCol}, 0.16)`;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(W, H) * 0.32, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(W, H) * 0.44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. 边缘精密经纬读数标注
    ctx.font = '9px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = `rgba(${gridCol}, 0.38)`;
    for (let y = majorStep; y < H - 20; y += majorStep) {
      ctx.fillText(`LAT.${String(Math.round(y)).padStart(4, '0')}`, 14, y + 3);
    }
    for (let x = majorStep; x < W - 60; x += majorStep) {
      ctx.fillText(`SEC.${String(Math.round(x)).padStart(4, '0')}`, x - 18, 22);
    }

    // 四角直角定位角标
    const pad = 24, bracketLen = 14;
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(${gridCol}, 0.48)`;
    ctx.beginPath();
    ctx.moveTo(pad, pad + bracketLen); ctx.lineTo(pad, pad); ctx.lineTo(pad + bracketLen, pad);
    ctx.moveTo(W - pad - bracketLen, pad); ctx.lineTo(W - pad, pad); ctx.lineTo(W - pad, pad + bracketLen);
    ctx.moveTo(pad, H - pad - bracketLen); ctx.lineTo(pad, H - pad); ctx.lineTo(pad + bracketLen, H - pad);
    ctx.moveTo(W - pad - bracketLen, H - pad); ctx.lineTo(W - pad, H - pad); ctx.lineTo(W - pad, H - pad - bracketLen);
    ctx.stroke();

    ctx.restore();
  }

  /* ============================================================
     方案 4：画廊极黑展厅 (Matte Void Gallery)
     保持绝对纯粹，全画布留白清空，配合 CSS 纯黑底色，
     让字与粒子在最宁静的暗夜中浮现
     ============================================================ */
  function renderVoid() {
    // 留空，极简留白
  }

  /* ============================================================
     单帧绘制与循环调度
     ============================================================ */
  function render(dt) {
    t += dt;
    ctx.clearRect(0, 0, W, H);

    if (mode === 'charcoal') {
      renderCharcoal();
    } else if (mode === 'contour') {
      renderContours();
    } else if (mode === 'grid') {
      renderArchivalGrid();
    } else if (mode === 'void') {
      renderVoid();
    }
  }

  // 挂载到主动效循环
  M.subscribe(render);

  /* ============================================================
     切换按钮交互栏 (Craft Mode Switcher UI)
     ============================================================ */
  const MODE_NAMES = {
    charcoal: '📜 深墨银盐 · 纸本暗房印记',
    contour:  '🏔️ 生物等高线 · 大地律动暗纹',
    grid:     '📐 博物志坐标 · 达芬奇手稿经纬',
    void:     '⬛ 极黑展厅 · 极简绝对深黑'
  };

  let toastTimer = null;
  function showToast(text) {
    let toast = document.querySelector('.craft-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'craft-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-show');
    }, 1800);
  }

  function applyMode(newMode, isUserAction = false) {
    mode = newMode;
    localStorage.setItem(STORAGE_KEY, newMode);
    document.body.dataset.bgMode = newMode;

    const grain = document.querySelector('.amb-grain');
    if (grain) {
      grain.style.display = (mode === 'void') ? 'none' : 'block';
    }

    const switcher = document.querySelector('.craft-mode-switcher');
    if (switcher) {
      switcher.querySelectorAll('.craft-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.mode === mode);
      });
    }

    // 立即执行一次重绘，毫秒级响应
    render(0);

    if (isUserAction) {
      showToast(`已切换背景：${MODE_NAMES[mode] || mode}`);
    }
  }

  // 最终定稿：移除临时测试按钮栏，以最纯粹的「博物志坐标」常驻运行
  applyMode('grid', false);
  resize();

  window.SMN_CRAFT_BG = {
    applyMode: applyMode,
    getMode: () => mode
  };
})();
