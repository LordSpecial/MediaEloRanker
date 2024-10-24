import React, { useState, useEffect } from "react";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../../firebase";
import { Link, useNavigate } from 'react-router-dom';
import viteLogo from '/vite.svg';
import './AuthStyles.css';

type RegistrationStep = 'initial' | 'verifying' | 'completed';

const Register: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('initial');
    const [verificationTimer, setVerificationTimer] = useState(30);
    const navigate = useNavigate();

    // Handle the verification check
    useEffect(() => {
        let checkInterval: NodeJS.Timeout;
        let timerInterval: NodeJS.Timeout;

        if (registrationStep === 'verifying') {
            // Check verification status every 3 seconds
            checkInterval = setInterval(async () => {
                if (auth.currentUser) {
                    // Force refresh the token to get current verification status
                    await auth.currentUser.reload();

                    if (auth.currentUser.emailVerified) {
                        setRegistrationStep('completed');
                        clearInterval(checkInterval);

                        // Navigate after showing completion message
                        setTimeout(() => {
                            navigate('/profile');
                        }, 2000);
                    }
                }
            }, 3000);

            // Countdown for resend button
            timerInterval = setInterval(() => {
                setVerificationTimer((prev) => Math.max(0, prev - 1));
            }, 1000);
        }

        return () => {
            clearInterval(checkInterval);
            clearInterval(timerInterval);
        };
    }, [registrationStep, navigate]);

    const handleInitialSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            setRegistrationStep('verifying');
        } catch (error: any) {
            setError(
                error.code === 'auth/email-already-in-use'
                    ? 'Email is already registered'
                    : error.code === 'auth/weak-password'
                        ? 'Password should be at least 6 characters'
                        : 'An error occurred. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!auth.currentUser) return;

        try {
            await sendEmailVerification(auth.currentUser);
            setVerificationTimer(30);
        } catch (error) {
            setError('Failed to resend verification email. Please try again.');
        }
    };

    const renderContent = () => {
        switch (registrationStep) {
            case 'verifying':
                return (
                    <div className="verification-step">
                        <h2 className="form-title">Verify Your Email</h2>
                        <div className="verification-message">
                            <p>We've sent a verification email to:</p>
                            <p className="email-highlight">{email}</p>
                            <p>Please check your email and click the verification link to continue.</p>
                        </div>

                        <button
                            className="auth-button secondary"
                            onClick={handleResendVerification}
                            disabled={verificationTimer > 0}
                        >
                            {verificationTimer > 0
                                ? `Resend email in ${verificationTimer}s`
                                : 'Resend verification email'}
                        </button>

                        <button
                            className="auth-button text"
                            onClick={() => window.location.reload()}
                        >
                            Use a different email
                        </button>
                    </div>
                );

            case 'completed':
                return (
                    <div className="verification-step">
                        <h2 className="form-title">Email Verified!</h2>
                        <div className="success-message">
                            <p>Your email has been verified successfully.</p>
                            <p>Redirecting you to your profile...</p>
                        </div>
                    </div>
                );

            default:
                return (
                    <>
                        <h2 className="form-title">Create Account</h2>
                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleInitialSignUp}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Display Name"
                                    required
                                />
                            </div>

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

                            <div className="form-group">
                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="auth-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating account...' : 'Sign Up'}
                            </button>
                        </form>

                        <Link to="/login" className="auth-link">
                            Already have an account? Sign in
                        </Link>
                    </>
                );
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <div className="logo-container">
                    <img src={viteLogo} alt="Logo" />
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default Register;