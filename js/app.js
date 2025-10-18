/*
  app.js — Beige Book Explorer
  Minimal vanilla JS som pratar med Open Librarys sök-API.
  Fixar: JSDoc-typer, säkra parseInt, lugn linter.
*/

/**
 * @typedef {Object} SearchState
 * @property {string} q
 * @property {string} yearMin
 * @property {string} yearMax
 * @property {'relevance'|'new'|'old'} sort
 * @property {number} page
 * @property {number} numFound
 */

/**
 * @typedef {Object} OpenDoc
 * @property {string=} title
 * @property {string[]=} author_name
 * @property {number=} first_publish_year
 * @property {string[]=} subject
 * @property {number=} cover_i
 * @property {string=} key
 * @property {number[]=} publish_year
 * @property {number[]=} covers
 */

const els = {
  form: document.getElementById('search-form'),
  q: document.getElementById('q'),
  yearMin: document.getElementById('yearMin'),
  yearMax: document.getElementById('yearMax'),
  sort: document.getElementById('sort'),
  clearBtn: document.getElementById('clearBtn'),
  grid: document.getElementById('grid'),
  stats: document.getElementById('stats'),
  pager: document.getElementById('pager'),
  prev: document.getElementById('prev'),
  next: document.getElementById('next'),
  pageLabel: document.getElementById('pageLabel'),
  recent: document.getElementById('recent'),
  tpl: document.getElementById('card-tpl'),
};

/** @type {SearchState} */
let state = {
  q: '',
  yearMin: '',
  yearMax: '',
  sort: 'relevance',   // relevance | new | old
  page: 1,             // Open Library page-param
  numFound: 0,
};

const RECENT_KEY = 'bbe_recent_queries_v1';

// AbortController så vi kan avbryta pågående fetch (race conditions)
let currentAbort = null;

/* ----------------------------- helpers ----------------------------- */

function saveRecent(query) {
  const q = (query || '').trim();
  if (!q) return;
  const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  const next = [q, ...list.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  renderRecent(next);
}

function loadRecent() {
  const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  renderRecent(list);
}

function renderRecent(list) {
  els.recent.innerHTML = '';
  list.forEach((q) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = q;
    b.addEventListener('click', () => {
      els.q.value = q;
      state.page = 1;
      doSearch();
    });
    els.recent.appendChild(b);
  });
}

// Bygg URL till Open Library
function buildUrl(params) {
  const url = new URL('https://openlibrary.org/search.json');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  return url.toString();
}

function readStateFromUI() {
  state.q = els.q.value;
  state.yearMin = els.yearMin.value;
  state.yearMax = els.yearMax.value;
  state.sort = els.sort.value;
}

