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
    movieId: number | null,
    {
        includeCredits = false,
        includeVideos = false,
        includeSimilar = false,
        includeRecommendations = false,
    }: UseDetailsOptions = {}
) => {
    const [details, setDetails] = useState<MovieDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!movieId) return;

            setLoading(true);
            setError(null);

            try {
                // Fetch basic movie details
                const movieDetails = await tmdbApi.getMovieDetails(movieId);
                const enhancedDetails: MovieDetails = { ...movieDetails };

                // Parallel fetch for additional data
                const additionalData = await Promise.all([
                    includeCredits ? tmdbApi.get(`/movie/${movieId}/credits`) : null,
                    includeVideos ? tmdbApi.get(`/movie/${movieId}/videos`) : null,
                    includeSimilar ? tmdbApi.getMovieDetails(movieId) : null,
                    includeRecommendations ? tmdbApi.get(`/movie/${movieId}/recommendations`) : null,
                ]);

                // Add additional data to details
                if (includeCredits && additionalData[0]) {
                    enhancedDetails.credits = additionalData[0].data;
                }
                if (includeVideos && additionalData[1]) {
                    enhancedDetails.videos = additionalData[1].data;
                }
                if (includeSimilar && additionalData[2]) {
                    enhancedDetails.similar = additionalData[2].data.results;
                }
                if (includeRecommendations && additionalData[3]) {
                    enhancedDetails.recommendations = additionalData[3].data.results;
                }

                setDetails(enhancedDetails);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch movie details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [movieId, includeCredits, includeVideos, includeSimilar, includeRecommendations]);

    return {
        details,
        loading,
        error,
        hasDetails: !!details,
    };
};

export default useDetails;