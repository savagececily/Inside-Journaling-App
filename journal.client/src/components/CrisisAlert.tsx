import React from 'react';
import './CrisisAlert.css';

interface CrisisResource {
    name: string;
    phoneNumber: string;
    textNumber: string;
    description: string;
    url: string;
    isAvailable24_7: boolean;
}

interface CrisisAlertProps {
    isVisible: boolean;
    reason?: string;
    resources: CrisisResource[];
    onClose: () => void;
}

const CrisisAlert: React.FC<CrisisAlertProps> = ({ isVisible, reason, resources, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="crisis-alert-overlay">
            <div className="crisis-alert-modal">
                <div className="crisis-alert-header">
                    <div className="crisis-icon">⚠️</div>
                    <h2>Support Resources Available</h2>
                </div>
                
                <div className="crisis-alert-content">
                    <div className="emergency-disclaimer">
                        <p style={{ 
                            background: '#dc3545', 
                            color: 'white', 
                            padding: '12px', 
                            borderRadius: '6px', 
                            fontWeight: 'bold',
                            marginBottom: '16px'
                        }}>
                            ⚠️ EMERGENCY: If you are in immediate danger or experiencing a medical emergency, 
                            call 911 (US) or your local emergency number immediately.
                        </p>
                        <p style={{ 
                            fontSize: '13px', 
                            color: '#666', 
                            marginBottom: '20px',
                            fontStyle: 'italic'
                        }}>
                            These resources are for informational purposes only and do not constitute medical advice, 
                            diagnosis, or treatment. This app is not a substitute for professional mental health care.
                        </p>
                    </div>
                    
                    {reason && (
                        <div className="crisis-reason">
                            <p><strong>Why you're seeing this:</strong> {reason}</p>
                        </div>
                    )}
                    
                    <div className="crisis-message">
                        <p><strong>You're not alone.</strong> If you're experiencing thoughts of self-harm or suicide, please reach out for immediate support:</p>
                    </div>

                    <div className="crisis-resources">
                        {resources.map((resource, index) => (
                            <div key={index} className="crisis-resource-card">
                                <div className="resource-header">
                                    <h3>{resource.name}</h3>
                                    {resource.isAvailable24_7 && <span className="badge-24-7">24/7</span>}
                                </div>
                                <p className="resource-description">{resource.description}</p>
                                <div className="resource-contact">
                                    {resource.phoneNumber && (
                                        <a href={`tel:${resource.phoneNumber.replace(/[^0-9]/g, '')}`} className="contact-button phone">
                                            📞 Call: {resource.phoneNumber}
                                        </a>
                                    )}
                                    {resource.textNumber && (
                                        <a href={`sms:${resource.textNumber.replace(/[^0-9]/g, '')}`} className="contact-button text">
                                            💬 Text: {resource.textNumber}
                                        </a>
                                    )}
                                    {resource.url && (
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="contact-button web">
                                            🌐 Visit Website
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="crisis-safety-note">
                        <p><strong>Emergency:</strong> If you're in immediate danger, please call 911 or go to your nearest emergency room.</p>
                    </div>
                </div>

                <div className="crisis-alert-footer">
                    <button onClick={onClose} className="close-button">I understand</button>
                </div>
            </div>
        </div>
    );
};

export default CrisisAlert;
