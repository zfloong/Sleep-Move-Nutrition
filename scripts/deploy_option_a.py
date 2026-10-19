import os
import struct
import subprocess
import tempfile

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# 方案 A 官方完整矢量
OPTION_A_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
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

  <rect width="512" height="512" rx="112" fill="#060b13" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <g transform="translate(256, 260) scale(18.5) translate(-11.8, -8.6)" filter="url(#glowA)">
    <path d="M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746V14.4736Z" fill="url(#gradA)"/>
  </g>

  <circle cx="376" cy="142" r="15" fill="url(#eyeGradA)"/>
  <circle cx="410" cy="115" r="9" fill="#7dd3fc" opacity="0.85"/>
  <circle cx="436" cy="94" r="6" fill="#7dd3fc" opacity="0.6"/>
</svg>'''

def render_svg_to_png(svg_markup, size, out_png):
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {{
    margin: 0; padding: 0;
    width: {size}px; height: {size}px;
    background: transparent;
    overflow: hidden;
  }}
  svg {{
    width: {size}px; height: {size}px;
    display: block;
  }}
</style>
</head>
<body>
{svg_markup}
</body>
</html>"""
    
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_content)
        temp_html = f.name

    user_data = tempfile.mkdtemp(prefix="edge_icon_")
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--enable-unsafe-swiftshader",
        f"--user-data-dir={user_data}",
        f"--window-size={size},{size}",
        "--hide-scrollbars",
        f"--screenshot={out_png}",
        temp_html
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    os.remove(temp_html)
    print(f"Rendered {size}x{size} -> {out_png}")

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
            w_byte, h_byte, 0, 0, 1, 32, len(data), offset
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
    print("=== Deploying Option A (极光巡游鲸) ===")

    # 1. 保存官方 favicon.svg
    svg_path = os.path.join(BASE_DIR, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(OPTION_A_SVG)
    print(f"Wrote {svg_path}")

    # 2. 渲染各尺寸位图
    fav16 = os.path.join(BASE_DIR, "favicon-16.png")
    render_svg_to_png(OPTION_A_SVG, 16, fav16)

    fav32 = os.path.join(BASE_DIR, "favicon-32.png")
    render_svg_to_png(OPTION_A_SVG, 32, fav32)

    fav48 = os.path.join(BASE_DIR, "favicon-48.png")
    render_svg_to_png(OPTION_A_SVG, 48, fav48)

    apple_icon = os.path.join(BASE_DIR, "apple-touch-icon.png")
    render_svg_to_png(OPTION_A_SVG, 180, apple_icon)

    android_icon = os.path.join(BASE_DIR, "android-chrome-192.png")
    render_svg_to_png(OPTION_A_SVG, 192, android_icon)

    # 3. 打包复合 favicon.ico (16, 32, 48)
    ico_path = os.path.join(BASE_DIR, "favicon.ico")
    make_ico([fav16, fav32, fav48], ico_path)

    print("\nOption A deployment finished successfully!")

if __name__ == "__main__":
    main()
