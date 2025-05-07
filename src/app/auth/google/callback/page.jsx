"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    // Extract the access token from the URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      // Call the parent window's callback function
      if (window.opener && window.opener.handleGoogleCallback) {
        window.opener.handleGoogleCallback(accessToken);
        window.close();
      } else {
        // If no opener, store the token and redirect
        localStorage.setItem('google_access_token', accessToken);
        router.push('/');
      }
    } else {
      console.error('No access token found in redirect');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Google Authentication</h1>
        <p className="mb-4">Processing your authentication...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
