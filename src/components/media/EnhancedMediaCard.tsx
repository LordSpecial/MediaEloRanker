import React, {useEffect, useState} from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Loader2, Plus, User, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import { Slider } from "../ui/slider";
import { useLibraryContext } from "../../contexts/LibraryContext";
import { convertTMDBToMetadata } from "../../services/utils/mediaTransforms";
import { useDetails } from "../../hooks/tmdb";
import { MediaType, MediaMetadata } from '@/types/media/common';
import { FilmTVMetadata } from '@/types/media/movie';
import { AnimeMetadata } from '@/types/media/anime';
import { MusicMetadata } from '@/types/media/music';

export interface MediaCardProps {
    id?: number;
    title: string;
    imageUrl: string | null;
    rating: string;
    year: number;
    mediaType: MediaType;
    metadata?: MediaMetadata;
    userRating?: number;
}

export const EnhancedMediaCard: React.FC<MediaCardProps> = ({
                                                                id,
                                                                title,
                                                                imageUrl,
                                                                rating,
                                                                year,
                                                                mediaType,
                                                                metadata: initialMetadata,
                                                                userRating: initialUserRating
                                                            }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { addToLibrary, checkInLibrary, getMediaMetadata, loading: libraryLoading, updateUserRating, updateMediaMetadata } = useLibraryContext();
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [checkingLibrary, setCheckingLibrary] = useState(false);
    const [userRating, setUserRating] = useState<number | undefined>(initialUserRating);
    const [tempRating, setTempRating] = useState<number>(initialUserRating || 0);
    const [metadata, setMetadata] = useState<MediaMetadata | undefined>(initialMetadata);

    const { details, loading: detailsLoading } = useDetails(
        isOpen ? Number(id) : null,
        {
            includeCredits: true,
            includeVideos: true
        }
    );

    // Check library status whenever the card mounts or id changes
    useEffect(() => {
        const checkLibraryStatus = async () => {
            if (!id) return;

            setCheckingLibrary(true);
            try {
                const inLibrary = await checkInLibrary(id.toString());
                console.log('Library check result:', { id, inLibrary });
                setIsInLibrary(inLibrary);
            } catch (error) {
                console.error('Error checking library status:', error);
            } finally {
                setCheckingLibrary(false);
            }
        };

        checkLibraryStatus();
    }, [id, checkInLibrary]);

    // Re-check library status when dialog opens
    useEffect(() => {
        if (isOpen && id) {
            const recheckLibrary = async () => {
                try {
                    const inLibrary = await checkInLibrary(id.toString());
                    setIsInLibrary(inLibrary);
                } catch (error) {
                    console.error('Error rechecking library status:', error);
                }
            };
            recheckLibrary();
        }
    }, [isOpen, id, checkInLibrary]);

    // Update metadata when details are loaded
    useEffect(() => {
        if (!details || !details.credits) return;

        try {
            console.log('Converting details to metadata:', details);
            const newMetadata = convertTMDBToMetadata(details, {
                cast: details.credits.cast,
                crew: details.credits.crew
            });
            console.log('New metadata:', newMetadata);
            setMetadata(newMetadata);
        } catch (error) {
            console.error('Error converting metadata:', error);
        }
    }, [details]);

    const handleAddToLibrary = async (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        if (!id || isInLibrary) {
            console.log('Cannot add to library:', { id, isInLibrary });
            return;
        }

        try {
            await addToLibrary({
                mediaId: id.toString(),
                type: mediaType,
                title,
                releaseYear: year,
                imageUrl,
                metadata
            });

            setIsInLibrary(true);
        } catch (error) {
            console.error('Error adding to library:', error);
        }
    };

    const handleRatingChange = (value: number) => {
        setTempRating(value);
    };

    const handleRatingConfirm = async () => {
        if (!id) return;
        try {
            await updateUserRating(id.toString(), tempRating);
            setUserRating(tempRating);
        } catch (error) {
            console.error('Error updating rating:', error);
        }
    };

    const isMetadataIncomplete = (meta: MediaMetadata | undefined): boolean => {
        if (!meta || !meta.description) return true;

        switch (mediaType) {
            case 'film':
            case 'tv': {
                const filmMeta = meta as FilmTVMetadata;
                return !filmMeta.director || !filmMeta.cast?.length;
            }
            case 'anime': {
                const animeMeta = meta as AnimeMetadata;
                return !animeMeta.studio || !animeMeta.cast?.length;
            }
            case 'music': {
                const musicMeta = meta as MusicMetadata;
                return !musicMeta.artist || !musicMeta.tracks;
            }
            default:
                return true;
        }
    };

    // Check library status and load metadata if in library
    useEffect(() => {
        const checkLibraryStatus = async () => {
            if (!id) return;

            setCheckingLibrary(true);
            try {
                const inLibrary = await checkInLibrary(id.toString());
                console.log('Library check result:', { id, inLibrary });
                setIsInLibrary(inLibrary);

                // If it's in the library, get the stored metadata
                if (inLibrary) {
                    const storedMetadata = await getMediaMetadata(id.toString());
                    console.log('Retrieved stored metadata:', storedMetadata);
                    if (storedMetadata) {
                        setMetadata(storedMetadata);
                    }
                }
            } catch (error) {
                console.error('Error checking library status:', error);
            } finally {
                setCheckingLibrary(false);
            }
        };

        checkLibraryStatus();
    }, [id, checkInLibrary, getMediaMetadata]);

    // Update metadata from TMDB only if not in library
    useEffect(() => {
        const updateMetadataFromTMDB = async () => {
            if (!details?.credits) return;

            try {
                console.log('Converting TMDB details to metadata:', details);
                const newMetadata = convertTMDBToMetadata(details, {
                    cast: details.credits.cast,
                    crew: details.credits.crew
                });
                console.log('New metadata from TMDB:', newMetadata);
                setMetadata(newMetadata);

                // If item is in library and metadata was incomplete, update it
                if (isInLibrary && id) {
                    await updateMediaMetadata(id.toString(), newMetadata);
                    console.log('Updated stored metadata with TMDB data');
                }
            } catch (error) {
                console.error('Error converting metadata:', error);
            }
        };

        // Update metadata if:
        // 1. Dialog is open (we have details)
        // 2. AND either:
        //    - Item is not in library (discover view)
        //    - OR item is in library but has incomplete metadata
        if (isOpen && details?.credits && (!isInLibrary || isMetadataIncomplete(metadata))) {
            updateMetadataFromTMDB();
        }
    }, [details, isOpen, isInLibrary, metadata, id, updateMediaMetadata]);

    // Re-check library status when dialog opens
    useEffect(() => {
        if (isOpen && id) {
            const recheckLibrary = async () => {
                try {
                    const inLibrary = await checkInLibrary(id.toString());
                    setIsInLibrary(inLibrary);

                    // If it's in the library, refresh the stored metadata
                    if (inLibrary) {
                        const storedMetadata = await getMediaMetadata(id.toString());
                        if (storedMetadata) {
                            setMetadata(storedMetadata);
                        }
                    }
                } catch (error) {
                    console.error('Error rechecking library status:', error);
                }
            };
            recheckLibrary();
        }
    }, [isOpen, id, checkInLibrary, getMediaMetadata]);

    const loading = libraryLoading || checkingLibrary;

    const renderMetadataFields = () => {
        if (!metadata) return null;

        switch (mediaType) {
            case 'film':
            case 'tv': {
                const filmMetadata = metadata as FilmTVMetadata;
                return (
                    <div className="space-y-2">
                        {filmMetadata.director && (
                            <p className="text-sm text-gray-300">
                                <strong>Director:</strong> {filmMetadata.director}
                            </p>
                        )}
                        {filmMetadata.writers && filmMetadata.writers.length > 0 && (
                            <p className="text-sm text-gray-300">
                                <strong>Writers:</strong> {filmMetadata.writers.join(', ')}
                            </p>
                        )}
                        {filmMetadata.cast && filmMetadata.cast.length > 0 && (
                            <p className="text-sm text-gray-300">
                                <strong>Cast:</strong> {filmMetadata.cast.join(', ')}
                            </p>
                        )}
                        {filmMetadata.duration && (
                            <p className="text-sm text-gray-300">
                                <strong>Duration:</strong> {filmMetadata.duration}
                            </p>
                        )}
                    </div>
                );
            }
            case 'anime': {
                const animeMetadata = metadata as AnimeMetadata;
                return (
                    <div className="space-y-2">
                        {animeMetadata.studio && (
                            <p className="text-sm text-gray-300">
                                <strong>Studio:</strong> {animeMetadata.studio}
                            </p>
                        )}
                        {animeMetadata.director && (
                            <p className="text-sm text-gray-300">
                                <strong>Director:</strong> {animeMetadata.director}
                            </p>
                        )}
                        {animeMetadata.cast && animeMetadata.cast.length > 0 && (
                            <p className="text-sm text-gray-300">
                                <strong>Cast:</strong> {animeMetadata.cast.join(', ')}
                            </p>
                        )}
                        {animeMetadata.episodes && (
                            <p className="text-sm text-gray-300">
                                <strong>Episodes:</strong> {animeMetadata.episodes}
                            </p>
                        )}
                    </div>
                );
            }
            case 'music': {
                const musicMetadata = metadata as MusicMetadata;
                return (
                    <div className="space-y-2">
                        {musicMetadata.artist && (
                            <p className="text-sm text-gray-300">
                                <strong>Artist:</strong> {musicMetadata.artist}
                            </p>
                        )}
                        {musicMetadata.album && (
                            <p className="text-sm text-gray-300">
                                <strong>Album:</strong> {musicMetadata.album}
                            </p>
                        )}
                        {musicMetadata.tracks && (
                            <p className="text-sm text-gray-300">
                                <strong>Tracks:</strong> {musicMetadata.tracks}
                            </p>
                        )}
                        {musicMetadata.label && (
                            <p className="text-sm text-gray-300">
                                <strong>Label:</strong> {musicMetadata.label}
                            </p>
                        )}
                    </div>
                );
            }
            default:
                return null;
        }
    };

    const renderDescription = () => {
        if (detailsLoading) {
            return (
                <span className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>Loading details...</span>
                </span>
            );
        }
        return metadata?.description || "No description available";
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
                        {isInLibrary && userRating !== undefined && (
                            <div className="absolute top-2 left-2 bg-gray-900 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                <User className="h-3 w-3" /> {userRating.toFixed(1)}
                            </div>
                        )}
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
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            {renderDescription()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-[2fr,3fr] gap-6">
                        {/* Left column */}
                        <div className="space-y-4">
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

                            {isInLibrary && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-gray-200">Your Rating</label>
                                            <span className="text-sm text-gray-400">{tempRating.toFixed(1)}</span>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <Slider
                                                value={[tempRating]}
                                                onValueChange={([value]) => handleRatingChange(value)}
                                                min={0}
                                                max={5}
                                                step={0.1}
                                                className="flex-1"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={handleRatingConfirm}
                                                disabled={tempRating === userRating}
                                            >
                                                <Star className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right column */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <span className="px-2 py-1 bg-gray-700 rounded-md text-sm">★ {rating}</span>
                                    <span className="text-gray-400">{year}</span>
                                    {metadata && 'duration' in metadata && metadata.duration && (
                                        <span className="text-gray-400">{metadata.duration}</span>
                                    )}
                                </div>

                                {metadata?.genre && metadata.genre.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {metadata.genre.map((g) => (
                                            <span key={g} className="px-2 py-1 bg-gray-700 rounded-md text-xs">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {detailsLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-6 w-6 animate-spin"/>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {renderMetadataFields()}
                                </div>
                            )}

                            {!isInLibrary && (
                                <Button
                                    className="w-full"
                                    variant="default"
                                    onClick={() => handleAddToLibrary()}
                                    disabled={loading || isInLibrary || checkingLibrary || !id}
                                >
                                    {loading || checkingLibrary ? (
                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2"/>
                                            Add to Library
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};