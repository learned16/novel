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

// نافذة النظام: تتطور مع «التكامل». المستوى يُحسب من آخر نسبة تكامل ظهرت في الرواية حتى تلك اللحظة.
const level = (v) => v < 4 ? 1 : v < 6 ? 2 : v < 10 ? 3 : v < 16 ? 4 : 5;
const METER = /^(.{1,40}?):\s*([0-9]{1,3}(?:\.[0-9]+)?)%\s*(.*)$/;
function sysBox(lines, state) {
  let head = '';
  if (/^\*\*\[.+\]\*\*$/.test(lines[0].trim())) head = lines.shift().trim().replace(/^\*\*\[(.+)\]\*\*$/, '$1');
  const half = /النصف الثاني/.test(head);
  const echo = !head && lines.length === 1;
  const lv = level(state.integ);
  let up = false;
  const rows = lines.map((l, i) => {
    const plain = l.replace(/\*\*/g, '').trim();
    const g = !half && !/طاقة/.test(plain) && plain.match(/التكامل[^0-9%]*([0-9]{1,3})%/);
    if (g && +g[1] > state.integ) { if (state.integ) up = true; state.integ = +g[1]; }
    const m = plain.match(METER);
    if (m && /الثقة|التكامل|الاحتمال|تطابق/.test(m[1])) {
      const v = Math.min(100, parseFloat(m[2]));
      return `<div class="m" style="--i:${i};--v:${v}"><span class="k">${esc(m[1])}</span><span class="bar" aria-hidden="true"><i></i></span><b>${m[2]}%</b>${m[3] ? `<span class="x">${esc(m[3])}</span>` : ''}</div>`;
    }
    return `<div style="--i:${i}">${inline(l)}</div>`;
  });
  const cls = ['sys', half && 'sys--b', echo && 'sys--echo', /مكتمل/.test(head) && 'sys--ok', up && 'sys--up'].filter(Boolean).join(' ');
  const tag = half ? 'النصف الثاني' : state.integ ? `تكامل ${state.integ}%` : '';
  const h = head ? `<div class="sys-h"><span class="t">${inline(head)}</span>${tag ? `<span class="lv">${up ? 'ترقية · ' : ''}${tag}</span>` : ''}</div>` : '';
  return `<div class="${cls}" data-lv="${lv}">${h}<div class="sys-b">${rows.join('')}</div></div>`;
}

function render(md, state = { integ: 0 }) {
  const blocks = md.replace(/\r/g, '').split(/\n\s*\n/);
  let title = '';
  const html = [];
  for (const raw of blocks) {
    const b = raw.trim();
    if (!b) continue;
    if (b.startsWith('# ')) { title = b.slice(2).trim(); continue; }
    if (b === '***') { html.push('<div class="break" role="separator"><span></span></div>'); continue; }
    if (b.startsWith('>')) {
      html.push(sysBox(b.split('\n').map((l) => l.replace(/^>\s?/, '')), state));
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
<link rel="preload" href="/fonts/NotoNaskhArabic-arabic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;var f=localStorage.getItem('fs');if(f)document.documentElement.style.setProperty('--fs',f+'px')}catch(e){}</script>
</head>
<body>
<div class="progress" id="progress"></div>
<div id="hud" aria-hidden="true"></div>
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
(function(){var s=document.querySelectorAll('.sys');if(!s.length||!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.documentElement.classList.add('fx');var hud=document.getElementById('hud'),ht;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var x=e.target;x.classList.add('in');io.unobserve(x);if(hud&&!x.classList.contains('sys--echo')){hud.className=x.classList.contains('sys--b')?'b':'';void hud.offsetWidth;hud.classList.add(x.classList.contains('sys--up')?'up':'on');clearTimeout(ht);ht=setTimeout(function(){hud.className=''},1400)}}})},{rootMargin:'0px 0px -15% 0px'});s.forEach(function(x){io.observe(x)})})();
function resume(id){var key='pos:'+id,ps=document.querySelectorAll('.chapter > p, .chapter > .sys');if(!ps.length)return;try{var v=parseInt(localStorage.getItem(key)||'0',10);if(v>2&&!location.hash&&ps[v]){var go=function(){ps[v].scrollIntoView({block:'start'});scrollBy(0,-70)};requestAnimationFrame(go);var t=document.createElement('div');t.className='toast';t.innerHTML='عدت إلى حيث توقفت <button type="button">من البداية</button>';document.body.appendChild(t);t.querySelector('button').onclick=function(){scrollTo(0,0);t.remove()};setTimeout(function(){t.classList.add('off')},4000)}}catch(e){}var tm;addEventListener('scroll',function(){clearTimeout(tm);tm=setTimeout(function(){var h=document.documentElement;try{if(h.scrollTop+h.clientHeight>=h.scrollHeight-40){localStorage.removeItem(key);return}for(var i=0;i<ps.length;i++){if(ps[i].getBoundingClientRect().bottom>80){localStorage.setItem(key,i);break}}}catch(e){}},300)},{passive:true})}
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

