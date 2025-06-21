import fs from 'fs';
import { createCanvas } from 'canvas';

// Create frame images for Farcaster
const frameConfigs = [
  {
    name: 'frame-image.png',
    title: '10K',
    subtitle: 'Move. Earn. Connect.',
    description: 'Inclusive 8-bit wellness app for step tracking, social connection, and token rewards'
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

  // Background gradient matching landing page
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(0.5, '#764ba2');
  gradient.addColorStop(1, '#f093fb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle 8-bit style pixel elements
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 8 + 2;
    ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
  }

  // Main title with larger, bolder font
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(config.title, width / 2, 180);

  // Subtitle with the tagline
  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(config.subtitle, width / 2, 240);

  // Description
  ctx.font = '20px Arial, sans-serif';
  ctx.fillStyle = '#cbd5e0';
  ctx.fillText(config.description, width / 2, 300);

  // 10K logo/icon with emoji
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.fillText('🏃‍♂️', width / 2, 380);

  // Add a subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

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
