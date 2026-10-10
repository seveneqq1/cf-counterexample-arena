(function (global) {
  "use strict";

  var CF = global.CFArena;
  var store = CF.createStore();
  var root = document.getElementById("app");
  var workspaceMountId = null;
  var runInFlight = false;
  var lastResult = null;
  var filters = { difficulty: "all", category: "all", status: "all" };
  var draftForm = {
    id: "my-challenge",
    title: "Working Title",
    difficulty: "easy",
    category: "off-by-one",
    statement: "State the problem. Ask for a unique answer.",
    inputFormat: "Describe the input.",
    outputFormat: "Describe the output.",
    constraints: "1 ≤ n ≤ 40",
    hint1: "Point at the suspicious region.",
    hint2: "Name the failing case family.",
    hint3: "Give a tiny input that should break it.",
    agreeInput: "1\n1",
    counterexample: "2\n1 2"
  };

  function $(tag, props) {
    var el = document.createElement(tag);
    var kids = Array.prototype.slice.call(arguments, 2);
    props = props || {};
    Object.keys(props).forEach(function (key) {
      var val = props[key];
      if (val == null || val === false) return;
      if (key === "className") el.className = val;
      else if (key === "text") el.textContent = val;
      else if (key === "html") el.innerHTML = val;
      else if (key === "checked") el.checked = !!val;
      else if (key === "selected") el.selected = !!val;
      else if (key.slice(0, 2) === "on" && typeof val === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === "dataset") {
        Object.keys(val).forEach(function (d) {
          el.dataset[d] = val[d];
        });
      } else {
        el.setAttribute(key, val === true ? "" : String(val));
      }
    });
    kids.forEach(function append(child) {
      if (child == null || child === false) return;
      if (Array.isArray(child)) child.forEach(append);
      else if (typeof child === "string") el.appendChild(document.createTextNode(child));
      else el.appendChild(child);
    });
    return el;
  }

  function parseRoute() {
    var raw = (location.hash || "#/").replace(/^#/, "");
    if (raw.charAt(0) === "/") raw = raw.slice(1);
    var parts = raw.split("/").filter(Boolean);
    if (!parts.length) return { name: "home" };
    if (parts[0] === "library") return { name: "library" };
    if (parts[0] === "progress") return { name: "progress" };
    if (parts[0] === "draft") return { name: "draft" };
    if (parts[0] === "challenge" && parts[1]) {
      return { name: "challenge", id: decodeURIComponent(parts[1]) };
    }
    return { name: "missing" };
  }

  function go(hash) {
    location.hash = hash;
  }

  function difficultyBadge(d) {
    return $("span", { className: "badge " + d, text: d });
  }

  function statusBadge(rec) {
    if (rec && rec.independentlySolved) return $("span", { className: "badge solved", text: "hacked" });
    if (rec && rec.surrendered) return $("span", { className: "badge surrendered", text: "surrendered" });
    return $("span", { className: "badge", text: "open" });
  }

  function todayKey() {
    return CF.localDateKey();
  }

  function dailyId() {
    return CF.dailyChallengeId(todayKey(), CF.challenges);
  }

  function maybeCompleteDaily(challengeId, independentlySolved) {
    if (!independentlySolved) return;
    if (challengeId === dailyId()) store.markDailyComplete(todayKey());
  }

  function header(route) {
    var nav = [
      { href: "#/", name: "home", label: "Home" },
      { href: "#/library", name: "library", label: "Library" },
      { href: "#/progress", name: "progress", label: "Progress" },
      { href: "#/draft", name: "draft", label: "Draft builder" }
    ];
    return $("header", { className: "app-header" },
      $("a", { className: "brand", href: "#/" },
        $("img", { src: "assets/logo.svg", alt: "" }),
        "CF Counterexample Arena"
      ),
      $("nav", { className: "nav", "aria-label": "Primary" },
        nav.map(function (item) {
          return $("a", {
            href: item.href,
            "aria-current": route.name === item.name ? "page" : null,
            text: item.label
          });
        })
      ),
      $("div", { className: "stats-chip", text: store.totalScore() + " pts · " + store.solvedCount() + "/" + CF.challenges.length + " hacked · streak " + CF.computeStreak(store.getState().daily.completions, todayKey()) })
    );
  }

  function banners() {
    var notes = [];
    if (store.memoryNotice()) {
      notes.push("This browser is not saving progress. Play continues in memory only — export if you want a copy.");
    }
    if (store.recoveredFromCorrupt()) {
      notes.push("Saved progress could not be read and was reset to empty. Import a backup if you have one.");
    }
    if (!notes.length) return null;
    return notes.map(function (t) {
      return $("div", { className: "banner", role: "status", text: t });
    });
  }

  function showModal(title, body, actions) {
    var back = $("div", { className: "modal-back", role: "dialog", "aria-modal": "true", "aria-label": title });
    var box = $("div", { className: "modal" },
      $("h2", { text: title }),
      typeof body === "string" ? $("p", { text: body }) : body,
      $("div", { className: "btn-row" }, actions)
    );
    back.appendChild(box);
    function close() {
      if (back.parentNode) back.parentNode.removeChild(back);
      document.removeEventListener("keydown", onKey);
    }
    function onKey(ev) {
      if (ev.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    back.addEventListener("click", function (ev) {
      if (ev.target === back) close();
    });
    document.body.appendChild(back);
    return { close: close, node: back };
  }

  function confirmAction(title, message, onYes) {
    var modal;
    modal = showModal(title, message, [
      $("button", { className: "btn", type: "button", text: "Confirm", onclick: function () { modal.close(); onYes(); } }),
      $("button", { className: "btn btn-ghost", type: "button", text: "Cancel", onclick: function () { modal.close(); } })
    ]);
  }

  function homeView() {
    var daily = CF.getChallenge(dailyId());
    var rec = daily ? store.getRecord(daily.id) : null;
    return $("main", {},
      banners(),
      $("section", { className: "hero" },
        $("div", {},
          $("h1", { text: "Break the wrong solution." }),
          $("p", { className: "lede", text: "Each challenge ships an original problem and a readable JavaScript solution that is wrong. Your job is the Codeforces hack skill: write a valid test that makes the buggy code print a different answer from the reference." }),
          $("div", { className: "btn-row" },
            $("button", { className: "btn", type: "button", text: "Start hacking", onclick: function () { go("#/library"); } }),
            $("button", { className: "btn btn-ghost", type: "button", text: "Open today's challenge", onclick: function () { if (daily) go("#/challenge/" + daily.id); } })
          )
        ),
        $("aside", { className: "verdict-card", "aria-label": "Worked example" },
          $("header", {},
            $("span", { text: "example · not in the library" }),
            $("span", {}, $("span", { className: "wa", text: "WA" }), " vs ", $("span", { className: "ac", text: "AC" }))
          ),
          $("p", { style: "margin-top:0;color:var(--muted);font-size:14px", text: "Suppose a solution sums n numbers with a loop that stops at n − 1. This input is legal and the two answers disagree — that is a counterexample." }),
          $("div", { className: "io-grid" },
            $("div", { className: "io-pane" }, $("div", { className: "lbl", text: "input" }), $("pre", { text: "3\n1 2 10" })),
            $("div", { className: "io-pane" }, $("div", { className: "lbl wa", text: "buggy" }), $("pre", { text: "3" })),
            $("div", { className: "io-pane" }, $("div", { className: "lbl ac", text: "correct" }), $("pre", { text: "13" }))
          )
        )
      ),
      $("div", { className: "home-grid" },
        $("section", { className: "panel" },
          $("h2", { text: "How a round works" }),
          $("p", { text: "Read the statement. Study the JavaScript (it is not C++). Edit a test in the input box. Run with the button or Ctrl/⌘+Enter. Invalid tests are rejected before either solver runs. A successful hack unlocks the bug write-up and a small known counterexample. Spoilers stay hidden until you hack or surrender. This is a local client-side game — answers live in the downloaded files, not behind a server." }),
          $("p", { style: "color:var(--muted)", text: "Daily challenge, streak, and scores use this device's calendar and storage. There is no shared leaderboard." })
        ),
        $("section", { className: "panel" },
          $("h2", { text: "This browser" }),
          $("div", { className: "metric-row" },
            $("div", { className: "metric" }, $("b", { text: String(store.totalScore()) }), $("span", { text: "total score" })),
            $("div", { className: "metric" }, $("b", { text: store.solvedCount() + "/" + CF.challenges.length }), $("span", { text: "independent hacks" })),
            $("div", { className: "metric" }, $("b", { text: String(CF.computeStreak(store.getState().daily.completions, todayKey())) }), $("span", { text: "daily streak" }))
          ),
          daily ? $("a", { className: "daily-link", href: "#/challenge/" + daily.id },
            $("strong", { text: "Daily challenge · " + todayKey() }),
            $("div", { text: daily.title + " · " + daily.difficulty }),
            $("div", { style: "color:var(--muted);font-size:13px", text: rec && rec.independentlySolved ? "Already hacked locally." : "Changes only if the local calendar date changes." })
          ) : null
        )
      )
    );
  }

  function matchesFilters(ch) {
    var rec = store.getRecord(ch.id);
    if (filters.difficulty !== "all" && ch.difficulty !== filters.difficulty) return false;
    if (store.getState().prefs.revealCategories && filters.category !== "all" && ch.category !== filters.category) return false;
    var st = rec.independentlySolved ? "solved" : rec.surrendered ? "surrendered" : "unsolved";
    if (filters.status !== "all" && st !== filters.status) return false;
    return true;
  }

  function libraryView() {
    var reveal = store.getState().prefs.revealCategories;
    var list = CF.challenges.filter(matchesFilters);
    return $("main", {},
      banners(),
      $("h1", { text: "Challenge library" }),
      $("p", { className: "lede", text: "Twelve original problems. Bug categories stay hidden unless you turn them on — they otherwise spoil which flaw to hunt." }),
      $("div", { className: "filters" },
        $("label", { className: "field" }, "Difficulty",
          $("select", {
            "aria-label": "Filter by difficulty",
            onchange: function (ev) { filters.difficulty = ev.target.value; render(); }
          },
            ["all", "easy", "medium", "hard"].map(function (v) {
              return $("option", { value: v, text: v === "all" ? "All difficulties" : v, selected: filters.difficulty === v ? true : null });
            })
          )
        ),
        $("label", { className: "field" }, "Status",
          $("select", {
            "aria-label": "Filter by status",
            onchange: function (ev) { filters.status = ev.target.value; render(); }
          },
            [
              ["all", "All statuses"],
              ["unsolved", "Open"],
              ["solved", "Hacked"],
              ["surrendered", "Surrendered"]
            ].map(function (pair) {
              return $("option", { value: pair[0], text: pair[1], selected: filters.status === pair[0] ? true : null });
            })
          )
        ),
        reveal ? $("label", { className: "field" }, "Bug category",
          $("select", {
            "aria-label": "Filter by bug category",
            onchange: function (ev) { filters.category = ev.target.value; render(); }
          },
            [$("option", { value: "all", text: "All categories", selected: filters.category === "all" ? true : null })].concat(
              Object.keys(CF.CATEGORIES).map(function (key) {
                return $("option", { value: key, text: CF.CATEGORIES[key], selected: filters.category === key ? true : null });
              })
            )
          )
        ) : null,
        $("button", {
          className: "btn btn-ghost",
          type: "button",
          text: reveal ? "Hide category filters" : "Reveal category filters (spoilers)",
          onclick: function () {
            if (!reveal) {
              confirmAction(
                "Reveal bug categories?",
                "Category names describe the flaw (off-by-one, greedy, and so on). That can spoil unsolved challenges.",
                function () {
                  store.setPref("revealCategories", true);
                  render();
                }
              );
            } else {
              store.setPref("revealCategories", false);
              filters.category = "all";
              render();
            }
          }
        })
      ),
      $("div", { className: "cards" },
        list.length ? list.map(function (ch) {
          var rec = store.getRecord(ch.id);
          return $("a", { className: "card", href: "#/challenge/" + ch.id },
            $("h3", { text: ch.title }),
            $("div", { className: "meta" },
              difficultyBadge(ch.difficulty),
              statusBadge(rec),
              reveal ? $("span", { className: "badge", text: CF.CATEGORIES[ch.category] || ch.category }) : null,
              rec.independentlySolved ? $("span", { text: rec.bestScore + " pts" }) : null
            )
          );
        }) : $("p", { text: "No challenges match these filters." })
      )
    );
  }

  function tokenCompare(a, b) {
    var ta = CF.tokenize(a || "");
    var tb = CF.tokenize(b || "");
    var n = Math.max(ta.length, tb.length);
    var bits = [];
    var first = -1;
    for (var i = 0; i < n; i++) {
      var x = ta[i];
      var y = tb[i];
      if (x === y) bits.push('<span class="ok">' + CF.escapeHtml(x) + "</span>");
      else {
        if (first === -1) first = i;
        bits.push('<span class="mis">' + CF.escapeHtml((x == null ? "∅" : x) + " / " + (y == null ? "∅" : y)) + "</span>");
      }
    }
    return {
      html: n ? "tokens: " + bits.join(" ") : "both outputs are empty",
      first: first
    };
  }

  function verdictCopy(result) {
    switch (result.status) {
      case "invalid":
        return { cls: "invalid", title: "Invalid input", body: result.validationMessage || "The input does not satisfy the constraints." };
      case "match":
        return { cls: "match", title: "Valid, no mismatch", body: "Both solutions produced the same token sequence. This input does not hack the buggy code." };
      case "hack":
        return { cls: "hack", title: "Counterexample found", body: "The input is valid and the two outputs disagree. That is a successful hack." };
      case "buggy_crash":
        return { cls: "crash", title: "Buggy solver crashed", body: result.error || "The displayed solution threw. This is not scored as a hack." };
      case "buggy_timeout":
        return { cls: "timeout", title: "Buggy solver timed out", body: result.error || "The displayed solution exceeded the time limit. Timeouts are not scored as hacks." };
      case "reference_failure":
        return { cls: "internal", title: "Reference solver failed", body: "An internal challenge error occurred. This never awards a hack. " + (result.error || "") };
      default:
        return { cls: "internal", title: "Unknown result", body: "Unexpected status " + result.status };
    }
  }

  function resultsNode(ch, rec, result, breakdown) {
    if (!result) {
      return $("section", { className: "results", "aria-live": "polite" },
        $("p", { style: "margin:0;color:var(--muted)", text: "Run a test to see validation, both outputs, and whether the counterexample worked." })
      );
    }
    var v = verdictCopy(result);
    var unlocked = rec.independentlySolved || rec.surrendered;
    var wrap = $("section", { className: "results" + (result.status === "hack" ? " flash-hack" : ""), "aria-live": "polite" });
    wrap.appendChild($("div", { className: "verdict " + v.cls, text: v.title }));
    wrap.appendChild($("p", { text: v.body }));
    if (result.environmentNotice) wrap.appendChild($("p", { style: "color:var(--amber)", text: result.environmentNotice }));
    if (result.status !== "invalid") {
      var cmp = tokenCompare(result.buggyOutput, result.referenceOutput);
      wrap.appendChild($("div", { className: "compare" },
        $("div", {},
          $("div", { className: "lbl wa", text: "buggy output" }),
          $("pre", { text: result.buggyOutput == null ? "—" : result.buggyOutput })
        ),
        $("div", {},
          $("div", { className: "lbl ac", text: "correct output" }),
          $("pre", { text: result.referenceOutput == null ? "—" : result.referenceOutput })
        )
      ));
      wrap.appendChild($("div", { className: "token-diff", html: cmp.html }));
      if (typeof result.size === "number") {
        wrap.appendChild($("p", { style: "color:var(--muted);font-size:13px", text: "Semantic size: " + result.size + " (" + (ch.sizeLabel || "instance size") + "). Formatting and extra spaces do not change this number." }));
      }
    }
    if (result.status === "hack" && breakdown) {
      wrap.appendChild($("div", { className: "score-break" },
        $("div", { text: "Score breakdown" }),
        $("div", { text: "Base (" + ch.difficulty + "): " + breakdown.base }),
        $("div", { text: "Hints revealed: " + breakdown.hintsUsed + " (−" + breakdown.hintPenalty + ")" }),
        $("div", { text: "Size " + breakdown.size + " vs compact target " + breakdown.smallSize + " (bonus +" + breakdown.sizeBonus + ")" }),
        $("div", { text: "This attempt: " + breakdown.total + " · Best on this challenge: " + rec.bestScore }),
        $("p", { style: "margin:8px 0 0;color:var(--muted);font-weight:400", text: breakdown.formula })
      ));
    }
    if (unlocked) {
      wrap.appendChild($("div", { className: "explain" },
        $("h3", { text: rec.independentlySolved ? "Bug write-up" : "Surrendered write-up" }),
        $("div", { html: ch.explanation }),
        $("p", { html: "<strong>A known counterexample</strong> (not claimed globally minimal):" }),
        $("pre", { text: ch.counterexample }),
        $("p", { text: ch.counterexampleNote || "" })
      ));
    }
    return wrap;
  }

  function bindSplitter(splitter, workspace) {
    splitter.addEventListener("mousedown", function (ev) {
      ev.preventDefault();
      function move(e) {
        var rect = workspace.getBoundingClientRect();
        var ratio = (e.clientX - rect.left) / rect.width;
        if (ratio < 0.24) ratio = 0.24;
        if (ratio > 0.72) ratio = 0.72;
        workspace.style.setProperty("--left", ratio * 100 + "%");
        store.setPref("leftPanelRatio", ratio);
      }
      function up() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      }
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
  }

  function runCurrent(ch, textarea, resultsHost) {
    if (runInFlight) return;
    var input = textarea.value;
    store.setDraft(ch.id, input);
    runInFlight = true;
    CF.runJob(ch, input, function (result) {
      runInFlight = false;
      lastResult = result;
      var rec = store.getRecord(ch.id);
      var breakdown = null;
      if (result.status === "hack") {
        var hintsForScore = rec.surrendered ? 3 : rec.hintsRevealed;
        breakdown = CF.scoreBreakdown(ch, result.size, hintsForScore, false);
        store.recordHack(ch.id, input, result.size, breakdown);
        rec = store.getRecord(ch.id);
        maybeCompleteDaily(ch.id, true);
      }
      resultsHost.replaceWith(resultsNode(ch, rec, result, breakdown));
      var next = document.querySelector(".results");
      if (next) {
        /* keep reference for later replacements via closest workspace */
      }
      renderChromeOnly();
    });
  }

  function renderChromeOnly() {
    var chip = document.querySelector(".stats-chip");
    if (chip) {
      chip.textContent = store.totalScore() + " pts · " + store.solvedCount() + "/" + CF.challenges.length + " hacked · streak " + CF.computeStreak(store.getState().daily.completions, todayKey());
    }
  }

  function challengeView(ch) {
    var rec = store.getRecord(ch.id);
    var ratio = store.getState().prefs.leftPanelRatio || 0.46;
    lastResult = rec.independentlySolved || rec.surrendered ? lastResult : lastResult;
    var resultsHost = resultsNode(ch, rec, lastResult && workspaceMountId === ch.id ? lastResult : null, null);
    var textarea = $("textarea", {
      id: "test-input",
      spellcheck: "false",
      "aria-label": "Test input",
      placeholder: "Write a valid test according to the input format…"
    });
    textarea.value = store.getDraft(ch.id) || "";
    textarea.addEventListener("input", function () {
      store.setDraft(ch.id, textarea.value);
    });

    var hintBox = $("div", { className: "hint-list" });
    function paintHints() {
      hintBox.innerHTML = "";
      var recNow = store.getRecord(ch.id);
      for (var i = 0; i < 3; i++) {
        var opened = recNow.hintsRevealed > i;
        var hint = ch.hints[i];
        var block = $("div", { className: "hint" });
        block.appendChild($("strong", { text: "Hint " + (i + 1) }));
        if (opened) {
          block.appendChild($("p", { text: hint.text }));
        } else {
          var cost = Math.round(CF.basePoints(ch.difficulty) * CF.HINT_PENALTY_FRACTION);
          block.appendChild($("p", { text: hint.teaser + " Revealing this hint reduces the base score by 15% (" + cost + " points on this " + ch.difficulty + " challenge)." }));
          if (i === recNow.hintsRevealed) {
            (function (index) {
              block.appendChild($("button", {
                className: "btn btn-ghost",
                type: "button",
                text: "Reveal hint " + (index + 1),
                onclick: function () {
                  confirmAction(
                    "Reveal hint " + (index + 1) + "?",
                    "This permanently counts as a used hint for scoring on this challenge (−15% of base per hint).",
                    function () {
                      store.revealHint(ch.id);
                      paintHints();
                    }
                  );
                }
              }));
            })(i);
          } else {
            block.appendChild($("p", { text: "Open the previous hint first." }));
          }
        }
        hintBox.appendChild(block);
      }
    }
    paintHints();

    var workspace = $("div", { className: "workspace" });
    workspace.style.setProperty("--left", ratio * 100 + "%");
    var splitter = $("button", { className: "splitter", type: "button", "aria-label": "Resize panels", title: "Drag to resize" });
    var runBtn = $("button", { className: "btn", type: "button", text: "Run test (Ctrl/⌘+Enter)" });
    runBtn.addEventListener("click", function () {
      var host = document.querySelector(".results");
      runCurrent(ch, textarea, host || resultsHost);
    });

    workspace.appendChild($("section", { className: "problem" },
      $("div", { className: "kicker" }, difficultyBadge(ch.difficulty), " ", ch.language, " · ", ch.sizeLabel),
      $("h1", { text: ch.title }),
      $("div", { html: ch.statementHtml }),
      $("h3", { text: "Input" }),
      $("p", { text: ch.inputFormat }),
      $("h3", { text: "Output" }),
      $("p", { text: ch.outputFormat }),
      $("h3", { text: "Constraints" }),
      $("ul", { className: "constraint-list" }, ch.constraints.map(function (c) { return $("li", { text: c }); })),
      $("p", { className: "note", text: ch.languageNote || "The displayed solution is JavaScript. It is not C++ and is not compiled." })
    ));
    workspace.appendChild(splitter);
    workspace.appendChild($("section", { className: "lab" },
      $("div", { className: "code-wrap" },
        $("h2", { text: "Displayed JavaScript (this is what runs)" }),
        $("pre", { html: CF.highlightJS(ch.buggySource), "aria-label": "Buggy solution source" })
      ),
      $("div", { className: "editor-wrap" },
        $("label", { "for": "test-input", text: "Test input" }),
        textarea
      ),
      $("div", { className: "lab-actions" },
        runBtn,
        $("button", { className: "btn btn-ghost", type: "button", text: "Reset input", onclick: function () { textarea.value = ""; store.setDraft(ch.id, ""); } }),
        $("button", {
          className: "btn btn-ghost",
          type: "button",
          text: "Next challenge",
          onclick: function () { go("#/challenge/" + CF.nextUnsolvedId(ch.id, store)); }
        }),
        $("button", {
          className: "btn btn-danger",
          type: "button",
          text: "Surrender",
          onclick: function () {
            confirmAction(
              "Surrender this challenge?",
              "This reveals the bug, a known counterexample, and both outputs. The challenge is marked surrendered (not independently solved). You can replay later. A later successful hack still scores, but with the maximum hint penalty.",
              function () {
                store.recordSurrender(ch.id);
                var payload = CF.executionPayload(ch);
                var revealed = CF.runAttempt(payload, ch.counterexample);
                lastResult = revealed;
                workspaceMountId = ch.id;
                render();
              }
            );
          }
        })
      ),
      hintBox,
      resultsHost
    ));
    bindSplitter(splitter, workspace);

    function onKey(ev) {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
        ev.preventDefault();
        var host = document.querySelector(".results");
        runCurrent(ch, textarea, host || resultsHost);
      }
    }
    workspace._onKey = onKey;
    document.addEventListener("keydown", onKey);

    workspaceMountId = ch.id;
    return $("div", {},
      $("main", { className: "wide" }, banners(), workspace)
    );
  }

  function progressView() {
    var rows = CF.challenges.map(function (ch) {
      var rec = store.getRecord(ch.id);
      return $("tr", {},
        $("td", {}, $("a", { href: "#/challenge/" + ch.id, text: ch.title })),
        $("td", {}, statusBadge(rec)),
        $("td", { text: rec.independentlySolved ? String(rec.bestScore) : "—" }),
        $("td", { text: rec.bestSize == null ? "—" : String(rec.bestSize) }),
        $("td", { text: String(rec.hintsRevealed) }),
        $("td", { text: rec.completedAt ? rec.completedAt.slice(0, 10) : "—" })
      );
    });
    var importInput = $("input", { type: "file", accept: "application/json,.json", className: "sr-only", id: "import-file" });
    importInput.addEventListener("change", function () {
      var file = importInput.files && importInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var res = store.importJSON(String(reader.result || ""));
        render();
        window.alert(res.message);
      };
      reader.readAsText(file);
    });
    return $("main", {},
      banners(),
      $("h1", { text: "Progress" }),
      $("p", { className: "lede", text: "Scores, daily streak, and drafts stay in this browser. Export a JSON copy if you switch machines. This is not a global ranking." }),
      $("div", { className: "metric-row" },
        $("div", { className: "metric" }, $("b", { text: String(store.totalScore()) }), $("span", { text: "total score" })),
        $("div", { className: "metric" }, $("b", { text: String(store.solvedCount()) }), $("span", { text: "hacked" })),
        $("div", { className: "metric" }, $("b", { text: String(CF.computeStreak(store.getState().daily.completions, todayKey())) }), $("span", { text: "streak" }))
      ),
      $("div", { className: "btn-row" },
        $("button", {
          className: "btn",
          type: "button",
          text: "Export progress JSON",
          onclick: function () {
            var blob = new Blob([store.exportJSON()], { type: "application/json" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "cf-arena-progress.json";
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
          }
        }),
        $("button", { className: "btn btn-ghost", type: "button", text: "Import progress JSON", onclick: function () { importInput.click(); } }),
        $("button", {
          className: "btn btn-danger",
          type: "button",
          text: "Reset all progress",
          onclick: function () {
            confirmAction("Reset all progress?", "This clears scores, drafts, hints, and daily history in this browser.", function () {
              store.reset();
              lastResult = null;
              render();
            });
          }
        }),
        importInput
      ),
      $("table", { className: "progress" },
        $("thead", {}, $("tr", {},
          $("th", { text: "Challenge" }),
          $("th", { text: "Status" }),
          $("th", { text: "Best score" }),
          $("th", { text: "Best size" }),
          $("th", { text: "Hints" }),
          $("th", { text: "Completed" })
        )),
        $("tbody", {}, rows)
      )
    );
  }

  function draftView() {
    function field(label, key, multiline) {
      if (multiline) {
        var ta = $("textarea", { "aria-label": label });
        ta.value = draftForm[key];
        ta.addEventListener("input", function () { draftForm[key] = ta.value; paintPreview(); });
        return $("label", { className: "field" }, label, ta);
      }
      var inp = $("input", { type: "text", "aria-label": label, value: draftForm[key] });
      inp.addEventListener("input", function () { draftForm[key] = inp.value; paintPreview(); });
      return $("label", { className: "field" }, label, inp);
    }
    var preview = $("div", { className: "panel" });
    function paintPreview() {
      preview.innerHTML = "";
      preview.appendChild($("div", { className: "card", style: "min-height:auto" },
        $("h3", { text: draftForm.title || "Untitled" }),
        $("div", { className: "meta" }, difficultyBadge(draftForm.difficulty), $("span", { className: "badge", text: draftForm.category }))
      ));
      preview.appendChild($("h2", { style: "margin-top:16px", text: draftForm.title || "Untitled" }));
      preview.appendChild($("p", { text: draftForm.statement }));
      preview.appendChild($("p", { html: "<strong>Input.</strong> " + CF.escapeHtml(draftForm.inputFormat) }));
      preview.appendChild($("p", { html: "<strong>Output.</strong> " + CF.escapeHtml(draftForm.outputFormat) }));
      preview.appendChild($("p", { html: "<strong>Constraints.</strong> " + CF.escapeHtml(draftForm.constraints) }));
      preview.appendChild($("p", { style: "color:var(--amber);font-size:13px", text: "Drafts are not executed. Shipping a playable challenge means adding trusted solver source to this repository and passing tests/run.js." }));
    }
    var diff = $("select", { "aria-label": "Difficulty" },
      ["easy", "medium", "hard"].map(function (d) {
        return $("option", { value: d, text: d, selected: draftForm.difficulty === d ? true : null });
      })
    );
    diff.addEventListener("change", function () { draftForm.difficulty = diff.value; paintPreview(); });
    var cat = $("select", { "aria-label": "Category" },
      Object.keys(CF.CATEGORIES).map(function (k) {
        return $("option", { value: k, text: CF.CATEGORIES[k], selected: draftForm.category === k ? true : null });
      })
    );
    cat.addEventListener("change", function () { draftForm.category = cat.value; paintPreview(); });
    paintPreview();
    return $("main", {},
      banners(),
      $("h1", { text: "Challenge draft builder" }),
      $("p", { className: "lede", text: "Sketch a statement and export JSON. This tool never runs solver code. Executable challenges must be committed as trusted definitions." }),
      $("div", { className: "draft-grid" },
        $("div", { className: "panel" },
          field("ID", "id"),
          field("Title", "title"),
          $("label", { className: "field" }, "Difficulty", diff),
          $("label", { className: "field" }, "Category", cat),
          field("Statement", "statement", true),
          field("Input format", "inputFormat", true),
          field("Output format", "outputFormat", true),
          field("Constraints", "constraints", true),
          field("Hint 1", "hint1", true),
          field("Hint 2", "hint2", true),
          field("Hint 3", "hint3", true),
          field("Agreement sample", "agreeInput", true),
          field("Known counterexample", "counterexample", true),
          $("div", { className: "btn-row" },
            $("button", {
              className: "btn",
              type: "button",
              text: "Export draft JSON",
              onclick: function () {
                var payload = {
                  schemaVersion: 1,
                  kind: "cf-arena-draft",
                  id: draftForm.id,
                  title: draftForm.title,
                  difficulty: draftForm.difficulty,
                  category: draftForm.category,
                  statement: draftForm.statement,
                  inputFormat: draftForm.inputFormat,
                  outputFormat: draftForm.outputFormat,
                  constraints: draftForm.constraints,
                  hints: [draftForm.hint1, draftForm.hint2, draftForm.hint3],
                  agreeInput: draftForm.agreeInput,
                  counterexample: draftForm.counterexample,
                  buggySource: "function solve(data) { /* trusted source must be added in-repo */ }",
                  referenceSource: "function solve(data) { /* trusted source must be added in-repo */ }",
                  notes: "This draft is not executed. Add solvers to js/challenges and run node tests/run.js."
                };
                var a = document.createElement("a");
                a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
                a.download = draftForm.id + ".draft.json";
                a.click();
              }
            })
          )
        ),
        preview
      )
    );
  }

  var boundKey = null;
  function render() {
    if (boundKey) {
      document.removeEventListener("keydown", boundKey);
      boundKey = null;
    }
    var route = parseRoute();
    if (route.name !== "challenge") {
      workspaceMountId = null;
      lastResult = null;
    }
    root.innerHTML = "";
    root.appendChild($("a", { className: "skip", href: "#content", text: "Skip to content" }));
    root.appendChild(header(route));
    var content;
    if (route.name === "home") content = homeView();
    else if (route.name === "library") content = libraryView();
    else if (route.name === "progress") content = progressView();
    else if (route.name === "draft") content = draftView();
    else if (route.name === "challenge") {
      var ch = CF.getChallenge(route.id);
      if (!ch) content = $("main", { id: "content" }, $("h1", { text: "Challenge not found" }), $("p", {}, $("a", { href: "#/library", text: "Back to library" })));
      else content = challengeView(ch);
    } else {
      content = $("main", { id: "content" }, $("h1", { text: "Page not found" }), $("p", {}, $("a", { href: "#/", text: "Home" })));
    }
    if (content && !content.id) content.id = "content";
    root.appendChild(content);
    var ws = document.querySelector(".workspace");
    if (ws && ws._onKey) boundKey = ws._onKey;
  }

  CF.__store = store;
  CF.__render = render;

  window.addEventListener("hashchange", render);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})(typeof window !== "undefined" ? window : globalThis);
