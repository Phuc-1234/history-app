// test-filter-validation.mjs
//
// Test kiểm tra rằng backend parse filter đúng và từ chối giá trị bất hợp pháp
// TRƯỚC KHI chạm vào DB → bảo vệ khỏi SQL injection và query sai.
//
// Mô phỏng chính xác logic parseFilter trong socialController.ts.

const ALLOWED_FILTERS = new Set(["all", "mutual", "learning", "recent"]);

function parseFilter(value) {
    const v = typeof value === "string" ? value.trim().toLowerCase() : "";
    return ALLOWED_FILTERS.has(v) ? v : "all";
}

let pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; } else { fail++; console.error("  X FAIL:", msg); }
}

// Giá trị filter hợp lệ
assert(parseFilter("all") === "all", "all -> all");
assert(parseFilter("mutual") === "mutual", "mutual -> mutual");
assert(parseFilter("learning") === "learning", "learning -> learning");
assert(parseFilter("recent") === "recent", "recent -> recent");

// Case-insensitive + trim
assert(parseFilter("  MUTUAL  ") === "mutual", "trim + uppercase");
assert(parseFilter("Learning") === "learning", "mixed case");

// TẤT cả các chuỗi lạ (kể cả SQL injection) phải bị reject về "all"
const injectionPayloads = [
    "all' OR '1'='1",
    "all'; DROP TABLE users;--",
    "mutual UNION SELECT * FROM users",
    "' OR 1=1--",
    "all/*",
    "all%27",
    "1",
    "true",
    "null",
    "undefined",
    "{}",
];
for (const p of injectionPayloads) {
    const result = parseFilter(p);
    assert(result === "all", `injection "${p}" -> rejected to "all" (got "${result}")`);
}

// Giá trị không phải string
assert(parseFilter(null) === "all", "null -> all");
assert(parseFilter(undefined) === "all", "undefined -> all");
assert(parseFilter(123) === "all", "number -> all");
assert(parseFilter({}) === "all", "object -> all");
assert(parseFilter([]) === "all", "array -> all");

console.log(`\nfilter validation: Pass ${pass}, Fail ${fail}`);
if (fail > 0) process.exit(1);
