// pages/api/proxy.js
// Proxies m3u8 manifests and ts segments server-side with correct Referer headers
// This is what makes HLS playback work in browsers

export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, referer } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });

  try {
    const decodedUrl = decodeURIComponent(url);
    const decodedReferer = referer ? decodeURIComponent(referer) : 'https://hianime.to/';

    const response = await fetch(decodedUrl, {
      headers: {
        'Referer': decodedReferer,
        'Origin': new URL(decodedReferer).origin,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream error' });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');

    // For m3u8 files, rewrite URLs to go through this proxy
    if (contentType.includes('mpegurl') || decodedUrl.endsWith('.m3u8')) {
      const text = await response.text();
      const baseUrl = new URL(decodedUrl);
      const proxyBase = `/api/proxy?referer=${encodeURIComponent(decodedReferer)}&url=`;

      const rewritten = text.split('\n').map(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return line;
        try {
          // Make absolute URL then proxy it
          const absUrl = new URL(line, baseUrl.href).href;
          return `${proxyBase}${encodeURIComponent(absUrl)}`;
        } catch {
          return line;
        }
      }).join('\n');

      return res.status(200).send(rewritten);
    }

    // For .ts segments stream directly
    const buffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
