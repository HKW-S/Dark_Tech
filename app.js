/* Dev log engine — reads posts/posts.json, loads each .md file, renders the page. */

const POSTS_DIR = 'posts/';

/* Tag colours — edit freely. Keys are lowercase tag names.
   Colours: lime, magenta, cyan, lavender. Unlisted tags get a colour picked from their name. */
const TAG_COLOURS = {
  unity: 'cyan', gameplay: 'cyan', 'c#': 'cyan', unreal: 'cyan',
  blender: 'magenta', '3d': 'magenta', art: 'magenta', modeling: 'magenta',
  tools: 'lime', python: 'lime', site: 'lime', web: 'lime',
  meta: 'lavender', ai: 'lavender', school: 'lavender',
};

/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n, w = 2) => String(n).padStart(w, '0');
const slugify = (s) => s.toLowerCase().replace(/\.md$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function hash(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* Barcode that's unique (and stable) per post */
function barcode(el, seed) {
  let h = hash(seed);
  let html = '';
  for (let i = 0; i < 38; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const w = 1 + (h % 3);
    const gap = 1 + ((h >>> 4) % 3);
    html += `<i style="width:${w}px;margin-right:${gap}px"></i>`;
  }
  el.innerHTML = html;
}

/* Front matter:  ---\nkey: value\n---  at the top of a .md file */
function parseFrontMatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: text.slice(m[0].length) };
}