// Debounce = vänta lite medan man skriver så vi inte spammar API:t
function debounce(fn, ms = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ----------------------------- fetch & render ----------------------------- */

async function fetchBooks() {
  // Avbryt ev. gammal förfrågan (om man klickar snabbt)
  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  const query = (state.q || '').trim();
  const url = buildUrl({
    q: query || 'bestseller',
    page: state.page,
    limit: 20,
  });

  // Visa skelettkort (känns snabbare och premium)
  showSkeletons(12);

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: currentAbort.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();

    /** @type {OpenDoc[]} */
    let docs = data.docs || [];

    // Client-side filter på år (enkelt men funkar)
    if (state.yearMin || state.yearMax) {
      const min = parseInt(String(state.yearMin || ''), 10) || 0;
      const max = parseInt(String(state.yearMax || ''), 10) || 9999;
      docs = docs.filter((d) => {
        const y = d.first_publish_year || (Array.isArray(d.publish_year) ? d.publish_year[0] : 0) || 0;
        return y >= min && y <= max;
      });
    }

    // Sortering: relevance = låt API:ts ordning vara; annars sortera år
    if (state.sort === 'new') {
      docs.sort((a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
    } else if (state.sort === 'old') {
      docs.sort((a, b) => (a.first_publish_year || 0) - (b.first_publish_year || 0));
    }

    state.numFound = data.numFound || docs.length;

    renderStats(state.numFound, query);
    renderGrid(docs);
    renderPager(data);
  } catch (err) {
    if (err.name === 'AbortError') return; // normalt, vi avbröt bara
    console.error(err);
    els.grid.innerHTML = `<p style="color:#8a5b4a">Kunde inte hämta böcker just nu. Testa igen strax.</p>`;
    els.pager.classList.add('hidden');
  }
}

function showSkeletons(n = 10) {
  els.grid.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const card = els.tpl.content.firstElementChild.cloneNode(true);
    // låt .skeleton vara kvar, ingen riktig bild-src än (placeholder finns)
    card.querySelector('.title').textContent = ' ';
    card.querySelector('.meta').textContent = ' ';
    els.grid.appendChild(card);
  }
}

function renderStats(total, q) {
  const suffix = q ? ` för "${q}"` : '';
  els.stats.textContent = total ? `${total.toLocaleString('sv-SE')} träffar${suffix}` : '';
}

function coverUrl(doc) {
  // Open Library cover-service
  const id = doc.cover_i || (Array.isArray(doc.covers) && doc.covers[0]);
  return id ? `https://covers.openlibrary.org/b/id/${id}-M.jpg` : '';
}

function renderGrid(docs) {
  els.grid.innerHTML = '';
  if (!docs.length) {
    els.grid.innerHTML = `<p>Inga träffar. Testa ett annat sökord ✨</p>`;
    return;
  }

  docs.forEach((d) => {
    const card = els.tpl.content.firstElementChild.cloneNode(true);

    // Titel
    card.querySelector('.title').textContent = d.title || 'Okänd titel';

    // Författare + år
    const authors = (d.author_name || []).slice(0, 2).join(', ');
    const year = d.first_publish_year ? ` • ${d.first_publish_year}` : '';
    card.querySelector('.meta').textContent = [authors, year].filter(Boolean).join('');

    // Omslag
    const img = card.querySelector('img');
    const cu = coverUrl(d);
    if (cu) {
      img.src = cu;
      img.alt = `Omslag till ${d.title || 'bok'}`;
      card.querySelector('.cover-wrap').classList.remove('skeleton');
    }

    // Chips (ämnen / tags)
    const chips = card.querySelector('.chips');
    (d.subject || []).slice(0, 4).forEach((s) => {
      const c = document.createElement('span');
      c.className = 'chip';
      c.textContent = s;
      chips.appendChild(c);
    });

    // Länk ut
    const key = d.key; // ex: "/works/OL12345W"
    const out = card.querySelector('.out');
    out.href = key ? `https://openlibrary.org${key}` : '#';

    els.grid.appendChild(card);
  });
}

function renderPager(data) {
  // hasPrev: om vi är på sida > 1
  const hasPrev = state.page > 1;

  // hasNext: om (start + antal) < numFound
  const start = typeof data.start === 'number' ? data.start : (state.page - 1) * (data.docs?.length || 0);
  const shown = data.docs?.length || 0;
  const total = data.numFound || 0;
  const hasNext = start + shown < total;

  els.pager.classList.toggle('hidden', !(hasPrev || hasNext));
  els.prev.disabled = !hasPrev;
  els.next.disabled = !hasNext;
  els.pageLabel.textContent = `Sida ${state.page}`;
}

/* ----------------------------- events ----------------------------- */

els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  state.page = 1;
  doSearch();
});

els.q.addEventListener('input', debounce(() => {
  state.page = 1;
  doSearch();
}, 500));

['yearMin', 'yearMax', 'sort'].forEach((id) => {
  els[id].addEventListener('change', () => {
    state.page = 1;
    doSearch();
  });
});

els.prev.addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    fetchBooks();
  }
});

els.next.addEventListener('click', () => {
  state.page += 1;
  fetchBooks();
});

els.clearBtn.addEventListener('click', () => {
  els.q.value = '';
  els.yearMin.value = '';
  els.yearMax.value = '';
  els.sort.value = 'relevance';
  state.page = 1;
  doSearch();
});

/* ----------------------------- boot ----------------------------- */

function doSearch() {
  readStateFromUI();
  saveRecent(state.q);
  fetchBooks();
}

// Ladda senaste sökningar och gör en första query
loadRecent();
state.q = 'cozy fantasy'; // liten “vibe”-default
els.q.value = state.q;
fetchBooks();
