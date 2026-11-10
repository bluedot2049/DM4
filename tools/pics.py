# 把原始作品縮成網頁用的 webp：python tools/pics.py [名字 ...]
# 每張輸出兩個尺寸：img/<名字>.webp（長邊 2400，點開看大圖用）、img/<名字>-s.webp（長邊 1000，頁面上用）
# 每張：名字: (原檔, 選項)   選項 crop=(左, 上, 右, 下) 0–1 的比例，先裁再縮
import os, sys, json
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = None
I = 'F:/插畫/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'img')

PICS = {
  # 01 BLUEDOT 個人系列（PRINT2020／2021PRINT 是印刷用高解析檔）
  'bd-one':       (I + 'PRINT2020/ONE.png', {}),
  'bd-sun':       (I + 'PRINT2020/0.png', {}),
  'bd-fireflies': (I + 'PRINT2020/Fireflies.png', {}),
  'bd-wind':      (I + 'PRINT2020/WIND.png', {}),
  'bd-drop':      (I + '分析/drop.png', {}),
  'bd-std':       (I + 'PRINT2020/STD.png', {}),
  'bd-zen':       (I + 'PRINT2020/NEW/ZEN2.png', {}),
  'bd-hey':       (I + '分析/HEY22.jpg', {}),
  'bd-deadstar':  (I + '分析/deadstar22.png', {}),
  'bd-red':       (I + '分析/插圖7456456.jpg', {}),
  'bd-walk':      (I + '分析/15615245.jpg', {}),
  'bd-gate':      (I + '分析/1337.png', {}),
  'bd-missle':    (I + 'PRINT2020/新增資料夾/missle3.png', {}),
  'bd-slope':     (I + '分析/漫畫98637.jpg', {}),
  'bd-forest':    (I + '分析/forest2.png', {}),
  'bd-traffic':   (I + 'PRINT2020/Traffic.png', {}),
  'bd-void':      (I + '2021PRINT/v2.png', {}),
  'bd-square':    (I + '分析/插圖7453.jpg', {}),
  # 2020 Wave 個展
  'wave-poster':  (I + 'Wave畫展/wave.jpg', {}),
  'wave-card':    (I + 'Wave畫展/post card.jpg', {}),
  'wave-room':    (I + 'Wave畫展/01.jpg', {}),
  'wave-one':     (I + 'Wave畫展/07.jpg', {}),
  'wave-sea':     (I + 'Wave畫展/08.jpg', {}),
  'wave-wall':    (I + 'Wave畫展/02.jpg', {}),

  # 02 渦：劇場主視覺與投影
  'wo-key':       (I + '渦/視覺2022/2022主視覺/VORTEXFINAL.png', {}),
  'wo-flower':    (I + '渦/視覺2022/2022主視覺/渦PNG4.png', {}),
  'wo-portal':    (I + '渦/2021封存/open/vortex03.jpg', {}),
  'wo-girl':      (I + '渦/2021封存/open/opengirl.jpg', {}),
  'wo-door':      (I + '渦/老/新增資料夾/door4.jpg', {}),
  'wo-cave':      (I + '渦/老/新增資料夾/水洞02.jpg', {}),
  'wo-castle':    (I + '渦/2021封存/女/NEWNEWENW/城堡.jpg', {}),
  'wo-tower':     (I + '渦/2021封存/女/NEWNEWENW/皇后說故事/35.jpg', {'crop': (0.145, 0, 0.858, 1)}),  # 原檔兩側有黑邊
  'wo-ink':       (I + '渦/2021封存/女/newnew/05.jpg', {}),
  'wo-lines':     (I + '渦/2021封存/女/newnew/18.jpg', {}),
  'wo-moon':      (I + '渦/2021封存/女/newnew/22.jpg', {}),

  # 03 胡凱兒〈你給過我的快樂〉
  'hu-cover':     (I + '胡凱兒/新增資料夾 (2)/你給過我的快樂PNG.png', {}),
  'hu-logo':      (I + '胡凱兒/final/WhocaresLOGO中英(白)-01.png', {'bg': '#2a2a4a', 'pad': 0.08}),  # 白字版鋪專案底色

  # 04 嘉義市管樂團《世界之窗》
  'cy-poster':    (I + '嘉市管/海報/世界之窗海報PNG-01.png', {}),
  'cy-train':     (I + '嘉市管/底圖2233333334444.png', {}),
  'cy-castle':    (I + '嘉市管/圖/castle.jpg', {}),
  'cy-station':   (I + '嘉市管/圖/新增資料夾/CHIAYI777.jpg', {}),

  # 05 DICE
  'dice-open':    (I + 'DICE/FIN/OPENENDDDDD001.png', {}),
  'dice-bed':     (I + 'DICE/toka/FINAL/dice final PNG999.png', {}),

  # 06 柏青哥 PACHINKO!
  'pa-cover':     (I + '柏青哥/插圖5222.jpg', {}),
  'pa-god':       (I + '柏青哥/END/財神.jpg', {}),

  # 07 海報
  'po-boat':      (I + '汪洋/003.png', {}),
  'po-box':       (I + '2019JOB/不可無料/新增資料夾/箱男孩01.jpg', {}),
  'po-flute':     (I + '2019JOB/coco/COCO海報-01.jpg', {}),
  'po-whale':     (I + '2019JOB/嘉義市管樂團/插圖3366.jpg', {}),
  'po-camel':     ('F:/桃城駱書/10022FINAL.png', {}),

  # 08 角色與設定
  'ch-knight':    (I + 'DARK/插圖6922.jpg', {}),
  'ch-knight2':   (I + 'DARK/插圖45.jpg', {}),

  # 09 卡通 IP
  'ip-dog':       (I + 'PRINT2020/RANDOM dog.png', {}),
  'ip-dog4':      (I + '都狗/RDG4.jpg', {}),
  'ip-dog5':      (I + '都狗/RDG5.jpg', {}),
  'ip-dog7':      (I + '都狗/RDG7.jpg', {}),
  'ip-mug':       (I + '漫畫/某條狗馬克杯/某條狗.jpg', {}),
  'ip-lmao':      (I + '漫畫/LMAO.jpg', {}),
  'ip-chill':     (I + 'CHILLOUTBOY/fuckedboybg-01.png', {}),
  'ip-zu':        (I + 'zu/ZU2.jpg', {}),
  'ip-zu2':       (I + 'zu/ZU35.jpg', {}),
  'ip-manatee':   (I + '海牛貼圖/海牛驚嚇.png', {}),
  'ip-haha':      (I + '雜/HAHAHA.jpg', {}),

  # 近年（2024–2026）：雲林國際偶戲節、海報
  'pu-kv':        ('F:/2025虎尾偶戲節/01_工作區域 1.jpg', {}),
  'rp-bison':     ('F:/下載/野牛海報.ai', {}),
  'rp-lelele':    ('F:/太日2025/624修改海報檔/太日2025樂樂樂624修改.jpg', {}),
  'rp-youth':     ('F:/青年席位/青年席位海報新日期-01.jpg', {}),
  'rp-jiuge':     ('F:/太日海報/新增資料夾/01-主視覺海報/01-幻想九歌主視覺海報 屏東新竹版-01.jpg', {}),
  'rp-village':   ('F:/太日海報/藝動鄉村A2-jpg.jpg', {}),

  # 《已讀》角色圖（AI 生成，副標標明）：從作品集2 的「03 角色圖」搬來，同一份清單
  # 原檔 1024×1224，所以兩個尺寸都是原尺寸
  'rd-platform':  ('G:/GAME/IMAGE2/003.png', {}),                                             # 月台
  'rd-stairs':    ('G:/GAME/IMAGE2/004-0.png', {}),                                           # 樓梯
  'rd-street':    ('G:/GAME/IMAGE2/TA-2026-08-28-01-57-18-(djheycha_-3246348860-1.png', {}),  # 夜晚街上
  'rd-bag':       ('G:/GAME/IMAGE2/TA-2026-08-30-16-56-18-(djheycha_-2659933663-1.png', {}),  # 巷子・粉紅提袋
  'rd-ya':        ('G:/GAME/IMAGE2/TA-2026-08-31-01-35-32-(djheycha_-2160974806-3.png', {}),  # 巷子・比 YA
  'rd-desk':      ('G:/GAME/IMAGE2/TA-2026-08-31-10-32-04-(djheycha_-2491933739-1.png',       # 書桌：螢幕上是成人影片縮圖，整塊粗打碼
                   {'mosaic': [(0.535, 0.26, 0.94, 0.52), (0.95, 0.27, 1, 0.57)], 'cell': 24}),
  'rd-smile':     ('G:/GAME/IMAGE2/TA-2026-08-29-05-28-03-(djheycha_-1901287347-2.png', {}),  # 托腮笑
  'rd-dark':      ('G:/GAME/IMAGE2/1919.png', {}),                                            # 暗房托腮

  # 節目冊・歌詞本：攤開圖是另外拼好的（F:/節目冊攤開展示），big = 燈箱大圖長邊，才看得到內頁的字
  'bk-cs':        ('F:/節目冊攤開展示/嘉市管_世界之窗_全攤開.jpg', {'big': 6000}),
  'bk-lele':      ('F:/節目冊攤開展示/太日樂集_樂樂樂_全攤開.jpg', {'big': 6000}),
  'bk-wx':        ('F:/節目冊攤開展示/望鄉_日本巡演節目冊_全攤開.jpg', {'big': 6000}),
  'bk-hu':        ('F:/節目冊攤開展示/胡凱兒_WhoCares_歌詞本_全攤開.jpg', {'big': 6000}),
  'bk-hu-box':    ('F:/節目冊攤開展示/胡凱兒_WhoCares_盒套_展開.jpg', {'big': 3800}),
  'bk-hu-cd':     ('F:/節目冊攤開展示/胡凱兒_WhoCares_CD示意.jpg', {'big': 4000}),   # 盒套正面＋光碟抽出一半（scratchpad 的 cdmock.py 合成）
  'bk-anime':     ('F:/節目冊攤開展示/動漫超人氣2_節目單_攤開.jpg', {'big': 3100}),
  # 動力裝甲手繪工業稿：黑底排版板是 tools/boards.py 從 F:/插畫/動力裝甲/png 做的（F:/動力裝甲排版）
  'ar-set':       ('F:/動力裝甲排版/00_set.jpg', {'big': 3000}),
  'ar-pegasus':   ('F:/動力裝甲排版/01_pegasus.jpg', {'big': 3000}),
  'ar-scorpion':  ('F:/動力裝甲排版/02_scorpion.jpg', {'big': 3000}),
  'ar-crab':      ('F:/動力裝甲排版/03_crab.jpg', {'big': 3000}),
  'ar-bone':      ('F:/動力裝甲排版/04_heavy-bone.jpg', {'big': 3000}),
  'ar-feet':      ('F:/動力裝甲排版/05_big-feet.jpg', {'big': 3000}),
  'ar-hover':     ('F:/動力裝甲排版/06_hover-v.jpg', {'big': 3000}),
  'ar-soul':      ('F:/動力裝甲排版/07_soul-extractor.jpg', {'big': 3000}),
  'ar-vr':        ('F:/動力裝甲排版/08_virtual-reality.jpg', {'big': 3000}),
}

