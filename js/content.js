/* ============================================================
   Sleep-Move-Nutrition · 内容层
   两套视图（cards / ambient）共用这一份文案与配置。
   改内容只改这里，两个页面一起变 ——
   避免"同一句哲思硬编码在两处、改一处漏一处"的老问题。
   本文件不含任何版式、颜色、图标，那些属于各自的视图。
   ============================================================ */
(function () {
  'use strict';

  /* --- 生命哲思语录库（按日轮换，内容一字未动） --- */
  const DAILY_QUOTES = [
    '生命需要间歇性剧烈压力，而非绝对稳定。追求恒定只会变脆弱。',
    '史前人类从无"每周三次、定时定量"的机械锻炼日程。',
    '若无精神追求，马拉松便是一种现代发明的、匀速的枯燥消耗。',
    '"规律运动"是现代人的迷思，它误以为稳定输入必有线性回报。',
    '规律的中等强度锻炼，因缺乏极致刺激与修复，往往效率最低。',
    '最佳策略是"两极结合"：极高强度冲击配以极长时间悠闲。',
    '实践上，大量悠闲漫步为基础，穿插几次短暂但拼尽全力的锻炼。',
    '最高法则是信任身体的自适应力，提供多变信号，而非粗暴管理。',
    '超补偿原理：身体的进化逻辑是"破坏 - 重建 - 更强"。缺乏剧烈压力，就失去了"破坏"与"更强"的起点。',
    '自律神经的智慧：真正的平衡，是在交感神经的全力出击与副交感神经的彻底修复之间，实现有节奏的切换。',
    '进化塑造了我们的"应激 - 恢复"循环系统。持续温和的压力会耗尽它，而间歇的极限挑战能使其更强大。',
    '身体的"反脆弱"性，根植于用一次高质量的深度恢复，来响应一次有意义的强烈应激。两者缺一不可。'
  ];

  /* --- 杠铃的两极 ---
     hi     施压的一极：需要主动按下，一周 2 次只是"提醒刻度"，不是硬指标。
     gather 底座的一极：daily = true —— 它**每天自动成立**，
            不点就已经是今天的状态，因此不参与"目标达成"的叙事。
     一天仍然只存一个值，所以两极天然互斥：选中 hi 的当天，gather 自动让位。 */
  const DAY_KINDS = {
    hi: {
      v: 1,
      goal: 2,
      daily: false,
      name: '高强度锻炼日',
      done: '高强度锻炼 · 本周已达成',
      short: '高强度',
      advice: '今天已施加压力。剩下的时间交给恢复——漫步、早睡，让超补偿开始。'
    },
    gather: {
      v: 2,
      goal: 2,
      daily: true,
      name: '模拟采集日',
      done: '模拟采集 · 本周已达成',
      short: '采集',
      note: '每日默认',
      advice: '今天是模拟采集日。把它走够——1-2 小时低强度活动，模拟原始人的平静采集日。'
    }
  };

  const KIND_ORDER = ['hi', 'gather'];
  const WEEK_DAY_CN = ['一', '二', '三', '四', '五', '六', '日'];

  /* --- 三章内容（信息架构与文案均保持不变） ---
     entry.kind: 'advice' 今日建议（随状态变化）/ 'quote' 每日哲思 / 'prose' 固定文案
     entry.p: 段落数组，允许内嵌 <strong> 等行内标签 */
  const CHAPTERS = {
    exercise: {
      no: '01',
      cn: '运动',
      en: 'Apply the stress.',
      glyph: '🏃',
      entries: [
        { kind: 'advice', h: '今日建议' },
        { kind: 'quote', h: '生命哲思' },
        { kind: 'prose', h: '每日漫步', p: ['每天漫步 1-2 小时，模拟原始人类的平静采集日'] }
      ]
    },
    sleep: {
      no: '02',
      cn: '睡眠',
      en: 'Let what recovers recover.',
      glyph: '😴',
      entries: [
        { kind: 'prose', h: '顺其自然', p: ['不设闹钟，不排时间表。身体自然醒就起床，困了再睡。由内在节律而非外部钟表主导。'] },
        { kind: 'prose', h: '无忧而眠', p: ['质量重于时长。接纳白天小睡，核心是解除对睡眠时长的焦虑，专注恢复本身。'] },
        { kind: 'prose', h: '拥抱偶发剥夺', p: ['偶发失眠是系统抗干扰训练。只要白天不大量补睡，身体自我恢复后，未来睡眠反而更稳定。'] }
      ]
    },
    nutrition: {
      no: '03',
      cn: '营养',
      en: 'Remove the harm.',
      glyph: '🌱',
      entries: [
        {
          kind: 'prose',
          h: '饮食铁律',
          p: [
            '<strong>不吃超加工食品</strong> - 只吃天然、未加工的传统食物。',
            '<strong>只喝千年饮品</strong> - 水、咖啡、茶。',
            '<strong>避免重糖重盐</strong>'
          ]
        },
        { kind: 'prose', h: '植物常规，肉不规律', p: ['大部分日子以植物为主——传统蔬菜、坚果。偶尔大吃肉、内脏、骨髓，模仿祖先狩猎成功的日子。'] },
        { kind: 'prose', h: '听身体信号', p: ['不数卡路里，不固定餐次。饿了就吃，饱了就停。偶尔跳过一餐让自噬启动。'] }
      ]
    }
  };

  /* 章节按固定顺序输出，视图不必自己记顺序 */
  const CHAPTER_ORDER = ['exercise', 'sleep', 'nutrition'];

  /* 按年内第几天轮换 -->
     用 UTC 零点做基准，避免本地时区/夏令时把"今天"算到相邻一天 */
  function getDailyQuote(date) {
    const d = date || new Date();
    const dayOfYear = Math.floor(
      (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5
    );
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  }

  /* 把动态条目（今日建议 / 哲思）解析成最终段落数组，视图只管排版 */
  function resolveParagraphs(entry, ctx) {
    if (entry.kind === 'advice') return [ctx.advice];
    if (entry.kind === 'quote') return ['"' + ctx.quote + '"'];
    return entry.p || [];
  }

  /* 今日建议。
     ctx.todayKind 是"今天实际成立的那一极"：
       - 在声明了默认态的视图里（ambient），没按过高强度就是 gather，
         所以这里拿到的永远不是空 —— 只有 cards 视图才存在"未选"这个状态
     ctx.explicitKind 是"今天真的被按下的那一极"，用来区分
       "我今天主动确认了漫步" 和 "今天默认就是漫步" */
  function adviceFor(ctx) {
    if (!ctx.storageOK) {
      return '当前窗口不允许写入本地存储（常见于无痕模式），标记无法保存。换普通窗口打开即可正常记录。';
    }
    if (ctx.todayKind === 'hi') return DAY_KINDS.hi.advice;
    if (ctx.explicitKind === 'gather') return DAY_KINDS.gather.advice;
    if (ctx.hiDone) {
      return '本周高强度已达成。今天照常漫步——想再烧一次，随时按下去就行。';
    }
    if (ctx.autoGather) {
      return '今天默认是模拟采集日，不必做选择。想施加压力，就按下"高强度锻炼日"。';
    }
    return '今天还没做选择。身体允许就全力输出 5-15 分钟，不允许就慢慢走 1-2 小时。';
  }

  window.SMN_CONTENT = {
    DAILY_QUOTES,
    DAY_KINDS,
    KIND_ORDER,
    WEEK_DAY_CN,
    CHAPTERS,
    CHAPTER_ORDER,
    getDailyQuote,
    resolveParagraphs,
    adviceFor
  };
})();
