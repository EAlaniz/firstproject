import axios from 'axios';

export async function resolveFarcasterHandle(handle: string): Promise<string | null> {
  const username = handle.replace(/^@/, '');
  try {
    const response = await axios.get(
      `https://client.warpcast.com/v2/user-by-username?username=${username}`
    );
    return response.data?.result?.user?.verifiedAddresses?.ethAddresses?.[0] ?? null;
  } catch (err) {
    console.error(`Error resolving Farcaster handle: ${err}`);
    return null;
  }
} 