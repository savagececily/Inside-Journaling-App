import { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import './UpgradeModal.css';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
}

export default function UpgradeModal({ isOpen, onClose, token }: UpgradeModalProps) {
  const [loadingTier, setLoadingTier] = useState<'premium' | 'pro' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tier: 'premium' | 'pro') => {
    try {
      setLoadingTier(tier);
      setError(null);

      const authToken = token || localStorage.getItem('token') || localStorage.getItem('authToken') || '';

      const response = await fetch(`${API_BASE_URL}/user/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start upgrade process');
      setLoadingTier(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upgrade-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>x</button>
        
        <div className="upgrade-modal-header">
          <h2>Upgrade Your Subscription</h2>
          <p>Choose the plan that best supports your mental wellness journey</p>
        </div>

        {error && <div className="error-message" style={{ color: '#e53e3e', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Premium</h3>
            <div className="price">$4.99<span>/month</span></div>
            
            <ul>
              <li>Unlimited AI entry analysis</li>
              <li>Unlimited voice-to-text</li>
              <li>250 Virtual Support messages/mo</li>
              <li>Advanced analytics & insights</li>
              <li>Export your journal data</li>
            </ul>

            <button 
              className="select-plan-button"
              onClick={() => handleUpgrade('premium')}
              disabled={loadingTier !== null}
            >
              {loadingTier === 'premium' ? 'Redirecting...' : 'Select Premium'}
            </button>
          </div>

          <div className="pricing-card featured">
            <div className="badge">Most Popular</div>
            <h3>Pro Companion</h3>
            <div className="price">$9.99<span>/month</span></div>
            
            <ul>
              <li>Everything in Premium</li>
              <li>Unlimited Virtual Support messages</li>
              <li>Priority AI processing</li>
              <li>Dedicated customer support</li>
              <li>Early access to new companion capabilities</li>
            </ul>

            <button 
              className="select-plan-button"
              onClick={() => handleUpgrade('pro')}
              disabled={loadingTier !== null}
            >
              {loadingTier === 'pro' ? 'Redirecting...' : 'Select Pro Companion'}
            </button>
          </div>
        </div>
        
        <p className="payment-note">
          Secure payment powered by Stripe
          <br />
          Cancel anytime from your account settings
        </p>
      </div>
    </div>
  );
}
