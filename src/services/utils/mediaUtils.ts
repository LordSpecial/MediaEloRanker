import { TMDBMovie, TMDBTVShow, TMDBMediaItem } from '../api/tmdb/types';
import { getImageUrl } from '../config/tmdb.config';
import type { MediaCardProps } from '../../components/media/EnhancedMediaCard';

export const isMovie = (media: TMDBMediaItem): media is TMDBMovie => {
    return 'title' in media && 'release_date' in media;
};

export const isTVShow = (media: TMDBMediaItem): media is TMDBTVShow => {
    return 'name' in media && 'first_air_date' in media;
};

export const formatMediaItem = (item: TMDBMediaItem): MediaCardProps => {
    const year = new Date(isMovie(item) ? item.release_date : item.first_air_date).getFullYear();
    return {
        id: item.id,
        title: isMovie(item) ? item.title : item.name,
        imageUrl: item.poster_path ? getImageUrl(item.poster_path) : null,
        rating: (item.vote_average / 2).toFixed(1),
        year: isNaN(year) ? new Date().getFullYear() : year,
        mediaType: isMovie(item) ? 'film' : 'tv'
    };
};