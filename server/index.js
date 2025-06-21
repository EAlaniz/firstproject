const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store user data in memory (use database in production)
const userData = new Map();

// WHOOP webhook endpoint
app.post('/webhooks/whoop', (req, res) => {
  try {
    const { event_type, data, user_id } = req.body;
    
    console.log('WHOOP webhook received:', event_type, user_id);
    
    // Verify webhook signature (recommended for security)
    const signature = req.headers['x-whoop-signature'];
    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(401).send('Invalid signature');
    }
    
    // Process different event types
    switch (event_type) {
      case 'recovery.updated':
        handleRecoveryUpdate(user_id, data);
        break;
      case 'workout.updated':
        handleWorkoutUpdate(user_id, data);
        break;
      case 'sleep.updated':
        handleSleepUpdate(user_id, data);
        break;
      default:
        console.log('Unknown event type:', event_type);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle recovery data updates
function handleRecoveryUpdate(userId, recoveryData) {
  const user = userData.get(userId) || {};
  user.recovery = recoveryData;
  user.lastUpdate = new Date();
  userData.set(userId, user);
  
  // Emit real-time update to connected clients
  io.to(`user_${userId}`).emit('recovery_update', recoveryData);
  
  console.log(`Recovery updated for user ${userId}:`, recoveryData.score?.recovery_score);
}

// Handle workout data updates
function handleWorkoutUpdate(userId, workoutData) {
  const user = userData.get(userId) || {};
  if (!user.workouts) user.workouts = [];
  user.workouts.push(workoutData);
  user.lastUpdate = new Date();
  userData.set(userId, user);
  
  // Calculate steps from workout data
  const estimatedSteps = calculateStepsFromWorkout(workoutData);
  
  // Emit real-time update
  io.to(`user_${userId}`).emit('workout_update', {
    workout: workoutData,
    estimatedSteps
  });
  
  console.log(`Workout updated for user ${userId}:`, workoutData.sport_id);
}

// Handle sleep data updates
function handleSleepUpdate(userId, sleepData) {
  const user = userData.get(userId) || {};
  user.sleep = sleepData;
  user.lastUpdate = new Date();
  userData.set(userId, user);
  
  // Emit real-time update
  io.to(`user_${userId}`).emit('sleep_update', sleepData);
  
  console.log(`Sleep updated for user ${userId}:`, sleepData.score?.stage_summary?.total_in_bed_time_milli);
}

// Calculate estimated steps from workout distance
function calculateStepsFromWorkout(workoutData) {
  const distanceMeters = workoutData.score?.distance_meter || 0;
  // Rough conversion: 1 meter ≈ 1.3 steps
  return Math.round(distanceMeters * 1.3);
}

// Verify webhook signature for security
function verifyWebhookSignature(payload, signature) {
  if (!signature || !process.env.WHOOP_WEBHOOK_SECRET) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHOOP_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Get user data endpoint
app.get('/api/user/:userId/data', (req, res) => {
  const { userId } = req.params;
  const user = userData.get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// Register webhook with WHOOP
app.post('/api/register-webhook', async (req, res) => {
  const { accessToken, userId } = req.body;
  
  try {
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/webhooks/whoop`;
    
    const response = await fetch('https://api.prod.whoop.com/developer/v1/webhook', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        enabled: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Webhook registration failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    res.json({ success: true, webhook: result });
    
  } catch (error) {
    console.error('Webhook registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join user-specific room
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Profile validation endpoint for smart wallet callbacks
app.post('/api/profile-validation', (req, res) => {
  console.log('Profile validation callback received:', req.body);
  
  // In a real implementation, you would:
  // 1. Validate the callback signature
  // 2. Process the profile data
  // 3. Store verified data securely
  // 4. Update user profile in database
  
  const { email, physicalAddress } = req.body;
  
  // For demo purposes, we'll just log the data
  console.log('Verified profile data:', {
    email,
    physicalAddress,
    verifiedAt: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: 'Profile data received and validated',
    data: {
      email,
      physicalAddress,
      verifiedAt: new Date().toISOString()
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhooks/whoop`);
});