/**
 * Vercel Serverless Function to exchange Whoop authorization code for tokens
 * This avoids CORS issues and keeps client_secret secure
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS for your domain
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://move10k.xyz',
    'https://www.move10k.xyz'
  ];

  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { code, grant_type = 'authorization_code', refresh_token } = req.body;

    // Validate required parameters
    if (grant_type === 'authorization_code' && !code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    if (grant_type === 'refresh_token' && !refresh_token) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    // Get credentials from environment variables
    const clientId = process.env.WHOOP_CLIENT_ID;
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;
    const redirectUri = process.env.WHOOP_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      console.error('Missing Whoop credentials in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Build request body
    const body = new URLSearchParams();
    body.append('client_id', clientId);
    body.append('client_secret', clientSecret);
    body.append('grant_type', grant_type);

    if (grant_type === 'authorization_code') {
      body.append('code', code);
      if (redirectUri) {
        body.append('redirect_uri', redirectUri);
      }
    } else if (grant_type === 'refresh_token') {
      body.append('refresh_token', refresh_token);
    }

    // Exchange code/refresh_token for tokens
    const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whoop API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Failed to exchange token',
        details: errorText
      });
    }

    const tokens = await response.json();
    return res.status(200).json(tokens);

  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
