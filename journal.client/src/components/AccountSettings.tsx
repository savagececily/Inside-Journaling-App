import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../config/api';
import './AccountSettings.css';

interface AccountSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleted: () => void;
}

export function AccountSettings({ isOpen, onClose, onDeleted }: AccountSettingsProps) {
    const { token, user, updateUser } = useAuth();
    const [username, setUsername] = useState(user?.username ?? '');
    const [availability, setAvailability] = useState<boolean | null>(null);
    const [savingUsername, setSavingUsername] = useState(false);
    const [pausing, setPausing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setUsername(user?.username ?? '');
        setAvailability(null);
        setMessage('');
        setError('');
    }, [isOpen, user?.username]);

    useEffect(() => {
        if (!token || username.length < 3 || username === user?.username) {
            setAvailability(username === user?.username ? true : null);
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            const available = await authService.checkUsernameAvailability(token, username);
            if (!cancelled) setAvailability(available);
        }, 400);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [token, username, user?.username]);

    if (!isOpen || !user || !token) return null;

    const saveUsername = async () => {
        if (username === user.username) {
            setMessage('Your username is already up to date.');
            return;
        }

        if (!/^[a-z0-9_]{3,20}$/.test(username) || !availability) {
            setError('Choose an available username using 3-20 lowercase letters, numbers, or underscores.');
            return;
        }

        setSavingUsername(true);
        setError('');
        setMessage('');
        try {
            updateUser(await authService.updateUsername(token, username));
            setMessage('Username updated.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update username.');
        } finally {
            setSavingUsername(false);
        }
    };

    const pausePremiumPlan = async () => {
        if (!window.confirm('Pause your premium plan? Your account and journal entries will remain available on the free plan.')) return;

        setPausing(true);
        setError('');
        setMessage('');
        try {
            const response = await fetch(`${API_BASE_URL}/user/downgrade`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(await response.text() || 'Unable to pause your premium plan.');
            setMessage('Premium plan paused. Your account remains active on the free plan.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to pause your premium plan.');
        } finally {
            setPausing(false);
        }
    };

    const deleteAccount = async () => {
        const confirmation = window.prompt('This permanently deletes your journal, audio, profile, quota, and consent data. Type DELETE to continue.');
        if (confirmation !== 'DELETE') return;

        setDeleting(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/user/delete-account`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(await response.text() || 'Unable to delete your account.');
            onDeleted();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to delete your account.');
            setDeleting(false);
        }
    };

    return (
        <div className="account-settings-overlay" role="presentation" onClick={onClose}>
            <section className="account-settings-modal" role="dialog" aria-modal="true" aria-labelledby="account-settings-title" onClick={(event) => event.stopPropagation()}>
                <div className="account-settings-header">
                    <div>
                        <p className="account-settings-eyebrow">Account</p>
                        <h2 id="account-settings-title">Account settings</h2>
                    </div>
                    <button className="account-settings-close" onClick={onClose} aria-label="Close account settings">Close</button>
                </div>

                <div className="account-settings-section">
                    <h3>Username</h3>
                    <p>Change the name shown across your journal.</p>
                    <div className="account-username-row">
                        <input
                            value={username}
                            onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            maxLength={20}
                            aria-label="Username"
                        />
                        <button onClick={saveUsername} disabled={savingUsername || availability === false || username.length < 3}>
                            {savingUsername ? 'Saving...' : 'Save username'}
                        </button>
                    </div>
                    {username.length >= 3 && username !== user.username && availability !== null && (
                        <p className={availability ? 'account-status-success' : 'account-status-error'}>{availability ? 'Username available' : 'Username already taken'}</p>
                    )}
                </div>

                <div className="account-settings-section">
                    <h3>Premium plan</h3>
                    <p>Pause premium billing while keeping your account and journal data.</p>
                    <button className="account-secondary-button" onClick={pausePremiumPlan} disabled={pausing}>
                        {pausing ? 'Pausing...' : 'Pause premium plan'}
                    </button>
                </div>

                <div className="account-settings-danger">
                    <h3>Delete account</h3>
                    <p>Permanently delete your journal entries, audio files, profile, and account data.</p>
                    <button className="account-danger-button" onClick={deleteAccount} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete my account'}
                    </button>
                </div>

                {message && <p className="account-status-success" role="status">{message}</p>}
                {error && <p className="account-status-error" role="alert">{error}</p>}
            </section>
        </div>
    );
}
