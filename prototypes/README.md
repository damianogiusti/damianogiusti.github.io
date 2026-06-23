# Template prototypes

Three standalone style directions for replacing Jekyll with a tiny custom static-site
build (markdown → HTML). No build step — open the HTML files directly in a browser.

Start at [`prototypes/index.html`](index.html), or open a direction directly:

| # | Style | Home | Article |
|---|-------|------|---------|
| 01 | **Minimal Mono** — text-forward, serif body, monospace metadata, warm accent | [index](1-minimal-mono/index.html) | [article](1-minimal-mono/article.html) |
| 02 | **Terminal / Dev** — dark-default, monospace, IDE/terminal feel, mint accent | [index](2-terminal-dev/index.html) | [article](2-terminal-dev/article.html) |
| 03 | **Editorial** — Swiss/magazine, serif display, numbered index, red accent | [index](3-editorial/index.html) | [article](3-editorial/article.html) |

All three implement the kept features: **dark-mode toggle** (persisted to `localStorage`),
**syntax-highlighted code blocks**, and **category tags**. Design goal: clean, tidy,
minimal — a real code/design aesthetic, not generic template filler.

## Next step

Pick one. The chosen direction's CSS becomes the shared stylesheet wired into a
`build.mjs` (markdown-it) that refactors both the blog and the `online-cv` site.
See the plan for the full migration.
