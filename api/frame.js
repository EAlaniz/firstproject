// Farcaster Frame Interactive API Endpoint

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { untrustedData } = req.body;
    // untrustedData.buttonIndex is 1-based (1, 2, 3, ...)
    const buttonIndex = untrustedData?.buttonIndex;

    let frameText = '';
    let frameImage = 'https://www.move10k.xyz/frame-image.png';
    let buttons = [
      { label: '🚶‍♂️ Log Steps' },
      { label: '📊 View Stats' },
      { label: '💰 Earn Tokens' },
      { label: '🎯 Set Goal' }
    ];

    switch (buttonIndex) {
      case 1:
        frameText = '✅ Steps logged! Keep moving!';
        break;
      case 2:
        frameText = '📊 You have 7-day streak and 100 tokens!';
        break;
      case 3:
        frameText = '💰 Tokens claimed!';
        break;
      case 4:
        frameText = '🎯 New goal set!';
        break;
      default:
        frameText = 'Welcome to 10K! Move. Earn. Connect.';
    }

    // Respond with a new frame (HTML)
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>10K - Move. Earn. Connect.</title>
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content="${frameImage}" />
        <meta name="fc:frame:button:1" content="🚶‍♂️ Log Steps" />
        <meta name="fc:frame:button:2" content="📊 View Stats" />
        <meta name="fc:frame:button:3" content="💰 Earn Tokens" />
        <meta name="fc:frame:button:4" content="🎯 Set Goal" />
        <meta name="fc:frame:post_url" content="https://www.move10k.xyz/api/frame" />
        <style>body{background:#000;color:#fff;text-align:center;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;}h1{color:#22c55e;}</style>
      </head>
      <body>
        <h1>10K</h1>
        <p>${frameText}</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing frame interaction:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
} 