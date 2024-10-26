import { TMDBMovie, TMDBTVShow } from '../api/tmdb/types';

export const isMovie = (media: TMDBMovie | TMDBTVShow): media is TMDBMovie => {
    return 'title' in media && 'release_date' in media;
};

export const isTVShow = (media: TMDBMovie | TMDBTVShow): media is TMDBTVShow => {
    return 'name' in media && 'first_air_date' in media;
};

// Anime detection based on genre and language
export const isAnime = (media: TMDBMovie | TMDBTVShow): boolean => {
    const ANIMATION_GENRE_ID = 16;
    return (
        media.genre_ids.includes(ANIMATION_GENRE_ID) &&
        media.original_language === 'ja'
    );
};

// Non-anime TV shows
export const isRegularTVShow = (media: TMDBMovie | TMDBTVShow): media is TMDBTVShow => {
    return isTVShow(media) && !isAnime(media);
};

export const formatMediaTitle = (media: TMDBMovie | TMDBTVShow): string => {
    return isMovie(media) ? media.title : media.name;
};

export const formatMediaDate = (media: TMDBMovie | TMDBTVShow): string => {
    return isMovie(media) ? media.release_date : media.first_air_date;
};