// CV static generator: _data/data.yml -> single-page dist/index.html.
// Shares the blog's style.css. No framework. Run with `node build.mjs`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'dist');
const BASE = process.env.CV_BASE ?? '/online-cv'; // project-page path in prod; set CV_BASE='' for local preview

const data = yaml.load(fs.readFileSync(path.join(__dirname, '_data', 'data.yml'), 'utf8'));
const md = new MarkdownIt({ html: true, linkify: true, breaks: false });

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dedent = (s = '') => {
  const lines = s.replace(/\t/g, '    ').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n').trim();
};
const mdBlock = (s) => md.render(dedent(s || ''));

const ICON = {
  mail: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 014 0v4"/></svg>',
  github: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.3 4.3 0 00-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 00-6 0C6.3 2.3 5.3 2.6 5.3 2.6a4.3 4.3 0 00-.1 3.2A4.6 4.6 0 004 9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>',
  spotify: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14.5c2.5-.8 5.5-.6 7.5.7M7.5 11.5c3-1 6.5-.7 9 1M8 8.5c3.5-1 7 0 9 1.2"/></svg>',
};

function contacts() {
  const s = data.sidebar, out = [];
  if (s.email) out.push(`<a href="mailto:${esc(s.email)}">${ICON.mail}${esc(s.email)}</a>`);
  if (s.linkedin) out.push(`<a href="https://www.linkedin.com/in/${esc(s.linkedin)}">${ICON.linkedin}LinkedIn</a>`);
  if (s.github) out.push(`<a href="https://github.com/${esc(s.github)}">${ICON.github}GitHub</a>`);
  if (s.spotify) out.push(`<a href="https://open.spotify.com/user/${esc(s.spotify)}">${ICON.spotify}Spotify</a>`);
  return out.join('\n');
}

const section = (title, inner) => `<section class="cv-section"><h2>${esc(title)}</h2>${inner}</section>`;

function experiences() {
  return section('Experience', (data.experiences || []).map((e) => `<div class="cv-item">
  <div class="top"><h3>${esc(e.role)}</h3><span class="when">${esc(e.time)}</span></div>
  <div class="where">${esc(e.company)}</div>
  <div class="body">${mdBlock(e.details)}</div>
</div>`).join('\n'));
}

const chips = (h) => (h ? `<div class="chips">${h.split(',').map((x) => `<span>${esc(x.trim())}</span>`).join('')}</div>` : '');

function subsections(list) {
  return `<div class="subsections">${(list || []).map((sub) => `<details class="subsection">
  <summary><span class="sub-name">${esc(sub.name)}</span></summary>
  <div class="sub-body">
    <div class="body">${mdBlock(sub.tagline)}</div>
    ${chips(sub.highlights)}
  </div>
</details>`).join('\n')}</div>`;
}

// "Exploded" render: each sub-project as its own full cv-item (no accordion).
function exploded(list) {
  return (list || []).map((sub) => `<div class="cv-item">
  <div class="top"><h3>${esc(sub.name)}</h3>${sub.when ? `<span class="when">${esc(sub.when)}</span>` : ''}</div>
  <div class="body">${mdBlock(sub.tagline)}</div>
  ${chips(sub.highlights)}
</div>`).join('\n');
}

// Main page: cap sections at `featured` (when set) and show a "more" CTA to the dedicated page.
function assignmentItem(a) {
  const secs = a.sections || [];
  const capped = a.featured != null;
  const shown = capped ? secs.slice(0, a.featured) : secs;
  const cta = capped && a.moreHref && secs.length > a.featured
    ? `<a class="more-link" href="${esc(a.moreHref)}">${esc(a.moreLabel || 'Show full history')} →</a>`
    : '';
  return `<div class="cv-item"${a.id ? ` id="${esc(a.id)}"` : ''}>
  <div class="top"><h3>${esc(a.title)}</h3><span class="when">${esc(a.timespan)}</span></div>
  <div class="body">${mdBlock(a.tagline)}</div>
  ${chips(a.highlights)}
  ${shown.length ? subsections(shown) : ''}
  ${cta}
</div>`;
}

