import { TMDBMovie, TMDBTVShow, TMDBMediaItem } from '../api/tmdb/types';
import { getImageUrl } from '../config/tmdb.config';

export const isMovie = (media: TMDBMediaItem): media is TMDBMovie => {
    return 'title' in media && 'release_date' in media;
};

export const isTVShow = (media: TMDBMediaItem): media is TMDBTVShow => {
    return 'name' in media && 'first_air_date' in media;
};

export const formatMediaItem = (item: TMDBMediaItem) => {
    return {
        id: item.id,
        title: isMovie(item) ? item.title : item.name,
        imageUrl: getImageUrl(item.poster_path),
        rating: (item.vote_average / 2).toFixed(1),
        year: new Date(isMovie(item) ? item.release_date : item.first_air_date).getFullYear(),
    };
};