const CHIP_SET = ['lime', 'magenta', 'cyan', 'lavender', 'orange'];
function tagChip(tag) {
  const key = tag.trim().toLowerCase();
  const colour = TAG_COLOURS[key] || CHIP_SET[hash(key) % CHIP_SET.length];
  return `<span class="chip c-${colour}">${esc(tag.trim())}</span>`;
}
const tagList = (m) => (m.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

const fmtDate = (d) => (d ? d.replace(/-/g, '.') : '----.--.--');

/* ---------- markdown setup ---------- */
let figCount = 0;

function youtubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

marked.use({
  gfm: true,
  renderer: {
    // ```lang code blocks get a label bar + copy button + highlighting
    code(code, lang) {
      const language = (lang || '').split(/\s/)[0];
      let html;
      try {
        html = language && hljs.getLanguage(language)
          ? hljs.highlight(code, { language }).value
          : hljs.highlightAuto(code).value;
      } catch { html = esc(code); }
      return `<div class="codeblock"><div class="codebar"><span>${esc(language || 'code')}</span><button type="button" data-copy>Copy</button></div><pre><code class="hljs">${html}</code></pre></div>`;
    },
    // ![caption](file) handles images, gifs, videos and YouTube links
    image(href, title, text) {
      figCount++;
      const cap = text || title || '';
      const label = `Fig.${pad(figCount)}`;
      const file = href.split('/').pop();
      let media;
      const yt = youtubeId(href);
      if (yt) {
        media = `<iframe class="yt" src="https://www.youtube-nocookie.com/embed/${yt}" title="${esc(cap || 'YouTube video')}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      } else if (/\.(mp4|webm|mov)(\?|$)/i.test(href)) {
        // Add "loop" to the caption title to make it autoplay muted like a gif:  ![Spray test](media/clip.mp4 "loop")
        const loop = /loop/i.test(title || '');
        media = loop
          ? `<video src="${esc(href)}" autoplay muted loop playsinline></video>`
          : `<video src="${esc(href)}" controls preload="metadata" playsinline></video>`;
      } else {
        media = `<img src="${esc(href)}" alt="${esc(cap)}" loading="lazy">`;
      }
      const capText = cap && !/^loop$/i.test(cap) ? cap : file;
      return `<figure class="fig"><div class="frame">${media}</div><figcaption><b>${label}</b><span>${esc(capText)}</span></figcaption></figure>`;
    },
  },
});

/* ---------- render ---------- */
const EMBED = window.DEVLOG_EMBED || null;
const getText = (file) => (EMBED ? Promise.resolve(EMBED[file]) : fetch(POSTS_DIR + file, { cache: 'no-cache' }).then((r) => r.text()));

async function load() {
  const list = JSON.parse(await getText('posts.json'));

  const posts = await Promise.all(list.map(async (file) => {
    const raw = await getText(file);
    const { meta, body } = parseFrontMatter(raw);
    return { file, slug: slugify(file), meta, body };
  }));

  // Oldest first: Log 01 at the top, newest at the bottom. The hero still shows the newest.
  posts.sort((a, b) => (a.meta.date || '').localeCompare(b.meta.date || ''));
  posts.forEach((p, i) => (p.num = i + 1));

  renderHero(posts[posts.length - 1]);
  renderIndex(posts);
  renderEntries(posts);
  renderTicker(posts);
  setupRuler();
  setupReveal();
  setupCopy();
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
}

function titleHTML(meta) {
  const title = meta.title || 'Untitled';
  const hl = meta.highlight;
  if (hl && title.includes(hl)) return esc(title).replace(esc(hl), `<span class="hl">${esc(hl)}</span>`);
  const words = title.split(' ');
  if (words.length < 3) return `<span class="hl">${esc(title)}</span>`;
  const tail = words.splice(-2).join(' ');
  return `${esc(words.join(' '))} <span class="hl">${esc(tail)}</span>`;
}

function renderHero(p) {
  if (!p) {
    $('.hero-visual').dataset.num = '00';
    $('#hero-title').innerHTML = 'No entries <span class="hl">yet</span>';
    $('#hero-meta').innerHTML = '<dt>Status</dt><dd>Standby</dd>';
    barcode($('#hero-barcode'), 'standby');
    $('#hero-id').textContent = '0000-STANDBY';
    return;
  }
  const m = p.meta;
  $('.hero-visual').dataset.num = pad(p.num);
  if (m.cover) $('.hero-visual').style.backgroundImage = `url("${m.cover}")`;
  const t = $('#hero-title');
  t.innerHTML = titleHTML(m);
  t.href = `#${p.slug}`;
  const rows = [
    ['Log', pad(p.num)],
    ['Type', m.type || (m.tags || '').split(',')[0] || '—'],
    ['Tools', m.tools || '—'],
    ['Status', m.status ? `<span class="tag-live">${esc(m.status)}</span>` : '—'],
    ['Date', fmtDate(m.date)],
  ];
  $('#hero-meta').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${k === 'Status' ? v : esc(v)}</dd>`).join('');
  barcode($('#hero-barcode'), p.slug);
  const code = slugify(m.title || p.slug).split('-').filter((w) => w.length > 2).slice(0, 2).map((w) => w.slice(0, 4)).join('-');
  $('#hero-id').textContent = `${pad(p.num, 4)}-${code.toUpperCase()}`;
}

function renderIndex(posts) {
  $('#count').textContent = `${pad(posts.length)} entries`;
  $('#rows').innerHTML = posts.map((p) => `
    <li><a href="#${p.slug}">
      <span class="n">${pad(p.num)}</span>
      <span class="t">${esc(p.meta.title || p.file)}</span>
      <span class="tg">${tagList(p.meta)[0] ? tagChip(tagList(p.meta)[0]) : ''}</span>
      <span class="d">${fmtDate(p.meta.date)}</span>
    </a></li>`).join('');
}

function renderEntries(posts) {
  if (!posts.length) {
    $('#entries').innerHTML = `<article class="entry"><div class="entry-head"><span class="lognum">Log 00</span><span>Awaiting first entry</span></div><div class="entry-body"><p>Nothing logged yet. Copy <code>posts/_template.md</code>, then add its file name to <code>posts/posts.json</code>.</p></div></article>`;
    return;
  }
  $('#entries').innerHTML = posts.map((p) => {
    figCount = 0; // figures number per post
    const m = p.meta;
    const tags = tagList(m).map(tagChip).join('');
    // If the markdown has no # heading, use the front-matter title
    const body = /^\s*# /m.test(p.body) ? p.body : `# ${m.title || ''}\n\n${p.body}`;
    return `
      <article class="entry reveal" id="${p.slug}">
        <div class="entry-head">
          <span class="lognum">Log ${pad(p.num)}</span>
          <span class="chips">${tags}</span>
          <span>${fmtDate(m.date)}${m.read ? ' · ' + esc(m.read) : ''}</span>
        </div>
        <div class="entry-body">${marked.parse(body)}</div>
      </article>`;
  }).map((html, i, all) => (i < all.length - 1
      ? html + `<div class="halftone c-${['magenta', 'cyan', 'lime'][i % 3]}" aria-hidden="true"></div>`
      : html)).join('');
}

/* Ticker: your entries, newest first, repeated twice so the loop is seamless */
function renderTicker(posts) {
  const items = [...posts].reverse().map((p) =>
    `<span><b>&gt;&gt;</b> Log ${pad(p.num)} // ${esc(p.meta.title || p.file)} // ${fmtDate(p.meta.date)}${p.meta.status ? ' // ' + esc(p.meta.status) : ''}</span>`);
  items.push(`<span><b>&gt;&gt;</b> ${pad(posts.length)} entries on file // Exodus dev log</span>`);
  // repeat until the strip is wide enough, then double it for the loop
  let row = items.join('');
  while (items.length && row.length < 1600) row += items.join('');
  $('#ticker').innerHTML = row + row;
}

/* Ruler: a number every 100px down the whole page, plus a marker at your scroll position */
function setupRuler() {
  const ruler = $('#ruler');
  if (!ruler) return;
  const here = document.createElement('i');
  here.className = 'here';
  const draw = () => {
    const h = document.documentElement.scrollHeight;
    ruler.style.height = h + 'px';
    let html = '';
    for (let y = 100; y < h; y += 100) html += `<span style="top:${y + 2}px">${pad(y, 5)}</span>`;
    ruler.innerHTML = html;
    ruler.appendChild(here);
    move();
  };
  const move = () => { here.style.top = (scrollY + innerHeight / 2 - 5) + 'px'; };
  addEventListener('scroll', move, { passive: true });
  addEventListener('resize', draw);
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(document.body);
  draw();
}

/* ---------- interaction ---------- */
function setupReveal() {
  const els = document.querySelectorAll('.reveal, .rows li');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => {
    if (e.getBoundingClientRect().top < innerHeight) { e.classList.remove('reveal'); return; }
    e.classList.add('reveal'); io.observe(e);
  });
}

function setupCopy() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const code = btn.closest('.codeblock').querySelector('code').innerText;
    try { await navigator.clipboard.writeText(code); btn.textContent = 'Copied'; }
    catch { btn.textContent = 'Select + copy'; }
    setTimeout(() => (btn.textContent = 'Copy'), 1400);
  });
}