function projects() {
  const p = data.projects || {};
  return section(p.title || 'Portfolio', (p.assignments || []).map((a) => assignmentItem(a)).join('\n'));
}

function education() {
  return section('Education', (data.education || []).map((e) => `<div class="cv-item">
  <div class="top"><h3>${esc(e.degree)}</h3><span class="when">${esc(e.time)}</span></div>
  <div class="where">${esc(e.university)}</div>
  <div class="body">${mdBlock(e.details)}</div>
</div>`).join('\n'));
}

function skills() {
  const sk = data.skills || {};
  return section(sk.title || 'Skills', `<div class="skills-grid">${(sk.toolset || []).map((t) => `<div class="skill">
  <div class="skill-top"><span>${esc(t.name)}</span><span class="pct">${esc(t.level)}</span></div>
  <div class="bar"><i style="width:${esc(t.level)}"></i></div>
</div>`).join('\n')}</div>`);
}

const PICK = '<span class="logo-mark" aria-hidden="true"></span>';
const TOGGLE = `<button class="toggle" id="toggle" aria-label="Toggle light/dark">
  <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
  <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>
</button>`;

const s = data.sidebar;

const header = `<header class="site-head">
  <a class="brand" href="/">${PICK} damiano giusti</a>
  <nav class="site-nav">
    <a href="/">writing</a>
    ${TOGGLE}
  </nav>
</header>`;

const footer = `<footer class="site-foot">
  <span class="np">♪ off the clock — guitar &amp; live music</span>
  <div class="foot-row">
    <span>© ${new Date().getFullYear()} ${esc(s.name)}</span>
    <span><a href="https://github.com/${esc(s.github)}">github</a> · <a href="https://www.linkedin.com/in/${esc(s.linkedin)}">linkedin</a></span>
  </div>
</footer>`;

const mainBody = `${header}

<div class="cv-profile">
  <img class="avatar" src="${esc(s.avatar)}" alt="${esc(s.name)}">
  <div>
    <h1>${esc(s.name)}</h1>
    <p class="tagline">${esc(s.tagline)}</p>
  </div>
</div>
<div class="cv-contact">
${contacts()}
</div>

${section(data['career-profile'].title || 'About', `<div class="cv-item"><div class="body">${mdBlock(data['career-profile'].summary)}</div></div>`)}
${experiences()}
${projects()}
${education()}

${footer}`;

const molo = (data.projects?.assignments || []).find((a) => a.id === 'molo17') || {};
const molo17Body = `${header}

<div class="cv-profile">
  <div>
    <h1>${esc(molo.title || 'MOLO17')}</h1>
    <p class="tagline">Full project history${molo.timespan ? ` · ${esc(molo.timespan)}` : ''}</p>
  </div>
</div>

${section('Projects', `<div class="cv-item"><div class="body">${mdBlock(molo.tagline)}</div></div>
${exploded(molo.sections)}`)}

<p class="back-row"><a class="more-link" href="index.html">← Back to CV</a></p>

${footer}`;

const pageShell = (inner, { titleText, description }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titleText)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="${BASE}/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="${BASE}/style.css">
<script>(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;})();</script>
</head>
<body>
<div class="wrap">
${inner}
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

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), pageShell(mainBody, {
  titleText: `${s.name} — ${s.tagline}`,
  description: `${s.name}, ${s.tagline}. Résumé and portfolio.`,
}));
fs.writeFileSync(path.join(OUT, 'molo17.html'), pageShell(molo17Body, {
  titleText: `${s.name} — MOLO17 project history`,
  description: `${s.name}: full MOLO17 project history.`,
}));
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(OUT, 'style.css'));
if (fs.existsSync(path.join(__dirname, 'favicon.ico'))) fs.copyFileSync(path.join(__dirname, 'favicon.ico'), path.join(OUT, 'favicon.ico'));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('Built CV → dist/ (index.html + molo17.html)');
