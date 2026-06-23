// Tiny static-site generator: Markdown + front matter -> HTML.
// No framework. Run with `node build.mjs`; output lands in dist/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import hljs from 'highlight.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'dist');

const SITE = {
  title: 'Damiano Giusti',
  url: 'https://www.damianogiusti.com',
  author: 'Damiano Giusti',
  description: 'Android Engineer by day, guitar player by night. Notes on Kotlin Multiplatform, mobile architecture, and shipping apps.',
  resume: '/online-cv',
  github: 'https://github.com/damianogiusti',
  linkedin: 'https://www.linkedin.com/in/damiano-giusti-78bb30124',
  spotify: 'https://open.spotify.com/user/damiano.giusti',
  nowPlaying: { track: 'John Mayer · Slow Dancing in a Burning Room', url: 'https://open.spotify.com/user/damiano.giusti' },
};

/* ── markdown ── */
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs language-' + lang + '">' +
          hljs.highlight(str, { language: lang }).value + '</code></pre>';
      } catch (_) {}
    }
    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
  },
}).use(anchor, {
  permalink: anchor.permalink.linkInsideHeader({ symbol: '#', class: 'anchor', placement: 'after' }),
  level: [2, 3],
});

/* ── helpers ── */
const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugifyCat = (c) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fmtDate = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
const isoDate = (d) => d.toISOString().slice(0, 10);

function writeFile(rel, html) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
}
function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

/* ── shared chrome ── */
const PICK = '<svg class="pick" viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1C18 1 22 5 22 11C22 18 16 27 12 27C8 27 2 18 2 11C2 5 6 1 12 1Z"/></svg>';
const TOGGLE = `<button class="toggle" id="toggle" aria-label="Toggle light/dark">
  <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
  <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>
</button>`;

const header = () => `<header class="site-head">
  <a class="brand" href="/">${PICK} damiano giusti</a>
  <nav class="site-nav">
    <a href="/">writing</a>
    <a href="${SITE.resume}">résumé</a>
    ${TOGGLE}
  </nav>
</header>`;

const footer = () => `<footer class="site-foot">
  <span class="np">♪ now playing — <a href="${SITE.nowPlaying.url}">${esc(SITE.nowPlaying.track)}</a></span>
  <div class="foot-row">
    <span>© ${new Date().getFullYear()} ${SITE.author}</span>
    <span><a href="${SITE.github}">github</a> · <a href="${SITE.linkedin}">linkedin</a> · <a href="${SITE.spotify}">spotify</a></span>
  </div>
</footer>`;

function page({ title, description, body, ogImage, canonical }) {
  const desc = description || SITE.description;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE.url}${canonical || '/'}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${ogImage ? `<meta property="og:image" content="${SITE.url}${ogImage}">` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
<link rel="icon" href="/assets/images/icons/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/images/icons/favicon-32x32.png">
<link rel="apple-touch-icon" href="/assets/images/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/style.css">
<script>(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;})();</script>
</head>
<body>
<div class="wrap">
${header()}
${body}
${footer()}
</div>
<script>
document.getElementById('toggle').addEventListener('click',function(){
  var r=document.documentElement, cur=r.dataset.theme;
  if(!cur) cur=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  var n=cur==='dark'?'light':'dark';
  r.dataset.theme=n; localStorage.setItem('theme',n);
});
</script>
</body>
</html>`;
}

/* ── load posts ── */
function loadPosts() {
  const dir = path.join(SRC, 'posts');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data, content } = matter(raw);
    const m = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/);
    const date = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
    const slug = m[4];
    const html = md.render(content);
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const excerpt = (data.excerpt || plain.slice(0, 160)).trim();
    return {
      slug, date, html, excerpt,
      title: data.title || slug,
      categories: data.categories || [],
      image: data.image || null,
      url: `/${slug}/`,
    };
  }).sort((a, b) => b.date - a.date);
}

/* ── partials ── */
const postRow = (p) => `<li class="post-row">
  ${p.image ? `<a href="${p.url}"><img class="cover" src="${p.image}" alt=""></a>` : '<span></span>'}
  <div>
    <span class="date">${fmtDate(p.date)}</span>
    <h2><a href="${p.url}">${esc(p.title)}</a></h2>
    <p>${esc(p.excerpt)}</p>
    <div class="tags">${p.categories.map((c) => `<a href="/category/${slugifyCat(c)}/">${esc(c)}</a>`).join('')}</div>
  </div>
