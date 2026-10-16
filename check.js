// فاحص جودة الفصول: يطبع تحذيرات حين يخالف فصل قواعد STYLE.md.
// رسالة من سطر واحد بخط عريض (صدى لسطر سابق) مسموحة بلا عنوان.
// الاستخدام: node check.js        (تحذيرات فقط)
//           node check.js --strict (يفشل إن وُجدت مخالفة)
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'chapters');
const BANNED = ['الفصل السابق', 'الفصل التالي', 'ملاحظة المؤلف', 'ملاحظة للمؤلف', 'TODO', 'المخطط', 'outline', 'STYLE.md'];

function check() {
  const files = fs.readdirSync(SRC).filter((f) => /^\d{3}\.md$/.test(f)).sort();
  const issues = [];
  const add = (f, msg) => issues.push(`${f.slice(0, 3)}: ${msg}`);
  files.forEach((f, i) => {
    const n = parseInt(f, 10);
    if (n !== i + 1) add(f, `رقم غير متسلسل (المتوقع ${String(i + 1).padStart(3, '0')})`);
    const md = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r/g, '');
    const lines = md.split('\n');
    if (!/^# الفصل [^:]+: .+/.test(lines[0])) add(f, 'السطر الأول ليس بصيغة «# الفصل ...: العنوان»');
    const words = md.split(/\s+/).filter(Boolean).length;
    if (n > 3 && (words < 1800 || words > 2300)) add(f, `الطول ${words} كلمة (المطلوب 1800–2300)`);
    const blocks = md.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    const sys = blocks.filter((b) => b.startsWith('>'));
    if (n > 3 && sys.length > 4) add(f, `${sys.length} رسائل نظام (الحد 4)`);
    sys.forEach((b) => { const one = !b.includes('\n') && /^> \*\*[^\[].*\*\*$/.test(b); if (!one && !/^> \*\*\[.+\]\*\*$/.test(b.split('\n')[0])) add(f, `رسالة نظام بلا عنوان: «${b.split('\n')[0].slice(0, 40)}»`); });
    lines.forEach((l, j) => {
      if (j > 0 && /^#{1,6} /.test(l)) add(f, `عنوان فرعي في السطر ${j + 1}`);
      if (/^\s*([-*+]|\d+\.) /.test(l) && !l.startsWith('>')) add(f, `قائمة في السطر ${j + 1}`);
    });
    const prose = blocks.filter((b) => !b.startsWith('>')).join('\n');
    const latin = prose.match(/[A-Za-z]{2,}/g);
    if (latin) add(f, `حروف لاتينية في النص: ${[...new Set(latin)].slice(0, 5).join('، ')}`);
    BANNED.forEach((w) => { if (prose.includes(w)) add(f, `عبارة خارج القصة: «${w}»`); });
    const seen = new Set();
    blocks.forEach((b) => { if (b.length > 60) { if (seen.has(b)) add(f, `فقرة مكررة: «${b.slice(0, 40)}…»`); seen.add(b); } });
  });
  return issues;
}

module.exports = check;

if (require.main === module) {
  const issues = check();
  issues.forEach((m) => console.log('⚠ ' + m));
  console.log(issues.length ? `${issues.length} تحذير` : 'كل الفصول سليمة');
  if (issues.length && process.argv.includes('--strict')) process.exit(1);
}
