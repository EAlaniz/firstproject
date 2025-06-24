const nacl = require('tweetnacl');
const base64url = require('base64url');
const fs = require('fs');

// Generate a new Ed25519 keypair
function generateKeypair() {
  return nacl.sign.keyPair();
}

// Create account association signature
function createAccountAssociation(secretKey, domain) {
  const header = { alg: "EdDSA", typ: "JWT" };
  const payload = {
    domain,
    timestamp: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + 86400 // 24h expiry
  };

  const encodedHeader = base64url.encode(JSON.stringify(header));
  const encodedPayload = base64url.encode(JSON.stringify(payload));

  const message = `${encodedHeader}.${encodedPayload}`;
  const messageBytes = Buffer.from(message);
  const signature = nacl.sign.detached(messageBytes, secretKey);

  return {
    header: encodedHeader,
    payload: encodedPayload,
    signature: base64url.encode(Buffer.from(signature))
  };
}

// Main function
function main() {
  console.log('🔑 Generating Farcaster Mini App Keys...\n');

  // Generate keypair
  const keypair = generateKeypair();
  const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
  const publicKeyBase64 = Buffer.from(keypair.publicKey).toString('base64');

  console.log('✅ Private Key Generated:');
  console.log(`Private Key (Base64): ${privateKeyBase64}\n`);
  console.log('✅ Public Key Generated:');
  console.log(`Public Key (Base64): ${publicKeyBase64}\n`);

  // Create account association
  const domain = 'www.move10k.xyz';
  const accountAssociation = createAccountAssociation(keypair.secretKey, domain);

  console.log('✅ Account Association Created:');
  console.log(JSON.stringify(accountAssociation, null, 2));

  console.log('\n📝 Next Steps:');
  console.log('1. Save the private key securely (you\'ll need it for future signatures)');
  console.log('2. Update your manifest with the accountAssociation object above');
  console.log('3. The signature expires in 24 hours - you\'ll need to regenerate it');

  // Save to file
  const keyData = {
    privateKey: privateKeyBase64,
    publicKey: publicKeyBase64,
    accountAssociation,
    generatedAt: new Date().toISOString(),
    domain
  };

  fs.writeFileSync('farcaster-keys.json', JSON.stringify(keyData, null, 2));
  console.log('\n💾 Keys saved to farcaster-keys.json');
}

main(); 