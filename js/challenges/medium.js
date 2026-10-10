(function (global) {
  "use strict";

  var CF = global.CFArena;

  CF.registerChallenge({
    id: "stamp-machine",
    title: "Stamp Machine",
    difficulty: "medium",
    category: "greedy",
    smallSize: 8,
    sizeLabel: "S (postage amount)",
    statementHtml:
      "<p>A machine can print stamps of values <code>1</code>, <code>4</code>, and <code>6</code>. You need postage totaling exactly <code>S</code>.</p>" +
      "<p>Print the fewest stamps that sum to <code>S</code>. Stamps of the same value may be reused. There is no limit on how many stamps you print.</p>",
    inputFormat: "A single integer S.",
    outputFormat: "Print the minimum number of stamps.",
    constraints: ["1 ≤ S ≤ 40"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled.",
    hints: [
      {
        teaser: "Questions the greedy coin order.",
        text: "The code always takes as many 6-stamps as possible, then 4s, then 1s. That policy is optimal for canonical coin systems. This set is not canonical."
      },
      {
        teaser: "Names a remainder that greedy mishandles.",
        text: "When S leaves remainder 2 after taking a 6, greedy finishes with two 1s (three stamps total). Two 4s would be better."
      },
      {
        teaser: "Gives the classic amount 8.",
        text: "For S = 8, greedy prints 6+1+1 (3 stamps). The optimum is 4+4 (2 stamps)."
      }
    ],
    explanation:
      "Greedy-by-largest fails on {1, 4, 6}. Amount 8 is the smallest counterexample: taking a 6 forces two 1s, while two 4s use fewer stamps. Dynamic programming over amounts 0…S finds the true minimum.",
    counterexample: "8",
    counterexampleNote: "Greedy uses 3 stamps; two 4-stamps suffice.",
    agreeInput: "7",
    agreeNote: "6+1 is optimal, so greedy and DP agree on 2.",
    buggySource: [
      "// JavaScript. `data` is { S }.",
      "function solve(data) {",
      "  var S = data.S;",
      "  var count = 0;",
      "  count += Math.floor(S / 6);",
      "  S = S % 6;",
      "  count += Math.floor(S / 4);",
      "  S = S % 4;",
      "  count += S;",
      "  return String(count);",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var S = data.S;",
      "  var INF = 1000;",
      "  var dp = [];",
      "  for (var i = 0; i <= S; i++) dp[i] = INF;",
      "  dp[0] = 0;",
      "  var coins = [1, 4, 6];",
      "  for (var x = 1; x <= S; x++) {",
      "    for (var c = 0; c < coins.length; c++) {",
      "      if (x >= coins[c] && dp[x - coins[c]] + 1 < dp[x]) dp[x] = dp[x - coins[c]] + 1;",
      "    }",
      "  }",
      "  return String(dp[S]);",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length !== 1) throw new Error('Expected a single integer S, received ' + tokens.length + ' token(s).');",
      "  if (!/^-?\\d+$/.test(tokens[0])) throw new Error('Expected an integer S, received \"' + tokens[0] + '\".');",
      "  return { S: Number(tokens[0]) };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.S) || data.S < 1 || data.S > 40) {",
      "    return { ok: false, message: 'S is ' + data.S + ', but the constraint is 1 ≤ S ≤ 40.' };",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf(data) { return data.S; }"
  });

  CF.registerChallenge({
    id: "batch-stretch",
    title: "Batch Maximum Stretch",
    difficulty: "medium",
    category: "state-reset",
    smallSize: 2,
    sizeLabel: "sum of array lengths",
    statementHtml:
      "<p>You are given <code>T</code> independent arrays. For each array, print its maximum subarray sum (the maximum sum of any non-empty contiguous segment).</p>" +
      "<p>Arrays may contain negative numbers. Tests are independent: an answer for one test must not depend on another.</p>",
    inputFormat:
      "The first line contains T. Then T tests follow. Each test is two lines: n, then n integers a1 … an.",
    outputFormat: "Print T integers on one line: the answers for tests 1…T in order.",
    constraints: ["1 ≤ T ≤ 8", "1 ≤ n ≤ 30", "−1000 ≤ ai ≤ 1000"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled.",
    hints: [
      {
        teaser: "Asks whether variables survive between tests.",
        text: "Kadane’s algorithm keeps a running best. Check whether that best is reset when a new test begins."
      },
      {
        teaser: "Describes pollution from an earlier test.",
        text: "If the first test has a large positive stretch, a later all-negative test can still report that old best."
      },
      {
        teaser: "Suggests two tests, one tiny and negative.",
        text: "Try T = 2 with first array [5] and second array [−3]. The answers must be 5 and −3, not 5 and 5."
      }
    ],
    explanation:
      "A single <code>best</code> variable is declared outside the test loop and never reset. The maximum from test 1 therefore remains a candidate in later tests. The second test’s true Kadane value is ignored whenever it is smaller.",
    counterexample: "2\n1\n5\n1\n-3",
    counterexampleNote: "Independent maxima are 5 and −3. The shared best stays 5.",
    agreeInput: "1\n4\n1 2 -1 3",
    agreeNote: "A single test cannot leak state. Both solutions print 5.",
    buggySource: [
      "// JavaScript. `data` is { T, tests } where tests[i] = { n, a }.",
      "function solve(data) {",
      "  var best = -Infinity;",
      "  var out = [];",
      "  for (var t = 0; t < data.tests.length; t++) {",
      "    var a = data.tests[t].a;",
      "    var current = 0;",
      "    for (var i = 0; i < a.length; i++) {",
      "      current = Math.max(a[i], current + a[i]);",
      "      if (current > best) best = current;",
      "    }",
      "    out.push(best);",
      "  }",
      "  return out.join(' ');",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var out = [];",
      "  for (var t = 0; t < data.tests.length; t++) {",
      "    var a = data.tests[t].a;",
      "    var best = a[0];",
      "    var current = a[0];",
      "    for (var i = 1; i < a.length; i++) {",
      "      current = Math.max(a[i], current + a[i]);",
      "      if (current > best) best = current;",
      "    }",
      "    out.push(best);",
      "  }",
      "  return out.join(' ');",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length === 0) throw new Error('Expected T, but the input is empty.');",
      "  for (var i = 0; i < tokens.length; i++) {",
      "    if (!/^-?\\d+$/.test(tokens[i])) throw new Error('Expected an integer, received \"' + tokens[i] + '\".');",
      "  }",
      "  var T = Number(tokens[0]);",
      "  var p = 1;",
      "  var tests = [];",
      "  for (var t = 0; t < T; t++) {",
      "    if (p >= tokens.length) throw new Error('Expected n for test ' + (t + 1) + ', but the input ended.');",
      "    var n = Number(tokens[p++]);",
      "    var a = [];",
      "    for (var j = 0; j < n; j++) {",
      "      if (p >= tokens.length) {",
      "        return { T: T, tests: tests, partial: { n: n, a: a, testIndex: t } };",
      "      }",
      "      a.push(Number(tokens[p++]));",
      "    }",
      "    tests.push({ n: n, a: a });",
      "  }",
      "  if (p !== tokens.length) {",
      "    return { T: T, tests: tests, extraTokens: tokens.length - p };",
      "  }",
      "  return { T: T, tests: tests };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.T) || data.T < 1 || data.T > 8) {",
      "    return { ok: false, message: 'T is ' + data.T + ', but the constraint is 1 ≤ T ≤ 8.' };",
      "  }",
      "  if (data.extraTokens) {",
      "    return { ok: false, message: 'Unexpected extra tokens at the end of the input.' };",
      "  }",
      "  if (data.partial) {",
      "    return { ok: false, message: 'Expected ' + data.partial.n + ' array values, received ' + data.partial.a.length + '.' };",
      "  }",
      "  if (data.tests.length !== data.T) {",
      "    return { ok: false, message: 'Expected ' + data.T + ' tests, received ' + data.tests.length + '.' };",
      "  }",
      "  for (var t = 0; t < data.tests.length; t++) {",
      "    var n = data.tests[t].n;",
      "    var a = data.tests[t].a;",
      "    if (!Number.isInteger(n) || n < 1 || n > 30) {",
      "      return { ok: false, message: 'n is ' + n + ' in test ' + (t + 1) + ', but the constraint is 1 ≤ n ≤ 30.' };",
      "    }",
      "    if (a.length !== n) {",
      "      return { ok: false, message: 'Expected ' + n + ' array values, received ' + a.length + '.' };",
      "    }",
      "    for (var i = 0; i < a.length; i++) {",
      "      var v = a[i];",
      "      if (!Number.isInteger(v) || v < -1000 || v > 1000) {",
      "        return { ok: false, message: 'Value a[' + (i + 1) + ']=' + v + ' in test ' + (t + 1) + ' is outside the allowed range −1000–1000.' };",
      "      }",
      "    }",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: [
      "function sizeOf(data) {",
      "  var s = 0;",
      "  for (var i = 0; i < data.tests.length; i++) s += data.tests[i].n;",
      "  return s;",
      "}"
    ].join("\n")
  });

  CF.registerChallenge({
    id: "radio-network",
    title: "Radio Network",
    difficulty: "medium",
    category: "disconnected",
    smallSize: 7,
    sizeLabel: "n + m (outposts plus links)",
    statementHtml:
      "<p><code>n</code> outposts are joined by <code>m</code> bidirectional radio links. A message can hop along any sequence of links.</p>" +
      "<p>Print <code>YES</code> if every outpost can reach every other outpost, and <code>NO</code> otherwise. A single outpost with no links is connected.</p>",
    inputFormat:
      "The first line contains n and m. Each of the next m lines contains two integers u and v describing an undirected link. Self-loops are allowed and do not connect distinct outposts. Multiple links between the same pair are allowed.",
    outputFormat: "Print YES or NO.",
    constraints: ["1 ≤ n ≤ 12", "0 ≤ m ≤ 40", "1 ≤ u, v ≤ n"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled.",
    hints: [
      {
        teaser: "Questions the edge-count test.",
        text: "Having at least n − 1 links is necessary for a connected graph on n vertices, but it is not sufficient. Extra links can sit inside one component while another is isolated."
      },
      {
        teaser: "Names the isolated-vertex picture.",
        text: "A triangle plus an isolated outpost has 3 links and 4 vertices, so m ≥ n − 1 holds, yet the graph is disconnected."
      },
      {
        teaser: "Gives that 4-vertex instance.",
        text: "Try n = 4 with edges 1-2, 2-3, 3-1. Outpost 4 is unreachable, so the answer is NO."
      }
    ],
    explanation:
      "The solution prints YES whenever <code>m ≥ n − 1</code>. That check accepts any graph with enough edges, including a clique on n − 1 vertices plus an isolated vertex. Connectivity must inspect the components, not only the edge count.",
    counterexample: "4 3\n1 2\n2 3\n3 1",
    counterexampleNote: "Three edges form a triangle; vertex 4 is isolated. m ≥ n − 1 but the network is disconnected.",
    agreeInput: "3 2\n1 2\n2 3",
    agreeNote: "A path on 3 vertices is a tree: connected, and m = n − 1.",
    buggySource: [
      "// JavaScript. `data` is { n, m, edges } with edges[i] = [u, v].",
      "function solve(data) {",
      "  if (data.m >= data.n - 1) return 'YES';",
      "  return 'NO';",
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
      "  function uni(a, b) {",
      "    a = find(a); b = find(b);",
      "    if (a !== b) parent[b] = a;",
      "  }",
      "  for (var e = 0; e < data.edges.length; e++) uni(data.edges[e][0], data.edges[e][1]);",
      "  var root = find(1);",
      "  for (var v = 2; v <= n; v++) {",
      "    if (find(v) !== root) return 'NO';",
      "  }",
      "  return 'YES';",
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
      "  for (var p = 0; p + 1 < rest.length; p += 2) {",
      "    edges.push([Number(rest[p]), Number(rest[p + 1])]);",
      "  }",
      "  var odd = rest.length % 2 === 1;",
      "  return { n: n, m: m, edges: edges, oddToken: odd, receivedEdges: edges.length };",
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

  CF.registerChallenge({
    id: "square-cover",
    title: "Minimum Square Cover",
    difficulty: "medium",
    category: "binary-search",
    smallSize: 1,
    sizeLabel: "one integer n",
    statementHtml:
      "<p>You need a square plot of integer side length <code>x ≥ 0</code> whose area is at least <code>n</code>. Print the smallest such <code>x</code> (so <code>x² ≥ n</code>).</p>" +
      "<p>n = 0 has answer 0.</p>",
    inputFormat: "A single integer n.",
    outputFormat: "Print the smallest non-negative integer x with x² ≥ n.",
    constraints: ["0 ≤ n ≤ 10000000"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled. n is small enough that x*x is an exact Number.",
    hints: [
      {
        teaser: "Points at the binary-search update.",
        text: "When the midpoint square is already large enough, the search still discards the midpoint by moving the high bound to mid − 1."
      },
      {
        teaser: "Mentions perfect squares.",
        text: "Perfect squares are the sharp cases. If n is a square, the midpoint that hits n exactly is a feasible answer and must be kept."
      },
      {
        teaser: "Suggests n = 4.",
        text: "For n = 4 the answer is 2. The search that drops mid on equality returns 3."
      }
    ],
    explanation:
      "The binary search is searching for the first x with x² ≥ n, but on <code>mid * mid &gt; n</code> it sets <code>hi = mid - 1</code>, and otherwise <code>lo = mid + 1</code>. Equality is treated as too-small, so true perfect squares overshoot. The correct keep-the-feasible-midpoint update is <code>hi = mid</code> when <code>mid * mid ≥ n</code>.",
    counterexample: "4",
    counterexampleNote: "2² = 4, so the answer is 2. The off-bound search returns 3.",
    agreeInput: "2",
    agreeNote: "ceil(sqrt(2)) = 2, and the buggy search also returns 2.",
    buggySource: [
      "// JavaScript. `data` is { n }.",
      "function solve(data) {",
      "  var n = data.n;",
      "  var lo = 0;",
      "  var hi = n;",
      "  while (lo < hi) {",
      "    var mid = Math.floor((lo + hi) / 2);",
      "    if (mid * mid > n) hi = mid - 1;",
      "    else lo = mid + 1;",
      "  }",
      "  return String(lo);",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var n = data.n;",
      "  var lo = 0;",
      "  var hi = n;",
      "  if (n === 0) return '0';",
      "  while (lo < hi) {",
      "    var mid = Math.floor((lo + hi) / 2);",
      "    if (mid * mid >= n) hi = mid;",
      "    else lo = mid + 1;",
      "  }",
      "  return String(lo);",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length !== 1) throw new Error('Expected a single integer n, received ' + tokens.length + ' token(s).');",
      "  if (!/^-?\\d+$/.test(tokens[0])) throw new Error('Expected an integer n, received \"' + tokens[0] + '\".');",
      "  return { n: Number(tokens[0]) };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.n) || data.n < 0 || data.n > 10000000) {",
      "    return { ok: false, message: 'n is ' + data.n + ', but the constraint is 0 ≤ n ≤ 10000000.' };",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf() { return 1; }"
  });
})(typeof window !== "undefined" ? window : globalThis);
