/* ============================================================
   /api/state —— 每周高强度记录的云端同步
   Cloudflare Pages Functions + KV

   身份 = 同步码（x-sync-key 请求头）。同一串码 = 同一份数据，
   不需要注册登录。KV 键：state:<码>

   数据格式：
     { weeks: { "2026-W41": { "2": {v:2, t:1759...} } } }
     v=1 高强度锻炼日 / v=2 模拟采集日 / v=0 取消（墓碑）
       —— 一天只存一个值，两种日子天然互斥
     t=写入时刻(ms)，多端合并时按天取 t 最大者

   GET  → 读回云端数据（无码时返回 configured:false，供前端探测能力）
   PUT  → 与云端并集合并后写回，返回合并结果（避免两端互相覆盖）
   ============================================================ */

const KEY_RE = /^[0-9A-Z-]{8,80}$/;
const KEEP_WEEKS = 26;
const MAX_BYTES = 64 * 1024;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });

/* 单日取值白名单：1=高强度 / 2=模拟采集 / 0=取消。
   其余一律归 0 —— 客户端不可信，脏值不落库也不参与计数 */
const normV = (v) => (v === 1 ? 1 : v === 2 ? 2 : 0);

const WEEK_RE = /^\d{4}-W\d{2}$/;
const isDayIdx = (d) => /^[0-6]$/.test(d);

/* 按天取 t 最大者；周 key 形如 YYYY-Www，字典序即时间序 */
function mergeWeeks(a, b) {
  const out = {};
  for (const src of [a, b]) {
    if (!src || typeof src !== 'object') continue;
    for (const wk of Object.keys(src)) {
      if (!WEEK_RE.test(wk)) continue;          // 只认本站写出的周 key
      const days = src[wk];
      if (!days || typeof days !== 'object') continue;
      const target = out[wk] || (out[wk] = {});
      for (const d of Object.keys(days)) {
        if (!isDayIdx(d)) continue;             // 只认周一 ~ 周日
        const rec = days[d];
        if (!rec || typeof rec !== 'object') continue;
        const t = Number(rec.t) || 0;
        const prev = target[d];
        if (!prev || t >= (Number(prev.t) || 0)) {
          target[d] = { v: normV(rec.v), t };
        }
      }
    }
  }
  return out;
}

function prune(weeks, keep = KEEP_WEEKS) {
  const out = {};
  Object.keys(weeks).sort().reverse().slice(0, keep).forEach((k) => {
    out[k] = weeks[k];
  });
  return out;
}

export async function onRequest({ request, env }) {
  if (!env.SMN_KV) {
    return json({ ok: false, error: 'KV 未绑定（缺少名为 SMN_KV 的 KV namespace）' }, 500);
  }

  const key = (request.headers.get('x-sync-key') || '').trim().toUpperCase();
  const valid = KEY_RE.test(key);

  if (request.method === 'GET') {
    if (!valid) return json({ ok: true, configured: false, weeks: {} });
    const saved = await env.SMN_KV.get('state:' + key, 'json');
    return json({
      ok: true,
      configured: true,
      weeks: (saved && saved.weeks) || {},
      updatedAt: (saved && saved.updatedAt) || 0
    });
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    if (!valid) return json({ ok: false, error: '缺少或非法的同步码' }, 400);

    const text = await request.text();
    if (text.length > MAX_BYTES) return json({ ok: false, error: '数据过大' }, 413);

    let body;
    try { body = JSON.parse(text); }
    catch { return json({ ok: false, error: 'JSON 解析失败' }, 400); }

    const saved = await env.SMN_KV.get('state:' + key, 'json');
    const merged = prune(mergeWeeks((saved && saved.weeks) || {}, body && body.weeks));

    await env.SMN_KV.put('state:' + key, JSON.stringify({ weeks: merged, updatedAt: Date.now() }));

    return json({ ok: true, weeks: merged });
  }

  return json({ ok: false, error: '不支持的请求方法' }, 405);
}
