// يبني موقع القراءة من ملفات chapters/NNN.md إلى مجلد site/
// الاستخدام: node build.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'chapters');
const OUT = path.join(ROOT, 'site');
const TITLE = 'نظام السيادة الحضارية';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

function render(md) {
  const blocks = md.replace(/\r/g, '').split(/\n\s*\n/);
  let title = '';
  const html = [];
  for (const raw of blocks) {
    const b = raw.trim();
    if (!b) continue;
    if (b.startsWith('# ')) { title = b.slice(2).trim(); continue; }
    if (b === '***') { html.push('<div class="break">✦ ✦ ✦</div>'); continue; }
    if (b.startsWith('>')) {
      const lines = b.split('\n').map((l) => l.replace(/^>\s?/, ''));
      html.push('<div class="sys">' + lines.map((l) => `<div>${inline(l)}</div>`).join('') + '</div>');
      continue;
    }
    html.push(`<p>${inline(b).replace(/\n/g, '<br>')}</p>`);
  }
  return { title, body: html.join('\n') };
}

const page = (title, body, extra = '') => `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#8a4b1f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="السيادة الحضارية">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icon-192.png">
<link rel="icon" type="image/png" href="/icon-192.png">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&family=Reem+Kufi:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;var f=localStorage.getItem('fs');if(f)document.documentElement.style.setProperty('--fs',f+'px')}catch(e){}</script>
</head>
<body>
<div class="progress" id="progress"></div>
<header class="bar">
  <a class="home" href="/">${TITLE}</a>
  <div class="tools">
    <button onclick="fsz(-1)" aria-label="تصغير الخط">أ−</button>
    <button onclick="fsz(1)" aria-label="تكبير الخط">أ+</button>
    <button onclick="theme()" aria-label="الوضع الليلي">ليلي</button>
  </div>
</header>
<main>
${body}
</main>
<script>
function fsz(d){var r=document.documentElement,c=parseFloat(getComputedStyle(r).getPropertyValue('--fs'))||20,n=Math.min(30,Math.max(15,c+d));r.style.setProperty('--fs',n+'px');try{localStorage.setItem('fs',n)}catch(e){}}
function theme(){var r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches,n=dark?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){}}
var pb=document.getElementById('progress');if(pb&&document.querySelector('.chapter')){var up=function(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;pb.style.transform='scaleX('+(m>0?h.scrollTop/m:0)+')'};addEventListener('scroll',up,{passive:true});up()}
${extra}
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').then(function(){return navigator.serviceWorker.ready}).then(function(){
    var status=document.getElementById('offline-status');if(status)status.textContent='الفصول جاهزة للقراءة دون إنترنت.';
  }).catch(function(){var status=document.getElementById('offline-status');if(status)status.textContent='تعذر حفظ الفصول. أعد فتح الموقع وأنت متصل بالإنترنت.'});
}
var installPrompt,installButton=document.getElementById('install-app');
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();installPrompt=e;if(installButton)installButton.hidden=false;});
if(installButton)installButton.addEventListener('click',async function(){
  if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installButton.hidden=true;
});
window.addEventListener('appinstalled',function(){var help=document.getElementById('install-help');if(help)help.hidden=true;if(installButton)installButton.hidden=true;});
</script>
</body>
</html>
`;

