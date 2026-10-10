(function (global) {
  "use strict";

  var CF = (global.CFArena = global.CFArena || {});
  CF.challenges = CF.challenges || [];

  CF.CATEGORIES = {
    "off-by-one": "Off-by-one",
    duplicates: "Duplicates",
    greedy: "Incorrect greedy",
    "state-reset": "State not reset",
    disconnected: "Disconnected graphs",
    "binary-search": "Binary-search bounds",
    modulo: "Modulo normalization",
    overflow: "Overflow",
    precision: "Precision",
    inequality: "Strict vs non-strict"
  };

  CF.registerChallenge = function (ch) {
    ch.language = "JavaScript";
    ch.timeLimitMs = ch.timeLimitMs || 500;
    ch.maxInputChars = ch.maxInputChars || 6000;
    ch.maxParsedSize = ch.maxParsedSize || 250;
    CF.challenges.push(ch);
  };

  CF.getChallenge = function (id) {
    for (var i = 0; i < CF.challenges.length; i++) {
      if (CF.challenges[i].id === id) return CF.challenges[i];
    }
    return null;
  };

  CF.nextUnsolvedId = function (currentId, store) {
    var start = 0;
    for (var i = 0; i < CF.challenges.length; i++) {
      if (CF.challenges[i].id === currentId) {
        start = i + 1;
        break;
      }
    }
    for (var k = 0; k < CF.challenges.length; k++) {
      var ch = CF.challenges[(start + k) % CF.challenges.length];
      var rec = store.getRecord(ch.id);
      if (!rec.independentlySolved) return ch.id;
    }
    var idx = start % CF.challenges.length;
    return CF.challenges[idx].id;
  };
})(typeof window !== "undefined" ? window : globalThis);
