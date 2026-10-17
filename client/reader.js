// قارئ الرواية: كل ما يحدث في المتصفح بعد البناء. يُنسخ كما هو إلى site/reader.js.
// يعمل على كل فصل آلياً من وسوم build.js: .scene[data-fx][data-pl]، .sys[data-k]، p.shot، p.sp[data-sp]، .nm.
// الحالة كلها في localStorage على جهاز القارئ فقط. انظر TECH.md.
(function () {
'use strict';
var R = document.documentElement;
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
var CH = +R.dataset.ch || 0;
var TOTAL = +R.dataset.total || 0;
var store = {
  get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
  json: function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
};
var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
function isDark() { var bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255]; return (+bg[0] + +bg[1] + +bg[2]) < 300; }
function toast(html, ms) {
  var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; document.body.appendChild(t);
  setTimeout(function () { t.classList.add('off'); setTimeout(function () { t.remove(); }, 500); }, ms || 3000);
  return t;
}
// ===== المضيف: القارئ تحت مراقبة النظام (الحالة والإنجازات) =====
var H = store.json('host', {});
H.done = H.done || []; H.days = H.days || []; H.ach = H.ach || {}; H.moods = H.moods || [];
function saveH() { store.set('host', JSON.stringify(H)); }
var ACH = [
  ['first', 'الخطوة الأولى', 'أنهيت فصلاً كاملاً.'],
  ['c5', 'خمسة فصول', 'أنهيت خمسة فصول.'],
  ['c10', 'عشرة فصول', 'أنهيت عشرة فصول.'],
  ['c25', 'ربع المئة', 'أنهيت خمسة وعشرين فصلاً.'],
  ['c50', 'نصف المئة', 'أنهيت خمسين فصلاً.'],
  ['c100', 'المئة الأولى', 'أنهيت مئة فصل.'],
  ['phase1', 'عبرتَ الشتاء', 'أنهيت كل فصول المرحلة الأولى (1–40).'],
  ['phase2', 'الاقتصاد والإنتاج', 'أنهيت كل فصول المرحلة الثانية (41–100).'],
  ['streak3', 'ثلاثة أيام', 'قرأت ثلاثة أيام متتالية.'],
  ['streak7', 'أسبوع كامل', 'قرأت سبعة أيام متتالية.'],
  ['night', 'قارئ الليل', 'قرأت بعد منتصف الليل، كما يقرأ لين النظام في العتمة.'],
  ['upgrade', 'شاهد الترقية', 'رأيت النظام يترقى أمام عينيك.'],
  ['moods', 'كل الأجواء', 'شهدت الثلج والنار والليل والماء والمطر.'],
  ['inspect', 'فاحص السجلات', 'فتحت سجل نافذة من نوافذ النظام.'],
  ['card', 'تعارف', 'فتحت بطاقة شخصية.'],
  ['map', 'رسام الخرائط', 'فتحت خريطة القرية.'],
  ['cine', 'عين السينما', 'قرأت في وضع السينما.'],
  ['sound', 'أذن النظام', 'شغّلت الصوت المحيط.'],
  ['listen', 'الراوي', 'استمعت إلى فصل.'],
];
var PHASES = [['phase1', 1, 40], ['phase2', 41, 100]];
var queue = [], showing = false;
function match() { return TOTAL ? Math.round(H.done.length / TOTAL * 100) : 0; }
function unlock(id) {
  if (H.ach[id]) return;
  H.ach[id] = Date.now(); saveH();
  queue.push(id); if (!showing) nextAch();
}
function nextAch() {
  var id = queue.shift(); if (!id) { showing = false; return; } showing = true;
  var a = ACH.find(function (x) { return x[0] === id; }), m = match();
  var w = document.createElement('div'); w.className = 'ach'; w.setAttribute('role', 'status');
  w.innerHTML = '<div class="sys sys--ok in" data-lv="' + R.dataset.lv + '"><div class="sys-h"><span class="t">إنجاز — المضيف</span></div><div class="sys-b"><div style="--i:0"><strong>' + esc(a[1]) + '</strong></div><div style="--i:1">' + esc(a[2]) + '</div>' + (TOTAL ? '<div class="m" style="--i:2;--v:' + m + '"><span class="k">تطابق المضيف</span><span class="bar"><i></i></span><b>' + m + '%</b></div>' : '') + '</div></div>';
  document.body.appendChild(w); buzz([20, 40, 20]); Sound.chime();
  setTimeout(function () { w.classList.add('off'); setTimeout(function () { w.remove(); nextAch(); }, 500); }, 3800);
}
var dataP;
function data() { return dataP || (dataP = fetch('/data.json').then(function (r) { return r.json(); })); }
var lastRead = function () { return parseInt(store.get('last') || '0', 10); };

// ===== الطبقات (القائمة، البطاقة، الخريطة) =====
function openSheet(el) { if (!el) return; el.hidden = false; requestAnimationFrame(function () { el.classList.add('open'); }); }
function closeSheet(el) { if (!el || el.hidden) return; el.classList.remove('open'); setTimeout(function () { el.hidden = true; }, 220); }
document.addEventListener('click', function (e) {
  var s = e.target.closest('.sheet');
  if (s && (e.target === s || e.target.closest('[data-close]'))) closeSheet(s);
});
addEventListener('keydown', function (e) { if (e.key === 'Escape') { $$('.sheet').forEach(closeSheet); cine(0); } });
var menuB = $('#menu-b');
if (menuB) menuB.onclick = function () { var m = $('#menu'); if (m.hidden) { syncSw(); openSheet(m); } else closeSheet(m); menuB.setAttribute('aria-expanded', String(!m.hidden)); };

// ===== المفاتيح في القائمة =====
function syncSw() {
  $$('.sw').forEach(function (b) {
    var k = b.dataset.sw, on = k === 'dark' ? isDark() : k === 'fx' ? !R.classList.contains('nofx') : k === 'snd' ? store.get('snd') === 'on' : store.get('vib') !== 'off';
    b.setAttribute('aria-pressed', String(on));
  });
}
document.addEventListener('themechange', function () { setTimeout(syncSw, 30); });
$$('.sw').forEach(function (b) {
  if (b.dataset.sw === 'dark') return;
  b.addEventListener('click', function () {
    var k = b.dataset.sw;
    if (k === 'fx') fxToggle();
    if (k === 'snd') Sound.toggle();
    if (k === 'vib') { store.get('vib') === 'off' ? store.del('vib') : store.set('vib', 'off'); if (store.get('vib') !== 'off') buzz(40); }
    syncSw();
  });
});
if (!navigator.vibrate) $$('.vib-row').forEach(function (r) { r.hidden = true; });
if (still) $$('.fx-row').forEach(function (r) { r.hidden = true; });

function buzz(p) { if (store.get('vib') === 'off' || !navigator.vibrate || still || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; try { navigator.vibrate(p); } catch (e) {} }

// ===== وضع السينما =====
window.cine = function (on) {
  R.classList.toggle('cine', !!on);
  on ? store.set('cine', '1') : store.del('cine');
  if (on) { closeSheet($('#menu')); unlock('cine'); }
};

// ===== مستوى الواجهة: الموقع كله يتطور مع «التكامل» =====
function setLv(lv, integ) {
  R.dataset.lv = lv; R.dataset.integ = integ;
  var i = $('#integ'); if (i) i.textContent = +integ ? 'تكامل ' + integ + '%' : '';
  if (CH && +lv >= +(store.get('lv') || 0)) { store.set('lv', lv); store.set('integ', integ); }
}
if (!CH && store.get('integ')) R.dataset.integ = store.get('integ');
setLv(R.dataset.lv, R.dataset.integ || 0);

// ===== نافذة النظام: الظهور، والوميض، وعطب «النصف الثاني»، والصوت، والاهتزاز =====
var hud = $('#hud'), ht;
var boxes = $$('.chapter .sys');
var GL = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي▓░▒';
function scramble(el) {
  var nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
  while ((n = w.nextNode())) if (n.nodeValue.trim()) nodes.push([n, n.nodeValue]);
  var t0 = performance.now();
  (function step(t) {
    var p = Math.min(1, (t - t0) / 800);
    nodes.forEach(function (x) {
      x[0].nodeValue = p >= 1 ? x[1] : x[1].replace(/\S/g, function (c) { return Math.random() > p ? GL[Math.random() * GL.length | 0] : c; });
    });
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
function glitch(el) { el.classList.remove('gl'); void el.offsetWidth; el.classList.add('gl'); }
var visibleHalf = new Set();
if (boxes.length && 'IntersectionObserver' in window) {
  if (!still) R.classList.add('fx');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var x = e.target;
      if (x.classList.contains('sys--b')) e.isIntersecting ? visibleHalf.add(x) : visibleHalf.delete(x);
      if (!e.isIntersecting || x.classList.contains('in')) return;
      x.classList.add('in');
      var half = x.classList.contains('sys--b');
      if (x.dataset.nl) { setLv(x.dataset.nl, x.dataset.ni); buzz([30, 50, 90]); Sound.chime(); unlock('upgrade'); }
      else if (!x.classList.contains('sys--echo')) Sound.blip(half);
      if (half && !still) { scramble(x); glitch(x); buzz([15, 40, 15]); }
      if (still || !hud || x.classList.contains('sys--echo')) return;
      hud.className = half ? 'b' : ''; void hud.offsetWidth;
      hud.classList.add(x.classList.contains('sys--up') ? 'up' : 'on');
      clearTimeout(ht); ht = setTimeout(function () { hud.className = ''; }, 1400);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  boxes.forEach(function (x) { io.observe(x); });
  if (!still) (function flick() { setTimeout(function () { visibleHalf.forEach(glitch); flick(); }, 6000 + Math.random() * 8000); })();
}

// ===== فحص النافذة: سجل كل ظهور سابق لنفس العنوان =====
var logP;
function inspect(el) {
  var k = el.dataset.k, i = +el.dataset.i;
  logP = logP || fetch('/syslog.json').then(function (r) { return r.json(); });
  logP.then(function (log) {
    var list = (log[k] || []).slice(0, i).reverse();
    var rows = list.map(function (e, j) {
      var body = e.r.map(function (l) {
        var m = l.match(/^(.{1,40}?):\s*([0-9.]+)%/);
        return m ? '<div class="m" style="--v:' + Math.min(100, +m[2]) + '"><span class="k">' + esc(m[1]) + '</span><span class="bar"><i></i></span><b>' + m[2] + '%</b></div>' : '<div>' + esc(l) + '</div>';
      }).join('');
      return '<li' + (j ? '' : ' class="now"') + '><a href="/c/' + String(e.c).padStart(3, '0') + '">الفصل ' + e.c + '</a> · ' + esc(e.h) + (j ? '' : ' <small>هذه النافذة</small>') + '<div class="lg-b">' + body + '</div></li>';
    }).join('');
    showCard('<div class="sheet-h"><b>سجل: ' + esc(k) + '</b><span class="path">' + list.length + ' ظهور حتى هنا</span><button type="button" class="x" data-close aria-label="إغلاق">✕</button></div><ol class="syslog">' + rows + '</ol>', 'log');
    unlock('inspect');
  });
}
$$('.chapter .sys[data-k]').forEach(function (el) {
  if (+el.dataset.i > 1) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'insp'; b.textContent = 'السجل ' + el.dataset.i;
    b.setAttribute('aria-label', 'سجل هذه النافذة'); b.onclick = function () { inspect(el); };
    var h = $('.sys-h', el); if (h) h.appendChild(b);
  }
  var lp;
  el.addEventListener('pointerdown', function () { lp = setTimeout(function () { lp = 0; inspect(el); buzz(20); }, 550); });
  ['pointerup', 'pointerleave', 'pointercancel', 'pointermove'].forEach(function (ev) { el.addEventListener(ev, function (e) { if (ev === 'pointermove' && e.pointerType !== 'touch') return; clearTimeout(lp); }); });
  el.addEventListener('dblclick', function () { inspect(el); });
  el.addEventListener('contextmenu', function (e) { if (e.pointerType === 'touch' || matchMedia('(pointer:coarse)').matches) e.preventDefault(); });
});

// ===== البطاقات =====
var cardEl = $('#card');
function showCard(html, kind) {
  if (!cardEl) return;
  var inner = $('.sheet-in', cardEl); inner.innerHTML = html; cardEl.dataset.kind = kind || '';
  openSheet(cardEl);
}
function personCard(p, extra) {
  showCard('<div class="sheet-h"><b><span class="sw-c" style="--sp:' + p.color + '"></span>' + esc(p.name) + '</b><span class="path">' + esc(p.role) + '</span><button type="button" class="x" data-close aria-label="إغلاق">✕</button></div><p class="pd">' + esc(p.desc) + '</p>' + (extra || '') + (R.dataset.page === 'people' ? '' : '<a class="more" href="/people#' + p.id + '">كل الشخصيات ←</a>'), 'person');
  unlock('card');
}
var PEOPLE = []; try { PEOPLE = JSON.parse(($('#people') || {}).textContent || '[]'); } catch (e) {}
var PLACES = []; try { PLACES = JSON.parse(($('#places') || {}).textContent || '[]'); } catch (e) {}
function onName(t) {
  if (t.dataset.p) { var p = PEOPLE.find(function (x) { return x.id === t.dataset.p; }); if (p) personCard(p); }
  else if (t.dataset.pl) openMap(t.dataset.pl);
}
document.addEventListener('click', function (e) { var t = e.target.closest('.chapter .nm'); if (t) onName(t); });
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('nm')) onName(e.target); });

// ===== جو المشهد (لوحة الجسيمات) + الصوت + مكان المشهد =====
var markers = $$('.scene');
var cv = $('#fx');
var Fx = { apply: function () {} };
window.fxToggle = function () {
  var off = !R.classList.contains('nofx'); R.classList.toggle('nofx', off);
  off ? store.set('fx', 'off') : store.del('fx'); pick(true);
};
if (cv && cv.getContext && !still) Fx = (function () {
  var g = cv.getContext('2d'), W = 0, H = 0, D = Math.min(devicePixelRatio || 1, 1.5), L = { snow: 0, fire: 0, rain: 0, water: 0 }, T = {}, ps = [], rp = [], dark = false, fr = 0, go = 0, run = 0;
  function size() { W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; g.setTransform(D, 0, 0, D, 0, 0); }
  size(); addEventListener('resize', size);
  function rnd(a, b) { return a + Math.random() * (b - a); }
  var k = Math.min(1, W / 700 + .45), cap = { snow: Math.round(70 * k), fire: Math.round(34 * k), rain: Math.round(55 * k) };
  function spawn(t) {
    if (t === 'snow') return { k: t, x: rnd(0, W), y: -8, r: rnd(1, 2.8), vy: rnd(.4, 1.1), ph: rnd(0, 6.3), a: rnd(.35, .8) };
    if (t === 'fire') return { k: t, x: rnd(0, W), y: H + 6, r: rnd(1, 2.6), vy: -rnd(.5, 1.5), ph: rnd(0, 6.3), a: rnd(.4, .9), life: rnd(.5, 1) };
    return { k: t, x: rnd(0, W + 60), y: -20, vy: rnd(9, 14), l: rnd(10, 18), a: rnd(.15, .35) };
  }
  function tick() {
    run = 0; fr++;
    if (fr % 45 === 1) dark = isDark();
    g.clearRect(0, 0, W, H);
    for (var key in L) { var t = T[key] ? 1 : 0; L[key] += (t - L[key]) * .03; if (Math.abs(t - L[key]) < .01) L[key] = t; if (L[key] > 0) run = 1; }
    ['snow', 'fire', 'rain'].forEach(function (s) { var n = Math.round(cap[s] * L[s]), c = 0; for (var i = 0; i < ps.length; i++) if (ps[i].k === s) c++; if (c < n && Math.random() < .5) ps.push(spawn(s)); });
    for (var i = ps.length - 1; i >= 0; i--) {
      var p = ps[i], lv = L[p.k];
      if (p.k === 'snow') { p.y += p.vy; p.x += Math.sin(p.ph += .02) * .5; g.fillStyle = dark ? 'rgba(235,242,255,' + p.a * lv * .7 + ')' : 'rgba(110,140,175,' + p.a * lv * .55 + ')'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill(); if (p.y > H + 6 || lv < .02) ps.splice(i, 1); }
      else if (p.k === 'fire') { p.y += p.vy; p.x += Math.sin(p.ph += .07) * .6; p.life -= .004; var fl = .6 + .4 * Math.sin(fr * .3 + p.ph); g.fillStyle = dark ? 'rgba(255,' + (150 + (p.life * 80 | 0)) + ',60,' + p.a * lv * fl * p.life + ')' : 'rgba(220,' + (70 + (p.life * 50 | 0)) + ',20,' + p.a * lv * fl * p.life * 1.1 + ')'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill(); if (p.life <= 0 || p.y < -8 || lv < .02) ps.splice(i, 1); }
      else { p.y += p.vy; p.x -= p.vy * .22; g.strokeStyle = dark ? 'rgba(170,200,235,' + p.a * lv + ')' : 'rgba(70,100,140,' + p.a * lv * .8 + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.l * .22, p.y - p.l); g.stroke(); if (p.y > H + 20 || lv < .02) ps.splice(i, 1); }
    }
    if (L.water > 0) {
      if (rp.length < 5 && Math.random() < .03 * L.water) rp.push({ x: rnd(.1, .9) * W, y: rnd(.15, .9) * H, r: 2, a: .4 });
      for (var j = rp.length - 1; j >= 0; j--) { var q = rp[j]; q.r += .55; q.a -= .003; if (q.a <= 0) { rp.splice(j, 1); continue; } g.strokeStyle = dark ? 'rgba(150,190,230,' + q.a * L.water * .7 + ')' : 'rgba(60,100,150,' + q.a * L.water * .55 + ')'; g.lineWidth = 1; g.beginPath(); g.ellipse(q.x, q.y, q.r * 1.9, q.r * .6, 0, 0, 6.3); g.stroke(); }
    }
    if (ps.length || rp.length || run) requestAnimationFrame(tick); else go = 0;
  }
  function start() { if (!go && !document.hidden) { go = 1; requestAnimationFrame(tick); } }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && (run || ps.length)) start(); });
  return { apply: function (s) { T = { snow: s.indexOf('snow') > -1, fire: s.indexOf('fire') > -1, rain: s.indexOf('rain') > -1, water: s.indexOf('water') > -1 }; start(); } };
})();

