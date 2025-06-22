// Farcaster Mini App Webhook Handler
// This endpoint handles events from Farcaster clients when users interact with the mini app

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { header, payload, signature } = req.body;

    // In a production environment, you would verify the signature here
    // using the Farcaster protocol verification methods
    
    // Decode the payload to get the event details
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    console.log('Received Farcaster webhook event:', decodedPayload);

    switch (decodedPayload.event) {
      case 'frame_added':
        console.log('User added the mini app');
        // Store user data and notification tokens
        if (decodedPayload.notificationDetails) {
          console.log('Notification details:', decodedPayload.notificationDetails);
          // Store the notification token and URL for this user
          // This would typically go to a database
        }
        break;

      case 'frame_removed':
        console.log('User removed the mini app');
        // Clean up user data and invalidate notification tokens
        break;

      case 'notifications_enabled':
        console.log('User enabled notifications');
        if (decodedPayload.notificationDetails) {
          console.log('New notification details:', decodedPayload.notificationDetails);
          // Update notification tokens for this user
        }
        break;

      case 'notifications_disabled':
        console.log('User disabled notifications');
        // Invalidate notification tokens for this user
        break;

      default:
        console.log('Unknown event type:', decodedPayload.event);
    }

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Event processed successfully' 
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 