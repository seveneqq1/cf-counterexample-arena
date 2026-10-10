(function (global) {
  "use strict";

  var CF = global.CFArena;

  CF.registerChallenge({
    id: "nondecreasing-prefix",
    title: "Opening Streak",
    difficulty: "easy",
    category: "off-by-one",
    smallSize: 2,
    sizeLabel: "n (number of readings)",
    statementHtml:
      "<p>A weather station writes <code>n</code> temperature readings in arrival order. The <em>opening streak</em> is the longest prefix of the log that is non-decreasing: each reading is greater than or equal to the previous one.</p>" +
      "<p>Output the length of that prefix. A single reading always has streak length 1.</p>",
    inputFormat:
      "The first line contains an integer n. The second line contains n integers t1, t2, …, tn.",
    outputFormat: "Print a single integer: the length of the opening streak.",
    constraints: ["1 ≤ n ≤ 40", "−1000 ≤ ti ≤ 1000"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled.",
    hints: [
      {
        teaser: "Names the loop bound, not the fix.",
        text: "Look at how far the loop is willing to walk through the array. Does it ever inspect the last adjacent pair?"
      },
      {
        teaser: "Points at the last comparison.",
        text: "For n ≥ 2 the opening streak depends on every adjacent pair, including t[n−1] against t[n−2] in 0-based indexing. The loop condition stops one step early."
      },
      {
        teaser: "Suggests a tiny increasing array.",
        text: "Try a strictly increasing sequence of length 2. The correct streak is 2. The buggy code never compares the two values, so it reports 1."
      }
    ],
    explanation:
      "The loop uses <code>i &lt; n - 1</code> instead of <code>i &lt; n</code> after starting at index 1, so the last adjacent pair is never compared. Any non-decreasing array of length at least 2 is reported one too short if the missed pair would have continued the streak.",
    counterexample: "2\n1 2",
    counterexampleNote: "The two readings are non-decreasing, so the streak is 2. The loop never runs, so the code returns 1.",
    agreeInput: "3\n3 2 1",
    agreeNote: "The streak breaks immediately, so both solutions return 1.",
    buggySource: [
      "// JavaScript. `data` is { n, t } with t.length === n.",
      "function solve(data) {",
      "  var n = data.n;",
      "  var t = data.t;",
      "  var k = 1;",
      "  for (var i = 1; i < n - 1; i++) {",
      "    if (t[i] >= t[i - 1]) k += 1;",
      "    else break;",
      "  }",
      "  return String(k);",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var n = data.n;",
      "  var t = data.t;",
      "  var k = 1;",
      "  for (var i = 1; i < n; i++) {",
      "    if (t[i] >= t[i - 1]) k += 1;",
      "    else break;",
      "  }",
      "  return String(k);",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length === 0) throw new Error('Expected n, but the input is empty.');",
      "  if (!/^-?\\d+$/.test(tokens[0])) throw new Error('Expected an integer n, received \"' + tokens[0] + '\".');",
      "  var n = Number(tokens[0]);",
      "  var rest = tokens.slice(1);",
      "  var t = [];",
      "  for (var i = 0; i < rest.length; i++) {",
      "    if (!/^-?\\d+$/.test(rest[i])) throw new Error('Expected an integer for t[' + (i + 1) + '], received \"' + rest[i] + '\".');",
      "    t.push(Number(rest[i]));",
      "  }",
      "  return { n: n, t: t, extra: Math.max(0, t.length - Math.max(n, 0)) };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.n)) return { ok: false, message: 'n must be an integer.' };",
      "  if (data.n < 1 || data.n > 40) return { ok: false, message: 'n is ' + data.n + ', but the constraint is 1 ≤ n ≤ 40.' };",
      "  if (data.t.length !== data.n) {",
      "    return { ok: false, message: 'Expected ' + data.n + ' array values, received ' + data.t.length + '.' };",
      "  }",
      "  for (var i = 0; i < data.t.length; i++) {",
      "    var v = data.t[i];",
      "    if (!Number.isInteger(v) || v < -1000 || v > 1000) {",
      "      return { ok: false, message: 'Value t[' + (i + 1) + ']=' + v + ' is outside the allowed range −1000–1000.' };",
      "    }",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf(data) { return data.n; }"
  });

  CF.registerChallenge({
    id: "second-peak",
    title: "Second Distinct Peak",
    difficulty: "easy",
    category: "duplicates",
    smallSize: 3,
    sizeLabel: "n (number of altitudes)",
    statementHtml:
      "<p>A ridge is a sequence of <code>n</code> altitudes. The peak is the largest altitude. The <em>second distinct peak</em> is the largest altitude that is strictly smaller than the peak.</p>" +
      "<p>If every altitude equals the peak (only one distinct value), print <code>NONE</code>. Duplicates of the peak do not count as a second peak.</p>",
    inputFormat: "The first line contains n. The second line contains n integers a1, a2, …, an.",
    outputFormat: "Print one integer, or NONE.",
    constraints: ["1 ≤ n ≤ 40", "0 ≤ ai ≤ 10^6"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled.",
    hints: [
      {
        teaser: "Mentions how ties are treated.",
        text: "The code updates a 'second' slot whenever a value is not strictly greater than the current maximum. Equal-to-max values can still write into that slot."
      },
      {
        teaser: "States the distinctness rule.",
        text: "A second peak must be strictly smaller than the maximum. Copies of the maximum are not a second distinct value."
      },
      {
        teaser: "Points at an all-equal array.",
        text: "Try three copies of the same altitude. The answer is NONE, but a scan that treats a duplicate maximum as 'second' will print that altitude."
      }
    ],
    explanation:
      "The scan uses <code>else if (x &gt; second)</code> without requiring <code>x &lt; mx</code>. The first duplicate of the maximum therefore becomes the reported second peak. When every value equals the maximum, the code prints that value instead of NONE.",
    counterexample: "3\n5 5 5",
    counterexampleNote: "Only one distinct altitude exists, so the answer is NONE. The buggy scan records 5 as both max and second.",
    agreeInput: "4\n1 4 2 3",
    agreeNote: "Distinct values 1,2,3,4: both solutions print 3.",
    buggySource: [
      "// JavaScript. `data` is { n, a }.",
      "function solve(data) {",
      "  var a = data.a;",
      "  var mx = -1;",
      "  var second = -1;",
      "  for (var i = 0; i < a.length; i++) {",
      "    var x = a[i];",
      "    if (x > mx) {",
      "      second = mx;",
      "      mx = x;",
      "    } else if (x > second) {",
      "      second = x;",
      "    }",
      "  }",
      "  if (second < 0) return 'NONE';",
      "  return String(second);",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var a = data.a;",
      "  var mx = -1;",
      "  var second = -1;",
      "  for (var i = 0; i < a.length; i++) {",
      "    var x = a[i];",
      "    if (x > mx) {",
      "      second = mx;",
      "      mx = x;",
      "    } else if (x < mx && x > second) {",
      "      second = x;",
      "    }",
      "  }",
      "  if (second < 0) return 'NONE';",
      "  return String(second);",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length === 0) throw new Error('Expected n, but the input is empty.');",
      "  if (!/^-?\\d+$/.test(tokens[0])) throw new Error('Expected an integer n, received \"' + tokens[0] + '\".');",
      "  var n = Number(tokens[0]);",
      "  var a = [];",
      "  for (var i = 1; i < tokens.length; i++) {",
      "    if (!/^-?\\d+$/.test(tokens[i])) throw new Error('Expected an integer for a[' + i + '], received \"' + tokens[i] + '\".');",
      "    a.push(Number(tokens[i]));",
      "  }",
      "  return { n: n, a: a };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.n) || data.n < 1 || data.n > 40) {",
      "    return { ok: false, message: 'n is ' + data.n + ', but the constraint is 1 ≤ n ≤ 40.' };",
      "  }",
      "  if (data.a.length !== data.n) {",
      "    return { ok: false, message: 'Expected ' + data.n + ' array values, received ' + data.a.length + '.' };",
      "  }",
      "  for (var i = 0; i < data.a.length; i++) {",
      "    var v = data.a[i];",
      "    if (!Number.isInteger(v) || v < 0 || v > 1000000) {",
      "      return { ok: false, message: 'Value a[' + (i + 1) + ']=' + v + ' is outside the allowed range 0–1000000.' };",
      "    }",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf(data) { return data.n; }"
  });

  CF.registerChallenge({
    id: "admission-cutoff",
    title: "Admission Cutoff",
    difficulty: "easy",
    category: "inequality",
    smallSize: 1,
    sizeLabel: "n (number of scores)",
    statementHtml:
      "<p>A program admits every applicant whose score is <strong>at least</strong> the cutoff <code>T</code> (ties are admitted).</p>" +
      "<p>Given <code>n</code> scores, print how many applicants are admitted.</p>",
    inputFormat: "The first line contains two integers n and T. The second line contains n integers s1, s2, …, sn.",
    outputFormat: "Print a single integer: the number of admitted applicants.",
    constraints: ["1 ≤ n ≤ 40", "0 ≤ T ≤ 100", "0 ≤ si ≤ 100"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled.",
    hints: [
      {
        teaser: "Points at the comparison operator.",
        text: "Admission is defined with a non-strict inequality. Check whether the code uses the same operator as the statement."
      },
      {
        teaser: "Names the boundary scores.",
        text: "Applicants with score exactly T must be counted. A strict greater-than test drops them."
      },
      {
        teaser: "Suggests a one-element test on the cutoff.",
        text: "Try n = 1 with the single score equal to T. The correct answer is 1."
      }
    ],
    explanation:
      "The statement asks for scores <code>≥ T</code>. The solution counts <code>s &gt; T</code>, so every applicant sitting exactly on the cutoff is rejected.",
    counterexample: "1 50\n50",
    counterexampleNote: "The only score equals the cutoff, so the applicant is admitted. The strict comparison counts 0.",
    agreeInput: "3 50\n10 70 90",
    agreeNote: "No score equals 50, so both the strict and non-strict counts are 2.",
    buggySource: [
      "// JavaScript. `data` is { n, T, s }.",
      "function solve(data) {",
      "  var T = data.T;",
      "  var s = data.s;",
      "  var count = 0;",
      "  for (var i = 0; i < s.length; i++) {",
      "    if (s[i] > T) count += 1;",
      "  }",
      "  return String(count);",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var T = data.T;",
      "  var s = data.s;",
      "  var count = 0;",
      "  for (var i = 0; i < s.length; i++) {",
      "    if (s[i] >= T) count += 1;",
      "  }",
      "  return String(count);",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length < 2) throw new Error('Expected n and T.');",
      "  for (var i = 0; i < tokens.length; i++) {",
      "    if (!/^-?\\d+$/.test(tokens[i])) throw new Error('Expected an integer, received \"' + tokens[i] + '\".');",
      "  }",
      "  var n = Number(tokens[0]);",
      "  var T = Number(tokens[1]);",
      "  var s = [];",
      "  for (var j = 2; j < tokens.length; j++) s.push(Number(tokens[j]));",
      "  return { n: n, T: T, s: s };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.n) || data.n < 1 || data.n > 40) {",
      "    return { ok: false, message: 'n is ' + data.n + ', but the constraint is 1 ≤ n ≤ 40.' };",
      "  }",
      "  if (!Number.isInteger(data.T) || data.T < 0 || data.T > 100) {",
      "    return { ok: false, message: 'T is ' + data.T + ', but the constraint is 0 ≤ T ≤ 100.' };",
      "  }",
      "  if (data.s.length !== data.n) {",
      "    return { ok: false, message: 'Expected ' + data.n + ' array values, received ' + data.s.length + '.' };",
      "  }",
      "  for (var i = 0; i < data.s.length; i++) {",
      "    var v = data.s[i];",
      "    if (!Number.isInteger(v) || v < 0 || v > 100) {",
      "      return { ok: false, message: 'Value s[' + (i + 1) + ']=' + v + ' is outside the allowed range 0–100.' };",
      "    }",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf(data) { return data.n; }"
  });

  CF.registerChallenge({
    id: "circular-corridor",
    title: "Circular Corridor",
    difficulty: "easy",
    category: "modulo",
    smallSize: 1,
    sizeLabel: "one query (n, s, k)",
    statementHtml:
      "<p>A museum has <code>n</code> rooms numbered <code>1</code> through <code>n</code> arranged in a circle: walking forward from room <code>n</code> leads to room <code>1</code>.</p>" +
      "<p>A guard starts in room <code>s</code> and walks <code>k</code> rooms forward (k may be larger than n). Print the destination room.</p>",
    inputFormat: "A single line with three integers n, s, and k.",
    outputFormat: "Print the destination room number.",
    constraints: ["2 ≤ n ≤ 50", "1 ≤ s ≤ n", "0 ≤ k ≤ 1000"],
    languageNote: "The displayed solution is JavaScript. It is not C++ and is not compiled.",
    hints: [
      {
        teaser: "Mentions 1-based numbering versus remainder 0.",
        text: "Rooms are numbered from 1. A remainder of 0 after wrapping usually corresponds to room n, not room 0."
      },
      {
        teaser: "Points at the formula used.",
        text: "The code returns <code>(s + k) % n</code>. That expression lives in <code>0 .. n−1</code> and is not a 1-based room index."
      },
      {
        teaser: "Suggests walking onto room n.",
        text: "Try n = 5, start at 4, walk 1 step. The destination is room 5. The remainder formula prints 0."
      }
    ],
    explanation:
      "The correct 1-based wrap is <code>((s − 1 + k) mod n) + 1</code>. Using <code>(s + k) % n</code> produces 0 whenever the destination is room n, and is shifted by one on other inputs as well. JavaScript’s <code>%</code> matches the usual non-negative remainder here because k ≥ 0.",
    counterexample: "5 4 1",
    counterexampleNote: "One step from room 4 reaches room 5. The buggy remainder is 0.",
    agreeInput: "5 1 2",
    agreeNote: "Both formulas give 3 on this input.",
    buggySource: [
      "// JavaScript. `data` is { n, s, k }.",
      "function solve(data) {",
      "  var n = data.n;",
      "  var s = data.s;",
      "  var k = data.k;",
      "  return String((s + k) % n);",
      "}"
    ].join("\n"),
    referenceSource: [
      "function solve(data) {",
      "  var n = data.n;",
      "  var s = data.s;",
      "  var k = data.k;",
      "  return String(((s - 1 + k) % n) + 1);",
      "}"
    ].join("\n"),
    parseSource: [
      "function parse(input) {",
      "  var tokens = String(input).trim().split(/\\s+/).filter(function (x) { return x.length > 0; });",
      "  if (tokens.length !== 3) throw new Error('Expected 3 integers (n, s, k), received ' + tokens.length + '.');",
      "  for (var i = 0; i < tokens.length; i++) {",
      "    if (!/^-?\\d+$/.test(tokens[i])) throw new Error('Expected an integer, received \"' + tokens[i] + '\".');",
      "  }",
      "  return { n: Number(tokens[0]), s: Number(tokens[1]), k: Number(tokens[2]) };",
      "}"
    ].join("\n"),
    validateSource: [
      "function validate(data) {",
      "  if (!Number.isInteger(data.n) || data.n < 2 || data.n > 50) {",
      "    return { ok: false, message: 'n is ' + data.n + ', but the constraint is 2 ≤ n ≤ 50.' };",
      "  }",
      "  if (!Number.isInteger(data.s) || data.s < 1 || data.s > data.n) {",
      "    return { ok: false, message: 's is ' + data.s + ', but the constraint is 1 ≤ s ≤ n.' };",
      "  }",
      "  if (!Number.isInteger(data.k) || data.k < 0 || data.k > 1000) {",
      "    return { ok: false, message: 'k is ' + data.k + ', but the constraint is 0 ≤ k ≤ 1000.' };",
      "  }",
      "  return { ok: true };",
      "}"
    ].join("\n"),
    sizeSource: "function sizeOf() { return 1; }"
  });
})(typeof window !== "undefined" ? window : globalThis);
