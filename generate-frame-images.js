import fs from 'fs';
import { createCanvas } from 'canvas';

// Create frame images for Farcaster
const frameConfigs = [
  {
    name: 'frame-image.png',
    title: '10K Wellness App',
    subtitle: 'Move. Earn. Connect.',
    description: 'Join the inclusive 8-bit wellness community'
  },
  {
    name: 'frame-connect.png',
    title: 'Connect Your Wallet',
    subtitle: 'Start Your Wellness Journey',
    description: 'Connect your wallet to track steps and earn rewards'
  },
  {
    name: 'frame-leaderboard.png',
    title: 'Leaderboard',
    subtitle: 'Top Performers This Week',
    description: 'See who\'s leading the wellness challenge'
  },
  {
    name: 'frame-community.png',
    title: 'Join Our Community',
    subtitle: 'Connect with Fellow Wellness Enthusiasts',
    description: 'Join our Discord for tips, challenges, and support'
  }
];

function createFrameImage(config) {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some 8-bit style elements
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 10 + 5;
    ctx.fillRect(x, y, size, size);
  }

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(config.title, width / 2, 200);

  // Subtitle
  ctx.font = '24px Arial';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(config.subtitle, width / 2, 250);

  // Description
  ctx.font = '18px Arial';
  ctx.fillStyle = '#cbd5e0';
  ctx.fillText(config.description, width / 2, 300);

  // 10K logo/icon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Arial';
  ctx.fillText('🏃‍♂️ 10K', width / 2, 400);

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/${config.name}`, buffer);
  console.log(`Generated ${config.name}`);
}

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Generate all frame images
frameConfigs.forEach(createFrameImage);

console.log('All frame images generated successfully!'); 