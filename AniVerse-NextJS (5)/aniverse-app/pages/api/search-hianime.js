// pages/api/search-hianime.js
// Searches HiAnime for the correct anime ID/slug needed to fetch episodes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q required' });

  const APIS = [
    'https://api-aniwatch.onrender.com',
    'https://aniwatch-api-v2.vercel.app',
  ];

  for (const base of APIS) {
    try {
      const r = await fetch(`${base}/anime/search?q=${encodeURIComponent(q)}&page=1`, {
        headers: { 'User-Agent': 'AniVerse/1.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const data = await r.json();
      const animes = data?.animes || data?.results || [];
      if (animes.length) return res.status(200).json({ animes });
    } catch (e) {
      continue;
    }
  }

  return res.status(503).json({ error: 'Search failed', animes: [] });
}
