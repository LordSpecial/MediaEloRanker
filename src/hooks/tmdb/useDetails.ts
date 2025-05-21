import { useState, useEffect } from 'react';
import { tmdbApiClient } from '../../services/api/tmdb/tmdbApiClient';
import { TMDBMovie, TMDBTVShow, TMDBCredits } from '@/types/api/tmdb';
import { ApiError } from '../../services/api/errors';

interface UseDetailsOptions {
    includeCredits?: boolean;
    includeVideos?: boolean;
}

// Extended type to include credits in the details
interface TMDBMovieWithCredits extends TMDBMovie {
    credits?: TMDBCredits;
}

interface TMDBTVShowWithCredits extends TMDBTVShow {
    credits?: TMDBCredits;
}

type MediaDetails = TMDBMovieWithCredits | TMDBTVShowWithCredits;

export const useDetails = (id: number | null, options: UseDetailsOptions = {}) => {
    const [details, setDetails] = useState<MediaDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                // Try to fetch as a movie first
                try {
                    const movieDetails = await tmdbApiClient.getMovieDetails(id);
                    setDetails(movieDetails as TMDBMovieWithCredits);
                    return;
                } catch (err) {
                    // If not a movie, try as a TV show
                    if (err instanceof ApiError && err.status === 404) {
                        try {
                            const tvDetails = await tmdbApiClient.getTVShowDetails(id);
                            setDetails(tvDetails as TMDBTVShowWithCredits);
                            return;
                        } catch (tvErr) {
                            // If both fail, throw the TV error
                            throw tvErr;
                        }
                    } else {
                        // If not a 404, rethrow the original error
                        throw err;
                    }
                }
            } catch (err) {
                console.error('Error fetching media details:', err);
                const errorMessage = err instanceof ApiError 
                    ? err.message 
                    : 'Failed to load media details';
                setError(errorMessage);
                setDetails(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    return {
        details,
        loading,
        error,
        isMovie: details && 'title' in details,
        isTVShow: details && 'name' in details,
    };
};