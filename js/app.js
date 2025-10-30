
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const form = $('#search-form');
const qInput = $('#q');
const yearMinInput = $('#yearMin');
const yearMaxInput = $('#yearMax');
const langSelect = $('#language');
const sortSelect = $('#sort');
const onlyEbooks = $('#onlyEbooks');
const onlyCovers = $('#onlyCovers');

const grid = $('#grid');
const statsEl = $('#stats');
const pager = $('#pager');
const prevBtn = $('#prev');
const nextBtn = $('#next');
const pageLabel = $('#pageLabel');
const recentEl = $('#recent');

const cardTpl = $('#card-tpl');

const STATE = {
  page: 1,
  pageSize: 20,
  lastQuery: '',
  lastResponseTotal: 0,
  docs: [],
};

// Helpers
function saveRecent(term) {
  if (!term) return;
  const key = 'bbe_recent';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const next = [term, ...list.filter(x => x.toLowerCase() !== term.toLowerCase())].slice(0, 6);
  localStorage.setItem(key, JSON.stringify(next));
  renderRecent();
}

function renderRecent() {
  const key = 'bbe_recent';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  if (!list.length) { recentEl.innerHTML = ''; return; }
  recentEl.innerHTML = `
    <div class="recent-wrap">
      <span>Senaste:</span>
      ${list.map(t => `<button type="button" class="chip chip--light" data-recent="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('')}
    </div>`;
  $$('#recent [data-recent]').forEach(btn => {
    btn.addEventListener('click', () => {
      qInput.value = btn.dataset.recent || '';
      STATE.page = 1;
      runSearch();
    });
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function getCoverUrl(doc, size = 'M') {
  if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-${size}.jpg`;
  const title = (doc.title || 'Bok').trim();
  const initials = title.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 600;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#efe8df';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // titel/initialer
  ctx.fillStyle = '#2f2a26';
  ctx.font = 'bold 160px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials || '∎', canvas.width/2, canvas.height/2);

  // liten label
  ctx.font = '24px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
  ctx.fillStyle = '#6f655c';
  ctx.fillText('Beige Book', canvas.width/2, canvas.height - 40);

  return canvas.toDataURL('image/png');
}

function docToMeta(doc) {
  const authors = (doc.author_name || []).join(', ');
  const year = doc.first_publish_year ? `• ${doc.first_publish_year}` : '';
  return [authors, year].filter(Boolean).join(' ');
}

function buildWorkUrl(doc) {
  if (doc.key) return `https://openlibrary.org${doc.key}`;
  if (doc.edition_key && doc.edition_key.length) {
    return `https://openlibrary.org/books/${doc.edition_key[0]}`;
  }
  return 'https://openlibrary.org/';
}

