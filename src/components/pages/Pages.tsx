import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Settings, Library, Star, Clock, LogOut } from 'lucide-react';
import { MediaCarousel, generateMockMediaItems } from '../media/MediaComponents';
import {useNavigate} from "react-router-dom";

// Home Page
export const HomePage = () => {
    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-4xl font-bold text-white mb-8">Welcome to MediaRank</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trending Now</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-gray-300">
                                <p>• The Latest Blockbuster</p>
                                <p>• Popular TV Series</p>
                                <p>• New Releases</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Your Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-gray-300">
                                <p>• Recently Ranked Items</p>
                                <p>• Latest Reviews</p>
                                <p>• Watchlist Updates</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Discover Page
export const DiscoverPage = () => {
    const navigate = useNavigate();

    const categories = [
        { title: 'Trending Movies', type: 'movies', items: generateMockMediaItems(10) },
        { title: 'Popular TV Shows', type: 'tv', items: generateMockMediaItems(10) },
        { title: 'Top Anime', type: 'anime', items: generateMockMediaItems(10) },
        { title: 'Hot Albums', type: 'music', items: generateMockMediaItems(10) }
    ];

    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">Discover</h1>

                {categories.map((category, index) => (
                    <MediaCarousel
                        key={index}
                        title={category.title}
                        items={category.items}
                        onExplore={() => navigate(`/explore/${category.type}`)}
                    />
                ))}
            </div>
        </div>
    );
};

// Rank Page
export const RankPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">Rank Your Media</h1>

                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">Create New Ranking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 text-gray-300">
                            <p>Drag and drop your favorite media items to create custom rankings</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((item) => (
                                    <div key={item} className="p-4 bg-gray-700 rounded-lg">
                                        Placeholder Item {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Library Page
export const LibraryPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">My Library</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white">My Rankings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-gray-300">
                                <p>• Top 10 Movies of All Time</p>
                                <p>• Best TV Series 2024</p>
                                <p>• Favorite Books</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white">Watchlist</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-gray-300">
                                <p>• Movie 1</p>
                                <p>• TV Show 1</p>
                                <p>• Book 1</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Profile Page
export const ProfilePage = () => {
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

    // Mock data for demonstration
    const recentActivity = [
        { type: 'ranking', title: 'Top 10 Movies 2024', date: '2024-10-24' },
        { type: 'review', title: 'Inception', date: '2024-10-23' },
        { type: 'list', title: 'Must Watch Series', date: '2024-10-22' },
    ];

    const stats = {
        totalRankings: 15,
        totalReviews: 42,
        listsCreated: 7,
        followers: 128,
        following: 95
    };

    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-white mb-8">Profile</h1>
                    <button
                        onClick={() => auth.signOut()}
                        className="flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Info Card */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User size={24} className="mr-2" />
                                User Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-400 mb-4">{error}</div>}
                            {success && <div className="text-green-400 mb-4">{success}</div>}

                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div>
                                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                                            Display Name
                                        </label>
                                        <input
                                            id="displayName"
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                                            required
                                        />
                                    </div>
                                    <div className="flex space-x-4">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Display Name</p>
                                        <p className="text-lg text-white">{user?.displayName || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Email</p>
                                        <p className="text-lg text-white">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Star size={24} className="mr-2" />
                                Your Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Rankings</span>
                                    <span className="text-white">{stats.totalRankings}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Reviews</span>
                                    <span className="text-white">{stats.totalReviews}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Lists Created</span>
                                    <span className="text-white">{stats.listsCreated}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Followers</span>
                                    <span className="text-white">{stats.followers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Following</span>
                                    <span className="text-white">{stats.following}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Clock size={24} className="mr-2" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                                    >
                                        <div>
                                            <p className="text-white">{activity.title}</p>
                                            <p className="text-sm text-gray-400">
                                                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-400">{activity.date}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};