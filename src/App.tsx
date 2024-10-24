import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import { MediaExplorePage } from './components/media/MediaExplorePage';
import { ProfilePage } from './components/pages/Pages';
import { HomePage } from './components/pages/Pages';
import { DiscoverPage } from './components/pages/Pages';
import { RankPage } from './components/pages/Pages';
import { LibraryPage } from './components/pages/Pages';
import Navbar from './components/ui/Navbar';
import { useAuth } from './hooks/useAuth';

// Simple loading component
const Loading = () => <div>Loading...</div>;

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) return <Loading />;

    if (!user || !user.emailVerified) {
        return <Navigate to="/login" />;
    }

    return (
        <>
            <Navbar />
            {children}
        </>
    );
};

const App = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    const shouldRedirectToProfile = user && user.emailVerified;

    return (
        <Router>
            <div className="dark-theme">
                <Routes>
                    {/* Public routes */}
                    <Route
                        path="/login"
                        element={shouldRedirectToProfile ? <Navigate to="/home" /> : <Login />}
                    />
                    <Route
                        path="/register"
                        element={
                            user && !user.emailVerified ? (
                                <Register />
                            ) : shouldRedirectToProfile ? (
                                <Navigate to="/home" />
                            ) : (
                                <Register />
                            )
                        }
                    />

                    {/* Protected routes */}
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/discover"
                        element={
                            <ProtectedRoute>
                                <DiscoverPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/explore/:mediaType"
                        element={
                            <ProtectedRoute>
                                <MediaExplorePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rank"
                        element={
                            <ProtectedRoute>
                                <RankPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/library"
                        element={
                            <ProtectedRoute>
                                <LibraryPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Default redirect */}
                    <Route
                        path="*"
                        element={
                            <Navigate to={
                                shouldRedirectToProfile
                                    ? "/home"
                                    : user && !user.emailVerified
                                        ? "/register"
                                        : "/login"
                            } />
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
};

export default App;