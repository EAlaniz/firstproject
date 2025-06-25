import axios from 'axios';

export async function resolveFarcasterHandle(handle: string): Promise<string | null> {
  const username = handle.replace(/^@/, '');
  if (!/^([a-zA-Z0-9_]+)$/.test(username)) return null;
  try {
    const response = await axios.get(
      `https://client.warpcast.com/v2/user-by-username?username=${username}`
    );
    const eth = response.data?.result?.user?.verifiedAddresses?.ethAddresses?.[0] ?? null;
    if (!eth || !/^0x[a-fA-F0-9]{40}$/.test(eth)) return null;
    return eth;
  } catch (err) {
    console.error(`Error resolving Farcaster handle: ${err}`);
    return null;
  }
} 