const css = `:root{--bg:#f6f1e7;--fg:#2a2420;--muted:#7b6f61;--line:#e2d8c6;--card:#fffaf1;--accent:#8a4b1f;--accent-soft:#f0e2d2;--sys-bg:#e9f1fb;--sys-fg:#1c4e86;--sys-line:#b7d0ec;--fs:20px;--f-body:"Noto Naskh Arabic","Amiri",serif;--f-display:"Reem Kufi","Noto Naskh Arabic",sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15130f;--fg:#e8e0d2;--muted:#9d9180;--line:#2f2a23;--card:#1d1a15;--accent:#e2a56b;--accent-soft:#2a2118;--sys-bg:#0f1d2c;--sys-fg:#91c2f2;--sys-line:#22415f;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#15130f;--fg:#e8e0d2;--muted:#9d9180;--line:#2f2a23;--card:#1d1a15;--accent:#e2a56b;--accent-soft:#2a2118;--sys-bg:#0f1d2c;--sys-fg:#91c2f2;--sys-line:#22415f;color-scheme:dark}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--f-body);line-height:2}
a{color:var(--accent);text-decoration:none}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.progress{position:fixed;top:0;right:0;left:0;height:3px;background:var(--accent);transform:scaleX(0);transform-origin:right;z-index:6}
.bar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px));background:var(--bg);border-bottom:1px solid var(--line)}
.home{font-family:var(--f-display);font-weight:700;font-size:18px;color:var(--fg)}
.tools{display:flex;gap:6px}
.tools button{font:inherit;font-size:15px;line-height:1.8;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:2px 10px;cursor:pointer}
main{max-width:720px;margin:0 auto;padding:24px max(16px,env(safe-area-inset-right,0px)) 80px max(16px,env(safe-area-inset-left,0px))}
main.wide{max-width:960px}
h1{font-family:var(--f-display);font-weight:700;font-size:calc(var(--fs) * 1.45);line-height:1.6;margin:4px 0 28px;text-align:center;text-wrap:balance}
.eyebrow{text-align:center;color:var(--muted);font-size:14px;letter-spacing:.02em;margin-top:8px}
.chapter p{font-size:var(--fs);margin:0 0 1em;text-align:justify}
.break{text-align:center;color:var(--muted);margin:2em 0;letter-spacing:.5em}
.sys{font-size:calc(var(--fs) * .88);background:var(--sys-bg);color:var(--sys-fg);border:1px solid var(--sys-line);border-right:4px solid var(--sys-fg);border-radius:8px;padding:12px 16px;margin:1.2em 0;line-height:1.9;font-variant-numeric:tabular-nums}
.nav{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;margin-top:40px;padding-top:20px;border-top:1px solid var(--line)}
.nav a,.nav span{text-align:center;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
.nav span{color:var(--muted)}
.nav .next{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:600}
.hero{text-align:center;padding:28px 0 12px}
.hero .kicker{color:var(--accent);font-size:14px;letter-spacing:.04em}
.hero h1{font-size:clamp(30px,6vw,46px);margin:4px 0 10px}
.hero .blurb{max-width:34em;margin:0 auto 18px;color:var(--fg);font-size:17px}
.hero .meta{color:var(--muted);font-size:14px;margin:0 0 22px;font-variant-numeric:tabular-nums}
.cta{display:inline-block;padding:12px 28px;border-radius:10px;background:var(--accent);color:var(--bg);font-weight:600}
.install{margin:24px auto 0;padding:18px;max-width:36em;border:1px solid var(--line);border-radius:12px;background:var(--card)}
.install p{margin:0 0 8px}.install small{display:block;color:var(--muted)}
.install button{font:inherit;cursor:pointer;border:1px solid var(--accent);padding:8px 22px;margin-bottom:10px}
.install details{text-align:right;font-size:15px}.install summary{cursor:pointer;color:var(--accent)}
[hidden]{display:none!important}
@media (display-mode:standalone){#install-help,#install-app{display:none}}
.arc{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin:40px 0 12px;padding-bottom:8px;border-bottom:2px solid var(--accent)}
.arc h2{font-family:var(--f-display);font-weight:500;margin:0;color:var(--accent);font-size:20px}
.arc small{color:var(--muted);font-size:14px;font-variant-numeric:tabular-nums}
.toc{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0 24px}
.toc li{border-bottom:1px solid var(--line);min-width:0}
.toc a{display:flex;gap:12px;align-items:baseline;padding:11px 4px;color:var(--fg)}
.toc a:hover .t{color:var(--accent)}
.toc .n{color:var(--muted);min-width:2.2em;font-variant-numeric:tabular-nums}
.toc .t{min-width:0}
.toc li.last a{background:var(--accent-soft);border-radius:6px}
.toc li.last .t::after{content:" · آخر ما قرأت";color:var(--accent);font-size:13px}
@media (prefers-reduced-motion:no-preference){.progress{transition:transform .1s linear}}
`;