var vg = $('#vig'), pl = $('#pulse'), here = $('#here'), cur = null, curPl = '', sceneIdx = -1;
function pick(force) {
  if (!markers.length) return;
  var a = null, idx = -1, y = innerHeight * .5;
  for (var i = 0; i < markers.length; i++) { if (markers[i].getBoundingClientRect().top < y) { a = markers[i]; idx = i; } else break; }
  if (a === cur && !force) return;
  cur = a; sceneIdx = idx;
  var fx = a ? a.dataset.fx : '', off = R.classList.contains('nofx') || still, s = fx && !off ? fx.split(' ') : [];
  Fx.apply(s);
  if (vg) vg.classList.toggle('on', s.indexOf('night') > -1);
  if (!force && s.indexOf('blood') > -1 && pl) { pl.classList.remove('on'); void pl.offsetWidth; pl.classList.add('on'); buzz([60, 90, 60]); Sound.heart(); }
  Sound.set(off ? [] : (fx ? fx.split(' ') : []));
  if (fx) { var seen = H.moods; fx.split(' ').forEach(function (m) { if (seen.indexOf(m) < 0) seen.push(m); }); saveH(); if (['snow', 'fire', 'night', 'water', 'rain'].every(function (m) { return seen.indexOf(m) > -1; })) unlock('moods'); }
  // مكان المشهد: آخر مكان معروف حتى هذا المشهد.
  var p = '';
  for (var j = idx; j >= 0 && !p; j--) p = markers[j].dataset.pl;
  curPl = p;
  if (here) {
    var place = PLACES.find(function (x) { return x.id === p; });
    here.hidden = !place;
    if (place) { $('.nmx', here).textContent = place.name; here.classList.remove('pop'); void here.offsetWidth; here.classList.add('pop'); }
  }
}
var pt;
if (markers.length) { addEventListener('scroll', function () { if (pt) return; pt = setTimeout(function () { pt = 0; pick(); }, 120); }, { passive: true }); }

