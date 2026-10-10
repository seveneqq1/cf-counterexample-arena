# Contributing challenges

Download the repository, unzip it, and double-click `index.html` to play. You do not need npm.

## What belongs in a challenge

Original statements only. Do not paste Codeforces problems or submissions. Cover a real bug class (off-by-one, greedy, disconnected graphs, binary-search bounds, modulo, overflow, precision, inequalities, leaked state, duplicates).

The JavaScript shown in the workspace **is** the JavaScript that runs. Keep one `buggySource` string.

## Workflow

1. Open the game at `#/draft` and fill the statement, constraints, hints, and sample tests.
2. Export draft JSON. That file is documentation; the game will not run its solver fields.
3. Copy the draft into `js/challenges/easy.js`, `medium.js`, or `hard.js` as a `CFArena.registerChallenge({...})` object. See [challenge-schema.md](challenge-schema.md) and [challenge-template.json](challenge-template.json).
4. Implement `parse`, `validate`, `sizeOf`, `solve` (buggy), and `solve` (reference).
5. Add a known counterexample and an input where both solvers agree.
6. Run `node tests/run.js` (Node is optional and only needed for contributors).

## Validation style

Reject bad tests before solvers run, with a specific reason:

- `Expected 5 array values, received 4.`
- `Vertex 8 is outside the allowed range 1–6.`
- `This challenge requires a connected graph.`

## Scoring metric

Define `sizeOf` from the instance (for example `n` or `n + m`). Do not use the raw character count of the editor text.
