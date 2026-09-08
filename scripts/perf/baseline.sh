#!/bin/bash
# U-TypeScript — استاندارد اندازه‌گیری پرفورمنس کامپایلر
# هر بهینه‌سازی باید قبل/بعد از این benchmark (در همان ماشین) اندازه‌گیری شود.
# استفاده: bash scripts/perf/baseline.sh
set -u
cd "$(dirname "$0")/../.." || exit 1
TSC=built/local/tsc.js
OUT_DIR="${1:-.perf}"
export TIMEFORMAT='%R'
mkdir -p "$OUT_DIR"

if [ ! -f "$TSC" ]; then
    echo "خطا: ابتدا کامپایلر را بیلد کنید (npm run build:compiler)" >&2
    exit 1
fi

echo "### U-TypeScript Compiler Performance Benchmark ###"
date -u
node --version
echo

SELF_FILES=$(ls src/compiler/*.ts)
CORPUS=$(ls tests/cases/compiler/a*.ts | head -300)

echo "== Workload A: self typecheck (src/compiler, $(echo "$SELF_FILES" | wc -l) files) =="
for i in 1 2 3; do
    echo -n "run$i: "
    { time node $TSC --noEmit --skipLibCheck $SELF_FILES > /dev/null 2>&1; } 2>&1
done
echo

echo "== Workload B: user corpus (300 files, --strict --noEmit) =="
for i in 1 2 3; do
    echo -n "run$i: "
    { time node $TSC --noEmit --strict --skipLibCheck $CORPUS > /dev/null 2>&1; } 2>&1
done
echo

echo "== Workload C: emit (300 files) =="
rm -rf /tmp/uts-perf-out
for i in 1 2 3; do
    echo -n "run$i: "
    { time node $TSC --strict --skipLibCheck --outDir /tmp/uts-perf-out $CORPUS > /dev/null 2>&1; } 2>&1
    rm -rf /tmp/uts-perf-out
done
echo

echo "== CPU profile (Workload A) -> $OUT_DIR =="
node --cpu-prof --cpu-prof-dir="$OUT_DIR" $TSC --noEmit --skipLibCheck $SELF_FILES > /dev/null 2>&1
echo "done."
