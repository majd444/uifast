"use client";

import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// Google Client ID from environment variables
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleAuth({ onAuthSuccess, buttonText = "Sign in with Google" }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check if user is already authenticated from localStorage
    const storedUser = localStorage.getItem('google_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user", e);
        localStorage.removeItem('google_user');
      }
    }
  }, []);
  
  // This function will be called from window.handleGoogleCallback
  // which is set up as a global function to handle the OAuth redirect
  useEffect(() => {
    // Set up a global callback function that the OAuth popup can call
    window.handleGoogleCallback = (token) => {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
        
        // Store in localStorage for persistence
        localStorage.setItem('google_user', JSON.stringify(decoded));
        
        // Call the success callback with user info
        if (onAuthSuccess) {
          onAuthSuccess(decoded);
        }
      } catch (e) {
        console.error("Error handling Google callback", e);
      }
    };
    
    return () => {
      // Clean up the global function when component unmounts
      delete window.handleGoogleCallback;
    };
  }, [onAuthSuccess]);
  
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('google_user');
  };
  
  // Get redirect URI from environment variables with fallback
  const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback";
  console.log("Using redirect URI:", GOOGLE_REDIRECT_URI);
  
  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={(error) => console.error("Google script failed to load", error)}
    >
      <div className="flex flex-col items-center">
        {!user ? (
          <div>
            <button 
              onClick={() => {
                // Custom button to replace GoogleLogin component
                // This helps avoid the 403 errors from Google's button
                window.open(
                  `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=token&scope=email%20profile&prompt=consent`,
                  "_blank",
                  "width=500,height=600"
                );
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              {buttonText}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="text-sm font-medium">{user.name}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

// Helper component for connecting to specific Google services
export function GoogleServiceConnector({ service, isAuthenticated, onConnect }) {
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "http://localhost:3001/auth/google/callback";
  
  const GOOGLE_SERVICES = {
    gmail: {
      name: "Gmail",
      icon: "📧",
      scopes: ["https://www.googleapis.com/auth/gmail.readonly"]
    },
    drive: {
      name: "Google Drive",
      icon: "📁",
      scopes: ["https://www.googleapis.com/auth/drive.readonly"]
    },
    calendar: {
      name: "Google Calendar",
      icon: "📅",
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"]
    },
    sheets: {
      name: "Google Sheets",
      icon: "📊",
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    },
    docs: {
      name: "Google Docs",
      icon: "📝",
      scopes: ["https://www.googleapis.com/auth/documents.readonly"]
    }
  };
  
  const serviceInfo = GOOGLE_SERVICES[service];
  
  if (!serviceInfo) {
    return <div>Unknown Google service</div>;
  }
  
  const handleConnect = () => {
    // Create a custom OAuth URL with the specific scopes needed for this service
    const scopesParam = encodeURIComponent(serviceInfo.scopes.join(' '));
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=token&scope=email%20profile%20${scopesParam}&prompt=consent&access_type=offline`;
    
    // Open the authentication window
    window.open(authUrl, "_blank", "width=500,height=600");
    
    // Call the onConnect callback to update the parent component
    if (onConnect) {
      onConnect();
    }
  };
  
  return (
    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{serviceInfo.icon}</span>
          <div>
            <div className="font-medium">{serviceInfo.name}</div>
            <div className="text-xs text-gray-500">
              {isAuthenticated ? "Connected" : "Not connected"}
            </div>
          </div>
        </div>
        
        {!isAuthenticated ? (
          <button
            onClick={handleConnect}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Connect
          </button>
        ) : (
          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            ✓ Connected
          </div>
        )}
      </div>
    </div>
  );
}
