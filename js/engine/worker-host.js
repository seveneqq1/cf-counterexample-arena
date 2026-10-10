(function (global) {
  "use strict";

  var CF = (global.CFArena = global.CFArena || {});
  var PING_MS = 400;

  CF.workerSupport = function () {
    return typeof Worker !== "undefined" && typeof Blob !== "undefined" && typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
  };

  function fallbackNotice() {
    return "Web Workers are unavailable or did not start (this happens on some file:// browsers). Running a size-capped fallback for bundled trusted challenges only. Timeout protection is limited.";
  }

  function isTrustedBundled(challenge) {
    return !!(challenge && challenge.id && CF.getChallenge && CF.getChallenge(challenge.id));
  }

  CF.runJob = function (challenge, inputText, callback) {
    var payload = CF.executionPayload(challenge);
    var timeLimit = challenge.timeLimitMs || 500;
    var started = Date.now();
    var finished = false;

    function finish(result, meta) {
      if (finished) return;
      finished = true;
      result = result || { status: "reference_failure", error: "Empty worker result." };
      result.elapsedMs = Date.now() - started;
      if (meta && meta.fallback) result.fallback = true;
      if (meta && meta.notice) result.environmentNotice = meta.notice;
      callback(result);
    }

    function runFallback(notice) {
      if (!isTrustedBundled(challenge)) {
        finish({
          status: "buggy_timeout",
          error: "No working Web Worker, and this job is not a bundled catalog challenge. Refusing unbounded main-thread execution."
        }, { notice: notice || fallbackNotice() });
        return;
      }
      var result = CF.runAttempt(payload, inputText);
      finish(result, { fallback: true, notice: notice || fallbackNotice() });
    }

    if (!CF.workerSupport()) {
      runFallback(fallbackNotice());
      return;
    }

    var worker;
    var url;
    var settled = false;
    var jobTimer;
    var pingTimer;
    var jobStarted = false;

    function cleanup() {
      if (pingTimer) clearTimeout(pingTimer);
      if (jobTimer) clearTimeout(jobTimer);
      try {
        if (worker) worker.terminate();
      } catch (err) {}
      try {
        if (url) URL.revokeObjectURL(url);
      } catch (err) {}
    }

    function settle(result, meta) {
      if (settled) return;
      settled = true;
      cleanup();
      finish(result, meta);
    }

    try {
      var blob = new Blob([CF.buildWorkerSource()], { type: "application/javascript" });
      url = URL.createObjectURL(blob);
      worker = new Worker(url);
    } catch (err) {
      runFallback("Could not create a Blob Web Worker (" + (err && err.message ? err.message : err) + "). " + fallbackNotice());
      return;
    }

    function startJob() {
      jobStarted = true;
      jobTimer = setTimeout(function () {
        settle({ status: "buggy_timeout", error: "The buggy solution exceeded the " + timeLimit + " ms time limit." });
      }, timeLimit);
      try {
        worker.postMessage({ challenge: payload, input: inputText });
      } catch (err) {
        cleanup();
        runFallback("Worker messaging failed. " + fallbackNotice());
      }
    }

    pingTimer = setTimeout(function () {
      if (settled || jobStarted) return;
      cleanup();
      runFallback("Blob worker did not answer a ping in " + PING_MS + " ms. " + fallbackNotice());
    }, PING_MS);

    worker.onmessage = function (event) {
      var msg = event.data || {};
      if (msg.type === "pong") {
        if (settled || jobStarted) return;
        if (pingTimer) clearTimeout(pingTimer);
        startJob();
        return;
      }
      if (msg.ok === false) {
        settle(msg.result || { status: "reference_failure", error: "Worker reported a failure." });
        return;
      }
      settle(msg.result);
    };

    worker.onerror = function (event) {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      if (!jobStarted) {
        cleanup();
        runFallback("Blob worker error before ping. " + fallbackNotice());
        return;
      }
      settle({
        status: "buggy_crash",
        error: "The buggy solution threw in the worker: " + (event && event.message ? event.message : "script error")
      });
    };

    try {
      worker.postMessage({ type: "ping" });
    } catch (err) {
      cleanup();
      runFallback("Worker ping failed. " + fallbackNotice());
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
