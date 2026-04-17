# 🎌 AniVerse — Deploy Guide

## Deploy on Railway (5 minutes, free)

### Step 1 — Push to GitHub
```bash
cd aniverse-app
git init
git add .
git commit -m "AniVerse launch"
# Create repo on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/aniverse.git
git push -u origin main
```

### Step 2 — Deploy on Railway
1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select your aniverse repo
3. Railway auto-detects Next.js — click Deploy
4. Settings → Networking → Generate Domain
5. Live at https://aniverse-production.up.railway.app ✅

railway.toml handles the build/start automatically. No extra config.

Free tier = $5/month credit — enough for personal/small traffic.

---

## Deploy on Vercel (also great, unlimited free)
```bash
npm install -g vercel
vercel
```

---

## Test locally
```bash
npm install
npm run dev
# http://localhost:3000
```

---

## How streaming works (why this actually works unlike plain HTML)

```
User clicks Watch
     ↓
/api/search-hianime.js  ← server finds HiAnime anime ID  (no CORS — server side)
     ↓
/api/episodes.js        ← server fetches episode list     (no CORS — server side)
     ↓
/api/stream.js          ← server gets .m3u8 URL           (no CORS — server side)
     ↓
/api/proxy.js           ← server proxies HLS + rewrites segment URLs
     ↓
HLS.js in browser       ← plays the video ✅
```

CORS blocks browsers, not servers. Our API routes run on Node.js
so they fetch from HiAnime freely. Browser only ever hits /api/* on your own domain.

---

## For max reliability — self-host HiAnime API on Railway too

1. Fork https://github.com/ghoshRitesh12/aniwatch-api
2. New Railway project from that repo
3. Add env: ANIWATCH_API_DEPLOYMENT_ENV=railway
4. Get your URL e.g. https://aniwatch-api.up.railway.app
5. Add it to top of APIS array in pages/api/stream.js + pages/api/episodes.js

---

## Stack
- Next.js 14 — React + server API routes
- AniList GraphQL — metadata (free, no key)
- HiAnime API — episodes + stream sources
- HLS.js — adaptive bitrate video player
- Claude AI — anime recommendations
