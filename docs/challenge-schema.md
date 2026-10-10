# Challenge schema

A playable challenge is a JavaScript object registered with `CFArena.registerChallenge` in `js/challenges/`. Draft JSON from the in-game builder is a starting point only: **imported drafts are never executed**.

## Required fields

| Field | Meaning |
| --- | --- |
| `id` | Unique slug used in `#/challenge/<id>` |
| `title` | Card and workspace title |
| `difficulty` | `easy` \| `medium` \| `hard` |
| `category` | One of the keys in `CFArena.CATEGORIES` |
| `smallSize` | Semantic size that earns the full compact bonus |
| `sizeLabel` | Shown to the player (for example `n`, or `n + m`) |
| `statementHtml` | Problem statement (trusted HTML) |
| `inputFormat`, `outputFormat` | Text |
| `constraints` | Array of human-readable bounds |
| `languageNote` | Must state that the solution is JavaScript |
| `hints` | Three objects `{ teaser, text }` |
| `explanation` | Shown after a hack or surrender |
| `counterexample` | A valid input that exposes the bug |
| `counterexampleNote` | Why that input works |
| `agreeInput` | A valid input on which both solvers agree |
| `buggySource` | **The exact JavaScript shown and executed** (`function solve`) |
| `referenceSource` | Hidden correct `function solve` |
| `parseSource` | `function parse(input)` |
| `validateSource` | `function validate(parsed)` → `{ ok: true }` or `{ ok: false, message }` |
| `sizeSource` | `function sizeOf(parsed)` → non-negative number |

Optional: `checkerSource` (`function check(buggyOut, refOut, parsed) { return { equal: boolean }; }`) when several outputs are allowed. Prefer unique-answer problems.

## Execution contract

1. `parse` tokenizes the raw editor text.
2. `validate` enforces **every** constraint in the statement (ranges, counts, graph vertex ids, connectivity if required, extra tokens).
3. Both `solve` functions receive the same parsed object and return a string (or value stringified by the runtime).
4. Outputs are compared as whitespace-separated tokens unless a checker is provided.
5. `sizeOf` must depend on the instance (array length, vertices+edges, amount `S`, …), never on spaces or line breaks.

Keep `n` and friends small enough for a browser worker (~500 ms). For numeric bugs, model JavaScript explicitly (`Math.imul` for 32-bit wrap, `BigInt` for exact integers, `Math.sqrt` for IEEE-754).

## Adding a challenge

1. Export a draft from `#/draft` or copy `docs/challenge-template.json`.
2. Implement solvers in `js/challenges/easy.js`, `medium.js`, or `hard.js`.
3. Use the **same** `buggySource` string for display and execution.
4. Run `node tests/run.js`. Every challenge must include a known counterexample, an agreement input, and validators with specific messages.
