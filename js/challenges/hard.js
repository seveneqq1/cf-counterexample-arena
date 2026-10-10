(function (global) {
  "use strict";

  var CF = global.CFArena;

  CF.registerChallenge({
    id: "product-register",
    title: "Signed Product Register",
    difficulty: "hard",
    category: "overflow",
    smallSize: 3,
    sizeLabel: "n (factors)",
    statementHtml:
      "<p>Compute the product of <code>n</code> integers and print it in decimal (the true mathematical product, which may be far outside 32-bit range).</p>" +
      "<p>The firmware under test multiplies with JavaScript <code>Math.imul</code>, which is a signed 32-bit wrap — the same wrap as 32-bit two’s-complement <code>int</code> multiplication. That is the bug. The displayed code is JavaScript, not C++.</p>",
    inputFormat: "The first line contains n. The second line contains n integers a1 … an.",
    outputFormat: "Print the exact product as a decimal integer (possibly negative or more than 32 bits).",
    constraints: ["1 ≤ n ≤ 8", "−20000 ≤ ai ≤ 20000"],
    languageNote: "JavaScript Number cannot overflow 32-bit by itself. The buggy solution uses Math.imul on purpose to simulate a 32-bit register. The reference uses BigInt.",
    hints: [
      {
        teaser: "Names the 32-bit multiply.",
        text: "Each successive product is forced through Math.imul. That function returns a signed 32-bit result, not the full integer product."
      },
      {
        teaser: "Gives the magnitude that wraps.",
        text: "Three factors of 20000 already produce 8×10¹², which cannot fit in 32 bits."
      },
      {
        teaser: "Suggests 20000 three times.",
        text: "Try n = 3 and 20000 20000 20000. The true product is 8000000000000. The wrapped register is a different 32-bit value."
      }
    ],
    explanation:
      "The statement asks for the unbounded product. <code>Math.imul(a, b)</code> implements 32-bit signed multiply (low 32 bits of the two’s-complement product). After a few large factors the register no longer matches the mathematical product. The reference accumulates with BigInt so every digit stays exact. JavaScript’s ordinary <code>*</code> was not used here, because that operator is IEEE-754 and would be a different bug.",
    counterexample: "3\n20000 20000 20000",
    counterexampleNote: "True product 8000000000000. Math.imul chain wraps to −1524072448.",
    agreeInput: "3\n2 3 4",
    agreeNote: "24 fits in 32 bits, so both print 24.",
    buggySource: [
      "// JavaScript. `data` is { n, a }.",
      "// Math.imul simulates a signed 32-bit product register.",
      "function solve(data) {",
      "  var p = 1;",
      "  for (var i = 0; i < data.a.length; i++) {",
      "    p = Math.imul(p, data.a[i]);",
      "  }",
      "  return String(p);",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var p = 1n;",
      "  for (var i = 0; i < data.a.length; i++) p *= BigInt(data.a[i]);",
      "  return p.toString();",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length === 0) throw new Error('Expected n, but the input is empty.');",
      "  for (var i = 0; i < tokens.length; i++) {",
      "    if (!/^-?\\d+$/.test(tokens[i])) throw new Error('Expected an integer, received \"' + tokens[i] + '\".');",
      "  }",
      "  var n = Number(tokens[0]);",
      "  var a = [];",
      "  for (var j = 1; j < tokens.length; j++) a.push(Number(tokens[j]));",
      "  return { n: n, a: a };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.n) || data.n < 1 || data.n > 8) {",
      "    return { ok: false, message: 'n is ' + data.n + ', but the constraint is 1 ≤ n ≤ 8.' };",
      "  }",
      "  if (data.a.length !== data.n) {",
      "    return { ok: false, message: 'Expected ' + data.n + ' array values, received ' + data.a.length + '.' };",
      "  }",
      "  for (var i = 0; i < data.a.length; i++) {",
      "    var v = data.a[i];",
      "    if (!Number.isInteger(v) || v < -20000 || v > 20000) {",
      "      return { ok: false, message: 'Value a[' + (i + 1) + ']=' + v + ' is outside the allowed range −20000–20000.' };",
      "    }",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf(data) { return data.n; }"
  });

  CF.registerChallenge({
    id: "square-gate",
    title: "Perfect Square Gate",
    difficulty: "hard",
    category: "precision",
    smallSize: 1,
    sizeLabel: "one integer n",
    statementHtml:
      "<p>A vault opens when <code>n</code> is a perfect square: there exists an integer <code>k ≥ 0</code> with <code>k² = n</code>.</p>" +
      "<p>Print <code>YES</code> or <code>NO</code>. n = 0 is a square. The displayed checker is JavaScript and uses IEEE-754 <code>Math.sqrt</code>.</p>",
    inputFormat: "A single integer n.",
    outputFormat: "Print YES if n is a perfect square, otherwise NO.",
    constraints: ["0 ≤ n ≤ 9007199254740991"],
    languageNote: "n fits in a JavaScript safe integer. The bug is Math.sqrt rounding, not integer overflow of n itself. The reference tests k² = n with BigInt.",
    hints: [
      {
        teaser: "Distrusts floating square roots as a predicate.",
        text: "Number.isInteger(Math.sqrt(n)) asks whether a floating-point square root landed on an integer. Rounding can do that even when n is not a square."
      },
      {
        teaser: "Points near 2^52.",
        text: "Around 2^52 the unit in the last place of Number is large enough that consecutive integers can share the same rounded square root."
      },
      {
        teaser: "Gives the known non-square.",
        text: "Try 4503599761588224. Math.sqrt reports 67108865 exactly, but 67108865² is 4503599761588225, so this n is not a square."
      }
    ],
    explanation:
      "IEEE-754 square root of 4503599761588224 rounds to 67108865.0, so <code>Number.isInteger</code> returns true. The integer 67108865 squared is one larger than n. The reference binary-searches an integer root with BigInt and checks the square for equality. This is a precision bug, not a 32-bit overflow.",
    counterexample: "4503599761588224",
    counterexampleNote: "Not a square, but Math.sqrt rounds to an integer.",
    agreeInput: "16",
    agreeNote: "4² = 16, and the floating square root is exact.",
    buggySource: [
      "// JavaScript. `data` is { n } with n a safe integer.",
      "function solve(data) {",
      "  var r = Math.sqrt(data.n);",
      "  return Number.isInteger(r) ? 'YES' : 'NO';",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var n = BigInt(data.n);",
      "  var lo = 0n;",
      "  var hi = n + 1n;",
      "  while (lo < hi) {",
      "    var mid = (lo + hi) / 2n;",
      "    if (mid * mid > n) hi = mid;",
      "    else lo = mid + 1n;",
      "  }",
      "  var k = lo - 1n;",
      "  return k * k === n ? 'YES' : 'NO';",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length !== 1) throw new Error('Expected a single integer n, received ' + tokens.length + ' token(s).');",
      "  if (!/^\\d+$/.test(tokens[0])) throw new Error('Expected a non-negative integer n, received \"' + tokens[0] + '\".');",
      "  if (tokens[0].length > 16) throw new Error('n has too many digits for this challenge.');",
      "  return { n: Number(tokens[0]) };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.n) || data.n < 0 || data.n > 9007199254740991) {",
      "    return { ok: false, message: 'n is ' + data.n + ', but the constraint is 0 ≤ n ≤ 9007199254740991.' };",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf() { return 1; }"
  });

  CF.registerChallenge({
    id: "studio-bookings",
    title: "Studio Bookings",
    difficulty: "hard",
    category: "greedy",
    smallSize: 4,
    sizeLabel: "n (number of requests)",
    statementHtml:
      "<p>A studio receives <code>n</code> booking requests. Request i occupies the half-open interval <code>[L, R)</code>: it includes time L and excludes time R. Two requests conflict when their intervals overlap (touching endpoints are allowed: a request ending at 10 may sit next to one starting at 10).</p>" +
      "<p>Print the maximum number of requests you can accept with no overlaps.</p>",
    inputFormat: "The first line contains n. Each of the next n lines contains two integers L and R (L &lt; R).",
    outputFormat: "Print a single integer: the size of a maximum conflict-free subset.",
    constraints: ["1 ≤ n ≤ 8", "0 ≤ L &lt; R ≤ 50"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled.",
    hints: [
      {
        teaser: "Questions longest-first selection.",
        text: "The code sorts by duration and greedily keeps a request if it does not overlap the ones already kept. Long intervals can block several short ones."
      },
      {
        teaser: "Names the standard correct greedy.",
        text: "The classic optimal policy for this problem sorts by ending time, not by length, and then takes each request that starts at or after the last finish."
      },
      {
        teaser: "Gives one long interval covering three short ones.",
        text: "Try [1,10) together with [1,2), [2,3), [3,4). Longest-first keeps only the long booking (1). Earliest-finish keeps the three short ones."
      }
    ],
    explanation:
      "Selecting the longest feasible interval is not optimal for interval scheduling. One long session can cover several short back-to-back sessions. Sorting by end time and taking each compatible request is optimal. n is tiny so a 2^n check also works; the reference uses earliest-finish.",
    counterexample: "4\n1 10\n1 2\n2 3\n3 4",
    counterexampleNote: "Longest-first keeps [1,10) only. Three unit sessions fit.",
    agreeInput: "3\n0 2\n3 5\n6 9",
    agreeNote: "All three are disjoint, so both greeds take 3.",
    buggySource: [
      "// JavaScript. `data` is { n, segs } with segs[i] = { l, r }.",
      "function solve(data) {",
      "  var segs = data.segs.slice();",
      "  segs.sort(function (a, b) { return (b.r - b.l) - (a.r - a.l); });",
      "  var taken = [];",
      "  for (var i = 0; i < segs.length; i++) {",
      "    var s = segs[i];",
      "    var ok = true;",
      "    for (var j = 0; j < taken.length; j++) {",
      "      var t = taken[j];",
      "      if (!(s.r <= t.l || t.r <= s.l)) { ok = false; break; }",
      "    }",
      "    if (ok) taken.push(s);",
      "  }",
      "  return String(taken.length);",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var segs = data.segs.slice();",
      "  segs.sort(function (a, b) { return a.r !== b.r ? a.r - b.r : a.l - b.l; });",
      "  var count = 0;",
      "  var end = -1;",
      "  for (var i = 0; i < segs.length; i++) {",
      "    if (segs[i].l >= end) {",
      "      count += 1;",
      "      end = segs[i].r;",
      "    }",
      "  }",
      "  return String(count);",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length === 0) throw new Error('Expected n, but the input is empty.');",
      "  for (var i = 0; i < tokens.length; i++) {",
      "    if (!/^-?\\d+$/.test(tokens[i])) throw new Error('Expected an integer, received \"' + tokens[i] + '\".');",
      "  }",
      "  var n = Number(tokens[0]);",
      "  var rest = tokens.slice(1);",
      "  var segs = [];",
      "  for (var p = 0; p + 1 < rest.length; p += 2) {",
      "    segs.push({ l: Number(rest[p]), r: Number(rest[p + 1]) });",
      "  }",
      "  return { n: n, segs: segs, odd: rest.length % 2 === 1, received: segs.length };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.n) || data.n < 1 || data.n > 8) {",
      "    return { ok: false, message: 'n is ' + data.n + ', but the constraint is 1 ≤ n ≤ 8.' };",
      "  }",
      "  if (data.odd) return { ok: false, message: 'Interval list ended with a leftover token.' };",
      "  if (data.received !== data.n) {",
      "    return { ok: false, message: 'Expected ' + data.n + ' intervals, received ' + data.received + '.' };",
      "  }",
      "  for (var i = 0; i < data.segs.length; i++) {",
      "    var l = data.segs[i].l;",
      "    var r = data.segs[i].r;",
      "    if (!Number.isInteger(l) || !Number.isInteger(r) || l < 0 || r > 50 || !(l < r)) {",
      "      return { ok: false, message: 'Interval ' + (i + 1) + ' is [' + l + ', ' + r + '), but the constraint is 0 ≤ L < R ≤ 50.' };",
      "    }",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf(data) { return data.n; }"
  });

  CF.registerChallenge({
    id: "island-count",
    title: "Island Count",
    difficulty: "hard",
    category: "disconnected",
    smallSize: 7,
    sizeLabel: "n + m (islands plus bridges)",
    statementHtml:
      "<p>There are <code>n</code> islands and <code>m</code> bidirectional bridges. Two islands are in the same archipelago if a traveler can walk from one to the other along bridges.</p>" +
      "<p>Print the number of archipelagos (connected components). An island with no bridges is its own archipelago.</p>",
    inputFormat:
      "The first line contains n and m. Each of the next m lines contains two integers u and v. Vertices are 1-based. Self-loops and parallel bridges are allowed.",
    outputFormat: "Print a single integer: the number of connected components.",
    constraints: ["1 ≤ n ≤ 12", "0 ≤ m ≤ 40", "1 ≤ u, v ≤ n"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled.",
    hints: [
      {
        teaser: "Questions the forest formula.",
        text: "The code returns n − m. That equals the component count only for an acyclic graph (a forest). A cycle changes the count without the formula noticing."
      },
      {
        teaser: "Separates extra edges from extra components.",
        text: "A triangle uses 3 edges on 3 vertices (one component). n − m is 0. Adding an isolated island keeps a cycle in the first component."
      },
      {
        teaser: "Reuses the triangle-plus-isolated picture.",
        text: "Try n = 4, m = 3, edges 1-2, 2-3, 3-1. There are two components. n − m = 1."
      }
    ],
    explanation:
      "For a forest, the number of components is n − m. Any cycle makes m too large for that formula, so the printed value is too small (and can even become 0 or negative). The reference unions islands by bridges and counts distinct roots.",
    counterexample: "4 3\n1 2\n2 3\n3 1",
    counterexampleNote: "Triangle plus an isolated island: 2 components. n − m = 1.",
    agreeInput: "3 2\n1 2\n2 3",
    agreeNote: "A tree has n − m = 1 component, which is correct.",
    buggySource: [
      "// JavaScript. `data` is { n, m, edges }.",
      "function solve(data) {",
      "  return String(data.n - data.m);",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var n = data.n;",
      "  var parent = [];",
      "  for (var i = 0; i <= n; i++) parent[i] = i;",
      "  function find(x) {",
      "    while (parent[x] !== x) {",
      "      parent[x] = parent[parent[x]];",
      "      x = parent[x];",
      "    }",
      "    return x;",
      "  }",
      "  for (var e = 0; e < data.edges.length; e++) {",
      "    var a = find(data.edges[e][0]);",
      "    var b = find(data.edges[e][1]);",
      "    if (a !== b) parent[b] = a;",
      "  }",
      "  var seen = {};",
      "  var count = 0;",
      "  for (var v = 1; v <= n; v++) {",
      "    var r = find(v);",
      "    if (!seen[r]) { seen[r] = true; count += 1; }",
      "  }",
      "  return String(count);",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length < 2) throw new Error('Expected n and m.');",
      "  for (var i = 0; i < tokens.length; i++) {",
      "    if (!/^-?\\d+$/.test(tokens[i])) throw new Error('Expected an integer, received \"' + tokens[i] + '\".');",
      "  }",
      "  var n = Number(tokens[0]);",
      "  var m = Number(tokens[1]);",
      "  var rest = tokens.slice(2);",
      "  var edges = [];",
      "  for (var p = 0; p + 1 < rest.length; p += 2) edges.push([Number(rest[p]), Number(rest[p + 1])]);",
      "  return { n: n, m: m, edges: edges, oddToken: rest.length % 2 === 1, receivedEdges: edges.length };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.n) || data.n < 1 || data.n > 12) {",
      "    return { ok: false, message: 'n is ' + data.n + ', but the constraint is 1 ≤ n ≤ 12.' };",
      "  }",
      "  if (!Number.isInteger(data.m) || data.m < 0 || data.m > 40) {",
      "    return { ok: false, message: 'm is ' + data.m + ', but the constraint is 0 ≤ m ≤ 40.' };",
      "  }",
      "  if (data.oddToken) return { ok: false, message: 'Edge list ended with a leftover vertex token.' };",
      "  if (data.receivedEdges !== data.m) {",
      "    return { ok: false, message: 'Expected ' + data.m + ' edges, received ' + data.receivedEdges + '.' };",
      "  }",
      "  for (var i = 0; i < data.edges.length; i++) {",
      "    var u = data.edges[i][0];",
      "    var v = data.edges[i][1];",
      "    if (!Number.isInteger(u) || u < 1 || u > data.n) {",
      "      return { ok: false, message: 'Vertex ' + u + ' is outside the allowed range 1–' + data.n + '.' };",
      "    }",
      "    if (!Number.isInteger(v) || v < 1 || v > data.n) {",
      "      return { ok: false, message: 'Vertex ' + v + ' is outside the allowed range 1–' + data.n + '.' };",
      "    }",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf(data) { return data.n + data.m; }"
  });
})(typeof window !== "undefined" ? window : globalThis);
