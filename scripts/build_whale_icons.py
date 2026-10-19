import os
import struct
import subprocess

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 官方原版逆向鲸鱼路径 (局部 viewBox 0 0 24 18)
DEEPSEEK_PATH = (
    "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519"
    "C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697"
    " 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771"
    " 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569"
    "C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163"
    " 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382"
    " 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326"
    " 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516"
    " 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651"
    " 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671"
    " 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121"
    " 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075"
    " 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524"
    " 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675"
    " 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286"
    " 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332"
    " 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016"
    " 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595"
    " 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125"
    " 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245"
    " 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381"
    " 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931"
    " 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646"
    " 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182"
    " 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182"
    " 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712"
    " 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548"
    " 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749"
    " 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081"
    " 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182"
    " 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083"
    " 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673"
    " 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314"
    " 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215"
    " 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476"
    " 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159"
    " 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262"
    " 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349"
    " 15.1546 12.058 15.1731 11.1749 14.4746V14.4736ZM12.141 8.25988"
    "C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338"
    " 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938"
    " 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988"
    "C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639"
    " 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793"
    " 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143"
    " 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691"
    "C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438"
    " 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636"
    " 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136"
    "C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335"
    " 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184"
    " 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287"
    "C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009"
    " 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493"
    " 15.1415 9.79893Z"
)

# 融合狂野生长「极光冰青 ⟷ 晨曦流金」的专属生物巨鲸图标
WHALE_APP_SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <!-- 暗夜黑曜石微渐变底板 -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1624"/>
      <stop offset="60%" stop-color="#070C14"/>
      <stop offset="100%" stop-color="#030508"/>
    </linearGradient>

    <!-- 巨鲸主躯体：极光冰青渐变 (采集之息) -->
    <linearGradient id="whaleGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0D9488"/>
      <stop offset="25%" stop-color="#14B8A6"/>
      <stop offset="60%" stop-color="#2DD4BF"/>
      <stop offset="85%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#A5F3FC"/>
    </linearGradient>

    <!-- 巨鲸背脊微光 / 破浪流金 (施压之火) -->
    <linearGradient id="sunDotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7E2A"/>
      <stop offset="60%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#FEF08A"/>
    </linearGradient>

    <!-- 深海极光微光晕 -->
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#2DD4BF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="512" height="512" rx="116" fill="url(#bgGrad)"/>
  <rect width="508" height="508" x="2" y="2" rx="114" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="2"/>

  <!-- 柔和深海光晕 -->
  <circle cx="256" cy="256" r="190" fill="url(#glowGrad)"/>

  <!-- 灵动巨鲸 (居中排版：缩放为 19.5 倍，水平居中向右上游弋) -->
  <g transform="translate(256, 256) scale(19.2) translate(-11.8, -8.6)">
    <path d="{DEEPSEEK_PATH}" fill="url(#whaleGrad)"/>
  </g>

  <!-- 狂野生长专属点睛之笔：气孔喷涌而出的朝阳金星珠 -->
  <circle cx="362" cy="142" r="14" fill="url(#sunDotGrad)"/>
  <circle cx="394" cy="116" r="8" fill="#A5F3FC" opacity="0.85"/>
  <circle cx="418" cy="98" r="5" fill="#A5F3FC" opacity="0.65"/>
</svg>"""

# 纯矢量透明背景 Favicon (适合浏览器标签页)
WHALE_FAV_SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="whaleFavGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0D9488"/>
      <stop offset="25%" stop-color="#14B8A6"/>
      <stop offset="60%" stop-color="#2DD4BF"/>
      <stop offset="85%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#A5F3FC"/>
    </linearGradient>
    <linearGradient id="sunDotFavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7E2A"/>
      <stop offset="60%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#FEF08A"/>
    </linearGradient>
  </defs>

  <g transform="translate(256, 256) scale(20.5) translate(-11.8, -8.6)">
    <path d="{DEEPSEEK_PATH}" fill="url(#whaleFavGrad)"/>
  </g>

  <circle cx="372" cy="132" r="16" fill="url(#sunDotFavGrad)"/>
  <circle cx="406" cy="106" r="9" fill="#A5F3FC" opacity="0.9"/>
  <circle cx="432" cy="86" r="6" fill="#A5F3FC" opacity="0.75"/>
</svg>"""


def render_html_to_png(svg_str, width, height, output_png):
    temp_html = os.path.join(BASE_DIR, f"temp_whale_{width}x{height}.html")
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
    print("=== Generating Whale Bio-Mark Icons ===")

    # 1. 写入矢量 SVG
    svg_path = os.path.join(BASE_DIR, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(WHALE_FAV_SVG)
    print(f"Wrote {svg_path}")

    # 2. 渲染 Apple Touch Icon 与 Android Chrome PWA
    apple_icon = os.path.join(BASE_DIR, "apple-touch-icon.png")
    render_html_to_png(WHALE_APP_SVG, 180, 180, apple_icon)

    android_icon = os.path.join(BASE_DIR, "android-chrome-192.png")
    render_html_to_png(WHALE_APP_SVG, 192, 192, android_icon)

    # 3. 渲染 Favicon PNG 系列
    fav48 = os.path.join(BASE_DIR, "favicon-48.png")
    render_html_to_png(WHALE_APP_SVG, 48, 48, fav48)

    fav32 = os.path.join(BASE_DIR, "favicon-32.png")
    render_html_to_png(WHALE_APP_SVG, 32, 32, fav32)

    fav16 = os.path.join(BASE_DIR, "favicon-16.png")
    render_html_to_png(WHALE_APP_SVG, 16, 16, fav16)

    # 4. 打包三合一复合 favicon.ico (16, 32, 48)
    ico_path = os.path.join(BASE_DIR, "favicon.ico")
    make_ico([fav16, fav32, fav48], ico_path)

    print("\nWhale icon suite generated successfully!")


if __name__ == "__main__":
    main()