// ===== الخريطة =====
var mapSheet = $('#mapsheet');
function markMap(svg, focus, seenList) {
  $$('.mp', svg).forEach(function (g) { g.classList.toggle('cur', g.dataset.pl === focus); g.classList.toggle('seen', seenList.indexOf(g.dataset.pl) > -1); });
}
function trail(svg, ids) {
  var old = $('.trail', svg); if (old) old.remove();
  var pts = ids.map(function (id) { var g = $('.mp[data-pl="' + id + '"]', svg); return g && g.getAttribute('transform').match(/[\d.]+/g).join(','); }).filter(Boolean);
  if (pts.length < 2) return;
  var pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  pl.setAttribute('class', 'trail'); pl.setAttribute('points', pts.join(' '));
  svg.insertBefore(pl, $('.mp', svg));
}
function openMap(focus) {
  if (!mapSheet) return;
  var svg = $('svg', mapSheet), seq = [];
  markers.forEach(function (m, i) { if (i <= Math.max(sceneIdx, 0) && m.dataset.pl && seq[seq.length - 1] !== m.dataset.pl) seq.push(m.dataset.pl); });
  focus = focus || curPl;
  markMap(svg, focus, seq); trail(svg, seq);
  var place = PLACES.find(function (x) { return x.id === focus; });
  $('.pl-d', mapSheet).innerHTML = place ? '<b>' + esc(place.name) + '</b>: ' + esc(place.desc) : 'المس مكاناً لترى وصفه.';
  $('.path', mapSheet).textContent = seq.length ? 'مسار الفصل حتى هنا: ' + seq.map(function (id) { return (PLACES.find(function (x) { return x.id === id; }) || {}).name; }).join(' ← ') : '';
  closeSheet($('#menu')); openSheet(mapSheet); unlock('map');
}
if (here) here.onclick = function () { openMap(); };
var om = $('#open-map'); if (om) om.onclick = function () { openMap(); };
if (mapSheet) mapSheet.addEventListener('click', function (e) {
  var g = e.target.closest('.mp'); if (!g) return;
  var place = PLACES.find(function (x) { return x.id === g.dataset.pl; });
  $$('.mp', mapSheet).forEach(function (x) { x.classList.toggle('cur', x === g); });
  $('.pl-d', mapSheet).innerHTML = '<b>' + esc(place.name) + '</b>: ' + esc(place.desc);
});

