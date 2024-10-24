import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../firebase.ts';
import { useAuth } from '../../hooks/useAuth.ts';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        try {
            await updateProfile(user, {
                displayName: displayName
            });

            setSuccess('Profile updated successfully!');
            setError('');
            setIsEditing(false);
        } catch (err) {
            setError('Failed to update profile');
            setSuccess('');
        }
    };

    return (
        <div>
            <h1>Profile</h1>

            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>{success}</div>}

            <div>
                <p>Email: {user?.email}</p>

                {isEditing ? (
                    <form onSubmit={handleUpdateProfile}>
                        <div>
                            <label htmlFor="displayName">Display Name:</label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit">Save Changes</button>
                        <button type="button" onClick={() => setIsEditing(false)}>
                            Cancel
                        </button>
                    </form>
                ) : (
                    <div>
                        <p>Display Name: {user?.displayName || 'Not set'}</p>
                        <button onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </button>
                    </div>
                )}

                <div>
                    <button onClick={() => auth.signOut()}>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;