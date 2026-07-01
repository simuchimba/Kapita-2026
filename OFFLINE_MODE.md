# Offline Mode — How It Works & How to Test

## Architecture

The app now supports **offline-first** operation. When you lose internet connection:

1. **Static assets** (HTML, JS, CSS) are served from the Service Worker cache
2. **API GET requests** (loading products, sales, customers) fall back to cached data
3. **API mutations** (creating sales, adding products, etc.) are queued in IndexedDB
4. When connection is restored, queued mutations **auto-sync** in order

## Files Involved

| File | Role |
|------|------|
| `public/sw.js` | Service Worker — caches assets & API responses |
| `src/services/db.js` | IndexedDB — stores pending mutations, cached data, sync log |
| `src/services/sync.js` | Sync engine — processes queue, detects online/offline |
| `src/services/api.js` | Axios interceptor — queues mutations when offline |
| `src/components/OfflineIndicator.jsx` | Floating indicator (bottom-right) |
| `src/main.jsx` | Initializes sync engine on app load |

## How to Test Locally

### Dev Server (localhost:3000)

1. **Start the app** — `npm run dev` in `frontend/`
2. **Open** `http://localhost:3000` and log in
3. **Verify offline indicator disappears** — after data loads, no floating badge
4. **Go offline** — DevTools → Network tab → check "Offline" (or `Disable cache`)
5. **Navigate the app** — products, sales, dashboard pages should show cached data
6. **Create a sale** — it will queue silently (indicator shows pending count)
7. **Go online** — uncheck "Offline" in DevTools
8. **Verify sync** — the sale appears in the sales list, indicator disappears

### Simulating in Chrome DevTools

1. `F12` → **Network** tab
2. Check **"Offline"** checkbox
3. Refresh the page — it loads from cache
4. Perform actions — they queue
5. Uncheck **"Offline"** — auto-sync triggers

### Checking the Sync Log

Open IndexedDB viewer:
1. `F12` → **Application** tab
2. **IndexedDB** → `kapita-offline`
3. **`sync_log`** store — shows each sync attempt
4. **`pending_mutations`** store — shows queued items (cleared after sync)

## How to Test on Live Server (Render / Production)

1. **Deploy the latest code** (commit already pushed)
2. **Open the app normally** — verify it works
3. **Disconnect internet** on your device (Airplane mode or WiFi off)
4. **Refresh the page** — it should load from cache (no white screen)
5. **Create records** (sale, product, customer) — they queue locally
6. **Reconnect** — data syncs automatically within 60 seconds (or immediately)
7. **Verify** — new records appear after refresh

## What's Cached

| Data | Strategy |
|------|----------|
| Products, Sales, Customers | Stale-while-revalidate (instant from cache, updates in background) |
| Dashboard analytics | Network-first with cache fallback |
| Static assets (JS/CSS/HTML) | Cache-first (always from cache after first load) |
| Auth endpoints | Network-only (never cached) |

## Limitations

- **Files/Blobs** — receipt PDFs and backup exports require network
- **Login** — requires internet (credentials never cached)
- **Conflict resolution** — if the same record is modified offline and online, the server wins (last write)
- **Retry limit** — mutations that fail 5 times are dropped (logged in sync_log)
- **First visit must be online** — assets are cached on first load. If you visit for the first time while offline, the page won't load. Always load the app once while online to populate the cache.
- **SW upgrades** — old caches are kept as fallbacks. If a new SW version is deployed and you go offline before revisiting, cached assets from the previous version serve as fallback.
- **Empty asset fallback** — if a JS/CSS file is not in any cache and you're offline, an empty response is returned. The page may render without styles or functionality, but it won't white-screen.

## Offline Indicator

A floating badge in the **bottom-right corner** shows:

- **Red** "Offline — changes queued" → you're disconnected
- **Blue** "Syncing..." → processing queued mutations
- **Amber** "N pending sync" → N items waiting to sync
- **Hidden** → everything is synced and online
