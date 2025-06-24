import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

async function generateOpengraphImage() {
  // Create canvas (1200x630 for opengraph)
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  
  // Set background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);
  
  // Add some geometric shapes for visual interest
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(1000, 150, 100, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(150, 450, 80, 0, Math.PI * 2);
  ctx.fill();
  
  // Add main text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 72px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('10K', 600, 200);
  
  // Add subtitle
  ctx.font = '36px Arial, sans-serif';
  ctx.fillText('Move. Earn. Connect.', 600, 260);
  
  // Add description
  ctx.font = '24px Arial, sans-serif';
  ctx.fillText('Track your steps, earn tokens, and connect with friends', 600, 320);
  ctx.fillText('on Base Chain', 600, 350);
  
  // Add step icon
  ctx.font = '48px Arial, sans-serif';
  ctx.fillText('🚶‍♂️', 600, 420);
  
  // Add bottom text
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText('Wellness • Fitness • Community', 600, 580);
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('public/opengraph-image.png', buffer);
  
  console.log('✅ Opengraph image generated: public/opengraph-image.png');
}

generateOpengraphImage().catch(console.error); 