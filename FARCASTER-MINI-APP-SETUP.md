# Farcaster Mini App Setup for 10K

## Overview

10K is now configured as a Farcaster mini app, allowing users to discover, use, and share the app directly within Farcaster clients like Warpcast. The mini app provides social features, achievement sharing, and seamless integration with the Farcaster ecosystem.

## Features

### 🚀 Mini App Integration
- **Native Farcaster Experience**: Runs within Farcaster clients as a mini app
- **Splash Screen**: Custom branded loading screen
- **Ready State Management**: Proper loading and initialization
- **Event Handling**: Responds to mini app lifecycle events

### 📱 Social Features
- **Profile Management**: View and manage Farcaster profile
- **Social Feed**: Browse and interact with fitness-related posts
- **Achievement Sharing**: Share achievements directly to Farcaster
- **Leaderboard**: Global step tracking leaderboard
- **Progress Sharing**: Share daily progress and milestones

### 🔗 Sharing & Discovery
- **Frame Embeds**: Shareable embeds in Farcaster feeds
- **Mini App URLs**: Canonical URLs for easy sharing
- **Add to Apps**: Users can add 10K to their Farcaster apps
- **Notifications**: Push notifications for achievements and milestones

## Technical Setup

### Dependencies
```json
{
  "@farcaster/auth-kit": "^0.8.1",
  "@farcaster/frame-sdk": "^0.0.61"
}
```

### Key Files

#### 1. Farcaster Mini App Component
- **File**: `src/components/FarcasterMiniApp.tsx`
- **Purpose**: Main mini app interface with social features
- **Features**: Profile, social feed, achievements, leaderboard

#### 2. Farcaster Manifest
- **File**: `public/.well-known/farcaster.json`
- **Purpose**: Mini app configuration and metadata
- **Features**: App info, capabilities, required chains

#### 3. Frame Meta Tag
- **File**: `index.html`
- **Purpose**: Enables sharing as embed in Farcaster feeds
- **Features**: Custom image, button, and launch configuration

#### 4. Webhook Handler
- **File**: `api/webhook.js`
- **Purpose**: Handles mini app events and notifications
- **Features**: User management, notification tokens

## Configuration

### Manifest Configuration
The `farcaster.json` manifest includes:

```json
{
  "frame": {
    "version": "1",
    "name": "10K - Move. Earn. Connect.",
    "iconUrl": "https://www.move10k.xyz/10k-icon.png",
    "homeUrl": "https://www.move10k.xyz",
    "requiredChains": ["eip155:8453"],
    "requiredCapabilities": [
      "actions.signIn",
      "wallet.getEthereumProvider",
      "actions.composeCast",
      "actions.addMiniApp"
    ]
  }
}
```

### Frame Embed Configuration
The frame meta tag enables sharing:

```html
<meta name="fc:frame" content='{
  "version": "next",
  "imageUrl": "https://www.move10k.xyz/frame-image.png",
  "button": {
    "title": "🚶‍♂️ Start Walking",
    "action": {
      "type": "launch_frame",
      "name": "10K - Move. Earn. Connect.",
      "url": "https://www.move10k.xyz"
    }
  }
}' />
```

## Usage

### For Users

1. **Discover**: Find 10K in Farcaster app stores or shared embeds
2. **Launch**: Open the mini app from Farcaster client
3. **Connect**: Sign in with Farcaster account
4. **Use**: Track steps, share achievements, view leaderboard
5. **Add**: Add to personal apps for quick access
6. **Share**: Share progress and achievements to feed

### For Developers

#### Adding Social Features
```tsx
import FarcasterMiniApp from './components/FarcasterMiniApp';

<FarcasterMiniApp
  currentSteps={currentSteps}
  dailyGoal={dailyGoal}
  isGoalReached={isGoalReached}
  currentStreak={currentStreak}
  totalTokens={totalTokens}
  onShareAchievement={handleShareAchievement}
/>
```

#### Handling Mini App Events
```tsx
import { sdk } from '@farcaster/frame-sdk';

// Initialize mini app
const isMiniApp = await sdk.isInMiniApp();
if (isMiniApp) {
  await sdk.actions.ready();
  
  // Listen for events
  sdk.on('frameAdded', () => console.log('App added'));
  sdk.on('notificationsEnabled', () => console.log('Notifications enabled'));
}
```

#### Sharing to Farcaster
```tsx
const result = await sdk.actions.composeCast({
  text: "Just hit 10,000 steps! 🚶‍♂️ #10K #MoveToEarn",
  embeds: [window.location.origin]
});
```

## Deployment

### Requirements
1. **HTTPS Domain**: Mini apps require HTTPS
2. **Manifest Access**: `/.well-known/farcaster.json` must be accessible
3. **Webhook Endpoint**: `/api/webhook` for event handling
4. **Frame Images**: Proper 3:2 aspect ratio images for embeds

### Verification
1. **Domain Ownership**: Sign manifest with Farcaster account
2. **App Registration**: Register in Farcaster developer tools
3. **Testing**: Use Farcaster debug tools to test functionality

## Best Practices

### Performance
- Call `sdk.actions.ready()` as soon as possible
- Use proper loading states and skeleton screens
- Optimize images for frame embeds

### User Experience
- Provide clear value proposition
- Enable easy sharing of achievements
- Support both connected and disconnected states

### Security
- Verify webhook signatures in production
- Validate user permissions
- Handle errors gracefully

## Troubleshooting

### Common Issues

1. **Mini App Not Loading**
   - Check manifest accessibility
   - Verify HTTPS configuration
   - Test with debug tools

2. **Sharing Not Working**
   - Verify frame meta tag
   - Check image URLs and dimensions
   - Test embed generation

3. **Webhook Errors**
   - Check endpoint accessibility
   - Verify signature validation
   - Monitor error logs

### Debug Tools
- [Farcaster Mini App Debug Tool](https://farcaster.xyz/~/developers/mini-apps/debug)
- [Frame Embed Tool](https://farcaster.xyz/~/developers/mini-apps/embed)
- [Developer Tools](https://farcaster.xyz/~/developers)

## Next Steps

### Planned Features
- [ ] Push notifications for achievements
- [ ] Social challenges and competitions
- [ ] Integration with Farcaster channels
- [ ] Advanced analytics and insights
- [ ] Cross-app data synchronization

### Integration Opportunities
- [ ] Farcaster channels for fitness communities
- [ ] Cast-based challenges and events
- [ ] Social leaderboards and competitions
- [ ] Notification-based engagement

## Resources

- [Farcaster Mini App Documentation](https://docs.farcaster.xyz/miniapps)
- [Frame SDK Reference](https://docs.farcaster.xyz/miniapps/sdk)
- [Manifest Specification](https://docs.farcaster.xyz/miniapps/specification)
- [Developer Tools](https://farcaster.xyz/~/developers)

---

**Note**: This setup provides a complete Farcaster mini app experience. The app can be discovered, used, and shared within the Farcaster ecosystem while maintaining its core step tracking and wellness features. 