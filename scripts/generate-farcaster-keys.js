const { randomBytes, createHash } = require('crypto');
const { sign, utils } = require('@noble/ed25519');
const base64url = require('base64url');
const fs = require('fs');

// Patch noble/ed25519 to use Node's sha512
if (!utils.sha512Sync) {
  utils.sha512Sync = (msg) => createHash('sha512').update(msg).digest();
  console.log('Patched noble/ed25519 to use Node.js sha512');
}

// Generate a new Ed25519 private key
function generatePrivateKey() {
  return randomBytes(32);
}

// Create account association signature
async function createAccountAssociation(privateKey, domain) {
  const header = { alg: "EdDSA", typ: "JWT" };
  const payload = {
    domain,
    timestamp: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + 86400 // 24h expiry
  };

  const encodedHeader = base64url.encode(JSON.stringify(header));
  const encodedPayload = base64url.encode(JSON.stringify(payload));
  
  const message = `${encodedHeader}.${encodedPayload}`;
  // Convert message to Uint8Array for signing
  const messageBytes = Buffer.from(message);
  const privateKeyBytes = new Uint8Array(privateKey);
  if (!utils.sha512Sync) throw new Error('sha512Sync not set');
  const signature = await sign(messageBytes, privateKeyBytes);

  return {
    header: encodedHeader,
    payload: encodedPayload,
    signature: base64url.encode(signature)
  };
}

// Main function
async function main() {
  console.log('🔑 Generating Farcaster Mini App Keys...\n');
  
  // Generate private key
  const privateKey = generatePrivateKey();
  const privateKeyBase64 = privateKey.toString('base64');
  
  console.log('✅ Private Key Generated:');
  console.log(`Private Key (Base64): ${privateKeyBase64}\n`);
  
  // Create account association
  const domain = 'www.move10k.xyz';
  const accountAssociation = await createAccountAssociation(privateKey, domain);
  
  console.log('✅ Account Association Created:');
  console.log(JSON.stringify(accountAssociation, null, 2));
  
  console.log('\n📝 Next Steps:');
  console.log('1. Save the private key securely (you\'ll need it for future signatures)');
  console.log('2. Update your manifest with the accountAssociation object above');
  console.log('3. The signature expires in 24 hours - you\'ll need to regenerate it');
  
  // Save to file
  const keyData = {
    privateKey: privateKeyBase64,
    accountAssociation,
    generatedAt: new Date().toISOString(),
    domain
  };
  
  fs.writeFileSync('farcaster-keys.json', JSON.stringify(keyData, null, 2));
  console.log('\n💾 Keys saved to farcaster-keys.json');
}

main().catch(console.error); 