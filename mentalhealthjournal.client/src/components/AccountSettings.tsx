import { useState } from 'react';
import { authService } from '../services/authService';

interface AccountSettingsProps {
    token: string;
    onLogout: () => void;
    userName?: string;
}

export const AccountSettings = ({ token, onLogout, userName }: AccountSettingsProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteStep, setDeleteStep] = useState<'initial' | 'confirm' | 'final'>('initial');
    const [confirmationToken, setConfirmationToken] = useState('');
    const [expiresAt, setExpiresAt] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userConfirmationToken, setUserConfirmationToken] = useState('');

    const handleRequestDeletion = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await authService.requestAccountDeletion(token);
            setConfirmationToken(response.confirmationToken);
            setExpiresAt(new Date(response.expiresAt).toLocaleString());
            setDeleteStep('confirm');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to request account deletion');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDeletion = async () => {
        if (userConfirmationToken !== confirmationToken) {
            setError('Confirmation token does not match. Please copy it exactly.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await authService.confirmAccountDeletion(token, userConfirmationToken);
            setDeleteStep('final');
            // Wait a moment to show the final message, then logout
            setTimeout(() => {
                onLogout();
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to confirm account deletion');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowDeleteConfirm(false);
        setDeleteStep('initial');
        setError(null);
        setUserConfirmationToken('');
        setConfirmationToken('');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Account Settings</h2>
            
            {userName && (
                <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <p style={{ margin: 0 }}><strong>Account:</strong> {userName}</p>
                </div>
            )}

            <div style={{ 
                marginTop: '40px', 
                padding: '20px', 
                border: '1px solid #dc3545', 
                borderRadius: '8px',
                backgroundColor: '#fff5f5'
            }}>
                <h3 style={{ color: '#dc3545', marginTop: 0 }}>Danger Zone</h3>
                
                {!showDeleteConfirm ? (
                    <>
                        <p style={{ marginBottom: '15px' }}>
                            Once you delete your account, there is no going back. This will permanently delete all your journal entries, audio recordings, and account data.
                        </p>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Delete My Account
                        </button>
                    </>
                ) : (
                    <div>
                        {deleteStep === 'initial' && (
                            <div>
                                <h4>⚠️ Are you absolutely sure?</h4>
                                <p style={{ marginBottom: '15px' }}>
                                    This action <strong>cannot be undone</strong>. This will permanently delete:
                                </p>
                                <ul style={{ marginBottom: '20px', lineHeight: '1.8' }}>
                                    <li>All your journal entries</li>
                                    <li>All your voice recordings</li>
                                    <li>Your account information</li>
                                    <li>All associated data</li>
                                </ul>
                                <p style={{ marginBottom: '20px', color: '#856404', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                                    <strong>Note:</strong> You will have 24 hours to complete the deletion after requesting it.
                                </p>
                                
                                {error && (
                                    <div style={{ 
                                        padding: '10px', 
                                        backgroundColor: '#f8d7da', 
                                        color: '#721c24',
                                        borderRadius: '4px',
                                        marginBottom: '15px'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={handleRequestDeletion}
                                        disabled={loading}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '16px',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? 'Processing...' : 'Yes, Delete My Account'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '16px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {deleteStep === 'confirm' && (
                            <div>
                                <h4>✅ Deletion Request Created</h4>
                                <p style={{ marginBottom: '15px' }}>
                                    A confirmation token has been generated. Please copy and paste it below to complete the deletion.
                                </p>
                                <p style={{ marginBottom: '10px', color: '#856404', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                                    <strong>Token expires:</strong> {expiresAt}
                                </p>
                                
                                <div style={{ 
                                    padding: '15px', 
                                    backgroundColor: '#e7f3ff', 
                                    borderRadius: '4px',
                                    marginBottom: '20px',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all'
                                }}>
                                    <strong>Confirmation Token:</strong><br/>
                                    <div style={{ marginTop: '10px', fontSize: '14px' }}>
                                        {confirmationToken}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(confirmationToken);
                                        }}
                                        style={{
                                            marginTop: '10px',
                                            padding: '5px 10px',
                                            fontSize: '12px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Copy to Clipboard
                                    </button>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label htmlFor="confirmToken" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Paste Confirmation Token:
                                    </label>
                                    <input
                                        id="confirmToken"
                                        type="text"
                                        value={userConfirmationToken}
                                        onChange={(e) => setUserConfirmationToken(e.target.value)}
                                        placeholder="Paste the confirmation token here"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            fontSize: '14px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                </div>

                                {error && (
                                    <div style={{ 
                                        padding: '10px', 
                                        backgroundColor: '#f8d7da', 
                                        color: '#721c24',
                                        borderRadius: '4px',
                                        marginBottom: '15px'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={handleConfirmDeletion}
                                        disabled={loading || !userConfirmationToken}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: (loading || !userConfirmationToken) ? 'not-allowed' : 'pointer',
                                            fontSize: '16px',
                                            opacity: (loading || !userConfirmationToken) ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? 'Deleting...' : 'Confirm and Delete All Data'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '16px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {deleteStep === 'final' && (
                            <div>
                                <h4>✅ Account Deleted</h4>
                                <p style={{ marginBottom: '15px' }}>
                                    Your account and all associated data have been permanently deleted. You will be logged out shortly.
                                </p>
                                <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                                    Thank you for using Mental Health Journal. Take care!
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
