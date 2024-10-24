export const tmdbConfig = {
    apiKey: import.meta.env.VITE_TMDB_API_KEY,
    baseUrl: import.meta.env.VITE_TMDB_BASE_URL,
    imageBaseUrl: import.meta.env.VITE_TMDB_IMAGE_BASE_URL,
    posterSize: import.meta.env.VITE_TMDB_POSTER_SIZE,
    backdropSize: import.meta.env.VITE_TMDB_BACKDROP_SIZE,
} as const;

export const getImageUrl = (path: string | null, size = tmdbConfig.posterSize) => {
    if (!path) return null;
    return `${tmdbConfig.imageBaseUrl}/${size}${path}`;
};