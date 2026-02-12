import React, { useState } from 'react';
import './ConsentGate.css';

interface ConsentGateProps {
    onAcceptAll: () => Promise<void>;
    onDecline: () => void;
    onViewTerms: () => void;
    onViewPrivacy: () => void;
}

export const ConsentGate: React.FC<ConsentGateProps> = ({ 
    onAcceptAll, 
    onDecline,
    onViewTerms,
    onViewPrivacy 
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [acceptedAI, setAcceptedAI] = useState(false);
    const [error, setError] = useState('');

    const handleAcceptAll = async () => {
        if (!acceptedTerms || !acceptedPrivacy || !acceptedAI) {
            setError('Please accept all required terms to continue');
            return;
        }

        setError('');
        setIsSubmitting(true);
        
        try {
            await onAcceptAll();
        } catch (err: any) {
            setError(err.message || 'Failed to record consent. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content consent-gate-modal">
                <h2>Welcome to Inside Journal</h2>
                <p className="modal-description">
                    Before you continue, please review and accept our terms and policies.
                </p>

                <div className="consent-items">
                    <div className="consent-item">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                disabled={isSubmitting}
                            />
                            <span>
                                I accept the{' '}
                                <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); onViewTerms(); }}
                                    className="link"
                                >
                                    Terms of Service
                                </a>
                            </span>
                        </label>
                    </div>

                    <div className="consent-item">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={acceptedPrivacy}
                                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                disabled={isSubmitting}
                            />
                            <span>
                                I accept the{' '}
                                <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); onViewPrivacy(); }}
                                    className="link"
                                >
                                    Privacy Policy
                                </a>
                            </span>
                        </label>
                    </div>

                    <div className="consent-item">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={acceptedAI}
                                onChange={(e) => setAcceptedAI(e.target.checked)}
                                disabled={isSubmitting}
                            />
                            <span>
                                I consent to AI processing of my journal entries for sentiment analysis
                                and personalized insights
                            </span>
                        </label>
                        <p className="consent-description">
                            This allows us to provide sentiment analysis, key phrase detection, 
                            personalized affirmations, and crisis detection.
                        </p>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                    <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={onDecline}
                        disabled={isSubmitting}
                    >
                        Decline
                    </button>
                    <button 
                        type="button" 
                        className="btn-primary"
                        onClick={handleAcceptAll}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Accept & Continue'}
                    </button>
                </div>

                <div className="privacy-note">
                    <small>
                        By accepting, you confirm that you have read and understood our policies. 
                        You can review or withdraw your consent at any time in Settings.
                    </small>
                </div>
            </div>
        </div>
    );
};
