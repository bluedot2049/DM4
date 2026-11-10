// 無頭 Edge 拍整頁：node tools/shot.mjs [寬=390] [名字=phone] [--draw 拍線條畫到一半]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const opt = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const ROOT = opt('root') ?? HERE, PAGE = opt('path') ?? '/';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const args = process.argv.slice(2);
const draw = args.includes('--draw');
const [W = '390', NAME = 'phone'] = args.filter((a) => !a.startsWith('--'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { '.mp4': 'video/mp4', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, b) => {
    if (e) { console.log('404', q.url); r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    r.end(b);
  });
}).listen(0);
const PORT = srv.address().port, DBG = 9400 + Math.floor(Math.random() * 400);

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-'));
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${prof}`, '--window-size=1280,900', '--autoplay-policy=no-user-gesture-required', 'about:blank']);
let tgt;
for (let i = 0; i < 60 && !tgt; i++) {
  try { tgt = (await (await fetch(`http://127.0.0.1:${DBG}/json`)).json()).find((t) => t.type === 'page'); } catch {}
  if (!tgt) await sleep(500);
}
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const wait = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') console.log('頁面錯誤', JSON.stringify(d.params.exceptionDetails).slice(0, 400));
  if (d.method === 'Runtime.consoleAPICalled' && process.argv.includes('--log')) console.log('console', d.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Runtime.enable');
await send('Page.enable');
const phone = +W < 700;
await send('Emulation.setDeviceMetricsOverride', { width: +W, height: phone ? 844 : 900, deviceScaleFactor: phone ? 2 : 1, mobile: phone });
if (!draw) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
// --pre=檔案：頁面載入前先跑（假的桌面後端之類）；--eval=式子：拍之前印出結果
if (opt('pre')) await send('Page.addScriptToEvaluateOnNewDocument', { source: fs.readFileSync(opt('pre'), 'utf8') });
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${PAGE}` });
await sleep(1500);
await ev(`document.fonts.ready.then(() => Promise.all([...document.images].map((i) => (i.loading = 'eager', i.decode().catch(() => {})))))`);
if (draw) await sleep(1100);
else await sleep(500);
if (opt('eval')) console.log('eval', JSON.stringify(await ev(opt('eval'))).slice(0, 1500));
if (opt('wait')) await sleep(+opt('wait'));
// --sections：每個區塊各拍一張（整頁超過 16000px 會重複，分段拍才準）
if (args.includes('--sections')) {
  const boxes = await ev(`[...document.querySelectorAll('.hero,#works,.cat,.proj,.other,#contact')].map((e) => { const r = e.getBoundingClientRect(); return [e.id || e.className, r.top + scrollY, r.height, document.documentElement.clientWidth]; })`);
  const outd = path.join(HERE, 'tools', 'out'); fs.mkdirSync(outd, { recursive: true });
  for (const [nm, y, h, w] of boxes) {
    const scale = Math.min(1, 6000 / h, phone ? 0.5 : 0.6);
    const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 75, captureBeyondViewport: true, clip: { x: 0, y, width: w, height: h, scale } });
    fs.writeFileSync(path.join(outd, `${NAME}-${nm}.jpg`), Buffer.from(s.result.data, 'base64'));
    console.log('存好', nm, Math.round(h));
  }
  ws.close(); srv.close(); edge.kill(); setTimeout(() => process.exit(0), 800);
} else {
const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: !draw && !opt('root') });
const out = path.join(HERE, 'tools', 'out');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, `${NAME}.jpg`), Buffer.from(shot.result.data, 'base64'));
console.log('存好', path.join(out, `${NAME}.jpg`), await ev('document.documentElement.scrollHeight'));
ws.close(); srv.close(); edge.kill();
setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(0); }, 800);
}
