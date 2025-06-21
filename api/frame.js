export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle POST request (frame interaction)
  if (req.method === 'POST') {
    try {
      const { trustedData, untrustedData } = req.body;
      
      // Log the frame interaction for debugging
      console.log('Farcaster Frame interaction:', { trustedData, untrustedData });
      
      // Parse the button index from the message
      let buttonIndex = 1; // default
      if (trustedData && trustedData.messageBytes) {
        const messageBytes = trustedData.messageBytes;
        buttonIndex = parseInt(messageBytes.slice(-1), 16);
      }
      
      // Return different frame responses based on button clicked
      let response;
      
      switch (buttonIndex) {
        case 1: // Connect Wallet
          response = {
            frames: [{
              image: "https://www.move10k.xyz/frame-connect.png",
              buttons: [
                { label: "Open App", action: "post_redirect" },
                { label: "Back", action: "post" }
              ],
              postUrl: "https://www.move10k.xyz/api/frame"
            }]
          };
          break;
          
        case 2: // View Leaderboard
          response = {
            frames: [{
              image: "https://www.move10k.xyz/frame-leaderboard.png",
              buttons: [
                { label: "Join Challenge", action: "post_redirect" },
                { label: "Back", action: "post" }
              ],
              postUrl: "https://www.move10k.xyz/api/frame"
            }]
          };
          break;
          
        case 3: // Join Community
          response = {
            frames: [{
              image: "https://www.move10k.xyz/frame-community.png",
              buttons: [
                { label: "Join Discord", action: "post_redirect" },
                { label: "Back", action: "post" }
              ],
              postUrl: "https://www.move10k.xyz/api/frame"
            }]
          };
          break;
          
        default:
          response = {
            frames: [{
              image: "https://www.move10k.xyz/frame-image.png?v=6",
              buttons: [
                { label: "Connect Wallet", action: "post" },
                { label: "View Leaderboard", action: "post" },
                { label: "Join Community", action: "post" }
              ],
              postUrl: "https://www.move10k.xyz/api/frame"
            }]
          };
      }
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Frame processing error:', error);
      res.status(500).json({ error: 'Frame processing failed' });
    }
    return;
  }

  // Handle GET request (initial frame) - return proper HTML meta output
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://www.move10k.xyz/frame-image.png?v=6" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:button:1" content="Connect Wallet" />
        <meta property="fc:frame:button:2" content="View Leaderboard" />
        <meta property="fc:frame:button:3" content="Join Community" />
        <meta property="fc:frame:post_url" content="https://www.move10k.xyz/api/frame" />
      </head>
      <body>
        <h1>10K Wellness Frame</h1>
      </body>
    </html>
  `);
} 