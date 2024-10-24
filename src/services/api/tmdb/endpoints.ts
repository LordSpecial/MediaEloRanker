// Base endpoints
export const ENDPOINTS = {
    MOVIE: {
        NOW_PLAYING: '/movie/now_playing',
        POPULAR: '/movie/popular',
        TOP_RATED: '/movie/top_rated',
        UPCOMING: '/movie/upcoming',
        DETAILS: (id: number) => `/movie/${id}`,
        SIMILAR: (id: number) => `/movie/${id}/similar`,
        CREDITS: (id: number) => `/movie/${id}/credits`,
        RECOMMENDATIONS: (id: number) => `/movie/${id}/recommendations`,
        VIDEOS: (id: number) => `/movie/${id}/videos`,
    },
    TRENDING: {
        ALL: (timeWindow: string) => `/trending/all/${timeWindow}`,
        MOVIE: (timeWindow: string) => `/trending/movie/${timeWindow}`,
        TV: (timeWindow: string) => `/trending/tv/${timeWindow}`,
        PERSON: (timeWindow: string) => `/trending/person/${timeWindow}`,
    },
    SEARCH: {
        MOVIE: '/search/movie',
        MULTI: '/search/multi',
        TV: '/search/tv',
    },
    TV: {
        POPULAR: '/tv/popular',
        TOP_RATED: '/tv/top_rated',
        AIRING_TODAY: '/tv/airing_today',
        ON_THE_AIR: '/tv/on_the_air',
    }
} as const;

export const TIME_WINDOW = {
    DAY: 'day',
    WEEK: 'week',
} as const;

// Sort options
export const SORT_OPTIONS = {
    POPULARITY_DESC: 'popularity.desc',
    POPULARITY_ASC: 'popularity.asc',
    RELEASE_DATE_DESC: 'release_date.desc',
    RELEASE_DATE_ASC: 'release_date.asc',
    VOTE_AVERAGE_DESC: 'vote_average.desc',
    VOTE_AVERAGE_ASC: 'vote_average.asc',
    REVENUE_DESC: 'revenue.desc',
    REVENUE_ASC: 'revenue.asc',
} as const;