// ===== الصوت المحيط: يُولَّد بـ Web Audio بلا أي ملف =====
var Sound = (function () {
  var ctx, master, layers = {}, noise = {}, want = [], timers = [];
  var on = function () { return store.get('snd') === 'on' && !still; };
  function buf(kind) {
    if (noise[kind]) return noise[kind];
    var len = ctx.sampleRate * 4, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; if (kind === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return (noise[kind] = b);
  }
  function src(kind) { var s = ctx.createBufferSource(); s.buffer = buf(kind); s.loop = true; s.start(); return s; }
  function filt(type, f, q) { var x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; }
  function lfo(rate, depth, param) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); }
  function layer(name) {
    if (layers[name]) return layers[name];
    var out = ctx.createGain(); out.gain.value = 0; out.connect(master);
    if (name === 'snow') { var bp = filt('bandpass', 520, .7); src('brown').connect(bp); bp.connect(out); lfo(.07, 260, bp.frequency); var a = ctx.createGain(); a.gain.value = 1; }
    if (name === 'fire') {
      var lp = filt('lowpass', 380); src('brown').connect(lp); var rg = ctx.createGain(); rg.gain.value = .55; lp.connect(rg); rg.connect(out);
      var hp = filt('highpass', 1800); hp.connect(out);
      timers.push(setInterval(function () {
        if (want.indexOf('fire') < 0 || Math.random() > .35) return;
        var s = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime, d = .01 + Math.random() * .035;
        s.buffer = buf('white'); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.25 + Math.random() * .4, t + .002); g.gain.exponentialRampToValueAtTime(.001, t + d);
        s.connect(g); g.connect(hp); s.start(t, Math.random() * 3, d + .01);
      }, 80));
    }
    if (name === 'rain') { var h = filt('highpass', 900), l = filt('lowpass', 7000), rg2 = ctx.createGain(); rg2.gain.value = .35; src('white').connect(h); h.connect(l); l.connect(rg2); rg2.connect(out); }
    if (name === 'water') {
      var b1 = filt('bandpass', 420, 2.5), b2 = filt('bandpass', 760, 3); var s1 = src('brown'); s1.connect(b1); s1.connect(b2); b1.connect(out); b2.connect(out);
      timers.push(setInterval(function () { var t = ctx.currentTime; b1.frequency.setTargetAtTime(280 + Math.random() * 400, t, .15); b2.frequency.setTargetAtTime(550 + Math.random() * 600, t, .1); }, 260));
    }
    if (name === 'night') {
      var wl = filt('lowpass', 220), wg = ctx.createGain(); wg.gain.value = .5; src('brown').connect(wl); wl.connect(wg); wg.connect(out);
      var o = ctx.createOscillator(), cg = ctx.createGain(); o.frequency.value = 4300; cg.gain.value = 0; o.connect(cg); cg.connect(out); o.start();
      timers.push(setInterval(function () {
        if (want.indexOf('night') < 0) return;
        var t = ctx.currentTime + Math.random() * .3;
        for (var i = 0; i < 3; i++) { cg.gain.setValueAtTime(0, t + i * .07); cg.gain.linearRampToValueAtTime(.05, t + i * .07 + .01); cg.gain.linearRampToValueAtTime(0, t + i * .07 + .045); }
      }, 1100));
    }
    return (layers[name] = out);
  }
  var LEVEL = { snow: .5, fire: .45, rain: .25, water: .35, night: .45 };
  function apply() {
    if (!ctx) return;
    ['snow', 'fire', 'rain', 'water', 'night'].forEach(function (n) {
      var w = want.indexOf(n) > -1;
      if (!w && !layers[n]) return;
      layer(n).gain.setTargetAtTime(w ? LEVEL[n] : 0, ctx.currentTime, 1.2);
    });
  }
  function init() {
    if (ctx || !on()) return;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .8; master.connect(ctx.destination);
    apply();
  }
  function wake() { if (on()) { init(); if (ctx && ctx.state !== 'running') ctx.resume(); } }
  ['pointerdown', 'keydown', 'touchend'].forEach(function (ev) { addEventListener(ev, wake, { passive: true }); });
  document.addEventListener('visibilitychange', function () { if (!ctx) return; document.hidden ? ctx.suspend() : on() && ctx.resume(); });
  function tone(f1, f2, dur, type, vol, delay) {
    if (!ctx || !on() || ctx.state !== 'running') return;
    var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + (delay || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + dur + .05);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .1);
  }
  return {
    set: function (list) { want = list; apply(); },
    toggle: function () {
      if (on()) { store.del('snd'); if (ctx) ctx.suspend(); }
      else { store.set('snd', 'on'); init(); if (ctx) ctx.resume(); apply(); unlock('sound'); tone(880, 1320, .08, 'sine', .05); }
    },
    blip: function (half) { half ? (tone(520, 380, .12, 'triangle', .05), tone(530, 300, .18, 'triangle', .03, .05)) : tone(1200, 1800, .07, 'sine', .04); },
    chime: function () { [660, 880, 1320].forEach(function (f, i) { tone(f, f * 1.01, .35, 'sine', .05, i * .11); }); },
    heart: function () { tone(70, 40, .14, 'sine', .45); tone(70, 40, .14, 'sine', .32, .28); },
    pending: function () { return on() && (!ctx || ctx.state !== 'running'); },
  };
})();
if (CH && Sound.pending()) toast('الصوت المحيط مفعّل: المس الشاشة لتشغيله.', 3500);
pick(true);

