// Résumé generator: resume/data.yml -> dist/resume/{index,molo17}.html.
// Shares the blog's root style.css and favicons. Called by ../build.mjs via buildResume(OUT).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const data = yaml.load(fs.readFileSync(path.join(__dirname, 'data.yml'), 'utf8'));
const dataIt = yaml.load(fs.readFileSync(path.join(__dirname, 'data.it.yml'), 'utf8'));
const md = new MarkdownIt({ html: true, linkify: true, breaks: false });

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// bilingual inline text: renders both languages, one shown via [data-lang] + CSS.
const bi = (en, it) => `<span data-l="en">${esc(en)}</span><span data-l="it">${esc(it)}</span>`;
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

function contacts(d) {
  const sd = d.sidebar, out = [];
  if (sd.email) out.push(`<a href="mailto:${esc(sd.email)}">${ICON.mail}${esc(sd.email)}</a>`);
  if (sd.linkedin) out.push(`<a href="https://www.linkedin.com/in/${esc(sd.linkedin)}">${ICON.linkedin}LinkedIn</a>`);
  if (sd.github) out.push(`<a href="https://github.com/${esc(sd.github)}">${ICON.github}GitHub</a>`);
  if (sd.spotify) out.push(`<a href="https://open.spotify.com/user/${esc(sd.spotify)}">${ICON.spotify}Spotify</a>`);
  return out.join('\n');
}

const section = (title, inner) => `<section class="cv-section"><h2>${esc(title)}</h2>${inner}</section>`;

