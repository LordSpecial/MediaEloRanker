import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import viteLogo from '/vite.svg';
import './AuthStyles.css';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const { resetPassword, loading, error } = useAuth();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        
        try {
            await resetPassword(email);
            setMessage('Check your email for password reset instructions');
        } catch (err) {
            // Error is already handled by the hook
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <div className="logo-container">
                    <img src={viteLogo} alt="Logo" />
                </div>

                <h2 className="form-title">Reset Password</h2>

                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleResetPassword}>
                    <div className="form-group">
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Reset Password'}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/login" className="auth-link">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword; 