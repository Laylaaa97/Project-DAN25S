
/*
  Slutprojekt — Beige Book Explorer
  Enkel bok-sökare. Man skriver ett sökord, väljer lite filter,
  och så hämtar vi böcker från Open Library APi.
*/

/* Här samlar vi alla element från HTML så vi slipper leta varje gång */
const els = {
  form: document.getElementById('search-form'),
  q: document.getElementById('q'),
  yearMin: document.getElementById('yearMin'),
  yearMax: document.getElementById('yearMax'),
  language: document.getElementById('language'), // "sveng" (båda), "swe", "eng"
  sort: document.getElementById('sort'),         // relevans / nyast / äldst
  onlyEbooks: document.getElementById('onlyEbooks'),
  onlyCovers: document.getElementById('onlyCovers'),
  categories: document.getElementById('categories'), // 3 chips: Romance, Fantasy, Sci-Fi

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

/* Appens läge (state). Tänk som “miniräknare” över vad användaren valt */
let state = {
  q: '',
  yearMin: '',
  yearMax: '',
  language: 'sveng',     // default = visa både svenska + engelska
  onlyEbooks: false,
  onlyCovers: false,
  cats: [],              // valda kategorier (max 3 chips)
  sort: 'relevance',
  page: 1,
  numFound: 0,           // hur många resultat som finns (vi begränsar till 900)
};

const RECENT_KEY = 'bbe_recent_queries_v1';
const MAX_TOTAL = 900;
let currentAbort = null;  // används för att kunna avbryta en pågående fetch

/* Små hjälpare så koden blir lite lugnare att läsa ====== */

// Vänta lite när man skriver så vi inte bombar API:t
function debounce(fn, ms = 400) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// Spara/hämta “senaste sökningar” i webbläsaren (lokalt)
function saveRecent(query){
  const q=(query||'').trim();
  if(!q) return;
  const list=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');
  const next=[q, ...list.filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  renderRecent(next);
}
function loadRecent(){ renderRecent(JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')); }
function renderRecent(list){
  els.recent.innerHTML='';
  list.forEach((q)=>{
    const b=document.createElement('button');
    b.type='button';
    b.textContent=q;
    b.addEventListener('click', ()=>{ els.q.value=q; state.page=1; doSearch(); });
    els.recent.appendChild(b);
  });
}

// Bygger en snäll URL till Open Library utifrån våra parametrar
function buildUrl(params){
  const url=new URL('https://openlibrary.org/search.json');
  Object.entries(params).forEach(([k,v])=>{
    if(v!=='' && v!==undefined && v!==null) url.searchParams.set(k,v);
  });
  return url.toString();
}

// Läs in vad användaren har valt i formuläret
function readStateFromUI(){
  state.q = els.q.value;
  state.yearMin = els.yearMin.value;
  state.yearMax = els.yearMax.value;
  state.language = els.language.value;
  state.sort = els.sort.value;
  state.onlyEebooks = els.onlyEbooks.checked;
  state.onlyCovers = els.onlyCovers.checked;
}

// Hämta ev. omslags-URL från Open Library
function coverUrl(d){
  const id=d.cover_i || (Array.isArray(d.covers)&&d.covers[0]);
  return id ? `https://covers.openlibrary.org/b/id/${id}-M.jpg` : '';
}

// Om en bok saknar bild så visar vi två bokstäver från titeln
function getInitials(str){
  return String(str).split(' ').filter(Boolean).slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('');
}

// Gör strängar jämförbara (små bokstäver, ta bort bindestreck osv)
function norm(s){
  return String(s||'')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu,'')
    .replace(/[^a-z0-9]+/g,'');
}

// Små översättningar för kategorier
const CAT_MAP = {
  'romance':'romance',
  'fantasy':'fantasy',
  'sci-fi':'science fiction',
  'scifi':'science fiction',
  'science fiction':'science fiction',
};

function getYear(d, mode='max'){
  const fp=Number(d.first_publish_year)||0;
  const arr=Array.isArray(d.publish_year)? d.publish_year.filter(Number) : [];
  const pool=arr.length? arr.slice() : [];
  pool.push(fp);
  if(!pool.length) return 0;
  return mode==='min' ? Math.min(...pool) : Math.max(...pool);
}

/* Hämta och visa böcker */

async function fetchBooks(){
  // Om användaren söker igen snabbt → avbryt förra
  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  const query=(state.q||'').trim();
  const url=buildUrl({ q: query || 'bestseller', page: state.page, limit: 20 });

  showSkeletons(12);

  try{
    const res=await fetch(url,{ headers:{Accept:'application/json'}, signal: currentAbort.signal });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();

    let docs = data.docs || [];

    // Om vi har “scrollat” förbi vår 900-gräns så visar tomt
    const start = typeof data.start==='number' ? data.start : (state.page-1) * (data.docs?.length||0);
    if (start >= MAX_TOTAL) docs = [];

    // Visa bara svenska + engelska
    if (state.language === 'sveng') {
      docs = docs.filter(d => Array.isArray(d.language) && d.language.some(l => l === 'swe' || l === 'eng'));
    } else {
      docs = docs.filter(d => Array.isArray(d.language) && d.language.includes(state.language));
    }

    // Års filter (om man fyllt i)
    if (state.yearMin || state.yearMax) {
      const min = parseInt(String(state.yearMin||''),10) || 0;
      const max = parseInt(String(state.yearMax||''),10) || 9999;
      docs = docs.filter(d => {
        const y = d.first_publish_year || (Array.isArray(d.publish_year)? d.publish_year[0] : 0) || 0;
        return y >= min && y <= max;
      });
    }

    if (state.onlyEebooks) docs = docs.filter(d => (d.ebook_count_i && d.ebook_count_i>0) || d.has_fulltext===true);
    if (state.onlyCovers) docs = docs.filter(d => !!(d.cover_i || (Array.isArray(d.covers) && d.covers[0])));

    // Våra 3 kategorier
    if (state.cats.length){
      const wanted = state.cats
        .map(c => (CAT_MAP[c.toLowerCase()] || c).toLowerCase())
        .map(norm);

      docs = docs.filter(d => {
        const titleN = norm(d.title);
        const subjN = (d.subject || []).map(norm);
        return wanted.some(w =>
          titleN.includes(w) ||
          subjN.some(s => s.includes(w) || s.includes(`${w}fiction`))
        );
      });
    }

    // Sortera om man valt “Nyast/Äldst”
    if (state.sort==='new') docs.sort((a,b)=> getYear(b,'max') - getYear(a,'max'));
    else if (state.sort==='old') docs.sort((a,b)=> getYear(a,'min') - getYear(b,'min'));

    // Berätta hur många träffar men cap på 900
    const reportedTotal = data.numFound || docs.length;
    state.numFound = Math.min(reportedTotal, MAX_TOTAL);

    renderStats(state.numFound, query);
    renderGrid(docs);
    renderPager(data);
  }catch(err){
    if (err.name === 'AbortError') return;
    console.error(err);
    els.grid.innerHTML = `<p style="color:#8a5b4a">Kunde inte hämta böcker just nu. Testa igen strax.</p>`;
    els.pager.classList.add('hidden');
  }
}

function showSkeletons(n=10){
  els.grid.innerHTML='';
  for (let i=0;i<n;i++){
    const card=els.tpl.content.firstElementChild.cloneNode(true);
    card.querySelector('.title').textContent=' ';
    card.querySelector('.meta').textContent=' ';
    els.grid.appendChild(card);
  }
}

function renderStats(total, q){
  const suffix = q ? ` för "${q}"` : '';
  const capNote = total === MAX_TOTAL ? ' (visar max 900)' : '';
  els.stats.textContent = total ? `${total.toLocaleString('sv-SE')} träffar${suffix}${capNote}` : '';
}

function renderGrid(docs){
  els.grid.innerHTML='';
  if(!docs.length){ els.grid.innerHTML=`<p>Inga träffar. Testa ett annat sökord ✨</p>`; return; }

  docs.forEach(d=>{
    const card=els.tpl.content.firstElementChild.cloneNode(true);

    const title=d.title || 'Okänd titel';
    card.querySelector('.title').textContent=title;

    const authors=(d.author_name||[]).slice(0,2).join(', ');
    const year=d.first_publish_year?` • ${d.first_publish_year}`:'';
    card.querySelector('.meta').textContent=[authors,year].filter(Boolean).join('');

    const wrap=card.querySelector('.cover-wrap');
    const img=card.querySelector('img');
    const cu=coverUrl(d);
    if(cu){
      img.src=cu;
      img.alt=`Omslag till ${title}`;
      wrap.classList.remove('skeleton');
    }else{
      if(img) img.remove();
      wrap.classList.remove('skeleton');
      wrap.innerHTML=`<span class="no-cover">${getInitials(title)}</span>`;
    }

    const chips=card.querySelector('.chips');
    (d.subject||[]).slice(0,4).forEach(s=>{
      const c=document.createElement('span');
      c.className='chip';
      c.textContent=s;
      chips.appendChild(c);
    });

    const key=d.key;
    const out=card.querySelector('.out');
    out.href = key ? `https://openlibrary.org${key}` : '#';

    els.grid.appendChild(card);
  });
}

// Hanterar Föregående/Nästa-knapparna
function renderPager(data){
  const hasPrev = state.page > 1;
  const start = typeof data.start==='number' ? data.start : (state.page-1) * (data.docs?.length||0);
  const shown = data.docs?.length || 0;
  const hasNext = (start + shown) < state.numFound; // viktigt: kolla mot vår 900-gräns

  els.pager.classList.toggle('hidden', !(hasPrev || hasNext));
  els.prev.disabled = !hasPrev;
  els.next.disabled = !hasNext;
  els.pageLabel.textContent = `Sida ${state.page}`;
}

/* Lyssna på klick och ändringar i formuläret */

els.form.addEventListener('submit', (e)=>{ e.preventDefault(); state.page=1; doSearch(); });
els.q.addEventListener('input', debounce(()=>{ state.page=1; doSearch(); }, 500));

['yearMin','yearMax','language','sort'].forEach(id=>{
  els[id].addEventListener('change', ()=>{ state.page=1; doSearch(); });
});
els.onlyEbooks.addEventListener('change', ()=>{ state.page=1; doSearch(); });
els.onlyCovers.addEventListener('change', ()=>{ state.page=1; doSearch(); });

// När man klickar på en kategori-chips (Romance / Fantasy / Sci-Fi)
if (els.categories){
  els.categories.addEventListener('click', (e)=>{
    const btn=e.target.closest('button.chip');
    if(!btn) return;

    btn.classList.toggle('is-active');

    const raw=(btn.dataset.subject||btn.textContent||'').trim();
    if(!raw) return;
    const key=raw.toLowerCase();
    const canon=(key==='sci-fi'||key==='scifi') ? 'science fiction' : key;

    if(btn.classList.contains('is-active')){
      if(!state.cats.includes(canon)) state.cats.push(canon);
    }else{
      state.cats = state.cats.filter(s=>s!==canon);
    }

    state.page=1;
    fetchBooks();
  });
}

els.prev.addEventListener('click', ()=>{ if(state.page>1){ state.page-=1; fetchBooks(); } });
els.next.addEventListener('click', ()=>{ state.page+=1; fetchBooks(); });

els.clearBtn.addEventListener('click', ()=>{
  els.q.value='';
  els.yearMin.value='';
  els.yearMax.value='';
  els.language.value='sveng';
  els.sort.value='relevance';
  els.onlyEbooks.checked=false;
  els.onlyCovers.checked=false;
  state.cats=[];
  Array.from(els.categories.querySelectorAll('.chip.is-active')).forEach(c=>c.classList.remove('is-active'));
  state.page=1;
  doSearch();
});