// ===== الراوي: قراءة الفصل بصوت الجهاز، بنبرة لكل شخصية وصوت آلي للنظام =====
var listenB = $('#listen');
var PITCH = { lin: [1, 1], shen: [1.2, 1.05], hu: [.85, .95], xiaodu: [1.35, 1.12], zhang: [.7, .92], wu: [1.05, .97], qian: [1.12, 1.05], agent: [.8, .95], yang: [.65, .88], laoma: [.75, .95], laodong: [.7, .95], qiu: [1.25, 1.1], tian: [.8, .92] };
var Narr = (function () {
  if (!listenB || !('speechSynthesis' in window)) return null;
  listenB.hidden = false;
  var S = speechSynthesis, playing = false, items = [], ii = 0, voice = null, reading = null;
  function pickVoice() { var v = S.getVoices().filter(function (x) { return /^ar/i.test(x.lang); }); voice = v.find(function (x) { return /ar-SA/i.test(x.lang); }) || v[0] || null; return voice; }
  pickVoice(); if (S.onvoiceschanged !== undefined) S.onvoiceschanged = pickVoice;
  function chunks(text) { return (text.match(/[^.!؟?…\n]+[.!؟?…]*["»]?/g) || [text]).map(function (s) { return s.trim(); }).filter(Boolean); }
  function build(from) {
    var out = [];
    $$('.chapter > p, .chapter > .sys').slice(from).forEach(function (el) {
      if (el.classList.contains('sys')) {
        var half = el.classList.contains('sys--b');
        chunks($$('.sys-h .t, .sys-b > div', el).map(function (d) { return d.textContent; }).join('. ')).forEach(function (s) { out.push({ el: el, t: s, p: half ? .7 : 1.45, r: half ? .92 : 1.12 }); });
        return;
      }
      var sp = el.dataset.sp, txt = el.textContent;
      txt.split(/(«[^»]*»)/).forEach(function (seg) {
        if (!seg.trim()) return;
        var q = seg[0] === '«', pr = q && sp && PITCH[sp] ? PITCH[sp] : [1, 1];
        chunks(seg.replace(/[«»]/g, '')).forEach(function (s) { out.push({ el: el, t: s, p: pr[0], r: pr[1] }); });
      });
    });
    return out;
  }
  function mark(el) {
    if (reading === el) return;
    if (reading) reading.classList.remove('reading');
    reading = el; if (!el) return;
    el.classList.add('reading');
    var r = el.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight - 40) el.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
  }
  function next() {
    if (!playing) return;
    if (ii >= items.length) { stop(); return; }
    var it = items[ii++], u = new SpeechSynthesisUtterance(it.t);
    u.lang = voice ? voice.lang : 'ar'; if (voice) u.voice = voice; u.pitch = it.p; u.rate = it.r;
    u.onend = next; u.onerror = function (e) { if (e.error !== 'interrupted' && e.error !== 'canceled') next(); };
    mark(it.el); S.speak(u);
  }
  function start() {
    if (!pickVoice()) { toast('لا يوجد صوت عربي مثبت على هذا الجهاز. أضفه من إعدادات «تحويل النص إلى كلام».', 5000); return; }
    var all = $$('.chapter > p, .chapter > .sys'), from = 0;
    for (var i = 0; i < all.length; i++) if (all[i].getBoundingClientRect().bottom > 90) { from = i; break; }
    items = build(from); ii = 0; playing = true; S.cancel();
    listenB.textContent = '⏸ توقف'; listenB.classList.add('on'); unlock('listen'); next();
  }
  function stop() { playing = false; S.cancel(); mark(null); listenB.textContent = '▶ استمع'; listenB.classList.remove('on'); }
  listenB.onclick = function () { playing ? stop() : start(); };
  addEventListener('pagehide', stop);
  return { stop: stop };
})();

// ===== «سابقاً»: لمن غاب أكثر من أسبوع =====
var recap = $('#recap'), seen = +store.get('seen') || 0;
if (recap && seen && Date.now() - seen > 7 * 864e5 && H.done.indexOf(CH) < 0) {
  recap.hidden = false;
  var d = Math.round((Date.now() - seen) / 864e5);
  $('.recap-h b', recap).textContent = 'سابقاً · غبت ' + d + ' يوماً';
  $('.x', recap).onclick = function () { recap.hidden = true; };
}
store.set('seen', Date.now());

// ===== المضيف: القارئ تحت مراقبة النظام =====
function today(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function streak() {
  var n = 0, d = new Date();
  while (H.days.indexOf(today(d)) > -1) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
if (CH) {
  if (H.days.indexOf(today()) < 0) { H.days.push(today()); H.days = H.days.slice(-400); saveH(); }
  var s = streak(); if (s >= 3) unlock('streak3'); if (s >= 7) unlock('streak7');
  if (new Date().getHours() < 4) unlock('night');
  if (R.classList.contains('cine')) unlock('cine');
  document.addEventListener('chapterdone', function () {
    if (H.done.indexOf(CH) > -1) return;
    H.done.push(CH); saveH();
    var n = H.done.length;
    unlock('first'); if (n >= 5) unlock('c5'); if (n >= 10) unlock('c10'); if (n >= 25) unlock('c25'); if (n >= 50) unlock('c50'); if (n >= 100) unlock('c100');
    PHASES.forEach(function (p) { for (var c = p[1]; c <= p[2]; c++) if (H.done.indexOf(c) < 0) return; unlock(p[0]); });
  });
}

// ===== الصفحات: الشخصيات، الخريطة، اللوحة، المضيف =====
var app = $('#app'), PAGE = R.dataset.page;
if (app && PAGE && PAGE !== 'index') data().then(function (D) {
  var max = D.ch.length ? D.ch[D.ch.length - 1].n : 0;
  var limit = Math.min(max, lastRead() || 1);
  if (PAGE === 'host') return hostPage(D);
  // شريط «حتى الفصل»: الصفحات لا تكشف ما بعد آخر فصل قرأته إلا إذا طلب القارئ.
  var ctl = document.createElement('div'); ctl.className = 'limit';
  ctl.innerHTML = '<label for="lim">حتى الفصل <b></b></label><input id="lim" type="range" min="1" max="' + max + '" value="' + limit + '"><small>' + (lastRead() ? 'يبدأ من آخر فصل قرأته' : 'لم تقرأ بعد؛ حرّك الشريط لترى أكثر') + '</small>';
  app.appendChild(ctl);
  var view = document.createElement('div'); app.appendChild(view);
  var input = $('input', ctl), lab = $('b', ctl);
  function draw() { var n = +input.value; lab.textContent = n; var chs = D.ch.filter(function (c) { return c.n <= n; }); (PAGE === 'people' ? peoplePage : PAGE === 'stats' ? statsPage : mapPage)(D, chs, view, n); }
  input.oninput = draw; draw();
});

function coStats(D, chs) {
  var cnt = {}, first = {}, co = {};
  chs.forEach(function (c) {
    c.sc.forEach(function (s) {
      s.ppl.forEach(function (a) { cnt[a] = (cnt[a] || 0) + 1; if (!first[a]) first[a] = c.n; });
      for (var i = 0; i < s.ppl.length; i++) for (var j = i + 1; j < s.ppl.length; j++) { var k = [s.ppl[i], s.ppl[j]].sort().join('|'); co[k] = (co[k] || 0) + 1; }
    });
  });
  return { cnt: cnt, first: first, co: co };
}
function peoplePage(D, chs, view) {
  var st = coStats(D, chs), ppl = D.people.filter(function (p) { return st.cnt[p.id]; });
  var W = 380, Hh = 400, nodes = ppl.map(function (p, i) { var a = i / ppl.length * 6.283; return { p: p, x: W / 2 + Math.cos(a) * 120, y: Hh / 2 + Math.sin(a) * 120, vx: 0, vy: 0, r: 5 + Math.sqrt(st.cnt[p.id]) * 1.6 }; });
  var byId = {}; nodes.forEach(function (n) { byId[n.p.id] = n; });
  var edges = Object.keys(st.co).map(function (k) { var ab = k.split('|'); return { a: byId[ab[0]], b: byId[ab[1]], w: st.co[k] }; }).filter(function (e) { return e.a && e.b; });
  var maxW = Math.max.apply(null, edges.map(function (e) { return e.w; }).concat(1));
  for (var it = 0; it < 500; it++) {
    var cool = 1 - it / 500;
    nodes.forEach(function (a) { nodes.forEach(function (b) { if (a === b) return; var dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + .01, d = Math.sqrt(d2), f = 3200 / d2; a.vx += dx / d * f; a.vy += dy / d * f; }); });
    edges.forEach(function (e) { var dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, d = Math.sqrt(dx * dx + dy * dy) + .01, target = 170 - 80 * e.w / maxW, f = (d - target) * .012; e.a.vx += dx / d * f; e.a.vy += dy / d * f; e.b.vx -= dx / d * f; e.b.vy -= dy / d * f; });
    nodes.forEach(function (n) { n.vx += (W / 2 - n.x) * .008; n.vy += (Hh / 2 - n.y) * .008; n.x += n.vx * .5 * cool; n.y += n.vy * .5 * cool; n.vx *= .6; n.vy *= .6; });
    // لا تتراكب الدوائر ولا أسماؤها.
    nodes.forEach(function (a) { nodes.forEach(function (b) { if (a === b) return; var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy) + .01, min = a.r + b.r + 18; if (d < min) { var m = (min - d) / 2; a.x += dx / d * m; a.y += dy / d * m; b.x -= dx / d * m; b.y -= dy / d * m; } }); });
    nodes.forEach(function (n) { n.x = Math.max(n.r + 26, Math.min(W - n.r - 26, n.x)); n.y = Math.max(n.r + 4, Math.min(Hh - n.r - 18, n.y)); });
  }
  var svg = '<svg class="net" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="شبكة الشخصيات">' +
    edges.map(function (e) { return '<line x1="' + e.a.x.toFixed(1) + '" y1="' + e.a.y.toFixed(1) + '" x2="' + e.b.x.toFixed(1) + '" y2="' + e.b.y.toFixed(1) + '" stroke-width="' + (.6 + 3.4 * e.w / maxW).toFixed(2) + '" data-tip="' + esc(e.a.p.name + ' و' + e.b.p.name + ': ' + e.w + ' مشهداً معاً') + '"/>'; }).join('') +
    nodes.map(function (n) { return '<g class="nd" data-id="' + n.p.id + '" transform="translate(' + n.x.toFixed(1) + ' ' + n.y.toFixed(1) + ')" tabindex="0" role="button" data-tip="' + esc(n.p.name + ': ' + st.cnt[n.p.id] + ' مشهداً') + '"><circle r="' + n.r.toFixed(1) + '" style="--sp:' + n.p.color + '"/><text y="' + (n.r + 13).toFixed(1) + '">' + esc(n.p.name) + '</text></g>'; }).join('') + '</svg>';
  var list = ppl.slice().sort(function (a, b) { return st.cnt[b.id] - st.cnt[a.id]; }).map(function (p) {
    return '<li id="' + p.id + '"><button type="button" data-id="' + p.id + '"><span class="sw-c" style="--sp:' + p.color + '"></span><b>' + esc(p.name) + '</b><small>' + esc(p.role) + ' · ' + st.cnt[p.id] + ' مشهداً · منذ الفصل ' + st.first[p.id] + '</small></button></li>';
  }).join('');
  view.innerHTML = svg + '<ul class="plist">' + list + '</ul>';
  function card(id) {
    var p = D.people.find(function (x) { return x.id === id; });
    var with_ = Object.keys(st.co).filter(function (k) { return k.split('|').indexOf(id) > -1; }).sort(function (a, b) { return st.co[b] - st.co[a]; }).slice(0, 3).map(function (k) { var o = k.split('|').find(function (x) { return x !== id; }); return (D.people.find(function (x) { return x.id === o; }) || {}).name + ' (' + st.co[k] + ')'; });
    personCard(p, '<p class="pd"><small>يظهر في ' + st.cnt[id] + ' مشهداً منذ الفصل ' + st.first[id] + (with_.length ? '. أكثر من يرافقه: ' + esc(with_.join('، ')) : '') + '.</small></p>');
  }
  view.onclick = function (e) { var t = e.target.closest('[data-id]'); if (t) card(t.dataset.id); };
  view.onkeydown = function (e) { if (e.key === 'Enter') { var t = e.target.closest('[data-id]'); if (t) card(t.dataset.id); } };
  if (location.hash && st.cnt[location.hash.slice(1)]) { card(location.hash.slice(1)); history.replaceState(null, '', location.pathname); }
}

var MOODS = [['snow', 'ثلج'], ['fire', 'نار'], ['water', 'ماء'], ['night', 'ليل'], ['rain', 'مطر']];
function statsPage(D, chs, view) {
  if (!chs.length) { view.innerHTML = ''; return; }
  var last = chs[chs.length - 1], words = chs.reduce(function (a, c) { return a + c.w; }, 0), sys = chs.reduce(function (a, c) { return a + c.sys.length; }, 0);
  var day = chs.reduce(function (a, c) { return Math.max(a, c.day || 0); }, 0);
  var tiles = [['الفصول', chs.length], ['الكلمات', words.toLocaleString('ar')], ['نوافذ النظام', sys], ['التكامل', last.i1 + '%'], ['اليوم في الرواية', day || '—'], ['الفصل من السنة', D.seasons[last.se]]];
  var html = '<div class="tiles">' + tiles.map(function (t) { return '<div class="tile"><small>' + t[0] + '</small><b>' + t[1] + '</b></div>'; }).join('') + '</div>';
  var n = chs.length, cw = 340, x = function (i) { return 30 + (i + .5) * (cw - 34) / n; }, bw = Math.max(1.5, (cw - 34) / n - 2);
  // التكامل: خط درجي.
  var imax = Math.max(5, Math.max.apply(null, chs.map(function (c) { return c.i1; })));
  var y1 = function (v) { return 110 - v / imax * 90; };
  var pts = chs.map(function (c, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y1(c.i1).toFixed(1); }).join(' ');
  html += fig('التكامل عبر الفصول', '<svg viewBox="0 0 340 130" class="ch">' + grid(y1, [0, imax], imax) + '<path class="ln" d="' + pts + '"/>' + chs.map(function (c, i) { return '<rect class="hit" x="' + (x(i) - (cw - 34) / n / 2).toFixed(1) + '" y="10" width="' + ((cw - 34) / n).toFixed(1) + '" height="100" data-tip="الفصل ' + c.n + ': تكامل ' + c.i1 + '%"/>'; }).join('') + axis(chs, x) + '</svg>');
  // نوافذ النظام لكل فصل: أعمدة.
  var smax = Math.max(1, Math.max.apply(null, chs.map(function (c) { return c.sys.length; })));
  var y2 = function (v) { return 110 - v / smax * 90; };
  html += fig('نوافذ النظام في كل فصل', '<svg viewBox="0 0 340 130" class="ch">' + grid(y2, [0, smax], smax) + chs.map(function (c, i) { var h = 110 - y2(c.sys.length); return '<rect class="br" x="' + (x(i) - bw / 2).toFixed(1) + '" y="' + y2(c.sys.length).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '" rx="' + Math.min(2, bw / 2) + '" data-tip="الفصل ' + c.n + ': ' + c.sys.length + ' نوافذ"/>'; }).join('') + axis(chs, x) + '</svg>');
  // الثقة: كل قيمة «ثقة» نقطة.
  var dots = [];
  chs.forEach(function (c, i) { c.sys.forEach(function (s) { s.m.forEach(function (m) { if (/الثقة/.test(m[0])) dots.push([i, m[1], c.n, s.k]); }); }); });
  var y3 = function (v) { return 110 - v / 100 * 90; };
  html += fig('ثقة النظام في تحليلاته', dots.length ? '<svg viewBox="0 0 340 130" class="ch">' + grid(y3, [0, 50, 100], 100, '%') + dots.map(function (d) { return '<circle class="dt" cx="' + x(d[0]).toFixed(1) + '" cy="' + y3(d[1]).toFixed(1) + '" r="4" data-tip="الفصل ' + d[2] + ' · ' + esc(d[3]) + ': ' + d[1] + '%"/>'; }).join('') + axis(chs, x) + '</svg>' : '<p class="empty">لم تظهر نسبة ثقة بعد.</p>');
  // شريط الطقس: كل مشهد خانة بلون جوه.
  var rows = chs.map(function (c, i) { return c.sc.map(function (s, j) { var m = (s.fx || '').split(' ')[0]; return '<rect class="mo ' + (m ? 'mo-' + m : 'mo-none') + '" x="' + (x(i) - bw / 2).toFixed(1) + '" y="' + (106 - j * 9) + '" width="' + bw.toFixed(1) + '" height="7" rx="1.5" data-tip="الفصل ' + c.n + '، المشهد ' + (j + 1) + ': ' + (s.fx ? s.fx.split(' ').map(function (k) { return (MOODS.find(function (q) { return q[0] === k; }) || [0, k === 'blood' ? 'دم' : k])[1]; }).join('، ') : 'بلا جو خاص') + '"/>'; }).join(''); }).join('');
  html += fig('طقس المشاهد', '<svg viewBox="0 0 340 130" class="ch">' + rows + axis(chs, x) + '</svg><div class="legend">' + MOODS.map(function (m) { return '<span><i class="mo-' + m[0] + '"></i>' + m[1] + '</span>'; }).join('') + '<span><i class="mo-none"></i>بلا جو</span></div>');
  // الأماكن.
  var pc = {}; chs.forEach(function (c) { c.sc.forEach(function (s) { if (s.pl) pc[s.pl] = (pc[s.pl] || 0) + 1; }); });
  var top = Object.keys(pc).sort(function (a, b) { return pc[b] - pc[a]; }).slice(0, 7), pmax = Math.max(1, pc[top[0]] || 1);
  html += fig('أين جرت المشاهد', '<div class="hbars">' + top.map(function (id) { var p = D.places.find(function (q) { return q.id === id; }); return '<div class="hb" data-tip="' + esc(p.name) + ': ' + pc[id] + ' مشهداً"><span>' + esc(p.name) + '</span><i style="--v:' + (pc[id] / pmax * 100).toFixed(1) + '"></i><b>' + pc[id] + '</b></div>'; }).join('') + '</div>');
  view.innerHTML = html;
}
function fig(t, body) { return '<figure class="fig"><figcaption>' + t + '</figcaption>' + body + '</figure>'; }
function grid(y, ticks, max, unit) {
  if (ticks.length === 2) ticks = max % 2 ? [0, max] : [0, max / 2, max];
  return ticks.map(function (v) { return '<line class="gr" x1="30" x2="336" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="tk" x="24" y="' + (y(v) + 3).toFixed(1) + '">' + v + (unit || '') + '</text>'; }).join('');
}
function axis(chs, x) {
  var step = Math.max(1, Math.ceil(chs.length / 6));
  return chs.map(function (c, i) { return i % step && i !== chs.length - 1 ? '' : '<text class="tk tx" x="' + x(i).toFixed(1) + '" y="124">' + c.n + '</text>'; }).join('');
}
function mapPage(D, chs, view) {
  var svg = $('.map-page svg');
  var by = {}; chs.forEach(function (c) { c.sc.forEach(function (s) { if (s.pl) (by[s.pl] = by[s.pl] || []).indexOf(c.n) < 0 && by[s.pl].push(c.n); }); });
  markMap(svg, '', Object.keys(by));
  view.innerHTML = '<p class="pl-d">المس مكاناً على الخريطة.</p>';
  svg.onclick = function (e) {
    var g = e.target.closest('.mp'); if (!g) return;
    var p = D.places.find(function (q) { return q.id === g.dataset.pl; }), list = by[p.id] || [];
    $$('.mp', svg).forEach(function (x) { x.classList.toggle('cur', x === g); });
    view.innerHTML = '<p class="pl-d"><b>' + esc(p.name) + '</b>: ' + esc(p.desc) + '</p>' + (list.length ? '<p class="chs">جرت فيه مشاهد من الفصول: ' + list.map(function (n) { return '<a href="/c/' + String(n).padStart(3, '0') + '">' + n + '</a>'; }).join(' ') + '</p>' : '<p class="chs">لم يظهر بعد فيما قرأت.</p>');
    unlock('map');
  };
}
function hostPage(D) {
  var max = D.ch.length, m = max ? Math.round(H.done.length / max * 100) : 0, got = ACH.filter(function (a) { return H.ach[a[0]]; }).length;
  app.innerHTML = '<div class="sys host-sys" data-lv="' + R.dataset.lv + '"><div class="sys-h"><span class="t">حالة المضيف</span></div><div class="sys-b">' +
    '<div class="m" style="--v:' + m + '"><span class="k">تطابق المضيف</span><span class="bar"><i></i></span><b>' + m + '%</b></div>' +
    '<div>الفصول المكتملة: ' + H.done.length + ' من ' + max + '</div><div>أيام القراءة: ' + H.days.length + ' · المتتالية الآن: ' + streak() + '</div><div>الإنجازات: ' + got + ' من ' + ACH.length + '</div></div></div>' +
    '<ul class="achs">' + ACH.map(function (a) { var t = H.ach[a[0]]; return '<li class="' + (t ? 'got' : 'lock') + '"><b>' + (t ? esc(a[1]) : '؟؟؟') + '</b><small>' + esc(a[2]) + (t ? ' · ' + new Date(t).toLocaleDateString('ar') : '') + '</small></li>'; }).join('') + '</ul>' +
    '<button type="button" class="reset">مسح سجل المضيف</button>';
  $('.reset', app).onclick = function () { if (confirm('مسح كل الإنجازات والفصول المكتملة من هذا الجهاز؟')) { store.del('host'); location.reload(); } };
}

// ===== تلميح عائم للرسوم =====
var tip;
document.addEventListener('pointerover', function (e) {
  var t = e.target.closest && e.target.closest('[data-tip]');
  if (!t) { if (tip) tip.hidden = true; return; }
  if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip); }
  tip.textContent = t.dataset.tip; tip.hidden = false;
  var r = t.getBoundingClientRect();
  tip.style.left = Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2)) + 'px';
  tip.style.top = Math.max(8, r.top - tip.offsetHeight - 8) + 'px';
});
addEventListener('scroll', function () { if (tip) tip.hidden = true; }, { passive: true });
})();