const ARCS = [[1, 40, 'المرحلة الأولى: البداية والبقاء'], [41, 100, 'المرحلة الثانية: الاقتصاد والإنتاج'], [101, 180, 'المرحلة الثالثة: النفوذ المحلي'], [181, 250, 'المرحلة الرابعة: صراعات توحيد الإقليم'], [251, 300, 'المرحلة الخامسة: توحيد الإقليم وتثبيت الحكم']];
const pad = (n) => String(n).padStart(3, '0');
const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => /^\d{3}\.md$/.test(f)).sort() : [];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'c'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'style.css'), css);

const chapters = files.map((f) => {
  const n = parseInt(f, 10);
  const { title, body } = render(fs.readFileSync(path.join(SRC, f), 'utf8'));
  return { n, title: title || `الفصل ${n}`, body };
});

chapters.forEach((c, i) => {
  const prev = chapters[i - 1], next = chapters[i + 1];
  const nav = `<nav class="nav">${prev ? `<a href="/c/${pad(prev.n)}">→ السابق</a>` : '<span>البداية</span>'}<a href="/">الفهرس</a>${next ? `<a class="next" href="/c/${pad(next.n)}">التالي ←</a>` : '<span>قريباً</span>'}</nav>`;
  const arc = ARCS.find(([a, b]) => c.n >= a && c.n <= b);
  const body = `<article class="chapter"><div class="eyebrow">${arc ? arc[2].split(':')[0] : ''} · الفصل ${c.n} من ${chapters.length}</div><h1>${esc(c.title.replace(/^الفصل [^:]+:\s*/, ''))}</h1>\n${c.body}\n</article>${nav}`;
  fs.writeFileSync(path.join(OUT, 'c', `${pad(c.n)}.html`), page(`${c.title} — ${TITLE}`, body, `try{localStorage.setItem('last','${pad(c.n)}')}catch(e){}`));
});

let toc = '';
for (const [a, b, name] of ARCS) {
  const list = chapters.filter((c) => c.n >= a && c.n <= b);
  if (!list.length) continue;
  toc += `<div class="arc"><h2>${name}</h2><small>الفصول ${a}–${b} · منشور ${list.length} من ${b - a + 1}</small></div><ul class="toc">` + list.map((c) => `<li data-n="${pad(c.n)}"><a href="/c/${pad(c.n)}"><span class="n">${c.n}</span><span class="t">${esc(c.title.replace(/^الفصل [^:]+:\s*/, ''))}</span></a></li>`).join('') + '</ul>';
}
const count = (n) => n === 1 ? 'فصل واحد' : n === 2 ? 'فصلان' : n <= 10 ? `${n} فصول` : `${n} فصلاً`;
const index = `<section class="hero"><div class="kicker">خيال علمي · بناء حضارة · سياسة وحروب</div><h1>${TITLE}</h1><p class="blurb">مهندس وزوجته الحامل ينتقلان إلى قرية فقيرة في عالم مجهول، ومعه نظام غامض لا يعرف أكثر مما تسمح به بياناته. من مدخنة تخنق ضيوف نزل، تبدأ حضارة.</p><p class="meta">المنشور حتى الآن: ${count(chapters.length)} من أصل 1000</p><a id="resume" class="cta" href="/c/001">ابدأ القراءة</a><section class="install" aria-label="تثبيت التطبيق"><p>روايتك معك، حتى دون إنترنت</p><button id="install-app" class="cta" hidden>ثبّت التطبيق</button><details id="install-help"><summary>طريقة التثبيت على الهاتف</summary><p>أندرويد: افتح الموقع في Chrome، ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» من قائمة ⋮.</p><p>آيفون: افتح الموقع في Safari، واضغط زر المشاركة، ثم «إضافة إلى الشاشة الرئيسية».</p></details><small id="offline-status" role="status">جارٍ حفظ ${count(chapters.length)} للقراءة دون إنترنت… أبقِ الموقع مفتوحاً حتى يكتمل الحفظ.</small></section></section>${toc || '<p>لا توجد فصول بعد.</p>'}`;
fs.writeFileSync(path.join(OUT, 'index.html'), page(TITLE, index, `document.querySelector('main').classList.add('wide');try{var l=localStorage.getItem('last');if(l){var a=document.getElementById('resume');a.href='/c/'+l;a.textContent='أكمل القراءة: الفصل '+parseInt(l,10);var li=document.querySelector('li[data-n="'+l+'"]');if(li)li.className='last'}}catch(e){}`));

