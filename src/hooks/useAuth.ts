import { useState, useEffect, useCallback } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    updateProfile,
    sendEmailVerification,
    User
} from "firebase/auth";
import { auth } from '../firebase';
import { toast } from '@/components/ui/use-toast';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to login';
            setError(errorMessage);
            toast({
                title: "Login Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (email: string, password: string, displayName: string) => {
        try {
            setLoading(true);
            setError(null);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile
            await updateProfile(userCredential.user, {
                displayName
            });
            
            // Send verification email
            await sendEmailVerification(userCredential.user);
            
            toast({
                title: "Registration Successful",
                description: "Please check your email to verify your account",
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to register';
            setError(errorMessage);
            toast({
                title: "Registration Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
            toast({
                title: "Logout Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        try {
            setLoading(true);
            setError(null);
            await sendPasswordResetEmail(auth, email);
            toast({
                title: "Password Reset Email Sent",
                description: "Check your email for password reset instructions",
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
            setError(errorMessage);
            toast({
                title: "Password Reset Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const resendVerificationEmail = useCallback(async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "No user is currently logged in",
                variant: "destructive"
            });
            return;
        }

        try {
            await sendEmailVerification(user);
            toast({
                title: "Verification Email Sent",
                description: "Check your email for the verification link",
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email';
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        }
    }, [user]);

    return {
        user,
        loading,
        error,
        login,
        register,
        logout,
        resetPassword,
        resendVerificationEmail
    };
};