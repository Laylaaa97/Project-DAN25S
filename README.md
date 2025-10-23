Slutprojekt, Beige Book Explorer
Inledning

Det här projektet är mitt slutprojekt i kursen där vi har arbetat med webbutveckling och fått lära oss grunderna i HTML, CSS och JavaScript. Jag är fortfarande ganska ny inom programmering, så mitt mål med uppgiften var framför allt att försöka förstå hur allt hänger ihop och att bygga något som faktiskt fungerar på riktigt. Jag ville skapa en sida som både har en snygg design och ett tydligt syfte, och samtidigt visa att jag förstått hur man kombinerar de olika delarna av webbutveckling till ett fungerande helhetsprojekt.

Jag valde att bygga en webbapplikation som jag har kallat Beige Book Explorer. Det är en sida där man kan söka efter böcker i Open Librarys databas. När man söker på en titel eller författare hämtas datan från API:et och visas på sidan som små kort med bokomslag, titel, författare och utgivningsår. Jag inspirerades av minimalistiska och lugna färger som man ofta ser på Pinterest, därför gick jag för en beige och mjuk design. Jag ville att sidan skulle kännas stilren, enkel och behaglig att titta på, men ändå ha moderna funktioner.

Syfte och mål

Syftet med projektet var att lära mig hur man bygger upp en hel webbsida med HTML, CSS och JavaScript, och att förstå hur allt samspelar. Jag ville också lära mig att hämta data från ett externt API och presentera den snyggt och tydligt på sidan. Ett annat mål var att lära mig hur man hanterar fel – till exempel om bilder inte laddas eller om internetanslutningen bryts. Jag ville att sidan skulle kännas “på riktigt” och inte bara som ett exempel.

Arbetsprocess och utveckling

I början av projektet fokuserade jag på att bara få grunden att fungera. Jag började med HTML och byggde upp strukturen med header, main och footer. Jag försökte hålla koden tydlig och lätt att förstå, eftersom jag fortfarande lär mig hur man bygger upp större sidor. Därefter gick jag över till CSS där jag experimenterade med färger och layout. Jag använde CSS Grid för att placera böckerna i ett rutnät, och lade till skuggor och rundade kanter för att korten skulle se lite mer levande ut. Jag lärde mig också hur man kan använda CSS-variabler för att lätt kunna ändra färgtemat på hela sidan, vilket var nytt för mig men väldigt användbart.

När designen började kännas bra gick jag över till JavaScript. Det här var den del som kändes mest utmanande, men också mest givande. Jag skrev kod för att hämta data från Open Librarys API med hjälp av fetch(), och sedan visade jag resultaten dynamiskt i HTML. Först var det svårt att förstå hur man “renderar” data på sidan, men efter att ha testat olika sätt och använt console.log() mycket började jag se mönstret. Jag lade också till en funktion som visar en egen genererad bild om boken inte har något omslag. Det gör jag genom att skapa en liten SVG-bild med boktitelns initialer. Det är en detalj som jag är extra stolt över, för det gör att sidan fortfarande ser hel ut även om datan är ofullständig.

Problem och lösningar

Under projektet stötte jag på flera problem som jag fick lösa längs vägen. Ett av de första var att bilderna ibland inte laddades eller att API:et svarade långsamt. Då lade jag till felhantering som visar ett vänligt meddelande om något går fel, istället för att sidan bara blir tom. Jag lärde mig också använda AbortController, som gör att man kan avbryta gamla sökningar om man skriver ett nytt ord snabbt – något jag hittade när jag läste om moderna JavaScript-funktioner.

En annan sak som jag kämpade med var att få designen att se likadan ut i olika webbläsare. Jag upptäckte till exempel att letter-spacing: 1.4px kunde se lite olika ut, så jag bytte till em-mått istället. Jag märkte också att det är viktigt att tänka på tillgänglighet. Därför lade jag till små saker som en sr-only-klass i CSS för text som bara ska läsas upp av skärmläsare, och ett noscript-meddelande som visas om någon har JavaScript avstängt. Det känns som en liten detalj, men det gör sidan mer “riktig” och visar att man tänker på användaren.

När sidan började fungera bättre lade jag till några extra funktioner. Jag sparar till exempel de senaste sökningarna i webbläsarens localStorage, så man snabbt kan klicka på en tidigare sökning. Jag gjorde också en enkel paginering så man kan gå fram och tillbaka mellan sidor, och en dropdown där man kan sortera resultaten efter relevans, nyast eller äldst. Det är ganska enkla funktioner, men de gör upplevelsen mycket bättre.

Verktyg och filer

Jag arbetade med projektet i WebStorm och använde Git och GitHub för versionshantering. Det var första gången jag använde Git på ett riktigt projekt, så det tog lite tid att vänja sig, men nu förstår jag hur viktigt det är. Jag skapade också en .gitignore-fil för att undvika att ladda upp onödiga filer, och en 404.html-sida som visas om man går till en länk som inte finns.

De viktigaste filerna i projektet är:

index.html: själva sidan med struktur och innehåll

style.css: design och layout

app.js: funktionalitet och interaktivitet

404.html: en enkel felsida

.gitignore: utesluter oönskade filer från GitHub

När allt började bli klart gick jag igenom koden och skrev kommentarer så jag själv förstår vad jag gjort när jag tittar tillbaka. Jag testade sidan flera gånger, fixade små buggar och förbättrade designen där det behövdes.

Reflektion

Sammanfattningsvis har det här projektet lärt mig väldigt mycket. Jag har fått en helt annan förståelse för hur HTML, CSS och JavaScript samarbetar, och jag känner att jag verkligen har utvecklats under kursens gång. Det har inte alltid gått lätt, och jag har behövt googla mycket och testa mig fram, men just därför känner jag att jag verkligen lärt mig på riktigt.

Det jag är mest nöjd med är att sidan känns som en riktig webbapp. Den laddar data utifrån, den ser bra ut, och den klarar av att hantera problem utan att gå sönder. Jag tycker också att det är roligt att jag lyckades skapa en tydlig stil på sidan — det beige och minimalistiska gör att den känns lugn och ren.

Om jag hade haft mer tid skulle jag vilja lägga till fler funktioner, till exempel ett mörkt läge eller en möjlighet att spara favoriter. Men som slutprojekt känner jag att jag har uppnått mitt mål: att bygga något från grunden som fungerar och visar vad jag har lärt mig.

Reflektion i efterhand

När jag ser tillbaka på projektet så minns jag att jag ibland blev frustrerad när saker inte fungerade, särskilt i början när jag inte förstod varför koden inte gjorde som jag ville. Men ju mer jag testade och felsökte, desto mer började jag förstå hur webben fungerar på djupet. Jag har också lärt mig att det är okej att göra misstag och att man lär sig mest av att prova, misslyckas och sedan hitta lösningen själv.

Det här projektet har gjort mig mer intresserad av programmering och gett mig självförtroende att fortsätta utvecklas. Jag känner mig mycket tryggare i hur man bygger upp en webbsida och hur man kan lösa problem på egen hand. Jag är stolt över att jag fick ihop allt och att sidan fungerar, och jag ser fram emot att fortsätta lära mig mer framöver.