(function (global) {
  "use strict";

  var CF = (global.CFArena = global.CFArena || {});

  CF.BASE_POINTS = { easy: 100, medium: 200, hard: 300 };
  CF.HINT_PENALTY_FRACTION = 0.15;
  CF.SIZE_BONUS_FRACTION = 0.25;
  CF.MAX_HINTS = 3;

  CF.basePoints = function (difficulty) {
    return CF.BASE_POINTS[difficulty] || 100;
  };

  function clamp01(x) {
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  }

  CF.scoreBreakdown = function (challenge, size, hintsUsed, surrendered) {
    var base = CF.basePoints(challenge.difficulty);
    var hints = Math.max(0, Math.min(CF.MAX_HINTS, hintsUsed || 0));
    var small = challenge.smallSize || 1;
    var metric = typeof size === "number" && isFinite(size) ? size : small;

    if (surrendered) {
      return {
        base: base,
        hintsUsed: hints,
        hintPenalty: 0,
        size: metric,
        smallSize: small,
        sizeBonus: 0,
        total: 0,
        surrendered: true,
        formula:
          "Surrendered challenges score 0. Replay later for points with the maximum hint penalty."
      };
    }

    var hintPenalty = Math.round(base * CF.HINT_PENALTY_FRACTION * hints);
    var t;
    if (metric <= small) t = 1;
    else if (metric >= small * 4) t = 0;
    else t = 1 - (metric - small) / (3 * small);
    t = clamp01(t);
    var sizeBonus = Math.round(base * CF.SIZE_BONUS_FRACTION * t);
    var total = Math.max(0, base - hintPenalty + sizeBonus);

    return {
      base: base,
      hintsUsed: hints,
      hintPenalty: hintPenalty,
      size: metric,
      smallSize: small,
      sizeBonus: sizeBonus,
      total: total,
      surrendered: false,
      formula:
        "score = base − 15% of base per revealed hint + up to 25% of base for a compact semantic size. Compact means size ≤ the challenge's small-size target. Bonus falls to 0 at 4× that target. Size uses the challenge metric (for example n, or n+m), not character count. A compact input is not claimed to be globally minimal."
    };
  };

  CF.applyHackScore = function (record, breakdown) {
    var prevBest = record && typeof record.bestScore === "number" ? record.bestScore : null;
    if (prevBest != null && breakdown.total <= prevBest) {
      return { improved: false, bestScore: prevBest, awarded: 0 };
    }
    return { improved: true, bestScore: breakdown.total, awarded: breakdown.total - (prevBest || 0) };
  };
})(typeof window !== "undefined" ? window : globalThis);