</li>`;

/* ── pages ── */
function buildHome(posts) {
  const body = `<p class="intro">
  Android Engineer by day, <span class="accent">guitar player</span> by night.
  I write about <b>Kotlin Multiplatform</b>, mobile architecture, and the small
  details of building apps that ship.
</p>
<ul class="posts">
${posts.map(postRow).join('\n')}
</ul>`;
  writeFile('index.html', page({ title: `${SITE.title} — Notes on mobile engineering`, body, canonical: '/' }));
}

function buildPost(p, prev, next) {
  const nav = `<nav class="post-nav">
  ${next ? `<a class="col" href="${next.url}"><span class="lbl">← previous</span>${esc(next.title)}</a>` : '<span></span>'}
  ${prev ? `<a class="col next" href="${prev.url}"><span class="lbl">next →</span>${esc(prev.title)}</a>` : '<span></span>'}
</nav>`;
  const body = `<div class="crumb"><a href="/">← writing</a></div>
<article>
  ${p.image ? `<img class="hero" src="${p.image}" alt="">` : ''}
  <div class="article-head">
    <span class="date">${fmtDate(p.date)}</span>
    <h1>${esc(p.title)}</h1>
    <div class="byline">by <b>${SITE.author}</b></div>
  </div>
  <div class="prose">${p.html}</div>
  ${nav}
</article>`;
  writeFile(`${p.slug}/index.html`, page({
    title: `${p.title} — ${SITE.title}`,
    description: p.excerpt,
    ogImage: p.image,
    canonical: p.url,
    body,
  }));
}

function buildCategories(posts) {
  const map = new Map();
  for (const p of posts) for (const c of p.categories) {
    if (!map.has(c)) map.set(c, []);
    map.get(c).push(p);
  }
  for (const [cat, list] of map) {
    const body = `<div class="page-head">
  <h1>#${esc(cat)}</h1>
  <p>${list.length} post${list.length > 1 ? 's' : ''} tagged ${esc(cat)}</p>
</div>
<ul class="posts">${list.map(postRow).join('\n')}</ul>`;
    writeFile(`category/${slugifyCat(cat)}/index.html`, page({
      title: `#${cat} — ${SITE.title}`,
      description: `Posts tagged ${cat}.`,
      canonical: `/category/${slugifyCat(cat)}/`,
      body,
    }));
  }
  return map;
}

function buildAbout() {
  const file = path.join(SRC, 'about.md');
  if (!fs.existsSync(file)) return;
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  const body = `<div class="page-head"><h1>${esc(data.title || 'About')}</h1></div>
<div class="prose">${md.render(content)}</div>`;
  writeFile('about/index.html', page({ title: `${data.title || 'About'} — ${SITE.title}`, canonical: '/about/', body }));
}

function build404() {
  const body = `<div class="notfound">
  <div class="code">404</div>
  <p>This page hit a compile error. <a href="/">Back to writing →</a></p>
</div>`;
  writeFile('404.html', page({ title: `404 — ${SITE.title}`, canonical: '/404.html', body }));
}

function buildSitemap(posts, cats) {
  const urls = ['/', '/about/', ...posts.map((p) => p.url), ...[...cats.keys()].map((c) => `/category/${slugifyCat(c)}/`)];
  const body = urls.map((u) => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n');
  writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
}

/* ── run ── */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const posts = loadPosts();
buildHome(posts);
posts.forEach((p, i) => buildPost(p, posts[i - 1], posts[i + 1]));
const cats = buildCategories(posts);
buildAbout();
build404();
buildSitemap(posts, cats);

// static files
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(OUT, 'style.css'));
copyDir(path.join(__dirname, 'assets'), path.join(OUT, 'assets'));
for (const f of ['CNAME', 'robots.txt']) {
  if (fs.existsSync(path.join(__dirname, f))) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

console.log(`Built ${posts.length} posts → dist/`);
