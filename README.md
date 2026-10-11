Download the repository, unzip it, and double-click index.html.

# CF Counterexample Arena

A local browser game for the skill behind Codeforces hacks: given an original problem and an intentionally wrong JavaScript solution, write a valid test that makes that solution print a different answer from the reference.

There is nothing to install. The game is plain HTML, CSS, and JavaScript. It runs from `file://` and from GitHub Pages without a build step, backend, CDN, account, or API key.

The first version’s solutions are **JavaScript**. They are not C++ and they are not compiled.

This is a client-side app. Bug write-ups, reference solvers, and known counterexamples live in the downloaded files. The UI hides them until you hack or surrender; developer tools can still open the sources.

## Launch

Nothing to install. After you have the project folder (clone or unzip), open `index.html` in a browser.

**Any OS:** in Finder, File Explorer, or your file manager, double-click `index.html`.

**macOS (Terminal)**

```bash
git clone https://github.com/seveneqq1/cf-counterexample-arena.git
cd cf-counterexample-arena
open index.html
```

`open -a "Google Chrome" index.html` or `open -a Safari index.html` picks a specific browser.

**Windows (Command Prompt or PowerShell)**

```bat
git clone https://github.com/seveneqq1/cf-counterexample-arena.git
cd cf-counterexample-arena
start index.html
```

PowerShell can also use `Invoke-Item index.html`.

**Linux (terminal)**

```bash
git clone https://github.com/seveneqq1/cf-counterexample-arena.git
cd cf-counterexample-arena
xdg-open index.html
```

If `xdg-open` is missing, try `gio open index.html` or pass the file to your browser, for example `firefox index.html`.

Do not use `npm install`, a bundler, or a local server. A static host such as GitHub Pages is optional and not required to play.

## Gameplay

1. Open **Library** (or **Start hacking** on the home page) and pick a challenge.
2. Read the statement on the left. The JavaScript on the right is the program that will run.
3. Edit a test in the input box. **Run test** or press Ctrl/⌘+Enter.
4. Invalid input is rejected with a specific constraint error. Valid input shows the buggy output, the correct output, and whether they differ.
5. A mismatch is a successful hack. Smaller semantic instances score more. Hints cost 15% of the base score each. Replays only keep a better score; repeating the same hack does not farm points.
6. After a hack (or surrender) the bug explanation and a known counterexample unlock.

Daily challenge, streak, and scores use **your local calendar and this browser**. They are not a shared leaderboard.

## Scoring

```
base        = 100 easy / 200 medium / 300 hard
hintPenalty = 15% of base per revealed hint (max 3)
sizeBonus   = up to 25% of base when semantic size ≤ the challenge’s compact target
              (falls to 0 at 4× that target)
score       = max(0, base − hintPenalty + sizeBonus)
```

Surrender scores 0 and is marked separately from an independent hack. You can replay afterward; a later hack still counts, but with the maximum hint penalty because the write-up was shown.

“Semantic size” is defined per challenge (`n`, `n+m`, postage `S`, …). Extra spaces do not change it. A compact bonus does **not** mean the input is globally minimal.

## GitHub Pages

The site is the repository root (`index.html` plus relative `css/`, `js/`, `assets/`). Enable Pages in either way:

- **Deploy from a branch:** Source = `main` (or `master`), folder = `/` (root). No source changes.
- **GitHub Actions:** allow Pages in the repo settings. The workflow `.github/workflows/pages.yml` uploads this tree as-is.

Keep paths relative so project URLs (`https://<user>.github.io/<repo>/`) work. Hash routes (`#/library`, `#/challenge/<id>`) work on `file://` and on static hosting.

## Testing

Optional. Playing does not require Node.

```
node tests/run.js
```

Or double-click `tests/index.html` to run the same suite in a browser, including a Blob-backed Web Worker timeout check.

The suite covers known counterexamples, agreement inputs, independent oracles on small random instances, displayed-vs-executed source identity, validators, scoring (including no point farming), semantic size vs formatting, hints/surrender, daily-challenge stability, storage recovery, import/export, and worker timeout.

## Contributing challenges

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md), [docs/challenge-schema.md](docs/challenge-schema.md), and [docs/challenge-template.json](docs/challenge-template.json).

The in-game **Draft builder** (`#/draft`) exports JSON for a statement. It does **not** execute solver code. A playable challenge must be added under `js/challenges/` and pass `node tests/run.js`.

## License

MIT. See [LICENSE](LICENSE).
