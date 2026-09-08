# U-TypeScript — Performance Baseline & Optimization Roadmap

> مبنای اندازه‌گیری برای فاز «بهینه‌سازی سرعت» — پس از تثبیت کامل (۱۰۰٪ تست‌سوئیت سبز؛ جز یک خطای محیطی اثبات‌شده مستقل).
>
> - تاریخ: 2026-09-08 (UTC)
> - محیط: سندباکس 2 vCPU / ~2GB RAM / Node v20.20.2 / Linux x64
> - ⚠ اعداد مطلق وابسته به محیط‌اند؛ مقایسه‌ها همیشه قبل/بعد در همان محیط انجام شوند.

## ۱. ورک‌لودهای استاندارد

| ID | شرح | فایل‌ها |
|----|------|---------|
| A | Self typecheck — کامپایل خودِ سورس کامپایلر (`src/compiler/*.ts`) با `--noEmit --skipLibCheck` | ۳۹ |
| B | User corpus — ۳۰۰ فایل تست کاربر با `--strict --noEmit --skipLibCheck` | ۳۰۰ |
| C | Emit — همان corpus با خروجی JS | ۳۰۰ |

## ۲. نتایج Baseline (ثانیه، کمینهٔ ۳ اجرا)

| Workload | run1 | run2 | run3 | بهترین |
|----------|------|------|------|--------|
| A | 16.757 | 15.384 | 14.993 | **14.99** |
| B | 0.701 | 0.659 | 0.627 | **0.63** |
| C | 1.833 | 1.806 | 1.898 | **1.81** |

## ۳. Hotspot های شناسایی‌شده (CPU Profile — Workload A)

| سهم خودزمان | تابع / گروه |
|-------------|-------------|
| **9.6%** | **(garbage collector)** — فشار تخصیص حافظه؛ بزرگ‌ترین فرصت بهینه‌سازی |
| ~5.7% (مجموع) | پشتهٔ مقایسهٔ تایپ: `checkTypeRelatedTo` (1.4%)، `isTypeRelatedTo` (1.3%)، `isRelatedTo` (1.2%)، `recursiveTypeRelatedTo` (1.0%)، `isSimpleTypeRelatedTo` (0.8%) |
| ~3.2% (مجموع) | تحلیل flow: `getFlowTypeOfReference` (1.3%)، `getTypeAtFlowNode` (1.1%)، `narrowType` (0.8%) |
| ~3.2% (مجموع) | resolve سیمبل: `resolveNameHelper` (1.2%)، `getResolvedSymbol` (1.2%)، `isMatchingReference` (0.8%) |
| 1.6% | `checkIdentifier` |
| 1.2% | `scan` (اسکنر) |
| 0.7% | `computeLineStarts` |
| 0.7% | `createUnionOrIntersectionProperty` |

## ۴. نقشه راه بهینه‌سازی

اصول پذیرش هر تغییر: (۱) benchmark قبل/بعد در همان محیط با `scripts/perf/baseline.sh`، (۲) اجرای کامل تست‌سوئیت، (۳) حفظ کامل semantics — بدون استثنا.

1. **کاهش تخصیص‌ها (حمل بر GC ~10%)** — پروفایل‌محور: شناسایی و حذف آرایه‌ها/رشته‌های میانی در مسیرهای داغ checker؛ بازاستفاده از بافرها؛ کاهش بسته‌بندی (boxing).
2. **پشتهٔ مقایسهٔ تایپ (~6%)** — early-exitهای ارزان‌تر در `isSimpleTypeRelatedTo`، کش بهتر نتایج رابطه برای جفت‌تایپ‌های تکرارشونده، کاهش ساخت depth-structureها در `recursiveTypeRelatedTo`.
3. **تحلیل flow (~3%)** — هزینهٔ cache-key در `getFlowTypeOfReference` و مسیرهای `narrowType`.
4. **Scanner/Parser (~1.2% + bind)** — مسیرهای تخصیص رشته در `scan` و `computeLineStarts`.
5. **بهینه‌سازی سطح V8** — مونومورفیسم فراخوانی‌ها، ترتیب پراپرتی اشیاء داغ، Map در برابر آبجکت.
6. **مسیر استراتژیک (توجه):** سقف micro-optimization در پیاده‌سازی JS محدود است (پیش‌بینی: ارقام تک‌رقمی درصدی). خود مایکروسافت برای جهش واقعی سرعت به پورت بومی Go (typescript-go) روی آورده است. برای «تحول» چندبرابری، مهاجرت/هم‌افزایی با پورت بومی مسیر استراتژیک است.

## ۵. روش اندازه‌گیری استاندارد

```bash
npm run build:compiler
bash scripts/perf/baseline.sh          # خروجی کنسول + cpuprofile در .perf/
```
