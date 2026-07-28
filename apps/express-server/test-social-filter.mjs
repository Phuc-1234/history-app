// test-social-filter.mjs
//
// Unit test CHO RIÊNG logic thuần (không cần DB, không cần TS runner).
// Bảo vệ khỏi:
//  - vòng lặp vô hạn trong intersection bạn chung
//  - off-by-one / overflow trong safeRawLimit
//  - map tab sai → gửi filter sai
//  - SQL injection qua param filter
//
// Chạy: node test-social-filter.mjs

function safeRawLimit(value, fallback = 80, max = 400) {
    const n = Math.floor(Number(value) || fallback);
    return Math.min(Math.max(n, 1), max);
}

// Tái hiện intersection bạn chung (cùng logic như getMutualFriendCount).
function countMutual(a, b) {
    if (a.length === 0 || b.length === 0) return 0;
    const bSet = new Set(b);
    let count = 0;
    for (const id of a) if (bSet.has(id)) count++;
    return count;
}

const TAB_TO_FILTER = {
    "Tất cả": "all",
    "Bạn chung": "mutual",
    "Đang học": "learning",
    "Gần đây": "recent",
};

const ALLOWED = new Set(["all", "mutual", "learning", "recent"]);
function parseFilter(v) {
    const s = typeof v === "string" ? v.trim().toLowerCase() : "";
    return ALLOWED.has(s) ? s : "all";
}

// ---- Mini test harness ----
let pass = 0;
let fail = 0;
function assert(cond, msg) {
    if (cond) {
        pass++;
    } else {
        fail++;
        console.error("  X FAIL:", msg);
    }
}

// ==================== TEST CASES ====================

console.log("\n[Test] safeRawLimit");
assert(safeRawLimit(10) === 10, "gia tri binh thuong");
assert(safeRawLimit(0) === 80, "0 -> fallback");
assert(safeRawLimit(NaN) === 80, "NaN -> fallback");
assert(safeRawLimit(-5) === 1, "am -> clamp ve 1");
assert(safeRawLimit(99999) === 400, "rat lon -> clamp ve max 400");
assert(safeRawLimit(Infinity) === 400, "Infinity -> max");
assert(safeRawLimit(3.7) === 3, "so thuc -> floor");

console.log("\n[Test] countMutual (intersection ban chung)");
assert(countMutual([], []) === 0, "ca hai rong");
assert(countMutual(["a", "b"], []) === 0, "mot ben rong");
assert(countMutual(["a", "b", "c"], ["b", "c", "d"]) === 2, "co 2 chung");
assert(countMutual(["a"], ["a"]) === 1, "1 chung");
assert(countMutual(["x", "y"], ["a", "b"]) === 0, "khong chung");

// Quan trong: khong bi treo voi input lon
const big1 = Array.from({ length: 10000 }, (_, i) => "u" + i);
const big2 = Array.from({ length: 10000 }, (_, i) => "u" + (i + 5000));
const t0 = Date.now();
const bigResult = countMutual(big1, big2);
const dt = Date.now() - t0;
assert(bigResult === 5000, "intersection lon dung (5000)");
assert(dt < 100, `intersection 10k phan tu < 100ms (thuc te ${dt}ms) - khong vong lap O(n^2)`);

console.log("\n[Test] TAB_TO_FILTER mapping");
assert(TAB_TO_FILTER["Tat ca"] === undefined, "(test ky tu dau)");
assert(TAB_TO_FILTER["Tất cả"] === "all", "tab Tat ca -> all");
assert(TAB_TO_FILTER["Bạn chung"] === "mutual", "tab Ban chung -> mutual");
assert(TAB_TO_FILTER["Đang học"] === "learning", "tab Dang hoc -> learning");
assert(TAB_TO_FILTER["Gần đây"] === "recent", "tab Gan day -> recent");
assert(TAB_TO_FILTER["không tồn tại"] === undefined, "tab la -> undefined (fallback all)");

console.log("\n[Test] parseFilter (backend validation + injection)");
assert(parseFilter("all") === "all", "all");
assert(parseFilter("mutual") === "mutual", "mutual");
assert(parseFilter("learning") === "learning", "learning");
assert(parseFilter("recent") === "recent", "recent");
assert(parseFilter("MUTUAL") === "mutual", "chu hoa -> thuong");
assert(parseFilter("  Learning  ") === "learning", "co khoang trang");
assert(parseFilter("hacker') DROP TABLE--") === "all", "SQL injection -> reject ve all");
assert(parseFilter("' OR 1=1--") === "all", "SQL injection 2 -> reject ve all");
assert(parseFilter("") === "all", "rong -> all");
assert(parseFilter(null) === "all", "null -> all");
assert(parseFilter(undefined) === "all", "undefined -> all");
assert(parseFilter(123) === "all", "so -> all");
assert(parseFilter({}) === "all", "object -> all");

console.log("\n[Test] mutual khong tu dem chinh minh");
function countMutualSafe(a, b, friendsOfA, friendsOfB) {
    if (a === b) return 0;
    return countMutual(friendsOfA, friendsOfB);
}
assert(countMutualSafe("u1", "u1", ["x", "y"], ["x", "y"]) === 0, "cung user -> 0");
assert(countMutualSafe("u1", "u2", ["x"], ["x"]) === 1, "khac user -> dem dung");

// ==================== SUMMARY ====================
console.log(`\n--------------------------------------`);
console.log(`Pass: ${pass}   Fail: ${fail}`);
console.log(`--------------------------------------\n`);
if (fail > 0) {
    process.exit(1);
}
