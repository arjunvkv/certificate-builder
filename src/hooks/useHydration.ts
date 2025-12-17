'use client';

import { useEffect, useState } from 'react';

export const useHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This effect only runs on the client
    setIsHydrated(true);
  }, []);

  return isHydrated;
};