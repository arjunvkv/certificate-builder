import { useEffect } from 'react';
import { useCertificateStore } from '@/store/certificateStore';

export const useImagePersistence = () => {
  const { convertBgImageToBase64, convertElementImagesToBase64 } = useCertificateStore();

  useEffect(() => {
    // Convert images to base64 when page becomes hidden (user navigating away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Convert all images to base64 for persistence
        convertBgImageToBase64();
        convertElementImagesToBase64();
      }
    };

    // Convert images before page unload
    const handleBeforeUnload = () => {
      convertBgImageToBase64();
      convertElementImagesToBase64();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [convertBgImageToBase64, convertElementImagesToBase64]);

  // Auto-convert images periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      convertBgImageToBase64();
      convertElementImagesToBase64();
    }, 30000);

    return () => clearInterval(interval);
  }, [convertBgImageToBase64, convertElementImagesToBase64]);
};