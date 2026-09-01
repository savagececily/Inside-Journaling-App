import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppInsightsContext } from '@microsoft/applicationinsights-react-js'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './contexts/AuthContext'
import { reactPlugin } from './appInsights'
import './index.css'
import App from './App.tsx'
import * as serviceWorkerRegistration from './registerServiceWorker'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInsightsContext.Provider value={reactPlugin}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </AppInsightsContext.Provider>
  </StrictMode>,
)

// Register service worker for offline support
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('Service Worker registered successfully - App is ready for offline use');
  },
  onUpdate: (registration) => {
    console.log('New version available - Please refresh to update');
    
    // Optionally, you can show a toast/notification to the user
    if (confirm('A new version is available! Reload to update?')) {
      const waitingWorker = registration.waiting;
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        waitingWorker.addEventListener('statechange', (event: Event) => {
          const target = event.target as ServiceWorker;
          if (target.state === 'activated') {
            window.location.reload();
          }
        });
      }
    }
  },
  onOffline: () => {
    console.log('App is offline - Using cached data');
  },
  onOnline: () => {
    console.log('App is back online');
  },
});

