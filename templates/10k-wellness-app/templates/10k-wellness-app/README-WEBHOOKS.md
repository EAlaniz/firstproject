# WHOOP Webhooks Setup Guide

This guide explains how to set up real-time WHOOP data updates using webhooks instead of polling.

## 🎯 **Benefits of Webhooks**

- **Real-time updates**: Get data immediately when WHOOP processes it
- **Reduced API calls**: No need to poll every 5 minutes
- **Better user experience**: Instant sync notifications
- **Lower latency**: Data appears as soon as it's available

## 🏗️ **Architecture**

```
WHOOP → Webhook Server → WebSocket → Frontend App
```

1. **WHOOP** sends data to your webhook endpoint
2. **Webhook Server** processes and stores the data
3. **WebSocket** pushes updates to connected clients
4. **Frontend** receives real-time updates

## 🚀 **Setup Instructions**

### 1. **Start the Webhook Server**

```bash
# Install dependencies
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start server
npm run dev
```

### 2. **Deploy to Production**

For webhooks to work, you need an HTTPS endpoint. Options:

#### **Option A: Railway (Recommended)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

#### **Option B: Heroku**
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Deploy
git add .
git commit -m "Add webhook server"
git push heroku main
```

#### **Option C: DigitalOcean App Platform**
- Connect your GitHub repo
- Set environment variables
- Deploy automatically

### 3. **Configure Environment Variables**

Update your `.env` files:

**Frontend (.env):**
```env
VITE_WEBHOOK_SERVER_URL=https://your-webhook-server.com
```

**Backend (server/.env):**
```env
WEBHOOK_BASE_URL=https://your-webhook-server.com
WHOOP_WEBHOOK_SECRET=your_secure_random_string
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret
```

### 4. **Register Webhook with WHOOP**

Once your server is deployed:

1. Connect your WHOOP device in the app
2. The app will automatically register the webhook
3. WHOOP will start sending real-time updates

## 🔧 **Testing Webhooks**

### **Local Testing with ngrok**

```bash
# Install ngrok
npm install -g ngrok

# Start your local server
npm run dev

# In another terminal, expose it
ngrok http 3001

# Use the ngrok HTTPS URL as your WEBHOOK_BASE_URL
```

### **Webhook Events**

WHOOP sends these event types:

- `recovery.updated` - New recovery score available
- `workout.updated` - Workout completed and processed
- `sleep.updated` - Sleep data processed
- `cycle.updated` - Daily cycle completed

## 📊 **Data Flow**

1. **User completes workout** → WHOOP processes data
2. **WHOOP sends webhook** → Your server receives event
3. **Server processes data** → Calculates steps, updates storage
4. **WebSocket emits update** → Frontend receives real-time data
5. **UI updates instantly** → User sees new data immediately

## 🔒 **Security**

- **Webhook signatures**: Verify requests are from WHOOP
- **HTTPS only**: Webhooks require secure endpoints
- **Rate limiting**: Prevent abuse of your endpoints
- **Authentication**: Secure your API endpoints

## 🐛 **Troubleshooting**

### **Webhook Not Receiving Data**
- Check HTTPS endpoint is accessible
- Verify webhook registration was successful
- Check server logs for errors
- Ensure WHOOP_WEBHOOK_SECRET is set

### **WebSocket Connection Issues**
- Check CORS configuration
- Verify WebSocket server URL
- Check browser console for errors

### **Data Not Updating**
- Verify webhook signature validation
- Check data processing logic
- Ensure WebSocket rooms are working

## 📈 **Monitoring**

Add logging and monitoring:

```javascript
// Add to your webhook endpoint
app.post('/webhooks/whoop', (req, res) => {
  console.log('Webhook received:', {
    event: req.body.event_type,
    user: req.body.user_id,
    timestamp: new Date().toISOString()
  });
  
  // Your processing logic...
});
```

## 🔄 **Fallback to Polling**

The app automatically falls back to polling if webhooks aren't available:

```typescript
// In useWearables hook
useEffect(() => {
  if (!isWebhookConnected) {
    // Fall back to polling every 5 minutes
    const interval = setInterval(syncData, 300000);
    return () => clearInterval(interval);
  }
}, [isWebhookConnected]);
```

This ensures the app works whether webhooks are set up or not!