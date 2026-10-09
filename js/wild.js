/* =========================================
   Wildness Instinct - 今日指南系统
   Version: 10.0 - 开场白 + 施压选择系统
   Philosophy: 反脆弱 + 杠铃策略 + 听身体
   ========================================= */

/* ============================================================
   1. 内容配置
   ============================================================ */

// 生命哲思语录库（每日轮换）
const DAILY_QUOTES = [
  '生命需要间歇性剧烈压力，而非绝对稳定。追求恒定只会变脆弱。',
  '史前人类从无"每周三次、定时定量"的机械锻炼日程。',
  '若无精神追求，马拉松便是一种现代发明的、匀速的枯燥消耗。',
  '"规律运动"是现代迷信，它误以为稳定输入必有线性回报。',
  '规律的中等强度锻炼，因缺乏极致刺激与修复，往往效率最低。',
  '最佳策略是"两极结合"：极高强度冲击配以极长时间悠闲。',
  '实践上，大量悠闲漫步为基础，穿插几次短暂但拼尽全力的锻炼。',
  '最高法则是信任身体的自适应力，提供多变信号，而非粗暴管理。',
  '超补偿原理：身体的进化逻辑是"破坏 - 重建 - 更强"。缺乏剧烈压力，就失去了"破坏"与"更强"的起点。',
  '自律神经的智慧：真正的平衡，是在交感神经的全力出击与副交感神经的彻底修复之间，实现有节奏的切换。',
  '进化塑造了我们的"应激 - 恢复"循环系统。持续温和的压力会耗尽它，而间歇的极限挑战能使其更强大。',
  '身体的"反脆弱"性，根植于用一次高质量的深度恢复，来响应一次有意义的强烈应激。两者缺一不可。'
];

// 每周高强度目标
const HI_WEEKLY_GOAL = 2;