function experiences(d, L) {
  return section(L.experience, (d.experiences || []).map((e) => `<div class="cv-item">
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
function assignmentItem(a, L, lang) {
  const secs = a.sections || [];
  const capped = a.featured != null;
  const shown = capped ? secs.slice(0, a.featured) : secs;
  const cta = capped && a.moreHref && secs.length > a.featured
    ? `<a class="more-link" href="${esc(a.moreHref)}">${esc(a.moreLabel || L.more)} →</a>`
    : '';
  // Emit the anchor id only once (EN copy) so the two language blocks don't collide.
  const id = a.id && lang !== 'it' ? ` id="${esc(a.id)}"` : '';
  return `<div class="cv-item"${id}>
  <div class="top"><h3>${esc(a.title)}</h3><span class="when">${esc(a.timespan)}</span></div>
  <div class="body">${mdBlock(a.tagline)}</div>
  ${chips(a.highlights)}
  ${shown.length ? subsections(shown) : ''}
  ${cta}
</div>`;
}

function projects(d, L, lang) {
  const p = d.projects || {};
  return section(p.title || 'Portfolio', (p.assignments || []).map((a) => assignmentItem(a, L, lang)).join('\n'));
}

function education(d, L) {
  return section(L.education, (d.education || []).map((e) => `<div class="cv-item">
  <div class="top"><h3>${esc(e.degree)}</h3><span class="when">${esc(e.time)}</span></div>
  <div class="where">${esc(e.university)}</div>
  <div class="body">${mdBlock(e.details)}</div>
</div>`).join('\n'));
}

const PICK = '<span class="logo-mark" aria-hidden="true"></span>';
const TOGGLE = `<button class="toggle" id="toggle" aria-label="Toggle light/dark">
  <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
  <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>
</button>`;
const LANG = `<button class="toggle lang-toggle" id="lang" aria-label="Cambia lingua / Switch language">${bi('IT', 'EN')}</button>`;

const s = data.sidebar;

const L = {
  en: { experience: 'Experience', education: 'Education', projects: 'Projects', more: 'Show full history', moloTag: 'Full project history', back: '← Back to CV', about: 'About' },
  it: { experience: 'Esperienza', education: 'Formazione', projects: 'Progetti', more: 'Mostra tutto', moloTag: 'Storico completo dei progetti', back: '← Torna al CV', about: 'Profilo' },
};

const BACK = `<a class="back-btn" href="/" aria-label="Home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></a>`;
const header = `<header class="site-head">
  <div class="head-left">
    ${BACK}
    <a class="brand" href="/">${PICK}<span class="brand-name">damiano giusti</span></a>
  </div>
  <nav class="site-nav">
    <a href="/writing/">blog</a>
    <a href="/resume">résumé</a>
    ${TOGGLE}
    ${LANG}
  </nav>
</header>`;

const footer = `<footer class="site-foot">
  <span class="np">♪ ${bi('off the clock', 'fuori orario')} — ${bi('guitar & live music', 'chitarra & musica dal vivo')}</span>
  <div class="foot-row">
    <span>© ${new Date().getFullYear()} ${esc(s.name)}</span>
    <span><a href="https://github.com/${esc(s.github)}">github</a> · <a href="https://www.linkedin.com/in/${esc(s.linkedin)}">linkedin</a></span>
  </div>
</footer>`;

function mainInner(d, lbl, lang) {
  const sd = d.sidebar;
  return `<div class="cv-profile">
  <img class="avatar" src="${esc(sd.avatar)}" alt="${esc(sd.name)}">
  <div>
    <h1>${esc(sd.name)}</h1>
    <p class="tagline">${esc(sd.tagline)}</p>
  </div>
</div>
<div class="cv-contact">
${contacts(d)}
</div>

${section(d['career-profile'].title || lbl.about, `<div class="cv-item"><div class="body">${mdBlock(d['career-profile'].summary)}</div></div>`)}
${experiences(d, lbl)}
${projects(d, lbl, lang)}
${education(d, lbl)}`;
}

function moloInner(d, lbl) {
  const molo = (d.projects?.assignments || []).find((a) => a.id === 'molo17') || {};
  return `<div class="cv-profile">
  <div>
    <h1>${esc(molo.title || 'MOLO17')}</h1>
    <p class="tagline">${esc(lbl.moloTag)}${molo.timespan ? ` · ${esc(molo.timespan)}` : ''}</p>
  </div>
</div>

${section(lbl.projects, `<div class="cv-item"><div class="body">${mdBlock(molo.tagline)}</div></div>
${exploded(molo.sections)}`)}

<p class="back-row"><a class="more-link" href="index.html">${esc(lbl.back)}</a></p>`;
}

const mainBody = `${header}

<div data-l="en">
${mainInner(data, L.en, 'en')}
</div>
<div data-l="it">
${mainInner(dataIt, L.it, 'it')}
</div>

${footer}`;

const molo17Body = `${header}

<div data-l="en">
${moloInner(data, L.en)}
</div>
<div data-l="it">
${moloInner(dataIt, L.it)}
</div>

${footer}`;

// Absolute URLs for canonical/OG/JSON-LD.
const SITE_URL = 'https://www.damianogiusti.com';
const CANON = `${SITE_URL}/resume`;
const OG_IMAGE = `${SITE_URL}/assets/images/og-card.png`;
const personLd = () => ({
  '@context': 'https://schema.org', '@type': 'Person',
  '@id': `${CANON}/#person`,
  name: s.name, url: `${CANON}/`, image: s.avatar,
  jobTitle: 'Senior Mobile Engineer',
  worksFor: { '@type': 'Organization', name: 'Empatica' },
  knowsAbout: ['Kotlin', 'Kotlin Multiplatform', 'Android', 'iOS', 'Bluetooth Low Energy', 'Mobile app architecture'],
  alumniOf: (data.education || []).map((e) => ({ '@type': 'EducationalOrganization', name: e.university })),
  sameAs: [
    'https://github.com/damianogiusti',
    'https://www.linkedin.com/in/damiano-giusti-78bb30124',
    'https://open.spotify.com/user/damiano.giusti',
  ],
});
const renderLd = (list) => (!list || !list.length ? ''
  : list.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n'));

const pageShell = (inner, { titleText, description, jsonLd, canonical, ogType = 'website', ogImage }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titleText)}</title>
<meta name="description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(titleText)}">
<meta property="og:description" content="${esc(description)}">
${canonical ? `<meta property="og:url" content="${canonical}">` : ''}
<meta property="og:site_name" content="${esc(s.name)}">
${ogImage ? `<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="${ogImage}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/images/icons/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/images/icons/favicon-32x32.png">
<link rel="apple-touch-icon" href="/assets/images/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/style.css">
<script>(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;var l=localStorage.getItem('lang');if(!l)l=(navigator.language||'en').toLowerCase().indexOf('it')===0?'it':'en';var r=document.documentElement;r.dataset.lang=l;r.lang=l;})();</script>
${renderLd(jsonLd)}
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
document.getElementById('lang').addEventListener('click',function(){
  var r=document.documentElement, cur=r.dataset.lang||'en', n=cur==='it'?'en':'it';
  r.dataset.lang=n; r.lang=n; localStorage.setItem('lang',n);
});
</script>
</body>
</html>`;

// Emit the résumé pages into dist/resume/. Shared style.css and favicons live at
// the site root and are written by the blog build, so nothing is copied here.
export function buildResume(OUT) {
  const RES = path.join(OUT, 'resume');
  fs.mkdirSync(RES, { recursive: true });
  fs.writeFileSync(path.join(RES, 'index.html'), pageShell(mainBody, {
    titleText: `${s.name} - ${s.tagline}`,
    description: 'Senior Mobile Engineer with over a decade in Android and cross-platform iOS using Kotlin Multiplatform, building medical-grade wearables at Empatica.',
    canonical: `${CANON}/`,
    ogType: 'profile',
    ogImage: OG_IMAGE,
    jsonLd: [personLd()],
  }));
  fs.writeFileSync(path.join(RES, 'molo17.html'), pageShell(molo17Body, {
    titleText: `${s.name} - MOLO17 project history`,
    description: `${s.name}: full MOLO17 project history.`,
    canonical: `${CANON}/molo17.html`,
    ogImage: OG_IMAGE,
  }));
  console.log('Built résumé → dist/resume/ (index.html + molo17.html)');
}
