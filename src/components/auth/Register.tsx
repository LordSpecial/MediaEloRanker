import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../firebase";
import { Link } from 'react-router-dom';
import viteLogo from '/vite.svg';
import './AuthStyles.css';

const Register: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName });
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <div className="logo-container">
                    <img src={viteLogo} alt="Logo" />
                </div>

                <h2 className="form-title">Create Account</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleRegister}>
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
            </div>
        </div>
    );
};

export default Register;