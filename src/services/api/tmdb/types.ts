export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    original_language: string;
    popularity: number;
    adult: boolean;
}

export interface TMDBTVShow {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    original_language: string;
    popularity: number;
    origin_country: string[];
}

export type TMDBMediaItem = TMDBMovie | TMDBTVShow;

export interface TMDBResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

export type MovieListCategory = 'now_playing' | 'popular' | 'top_rated' | 'upcoming';

export interface MovieQueryParams {
    page?: number;
    language?: string;
    region?: string;
}

export interface SearchQueryParams extends MovieQueryParams {
    query: string;
}