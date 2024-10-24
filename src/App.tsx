import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Profile from './components/profile/Profile';
import { useAuth } from './hooks/useAuth';

// Simple loading component
const Loading = () => <div>Loading...</div>;

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) return <Loading />;

    // Check for both user existence and email verification
    if (!user || !user.emailVerified) {
        return <Navigate to="/login" />;
    }

    return <>{children}</>;
};

const App = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    // Helper function to check if user can access auth pages
    const shouldRedirectToProfile = user && user.emailVerified;

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={shouldRedirectToProfile ? <Navigate to="/profile" /> : <Login />}
                />
                <Route
                    path="/register"
                    element={
                        // Allow unverified users to stay on register page
                        user && !user.emailVerified ? (
                            <Register />
                        ) : shouldRedirectToProfile ? (
                            <Navigate to="/profile" />
                        ) : (
                            <Register />
                        )
                    }
                />

                {/* Protected routes */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* Default redirect */}
                <Route
                    path="*"
                    element={
                        <Navigate to={
                            shouldRedirectToProfile
                                ? "/profile"
                                : user && !user.emailVerified
                                    ? "/register"  // Keep unverified users on register
                                    : "/login"
                        } />
                    }
                />
            </Routes>
        </Router>
    );
};

export default App;