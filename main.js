// 讀 works.js 把頁面組起來：每個專案的圖（開頭直接是個人作品的大圖＋小圖拼貼）、另一份作品集、燈箱
// render() 可以重跑（編輯模式改完資料就重畫、手機／桌機切換也重畫）；data-f 是可編輯的字、data-n 是圖
// 手機（640px 以下）：攤開圖橫向拖、多張橫幅與標 swipe 的列改成橫滑輪播、底部分類列、燈箱可縮放
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const size = (n) => (window.SIZES && SIZES[n]) || [1000, 1000];
const arOf = (n) => size(n)[0] / size(n)[1];
window.LOCALSRC = window.LOCALSRC || {};   // 編輯時剛加、還沒存的圖：名字 → 本機網址
const src = (n, big) => LOCALSRC[n] ? LOCALSRC[n][big ? 0 : 1] : `img/${n}${big ? '' : '-s'}.webp`;
// 一個專案裡所有的圖（列可以是陣列、{ imgs: [...] } 或 { mosaic: [...] }）
const imgsOf = (w) => w.rows.filter((r) => typeof r !== 'string').flatMap((r) => (Array.isArray(r) ? r : r.imgs || r.mosaic));
const ed = (f, text, tag = 'span') => `<${tag} data-f="${f}">${esc(text)}</${tag}>`;
const PHONE = matchMedia('(max-width: 640px)');
const phone = () => PHONE.matches && !document.body.classList.contains('editing');

function img(n, sizes, alt = '') {
  if (!n) return '<span class="noimg"></span>';
  const [w, h] = size(n);
  const set = LOCALSRC[n] ? '' : ` srcset="img/${n}-s.webp 1000w, img/${n}.webp 2400w" sizes="${sizes}"`;
  return `<img src="${src(n)}"${set} width="${w}" height="${h}" loading="lazy" decoding="async" alt="${esc(alt)}" data-n="${n}">`;
}

// 手機的橫滑列：一張很寬的圖 → 放大後左右拖著看；多張 → 一張一張滑（看得到下一張的邊）
function swipeHTML(w, list, ri, pan) {
  const ars = list.map(arOf), maxAr = Math.max(...ars);
  const h = pan ? Math.min(100, Math.max(70, 40 * maxAr)) : Math.min(100, 86 / maxAr);   // 圖高（vw）
  return `<div class="swipe${pan ? ' pan' : ''}" data-ri="${ri}" style="--h:${h.toFixed(1)}vw"><div class="track">${list.map((n, i) =>
    `<div class="cell" style="--ar:${ars[i].toFixed(4)}">${img(n, `${Math.round(h * ars[i])}vw`, w.title)}</div>`).join('')}</div>` +
    `<span class="hint">滑動 Swipe →</span>${pan ? '' : `<span class="count">1 / ${list.length}</span>`}</div>`;
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
  if (phone() && list.length) {
    const wide = Math.max(...list.map(arOf)) >= 1.5;
    if (list.length === 1 && wide) return swipeHTML(w, list, ri, true);
    if (list.length > 1 && (wide || r.swipe)) return swipeHTML(w, list, ri, false);
  }
  const total = list.reduce((a, n) => a + arOf(n), 0);
  return `<div class="row n${list.length}" data-ri="${ri}" style="--ar:${total.toFixed(4)}${width}">${list.map((n) => {
    const ar = arOf(n);
    const vw = Math.round((ar / total) * 100);
    return `<div class="cell" style="flex:${ar.toFixed(4)} 1 0">${img(n, `(max-width: 640px) 100vw, ${Math.min(vw, 100)}vw`, w.title)}</div>`;
  }).join('')}</div>`;
}

