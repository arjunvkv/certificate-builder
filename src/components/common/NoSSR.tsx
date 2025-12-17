'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

interface NoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const NoSSRWrapper = ({ children, fallback = null }: NoSSRProps) => {
  return <>{children}</>;
};

export const NoSSR = dynamic(() => Promise.resolve(NoSSRWrapper), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  ),
});