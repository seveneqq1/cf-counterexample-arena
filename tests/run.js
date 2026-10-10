#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var { Worker } = require("worker_threads");

var root = path.join(__dirname, "..");

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

var storage = memoryStorage();
var context = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Date: Date,
  Math: Math,
  JSON: JSON,
  Error: Error,
  Array: Array,
  String: String,
  Number: Number,
  BigInt: BigInt,
  Boolean: Boolean,
  Object: Object,
  RegExp: RegExp,
  Infinity: Infinity,
  NaN: NaN,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite,
  Map: Map,
  Set: Set,
  localStorage: storage,
  Worker: undefined,
  Blob: undefined,
  URL: undefined
};
context.globalThis = context;
context.window = context;
vm.createContext(context);

function load(rel) {
  var file = path.join(root, rel);
  var code = fs.readFileSync(file, "utf8");
  vm.runInContext(code, context, { filename: rel });
}

[
  "js/engine/runtime.js",
  "js/engine/scoring.js",
  "js/engine/store.js",
  "js/engine/daily.js",
  "js/engine/highlight.js",
  "js/challenges/catalog.js",
  "js/challenges/easy.js",
  "js/challenges/medium.js",
  "js/challenges/hard.js",
  "tests/tests.js"
].forEach(load);

var results = context.CFArenaTests.run();
var failed = results.filter(function (r) {
  return !r.ok;
});
var passed = results.length - failed.length;
results.forEach(function (r) {
  if (r.ok) console.log("ok  - " + r.name);
  else console.log("FAIL- " + r.name + " :: " + r.detail);
});

function timeoutTest() {
  return new Promise(function (resolve) {
    var CF = context.CFArena;
    var source =
      CF.RUNTIME_SOURCE +
      "\nconst { parentPort } = require('worker_threads');\n" +
      "parentPort.on('message', (msg) => {\n" +
      "  const result = runAttempt(msg.challenge, msg.input);\n" +
      "  parentPort.postMessage(result);\n" +
      "});\n";
    var challenge = {
      buggySource: "function solve() { while (true) {} }",
      referenceSource: "function solve() { return '0'; }",
      parseSource: "function parse() { return {}; }",
      validateSource: "function validate() { return { ok: true }; }",
      sizeSource: "function sizeOf() { return 1; }",
      maxInputChars: 20,
      maxParsedSize: 10
    };
    var worker = new Worker(source, { eval: true });
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      worker.terminate().then(function () {
        resolve({ ok: true, name: "worker timeout terminates hung solver" });
      });
    }, 250);
    worker.on("message", function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, name: "worker timeout terminates hung solver", detail: "worker finished instead of timing out" });
    });
    worker.on("error", function (err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, name: "worker timeout terminates hung solver", detail: String(err) });
    });
    worker.postMessage({ challenge: challenge, input: "1" });
  });
}

timeoutTest()
  .then(function (extra) {
    if (extra.ok) {
      console.log("ok  - " + extra.name);
      passed += 1;
    } else {
      console.log("FAIL- " + extra.name + " :: " + extra.detail);
      failed.push(extra);
    }
    console.log("\n" + passed + " passed, " + failed.length + " failed, " + (passed + failed.length) + " total");
    process.exit(failed.length ? 1 : 0);
  })
  .catch(function (err) {
    console.error(err);
    process.exit(1);
  });
