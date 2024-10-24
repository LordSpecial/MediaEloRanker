import React, {useEffect, useState} from 'react';
import {Card, CardContent} from '../ui/card';
import {Check, Compass, Loader2, Plus} from 'lucide-react';
import {Skeleton} from '../ui/skeleton';
import {Button} from "../ui/button";
import {useLibrary} from "../../hooks/useLibrary";
import {toast} from '../ui/use-toast';

interface MediaCardProps {
    id?: number;  // Make id optional
    title: string;
    imageUrl: string | null;
    rating: string;
    year: number;
    mediaType: 'film' | 'tv' | 'anime' | 'music';
}

export const MediaCard: React.FC<MediaCardProps> = ({
                                                        id,
                                                        title,
                                                        imageUrl,
                                                        rating,
                                                        year,
                                                        mediaType
                                                    }) => {
    const {addToLibrary, checkInLibrary, loading} = useLibrary();
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [checkingLibrary, setCheckingLibrary] = useState(false);

    useEffect(() => {
        const checkLibrary = async () => {
            // Only check if we have an ID
            if (!id) return;

            setCheckingLibrary(true);
            try {
                const inLibrary = await checkInLibrary(id.toString());
                setIsInLibrary(inLibrary);
            } catch (error) {
                console.error('Error checking library status:', error);
            } finally {
                setCheckingLibrary(false);
            }
        };

        checkLibrary();
    }, [id, checkInLibrary]);

    const handleAddToLibrary = async () => {
        if (!id) {
            toast({
                title: "Error",
                description: "Cannot add item to library: Invalid ID",
                variant: "destructive"
            });
            return;
        }

        if (isInLibrary) return;

        await addToLibrary({
            mediaId: id.toString(),
            type: mediaType,
            title,
            releaseYear: year,
            imageUrl
        });

        setIsInLibrary(true);
    };

    return (
        <div className="flex-shrink-0 w-48 mr-4">
            <Card className="h-80 overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                <div className="h-48 bg-gray-800 relative">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <span className="text-gray-600">No Image</span>
                        </div>
                    )}
                    <div className="absolute top-2 right-2 bg-gray-900 px-2 py-1 rounded-md text-sm">
                        ★ {rating}
                    </div>
                </div>
                <CardContent className="p-3">
                    <h3 className="font-medium text-sm text-white truncate">{title}</h3>
                    <p className="text-xs text-gray-400 mb-2">{year}</p>
                    <Button
                        variant={isInLibrary ? "secondary" : "default"}
                        size="sm"
                        className="w-full"
                        onClick={handleAddToLibrary}
                        disabled={loading || isInLibrary || checkingLibrary || !id}
                    >
                        {loading || checkingLibrary ? (
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : isInLibrary ? (
                            <>
                                <Check className="h-4 w-4 mr-2"/>
                                In Library
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2"/>
                                Add to Library
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export const MediaCardSkeleton = () => (
    <div className="flex-shrink-0 w-48 mr-4">
        <Card className="h-72 overflow-hidden">
            <div className="h-48 bg-gray-800">
                <Skeleton className="w-full h-full"/>
            </div>
            <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2"/>
                <Skeleton className="h-3 w-1/2"/>
            </CardContent>
        </Card>
    </div>
);

interface MediaCarouselProps {
    title: string;
    items: MediaCardProps[];
    onExplore: () => void;
    loading?: boolean;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ title, items, onExplore, loading = false }) => (
    <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button
                onClick={onExplore}
                className="flex items-center px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
                Explore <Compass className="ml-2 h-4 w-4"/>
            </button>
        </div>
        <div className="flex overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
            {loading ? (
                Array(5).fill(0).map((_, i) => <MediaCardSkeleton key={i}/>)
            ) : (
                items.map((item, index) => (
                    <MediaCard key={item.id || index} {...item} />
                ))
            )}
        </div>
    </div>
);

// Mock data generator helper
export const generateMockMediaItems = (count: number) =>
    Array(count).fill(null).map((_, i) => ({
        title: `Title ${i + 1}`,
        imageId: i,
        rating: (Math.random() * 2 + 3).toFixed(1),
        year: 2024 - Math.floor(Math.random() * 5)
    }));