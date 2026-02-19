import React, { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { consentService } from '../services/consentService';
import { AgeVerificationModal } from './AgeVerificationModal';
import { ConsentGate } from './ConsentGate';
import './Login.css';

interface LoginProps {
    onViewPrivacyPolicy?: () => void;
    onViewTerms?: () => void;
}

const Login: React.FC<LoginProps> = ({ onViewPrivacyPolicy, onViewTerms }) => {
    const { login } = useAuth();
    const [showAgeVerification, setShowAgeVerification] = useState(false);
    const [showConsentGate, setShowConsentGate] = useState(false);
    const [tempAuthResponse, setTempAuthResponse] = useState<any>(null);

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        try {
            if (!credentialResponse.credential) {
                console.error('No credential in response');
                return;
            }

            const authResponse = await authService.loginWithGoogle(credentialResponse.credential);
            
            // Check if age verification is required
            if (authResponse.requiresAgeVerification) {
                setTempAuthResponse(authResponse);
                setShowAgeVerification(true);
                return;
            }

            // Check if consents are required
            const consentStatus = await consentService.getConsentStatus(authResponse.token);
            const hasAllConsents = consentStatus.allGranted;

            if (!hasAllConsents) {
                setTempAuthResponse(authResponse);
                setShowConsentGate(true);
                return;
            }

            // All checks passed, log in
            login(authResponse);
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please try again.');
        }
    };

    const handleAgeVerify = async (dateOfBirth: string) => {
        if (!tempAuthResponse) return;

        try {
            await authService.verifyAge(tempAuthResponse.token, dateOfBirth);
            
            // Update the user object with verified status
            const updatedUser = { ...tempAuthResponse.user, ageVerified: true, dateOfBirth };
            setTempAuthResponse({ ...tempAuthResponse, user: updatedUser, requiresAgeVerification: false });
            
            setShowAgeVerification(false);

            // Now check consents
            const consentStatus = await consentService.getConsentStatus(tempAuthResponse.token);
            const hasAllConsents = consentStatus.allGranted;

            if (!hasAllConsents) {
                setShowConsentGate(true);
            } else {
                login({ ...tempAuthResponse, user: updatedUser });
            }
        } catch (error: any) {
            throw error; // Let the modal handle the error
        }
    };

    const handleCancelAgeVerification = () => {
        setShowAgeVerification(false);
        setTempAuthResponse(null);
    };

    const handleAcceptConsents = async () => {
        if (!tempAuthResponse) return;

        try {
            const versions = await consentService.getConsentVersions(tempAuthResponse.token);
            
            // Record all consents
            await Promise.all([
                consentService.recordConsent(tempAuthResponse.token, 'TermsOfService', versions.termsOfService || '1.0', true),
                consentService.recordConsent(tempAuthResponse.token, 'PrivacyPolicy', versions.privacyPolicy || '1.0', true),
                consentService.recordConsent(tempAuthResponse.token, 'AIAnalysis', versions.aiProcessing || '1.0', true),
            ]);

            setShowConsentGate(false);
            login(tempAuthResponse);
        } catch (error: any) {
            throw error; // Let the modal handle the error
        }
    };

    const handleDeclineConsents = () => {
        setShowConsentGate(false);
        setTempAuthResponse(null);
        alert('You must accept the terms and policies to use this service.');
    };

    const handleGoogleError = () => {
        console.error('Google login failed');
        alert('Google login failed. Please try again.');
    };

    return (
        <>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Inside Journal</h1>
                        <p>Your private space for mental wellness</p>
                    </div>
                    
                    <div className="login-content">
                        <h2>Welcome</h2>
                        <p className="login-subtitle">Sign in to access your journal</p>
                        
                        <div className="google-login-wrapper">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                                theme="filled_blue"
                                size="large"
                                text="signin_with"
                                shape="rectangular"
                            />
                        </div>
                    </div>

                    <div className="login-footer">
                        <p>
                            By signing in, you agree to our{' '}
                            <a 
                                href="#" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (onViewTerms) {
                                        onViewTerms();
                                    }
                                }}
                                style={{ 
                                    color: '#4285f4', 
                                    textDecoration: 'underline',
                                    cursor: 'pointer'
                                }}
                            >
                                terms of service
                            </a>
                            {' '}and{' '}
                            <a 
                                href="#" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (onViewPrivacyPolicy) {
                                        onViewPrivacyPolicy();
                                    }
                                }}
                                style={{ 
                                    color: '#4285f4', 
                                    textDecoration: 'underline',
                                    cursor: 'pointer'
                                }}
                            >
                                privacy policy
                            </a>.
                        </p>
                    </div>
                </div>
            </div>

            {showAgeVerification && (
                <AgeVerificationModal
                    onVerify={handleAgeVerify}
                    onCancel={handleCancelAgeVerification}
                />
            )}

            {showConsentGate && (
                <ConsentGate
                    onAcceptAll={handleAcceptConsents}
                    onDecline={handleDeclineConsents}
                />
            )}
        </>
    );
};

export default Login;
