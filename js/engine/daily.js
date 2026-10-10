(function (global) {
  "use strict";

  var CF = (global.CFArena = global.CFArena || {});

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  CF.localDateKey = function (date) {
    var d = date ? new Date(date) : new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  };

  CF.parseDateKey = function (key) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    if (!m) return null;
    return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  };

  CF.shiftDateKey = function (key, deltaDays) {
    var p = CF.parseDateKey(key);
    if (!p) return key;
    var dt = new Date(p.y, p.m - 1, p.d);
    dt.setDate(dt.getDate() + deltaDays);
    return CF.localDateKey(dt);
  };

  CF.hashString = function (s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  CF.dailyChallengeId = function (date, challenges) {
    var list = challenges || CF.challenges || [];
    if (!list.length) return null;
    var key = typeof date === "string" ? date : CF.localDateKey(date);
    var idx = CF.hashString(key) % list.length;
    return list[idx].id;
  };

  CF.computeStreak = function (completions, todayKey) {
    completions = completions || {};
    var key = todayKey || CF.localDateKey();
    var streak = 0;
    var cursor = key;
    while (completions[cursor]) {
      streak += 1;
      cursor = CF.shiftDateKey(cursor, -1);
      if (streak > 40000) break;
    }
    return streak;
  };
})(typeof window !== "undefined" ? window : globalThis);
