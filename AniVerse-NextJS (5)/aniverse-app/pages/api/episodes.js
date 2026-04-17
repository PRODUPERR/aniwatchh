// pages/api/episodes.js
// Gets episode list for a given HiAnime anime ID, server-side (no CORS)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { animeId } = req.query;
  if (!animeId) return res.status(400).json({ error: 'animeId required' });

  const APIS = [
    'https://api-aniwatch.onrender.com',
    'https://aniwatch-api-v2.vercel.app',
  ];

  for (const base of APIS) {
    try {
      const r = await fetch(`${base}/anime/episodes/${encodeURIComponent(animeId)}`, {
        headers: { 'User-Agent': 'AniVerse/1.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) continue;
      const data = await r.json();
      if (data?.episodes?.length || data?.totalEpisodes) {
        return res.status(200).json(data);
      }
    } catch (e) {
      continue;
    }
  }

  return res.status(503).json({ error: 'Could not fetch episodes' });
}
