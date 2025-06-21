import fs from 'fs';
import { createCanvas } from 'canvas';

const size = 192;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#667eea';
ctx.fillRect(0, 0, size, size);

// White circle
ctx.beginPath();
ctx.arc(size/2, size/2, size/2 - 8, 0, 2 * Math.PI);
ctx.fillStyle = '#fff';
ctx.fill();

// 10K text
ctx.font = 'bold 64px Arial';
ctx.fillStyle = '#667eea';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('10K', size/2, size/2);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/10k-icon.png', buffer);
console.log('Generated public/10k-icon.png'); 