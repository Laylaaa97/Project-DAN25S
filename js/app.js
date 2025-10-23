/* helpers */
// Små hjälpmetoder som kör överallt

function qs(sel, el = document) { return el.querySelector(sel); }
function qsa(sel, el = document) { return [...el.querySelectorAll(sel)]; }
function el(tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; }

const els = {
  form: qs('#search-form'),
  q: qs('#q'),
  yearMin: qs('#yearMin'),
  yearMax: qs('#yearMax'),
  sort: qs('#sort'),
  grid: qs('#grid'),
  stats: qs('#stats'),
  recent: qs('#recent'),
  pager: qs('#pager'),
  prev: qs('#prev'),
  next: qs('#next'),
  pageLabel: qs('#pageLabel'),
  tpl: qs('#card-tpl')
};

const state = {
  page: 1,
  q: '',
  yearMin: '',
  yearMax: '',
  sort: 'relevance',
  hits: 0,
  numFound: 0,
  lastAbort: null
};

/* Open Library API */
// Tiny wrapper för att hämta

const BASE = 'https://openlibrary.org/search.json';

function buildQuery() {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.yearMin) params.set('first_publish_year>=', state.yearMin);
  if (state.yearMax) params.set('first_publish_year<=', state.yearMax);

  params.set('page', String(state.page));
  return `${BASE}?${params.toString()}`;
}

function coverUrl(d) {
  if (d.cover_i) return `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`;
  return '';
}

/* Fallback bild */

function initials(text) {
  const t = (text || '').trim();
  if (!t) return '📚';
  const words = t.split(/\s+/).slice(0, 2);
  const letters = words.map(w => w[0]).join('').toUpperCase();
  return letters || '📚';
}

function placeholderDataURI(title) {
  const label = initials(title);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#f4ece4'/>
        <stop offset='100%' stop-color='#eadfd5'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle'
          font-family='Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
          font-size='110' fill='#a08874'>${label}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function setImageWithFallback(imgEl, src, title) {
  const fallback = placeholderDataURI(title);
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = fallback;
  };
  imgEl.src = src || fallback;
}

/* recent searches */

const RECENT_KEY = 'bb.recent';
function saveRecent(q) {
  if (!q) return;
  const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  const next = [q, ...list.filter(x => x !== q)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}
function renderRecent() {
  const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  els.recent.innerHTML = list.map(q => `<button class="btn" data-recent="${q}">${q}</button>`).join('');
}

function renderStats() {
  if (state.numFound === 0) {
    els.stats.textContent = 'Inga träffar (än). Testa en annan sökning.';
    return;
  }
  els.stats.textContent = `Visar ${state.hits} av ca ${state.numFound} träffar — sida ${state.page}`;
}

function renderGrid(docs) {
  const frag = document.createDocumentFragment();
  for (const d of docs) {
    const node = els.tpl.content.cloneNode(true);
    const card = node.querySelector('.card');

    // Titel + meta
    const title = d.title || 'Okänd titel';
    const authors = (d.author_name || []).join(', ');
    const year = d.first_publish_year || '';
    card.querySelector('.title').textContent = title;
    card.querySelector('.meta').textContent = [authors, year].filter(Boolean).join(' • ');

    const chips = card.querySelector('.chips');
    (d.language || []).slice(0, 3).forEach(lang => {
      const c = el('span', 'chip'); c.textContent = lang.toUpperCase(); chips.appendChild(c);
    });

    // Länk ut
    const key = d.key || '';
    const out = card.querySelector('.out');
    out.href = key ? `https://openlibrary.org${key}` : '#';

    // Omslag
    const img = card.querySelector('img');
    const cu = coverUrl(d);
    setImageWithFallback(img, cu, d.title || 'Bok');
    const wrap = card.querySelector('.cover-wrap');
    if (wrap) wrap.classList.remove('skeleton');

    frag.appendChild(node);
  }
  els.grid.innerHTML = '';
  els.grid.appendChild(frag);
}

function renderPager(hasMore) {
  els.pager.classList.toggle('hidden', state.numFound <= 0);
  els.prev.disabled = state.page <= 1;
  els.next.disabled = !hasMore;
  els.pageLabel.textContent = `Sida ${state.page}`;
}

/* fetch + search */

async function search() {
  // Avbryt tidigare request om man spammar sök
  if (state.lastAbort) state.lastAbort.abort();
  const ctrl = new AbortController();
  state.lastAbort = ctrl;

  els.stats.textContent = 'Söker...';
  els.grid.innerHTML = '';

  try {
    const res = await fetch(buildQuery(), { signal: ctrl.signal });
    if (!res.ok) {
      els.grid.innerHTML = `<p style="color:#8a5b4a">Kunde inte hämta böcker just nu. Kontrollera din internetanslutning och försök igen.</p>`;
      els.stats.textContent = '';
      return;
    }
    const data = await res.json();

    const docs = data.docs || [];
    state.numFound = data.numFound || docs.length;
    state.hits = docs.length;

    if (state.sort === 'new') docs.sort((a,b) => (b.first_publish_year||0) - (a.first_publish_year||0));
    if (state.sort === 'old') docs.sort((a,b) => (a.first_publish_year||0) - (b.first_publish_year||0));

    renderStats();
    renderGrid(docs);
    renderPager(Boolean(data.numFound > state.page * 100)); // OL returnerar 100 per sida
  } catch (err) {
    if (err.name === 'AbortError') return;
    els.grid.innerHTML = `<p style="color:#8a5b4a">Kunde inte hämta böcker just nu. Kontrollera din internetanslutning och försök igen.</p>`;
    els.stats.textContent = '';
  }
}

/* events */

els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  state.q = els.q.value.trim();
  state.yearMin = els.yearMin.value.trim();
  state.yearMax = els.yearMax.value.trim();
  state.sort = els.sort.value;
  state.page = 1;
  saveRecent(state.q);
  search();
});

els.clearBtn?.addEventListener('click', () => {
  // Rensa knapp för att snabbt börja om
  els.q.value = '';
  els.yearMin.value = '';
  els.yearMax.value = '';
  els.sort.value = 'relevance';
  state.q = '';
  state.yearMin = '';
  state.yearMax = '';
  state.sort = 'relevance';
  state.page = 1;
  els.grid.innerHTML = '';
  els.stats.textContent = '';
  renderRecent();
  els.q.focus();
});

// Klick på senaste sökningar
els.recent.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-recent]');
  if (!btn) return;
  els.q.value = btn.dataset.recent;
  els.form.requestSubmit();
});

els.prev.addEventListener('click', () => { if (state.page > 1) { state.page--; search(); } });
els.next.addEventListener('click', () => { state.page++; search(); });

// Ladda upp senaste sökningar direkt
renderRecent();

state.q = 'harry potter';
search();
