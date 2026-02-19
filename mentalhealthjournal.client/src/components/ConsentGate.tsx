import React, { useState, useEffect } from 'react';
import './ConsentGate.css';

interface ConsentGateProps {
    onAcceptAll: () => Promise<void>;
    onDecline: () => void;
    onViewTerms: () => void;
    onViewPrivacy: () => void;
}

type ViewMode = 'consent' | 'terms' | 'privacy';

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
    const [viewMode, setViewMode] = useState<ViewMode>('consent');
    const [termsContent, setTermsContent] = useState<string>('');
    const [privacyContent, setPrivacyContent] = useState<string>('');
    const [loadingDocument, setLoadingDocument] = useState(false);

    // Load document content when view mode changes
    useEffect(() => {
        const loadDocument = async (url: string, setter: (content: string) => void) => {
            setLoadingDocument(true);
            try {
                const response = await fetch(url);
                const text = await response.text();
                setter(text);
            } catch (error) {
                console.error('Error loading document:', error);
                setter('Failed to load document. Please try again.');
            } finally {
                setLoadingDocument(false);
            }
        };

        if (viewMode === 'terms' && !termsContent) {
            loadDocument('/TERMS_OF_SERVICE.md', setTermsContent);
        } else if (viewMode === 'privacy' && !privacyContent) {
            loadDocument('/PRIVACY_POLICY.md', setPrivacyContent);
        }
    }, [viewMode, termsContent, privacyContent]);

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

    const handleViewTerms = (e: React.MouseEvent) => {
        e.preventDefault();
        setViewMode('terms');
    };

    const handleViewPrivacy = (e: React.MouseEvent) => {
        e.preventDefault();
        setViewMode('privacy');
    };

    const handleBackToConsent = () => {
        setViewMode('consent');
    };

    return (
        <div className="modal-overlay">
            <div className={`modal-content consent-gate-modal ${viewMode !== 'consent' ? 'document-view' : ''}`}>
                {viewMode === 'consent' ? (
                    <>
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
                                            onClick={handleViewTerms}
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
                                            onClick={handleViewPrivacy}
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
                    </>
                ) : (
                    <>
                        <div className="document-header">
                            <button 
                                type="button" 
                                className="back-button" 
                                onClick={handleBackToConsent}
                            >
                                ← Back to Consent
                            </button>
                            <h2>{viewMode === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</h2>
                        </div>
                        <div className="document-content">
                            {loadingDocument ? (
                                <div className="loading-document">Loading...</div>
                            ) : (
                                <pre className="document-text">
                                    {viewMode === 'terms' ? termsContent : privacyContent}
                                </pre>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
