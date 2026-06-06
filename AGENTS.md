# glasgate.ai — Agent & Entwicklungsregeln

Diese Datei ist die verbindliche Referenz für AI-Agents und Entwickler am glasgate.ai-Projekt.

## Produktkern

> Glasgate crawlt nicht „alles“. Glasgate crawlt wertvolle, öffentliche, kanonische Inhalte und verwandelt sie in AI-ready Artefakte.

Die HTML-Seite bleibt kanonisch. Generierte Dateien sind **öffentliche, alternative Repräsentationen** desselben sichtbaren Inhalts — kein Cloaking, kein versteckter Bot-Content.

---

## Crawl-Regeln

### MVP (aktuell implementiert)

| Setting | Default |
|---|---|
| `MAX_PAGES` | 10 |
| `MAX_SITEMAP_URLS` | 100 (Discovery) |
| `MAX_LLMS_TXT_PAGES` | 8 (kuratierte llms.txt) |

**Ablauf:**

1. Start-URL normalisieren
2. `robots.txt` lesen — bei Blockade **403**, keine Umgehung
3. Bestehende `sitemap.xml` lesen (nicht ersetzen, nicht mit `.md`/`.json` füllen)
4. Homepage crawlen → interne Nav-Links als Kandidaten
5. Kandidaten filtern (`urlFilter.js`) und priorisieren (`urlRanker.js`)
6. Pro URL erneut `robots.txt`-Check vor Fetch
7. Extrahieren → normalisieren → scoren → Artefakte generieren

### Immer einschließen (Priorität)

Homepage, About, Product/Services, Pricing, FAQ, Contact, Docs, wichtige Sitemap-URLs, relevante Nav-Links.

### Nie crawlen / nie in AI-Artefakte

- `/login`, `/signin`, `/signup`, `/auth`, `/account`
- `/cart`, `/checkout`, `/basket`
- `/search`, `/wp-admin`, `/admin`
- Query-URLs: `?filter=`, `?sort=`, `?session=`, UTM-Parameter, Pagination
- Duplikate, dünne Tag-Seiten, leere Kategorien
- Nicht-HTML-Ressourcen (PDF, Bilder, …)

### Production (Ziel, noch nicht vollständig)

| Site-Größe | Limit |
|---|---|
| Small | 20 |
| Medium | 100 |
| Large | 500 |
| Enterprise | konfigurierbar |

Bei großen Sites: `llms-full.txt` splitten oder nur kuratiert + `ai-index.json` + Einzeldateien.

---

## Artefakt-Hierarchie (Wichtigkeit)

| Datei | Rolle |
|---|---|
| `llms.txt` | Kuratierte AI-Startkarte — **kein Content-Dump** |
| `llms-full.txt` | Kompakter Volltext-Korpus (MVP: alle gecrawlten Seiten) |
| `ai-index.json` | Maschinenlesbarer Content-Graph — **Hauptindex für Agents** |
| `pages/{slug}.md` | Saubere Markdown-Spiegelung pro Seite |
| `pages/{slug}.json` | Strukturierte Daten pro Seite |
| `sitemap.xml` | Nur lesen (Discovery für Suchmaschinen), nicht generieren als Kernprodukt |

### llms.txt

- Abschnitte: `Important Pages`, `AI-readable Files`, `Page Mirrors`, `Usage Notes`
- Max. ~8 wichtige Seiten listen, nicht jede Produkt-URL
- Verweist auf `llms-full.txt` und `ai-index.json`

### ai-index.json (v1.0)

Pflichtfelder: `version`, `site`, `crawl` (strategy, discovered/selected/processed), `pages[]` mit `importance`, `type`, `contentHash`, **ohne** vollen `bodyText`-Dump.

### page.md / page.json

- **Pro Seite** eine Datei unter `pages/{slug}.md` und `.json`
- Dashboard zeigt „Generated Page Preview“ (z. B. `home.md`), nicht „first page.md“ als einzige Datei

---

## Code-Konventionen

- **ESM** in `server/`, kein CommonJS
- Neue Crawl-Logik in `server/lib/urlFilter.js` und `server/lib/urlRanker.js` — nicht in Routen duplizieren
- Generatoren nur in `server/lib/generators/`
- Config über `server/config.js` + `.env.example`
- Demo-Fixture: `generated/demo-glasgate/` muss konsistent zum Live-Schema sein

### Tests vor Commit

```bash
npm run test:unit
npm run test:e2e   # Backend muss laufen
npm run build      # Frontend
```

### Scope

- Minimale, fokussierte Diffs
- Keine unrelated Refactors
- Docs aktualisieren wenn API/Schema/Crawl-Verhalten sich ändert (`README.md`, `docs/API.md`, `docs/BACKEND_ARCHITECTURE.md`)

---

## Frontend

- Marketing: `src/main.jsx` (Landing, Section-Scroll)
- App nach Login: `src/app/` (Router, Shell, Audit-Unterseiten)
- Branding: **glasgate.ai**
- Responsive: keine `feature-card`-Klasse auf Audit-Panels (zerstört Grid/Flex-Layouts)

---

## Was nicht gebaut wird (MVP)

- Keine `.md`/`.json` in der normalen `sitemap.xml`
- Keine eigene AI-Sitemap als Ersatz für HTML-Sitemap
- Kein blindes Crawlen aller Sitemap-URLs in FIFO-Reihenfolge
- Kein Ignorieren von `robots.txt`

---

## Version 2 (Backlog)

- Seitentyp-Erkennung (E-Commerce, Local Business)
- Content-Hash-Diffs & Recrawl
- `llms-full.txt`-Splitting für große Sites
- Agent-Request-Logs, CMS-Plugin, Scheduled Recrawls