let observers = [];
function render() {
  // 上方列（中文短名＋英文，窄螢幕只留中文）；手機另有底部分類列
  $('.bar-name').innerHTML = `${ed('name', SITE.name)} <span>${ed('en', SITE.en)}</span>`;
  const links = [...CATS.map((c) => [`#cat-${c.id}`, c.nav || c.name, c.en]), ['#contact', '聯絡', 'Contact']];
  $('.bar-nav').innerHTML = links.map(([h, zh, en]) => `<a href="${h}">${esc(zh)}<span class="en"> ${esc(en)}</span></a>`).join('');
  $('.tabs').innerHTML = links.map(([h, zh, en]) => `<a href="${h}"><b>${esc(zh)}</b><small>${esc(en)}</small></a>`).join('');

  // 專案；每個分類開頭一個分隔
  $('#projects').innerHTML = CATS.map((c, ci) => {
    const ws = WORKS.filter((w) => w.cat === c.id);
    return `<section class="cat" id="cat-${c.id}" data-cat="${c.id}"><h2>${ed(`cat.${ci}.name`, c.name, 'span')}</h2><p>${esc(c.en)}</p></section>` +
      ws.map((w) => `
      <article class="proj" id="${w.id}" data-w="${w.id}" style="--bg:${w.bg};--fg:${w.fg}" data-title="${esc(w.title)}">
        <header class="proj-head">
          <h2>${ed(`w.${w.id}.title`, w.title)} ${ed(`w.${w.id}.en`, w.en || '', 'small')}</h2>
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

  // 橫滑列：滑了就收起提示、更新張數
  document.querySelectorAll('.swipe').forEach((s) => {
    const t = $('.track', s), cnt = $('.count', s), cells = [...t.children];
    t.addEventListener('scroll', () => {
      s.classList.add('moved');
      if (!cnt) return;
      const x = t.scrollLeft + 24;
      let k = 0;
      cells.forEach((c, i) => { if (c.offsetLeft - t.offsetLeft <= x) k = i; });
      if (t.scrollLeft + t.clientWidth >= t.scrollWidth - 4) k = cells.length - 1;
      cnt.textContent = `${k + 1} / ${cells.length}`;
    }, { passive: true });
  });
  spy();
  if (window.afterRender) window.afterRender();
}

// 目前在哪個分類：上方列、底部分類列對應的那顆亮起來
function spy() {
  const y = innerHeight * 0.4;
  let cur = '';
  document.querySelectorAll('.cat').forEach((c) => { if (c.getBoundingClientRect().top < y) cur = '#' + c.id; });
  const ct = $('#contact');
  if (ct.getBoundingClientRect().top < innerHeight * 0.85 || innerHeight + scrollY >= document.documentElement.scrollHeight - 8) cur = '#contact';
  document.querySelectorAll('.bar-nav a, .tabs a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === cur));
}
let spyQ = false;
addEventListener('scroll', () => { if (!spyQ) { spyQ = true; requestAnimationFrame(() => { spyQ = false; spy(); }); } }, { passive: true });
PHONE.addEventListener('change', () => render());
render();

// ---------- 燈箱 ----------
// 點圖看大圖；左右滑／左右鍵換張、往下滑關閉、雙指或點兩下放大（放大後拖著看）；只在同一個專案裡切換（編輯模式不開）
const lb = $('.lb'), lbImg = $('.lb img'), lbCap = $('.lb figcaption'), lbHint = $('.lb-hint');
let list = [], at = 0;
let z = { s: 1, x: 0, y: 0 };
function applyZ(anim) {
  lbImg.style.transition = anim ? 'transform .22s ease' : 'none';
  lbImg.style.transform = z.s === 1 && !z.x && !z.y ? '' : `translate(${z.x}px, ${z.y}px) scale(${z.s})`;
  lb.classList.toggle('zoomed', z.s > 1);
}
function resetZ(anim) { z = { s: 1, x: 0, y: 0 }; applyZ(anim); lb.style.removeProperty('--fade'); }
// 放大後不能拖出畫面外
function clampZ() {
  const w = lbImg.offsetWidth * z.s, h = lbImg.offsetHeight * z.s;
  const mx = Math.max(0, (w - innerWidth) / 2), my = Math.max(0, (h - innerHeight) / 2);
  z.x = Math.min(mx, Math.max(-mx, z.x));
  z.y = Math.min(my, Math.max(-my, z.y));
}
// 以螢幕上某一點為中心縮放
function zoomAt(px, py, s) {
  const r = lbImg.getBoundingClientRect();
  const cx = r.left + r.width / 2 - z.x, cy = r.top + r.height / 2 - z.y;   // 沒位移時圖的中心
  const lx = (px - cx - z.x) / z.s, ly = (py - cy - z.y) / z.s;            // 這一點在圖上的位置
  z.s = s; z.x = px - cx - lx * s; z.y = py - cy - ly * s;
  if (s <= 1) z = { s: 1, x: 0, y: 0 };
  clampZ();
}

function show(k) {
  at = (k + list.length) % list.length;
  resetZ(false);
  lbImg.src = src(list[at], true);
  lbCap.textContent = `${at + 1} / ${list.length}`;
}
let hinted = false;
try { hinted = !!sessionStorage.getItem('lb-hint'); } catch (e) {}
function open(n, proj) {
  const w = WORKS.find((x) => x.id === proj);
  list = w ? imgsOf(w) : [n];
  lb.hidden = false;
  document.body.classList.add('lb-on');
  show(list.indexOf(n));
  // 第一次打開（觸控螢幕）提示操作方式
  if (!hinted && matchMedia('(pointer: coarse)').matches) {
    hinted = true;
    try { sessionStorage.setItem('lb-hint', '1'); } catch (e) {}
    lbHint.hidden = false;
    setTimeout(() => { lbHint.hidden = true; }, 2600);
  }
}
function close() { lb.hidden = true; lbHint.hidden = true; document.body.classList.remove('lb-on'); lbImg.removeAttribute('src'); resetZ(false); }
document.addEventListener('click', (e) => {
  if (document.body.classList.contains('editing')) return;
  const t = e.target.closest('.proj-imgs img');
  if (t) open(t.dataset.n, t.closest('.proj').id);
});
$('.lb-x').onclick = close;
$('.lb-prev').onclick = () => show(at - 1);
$('.lb-next').onclick = () => show(at + 1);
lb.addEventListener('click', (e) => { if (z.s === 1 && (e.target === lb || e.target.tagName === 'FIGURE')) close(); });
document.addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') show(at - 1);
  if (e.key === 'ArrowRight') show(at + 1);
});

// 滑鼠：點兩下放大／縮回，放大後拖著看
lbImg.addEventListener('dblclick', (e) => { zoomAt(e.clientX, e.clientY, z.s > 1 ? 1 : 2.5); applyZ(true); });
let drag = null;
lbImg.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || z.s === 1) return;
  e.preventDefault();
  drag = { x: e.clientX - z.x, y: e.clientY - z.y };
});
addEventListener('pointermove', (e) => { if (drag) { z.x = e.clientX - drag.x; z.y = e.clientY - drag.y; clampZ(); applyZ(false); } });
addEventListener('pointerup', () => { drag = null; });

// 觸控：一指滑（換張／下滑關閉）、放大後一指拖、雙指縮放、點兩下放大
const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
const mid = (t) => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
let g = null, lastTap = null;
lb.addEventListener('touchstart', (e) => {
  if (e.target.closest('button')) return;
  const t = e.touches;
  if (t.length === 2) {
    const [mx, my] = mid(t);
    g = { mode: 'pinch', d: dist(t), s: z.s, px: mx, py: my };
  } else if (t.length === 1) {
    g = { mode: z.s > 1 ? 'pan' : 'swipe', sx: t[0].clientX, sy: t[0].clientY, x: z.x, y: z.y, dir: null, t: Date.now(), moved: false };
  }
}, { passive: true });
lb.addEventListener('touchmove', (e) => {
  if (!g) return;
  e.preventDefault();
  const t = e.touches;
  if (g.mode === 'pinch' && t.length === 2) {
    const [mx, my] = mid(t);
    zoomAt(g.px, g.py, Math.min(5, Math.max(1, g.s * dist(t) / g.d)));
    z.x += mx - g.px; z.y += my - g.py; g.px = mx; g.py = my;
    clampZ(); applyZ(false);
    return;
  }
  if (t.length !== 1 || g.mode === 'pinch') return;
  const dx = t[0].clientX - g.sx, dy = t[0].clientY - g.sy;
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) g.moved = true;
  if (g.mode === 'pan') { z.x = g.x + dx; z.y = g.y + dy; clampZ(); applyZ(false); return; }
  if (!g.dir && g.moved) g.dir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  if (g.dir === 'x') { z.x = dx; applyZ(false); }
  if (g.dir === 'y' && dy > 0) { z.y = dy; applyZ(false); lb.style.setProperty('--fade', Math.max(0.3, 1 - dy / 400).toFixed(2)); }
}, { passive: false });
lb.addEventListener('touchend', (e) => {
  if (!g || e.touches.length) { if (g && g.mode === 'pinch' && e.touches.length === 1) g = null; return; }
  const c = e.changedTouches[0];
  const dx = c.clientX - g.sx, dy = c.clientY - g.sy;
  if (g.mode === 'swipe') {
    if (g.dir === 'x' && Math.abs(dx) > 60) show(at + (dx < 0 ? 1 : -1));
    else if (g.dir === 'y' && dy > 110) close();
    else resetZ(true);
  } else if (g.mode === 'pinch' && z.s < 1.05) resetZ(true);
  // 點兩下：放大 2.5 倍／縮回
  if (!g.moved && g.mode !== 'pinch' && e.target === lbImg) {
    const now = Date.now();
    if (lastTap && now - lastTap.t < 320 && Math.hypot(c.clientX - lastTap.x, c.clientY - lastTap.y) < 30) {
      zoomAt(c.clientX, c.clientY, z.s > 1 ? 1 : 2.5); applyZ(true); lastTap = null;
    } else lastTap = { t: now, x: c.clientX, y: c.clientY };
  }
  g = null;
});