const css = `:root{--bg:#f6f1e7;--fg:#2a2420;--muted:#7b6f61;--line:#e2d8c6;--card:#fffaf1;--accent:#8a4b1f;--accent-soft:#f0e2d2;--sys-bg:#e9f1fb;--sys-fg:#1c4e86;--sys-line:#b7d0ec;--sys-glow:rgba(28,78,134,.28);--sys2-bg:#fbf0e0;--sys2-fg:#8a4b0f;--sys2-line:#e8c79c;--sys2-glow:rgba(176,104,30,.3);--ok:#2e7d4f;--tone:rgba(42,36,32,.13);--fs:20px;--f-body:"Noto Naskh Arabic","Amiri",serif;--f-display:"Reem Kufi","Noto Naskh Arabic",sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15130f;--fg:#e8e0d2;--muted:#9d9180;--line:#2f2a23;--card:#1d1a15;--accent:#e2a56b;--accent-soft:#2a2118;--sys-bg:#0f1d2c;--sys-fg:#91c2f2;--sys-line:#22415f;--sys-glow:rgba(120,185,255,.45);--sys2-bg:#2a1c0d;--sys2-fg:#f0b56a;--sys2-line:#5c3d1a;--sys2-glow:rgba(240,170,90,.45);--ok:#6fd39a;--tone:rgba(232,224,210,.10);color-scheme:dark}}
:root[data-theme="dark"]{--bg:#15130f;--fg:#e8e0d2;--muted:#9d9180;--line:#2f2a23;--card:#1d1a15;--accent:#e2a56b;--accent-soft:#2a2118;--sys-bg:#0f1d2c;--sys-fg:#91c2f2;--sys-line:#22415f;--sys-glow:rgba(120,185,255,.45);--sys2-bg:#2a1c0d;--sys2-fg:#f0b56a;--sys2-line:#5c3d1a;--sys2-glow:rgba(240,170,90,.45);--ok:#6fd39a;--tone:rgba(232,224,210,.10);color-scheme:dark}
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
.ch-head{position:relative;text-align:center;padding:26px 12px 6px;margin:0 0 30px;border-bottom:3px solid var(--fg);background:linear-gradient(to bottom,transparent,var(--bg) 85%),radial-gradient(circle,var(--tone) 1.1px,transparent 1.3px) 0 0/7px 7px}
.ch-head .eyebrow{margin:0 0 10px}
.ch-num{display:inline-flex;align-items:center;gap:10px;font-family:var(--f-display);background:var(--fg);color:var(--bg);padding:4px 16px 4px 6px;transform:skewX(-8deg);margin-bottom:12px}
.ch-num span{font-size:15px;transform:skewX(8deg)}
.ch-num b{font-size:26px;line-height:1.3;background:var(--bg);color:var(--fg);padding:0 10px;font-variant-numeric:tabular-nums;transform:skewX(8deg)}
.ch-head h1{margin:0 0 14px}
.break{display:flex;align-items:center;gap:14px;margin:2.4em auto;max-width:60%;color:var(--fg)}
.break::before,.break::after{content:"";flex:1;height:2px;background:linear-gradient(to left,currentColor,transparent);border-radius:2px}
.break::after{background:linear-gradient(to right,currentColor,transparent)}
.break span{width:9px;height:9px;background:currentColor;transform:rotate(45deg);box-shadow:0 0 0 4px var(--bg),0 0 0 5px currentColor}
.sys{--c:var(--sys-fg);--l:var(--sys-line);--g:var(--sys-glow);position:relative;font-size:calc(var(--fs) * .86);color:var(--c);background:color-mix(in srgb,var(--sys-bg) 88%,transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid var(--l);border-radius:3px;margin:1.8em 0;line-height:1.85;font-variant-numeric:tabular-nums;box-shadow:0 0 22px -8px var(--g),inset 0 0 0 1px color-mix(in srgb,var(--c) 6%,transparent);overflow:hidden;isolation:isolate}
.sys--b{--c:var(--sys2-fg);--l:var(--sys2-line);--g:var(--sys2-glow);background:color-mix(in srgb,var(--sys2-bg) 88%,transparent)}
.sys-h{display:flex;align-items:center;gap:10px;font-family:var(--f-display);font-weight:700;font-size:.92em;padding:6px 14px;border-bottom:1px solid var(--l);background:linear-gradient(to left,color-mix(in srgb,var(--c) 14%,transparent),transparent 80%)}
.sys-h .t::before{content:"";display:inline-block;width:7px;height:7px;margin-left:9px;vertical-align:middle;background:var(--c);border-radius:50%;box-shadow:0 0 8px var(--c);animation:pulse 2.4s ease-in-out infinite}
.sys-h .lv{margin-right:auto;font-family:var(--f-body);font-weight:600;font-size:.72em;letter-spacing:.03em;padding:0 8px;border:1px solid var(--l);border-radius:2px;opacity:.85;white-space:nowrap}
.sys-b{padding:10px 16px 12px}
.sys .m{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px}
.sys .m .bar{display:block;height:6px;background:color-mix(in srgb,var(--c) 14%,transparent);border-radius:1px;overflow:hidden;min-width:60px}
.sys .m .bar i{display:block;height:6px;width:calc(var(--v) * 1%);background:linear-gradient(to left,var(--c),color-mix(in srgb,var(--c) 55%,transparent));box-shadow:0 0 8px var(--c)}
.sys .m b{font-weight:700;min-width:3.2ch;text-align:left}
.sys .m .x{grid-column:1/-1;font-size:.88em;opacity:.8;margin-top:-4px}
.sys--ok .sys-h{background:linear-gradient(to left,color-mix(in srgb,var(--ok) 22%,transparent),transparent 85%)}
.sys--ok .sys-h .t::before{background:var(--ok);box-shadow:0 0 8px var(--ok)}
.sys--echo{display:table;margin:1.6em auto;border-style:dashed;box-shadow:0 0 18px -8px var(--g)}
.sys--echo .sys-b{padding:6px 18px}
.sys[data-lv="1"]{border-radius:6px}
.sys:not([data-lv="1"])::before,.sys:not([data-lv="1"])::after{content:"";position:absolute;width:12px;height:12px;border:2px solid var(--c);pointer-events:none;z-index:2}
.sys:not([data-lv="1"])::before{top:3px;right:3px;border-left:0;border-bottom:0}
.sys:not([data-lv="1"])::after{bottom:3px;left:3px;border-right:0;border-top:0}
.sys:not([data-lv="1"]) .sys-b{background-image:repeating-linear-gradient(to bottom,color-mix(in srgb,var(--c) 5%,transparent) 0 1px,transparent 1px 4px)}
.sys[data-lv="3"] .sys-b,.sys[data-lv="4"] .sys-b,.sys[data-lv="5"] .sys-b{background-image:repeating-linear-gradient(to bottom,color-mix(in srgb,var(--c) 5%,transparent) 0 1px,transparent 1px 4px),linear-gradient(color-mix(in srgb,var(--c) 7%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--c) 7%,transparent) 1px,transparent 1px);background-size:auto,22px 22px,22px 22px}
.sys[data-lv="3"],.sys[data-lv="4"],.sys[data-lv="5"]{outline:1px solid color-mix(in srgb,var(--c) 30%,transparent);outline-offset:3px}
.sys[data-lv="4"],.sys[data-lv="5"]{box-shadow:0 0 34px -6px var(--g),inset 0 0 24px -12px var(--c)}
.sys[data-lv="5"] .sys-h{letter-spacing:.04em}
@keyframes pulse{50%{opacity:.35}}
@keyframes ln{from{opacity:0;transform:translateX(-6px);filter:blur(2px)}to{opacity:1;transform:none;filter:none}}
@keyframes boot{0%{opacity:0;clip-path:inset(48% 0 48% 0)}40%{opacity:1;clip-path:inset(48% 0 48% 0)}100%{opacity:1;clip-path:inset(0 0 0 0)}}
@keyframes sheen{from{transform:translateX(120%)}to{transform:translateX(-120%)}}
.fx .sys{opacity:0}
.fx .sys.in{animation:boot .5s cubic-bezier(.2,.7,.2,1) both}
.fx .sys .sys-b>div{opacity:0}
.fx .sys.in .sys-b>div{animation:ln .32s ease-out both;animation-delay:calc(.35s + var(--i) * 90ms)}
.fx .sys .m .bar i{width:0;transition:width .9s cubic-bezier(.2,.7,.2,1)}
.fx .sys.in .m .bar i{width:calc(var(--v) * 1%);transition-delay:calc(.45s + var(--i) * 90ms)}
.fx .sys.in[data-lv="4"] .sys-h,.fx .sys.in[data-lv="5"] .sys-h,.fx .sys--up.in .sys-h{position:relative;overflow:hidden}
.fx .sys.in[data-lv="4"] .sys-h::after,.fx .sys.in[data-lv="5"] .sys-h::after,.fx .sys--up.in .sys-h::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,color-mix(in srgb,var(--c) 35%,transparent),transparent 70%);animation:sheen 1.4s .5s ease-out both}
.sys--up{box-shadow:0 0 40px -4px var(--g)}
#hud{position:fixed;inset:0;pointer-events:none;z-index:50;opacity:0;--h:var(--sys-glow)}
#hud.b{--h:var(--sys2-glow)}
#hud.on,#hud.up{animation:hud 1.3s ease-out both}
#hud::before,#hud::after{content:"";position:absolute;width:38px;height:38px;border:2px solid var(--h)}
#hud::before{top:58px;right:10px;border-left:0;border-bottom:0}
#hud::after{bottom:10px;left:10px;border-right:0;border-top:0}
#hud.on{box-shadow:inset 0 0 70px -20px var(--h)}
#hud.up{box-shadow:inset 0 0 120px -10px var(--h)}
@keyframes hud{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
.toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:var(--fg);color:var(--bg);padding:8px 14px;border-radius:8px;font-size:15px;z-index:60;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:opacity .4s;white-space:nowrap}
.toast button{font:inherit;font-size:14px;margin-right:10px;background:transparent;color:var(--bg);border:1px solid var(--bg);border-radius:6px;padding:0 8px;cursor:pointer}
.toast.off{opacity:0;pointer-events:none}
.new-b{font-size:12px;color:var(--bg);background:var(--accent);border-radius:4px;padding:0 6px;margin-right:8px;line-height:1.7}
@media (prefers-reduced-motion:reduce){.sys-h .t::before{animation:none}}
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
const FONTS = path.join(ROOT, 'fonts');
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
const fontFiles = fs.readdirSync(FONTS).filter((f) => f.endsWith('.woff2'));
fontFiles.forEach((f) => fs.copyFileSync(path.join(FONTS, f), path.join(OUT, 'fonts', f)));
fs.writeFileSync(path.join(OUT, 'style.css'), fs.readFileSync(path.join(FONTS, 'fonts.css'), 'utf8') + css);

const issues = require('./check')();
issues.forEach((m) => console.warn('⚠ ' + m));

const sysState = { integ: 0 };
const chapters = files.map((f) => {
  const n = parseInt(f, 10);
  const { title, body } = render(fs.readFileSync(path.join(SRC, f), 'utf8'), sysState);
  return { n, title: title || `الفصل ${n}`, body };
});

chapters.forEach((c, i) => {
  const prev = chapters[i - 1], next = chapters[i + 1];
  const nav = `<nav class="nav">${prev ? `<a href="/c/${pad(prev.n)}">→ السابق</a>` : '<span>البداية</span>'}<a href="/">الفهرس</a>${next ? `<a class="next" href="/c/${pad(next.n)}">التالي ←</a>` : '<span>قريباً</span>'}</nav>`;
  const arc = ARCS.find(([a, b]) => c.n >= a && c.n <= b);
  const body = `<article class="chapter"><header class="ch-head"><div class="eyebrow">${arc ? arc[2].split(':')[0] : ''}</div><div class="ch-num"><span>الفصل</span><b>${c.n}</b></div><h1>${esc(c.title.replace(/^الفصل [^:]+:\s*/, ''))}</h1></header>\n${c.body}\n</article>${nav}`;
  fs.writeFileSync(path.join(OUT, 'c', `${pad(c.n)}.html`), page(`${c.title} — ${TITLE}`, body, `try{localStorage.setItem('last','${pad(c.n)}')}catch(e){}resume('${pad(c.n)}');`));
});

let toc = '';
for (const [a, b, name] of ARCS) {
  const list = chapters.filter((c) => c.n >= a && c.n <= b);
  if (!list.length) continue;
  toc += `<div class="arc"><h2>${name}</h2><small>الفصول ${a}–${b} · منشور ${list.length} من ${b - a + 1}</small></div><ul class="toc">` + list.map((c) => `<li data-n="${pad(c.n)}"><a href="/c/${pad(c.n)}"><span class="n">${c.n}</span><span class="t">${esc(c.title.replace(/^الفصل [^:]+:\s*/, ''))}</span></a></li>`).join('') + '</ul>';
}
const count = (n) => n === 1 ? 'فصل واحد' : n === 2 ? 'فصلان' : n <= 10 ? `${n} فصول` : `${n} فصلاً`;
const index = `<section class="hero"><div class="kicker">خيال علمي · بناء حضارة · سياسة وحروب</div><h1>${TITLE}</h1><p class="blurb">مهندس وزوجته الحامل ينتقلان إلى قرية فقيرة في عالم مجهول، ومعه نظام غامض لا يعرف أكثر مما تسمح به بياناته. من مدخنة تخنق ضيوف نزل، تبدأ حضارة.</p><p class="meta">المنشور حتى الآن: ${count(chapters.length)} من أصل 1000</p><a id="resume" class="cta" href="/c/001">ابدأ القراءة</a><section class="install" aria-label="تثبيت التطبيق"><p>روايتك معك، حتى دون إنترنت</p><button id="install-app" class="cta" hidden>ثبّت التطبيق</button><details id="install-help"><summary>طريقة التثبيت على الهاتف</summary><p>أندرويد: افتح الموقع في Chrome، ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» من قائمة ⋮.</p><p>آيفون: افتح الموقع في Safari، واضغط زر المشاركة، ثم «إضافة إلى الشاشة الرئيسية».</p></details><small id="offline-status" role="status">جارٍ حفظ ${count(chapters.length)} للقراءة دون إنترنت… أبقِ الموقع مفتوحاً حتى يكتمل الحفظ.</small></section></section>${toc || '<p>لا توجد فصول بعد.</p>'}`;
fs.writeFileSync(path.join(OUT, 'index.html'), page(TITLE, index, `document.querySelector('main').classList.add('wide');try{var l=localStorage.getItem('last');if(l){var a=document.getElementById('resume');a.href='/c/'+l;a.textContent='أكمل القراءة: الفصل '+parseInt(l,10);var li=document.querySelector('li[data-n="'+l+'"]');if(li)li.classList.add('last')}var k=parseInt(localStorage.getItem('known')||'0',10),mx=${chapters.length ? chapters[chapters.length - 1].n : 0};if(k){document.querySelectorAll('.toc li').forEach(function(x){if(parseInt(x.dataset.n,10)>k){x.classList.add('new');var s=document.createElement('span');s.className='new-b';s.textContent='جديد';x.firstChild.appendChild(s)}})}localStorage.setItem('known',mx)}catch(e){}`));

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
const precache = ['/', '/style.css', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', ...fontFiles.map((f) => `/fonts/${f}`), ...chapters.map(c => `/c/${pad(c.n)}`)];
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
