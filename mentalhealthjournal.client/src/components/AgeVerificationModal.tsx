import React, { useState } from 'react';
import './AgeVerificationModal.css';

interface AgeVerificationModalProps {
    onVerify: (dateOfBirth: string) => Promise<void>;
    onCancel: () => void;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ onVerify, onCancel }) => {
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const calculateAge = (birthDate: Date): number => {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!dateOfBirth) {
            setError('Please enter your date of birth');
            return;
        }

        const birthDate = new Date(dateOfBirth);
        if (isNaN(birthDate.getTime())) {
            setError('Please enter a valid date');
            return;
        }
        const age = calculateAge(birthDate);

        if (age < 13) {
            setError('You must be at least 13 years old to use this service.');
            return;
        }

        if (age > 120) {
            setError('Please enter a valid date of birth');
            return;
        }

        setIsSubmitting(true);
        try {
            await onVerify(birthDate.toISOString());
        } catch (err: any) {
            setError(err.message || 'Age verification failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content age-verification-modal">
                <h2>Age Verification Required</h2>
                <p className="modal-description">
                    To comply with privacy regulations, we need to verify that you are at least 13 years old.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="dateOfBirth">Date of Birth</label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Verifying...' : 'Verify Age'}
                        </button>
                    </div>
                </form>

                <div className="privacy-note">
                    <small>
                        Your date of birth is used only for age verification and is securely stored.
                    </small>
                </div>
            </div>
        </div>
    );
};
