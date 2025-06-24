import { SHARE_CONFIG } from '../constants';

export const shareToPlatform = async (platform: string, steps: number): Promise<void> => {
  const shareText = SHARE_CONFIG.defaultText(steps);
  const shareUrl = window.location.origin;
  
  switch (platform) {
    case SHARE_CONFIG.platforms.twitter:
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, 
        '_blank'
      );
      break;
      
    case SHARE_CONFIG.platforms.copy:
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        return Promise.resolve();
      } catch (err) {
        console.error('Failed to copy:', err);
        return Promise.reject(err);
      }
      
    case SHARE_CONFIG.platforms.native:
      if (navigator.share) {
        try {
          await navigator.share({
            title: '10K - Move. Earn. Connect.',
            text: shareText,
            url: shareUrl,
          });
        } catch (err) {
          console.error('Error sharing:', err);
          return Promise.reject(err);
        }
      }
      break;
      
    default:
      console.warn(`Unknown platform: ${platform}`);
  }
}; 