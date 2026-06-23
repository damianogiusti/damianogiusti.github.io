# damianogiusti.com

Personal tech blog. Static site built from Markdown by a tiny custom generator
(`build.mjs`) — no Jekyll, no framework. One build step.

## Stack

- **Content:** Markdown + YAML front matter in `src/posts/`, plus `src/about.md`.
- **Build:** [`markdown-it`](https://github.com/markdown-it/markdown-it) (with
  `markdown-it-anchor`), [`highlight.js`](https://highlightjs.org) for code, and
  `gray-matter` for front matter. See `build.mjs`.
- **Style:** one hand-written `style.css` — monospace, minimal, light/dark
  (follows OS, with a persisted toggle). Shared with the
  [online-cv](https://www.damianogiusti.com/online-cv) site.
- **Deploy:** GitHub Actions builds `dist/` and publishes to GitHub Pages
  (`.github/workflows/deploy.yml`).

## Develop

```sh
make dependencies   # npm install
make build          # node build.mjs  -> dist/
make start          # build + serve at http://localhost:3000
```

## Writing a post

Add `src/posts/YYYY-MM-DD-slug.md`:

```markdown
---
title: "Your title"
categories: [ Kotlin, Android ]
image: /assets/images/your-cover.jpg
---

Body in Markdown. Fenced code blocks are syntax-highlighted.
```

The date and URL slug come from the filename; the post is served at `/slug/`.

## Style prototypes

The three style directions evaluated before this rebuild live in `prototypes/`
for reference.
