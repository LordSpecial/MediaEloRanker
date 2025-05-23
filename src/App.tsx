import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import { MediaExplorePage } from './components/media/MediaExplorePage';
import { HomePage, ProfilePage, DiscoverPage, RankPage, LibraryPage } from './components/pages';
import Navbar from './components/ui/Navbar';
import { useAuth } from './contexts/AuthContext';
import { MovieExplorePage } from "./components/media/MovieExplorePage.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import { TVExplorePage } from "./components/media/TVExplorePage.tsx";
import { LibraryProvider } from './contexts/LibraryContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import EloAdminPage from './features/elo/EloAdminPage';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner fullPage text="Loading authentication..." />;
    }

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

// Admin route wrapper - requires some additional check for admin privileges
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner fullPage text="Loading authentication..." />;
    }

    // For now, we just check if the user is authenticated
    // In the future, you can add more checks for admin status
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

const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner fullPage text="Loading authentication..." />;
    }

    const shouldRedirectToProfile = user && user.emailVerified;

    return (
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
            <Route
                path="/forgot-password"
                element={shouldRedirectToProfile ? <Navigate to="/home" /> : <ForgotPassword />}
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
                path="/explore/movies"
                element={
                    <ProtectedRoute>
                        <MovieExplorePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/explore/tv"
                element={
                    <ProtectedRoute>
                        <TVExplorePage />
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
            
            {/* Admin routes */}
            <Route
                path="/admin/elo"
                element={
                    <AdminRoute>
                        <EloAdminPage />
                    </AdminRoute>
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
    );
};

const App = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <LibraryProvider>
                        <div className="dark-theme">
                            <AppRoutes />
                            <Toaster />
                        </div>
                    </LibraryProvider>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default App;