function getDailyQuote(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

// 根据日期获取饮食类型（10 天一个周期）
function getDietType(date) {
  const cycle = date.getDate() % 10;
  if (cycle < 4) return 'fasting';
  if (cycle < 6) return 'feast';
  if (cycle < 9) return 'plant_based';
  return 'random';
}

/* ============================================================
   2. 周状态系统（localStorage，周一自动切换新周期）
   格式: smn_hi_2026-W41 = {"0":"walk","3":"hi"}  (0=周一 ... 6=周日)
   ============================================================ */

const LS_PREFIX = 'smn_hi_';

function getWeekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const thu = new Date(t);
  thu.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3);
  const first = new Date(Date.UTC(thu.getUTCFullYear(), 0, 4));
  first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7) + 3);
  const wk = 1 + Math.round((thu - first) / (7 * 864e5));
  return `${thu.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}

function getWeekState() {
  try { return JSON.parse(localStorage.getItem(LS_PREFIX + getWeekKey())) || {}; }
  catch { return {}; }
}

function saveWeekState(state) {
  localStorage.setItem(LS_PREFIX + getWeekKey(), JSON.stringify(state));
}

const countHI = (state) => Object.values(state).filter(v => v === 'hi').length;

/* ============================================================
   3. 开场白编排
   三句哲思逐句浮现 → 淡出进入主页
   ============================================================ */

function initIntro() {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) { document.body.classList.add('ready'); return; }

  const finish = () => {
    if (overlay.classList.contains('hide')) return;
    overlay.classList.add('hide');
    document.body.classList.add('ready');
    setTimeout(() => overlay.remove(), 600);
  };

  // 三句哲思的时序由 CSS 接管（0.8 / 1.9 / 3.0s），这里只负责收场
  // Apple 语法：场景先在，文字后浮，4.5s 淡出进主页
  setTimeout(finish, 4500);
}

/* ============================================================
   4. UI 渲染
   ============================================================ */

let justAchieved = false; // 本次操作是否刚刚达成目标（用于徽章弹出动画）

function renderExerciseGuide() {
  const container = document.getElementById('exercise');
  if (!container) return;

  const state = getWeekState();
  const hiCount = countHI(state);
  const todayChoice = state[(new Date().getDay() + 6) % 7]; // 0=周一
  const achieved = hiCount >= HI_WEEKLY_GOAL;

  // 徽章：本周高强度 ≥ 2 次
  const badge = achieved
    ? `<span class="goal-badge${justAchieved ? ' pop' : ''}"><i class="ri-check-line"></i>本周目标已达成</span>`
    : '';

  // 今日建议文案（随状态变化）
  const adviceText =
    todayChoice === 'hi'   ? '今天已施加压力。剩下的时间交给恢复——漫步、早睡，让超补偿开始。' :
    todayChoice === 'walk' ? '今天是恢复日。漫步 1-2 小时，平静而悠长，让身体修复。' :
    achieved               ? '本周烈火已足。今天随心：想烧就烧，想走就走。' :
                             '身体允许，就全力输出 5-15 分钟；不允许，就漫步 1-2 小时。你说了算。';

  container.innerHTML = `
    <div class="card-head">
      <h3>🏃 运动 ${badge}</h3>
      <div class="section-en">Apply the stress.</div>
    </div>
    <div class="core-advice">

      <div class="advice-item">
        <i class="ri-compass-3-line"></i>
        <div class="advice-text">
          <h4>今日 · 身体信号</h4>
          <p>${adviceText}</p>
          <div class="today-choice">
            <button class="choice-btn walk${todayChoice === 'walk' ? ' active-walk' : ''}" data-kind="walk">
              <i class="ri-footprint-line"></i>漫步日
            </button>
            <button class="choice-btn hi${todayChoice === 'hi' ? ' active-hi' : ''}" data-kind="hi">
              <i class="ri-fire-line"></i>高强度日
            </button>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-book-open-line"></i>
        <div class="advice-text">
          <h4>生命哲思</h4>
          <p class="quote-text">"${getDailyQuote(new Date())}"</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-footprint-line"></i>
        <div class="advice-text">
          <h4>每日漫步</h4>
          <p>每天漫步 1-2 小时，模拟原始人类的平静采集日</p>
        </div>
      </div>

    </div>
  `;
}

function renderNutritionGuide() {
  const today = new Date();
  const container = document.getElementById('nutrition');
  if (!container) return;
  const dietType = getDietType(today);

  container.innerHTML = `
    <div class="card-head">
      <h3>🌱 营养</h3>
      <div class="section-en">Remove the harm.</div>
    </div>
    <div class="core-advice">

      <div class="advice-item">
        <i class="ri-restaurant-line"></i>
        <div class="advice-text">
          <h4>饮食铁律</h4>
          <p><strong>不吃超加工食品</strong> - 只吃天然、未加工的传统食物。</p>
          <p><strong>只喝千年饮品</strong> - 水、咖啡、茶。</p>
          <p><strong>去除毒素</strong> - 多糖、重盐、种子油。</p>
        </div>
      </div>

      <div class="divider"></div>

      ${dietType === 'fasting' ? `
      <div class="advice-item">
        <i class="ri-time-line"></i>
        <div class="advice-text">
          <h4>禁食日</h4>
          <p>今天跳过早餐或只吃一顿。激活自噬，让身体清理垃圾。</p>
        </div>
      </div>
      ` : dietType === 'feast' ? `
      <div class="advice-item">
        <i class="ri-goblet-line"></i>
        <div class="advice-text">
          <h4>盛宴日</h4>
          <p>今天可以大吃肉/内脏/骨髓！模仿祖先狩猎成功的日子。</p>
        </div>
      </div>
      ` : dietType === 'plant_based' ? `
      <div class="advice-item">
        <i class="ri-leaf-line"></i>
        <div class="advice-text">
          <h4>植物为主日</h4>
          <p>今天以传统蔬菜、坚果、橄榄油为主。</p>
        </div>
      </div>
      ` : `
      <div class="advice-item">
        <i class="ri-dice-3-line"></i>
        <div class="advice-text">
          <h4>随机营养日</h4>
          <p>今天随机选择：想吃肉就吃肉，想吃素就吃素。听从身体。</p>
        </div>
      </div>
      `}

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-brain-line"></i>
        <div class="advice-text">
          <h4>核心原则</h4>
          <p><strong>植物常规，肉不规律</strong> - 大部分日子以植物为主，偶尔大吃肉/内脏/骨髓。</p>
          <p><strong>无固定计划</strong> - 不数卡路里，不固定餐次。听身体信号，饿了就吃，饱了就停。</p>
        </div>
      </div>

    </div>
  `;
}

function renderSleepGuide() {
  const container = document.getElementById('sleep');
  if (!container) return;

  container.innerHTML = `
    <div class="card-head">
      <h3>😴 睡眠</h3>
      <div class="section-en">Let what recovers recover.</div>
    </div>
    <div class="core-advice">

      <div class="advice-item">
        <i class="ri-time-line"></i>
        <div class="advice-text">
          <h4>顺其自然</h4>
          <p>不设闹钟，不排时间表。身体自然醒就起床，困了再睡。由内在节律而非外部钟表主导。</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-heart-line"></i>
        <div class="advice-text">
          <h4>无忧而眠</h4>
          <p>质量重于时长。接纳白天小睡，核心是解除对睡眠时长的焦虑，专注恢复本身。</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="advice-item">
        <i class="ri-refresh-line"></i>
        <div class="advice-text">
          <h4>接受偶发剥夺</h4>
          <p>偶发失眠是系统抗干扰训练。只要白天不大量补睡，身体自我恢复后，未来睡眠反而更稳定。</p>
        </div>
      </div>

    </div>
  `;
}

/* ============================================================
   6. 交互：选择今天的状态（可改选、可取消）
   ============================================================ */

function bindExerciseChoice() {
  const container = document.getElementById('exercise');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice-btn');
    if (!btn) return;

    const kind = btn.dataset.kind; // 'walk' | 'hi'
    const state = getWeekState();
    const todayIdx = (new Date().getDay() + 6) % 7;
    const prev = countHI(state);

    // 再点一次已选项 = 取消；点另一项 = 改选
    state[todayIdx] = state[todayIdx] === kind ? undefined : kind;
    if (state[todayIdx] === undefined) delete state[todayIdx];
    saveWeekState(state);

    const now = countHI(state);
    justAchieved = prev < HI_WEEKLY_GOAL && now >= HI_WEEKLY_GOAL;
    renderExerciseGuide();
    justAchieved = false;
  });
}

/* ============================================================
   7. 初始化
   ============================================================ */

function initWildPage() {
  initIntro();
  renderExerciseGuide();
  renderNutritionGuide();
  renderSleepGuide();
  bindExerciseChoice();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWildPage);
} else {
  initWildPage();
}
