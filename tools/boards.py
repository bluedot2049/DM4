# 動力裝甲手繪工業稿 → 黑底排版板（白線、編號、名稱）
# python tools/boards.py   輸出到 F:/動力裝甲排版/，再用 pics.py 轉成網頁圖（ar-*）
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
Image.MAX_IMAGE_PIXELS = None

SRC = 'F:/插畫/動力裝甲/png/'
OUT = 'F:/動力裝甲排版/'
W, H = 3000, 2000
M = 120                       # 外邊界
BG = (13, 13, 15)
INK = (236, 234, 228)
GRAY = (128, 128, 134)
RULE = (48, 48, 54)
DOT = (30, 30, 35)
ACC = (255, 92, 36)           # 安全橘：只用在總覽的編號

# 檔名, 大字, 小字（只用檔名裡有的字，不自己編規格）, 年份（檔案日期）
SET = [
  ('Pegasus Technology Armor type A', 'PEGASUS', 'TECHNOLOGY ARMOR · TYPE A', '2020'),
  ('Scorpion UX', 'SCORPION', 'UX', '2020'),
  ('Bloodthirsty Crab', 'CRAB', 'BLOODTHIRSTY', '2020'),
  ('Heavy Bone', 'HEAVY BONE', '', '2020'),
  ('Big feet', 'BIG FEET', '', '2022'),
  ('Hover V', 'HOVER V', '', '2020'),
  ('Soul Extractor', 'SOUL EXTRACTOR', '', '2020'),
  ('Virtual reality', 'VIRTUAL REALITY', '', '2020'),
]

def font(size, var='Regular'):
  f = ImageFont.truetype('C:/Windows/Fonts/bahnschrift.ttf', size)
  f.set_variation_by_name(var)
  return f

def cjk(size, bold=False):
  return ImageFont.truetype('C:/Windows/Fonts/' + ('msjhbd.ttc' if bold else 'msjhl.ttc'), size)

def text(d, xy, s, f, fill, track=0, anchor='la'):
  """字距 track（px）；anchor 只用 la / ra"""
  if not track:
    d.text(xy, s, font=f, fill=fill, anchor=anchor); return
  w = sum(d.textlength(c, font=f) for c in s) + track * (len(s) - 1)
  x, y = xy
  if anchor == 'ra': x -= w
  for c in s:
    d.text((x, y), c, font=f, fill=fill, anchor='la'); x += d.textlength(c, font=f) + track

def ink(name):
  """回傳 0–1 的線稿濃度（裁到有線的範圍）"""
  im = Image.open(SRC + name + '.png').convert('RGBA')
  b = im.getbbox()
  return im.split()[3].crop(b)

def fit(a, bw, bh, boost=0.6, zmax=99):
  """把線稿縮進 bw×bh，細線縮小後會變淡，用 gamma 補回來；zmax 限制放大（原檔小的會糊）"""
  z = min(bw / a.width, bh / a.height, zmax)
  t = a.resize((round(a.width * z), round(a.height * z)), Image.LANCZOS)
  arr = (np.asarray(t).astype(float) / 255) ** boost
  return Image.fromarray((arr * 255).astype('uint8')), z

def paint(base, alpha, xy, color=INK):
  layer = Image.new('RGB', alpha.size, color)
  base.paste(layer, xy, alpha)

def sheet():
  im = Image.new('RGB', (W, H), BG)
  d = ImageDraw.Draw(im)
  for y in range(M + 100, H - M - 90, 50):          # 方格點底（工程紙感）
    for x in range(M, W - M + 1, 50):
      d.rectangle((x, y, x + 1, y + 1), fill=DOT)
  for (x, y) in ((M, M), (W - M, M), (M, H - M), (W - M, H - M)):   # 四角十字
    d.line((x - 22, y, x + 22, y), fill=GRAY, width=2); d.line((x, y - 22, x, y + 22), fill=GRAY, width=2)
  d.line((M, M + 70, W - M, M + 70), fill=RULE, width=2)
  d.line((M, H - M - 70, W - M, H - M - 70), fill=RULE, width=2)
  text(d, (M + 40, M + 14), 'POWER ARMOR CONCEPT', font(30, 'SemiBold'), GRAY, 7)
  text(d, (W - M - 40, H - M - 52), '吳承恩  DARIEN', cjk(28), GRAY, 4, 'ra')
  text(d, (M + 40, H - M - 52), '手繪工業設計稿', cjk(28), GRAY, 6)
  return im, d

def board(i, name, big, small, year):
  im, d = sheet()
  text(d, (W - M - 40, M + 14), f'{i + 1:02d} / {len(SET):02d}    {year}', font(30, 'SemiBold'), GRAY, 7, 'ra')
  a = ink(name)
  # 左：主圖
  ax0, ay0, ax1, ay1 = M + 60, M + 150, 2080, H - M - 150
  t, z = fit(a, ax1 - ax0, ay1 - ay0, zmax=1.25)
  ox = ax0 + (ax1 - ax0 - t.width) // 2; oy = ay0 + (ay1 - ay0 - t.height) // 2
  paint(im, t, (ox, oy))
  # 右欄：編號、名稱
  cx0 = 2210
  d.line((2150, M + 150, 2150, H - M - 150), fill=RULE, width=2)
  text(d, (cx0 - 8, M + 120), f'{i + 1:02d}', font(300, 'Light'), INK)
  nf = font(110 if len(big) < 10 else 84, 'SemiBold Condensed')
  text(d, (cx0, M + 470), big, nf, INK, 4)
  text(d, (cx0 + 2, M + 600), small, font(36), GRAY, 6)
  return im

def overview():
  im, d = sheet()
  text(d, (W - M - 40, M + 14), f'{len(SET):02d} UNITS    2020–2022', font(30, 'SemiBold'), GRAY, 7, 'ra')
  text(d, (M + 34, M + 130), 'POWER ARMOR', font(190, 'SemiBold Condensed'), INK, 8)
  text(d, (M + 44, M + 360), '動力裝甲　手繪工業設計稿', cjk(46), GRAY, 10)
  cols, rows = 4, 2
  gx0, gy0, gx1, gy1 = M + 40, M + 470, W - M - 40, H - M - 110
  cw = (gx1 - gx0) / cols; ch = (gy1 - gy0) / rows
  for i, (name, big, small, year) in enumerate(SET):
    c, r = i % cols, i // cols
    x0 = gx0 + c * cw; y0 = gy0 + r * ch
    if c: d.line((x0, y0 + 20, x0, y0 + ch - 20), fill=RULE, width=2)
    if r: d.line((x0 + 20, y0, x0 + cw - 20, y0), fill=RULE, width=2)
    t, _ = fit(ink(name), cw - 120, ch - 170)
    paint(im, t, (round(x0 + (cw - t.width) / 2), round(y0 + 40 + (ch - 170 - t.height) / 2)))
    text(d, (round(x0 + 40), round(y0 + ch - 92)), f'{i + 1:02d}', font(34, 'SemiBold'), ACC, 4)
    text(d, (round(x0 + 110), round(y0 + ch - 92)), big, font(34, 'SemiBold'), INK, 5)
  return im

if __name__ == '__main__':
  os.makedirs(OUT, exist_ok=True)
  overview().save(OUT + '00_set.jpg', quality=93)
  for i, (name, big, small, year) in enumerate(SET):
    board(i, name, big, small, year).save(OUT + f'{i + 1:02d}_{big.lower().replace(" ", "-")}.jpg', quality=93)
    print(i + 1, big)
