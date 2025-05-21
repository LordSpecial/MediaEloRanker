// services/utils/mediaTransforms.ts
import type { TMDBMovie, TMDBTVShow, TMDBCastMember, TMDBCrewMember } from '../api/tmdb/types';
import type { MediaMetadata, FilmTVMetadata } from '@/types/media';

export const convertTMDBToMetadata = (
    media: TMDBMovie | TMDBTVShow,
    credits: { cast: TMDBCastMember[], crew: TMDBCrewMember[] }
): MediaMetadata => {
    const baseMetadata = {
        description: media.overview,
        genre: media.genres?.map(g => g.name) || []
    };

    if ('title' in media) {
        // It's a movie
        const filmMetadata: FilmTVMetadata = {
            ...baseMetadata,
            director: credits.crew?.find(c => c.job === 'Director')?.name || 'Unknown',
            writers: credits.crew
                ?.filter(c => ['Screenplay', 'Writer', 'Story'].includes(c.job))
                .map(w => w.name) || [],
            cast: credits.cast?.slice(0, 10).map(c => c.name) || [],
            duration: media.runtime ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m` : 'Unknown'
        };
        return filmMetadata;
    } else {
        // It's a TV show
        const tvMetadata: FilmTVMetadata = {
            ...baseMetadata,
            director: credits.crew?.find(c => ['Series Director', 'Director'].includes(c.job))?.name ||
                media.created_by?.[0]?.name ||
                'Unknown',
            writers: [
                ...(media.created_by?.map(c => c.name) || []),
                ...(credits.crew
                    ?.filter(c => ['Creator', 'Writer', 'Story Editor'].includes(c.job))
                    .map(w => w.name) || [])
            ],
            cast: credits.cast?.slice(0, 10).map(c => c.name) || [],
            duration: media.episode_run_time?.[0] ?
                `${media.episode_run_time[0]} min / episode` :
                'Unknown'
        };
        return tvMetadata;
    }
};