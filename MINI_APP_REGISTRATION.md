# Farcaster Mini App Registration Guide

## Overview
This guide explains how to properly register and deploy your 10K Wellness Mini App with Farcaster using the current standards.

## Current Mini App Standards

### What Changed
- **No more meta tag reliance** - Mini Apps now use manifest-based approach
- **Proper registration required** - Must be submitted to Farcaster Mini App directory
- **SDK integration** - Uses Farcaster Mini App SDK for proper embedding
- **API endpoints** - May require specific API endpoints for functionality

## Step 1: Verify Mini App Manifest

Your `mini-app.json` should contain:
```json
{
  "name": "10K - Move. Earn. Connect.",
  "short_name": "10K",
  "description": "Inclusive wellness app for step tracking, social connection, and token rewards on Base Chain",
  "version": "1.0.0",
  "manifest_version": 3,
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#667eea",
  "background_color": "#ffffff",
  "farcaster": {
    "app_id": "10k-wellness",
    "embed_url": "https://www.move10k.xyz",
    "embed_image": "https://www.move10k.xyz/frame-image.png",
    "embed_title": "10K - Move. Earn. Connect.",
    "embed_description": "Inclusive wellness app for step tracking, social connection, and token rewards"
  }
}
```

## Step 2: Deploy Your App

1. **Build the app**: `npm run build`
2. **Deploy to Vercel/Netlify**: Ensure HTTPS is enabled
3. **Verify accessibility**: Test all URLs work publicly

## Step 3: Register with Farcaster

### Option A: Official Mini App Directory
1. Visit [Farcaster Mini App Directory](https://farcaster.xyz/miniapps)
2. Submit your app for review
3. Include:
   - App manifest (`mini-app.json`)
   - Screenshots
   - Description
   - Category (Health/Fitness)

### Option B: Developer Registration
1. Contact Farcaster team via Discord/Twitter
2. Provide app details and manifest
3. Request Mini App registration

## Step 4: Test Mini App Embedding

### Test URLs
- Main app: `https://www.move10k.xyz`
- Embed test: `https://www.move10k.xyz/?embed=true`

### Verification Checklist
- [ ] App loads in Farcaster client
- [ ] Wallet connection works
- [ ] All features function properly
- [ ] UI adapts to Mini App context

## Step 5: API Endpoints (If Needed)

If your Mini App requires server-side functionality:

```javascript
// api/mini-app.js
export default function handler(req, res) {
  // Handle Mini App specific requests
  res.json({ 
    status: 'success',
    app_id: '10k-wellness',
    version: '1.0.0'
  });
}
```

## Troubleshooting

### Common Issues
1. **App not appearing in directory**: Check manifest format and registration status
2. **Embed not working**: Verify HTTPS and public accessibility
3. **Wallet connection fails**: Ensure proper OnchainKit configuration

### Debug Steps
1. Test app in regular browser
2. Check console for errors
3. Verify all URLs are accessible
4. Test wallet connection flow

## Resources
- [Farcaster Mini App Documentation](https://docs.farcaster.xyz/miniapps)
- [Mini App SDK](https://github.com/farcasterxyz/miniapp-sdk)
- [Developer Discord](https://discord.gg/farcaster)

## Next Steps
1. Deploy updated app
2. Register with Farcaster
3. Test embedding functionality
4. Monitor for approval 