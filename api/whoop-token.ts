/**
 * Vercel Serverless Function to exchange Whoop authorization code for tokens
 * This avoids CORS issues and keeps client_secret secure
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🚀 Whoop Token Exchange Function Called');
  console.log('🚀 Request method:', req.method);
  console.log('🚀 Request origin:', req.headers.origin);
  
  // Enable CORS for your domain
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, grant_type = 'authorization_code', refresh_token, redirect_uri } = req.body;

    // Validate required parameters
    if (grant_type === 'authorization_code' && !code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    if (grant_type === 'refresh_token' && !refresh_token) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    // Get credentials from environment variables with fallback to hardcoded values for testing
    const clientId = process.env.WHOOP_CLIENT_ID || 'df7fcd55-a40a-42db-a81c-249873f80afe';
    const clientSecret = process.env.WHOOP_CLIENT_SECRET || '9900daf530da283c0d5bf014d914f1939337fa1e0eef5f50403e2e32c46fbcf2';

    console.log('🔍 Whoop Token Exchange - Environment check:', {
      env_keys: Object.keys(process.env).filter(k => k.includes('WHOOP')),
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientId_length: clientId?.length,
      clientSecret_length: clientSecret?.length
    });

    console.log('🔍 Whoop Token Exchange - Request details:', {
      method: req.method,
      origin: req.headers.origin,
      redirect_uri_from_client: redirect_uri || 'NOT PROVIDED',
      grant_type,
      code_length: code?.length
    });

    if (!clientId || !clientSecret) {
      console.error('❌ Missing Whoop credentials in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('WHOOP')));
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Build request body
    const body = new URLSearchParams();
    body.append('client_id', clientId);
    body.append('client_secret', clientSecret);
    body.append('grant_type', grant_type);

    if (grant_type === 'authorization_code') {
      body.append('code', code);
      // Use the redirect_uri passed from client, MUST match the one used in authorization request
      if (!redirect_uri) {
        return res.status(400).json({ error: 'Missing redirect_uri parameter' });
      }
      body.append('redirect_uri', redirect_uri);
      
      console.log('🔄 Token Exchange - Using redirect_uri:', redirect_uri);
      console.log('🔄 Token Exchange - Full body params:', {
        client_id: clientId?.substring(0, 8) + '...',
        grant_type,
        code_length: code?.length,
        redirect_uri
      });
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
