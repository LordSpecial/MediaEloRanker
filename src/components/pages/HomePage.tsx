import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default HomePage; 