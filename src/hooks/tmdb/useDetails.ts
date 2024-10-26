import { useState, useEffect } from 'react';
import { tmdbApi } from '../../services/api/tmdb/tmdbApi';
import type { TMDBMovie } from '../../services/api/tmdb/types';

interface MovieDetails extends TMDBMovie {
    credits?: {
        cast: Array<{
            id: number;
            name: string;
            character: string;
            profile_path: string | null;
        }>;
        crew: Array<{
            id: number;
            name: string;
            job: string;
            department: string;
        }>;
    };
    videos?: {
        results: Array<{
            id: string;
            key: string;
            name: string;
            site: string;
            type: string;
        }>;
    };
    similar?: TMDBMovie[];
    recommendations?: TMDBMovie[];
}

interface UseDetailsOptions {
    includeCredits?: boolean;
    includeVideos?: boolean;
    includeSimilar?: boolean;
    includeRecommendations?: boolean;
}

export const useDetails = (
    mediaId: number | null,
    options: UseDetailsOptions = {}
) => {
    const [details, setDetails] = useState<MovieDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            // Reset if no mediaId
            if (!mediaId) {
                setDetails(null);
                setLoading(false);
                setError(null);
                console.log('No mediaId provided to useDetails');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                console.log('Fetching details for:', mediaId);
                const movieDetails = await tmdbApi.getMovieDetails(mediaId);
                console.log('Got basic movie details:', movieDetails);

                let credits = null;
                if (options.includeCredits) {
                    console.log('Fetching credits...');
                    credits = await tmdbApi.getCredits('movie', mediaId);
                    console.log('Got credits:', credits);
                }

                const enhancedDetails: MovieDetails = {
                    ...movieDetails,
                    credits: credits || undefined
                };

                console.log('Setting enhanced details:', enhancedDetails);
                setDetails(enhancedDetails);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch movie details';
                console.error('Error in useDetails:', err);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        // If mediaId changes, fetch new details
        if (mediaId) {
            console.log('useDetails effect triggered for mediaId:', mediaId);
            fetchDetails();
        }

        // Cleanup function
        return () => {
            // Optional: Add any cleanup if needed
            console.log('useDetails cleanup for mediaId:', mediaId);
        };
    }, [mediaId, options.includeCredits]); // Include options.includeCredits in dependencies

    return {
        details,
        loading,
        error,
        hasDetails: !!details,
    };
};