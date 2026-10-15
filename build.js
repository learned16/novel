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
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;var f=localStorage.getItem('fs');if(f)document.documentElement.style.setProperty('--fs',f+'px')}catch(e){}</script>
</head>
<body>
<header class="bar">
  <a class="home" href="/">${TITLE}</a>
  <div class="tools">
    <button onclick="fsz(-1)" aria-label="تصغير الخط">أ−</button>
    <button onclick="fsz(1)" aria-label="تكبير الخط">أ+</button>
    <button onclick="theme()" aria-label="الوضع الليلي">◐</button>
  </div>
</header>
<main>
${body}
</main>
<script>
function fsz(d){var r=document.documentElement,c=parseFloat(getComputedStyle(r).getPropertyValue('--fs'))||20,n=Math.min(30,Math.max(15,c+d));r.style.setProperty('--fs',n+'px');try{localStorage.setItem('fs',n)}catch(e){}}
function theme(){var r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches,n=dark?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){}}
${extra}
</script>
</body>
</html>
`;

const css = `:root{--bg:#f7f2e8;--fg:#2a2420;--muted:#7a6f63;--line:#e3d9c8;--card:#fffaf1;--accent:#8a4b1f;--sys-bg:#eaf2fb;--sys-fg:#1d4f86;--sys-line:#b9d2ee;--fs:20px}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15130f;--fg:#e8e0d2;--muted:#9c907f;--line:#2e2a24;--card:#1d1a15;--accent:#e0a36a;--sys-bg:#0f1d2c;--sys-fg:#8fc1f2;--sys-line:#21405f}}
:root[data-theme="dark"]{--bg:#15130f;--fg:#e8e0d2;--muted:#9c907f;--line:#2e2a24;--card:#1d1a15;--accent:#e0a36a;--sys-bg:#0f1d2c;--sys-fg:#8fc1f2;--sys-line:#21405f}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font-family:"Noto Naskh Arabic",serif;line-height:2}
a{color:var(--accent);text-decoration:none}
.bar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 16px;background:var(--bg);border-bottom:1px solid var(--line)}
.home{font-weight:700;font-size:17px;color:var(--fg)}
.tools{display:flex;gap:6px}
.tools button{font:inherit;font-size:15px;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:2px 10px;cursor:pointer}
main{max-width:720px;margin:0 auto;padding:24px 16px 80px}
h1{font-size:calc(var(--fs) * 1.45);line-height:1.6;margin:8px 0 28px;text-align:center}
.chapter p{font-size:var(--fs);margin:0 0 1em;text-align:justify}
.break{text-align:center;color:var(--muted);margin:2em 0;letter-spacing:.5em}
.sys{font-size:calc(var(--fs) * .88);background:var(--sys-bg);color:var(--sys-fg);border:1px solid var(--sys-line);border-right:4px solid var(--sys-fg);border-radius:8px;padding:12px 16px;margin:1.2em 0;line-height:1.9}
.nav{display:flex;justify-content:space-between;gap:12px;margin-top:40px;padding-top:20px;border-top:1px solid var(--line)}
.nav a,.nav span{flex:1;text-align:center;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
.nav span{color:var(--muted)}
.hero{text-align:center;padding:16px 0 8px}
.hero h1{margin-bottom:8px}
.hero p{color:var(--muted);margin:0 0 16px}
.resume{display:none;margin:0 auto 24px;max-width:420px;text-align:center;padding:12px;border-radius:10px;background:var(--accent);color:var(--bg);font-weight:600}
.toc{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}
.toc li{border-bottom:1px solid var(--line)}
.toc a{display:flex;gap:12px;padding:12px 4px;color:var(--fg)}
.toc .n{color:var(--muted);min-width:3.5em}
.arc{margin:28px 0 8px;color:var(--accent);font-size:18px}
`;

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
  const nav = `<nav class="nav">${next ? `<a href="/c/${pad(next.n)}">الفصل التالي ←</a>` : '<span>لا يوجد فصل تالٍ بعد</span>'}<a href="/">الفهرس</a>${prev ? `<a href="/c/${pad(prev.n)}">→ الفصل السابق</a>` : '<span>البداية</span>'}</nav>`;
  const body = `<article class="chapter"><h1>${esc(c.title)}</h1>\n${c.body}\n</article>${nav}`;
  fs.writeFileSync(path.join(OUT, 'c', `${pad(c.n)}.html`), page(`${c.title} — ${TITLE}`, body, `try{localStorage.setItem('last','${pad(c.n)}')}catch(e){}`));
});

const ARCS = [[1, 40, 'المرحلة الأولى: البداية والبقاء'], [41, 100, 'المرحلة الثانية: الاقتصاد والإنتاج'], [101, 180, 'المرحلة الثالثة: النفوذ المحلي'], [181, 250, 'المرحلة الرابعة: صراعات توحيد الإقليم'], [251, 300, 'المرحلة الخامسة: توحيد الإقليم وتثبيت الحكم']];
let toc = '';
for (const [a, b, name] of ARCS) {
  const list = chapters.filter((c) => c.n >= a && c.n <= b);
  if (!list.length) continue;
  toc += `<h2 class="arc">${name}</h2><ul class="toc">` + list.map((c) => `<li><a href="/c/${pad(c.n)}"><span class="n">${c.n}</span><span>${esc(c.title.replace(/^الفصل [^:]+:\s*/, ''))}</span></a></li>`).join('') + '</ul>';
}
const index = `<section class="hero"><h1>${TITLE}</h1><p>رواية — ${chapters.length} فصل منشور</p></section><a id="resume" class="resume" href="#">أكمل القراءة</a>${toc || '<p>لا توجد فصول بعد.</p>'}`;
fs.writeFileSync(path.join(OUT, 'index.html'), page(TITLE, index, `try{var l=localStorage.getItem('last');if(l){var a=document.getElementById('resume');a.href='/c/'+l;a.textContent='أكمل القراءة: الفصل '+parseInt(l,10);a.style.display='block'}}catch(e){}`));

console.log(`built ${chapters.length} chapters`);
