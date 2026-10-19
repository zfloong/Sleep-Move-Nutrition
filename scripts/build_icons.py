import os
import struct
import subprocess

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 方案 1 · 薄荷冰青 (Mint Glacial) 核心 SVG
# 晨露冰白玉爱心 + 深翡翠心跳脉冲 + 冰青荧光星轨
ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <!-- 暗夜黑曜石微渐变底板 -->
    <linearGradient id="p1-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E171E"/>
      <stop offset="60%" stop-color="#070C10"/>
      <stop offset="100%" stop-color="#030608"/>
    </linearGradient>

    <!-- 极光冰白玉爱心渐变 -->
    <linearGradient id="p1-heart" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="55%" stop-color="#F0FDFA"/>
      <stop offset="100%" stop-color="#CCFBF1"/>
    </linearGradient>

    <!-- 深翡翠心跳脉冲 -->
    <linearGradient id="p1-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="50%" stop-color="#0D9488"/>
      <stop offset="100%" stop-color="#0F766E"/>
    </linearGradient>

    <!-- 冰青荧光星轨渐变 -->
    <linearGradient id="p1-orbit" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0D9488"/>
      <stop offset="35%" stop-color="#14B8A6"/>
      <stop offset="70%" stop-color="#2DD4BF"/>
      <stop offset="90%" stop-color="#5EEAD4"/>
      <stop offset="100%" stop-color="#A5F3FC"/>
    </linearGradient>

    <!-- 柔和冰青微光晕 -->
    <radialGradient id="p1-glow" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#2DD4BF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- 舒适黑曜石圆角画幅背景 -->
  <rect width="512" height="512" rx="116" fill="url(#p1-bg)"/>
  <rect width="508" height="508" x="2" y="2" rx="114" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="2"/>

  <!-- 晨露微晕 -->
  <circle cx="256" cy="256" r="190" fill="url(#p1-glow)"/>

  <!-- 1. 冰川白玉爱心主体 -->
  <path d="M 256 168 C 242 136 206 102 152 102 C 94 102 52 150 52 216 C 52 296 156 364 256 424 C 356 364 460 296 460 216 C 460 150 418 102 360 102 C 306 102 270 136 256 168 Z"
        fill="url(#p1-heart)"/>

  <!-- 2. 深翡翠生命心跳脉冲 -->
  <path d="M 136 256 L 210 256 L 246 178 L 274 316 L 302 232 L 322 256 L 376 256"
        fill="none" stroke="url(#p1-pulse)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- 3. 环绕荧光冰青星轨 -->
  <path d="M 44 322 C 34 350 44 380 92 402 C 160 432 284 426 384 372 C 454 334 492 284 480 236 C 472 206 438 184 394 174 C 408 194 402 218 368 244 C 298 296 196 322 104 316 C 68 314 48 316 44 322 Z"
        fill="url(#p1-orbit)"/>
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
    print("=== Generating 方案 1 · 薄荷冰青 (Mint Glacial) 图标体系 ===")

    # 1. 写入矢量 SVG
    svg_path = os.path.join(BASE_DIR, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(ICON_SVG)
    print(f"Wrote {svg_path}")

    # 2. 渲染 Apple Touch Icon 与 Android Chrome PWA
    apple_icon = os.path.join(BASE_DIR, "apple-touch-icon.png")
    render_html_to_png(ICON_SVG, 180, 180, apple_icon)

    android_icon = os.path.join(BASE_DIR, "android-chrome-192.png")
    render_html_to_png(ICON_SVG, 192, 192, android_icon)

    # 3. 渲染 Favicon PNG 系列
    fav48 = os.path.join(BASE_DIR, "favicon-48.png")
    render_html_to_png(ICON_SVG, 48, 48, fav48)

    fav32 = os.path.join(BASE_DIR, "favicon-32.png")
    render_html_to_png(ICON_SVG, 32, 32, fav32)

    fav16 = os.path.join(BASE_DIR, "favicon-16.png")
    render_html_to_png(ICON_SVG, 16, 16, fav16)

    # 4. 打包三合一复合 favicon.ico (16, 32, 48)
    ico_path = os.path.join(BASE_DIR, "favicon.ico")
    make_ico([fav16, fav32, fav48], ico_path)

    print("\nScheme 1 Mint Glacial icons generated successfully!")


if __name__ == "__main__":
    main()
