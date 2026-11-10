// 讀 works.js 把頁面組起來：每個專案的圖（開頭直接是個人作品的大圖＋小圖拼貼）、另一份作品集、燈箱
// render() 可以重跑（編輯模式改完資料就重畫）；data-f 是可編輯的字、data-n 是圖
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const size = (n) => (window.SIZES && SIZES[n]) || [1000, 1000];
window.LOCALSRC = window.LOCALSRC || {};   // 編輯時剛加、還沒存的圖：名字 → 本機網址
const src = (n, big) => LOCALSRC[n] ? LOCALSRC[n][big ? 0 : 1] : `img/${n}${big ? '' : '-s'}.webp`;
// 一個專案裡所有的圖（列可以是陣列、{ imgs: [...] } 或 { mosaic: [...] }）
const imgsOf = (w) => w.rows.filter((r) => typeof r !== 'string').flatMap((r) => (Array.isArray(r) ? r : r.imgs || r.mosaic));
const ed = (f, text, tag = 'span') => `<${tag} data-f="${f}">${esc(text)}</${tag}>`;

function img(n, sizes, alt = '') {
  if (!n) return '<span class="noimg"></span>';
  const [w, h] = size(n);
  const set = LOCALSRC[n] ? '' : ` srcset="img/${n}-s.webp 1000w, img/${n}.webp 2400w" sizes="${sizes}"`;
  return `<img src="${src(n)}"${set} width="${w}" height="${h}" loading="lazy" decoding="async" alt="${esc(alt)}" data-n="${n}">`;
}

function rowHTML(w, r, ri) {
  if (typeof r === 'string') return `<h3 class="sub" data-ri="${ri}">${esc(r.replace(/^#\s*/, ''))}</h3>`;
  // 拼貼：第一張大（佔一半），其餘小圖排成 k×k 方格（4 張 → 2×2、9 張 → 3×3）
  if (r.mosaic) {
    const k = Math.max(1, Math.ceil(Math.sqrt(r.mosaic.length - 1)));
    return `<div class="mosaic${r.flip ? ' flip' : ''}" data-ri="${ri}" style="--k:${k}">${r.mosaic.map((n, i) =>
      `<div class="cell">${img(n, i ? `(max-width: 640px) ${Math.round(100 / k)}vw, ${Math.round(50 / k)}vw` : '(max-width: 640px) 100vw, 50vw', w.title)}</div>`).join('')}</div>`;
  }
  const width = r.width ? `;width:${r.width};margin:0 auto` : '';
  const list = Array.isArray(r) ? r : r.imgs;
  const total = list.reduce((a, n) => a + size(n)[0] / size(n)[1], 0);
  return `<div class="row n${list.length}" data-ri="${ri}" style="--ar:${total.toFixed(4)}${width}">${list.map((n) => {
    const ar = size(n)[0] / size(n)[1];
    const vw = Math.round((ar / total) * 100);
    return `<div class="cell" style="flex:${ar.toFixed(4)} 1 0">${img(n, `(max-width: 640px) 100vw, ${Math.min(vw, 100)}vw`, w.title)}</div>`;
  }).join('')}</div>`;
}

let observers = [];
function render() {
  // 上方列（中文短名＋英文，窄螢幕只留中文）
  $('.bar-name').innerHTML = `${ed('name', SITE.name)} <span>${ed('en', SITE.en)}</span>`;
  const navA = (href, zh, en) => `<a href="${href}">${esc(zh)}<span class="en"> ${esc(en)}</span></a>`;
  $('.bar-nav').innerHTML = CATS.map((c) => navA(`#cat-${c.id}`, c.nav || c.name, c.en)).join('') + navA('#contact', '聯絡', 'Contact');

  // 專案；每個分類開頭一個分隔
  let last = null;
  $('#projects').innerHTML = CATS.map((c, ci) => {
    const ws = WORKS.filter((w) => w.cat === c.id);
    return `<section class="cat" id="cat-${c.id}" data-cat="${c.id}"><h2>${ed(`cat.${ci}.name`, c.name, 'span')}</h2><p>${esc(c.en)}</p></section>` +
      ws.map((w) => `
      <article class="proj" id="${w.id}" data-w="${w.id}" style="--bg:${w.bg};--fg:${w.fg}" data-title="${esc(w.title)}">
        <header class="proj-head">
          <h2>${ed(`w.${w.id}.title`, w.title)}</h2>
          <p>${ed(`w.${w.id}.sub`, w.sub)}　${ed(`w.${w.id}.year`, w.year)}</p>
        </header>
        <div class="proj-imgs">${w.rows.map((r, ri) => rowHTML(w, r, ri)).join('')}</div>
      </article>`).join('');
  }).join('');

  // 另一份作品集
  const o = SITE.other;
  $('.other').innerHTML = o ? `
    <a class="other-card" href="${esc(o.url)}" target="_blank" rel="noopener">
      <img src="img/${o.img}.webp" width="1200" height="630" loading="lazy" alt="${esc(o.title)}">
      <span class="other-t"><small>${ed('other.label', o.label)}</small><b>${ed('other.title', o.title)}</b><span>${ed('other.url', o.url)} ↗</span></span>
    </a>` : '';

  // 聯絡、頁尾
  $('.contact-links').innerHTML = `<a href="mailto:${esc(SITE.mail)}">${ed('mail', SITE.mail)}</a><a href="https://line.me/ti/p/~${esc(SITE.line)}" target="_blank" rel="noopener">LINE　${ed('line', SITE.line)}</a>`;
  $('.foot').textContent = `© ${SITE.name} ${SITE.en}`;

  // 上方列顯示目前看到哪個專案
  observers.forEach((o) => o.disconnect());
  const now = $('.bar-now');
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) now.textContent = e.target.dataset.title || '';
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('.proj').forEach((p) => io.observe(p));
  const clear = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) now.textContent = '';
  }, { rootMargin: '-45% 0px -50% 0px' });
  [$('#contact'), ...document.querySelectorAll('.cat')].forEach((el) => clear.observe(el));
  observers = [io, clear];
  if (window.afterRender) window.afterRender();
}
render();

// 燈箱：點圖看 2400px 大圖，左右鍵／滑動換張，只在同一個專案裡切換（編輯模式不開）
const lb = $('.lb'), lbImg = $('.lb img'), lbCap = $('.lb figcaption');
let list = [], at = 0;
function show(k) {
  at = (k + list.length) % list.length;
  lbImg.src = src(list[at], true);
  lbCap.textContent = `${at + 1} / ${list.length}`;
}
function open(n, proj) {
  const w = WORKS.find((x) => x.id === proj);
  list = w ? imgsOf(w) : [n];
  lb.hidden = false;
  document.body.classList.add('lb-on');
  show(list.indexOf(n));
}
function close() { lb.hidden = true; document.body.classList.remove('lb-on'); lbImg.removeAttribute('src'); }
document.addEventListener('click', (e) => {
  if (document.body.classList.contains('editing')) return;
  const t = e.target.closest('.proj-imgs img');
  if (t) open(t.dataset.n, t.closest('.proj').id);
});
$('.lb-x').onclick = close;
$('.lb-prev').onclick = () => show(at - 1);
$('.lb-next').onclick = () => show(at + 1);
lb.addEventListener('click', (e) => { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
document.addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') show(at - 1);
  if (e.key === 'ArrowRight') show(at + 1);
});
let x0 = null;
lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
  x0 = null;
});
