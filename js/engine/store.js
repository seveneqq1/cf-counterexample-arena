(function (global) {
  "use strict";

  var CF = (global.CFArena = global.CFArena || {});
  var STORAGE_KEY = "cf-counterexample-arena-v1";
  var SCHEMA_VERSION = 1;

  function emptyState() {
    return {
      version: SCHEMA_VERSION,
      scores: {},
      drafts: {},
      daily: { completions: {} },
      prefs: { revealCategories: false, leftPanelRatio: 0.46 },
      recoveredFromCorrupt: false,
      persistence: "local"
    };
  }

  function memoryStorage() {
    var map = {};
    return {
      getItem: function (k) {
        return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null;
      },
      setItem: function (k, v) {
        map[k] = String(v);
      },
      removeItem: function (k) {
        delete map[k];
      }
    };
  }

  function probeStorage() {
    try {
      var ls = global.localStorage;
      if (!ls) return { storage: memoryStorage(), persistence: "memory" };
      var probe = STORAGE_KEY + "-probe";
      ls.setItem(probe, "1");
      ls.removeItem(probe);
      return { storage: ls, persistence: "local" };
    } catch (err) {
      return { storage: memoryStorage(), persistence: "memory" };
    }
  }

  function isPlainObject(x) {
    return x && typeof x === "object" && !Array.isArray(x);
  }

  function sanitizeScoreEntry(entry) {
    if (!isPlainObject(entry)) return null;
    var status = entry.status;
    if (status !== "solved" && status !== "surrendered" && status !== "unsolved") {
      status = "unsolved";
    }
    var bestScore = typeof entry.bestScore === "number" && isFinite(entry.bestScore) ? Math.max(0, Math.round(entry.bestScore)) : 0;
    var hintsRevealed = typeof entry.hintsRevealed === "number" ? Math.max(0, Math.min(3, Math.round(entry.hintsRevealed))) : 0;
    var out = {
      status: status,
      independentlySolved: !!entry.independentlySolved,
      surrendered: !!entry.surrendered,
      bestScore: bestScore,
      bestInput: typeof entry.bestInput === "string" ? entry.bestInput : "",
      bestSize: typeof entry.bestSize === "number" && isFinite(entry.bestSize) ? entry.bestSize : null,
      hintsRevealed: hintsRevealed,
      completedAt: typeof entry.completedAt === "string" ? entry.completedAt : null,
      lastPlayedAt: typeof entry.lastPlayedAt === "string" ? entry.lastPlayedAt : null
    };
    if (out.independentlySolved) out.status = "solved";
    else if (out.surrendered) out.status = "surrendered";
    return out;
  }

  function sanitizeState(raw, knownIds) {
    if (!isPlainObject(raw)) return null;
    if (raw.version !== SCHEMA_VERSION) {
      if (typeof raw.version !== "number") return null;
      if (raw.version > SCHEMA_VERSION) {
        raw = JSON.parse(JSON.stringify(raw));
        raw.version = SCHEMA_VERSION;
      } else {
        raw = JSON.parse(JSON.stringify(raw));
        raw.version = SCHEMA_VERSION;
      }
    }
    var state = emptyState();
    var scores = isPlainObject(raw.scores) ? raw.scores : {};
    Object.keys(scores).forEach(function (id) {
      if (knownIds && knownIds.length && knownIds.indexOf(id) === -1) return;
      var entry = sanitizeScoreEntry(scores[id]);
      if (entry) state.scores[id] = entry;
    });
    var drafts = isPlainObject(raw.drafts) ? raw.drafts : {};
    Object.keys(drafts).forEach(function (id) {
      if (knownIds && knownIds.length && knownIds.indexOf(id) === -1) return;
      if (typeof drafts[id] === "string") state.drafts[id] = drafts[id];
    });
    if (isPlainObject(raw.daily) && isPlainObject(raw.daily.completions)) {
      Object.keys(raw.daily.completions).forEach(function (day) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(day) && raw.daily.completions[day]) {
          state.daily.completions[day] = true;
        }
      });
    }
    if (isPlainObject(raw.prefs)) {
      state.prefs.revealCategories = !!raw.prefs.revealCategories;
      var ratio = raw.prefs.leftPanelRatio;
      if (typeof ratio === "number" && isFinite(ratio) && ratio > 0.22 && ratio < 0.78) {
        state.prefs.leftPanelRatio = ratio;
      }
    }
    return state;
  }

  CF.createStore = function (options) {
    options = options || {};
    var knownIds = options.knownIds || [];
    var probed = probeStorage();
    var persistence = probed.persistence;
    var storage = probed.storage;
    var memoryNotice = persistence === "memory";
    var recoveredFromCorrupt = false;

    function knownList() {
      if (CF.challenges && CF.challenges.length) {
        return CF.challenges.map(function (c) {
          return c.id;
        });
      }
      return knownIds;
    }

    function load() {
      recoveredFromCorrupt = false;
      var text;
      try {
        text = storage.getItem(STORAGE_KEY);
      } catch (err) {
        persistence = "memory";
        memoryNotice = true;
        storage = memoryStorage();
        return emptyState();
      }
      if (!text) return emptyState();
      try {
        var parsed = JSON.parse(text);
        var state = sanitizeState(parsed, knownList());
        if (!state) {
          recoveredFromCorrupt = true;
          return emptyState();
        }
        state.persistence = persistence;
        state.recoveredFromCorrupt = false;
        return state;
      } catch (err) {
        recoveredFromCorrupt = true;
        var fresh = emptyState();
        fresh.recoveredFromCorrupt = true;
        return fresh;
      }
    }

    var state = load();
    state.persistence = persistence;
    if (recoveredFromCorrupt) state.recoveredFromCorrupt = true;

    function persist() {
      var dump = {
        version: SCHEMA_VERSION,
        scores: state.scores,
        drafts: state.drafts,
        daily: state.daily,
        prefs: state.prefs
      };
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(dump));
      } catch (err) {
        persistence = "memory";
        memoryNotice = true;
        state.persistence = "memory";
      }
    }

    function recordFor(id) {
      if (!state.scores[id]) {
        state.scores[id] = sanitizeScoreEntry({ status: "unsolved" });
      }
      return state.scores[id];
    }

    return {
      getState: function () {
        return state;
      },
      persistence: function () {
        return persistence;
      },
      memoryNotice: function () {
        return memoryNotice;
      },
      recoveredFromCorrupt: function () {
        return !!state.recoveredFromCorrupt;
      },
      save: persist,
      getRecord: function (id) {
        return recordFor(id);
      },
      getDraft: function (id) {
        return Object.prototype.hasOwnProperty.call(state.drafts, id) ? state.drafts[id] : "";
      },
      setDraft: function (id, text) {
        state.drafts[id] = text;
        persist();
      },
      setPref: function (key, value) {
        state.prefs[key] = value;
        persist();
      },
      revealHint: function (id) {
        var rec = recordFor(id);
        if (rec.hintsRevealed < 3) rec.hintsRevealed += 1;
        rec.lastPlayedAt = new Date().toISOString();
        persist();
        return rec.hintsRevealed;
      },
      recordSurrender: function (id) {
        var rec = recordFor(id);
        rec.surrendered = true;
        rec.hintsRevealed = 3;
        if (!rec.independentlySolved) rec.status = "surrendered";
        rec.lastPlayedAt = new Date().toISOString();
        persist();
        return rec;
      },
      recordHack: function (id, input, size, breakdown) {
        var rec = recordFor(id);
        rec.independentlySolved = true;
        rec.status = "solved";
        rec.lastPlayedAt = new Date().toISOString();
        if (!rec.completedAt) rec.completedAt = rec.lastPlayedAt;
        var applied = CF.applyHackScore(rec, breakdown);
        if (applied.improved) {
          rec.bestScore = applied.bestScore;
          rec.bestInput = input;
          rec.bestSize = size;
        }
        persist();
        return { record: rec, applied: applied };
      },
      markDailyComplete: function (dateKey) {
        state.daily.completions[dateKey] = true;
        persist();
      },
      totalScore: function () {
        var sum = 0;
        Object.keys(state.scores).forEach(function (id) {
          var rec = state.scores[id];
          if (rec && rec.independentlySolved) sum += rec.bestScore || 0;
        });
        return sum;
      },
      solvedCount: function () {
        var n = 0;
        Object.keys(state.scores).forEach(function (id) {
          if (state.scores[id] && state.scores[id].independentlySolved) n += 1;
        });
        return n;
      },
      exportJSON: function () {
        return JSON.stringify(
          {
            kind: "cf-arena-progress",
            version: SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            scores: state.scores,
            drafts: state.drafts,
            daily: state.daily,
            prefs: state.prefs,
            note: "Daily challenge, streak, and scores are local to this browser. This is not a shared leaderboard."
          },
          null,
          2
        );
      },
      importJSON: function (text) {
        var parsed;
        try {
          parsed = JSON.parse(text);
        } catch (err) {
          return { ok: false, message: "Import failed: the file is not valid JSON." };
        }
        if (!isPlainObject(parsed)) {
          return { ok: false, message: "Import failed: expected a JSON object." };
        }
        if (parsed.kind && parsed.kind !== "cf-arena-progress") {
          return { ok: false, message: "Import failed: unexpected file kind." };
        }
        var next = sanitizeState(parsed, knownList());
        if (!next) {
          return { ok: false, message: "Import failed: the progress data is not a recognized version." };
        }
        state.scores = next.scores;
        state.drafts = next.drafts;
        state.daily = next.daily;
        state.prefs = next.prefs;
        state.recoveredFromCorrupt = false;
        persist();
        return { ok: true, message: "Progress imported." };
      },
      reset: function () {
        var persistMode = state.persistence;
        state = emptyState();
        state.persistence = persistMode;
        try {
          storage.removeItem(STORAGE_KEY);
        } catch (err) {}
        persist();
      }
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