function applyClientFilters(docs) {
  let arr = [...docs];

  // Tidsintervall
  const yMin = parseInt(yearMinInput.value, 10);
  const yMax = parseInt(yearMaxInput.value, 10);
  if (!Number.isNaN(yMin)) arr = arr.filter(d => !d.first_publish_year || d.first_publish_year >= yMin);
  if (!Number.isNaN(yMax)) arr = arr.filter(d => !d.first_publish_year || d.first_publish_year <= yMax);

  // Språk
  const lang = langSelect.value;
  if (lang) {
    arr = arr.filter(d => (d.language || []).includes(lang));
  }

  // Bara e-böcker
  if (onlyEbooks.checked) {
    arr = arr.filter(d => d.has_fulltext === true || d.ebook_access === 'public');
  }

  if (onlyCovers.checked) {
    arr = arr.filter(d => !!d.cover_i);
  }

  // Sortering
  const s = sortSelect.value;
  if (s === 'new') {
    arr.sort((a,b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
  } else if (s === 'old') {
    arr.sort((a,b) => (a.first_publish_year || 0) - (b.first_publish_year || 0));
  }
  return arr;
}

function render(docs) {
  grid.innerHTML = '';
  const frag = document.createDocumentFragment();

  if (!docs.length) {
    statsEl.textContent = 'Inga titlar matchade din filtrering.';
    pager.classList.add('hidden');
    return;
  }

  docs.forEach(doc => {
    const node = cardTpl.content.firstElementChild.cloneNode(true);

    const coverWrap = $('.cover-wrap', node);
    const img = $('img', coverWrap);
    const titleEl = $('.title', node);
    const metaEl = $('.meta', node);
    const chipsEl = $('.chips', node);
    const out = $('.out', node);

    const cover = getCoverUrl(doc);
    img.alt = doc.title || '';
    img.src = cover;
    img.onload = () => coverWrap.classList.remove('skeleton');

    titleEl.textContent = doc.title || 'Okänd titel';
    metaEl.textContent = docToMeta(doc);
    chipsEl.innerHTML = (doc.subject_facet || []).slice(0, 5).map(s => `<span class="chip">${escapeHtml(s)}</span>`).join('');
    out.href = buildWorkUrl(doc);

    frag.appendChild(node);
  });

  grid.appendChild(frag);
}

function updateStats(totalFound, showingCount) {
  const q = STATE.lastQuery ? `Resultat för “${STATE.lastQuery}”` : 'Resultat';
  statsEl.textContent = `${q} — visar ${showingCount} av ${totalFound.toLocaleString()} titlar`;
}

function updatePager() {
  pageLabel.textContent = `Sida ${STATE.page}`;
  prevBtn.disabled = STATE.page <= 1;
  nextBtn.disabled = STATE.docs.length < STATE.pageSize;
  pager.classList.remove('hidden');
}

// API
async function fetchPage() {
  const base = 'https://openlibrary.org/search.json';
  const params = new URLSearchParams();
  const q = qInput.value.trim();
  if (q) params.set('q', q);
  params.set('fields', [
    'key',
    'title',
    'author_name',
    'first_publish_year',
    'cover_i',
    'language',
    'has_fulltext',
    'ebook_access',
    'edition_key',
    'subject_facet'
  ].join(','));
  params.set('page', String(STATE.page));
  params.set('limit', String(STATE.pageSize));

  const url = `${base}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nätverksfel: ${res.status}`);
  return res.json();
}

async function runSearch() {
  try {
    grid.innerHTML = '';
    statsEl.textContent = 'Hämtar…';
    pager.classList.add('hidden');

    const data = await fetchPage();
    STATE.lastResponseTotal = data.numFound ?? 0;
    STATE.docs = Array.isArray(data.docs) ? data.docs : [];

    const filtered = applyClientFilters(STATE.docs);
    render(filtered);
    updateStats(STATE.lastResponseTotal, filtered.length);
    updatePager();

    // Spara senaste sökningen
    if (qInput.value.trim()) saveRecent(qInput.value.trim());
  } catch (err) {
    console.error(err);
    statsEl.textContent = 'Något gick fel när vi hämtade böcker. Kolla din uppkoppling och försök igen.';
    pager.classList.add('hidden');
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  STATE.page = 1;
  STATE.lastQuery = qInput.value.trim();
  runSearch();
});

$('#clearBtn').addEventListener('click', () => {
  qInput.value = '';
  yearMinInput.value = '';
  yearMaxInput.value = '';
  langSelect.value = '';
  sortSelect.value = 'relevance';
  onlyEbooks.checked = false;
  onlyCovers.checked = false;
  grid.innerHTML = '';
  statsEl.textContent = '';
  pager.classList.add('hidden');
});

prevBtn.addEventListener('click', () => {
  if (STATE.page > 1) {
    STATE.page--;
    runSearch();
  }
});

nextBtn.addEventListener('click', () => {
  STATE.page++;
  runSearch();
});

// Kategori
$('#categories').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-subject]');
  if (!btn) return;
  const term = btn.dataset.subject;
  qInput.value = term;
  STATE.page = 1;
  STATE.lastQuery = term;
  runSearch();
});

renderRecent();
