import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple proxy to Neynar's user-by-custody-address endpoint
// Usage: /api/neynar/user-by-custody-address?address=0x...
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { address } = req.query as { address?: string };
    if (!address) {
      res.status(400).json({ error: 'Missing address query param' });
      return;
    }

    const apiKey = process.env.NEYNAR_API_KEY || process.env.VITE_NEYNAR_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Missing NEYNAR_API_KEY on server' });
      return;
    }

    const url = `https://api.neynar.com/v2/farcaster/user-by-custody-address?address=${encodeURIComponent(
      address
    )}`;

    const resp = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'api_key': apiKey,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.status(resp.status).send(text);
      return;
    }

    const data = await resp.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}


