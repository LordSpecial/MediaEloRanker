import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default RankPage; 