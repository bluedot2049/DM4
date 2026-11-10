// 頁面上所有的字和圖都在這裡（網頁上按「編輯」改完存檔會重寫這個檔）
// rows：每一列放幾張圖就並排幾張，高度自動對齊；{ mosaic: [大, 小, 小…] } 是拼貼（小圖 4 張排 2×2、9 張排 3×3），flip: true 大圖在右
// 圖片名字對應 img/<名字>.webp（長邊 2400）和 img/<名字>-s.webp（長邊 1000）
// 字一律中英並列；CATS 的 nav 是上方列用的短名

const SITE = {
  name: '吳承恩',
  en: 'Darien',
  role: '插畫 Illustration',
  mail: 'bluedot2049@gmail.com',
  line: 'saksaar',
  updated: '2026/11/11',
  other: { label: '另一份作品集 Other Portfolio', title: '藝術模組化設計師 Modular Art Designer', url: 'https://bluedot2049.github.io/DM/', img: 'link-dm' },
};

const CATS = [
  { id: 'personal', name: '個人作品', en: 'Personal Work', nav: '個人' },
  { id: 'print', name: '海報／印刷', en: 'Poster / Print', nav: '印刷' },
  { id: 'album', name: '專輯設計製作', en: 'Album Design', nav: '專輯' },
  { id: 'r18', name: 'R18', en: 'Adults Only', nav: 'R18' },
];

const WORKS = [
  {
    id: 'bluedot',
    cat: 'personal',
    title: '電繪 Digital Illustration',
    sub: 'CSP',
    year: '',
    cover: 'bd-forest',
    bg: '#26212b',
    fg: '#efe6dd',
    rows: [
      { mosaic: ['bd-forest', 'bd-one', 'bd-sun', 'bd-fireflies', 'bd-wind', 'bd-drop', 'bd-std', 'bd-zen', 'bd-hey', 'bd-void'] },
    ],
  },
  {
    id: 'recent',
    cat: 'print',
    title: '海報 Poster',
    sub: 'CSP / Illustrator',
    year: '',
    cover: 'rp-lelele',
    bg: '#e9e6df',
    fg: '#222',
    rows: [
      ['rp-lelele', 'rp-youth', 'umwauz1og0', 'umwauzzef0', 'rp-village'],
    ],
  },
  {
    id: 'booklet',
    cat: 'print',
    title: '節目冊 Program Booklet',
    sub: '編排・印刷 Layout / Print',
    year: '2020–2025',
    cover: 'bk-cs',
    bg: '#0e0e10',
    fg: '#ece8e2',
    rows: [
      ['bk-cs', 'cy-poster'],
      ['bk-lele'],
      ['bk-wx'],
    ],
  },
  {
    id: 'whocares',
    cat: 'album',
    title: '胡凱兒 Who Cares《你給過我的快樂》',
    sub: '封面・歌詞本・盒套 Cover / Booklet / Case',
    year: '2022',
    cover: 'hu-cover',
    bg: '#2a2a4a',
    fg: '#f4ecd8',
    rows: [
      ['hu-cover', 'bk-hu-cd', 'bk-hu-box'],
      ['bk-hu'],
    ],
  },
  {
    id: 'read',
    cat: 'r18',
    title: '自製 R18 視覺小說遊戲 Self-made R18 Visual Novel Game',
    sub: 'AI 生成・Tensor-hub 製作・可 NSFW / AI-generated, made on Tensor-hub, NSFW available',
    year: '2026',
    cover: 'rd-platform',
    bg: '#1c1e26',
    fg: '#e8e6ef',
    rows: [
      ['rd-platform', 'rd-stairs', 'rd-street', 'rd-bag'],
      ['rd-ya', 'rd-desk', 'rd-smile', 'rd-dark'],
    ],
  },
];
