import React, { useState, useEffect } from 'react';
import './TermsOfService.css';

export const TermsOfService: React.FC = () => {
    const [termsContent, setTermsContent] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const loadTerms = () => {
        setLoading(true);
        setError('');
        
        fetch('/TERMS_OF_SERVICE.md')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load Terms of Service (Status: ${response.status})`);
                }
                return response.text();
            })
            .then(text => {
                setTermsContent(text);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading Terms of Service:', error);
                setError(error.message || 'Failed to load Terms of Service. Please try again.');
                setLoading(false);
            });
    };

    useEffect(() => {
        loadTerms();
    }, []);

    return (
        <div className="legal-document">
            <div className="legal-document-header">
                <h1>Terms of Service</h1>
                <p className="document-meta">Last Updated: February 11, 2026</p>
            </div>
            <div className="legal-document-content">
                {loading && (
                    <div className="loading-message">
                        <p>Loading Terms of Service...</p>
                    </div>
                )}
                {error && (
                    <div className="error-message">
                        <p className="error-text">⚠️ {error}</p>
                        <button className="retry-button" onClick={loadTerms}>
                            Try Again
                        </button>
                    </div>
                )}
                {!loading && !error && (
                    <pre>{termsContent}</pre>
                )}
            </div>
        </div>
    );
};
