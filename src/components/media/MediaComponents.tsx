import React, { useState} from 'react';
import {Card, CardContent} from '../ui/card';
import {Check, Compass, Loader2, Plus} from 'lucide-react';
import {Skeleton} from '../ui/skeleton';
import {Button} from "../ui/button";
import {useLibrary} from "../../hooks/useLibrary";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";


interface MediaCardProps {
    id?: string;
    title: string;
    imageUrl: string | null;
    rating: string;
    year: number;
    mediaType: 'film' | 'tv' | 'anime' | 'music';
    description?: string;
    genre?: string[];
    duration?: string;
}

export const EnhancedMediaCard: React.FC<MediaCardProps> = ({
                                                                id,
                                                                title,
                                                                imageUrl,
                                                                rating,
                                                                year,
                                                                mediaType,
                                                                description = "No description available",
                                                                genre = [],
                                                                duration
                                                            }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { addToLibrary, checkInLibrary, loading } = useLibrary();
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [checkingLibrary, setCheckingLibrary] = useState(false);

    React.useEffect(() => {
        const checkLibrary = async () => {
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

    const handleAddToLibrary = async (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (!id || isInLibrary) return;

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
        <>
            <div className="flex-shrink-0 w-48 mr-4" onClick={() => setIsOpen(true)}>
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
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddToLibrary();
                            }}
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

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-[2fr,3fr] gap-4">
                        <div className="aspect-[2/3] relative overflow-hidden rounded-lg">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                    <span className="text-gray-600">No Image</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <span className="px-2 py-1 bg-gray-700 rounded-md text-sm">★ {rating}</span>
                                <span className="text-gray-400">{year}</span>
                                {duration && <span className="text-gray-400">{duration}</span>}
                            </div>

                            {genre.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {genre.map((g) => (
                                        <span key={g} className="px-2 py-1 bg-gray-700 rounded-md text-xs">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className="text-gray-300 text-sm leading-relaxed">{description}</p>

                            <Button
                                className="w-full mt-4"
                                variant={isInLibrary ? "secondary" : "default"}
                                onClick={() => handleAddToLibrary()}
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
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
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
                    <EnhancedMediaCard key={item.id || index} {...item} />
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