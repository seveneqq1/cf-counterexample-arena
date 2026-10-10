(function (global) {
  "use strict";

  var CF = global.CFArena;
  var results = [];

  function pass(name) {
    results.push({ ok: true, name: name });
  }
  function fail(name, detail) {
    results.push({ ok: false, name: name, detail: String(detail) });
  }
  function assert(cond, name, detail) {
    if (cond) pass(name);
    else fail(name, detail || "assertion failed");
  }

  function payload(ch) {
    return CF.executionPayload(ch);
  }

  function run(ch, input) {
    return CF.runAttempt(payload(ch), input);
  }

  function oraclePrefix(t) {
    var k = 1;
    for (var i = 1; i < t.length; i++) {
      if (t[i] >= t[i - 1]) k += 1;
      else break;
    }
    return String(k);
  }

  function oracleSecond(a) {
    var mx = -1, second = -1;
    for (var i = 0; i < a.length; i++) {
      if (a[i] > mx) {
        second = mx;
        mx = a[i];
      } else if (a[i] < mx && a[i] > second) second = a[i];
    }
    return second < 0 ? "NONE" : String(second);
  }

  function oracleCutoff(s, T) {
    var c = 0;
    for (var i = 0; i < s.length; i++) if (s[i] >= T) c += 1;
    return String(c);
  }

  function oracleCorridor(n, s, k) {
    return String(((s - 1 + k) % n) + 1);
  }

  function oracleStamps(S) {
    var INF = 1000, dp = [0];
    for (var i = 1; i <= S; i++) {
      dp[i] = INF;
      if (i >= 1) dp[i] = Math.min(dp[i], dp[i - 1] + 1);
      if (i >= 4) dp[i] = Math.min(dp[i], dp[i - 4] + 1);
      if (i >= 6) dp[i] = Math.min(dp[i], dp[i - 6] + 1);
    }
    return String(dp[S]);
  }

  function oracleKadane(a) {
    var best = a[0], cur = a[0];
    for (var i = 1; i < a.length; i++) {
      cur = Math.max(a[i], cur + a[i]);
      if (cur > best) best = cur;
    }
    return best;
  }

  function bruteKadane(a) {
    var best = -Infinity;
    for (var i = 0; i < a.length; i++) {
      var s = 0;
      for (var j = i; j < a.length; j++) {
        s += a[j];
        if (s > best) best = s;
      }
    }
    return best;
  }

  function ufComponents(n, edges) {
    var p = [];
    for (var i = 0; i <= n; i++) p[i] = i;
    function find(x) {
      while (p[x] !== x) {
        p[x] = p[p[x]];
        x = p[x];
      }
      return x;
    }
    for (var e = 0; e < edges.length; e++) {
      var a = find(edges[e][0]), b = find(edges[e][1]);
      if (a !== b) p[b] = a;
    }
    var seen = {}, c = 0;
    for (var v = 1; v <= n; v++) {
      var r = find(v);
      if (!seen[r]) {
        seen[r] = true;
        c += 1;
      }
    }
    return c;
  }

  function oracleCeilSqrt(n) {
    var x = 0;
    while (x * x < n) x += 1;
    return String(x);
  }

  function oracleProduct(a) {
    var p = 1n;
    for (var i = 0; i < a.length; i++) p *= BigInt(a[i]);
    return p.toString();
  }

  function oracleSquare(n) {
    var N = BigInt(n), lo = 0n, hi = N + 1n;
    while (lo < hi) {
      var mid = (lo + hi) / 2n;
      if (mid * mid > N) hi = mid;
      else lo = mid + 1n;
    }
    var k = lo - 1n;
    return k * k === N ? "YES" : "NO";
  }

  function oracleStudio(segs) {
    var n = segs.length, best = 0;
    for (var mask = 0; mask < 1 << n; mask++) {
      var ok = true, cnt = 0, chosen = [];
      for (var i = 0; i < n; i++) if (mask & (1 << i)) {
        cnt += 1;
        chosen.push(segs[i]);
      }
      for (var a = 0; a < chosen.length && ok; a++) {
        for (var b = a + 1; b < chosen.length; b++) {
          var x = chosen[a], y = chosen[b];
          if (!(x.r <= y.l || y.r <= x.l)) {
            ok = false;
            break;
          }
        }
      }
      if (ok && cnt > best) best = cnt;
    }
    return String(best);
  }

  function testCatalog() {
    assert(CF.challenges.length >= 12, "at least 12 challenges", "found " + CF.challenges.length);
    var diffs = { easy: 0, medium: 0, hard: 0 };
    var ids = {};
    CF.challenges.forEach(function (ch) {
      diffs[ch.difficulty] += 1;
      assert(!ids[ch.id], "unique id " + ch.id, "duplicate " + ch.id);
      ids[ch.id] = true;
      ["title", "statementHtml", "inputFormat", "outputFormat", "buggySource", "referenceSource", "parseSource", "validateSource", "sizeSource", "counterexample", "agreeInput", "explanation"].forEach(function (k) {
        assert(ch[k] != null && String(ch[k]).length > 0, ch.id + " has " + k);
      });
      assert(ch.hints && ch.hints.length === 3, ch.id + " has 3 hints");
      assert(ch.language === "JavaScript", ch.id + " labeled JavaScript");
      assert(ch.buggySource.indexOf("function solve") !== -1, ch.id + " buggy source defines solve");
      var compiled = CF.compileNamed(ch.buggySource, "solve");
      assert(typeof compiled === "function", ch.id + " displayed source compiles");
      var execSrc = CF.executionPayload(ch).buggySource;
      assert(execSrc === ch.buggySource, ch.id + " displayed source is the executed source");
    });
    assert(diffs.easy === 4 && diffs.medium === 4 && diffs.hard === 4, "4 easy / 4 medium / 4 hard", JSON.stringify(diffs));
  }

  function testFixtures() {
    CF.challenges.forEach(function (ch) {
      var hack = run(ch, ch.counterexample);
      assert(hack.status === "hack", ch.id + " known counterexample hacks", JSON.stringify(hack));
      var agree = run(ch, ch.agreeInput);
      assert(agree.status === "match", ch.id + " agreement input matches", JSON.stringify(agree));
      var compact = ch.counterexample.replace(/\s+/g, " ").trim();
      var spaced = ch.counterexample.replace(/ /g, "   ").replace(/\n/g, "\n\n");
      var s1 = run(ch, compact);
      var s2 = run(ch, spaced);
      if (s1.status !== "invalid" && s2.status !== "invalid") {
        assert(s1.size === s2.size, ch.id + " semantic size ignores formatting", s1.size + " vs " + s2.size);
      }
    });
  }

  function testInvalid() {
    var prefix = CF.getChallenge("nondecreasing-prefix");
    var r = run(prefix, "5\n1 2 3 4");
    assert(r.status === "invalid" && /Expected 5 array values, received 4/.test(r.validationMessage), "array length message", r.validationMessage);

    var radio = CF.getChallenge("radio-network");
    var v = run(radio, "6 1\n1 8");
    assert(v.status === "invalid" && /Vertex 8 is outside the allowed range 1–6/.test(v.validationMessage), "vertex range message", v.validationMessage);

    var empty = run(prefix, "");
    assert(empty.status === "invalid", "empty input rejected");

    var extra = run(CF.getChallenge("stamp-machine"), "8 9");
    assert(extra.status === "invalid", "extra stamp tokens rejected");

    var tooBig = run(prefix, "1\n5000");
    assert(tooBig.status === "invalid" && /outside the allowed range/.test(tooBig.validationMessage), "value range rejected");
  }

  function testOracles() {
    var rnd = function (n) {
      return Math.floor(Math.random() * n);
    };
    var prefix = CF.getChallenge("nondecreasing-prefix");
    for (var i = 0; i < 40; i++) {
      var n = 1 + rnd(8);
      var t = [];
      for (var j = 0; j < n; j++) t.push(rnd(21) - 10);
      var input = n + "\n" + t.join(" ");
      var got = run(prefix, input);
      assert(got.status !== "invalid", "prefix valid gen");
      assert(got.referenceOutput === oraclePrefix(t), "prefix oracle " + input, got.referenceOutput + " vs " + oraclePrefix(t));
    }

    var peak = CF.getChallenge("second-peak");
    for (i = 0; i < 30; i++) {
      n = 1 + rnd(8);
      var a = [];
      for (j = 0; j < n; j++) a.push(rnd(6));
      input = n + "\n" + a.join(" ");
      got = run(peak, input);
      assert(got.referenceOutput === oracleSecond(a), "second-peak oracle", got.referenceOutput);
    }

    var cut = CF.getChallenge("admission-cutoff");
    for (i = 0; i < 20; i++) {
      n = 1 + rnd(6);
      var T = rnd(5) * 10;
      var s = [];
      for (j = 0; j < n; j++) s.push(rnd(11) * 10);
      input = n + " " + T + "\n" + s.join(" ");
      got = run(cut, input);
      assert(got.referenceOutput === oracleCutoff(s, T), "cutoff oracle");
    }

    var cor = CF.getChallenge("circular-corridor");
    for (i = 0; i < 40; i++) {
      n = 2 + rnd(10);
      var st = 1 + rnd(n);
      var k = rnd(30);
      input = n + " " + st + " " + k;
      got = run(cor, input);
      assert(got.referenceOutput === oracleCorridor(n, st, k), "corridor oracle " + input, got.referenceOutput);
    }

    var stamps = CF.getChallenge("stamp-machine");
    for (var S = 1; S <= 40; S++) {
      got = run(stamps, String(S));
      assert(got.referenceOutput === oracleStamps(S), "stamps DP " + S, got.referenceOutput);
    }

    var batch = CF.getChallenge("batch-stretch");
    for (i = 0; i < 20; i++) {
      var T = 1 + rnd(3);
      var tests = [];
      var lines = [String(T)];
      for (var t = 0; t < T; t++) {
        n = 1 + rnd(6);
        a = [];
        for (j = 0; j < n; j++) a.push(rnd(11) - 5);
        tests.push(a);
        lines.push(String(n));
        lines.push(a.join(" "));
      }
      got = run(batch, lines.join("\n"));
      var expect = tests.map(function (arr) { return bruteKadane(arr); });
      tests.forEach(function (arr, idx) {
        assert(oracleKadane(arr) === bruteKadane(arr), "kadane brute agrees case " + idx);
      });
      assert(got.referenceOutput === expect.join(" "), "batch kadane", got.referenceOutput + " vs " + expect.join(" "));
    }

    var radio = CF.getChallenge("radio-network");
    var islands = CF.getChallenge("island-count");
    for (i = 0; i < 25; i++) {
      n = 1 + rnd(6);
      var m = rnd(n + 3);
      var edges = [];
      var lines2 = [n + " " + m];
      for (j = 0; j < m; j++) {
        var u = 1 + rnd(n), v = 1 + rnd(n);
        edges.push([u, v]);
        lines2.push(u + " " + v);
      }
      var raw = lines2.join("\n");
      var comp = ufComponents(n, edges);
      got = run(radio, raw);
      assert(got.referenceOutput === (comp === 1 ? "YES" : "NO"), "radio uf", got.referenceOutput + " vs comps " + comp);
      var gi = run(islands, raw);
      assert(gi.referenceOutput === String(comp), "island uf", gi.referenceOutput);
    }

    var sq = CF.getChallenge("square-cover");
    for (i = 0; i < 50; i++) {
      n = rnd(200);
      got = run(sq, String(n));
      assert(got.referenceOutput === oracleCeilSqrt(n), "ceil sqrt " + n, got.referenceOutput);
    }

    var prod = CF.getChallenge("product-register");
    for (i = 0; i < 20; i++) {
      n = 1 + rnd(5);
      a = [];
      for (j = 0; j < n; j++) a.push(rnd(11) - 5);
      input = n + "\n" + a.join(" ");
      got = run(prod, input);
      assert(got.referenceOutput === oracleProduct(a), "product " + input, got.referenceOutput);
    }

    var gate = CF.getChallenge("square-gate");
    [0, 1, 2, 4, 15, 16, 36, 99, 100, 4503599761588224, 4503599761588225].forEach(function (n) {
      got = run(gate, String(n));
      assert(got.referenceOutput === oracleSquare(n), "square gate " + n, got.referenceOutput + " vs " + oracleSquare(n));
    });

    var studio = CF.getChallenge("studio-bookings");
    for (i = 0; i < 15; i++) {
      n = 1 + rnd(5);
      var segs = [];
      lines = [String(n)];
      for (j = 0; j < n; j++) {
        var L = rnd(10);
        var R = L + 1 + rnd(6);
        segs.push({ l: L, r: R });
        lines.push(L + " " + R);
      }
      got = run(studio, lines.join("\n"));
      assert(got.referenceOutput === oracleStudio(segs), "studio brute", got.referenceOutput + " vs " + oracleStudio(segs));
    }
  }

  function testScoring() {
    var ch = CF.getChallenge("stamp-machine");
    var b0 = CF.scoreBreakdown(ch, 8, 0, false);
    var b1 = CF.scoreBreakdown(ch, 8, 1, false);
    var b3 = CF.scoreBreakdown(ch, 8, 3, false);
    assert(b0.total > b1.total && b1.total > b3.total, "hints reduce score");
    var large = CF.scoreBreakdown(ch, 40, 0, false);
    assert(large.sizeBonus < b0.sizeBonus, "larger semantic size reduces bonus");
    var surr = CF.scoreBreakdown(ch, 8, 0, true);
    assert(surr.total === 0, "surrender scores 0");

    var store = CF.createStore({ knownIds: CF.challenges.map(function (c) { return c.id; }) });
    store.reset();
    var first = store.recordHack(ch.id, "8", 8, b0);
    var total1 = store.totalScore();
    store.recordHack(ch.id, "8", 8, b0);
    var total2 = store.totalScore();
    assert(total1 === total2, "repeat same hack does not farm points", total1 + " vs " + total2);
    assert(first.applied.improved, "first hack improves");
    var worse = CF.scoreBreakdown(ch, 40, 3, false);
    var again = store.recordHack(ch.id, "40", 40, worse);
    assert(!again.applied.improved, "worse replay does not replace best");
    assert(store.totalScore() === total1, "total unchanged after worse replay");
  }

  function testStore() {
    var storageProto = global.localStorage;
    if (storageProto && storageProto.setItem) {
      storageProto.setItem("cf-counterexample-arena-v1", "{not json");
    }
    var store = CF.createStore();
    assert(store.recoveredFromCorrupt(), "corrupt JSON recovers");
    store.reset();
    var ch = CF.getChallenge("opening-streak") || CF.getChallenge("nondecreasing-prefix");
    store.revealHint(ch.id);
    store.revealHint(ch.id);
    assert(store.getRecord(ch.id).hintsRevealed === 2, "hint count");
    var json = store.exportJSON();
    store.recordSurrender(ch.id);
    assert(store.getRecord(ch.id).surrendered && store.getRecord(ch.id).status === "surrendered", "surrender status");
    assert(/cf-arena-progress/.test(json), "export kind");
    var store2 = CF.createStore();
    store2.reset();
    var bad = store2.importJSON("[]");
    assert(!bad.ok, "import rejects arrays");
    var wrong = store2.importJSON(JSON.stringify({ kind: "nope", version: 1, scores: {} }));
    assert(!wrong.ok, "import rejects wrong kind");
    var ok = store2.importJSON(json);
    assert(ok.ok, "import accepts export");
    assert(store2.getRecord(ch.id).hintsRevealed === 2, "imported hints");
    store2.reset();
    store2.importJSON(JSON.stringify({
      kind: "cf-arena-progress",
      version: 1,
      scores: { "not-a-real-id": { independentlySolved: true, bestScore: 999, status: "solved" } }
    }));
    assert(!store2.getState().scores["not-a-real-id"], "unknown challenge id dropped on import");
  }

  function testDaily() {
    var a = CF.dailyChallengeId("2026-10-10", CF.challenges);
    var b = CF.dailyChallengeId("2026-10-10", CF.challenges);
    var c = CF.dailyChallengeId("2026-10-11", CF.challenges);
    assert(a === b, "daily id stable for a local date");
    assert(typeof a === "string" && CF.getChallenge(a), "daily id is a real challenge");
    var seen = {};
    for (var d = 1; d <= 28; d++) {
      var key = "2026-02-" + (d < 10 ? "0" + d : String(d));
      seen[CF.dailyChallengeId(key, CF.challenges)] = true;
    }
    assert(Object.keys(seen).length >= 2, "daily id varies across dates");
    var completions = { "2026-10-10": true, "2026-10-09": true, "2026-10-08": true };
    assert(CF.computeStreak(completions, "2026-10-10") === 3, "streak counts consecutive local dates");
    assert(CF.computeStreak(completions, "2026-10-11") === 0, "missing today breaks streak");
    assert(CF.shiftDateKey("2026-03-01", -1) === "2026-02-28", "local date rollover");
  }

  function testReferenceFailure() {
    var fake = {
      buggySource: "function solve() { return '1'; }",
      referenceSource: "function solve() { throw new Error('boom'); }",
      parseSource: "function parse() { return {}; }",
      validateSource: "function validate() { return { ok: true }; }",
      sizeSource: "function sizeOf() { return 1; }",
      maxInputChars: 100,
      maxParsedSize: 10
    };
    var r = CF.runAttempt(fake, "x");
    assert(r.status === "reference_failure", "reference throw is internal failure");
    var store = CF.createStore();
    var before = store.totalScore();
    assert(r.status !== "hack", "reference failure is not a hack");
    assert(store.totalScore() === before, "no points awarded");
  }

  function testOutputsEqual() {
    assert(CF.outputsEqual("1  2\n3", "1 2 3"), "whitespace-insensitive tokens");
    assert(!CF.outputsEqual("1 2", "1 2 3"), "length mismatch");
    assert(!CF.outputsEqual("10", "1 0"), "token identity, not digits");
  }

  global.CFArenaTests = {
    run: function () {
      results = [];
      Math.seedrandom && Math.seedrandom("cf-arena");
      testCatalog();
      testFixtures();
      testInvalid();
      testOracles();
      testScoring();
      testStore();
      testDaily();
      testReferenceFailure();
      testOutputsEqual();
      return results;
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
