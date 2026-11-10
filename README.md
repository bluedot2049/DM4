# 吳承恩 Darien 插畫作品集（一頁式）

純圖像作品集，參考 Behance 個人頁＋專案頁，但全部放在同一頁：個人作品（一張大圖＋旁邊 3×3 小圖當首頁，沒有橫幅） → 海報／印刷 → 專輯設計製作 → R18（只放自製 R18 視覺小說遊戲的角色圖） → 聯絡。

## 檔案

```
index.html   骨架（字不寫在這裡）
works.js     頁面上所有的字、每個專案放哪些圖、怎麼排（改字、換圖、調順序改這個）
main.js      組頁面、上方列顯示目前專案、點圖開燈箱（左右鍵／滑動換張）
style.css    樣式；每個專案的底色在 works.js 的 bg / fg
img/         tools/pics.py 產生：<名字>.webp 長邊 2400（燈箱）、<名字>-s.webp 長邊 1000（頁面）、sizes.js 寬高
tools/       pics.py 轉圖、shot.mjs 截圖
```

## 換圖

1. 在 `tools/pics.py` 的 `PICS` 加一行：`'名字': (原檔路徑, {})`，可加 `crop`、`bg`、`pad`。
2. `python tools/pics.py`（只做新的）或 `python tools/pics.py 名字`（重做那張）。
3. 在 `works.js` 某個專案的 `rows` 放進 `'名字'`。同一列幾張就並排幾張，高度自動對齊。

## 截圖檢查

```
node tools/shot.mjs 1280 d --sections   # 桌機，每個區塊一張 → tools/out/d-*.jpg
node tools/shot.mjs 390 p --sections    # 手機
```

整頁一次拍超過約 16000px 會重複，所以分區塊拍。

## 選圖原則

- 每張只留一個版本，用最高解析度的原檔（BLUEDOT 用 PRINT2020／2021PRINT 的印刷檔）。
- 不用：NSFW、描真人或影劇畫面的圖（DARK 插圖699 系列、random 的肖像）。
- 字只留：每個專案的標題、副標（業主或系列）、年份。不寫說明、標籤、關於。
- 字一律中英並列，冷靜、短。

## 網頁上直接編輯

發布在 claude.ai 的版本，擁有者右下角會有「編輯」：點字直接改；滑到圖上有 ◀ ▶（移動）、大圖（移到該列第一張）、✕（刪掉）；每列有「併入上一列／拆開／拼貼」；專案有 ↑ ↓、換分類、底色、＋加圖、刪除專案；分類旁有「＋新增專案」。按「儲存」會把 works.js、img/sizes.js 和新加的圖（瀏覽器裡縮成 2400／1000 webp）存成同一個連結的新版本（edit.js）。
在網頁上存過之後，本機的 works.js 會變舊：請 Claude 用 Artifact read 把線上的 works.js（和新加的 img/u*.webp）抓回來再改。
本機打開 index.html?edit 可以試編輯，但存不了。
