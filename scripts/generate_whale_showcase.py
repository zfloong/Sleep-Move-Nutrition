import os
import subprocess
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(BASE_DIR, "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. 方案 A: 极光巡游鲸 (Deep Cruising - 经典深海灵动巡游)
# -------------------------------------------------------------
SVG_A = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gradA" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0d9488"/>
      <stop offset="35%" stop-color="#14b8a6"/>
      <stop offset="70%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#7dd3fc"/>
    </linearGradient>
    <linearGradient id="eyeGradA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff7e2a"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <filter id="glowA" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- 背景暗调容器 (可选) -->
  <rect width="512" height="512" rx="112" fill="#060b13" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <!-- 巡游巨鲸主体 -->
  <g transform="translate(256, 260) scale(18.5) translate(-11.8, -8.6)" filter="url(#glowA)">
    <path d="M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746V14.4736Z" fill="url(#gradA)"/>
  </g>

  <!-- 生命金瞳与气泡群 -->
  <circle cx="376" cy="142" r="15" fill="url(#eyeGradA)"/>
  <circle cx="410" cy="115" r="9" fill="#7dd3fc" opacity="0.85"/>
  <circle cx="436" cy="94" r="6" fill="#7dd3fc" opacity="0.6"/>
</svg>'''

# -------------------------------------------------------------
# 2. 方案 B: 破浪跃海鲸 (Breaching Dawn - 向上跃出海面，突破稳态)
# -------------------------------------------------------------
SVG_B = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gradB" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="40%" stop-color="#14b8a6"/>
      <stop offset="75%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="spoutGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.8"/>
      <stop offset="60%" stop-color="#ff7e2a" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#fef08a" stop-opacity="1"/>
    </linearGradient>
    <filter id="glowB" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="#060b13" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <!-- 跃浪喷泉水柱与光芒粒子 -->
  <g filter="url(#glowB)">
    <path d="M 330 190 Q 355 125 365 75 Q 360 115 340 185 Z" fill="url(#spoutGrad)"/>
    <circle cx="370" cy="72" r="10" fill="#fef08a"/>
    <circle cx="395" cy="85" r="7" fill="#fed7aa"/>
    <circle cx="350" cy="65" r="6" fill="#2dd4bf"/>
    <circle cx="415" cy="110" r="5" fill="#2dd4bf" opacity="0.8"/>
  </g>

  <!-- 向上大角度腾跃的雄浑巨鲸 -->
  <g transform="translate(256, 280) rotate(-32) scale(18) translate(-11.8, -8.6)" filter="url(#glowB)">
    <path d="M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746V14.4736Z" fill="url(#gradB)"/>
  </g>

  <!-- 底部海浪水花微弧线 -->
  <path d="M 80 435 C 160 410, 240 450, 320 425 C 380 405, 420 420, 440 430" fill="none" stroke="rgba(45,212,191,0.3)" stroke-width="3" stroke-linecap="round"/>
</svg>'''

# -------------------------------------------------------------
# 3. 方案 C: 极简双极太极鲸 (Minimal Barbell Whale - 两极哲学，极致几何)
# -------------------------------------------------------------
SVG_C = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gradC1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#2dd4bf"/>
    </linearGradient>
    <linearGradient id="gradC2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff7e2a"/>
      <stop offset="100%" stop-color="#fbb424"/>
    </linearGradient>
    <filter id="glowC" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="#060b13" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <!-- 双极杠铃架构：上半身极光青（采集蓄力），下腹鳍熔岩金（施压突破） -->
  <g filter="url(#glowC)" transform="translate(45, 45) scale(0.82)">
    <!-- 巨鲸主背脊与头部弧度 (极光青) -->
    <path d="M 80 280 C 80 160, 200 100, 320 100 C 430 100, 460 170, 430 220 C 400 270, 350 250, 290 230 C 210 200, 160 250, 120 300 C 95 330, 80 310, 80 280 Z" fill="url(#gradC1)"/>

    <!-- 巨鲸腹部跃动脉冲与尾鳍 (晨曦金) -->
    <path d="M 110 320 C 140 290, 210 240, 290 270 C 350 290, 390 270, 420 310 C 440 335, 425 365, 380 375 C 290 395, 180 410, 100 350 C 85 340, 95 330, 110 320 Z" fill="url(#gradC2)"/>

    <!-- 标志性鱼尾分叉 -->
    <path d="M 82 285 C 50 250, 25 240, 15 270 C 35 295, 60 305, 85 305 C 55 325, 25 345, 20 375 C 40 385, 70 350, 95 325 Z" fill="url(#gradC1)"/>

    <!-- 核心光瞳 (太极之眼) -->
    <circle cx="360" cy="155" r="14" fill="#ffffff" opacity="0.95"/>
    <circle cx="360" cy="155" r="22" fill="none" stroke="#2dd4bf" stroke-width="3" opacity="0.6"/>
  </g>
</svg>'''

# -------------------------------------------------------------
# 4. 方案 D: 灵境星轨幼鲸 (Celestial Bubble Whale - 清新灵萌，治愈透亮)
# -------------------------------------------------------------
SVG_D = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="50%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="starGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff7e2a"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="112" fill="#060b13" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <!-- 清新圆润的现代极简萌感巨鲸 -->
  <g transform="translate(60, 90)">
    <!-- 身体主轮廓 -->
    <path d="M 50 210 C 50 110, 130 50, 240 50 C 330 50, 370 120, 350 200 C 330 270, 260 280, 190 280 C 130 280, 90 290, 50 270 C 35 260, 50 230, 50 210 Z" fill="url(#gradD)"/>

    <!-- 优雅翘起的鱼尾 -->
    <path d="M 50 240 C 20 200, -5 210, -10 240 C 5 265, 30 260, 45 255 C 30 285, 10 315, 0 330 C 20 335, 50 300, 60 270 Z" fill="url(#gradD)"/>

    <!-- 侧胸鳍 -->
    <path d="M 180 230 C 210 280, 250 290, 260 280 C 265 270, 250 240, 220 220 Z" fill="#ffffff" opacity="0.35"/>

    <!-- 纯洁大眼睛 -->
    <circle cx="300" cy="140" r="14" fill="#ffffff"/>
    <circle cx="304" cy="138" r="7" fill="#0f172a"/>
    <circle cx="306" cy="136" r="3" fill="#ffffff"/>

    <!-- 喷气孔浮现的四角星芒 -->
    <path d="M 235 15 Q 240 32 255 35 Q 240 38 235 55 Q 230 38 215 35 Q 230 32 235 15 Z" fill="url(#starGradD)"/>
    <circle cx="270" cy="18" r="5" fill="#fef08a"/>
  </g>
</svg>'''

# 写入 4 个独立 SVG 文件
with open(os.path.join(ICONS_DIR, "whale_opt_a.svg"), "w", encoding="utf-8") as f:
    f.write(SVG_A)
with open(os.path.join(ICONS_DIR, "whale_opt_b.svg"), "w", encoding="utf-8") as f:
    f.write(SVG_B)
with open(os.path.join(ICONS_DIR, "whale_opt_c.svg"), "w", encoding="utf-8") as f:
    f.write(SVG_C)
with open(os.path.join(ICONS_DIR, "whale_opt_d.svg"), "w", encoding="utf-8") as f:
    f.write(SVG_D)

# -------------------------------------------------------------
# 5. 生成高水准对比展示 HTML 页面
# -------------------------------------------------------------
SHOWCASE_HTML = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>狂野生长 · 鲸鱼图标 4 大设计候选方案</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: #04070d;
    color: #edf2f7;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', sans-serif;
    padding: 36px 40px;
    width: 1440px;
    margin: 0 auto;
  }}
  .header {{
    text-align: center;
    margin-bottom: 36px;
  }}
  .header h1 {{
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 8px;
    background: linear-gradient(90deg, #2dd4bf, #ff7e2a);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}
  .header p {{
    color: #94a3b8;
    font-size: 14px;
  }}
  .cards-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  }}
  .card {{
    background: rgba(13, 19, 29, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.3s ease;
    backdrop-filter: blur(16px);
  }}
  .card:hover {{
    border-color: rgba(45, 212, 191, 0.4);
    transform: translateY(-4px);
    box-shadow: 0 16px 36px rgba(0,0,0,0.5);
  }}
  .badge {{
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 9999px;
    margin-bottom: 14px;
    font-family: monospace;
    letter-spacing: 0.5px;
  }}
  .badge-a {{ background: rgba(45, 212, 191, 0.15); color: #2dd4bf; border: 1px solid rgba(45, 212, 191, 0.3); }}
  .badge-b {{ background: rgba(255, 126, 42, 0.15); color: #ff7e2a; border: 1px solid rgba(255, 126, 42, 0.3); }}
  .badge-c {{ background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }}
  .badge-d {{ background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }}
  
  .icon-preview-box {{
    width: 140px;
    height: 140px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .icon-preview-box svg {{
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4));
  }}
  .title {{
    font-size: 17px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 6px;
    text-align: center;
  }}
  .sub {{
    font-size: 12.5px;
    color: #94a3b8;
    text-align: center;
    line-height: 1.5;
    margin-bottom: 16px;
    min-height: 56px;
  }}
  .scale-strip {{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 8px 14px;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    width: 100%;
  }}
  .scale-item {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: #64748b;
    font-family: monospace;
  }}
  .scale-item svg {{
    border-radius: 4px;
  }}

  /* 浏览器标签栏模拟 */
  .browser-mockup {{
    background: rgba(13, 19, 29, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 18px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }}
  .mock-title {{
    font-size: 13px;
    font-family: monospace;
    color: #64748b;
    letter-spacing: 1px;
    text-transform: uppercase;
  }}
  .tabs-row {{
    display: flex;
    gap: 16px;
    align-items: center;
  }}
  .tab-item {{
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    font-size: 13px;
    color: #cbd5e1;
  }}
  .tab-item.active {{
    background: rgba(45, 212, 191, 0.08);
    border-color: rgba(45, 212, 191, 0.25);
    color: #2dd4bf;
  }}
  .tab-item svg {{
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }}
</style>
</head>
<body>

  <div class="header">
    <h1>狂野生长 · 品牌巨鲸图标 4 款设计候选</h1>
    <p>深度契合深海 3D 粒子引擎与「去除危害 · 施加压力 · 让该修复的修复」生命哲学</p>
  </div>

  <div class="cards-grid">
    <!-- 方案 A -->
    <div class="card">
      <span class="badge badge-a">OPTION A · 推荐</span>
      <div class="icon-preview-box">{SVG_A}</div>
      <h2 class="title">极光巡游鲸 (Deep Cruising)</h2>
      <p class="sub">最贴近 DeepSeek 经典流线，融合薄荷冰青流体渐变与晨曦流金之眼，深邃、稳重、生机流动。</p>
      <div class="scale-strip">
        <div class="scale-item">
          <div style="width: 32px; height: 32px;">{SVG_A}</div>
          <span>32px</span>
        </div>
        <div class="scale-item">
          <div style="width: 24px; height: 24px;">{SVG_A}</div>
          <span>24px</span>
        </div>
        <div class="scale-item">
          <div style="width: 16px; height: 16px;">{SVG_A}</div>
          <span>16px</span>
        </div>
      </div>
    </div>

    <!-- 方案 B -->
    <div class="card">
      <span class="badge badge-b">OPTION B · 突破</span>
      <div class="icon-preview-box">{SVG_B}</div>
      <h2 class="title">破浪跃海鲸 (Breaching Dawn)</h2>
      <p class="sub">昂首破浪跃出水面，背部扬起流金水雾粒子，象征「突破稳态、施加极限压力」，动态气魄极强。</p>
      <div class="scale-strip">
        <div class="scale-item">
          <div style="width: 32px; height: 32px;">{SVG_B}</div>
          <span>32px</span>
        </div>
        <div class="scale-item">
          <div style="width: 24px; height: 24px;">{SVG_B}</div>
          <span>24px</span>
        </div>
        <div class="scale-item">
          <div style="width: 16px; height: 16px;">{SVG_B}</div>
          <span>16px</span>
        </div>
      </div>
    </div>

    <!-- 方案 C -->
    <div class="card">
      <span class="badge badge-c">OPTION C · 哲学</span>
      <div class="icon-preview-box">{SVG_C}</div>
      <h2 class="title">两极太极鲸 (Dual Barbell)</h2>
      <p class="sub">双弧极简几何咬合：极光青（采集漫游）与熔岩金（施压爆发）如太极互生，极微尺寸下超级锐利。</p>
      <div class="scale-strip">
        <div class="scale-item">
          <div style="width: 32px; height: 32px;">{SVG_C}</div>
          <span>32px</span>
        </div>
        <div class="scale-item">
          <div style="width: 24px; height: 24px;">{SVG_C}</div>
          <span>24px</span>
        </div>
        <div class="scale-item">
          <div style="width: 16px; height: 16px;">{SVG_C}</div>
          <span>16px</span>
        </div>
      </div>
    </div>

    <!-- 方案 D -->
    <div class="card">
      <span class="badge badge-d">OPTION D · 清新</span>
      <div class="icon-preview-box">{SVG_D}</div>
      <h2 class="title">灵境星芒鲸 (Celestial Bubble)</h2>
      <p class="sub">北欧极简圆润体态，喷气孔升起四角流金星芒，治愈、清澈、现代，给人带来极度舒适的呼吸感。</p>
      <div class="scale-strip">
        <div class="scale-item">
          <div style="width: 32px; height: 32px;">{SVG_D}</div>
          <span>32px</span>
        </div>
        <div class="scale-item">
          <div style="width: 24px; height: 24px;">{SVG_D}</div>
          <span>24px</span>
        </div>
        <div class="scale-item">
          <div style="width: 16px; height: 16px;">{SVG_D}</div>
          <span>16px</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 浏览器标签栏预览实感 -->
  <div class="browser-mockup">
    <div class="mock-title">实机标签栏 (Browser Tab) 16px 视效模拟</div>
    <div class="tabs-row">
      <div class="tab-item active">
        {SVG_A}
        <span>狂野生长 · 方案 A (极光巡游)</span>
      </div>
      <div class="tab-item">
        {SVG_B}
        <span>狂野生长 · 方案 B (破浪跃海)</span>
      </div>
      <div class="tab-item">
        {SVG_C}
        <span>狂野生长 · 方案 C (两极太极)</span>
      </div>
      <div class="tab-item">
        {SVG_D}
        <span>狂野生长 · 方案 D (灵境星芒)</span>
      </div>
    </div>
  </div>

</body>
</html>
'''

showcase_path = os.path.join(BASE_DIR, "whale_icon_showcase.html")
with open(showcase_path, "w", encoding="utf-8") as f:
    f.write(SHOWCASE_HTML)

print("Saved SVG files and showcase HTML!")
