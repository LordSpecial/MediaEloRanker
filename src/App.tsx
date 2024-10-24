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
    if (!user) return <Navigate to="/login" />;

    return <>{children}</>;
};

const App = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={user ? <Navigate to="/profile" /> : <Login />}
                />
                <Route
                    path="/register"
                    element={user ? <Navigate to="/profile" /> : <Register />}
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
                    element={<Navigate to={user ? "/profile" : "/login"} />}
                />
            </Routes>
        </Router>
    );
};

export default App;