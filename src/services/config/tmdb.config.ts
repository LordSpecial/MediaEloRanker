export const tmdbConfig = {
    apiKey: import.meta.env.VITE_TMDB_API_KEY || '',
    baseUrl: import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    imageBaseUrl: import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p',
    posterSize: import.meta.env.VITE_TMDB_POSTER_SIZE || 'w500',
    backdropSize: import.meta.env.VITE_TMDB_BACKDROP_SIZE || 'original',
} as const;

export const getImageUrl = (path: string | null, size = tmdbConfig.posterSize) => {
    if (!path) return null;
    
    // Ensure path has a leading slash if needed
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${tmdbConfig.imageBaseUrl}/${size}${formattedPath}`;
};