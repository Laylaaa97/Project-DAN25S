# Project-DAN25S

Här är **README.md** – kort, tydlig och med “clean girl / Pinterest”-vibes.

```markdown
# 📚 Beige Book Explorer

> *En clean, beige och minimalistisk bok-sökare i **vanilla JavaScript**. It-girl vibes, mjuka skuggor och snabba resultat via Open Library.*

## ✨ Features
- 🔎 **Sök** på titel/författare i realtid (debounce, så appen känns lugn och snäll)
- 🗂️ **Filter på år** (från/till)
- ↕️ **Sortering**: relevans (default), nyast först, äldst först
- ⏭️ **Pagination** med Föregående/Nästa
- 🧠 **Recent searches** sparas i `localStorage`
- 🖼️ **Omslagsbilder** via Open Librarys cover-tjänst
- 🧼 **Beige UI** med skelett-shimmer medan data laddar (premium-känsla)

## 🧱 Teknik & API
- **HTML, CSS, JavaScript** (ingen build, inga ramverk)
- **Open Library Search API**: `https://openlibrary.org/search.json?q=<query>&page=<num>`
- **Covers**: `https://covers.openlibrary.org/b/id/{id}-M.jpg`
- Ingen API-nyckel behövs.

## 📁 Struktur
```

beige-book-explorer/
├─ index.html
├─ styles.css
├─ app.js
└─ README.md

````

## ▶️ Kom igång i WebStorm
1. Skapa en ny mapp: `beige-book-explorer`.
2. Lägg in filerna ovan.
3. Öppna projektet i **WebStorm**.
4. Högerklicka på `index.html` → **Open in Browser**  
   (eller kör WebStorms inbyggda server: *Services > HTTP Server*).
5. Sök något (t.ex. `cozy fantasy`) och testa filter/sortering.

> Tips: Om något cachar konstigt, kör **File → Invalidate Caches** i WebStorm eller uppdatera med **Ctrl/Cmd + F5**.

## 🚀 Deploy till GitHub Pages
1. Skapa ett nytt repo på GitHub.
2. Lägg till, committa och pusha:
   ```bash
   git init
   git add .
   git commit -m "Beige Book Explorer ✨"
   git branch -M main
   git remote add origin <URL-till-ditt-repo>
   git push -u origin main
````

3. Gå till **Settings → Pages**:

   * **Source**: *Deploy from a branch*
   * **Branch**: `main` och **Folder**: `/ (root)`
4. Öppna din Pages-länk när den dyker upp.

## 🔧 Anpassning (snabb styling)

Justera färger i `styles.css` under `:root`:

```css
:root {
  --bg: #f6f0e9;     /* bakgrund (beige) */
  --accent: #b89f8a; /* knappar/chips */
  --accent-2: #a08874; /* hover */
}
```

## 🧪 Testa allt snabbt

* Sök: skriv i sökfältet → resultat streamas in.
* Filter: sätt `Från år` / `Till år` och ändra sort.
* Pagination: klicka **Nästa** / **Föregående**.
* Stäng och öppna sidan igen → **Recent searches** ligger kvar.

## 🧯 Felsökning

* **Inga bilder?** Alla böcker har inte omslag i Open Library → kortet visas ändå.
* **Tomma resultat?** Prova bredare sökord eller ta bort år-filter.
* **Nätverksfel?** Appen visar ett litet felmeddelande; testa igen.
* **CORS / cache?** Hård-reload (Ctrl/Cmd + Shift + R) eller kör lokalt via server.

## ♿ Tillgänglighet

* `aria-live="polite"` på resultatlistan.
* Tydliga kontraster för text och länkar.
* `prefers-reduced-motion` minskar animationer.

## 📌 Att göra (om du vill bygga ut)

* ⭐ Favoriter (spara verk i `localStorage`)
* 🌗 Dark mode (toggla ett mörkt färgschema)
* 🔍 “Quick Look” modal med mer metadata

## 👩‍💻 Licens / Credit

Gör vad du vill i kursen/projektet. Design & kod av dig (data-analys student) med vibe: *clean girl / it girl / Pinterest*.

```
```
