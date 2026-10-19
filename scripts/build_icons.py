import os
import struct
import subprocess

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1. 纯净矢量版 SVG 内容 (用于现代浏览器与高分屏)
FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <!-- 极光冰青冷极渐变（采集·睡眠·蓄能） -->
    <linearGradient id="coolGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="35%" stop-color="#14B8A6"/>
      <stop offset="75%" stop-color="#2DD4BF"/>
      <stop offset="100%" stop-color="#A5F3FC"/>
    </linearGradient>

    <!-- 晨曦流金暖极渐变（施压·运动·唤醒） -->
    <linearGradient id="warmGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C2410C"/>
      <stop offset="35%" stop-color="#EA580C"/>
      <stop offset="70%" stop-color="#FF7E2A"/>
      <stop offset="92%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#FFFBEB"/>
    </linearGradient>
  </defs>

  <!-- 冰川冷月/潮汐之托：环抱左下与上升弧线 -->
  <path d="M 256 50 C 142 50 50 142 50 256 C 50 370 142 462 256 462 C 350 462 430 400 456 316 C 410 352 352 376 290 376 C 174 376 82 284 82 168 C 82 120 98 76 126 38 C 164 46 208 50 256 50 Z"
        fill="url(#coolGrad)"/>

  <!-- 朝阳金核：右上生机涌动的生命之核 -->
  <circle cx="342" cy="168" r="102" fill="url(#warmGrad)"/>

  <!-- 潮汐星珠：极光晨露微光点 -->
  <circle cx="160" cy="106" r="16" fill="#A5F3FC"/>
</svg>"""

# 2. 独立应用图标 SVG (用于 Apple Touch 与 Android Chrome，带精致黑曜石圆角画幅与双光晕)
APP_ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141B26"/>
      <stop offset="50%" stop-color="#0B0F17"/>
      <stop offset="100%" stop-color="#040608"/>
    </linearGradient>
    <linearGradient id="coolGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="30%" stop-color="#14B8A6"/>
      <stop offset="70%" stop-color="#2DD4BF"/>
      <stop offset="100%" stop-color="#A5F3FC"/>
    </linearGradient>
    <linearGradient id="warmGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C2410C"/>
      <stop offset="35%" stop-color="#EA580C"/>
      <stop offset="70%" stop-color="#FF7E2A"/>
      <stop offset="92%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#FFFBEB"/>
    </linearGradient>
    <radialGradient id="glowCool" cx="35%" cy="65%" r="60%">
      <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#2DD4BF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowWarm" cx="66%" cy="34%" r="60%">
      <stop offset="0%" stop-color="#FF7E2A" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#FF7E2A" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="512" height="512" rx="116" fill="url(#bgGrad)"/>
  <rect width="508" height="508" x="2" y="2" rx="114" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="2"/>
  
  <circle cx="180" cy="330" r="160" fill="url(#glowCool)"/>
  <circle cx="330" cy="180" r="160" fill="url(#glowWarm)"/>
  
  <path d="M 256 68 C 152 68 68 152 68 256 C 68 360 152 444 256 444 C 342 444 416 388 440 310 C 398 344 344 366 288 366 C 182 366 98 282 98 176 C 98 132 112 92 138 58 C 172 65 212 68 256 68 Z"
        fill="url(#coolGrad)"/>
  <circle cx="336" cy="176" r="92" fill="url(#warmGrad)"/>
  <circle cx="170" cy="118" r="15" fill="#A5F3FC"/>
</svg>"""


def render_html_to_png(svg_str, width, height, output_png):
    temp_html = os.path.join(BASE_DIR, f"temp_render_{width}x{height}.html")
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: {width}px; height: {height}px; overflow: hidden; background: transparent; }}
  svg {{ display: block; width: {width}px; height: {height}px; }}
</style>
</head>
<body>
{svg_str}
</body>
</html>"""
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    abs_html = os.path.abspath(temp_html)
    abs_out = os.path.abspath(output_png)

    cmd = [
        EDGE_PATH,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        f"--window-size={width},{height}",
        "--default-background-color=00000000",
        f"--screenshot={abs_out}",
        f"file:///{abs_html}",
    ]
    subprocess.run(cmd, check=True)
    if os.path.exists(temp_html):
        os.remove(temp_html)
    print(f"Generated {output_png} ({width}x{height})")


def make_ico(png_files, output_ico):
    num_images = len(png_files)
    header = struct.pack("<HHH", 0, 1, num_images)
    entries = []
    image_data = []
    offset = 6 + num_images * 16

    for fpath in png_files:
        with open(fpath, "rb") as f:
            data = f.read()
        w, h = struct.unpack(">II", data[16:24])
        w_byte = 0 if w >= 256 else w
        h_byte = 0 if h >= 256 else h
        entry = struct.pack(
            "<BBBBHHII",
            w_byte,
            h_byte,
            0,
            0,
            1,
            32,
            len(data),
            offset,
        )
        entries.append(entry)
        image_data.append(data)
        offset += len(data)

    with open(output_ico, "wb") as f:
        f.write(header)
        for e in entries:
            f.write(e)
        for d in image_data:
            f.write(d)
    print(f"Packed {output_ico} with {len(png_files)} resolutions")


def main():
    # 1. 写入 favicon.svg
    svg_path = os.path.join(BASE_DIR, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(FAVICON_SVG)
    print(f"Wrote {svg_path}")

    # 2. 渲染高分辨率移动端与 PWA 图标
    apple_icon = os.path.join(BASE_DIR, "apple-touch-icon.png")
    render_html_to_png(APP_ICON_SVG, 180, 180, apple_icon)

    android_icon = os.path.join(BASE_DIR, "android-chrome-192.png")
    render_html_to_png(APP_ICON_SVG, 192, 192, android_icon)

    # 3. 渲染透明背景多分辨率 Favicon
    fav48 = os.path.join(BASE_DIR, "favicon-48.png")
    render_html_to_png(FAVICON_SVG, 48, 48, fav48)

    fav32 = os.path.join(BASE_DIR, "favicon-32.png")
    render_html_to_png(FAVICON_SVG, 32, 32, fav32)

    fav16 = os.path.join(BASE_DIR, "favicon-16.png")
    render_html_to_png(FAVICON_SVG, 16, 16, fav16)

    # 4. 打包多尺寸复合 favicon.ico (包含 16x16, 32x32, 48x48)
    ico_path = os.path.join(BASE_DIR, "favicon.ico")
    make_ico([fav16, fav32, fav48], ico_path)

    print("\nAll icon assets generated successfully!")


if __name__ == "__main__":
    main()
