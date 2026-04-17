// pages/api/stream.js
// Server-side proxy — fetches HiAnime stream sources without CORS issues
// Uses the public aniwatch-api demo instance, falls back gracefully

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { episodeId, server = 'hd-1', category = 'sub' } = req.query;
  if (!episodeId) return res.status(400).json({ error: 'episodeId required' });

  const APIS = [
    'https://api-aniwatch.onrender.com',
    'https://aniwatch-api-v2.vercel.app',
  ];

  for (const base of APIS) {
    try {
      const url = `${base}/anime/episode-srcs?id=${encodeURIComponent(episodeId)}&server=${server}&category=${category}`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AniVerse/1.0)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) continue;
      const data = await r.json();
      if (data?.sources?.length) {
        return res.status(200).json(data);
      }
    } catch (e) {
      continue;
    }
  }

  return res.status(503).json({ error: 'No stream sources available' });
}