console.log(`built ${chapters.length} chapters`);

// أيقونة كتاب بسيطة، تُولَّد أثناء البناء بلا تبعيات إضافية.
function bookIcon(size) {
  const zlib = require('node:zlib');
  const pixels = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      let color = [138, 75, 31];
      if (u > .23 && u < .77 && v > .25 && v < .75) color = [246, 241, 231];
      if (Math.abs(u - .5) < .012 && v > .26 && v < .74) color = [138, 75, 31];
      if (u > .29 && u < .43 && [.37, .46, .55, .64].some(n => Math.abs(v - n) < .009)) color = [194, 166, 128];
      if (u > .57 && u < .71 && [.37, .46, .55, .64].some(n => Math.abs(v - n) < .009)) color = [194, 166, 128];
      const offset = y * (size * 3 + 1) + 1 + x * 3;
      pixels.set(color, offset);
    }
  }
  function chunk(type, data) {
    const bytes = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const length = Buffer.alloc(4), checksum = Buffer.alloc(4);
    length.writeUInt32BE(data.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, bytes, checksum]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
for (const size of [192, 512]) fs.writeFileSync(path.join(OUT, `icon-${size}.png`), bookIcon(size));
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  id: '/', name: TITLE, short_name: 'السيادة الحضارية', lang: 'ar', dir: 'rtl',
  start_url: '/', scope: '/', display: 'standalone',
  background_color: '#f6f1e7', theme_color: '#8a4b1f',
  description: 'اقرأ رواية نظام السيادة الحضارية، حتى دون اتصال بالإنترنت.',
  icons: [192, 512].map(size => ({src: `/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any maskable'}))
}, null, 2));
const precache = ['/', '/style.css', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', ...chapters.map(c => `/c/${pad(c.n)}`)];
const digest = require('node:crypto').createHash('sha256');
for (const url of precache) {
  const filename = url === '/' ? 'index.html' : /^\/c\//.test(url) ? `${url.slice(1)}.html` : url.slice(1);
  digest.update(fs.readFileSync(path.join(OUT, filename)));
}
const version = digest.digest('hex').slice(0, 16);
fs.writeFileSync(path.join(OUT, 'sw.js'), `
const CACHE = 'novel-${version}';
const FILES = ${JSON.stringify(precache)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('novel-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const key = url.pathname === '/index.html' ? '/' : url.pathname.replace(/\\.html$/, '').replace(/\\/$/, '') || '/';
  if (!FILES.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok && !response.redirected) {
        const copy = response.clone();
        event.waitUntil(cache.put(key, copy));
        return response;
      }
      return (await cache.match(key)) || response;
    } catch (error) {
      return (await cache.match(key)) || new Response('هذا الفصل غير محفوظ بعد. اتصل بالإنترنت ثم أعد فتحه.', {status: 503, headers: {'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
`);
fs.writeFileSync(path.join(OUT, '_headers'), '/sw.js\n  Cache-Control: no-cache\n  Service-Worker-Allowed: /\n/manifest.webmanifest\n  Content-Type: application/manifest+json; charset=utf-8\n');
