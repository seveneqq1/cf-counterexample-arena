(function (global) {
  "use strict";

  var CF = (global.CFArena = global.CFArena || {});

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  CF.escapeHtml = escapeHtml;

  var KEYWORDS = /^(break|case|catch|const|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|let|new|return|switch|this|throw|try|typeof|var|void|while|with|yield|class|extends|export|import|from|super|null|true|false|undefined|NaN|Infinity)$/;

  CF.highlightJS = function (code) {
    var src = String(code);
    var out = "";
    var i = 0;
    while (i < src.length) {
      var ch = src.charAt(i);
      var two = src.slice(i, i + 2);
      if (two === "//") {
        var nl = src.indexOf("\n", i);
        if (nl === -1) nl = src.length;
        out += '<span class="tok-comment">' + escapeHtml(src.slice(i, nl)) + "</span>";
        i = nl;
        continue;
      }
      if (two === "/*") {
        var end = src.indexOf("*/", i + 2);
        if (end === -1) end = src.length;
        else end += 2;
        out += '<span class="tok-comment">' + escapeHtml(src.slice(i, end)) + "</span>";
        i = end;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        var q = ch;
        var j = i + 1;
        while (j < src.length) {
          if (src.charAt(j) === "\\") {
            j += 2;
            continue;
          }
          if (src.charAt(j) === q) {
            j += 1;
            break;
          }
          j += 1;
        }
        out += '<span class="tok-string">' + escapeHtml(src.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src.charAt(i + 1) || ""))) {
        var k = i;
        if (src.slice(i, i + 2) === "0x" || src.slice(i, i + 2) === "0X") k += 2;
        while (k < src.length && /[0-9a-fA-Fn_.]/.test(src.charAt(k))) k += 1;
        out += '<span class="tok-number">' + escapeHtml(src.slice(i, k)) + "</span>";
        i = k;
        continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        var w = i + 1;
        while (w < src.length && /[A-Za-z0-9_$]/.test(src.charAt(w))) w += 1;
        var word = src.slice(i, w);
        if (KEYWORDS.test(word)) out += '<span class="tok-kw">' + escapeHtml(word) + "</span>";
        else if (word === "BigInt" || word === "Math" || word === "Number" || word === "String" || word === "Array")
          out += '<span class="tok-ident">' + escapeHtml(word) + "</span>";
        else out += escapeHtml(word);
        i = w;
        continue;
      }
      out += escapeHtml(ch);
      i += 1;
    }
    return out;
  };
})(typeof window !== "undefined" ? window : globalThis);
