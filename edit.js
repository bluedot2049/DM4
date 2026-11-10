// 編輯模式：只有能編輯這個作品集的人（擁有者）看得到右下角「編輯」
// 字：直接點了改；圖：◀ ▶ 移動、✕ 刪掉、大圖（移到該列第一張）；列：併入上一列、拆開、拼貼；
// 專案：↑ ↓、換分類、底色、＋加圖、刪除；分類：＋新增專案。
// 「儲存」把 works.js、img/sizes.js 和新加的圖存成作品集的新版本（同一個連結）。
// 本機打開（file://）加 ?edit 可以試編輯，但存不了。
(() => {
  let artifact = null, editing = false, dirty = false, saving = false;
  const PENDING = {};   // 新加的圖：路徑 → Blob，存檔時一起送

  const bar = document.createElement('div');
  bar.className = 'edbar';
  bar.hidden = true;
  bar.innerHTML = `<span class="ed-msg"></span><button class="ed-save" hidden>儲存</button><button class="ed-cancel" hidden>取消</button><button class="ed-toggle">編輯</button>`;
  document.body.append(bar);
  const msg = (t) => { bar.querySelector('.ed-msg').textContent = t; };
  const [bSave, bCancel, bToggle] = ['.ed-save', '.ed-cancel', '.ed-toggle'].map((s) => bar.querySelector(s));

  (async () => {
    let can = /[?&]edit\b/.test(location.search);
    if (window.claude && claude.use) {
      artifact = await claude.use('artifact');
      const user = await claude.use('user');
      if (user) can = can || await user.canEdit();
    }
    if (can) bar.hidden = false;
  })();

  function setDirty() { dirty = true; msg('有改動，記得儲存'); }
  // 作品集在 claude.ai 的框架裡跑，confirm() 會被擋掉（直接當成取消），所以改成「3 秒內再按一次」
  function twice(b, label) {
    if (b.dataset.sure) return true;
    const old = b.textContent;
    b.dataset.sure = '1'; b.textContent = label; b.classList.add('sure');
    setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = old; b.classList.remove('sure'); } }, 3000);
    return false;
  }
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  bToggle.onclick = () => {
    editing = !editing;
    document.body.classList.toggle('editing', editing);
    bToggle.textContent = editing ? '看成品' : '編輯';
    bSave.hidden = bCancel.hidden = !editing;
    msg(editing ? '點字直接改；滑到圖上有按鈕' : (dirty ? '有改動，記得儲存' : ''));
    render();
  };
  bCancel.onclick = () => {
    if (dirty && !twice(bCancel, '再按一次放棄改動')) return;
    dirty = false; location.reload();
  };

  // ---------- 資料操作 ----------
  const W = (id) => WORKS.find((w) => w.id === id);
  const list = (r) => (Array.isArray(r) ? r : r.imgs || r.mosaic);
  function setList(w, ri, arr) {
    const r = w.rows[ri];
    if (!arr.length) { w.rows.splice(ri, 1); return; }
    if (Array.isArray(r)) w.rows[ri] = arr;
    else if (r.mosaic) w.rows[ri] = arr.length >= 3 ? { ...r, mosaic: arr } : arr;
    else w.rows[ri] = { ...r, imgs: arr };
  }
  function where(w, n) {
    for (let ri = 0; ri < w.rows.length; ri++) {
      const r = w.rows[ri];
      if (typeof r === 'string') continue;
      const k = list(r).indexOf(n);
      if (k >= 0) return [ri, k];
    }
    return null;
  }
  function moveImg(w, n, d) {
    const pos = [];
    w.rows.forEach((r, ri) => { if (typeof r !== 'string') list(r).forEach((_, k) => pos.push([ri, k])); });
    const i = pos.findIndex(([ri, k]) => list(w.rows[ri])[k] === n), j = i + d;
    if (i < 0 || j < 0 || j >= pos.length) return;
    const a = list(w.rows[pos[i][0]]), b = list(w.rows[pos[j][0]]);
    [a[pos[i][1]], b[pos[j][1]]] = [b[pos[j][1]], a[pos[i][1]]];
  }
  function delImg(w, n) {
    const p = where(w, n);
    if (!p) return;
    const arr = list(w.rows[p[0]]).filter((x) => x !== n);
    setList(w, p[0], arr);
    if (w.cover === n) w.cover = imgsOf(w)[0] || '';
  }
  function setField(f, v) {
    const p = f.split('.');
    if (p[0] === 'w') { const w = W(p[1]); if (w) w[p[2]] = v; }
    else if (p[0] === 'cat') CATS[+p[1]][p[2]] = v;
    else if (p[0] === 'other') SITE.other[p[1]] = v;
    else SITE[p[0]] = v;
  }
  function moveProj(w, d) {
    const same = WORKS.filter((x) => x.cat === w.cat);
    const o = same[same.indexOf(w) + d];
    if (!o) return;
    const i = WORKS.indexOf(w), j = WORKS.indexOf(o);
    [WORKS[i], WORKS[j]] = [WORKS[j], WORKS[i]];
  }
  const fgFor = (hex) => {
    const v = parseInt(hex.slice(1), 16), r = v >> 16, g = (v >> 8) & 255, b = v & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#222222' : '#efe9e0';
  };

  // 新加的圖：在瀏覽器裡縮成長邊 2400／1000 的 webp
  async function addImages(w, files) {
    msg('處理圖片中…');
    const names = [];
    for (const [k, file] of [...files].entries()) {
      try {
        const bmp = await createImageBitmap(file);
        const out = [];
        for (const max of [2400, 1000]) {
          const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
          const c = document.createElement('canvas');
          c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
          const x = c.getContext('2d');
          x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
          x.drawImage(bmp, 0, 0, c.width, c.height);
          out.push([await new Promise((ok) => c.toBlob(ok, 'image/webp', 0.82)), c.width, c.height]);
        }
        const n = 'u' + Date.now().toString(36) + k;
        PENDING[`img/${n}.webp`] = out[0][0];
        PENDING[`img/${n}-s.webp`] = out[1][0];
        LOCALSRC[n] = [URL.createObjectURL(out[0][0]), URL.createObjectURL(out[1][0])];
        SIZES[n] = [out[1][1], out[1][2]];
        names.push(n);
      } catch (e) { msg(`有一張讀不了：${file.name}`); }
    }
    for (let i = 0; i < names.length; i += 3) w.rows.push(names.slice(i, i + 3));
    if (!w.cover && names[0]) w.cover = names[0];
    if (names.length) { setDirty(); render(); }
  }

  // ---------- 編輯模式的按鈕 ----------
  const btn = (act, label, title = '') => `<button type="button" data-act="${act}" title="${title}">${label}</button>`;
  window.afterRender = () => {
    if (!editing) return;
    document.querySelectorAll('[data-f]').forEach((el) => { el.contentEditable = 'true'; el.spellcheck = false; });
    document.querySelectorAll('.proj-imgs .cell').forEach((c) => {
      c.insertAdjacentHTML('beforeend', `<div class="ctl">${btn('left', '◀', '往前')}${btn('right', '▶', '往後')}${btn('first', '大圖', '移到這列第一張（拼貼時就是大圖）')}${btn('del', '✕', '刪掉這張')}</div>`);
    });
    document.querySelectorAll('.proj-imgs > [data-ri]').forEach((r) => {
      const n = r.querySelectorAll('.cell').length;
      r.insertAdjacentHTML('afterbegin', `<div class="rowctl">${+r.dataset.ri > 0 ? btn('merge', '併入上一列') : ''}${n > 1 ? btn('split', '拆開') : ''}${n >= 3 ? btn('mosaic', r.classList.contains('mosaic') ? '取消拼貼' : '拼貼') : ''}${r.classList.contains('mosaic') ? btn('flip', '大圖換邊') : ''}${r.tagName === 'H3' ? btn('delrow', '刪掉小標') : ''}</div>`);
    });
    document.querySelectorAll('.proj').forEach((p) => {
      const w = W(p.dataset.w);
      p.querySelector('.proj-head').insertAdjacentHTML('beforeend', `<div class="projctl">
        ${btn('up', '↑', '往上移')}${btn('down', '↓', '往下移')}
        <select data-act="cat" title="分類">${CATS.map((c) => `<option value="${c.id}"${c.id === w.cat ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        <label class="ed-color" title="底色"><input type="color" data-act="bg" value="${/^#[0-9a-f]{6}$/i.test(w.bg) ? w.bg : '#eeeeee'}"></label>
        <label class="ed-add">＋加圖<input type="file" accept="image/*" multiple data-act="add" hidden></label>
        ${btn('delproj', '刪除專案')}</div>`);
      if (!w.rows.length) p.querySelector('.proj-imgs').innerHTML = '<p class="ed-empty">還沒有圖，按「＋加圖」</p>';
    });
    document.querySelectorAll('.cat').forEach((c) => c.insertAdjacentHTML('beforeend', `<div class="catctl">${btn('newproj', '＋新增專案')}</div>`));
  };

  // 打字：只改資料，不重畫（不然游標會跳）
  document.addEventListener('input', (e) => {
    const el = e.target.closest && e.target.closest('[data-f]');
    if (!editing || !el) return;
    setField(el.dataset.f, el.textContent.trim());
    setDirty();
  });
  document.addEventListener('keydown', (e) => {
    if (editing && e.key === 'Enter' && e.target.closest && e.target.closest('[data-f]')) { e.preventDefault(); e.target.blur(); }
  });
  // 編輯時連結不跳頁
  document.addEventListener('click', (e) => {
    if (!editing) return;
    if (e.target.closest('a') && !e.target.closest('.edbar')) e.preventDefault();
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const act = b.dataset.act, p = b.closest('.proj'), w = p && W(p.dataset.w);
    const n = b.closest('.cell')?.querySelector('img')?.dataset.n;
    const ri = +b.closest('[data-ri]')?.dataset.ri;
    if (act === 'left') moveImg(w, n, -1);
    else if (act === 'right') moveImg(w, n, 1);
    else if (act === 'del') delImg(w, n);
    else if (act === 'first') {
      const pos = where(w, n);
      if (!pos) return;
      const arr = list(w.rows[pos[0]]).filter((x) => x !== n);
      setList(w, pos[0], [n, ...arr]);
    }
    else if (act === 'merge') {
      let j = ri - 1;
      if (typeof w.rows[j] === 'string') return;
      w.rows[j] = [...list(w.rows[j]), ...list(w.rows[ri])];
      w.rows.splice(ri, 1);
    } else if (act === 'split') w.rows.splice(ri, 1, ...list(w.rows[ri]).map((x) => [x]));
    else if (act === 'mosaic') w.rows[ri] = w.rows[ri].mosaic ? [...w.rows[ri].mosaic] : { mosaic: [...list(w.rows[ri])] };
    else if (act === 'flip') w.rows[ri] = { ...w.rows[ri], flip: !w.rows[ri].flip };
    else if (act === 'delrow') w.rows.splice(ri, 1);
    else if (act === 'up') moveProj(w, -1);
    else if (act === 'down') moveProj(w, 1);
    else if (act === 'delproj') { if (!twice(b, '再按一次刪除')) return; WORKS.splice(WORKS.indexOf(w), 1); }
    else if (act === 'newproj') {
      const cat = b.closest('.cat').dataset.cat;
      const nw = { id: 'p' + Date.now().toString(36), cat, title: '新專案', en: 'New Project', sub: '業主', year: String(new Date().getFullYear()), cover: '', bg: '#ece8e1', fg: '#222222', rows: [] };
      const lastOf = WORKS.map((x) => x.cat).lastIndexOf(cat);
      WORKS.splice(lastOf + 1, 0, nw);
      setDirty(); render();
      document.getElementById(nw.id)?.scrollIntoView({ block: 'center' });
      return;
    } else return;
    setDirty(); render();
  }, true);
  document.addEventListener('change', (e) => {
    if (!editing) return;
    const t = e.target, p = t.closest('.proj'), w = p && W(p.dataset.w);
    if (!w) return;
    if (t.dataset.act === 'cat') { w.cat = t.value; setDirty(); render(); document.getElementById(w.id)?.scrollIntoView({ block: 'center' }); }
    if (t.dataset.act === 'add' && t.files.length) addImages(w, t.files);
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!editing || t.dataset?.act !== 'bg') return;
    const p = t.closest('.proj'), w = W(p.dataset.w);
    w.bg = t.value; w.fg = fgFor(t.value);
    p.style.setProperty('--bg', w.bg); p.style.setProperty('--fg', w.fg);
    setDirty();
  });

  // ---------- 存檔：重寫 works.js、img/sizes.js，加上新圖 ----------
  const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
  function lit(v, ind = '') {
    if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ')}'`;
    if (typeof v !== 'object' || v === null) return String(v);
    const flat = (x) => typeof x !== 'object' || x === null || (Array.isArray(x) && x.every((y) => typeof y === 'string'));
    const inner = ind + '  ';
    if (Array.isArray(v)) {
      if (v.every((x) => typeof x === 'string')) return `[${v.map((x) => lit(x)).join(', ')}]`;
      return `[\n${v.map((x) => inner + lit(x, inner)).join(',\n')},\n${ind}]`;
    }
    const ks = Object.keys(v).filter((k) => v[k] !== undefined);
    if (ks.every((k) => flat(v[k]))) {
      const one = `{ ${ks.map((k) => `${key(k)}: ${lit(v[k])}`).join(', ')} }`;
      if (one.length < 120 || !ks.some((k) => Array.isArray(v[k]))) return one;
    }
    return `{\n${ks.map((k) => `${inner}${key(k)}: ${lit(v[k], inner)}`).join(',\n')},\n${ind}}`;
  }
  function worksJS() {
    return [
      `// 頁面上所有的字和圖都在這裡（網頁上按「編輯」改完存檔會重寫這個檔，${new Date().toLocaleString('zh-TW')}）`,
      `// rows：每一列放幾張圖就並排幾張，高度自動對齊；{ mosaic: [大, 小, 小…] } 是拼貼（小圖 4 張排 2×2、9 張排 3×3），flip: true 大圖在右`,
      `// 字一律中英並列；CATS 的 nav 是上方列用的短名`,
      `// 圖片名字對應 img/<名字>.webp（長邊 2400）和 img/<名字>-s.webp（長邊 1000）`,
      '',
      `const SITE = ${lit(SITE)};`, '',
      `const CATS = ${lit(CATS)};`, '',
      `const WORKS = ${lit(WORKS)};`, '',
    ].join('\n');
  }

  bSave.onclick = async () => {
    if (saving) return;
    if (!artifact) { msg('這裡是本機預覽，存不了；請在 claude.ai 的作品集連結上編輯'); return; }
    saving = true; bSave.disabled = true; msg('儲存中…');
    const files = {
      'works.js': { content: worksJS(), contentType: 'text/javascript' },
      'img/sizes.js': { content: 'window.SIZES=' + JSON.stringify(SIZES) + ';\n', contentType: 'text/javascript' },
      ...PENDING,
    };
    try {
      await artifact.publish(files);
      for (const k in PENDING) delete PENDING[k];
      dirty = false; msg('存好了，連結已更新');
    } catch (e) {
      const c = e && e.code;
      if (c === 'conflict') msg('別處剛存過新版本，頁面會重新載入');
      else if (c === 'not_writer' || c === 'not_granted' || c === 'consent_required') msg('這個檢視沒有儲存權限');
      else if (c === 'capability_disabled' || c === 'capability_removed') msg('這裡不能儲存（分享成公開連結時無法編輯）');
      else if (c === 'too_large') msg('檔案太大，少加幾張圖再存');
      else if (c === 'rate_limited') msg('存太頻繁了，等一下再按');
      else msg('沒存成功，再按一次儲存');
    }
    saving = false; bSave.disabled = false;
  };
})();
