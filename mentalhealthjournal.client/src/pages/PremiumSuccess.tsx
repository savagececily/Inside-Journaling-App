import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PremiumSuccess() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Detect if opened from mobile app
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMobileDevice = /android|iphone|ipad|ipod/i.test(userAgent);
    setIsMobile(isMobileDevice);

    // Auto-redirect after countdown (only for web)
    if (!isMobileDevice) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [navigate]);

  return (
    <div className="premium-success-container">
      <div className="success-card">
        <div className="success-icon">🎉</div>
        
        <h1>Welcome to Premium!</h1>
        <p className="success-message">
          Your subscription has been activated successfully.
        </p>

        <div className="benefits">
          <h3>What's included:</h3>
          <ul>
            <li>✅ Unlimited AI journal analysis</li>
            <li>✅ Unlimited voice-to-text transcription</li>
            <li>✅ Priority support</li>
            <li>✅ Advanced insights and trends</li>
            <li>✅ Data export capabilities</li>
          </ul>
        </div>

        {isMobile ? (
          <>
            <p className="mobile-message">
              You may now close this page and return to the app.
            </p>
            <button 
              className="close-button"
              onClick={() => window.close()}
            >
              Close This Page
            </button>
          </>
        ) : (
          <>
            <p className="redirect-message">
              Redirecting to dashboard in {countdown} seconds...
            </p>
            <button 
              className="dashboard-button"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard Now
            </button>
          </>
        )}

        <div className="support-note">
          Need help? Contact us at support@mentalhealthjournal.com
        </div>
      </div>
    </div>
  );
}
