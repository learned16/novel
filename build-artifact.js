// يبني نسخة الرواية كصفحة واحدة لنشرها كـ Artifact على claude.ai
// الاستخدام: node build-artifact.js  ← ينتج artifact/novel.html
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'chapters');
const OUT = path.join(ROOT, 'artifact');
const TITLE = 'نظام السيادة الحضارية';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

function render(md) {
  let title = '';
  const html = [];
  for (const raw of md.replace(/\r/g, '').split(/\n\s*\n/)) {
    const b = raw.trim();
    if (!b) continue;
    if (b.startsWith('# ')) { title = b.slice(2).trim(); continue; }
    if (b === '***') { html.push('<div class="break" aria-hidden="true">✦ ✦ ✦</div>'); continue; }
    if (b.startsWith('>')) {
      const lines = b.split('\n').map((l) => l.replace(/^>\s?/, ''));
      html.push('<div class="sys">' + lines.map((l) => `<div>${inline(l)}</div>`).join('') + '</div>');
      continue;
    }
    html.push(`<p>${inline(b).replace(/\n/g, '<br>')}</p>`);
  }
  return { title, body: html.join('') };
}

const ARCS = [[1, 40, 'المرحلة الأولى: البداية والبقاء'], [41, 100, 'المرحلة الثانية: الاقتصاد والإنتاج'], [101, 180, 'المرحلة الثالثة: النفوذ المحلي'], [181, 250, 'المرحلة الرابعة: صراعات توحيد الإقليم'], [251, 300, 'المرحلة الخامسة: توحيد الإقليم وتثبيت الحكم']];

const chapters = fs.readdirSync(SRC).filter((f) => /^\d{3}\.md$/.test(f)).sort().map((f) => {
  const n = parseInt(f, 10);
  const { title, body } = render(fs.readFileSync(path.join(SRC, f), 'utf8'));
  return { n, t: title || `الفصل ${n}`, b: body };
});

const data = JSON.stringify({ chapters, arcs: ARCS }).replace(/</g, '\\u003c');

