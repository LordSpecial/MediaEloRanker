/**
 * TMDB API re-exports - Backward compatibility file
 * 
 * @deprecated Import from '@/types/api' instead for types
 */

// Re-export TMDB API client
export { tmdbApiClient } from './tmdbApiClient';

// Re-export types for backward compatibility
export type { 
    TMDBResponse, 
    TMDBMovie, 
    TMDBTVShow, 
    TMDBCredits,
    TMDBCastMember,
    TMDBCrewMember,
    TMDBMediaItem
} from '@/types/api'; 