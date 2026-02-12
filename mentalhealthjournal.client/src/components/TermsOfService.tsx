import React, { useState, useEffect } from 'react';
import './TermsOfService.css';

export const TermsOfService: React.FC = () => {
    const [termsContent, setTermsContent] = useState<string>('');

    useEffect(() => {
        // Load terms from the markdown file
        fetch('/TERMS_OF_SERVICE.md')
            .then(response => response.text())
            .then(text => setTermsContent(text))
            .catch(error => console.error('Error loading Terms of Service:', error));
    }, []);

    return (
        <div className="legal-document">
            <div className="legal-document-header">
                <h1>Terms of Service</h1>
                <p className="document-meta">Last Updated: February 11, 2026</p>
            </div>
            <div className="legal-document-content">
                <pre>{termsContent}</pre>
            </div>
        </div>
    );
};