const html = `<title>${TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&family=Reem+Kufi:wght@500;700&display=swap" rel="stylesheet">
<style>
/* قارئ رواية: عمود قراءة واحد ضيق، شريط علوي ثابت، صندوق أزرق لرسائل النظام */
:root{
  --paper:#f6f1e7; --ink:#2a2420; --muted:#7b6f61; --rule:#e2d8c6; --leaf:#fffaf1;
  --rust:#8a4b1f; --sys-bg:#e9f1fb; --sys-ink:#1c4e86; --sys-rule:#b7d0ec;
  --f-body:"Noto Naskh Arabic","Amiri","Traditional Arabic",serif;
  --f-display:"Reem Kufi","Noto Naskh Arabic",sans-serif;
  --fs:20px;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --paper:#15130f; --ink:#e8e0d2; --muted:#9d9180; --rule:#2f2a23; --leaf:#1d1a15;
  --rust:#e2a56b; --sys-bg:#0f1d2c; --sys-ink:#91c2f2; --sys-rule:#22415f; color-scheme:dark}}
:root[data-theme="dark"]{
  --paper:#15130f; --ink:#e8e0d2; --muted:#9d9180; --rule:#2f2a23; --leaf:#1d1a15;
  --rust:#e2a56b; --sys-bg:#0f1d2c; --sys-ink:#91c2f2; --sys-rule:#22415f; color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:var(--f-body);line-height:2;font-size:16px}
a{color:var(--rust);text-decoration:none}
button{font:inherit}
:focus-visible{outline:2px solid var(--rust);outline-offset:2px}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding-block:10px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));
  background:var(--paper);border-bottom:1px solid var(--rule)}
.home{font-family:var(--f-display);font-weight:700;font-size:17px;color:var(--ink);background:none;border:0;padding:0;cursor:pointer}
.tools{display:flex;gap:6px}
.tools button{font-size:15px;background:var(--leaf);color:var(--ink);border:1px solid var(--rule);border-radius:8px;padding:2px 10px;cursor:pointer;line-height:1.8}
main{max-width:720px;margin:0 auto;padding-block:24px 80px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1{font-family:var(--f-display);font-weight:700;font-size:calc(var(--fs)*1.45);line-height:1.6;margin:8px 0 28px;text-align:center;text-wrap:balance}
.chapter p{font-size:var(--fs);margin:0 0 1em;text-align:justify}
.break{text-align:center;color:var(--muted);margin:2em 0;letter-spacing:.5em}
.sys{font-size:calc(var(--fs)*.88);background:var(--sys-bg);color:var(--sys-ink);border:1px solid var(--sys-rule);border-radius:8px;padding:12px 16px;margin:1.2em 0;line-height:1.9;font-variant-numeric:tabular-nums}
.nav{display:flex;gap:10px;margin-top:40px;padding-top:20px;border-top:1px solid var(--rule)}
.nav a,.nav span{flex:1;text-align:center;padding:12px 6px;border:1px solid var(--rule);border-radius:10px;background:var(--leaf)}
.nav span{color:var(--muted)}
.hero{text-align:center;padding-block:16px 8px}
.hero h1{margin-bottom:6px;font-size:34px}
.hero p{color:var(--muted);margin:0 0 18px}
.resume{display:block;margin:0 auto 24px;max-width:420px;text-align:center;padding:12px;border-radius:10px;background:var(--rust);color:var(--paper);font-weight:600}
.arc{font-family:var(--f-display);font-weight:500;margin:28px 0 8px;color:var(--rust);font-size:18px}
.toc{list-style:none;padding:0;margin:0;border-top:1px solid var(--rule)}
.toc li{border-bottom:1px solid var(--rule)}
.toc a{display:flex;gap:12px;padding:12px 4px;color:var(--ink)}
.toc .n{color:var(--muted);min-width:2.5em;font-variant-numeric:tabular-nums}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
</style>
<header class="bar">
  <button class="home" id="home" type="button">${TITLE}</button>
  <div class="tools">
    <button type="button" id="fs-down" aria-label="تصغير الخط">أ−</button>
    <button type="button" id="fs-up" aria-label="تكبير الخط">أ+</button>
    <button type="button" id="theme" aria-label="تبديل الوضع الليلي">ليلي</button>
  </div>
</header>
<main id="main" dir="rtl" lang="ar"></main>
<script id="data" type="application/json">${data}</script>
<script>
(function(){
  var D=JSON.parse(document.getElementById('data').textContent);
  var C=D.chapters, root=document.documentElement, main=document.getElementById('main');
  root.setAttribute('dir','rtl'); root.setAttribute('lang','ar');
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  var t=get('theme'); if(t) root.dataset.theme=t;
  var f=get('fs'); if(f) root.style.setProperty('--fs',f+'px');
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function short(t){return t.replace(/^الفصل [^:]+:\\s*/,'')}
  function index(){
    var last=parseInt(get('last')||'0',10), lc=C.filter(function(c){return c.n===last})[0];
    var h='<section class="hero"><h1>${TITLE}</h1><p>رواية · '+C.length+' فصلاً منشوراً</p></section>';
    h+= lc ? '<a class="resume" href="#c'+lc.n+'">أكمل القراءة: الفصل '+lc.n+'</a>' : '<a class="resume" href="#c'+C[0].n+'">ابدأ القراءة</a>';
    D.arcs.forEach(function(a){
      var l=C.filter(function(c){return c.n>=a[0]&&c.n<=a[1]}); if(!l.length) return;
      h+='<h2 class="arc">'+a[2]+'</h2><ul class="toc">'+l.map(function(c){return '<li><a href="#c'+c.n+'"><span class="n">'+c.n+'</span><span>'+esc(short(c.t))+'</span></a></li>'}).join('')+'</ul>';
    });
    main.innerHTML=h; document.title='${TITLE}';
  }
  function chapter(i){
    var c=C[i], p=C[i-1], n=C[i+1];
    main.innerHTML='<article class="chapter"><h1>'+esc(c.t)+'</h1>'+c.b+'</article>'+
      '<nav class="nav">'+(n?'<a href="#c'+n.n+'">الفصل التالي ←</a>':'<span>لا يوجد فصل تالٍ بعد</span>')+
      '<a href="#">الفهرس</a>'+(p?'<a href="#c'+p.n+'">→ الفصل السابق</a>':'<span>البداية</span>')+'</nav>';
    set('last',String(c.n)); window.scrollTo(0,0);
  }
  function route(){
    var m=/^#c(\\d+)$/.exec(location.hash||''), i=-1;
    if(m){var k=parseInt(m[1],10); for(var j=0;j<C.length;j++) if(C[j].n===k) i=j;}
    if(i>=0) chapter(i); else index();
  }
  document.getElementById('home').onclick=function(){location.hash='';index();window.scrollTo(0,0)};
  function fsz(d){var c=parseFloat(getComputedStyle(root).getPropertyValue('--fs'))||20,v=Math.min(30,Math.max(15,c+d));root.style.setProperty('--fs',v+'px');set('fs',v)}
  document.getElementById('fs-down').onclick=function(){fsz(-1)};
  document.getElementById('fs-up').onclick=function(){fsz(1)};
  document.getElementById('theme').onclick=function(){
    var dark=root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme=dark?'light':'dark'; set('theme',root.dataset.theme);
  };
  window.addEventListener('hashchange',route); route();
})();
</script>
`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'novel.html'), html);
console.log(`artifact: ${chapters.length} chapters, ${(html.length / 1024).toFixed(0)} KB`);