def box(im, f):
  w, h = im.size
  return tuple(round(v) for v in (f[0] * w, f[1] * h, f[2] * w, f[3] * h))

def make(name):
  src, o = PICS[name]
  if src.lower().endswith(('.ai', '.pdf')):   # Illustrator 檔：用 PDF 相容內容轉第一頁
    import pymupdf
    pg = pymupdf.open(src)[0]; z = 3000 / max(pg.rect.width, pg.rect.height)
    pix = pg.get_pixmap(matrix=pymupdf.Matrix(z, z), alpha=False)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
  else:
    im = ImageOps.exif_transpose(Image.open(src))
  if im.mode in ('RGBA', 'LA', 'P'):   # 透明底鋪色（預設白）
    im = im.convert('RGBA')
    if 'pad' in o:
      b = im.getbbox(); m = round(max(b[2] - b[0], b[3] - b[1]) * o['pad'])
      im = im.crop((b[0] - m, b[1] - m, b[2] + m, b[3] + m))
    bg = Image.new('RGB', im.size, o.get('bg', 'white')); bg.paste(im, mask=im.split()[3]); im = bg
  im = im.convert('RGB')
  if 'crop' in o: im = im.crop(box(im, o['crop']))
  for m in o.get('mosaic', []):   # 打碼燒進圖檔：先縮再用最近鄰放大
    b = box(im, m); part = im.crop(b)
    cell = max(8, im.width // o.get('cell', 40))
    part = part.resize((max(1, part.width // cell), max(1, part.height // cell)), Image.BILINEAR).resize(part.size, Image.NEAREST)
    im.paste(part, b)
  os.makedirs(OUT, exist_ok=True)
  for suffix, size in (('', o.get('big', 2400)), ('-s', 1000)):
    t = im.copy(); t.thumbnail((size, size), Image.LANCZOS)
    t.save(os.path.join(OUT, name + suffix + '.webp'), quality=80, method=6)
  return t.size

if __name__ == '__main__':
  sizes = {}
  path = os.path.join(OUT, 'sizes.json')
  if os.path.exists(path): sizes = json.load(open(path))
  else:  # 第一次：已經存在的圖直接讀尺寸，不重做
    for n in PICS:
      f = os.path.join(OUT, n + '-s.webp')
      if os.path.exists(f) and os.path.exists(os.path.join(OUT, n + '.webp')): sizes[n] = list(Image.open(f).size)
  # 不帶參數：只做還沒做過的；帶名字：重做那幾張
  for name in (sys.argv[1:] or [n for n in PICS if n not in sizes or not os.path.exists(os.path.join(OUT, n + '.webp'))]):
    w, h = make(name)
    sizes[name] = [w, h]
    print(name, w, h)
  # 網頁上「＋加圖」上傳的圖（u 開頭）不在 PICS 裡，要留著
  try:
    old = json.loads(open(os.path.join(OUT, 'sizes.js')).read().split('=', 1)[1].rstrip().rstrip(';'))
    for n, v in old.items():
      if n.startswith('u') and n not in sizes: sizes[n] = v
  except Exception: pass
  for n in list(sizes):
    if n not in PICS and not n.startswith('u'): del sizes[n]
  json.dump(sizes, open(path, 'w'), indent=0)
  open(os.path.join(OUT, 'sizes.js'), 'w').write('window.SIZES=' + json.dumps(sizes, separators=(',', ':')) + ';\n')
