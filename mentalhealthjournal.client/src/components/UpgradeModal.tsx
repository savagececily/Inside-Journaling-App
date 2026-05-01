import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// Replace with your actual Stripe publishable key in production
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call your backend to create a Stripe Checkout session
      const response = await fetch('/api/user/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start upgrade process');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Upgrade to Premium</h2>
        
        <div className="pricing-card">
          <div className="price">$4.99<span>/month</span></div>
          
          <ul className="features">
            <li>✅ Unlimited AI analysis</li>
            <li>✅ Unlimited voice-to-text</li>
            <li>✅ Priority support</li>
            <li>✅ Advanced insights</li>
            <li>✅ Export your journal data</li>
          </ul>

          <p className="free-tier">Free tier: 50 AI analyses/month, 10 voice transcriptions/month</p>
          
          <button 
            className="upgrade-button"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Upgrade Now'}
          </button>

          {error && <div className="error-message">{error}</div>}
          
          <p className="payment-note">
            Secure payment powered by Stripe
            <br />
            Cancel anytime from your account settings
          </p>
        </div>
      </div>
    </div>
  );
}
