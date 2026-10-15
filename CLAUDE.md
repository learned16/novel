# رواية «نظام السيادة الحضارية»

هذا المستودع يحتوي رواية عربية وموقع قراءة لها.

## كتابة فصل

اقرأ `STYLE.md` كاملاً قبل كتابة أي فصل، والتزم به حرفياً. فيه ترتيب المراجع، وشكل الملف، وقواعد النظام والشخصيات، وما تفعله بعد كل فصل.

- اكتب الفصول **بالترتيب**، ولا تكتب فصلاً قبل وجود الفصل الذي قبله.
- اكتب فقط الفصول التي لها مخطط في `outline/arc-XX.md`. إذا انتهى مخطط القوس، توقف وأبلغ المستخدم.
- لا تعدّل الفصول المنشورة ولا ملفات `outline/` ما عدا `summary.md`، إلا إذا طلب المستخدم.

## الموقع

- **النسخة الأساسية للقراءة: Artifact على claude.ai** — https://claude.ai/artifact/NVhoCw8tEaoBBb7X9PHGsJ
  - بعد كل دفعة فصول: `node build-artifact.js` ثم انشر `artifact/novel.html` بأداة Artifact مع `url` أعلاه (لا تنشئ artifact جديداً).

- `node build.js` يبني `site/` من `chapters/NNN.md`.
- ملف `wrangler.jsonc` ينشر `site/` على Cloudflare كـ Worker اسمه `novel` (https://novel.44trm84.workers.dev). لا تغيّر الاسم.

## Git

- **الموقع ينشر من الفرع `ccr-ab5c89b0-9giqf0` فقط.** اسحبه في البداية (`git fetch origin ccr-ab5c89b0-9giqf0 && git checkout ccr-ab5c89b0-9giqf0`)، واعمل commit بعد كل فصل، ثم `git push origin HEAD:ccr-ab5c89b0-9giqf0`.
- إذا فرضت عليك الجلسة فرعاً آخر، ادفع إليه أيضاً، لكن لا تنسَ الدفع إلى `ccr-ab5c89b0-9giqf0`.