/* Top-bar coordinates follow the mouse and scroll position */
(function coords() {
  const cx = $('#cx'), cy = $('#cy'), sector = $('#sector');
  const update = (x) => {
    cy.textContent = pad(Math.round(window.scrollY / 10) % 1000, 3);
    if (x !== undefined) cx.textContent = pad(Math.round(x / 2) % 1000, 3);
    const max = document.documentElement.scrollHeight - innerHeight;
    sector.textContent = pad(max > 0 ? Math.round((scrollY / max) * 99) : 0);
  };
  addEventListener('scroll', () => update(), { passive: true });
  addEventListener('mousemove', (e) => update(e.clientX), { passive: true });
  update(0);
})();

/* Mouse-selection colour: each new selection gets the next colour in this list. */
const HIGHLIGHTS = ['#D4FF00', '#00E0FF', '#FF2D6F']; // lime, cyan, magenta
(function cycleSelection() {
  let i = 0, pending = false;
  // Each mouse/touch press that goes on to select text moves to the next colour
  document.addEventListener('pointerdown', () => { pending = true; });
  document.addEventListener('selectionchange', () => {
    if (!pending) return;
    const sel = document.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim() !== '') {
      pending = false;
      i = (i + 1) % HIGHLIGHTS.length;
      document.documentElement.style.setProperty('--hl', HIGHLIGHTS[i]);
    }
  });
})();

barcode($('#foot-barcode'), 'exodus-devlog');

function start() {
  load().catch((err) => {
    console.error(err);
    $('#hero-title').textContent = 'Could not load posts';
    $('#entries').innerHTML = `<p class="entry" style="padding:18px">Couldn't load <code>posts/posts.json</code>. If you opened index.html straight from your disk, run a local server instead (see README).</p>`;
  });
}

/* ---------- password lock ----------
   A simple visitor gate, NOT real security: the files in posts/ and media/ can still
   be opened directly by anyone who knows their address.
   To change the password: open the site, press F12 → Console, run
     await devlogHash('your new password')
   and paste the result below. */
const PASSWORD_HASH = 'd67ad956daac3bfc3231c22826291964de0721715ae6395a292b28d1bc71d977';

async function devlogHash(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
window.devlogHash = devlogHash;

function unlock() {
  document.body.classList.remove('locked');
  $('#lock').remove();
  start();
}

(function gate() {
  if (sessionStorage.getItem('devlog-unlocked') === PASSWORD_HASH) { unlock(); return; }
  const form = $('#lock-form'), input = $('#lock-input'), msg = $('#lock-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (await devlogHash(input.value) === PASSWORD_HASH) {
      sessionStorage.setItem('devlog-unlocked', PASSWORD_HASH); // stays unlocked until the tab is closed
      unlock();
    } else {
      msg.textContent = 'Access denied // wrong password';
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      input.select();
    }
  });
})();
