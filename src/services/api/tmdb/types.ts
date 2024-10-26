// services/api/tmdb/types.ts

interface TMDBGenre {
    id: number;
    name: string;
}

// Base interface for common properties
interface TMDBMediaBase {
    id: number;
    adult: boolean;
    backdrop_path: string | null;
    original_language: string;
    overview: string;
    popularity: number;
    poster_path: string | null;
    vote_average: number;
    vote_count: number;
}

// Movie interface with detailed fields
export interface TMDBMovie extends TMDBMediaBase {
    title: string;
    original_title: string;
    release_date: string;
    video: boolean;
    // Detailed fields from movie details endpoint
    runtime?: number;
    genres?: TMDBGenre[];
    budget?: number;
    revenue?: number;
    status?: string;
    tagline?: string;
    imdb_id?: string;
    belongs_to_collection?: {
        id: number;
        name: string;
        poster_path: string | null;
        backdrop_path: string | null;
    } | null;
    production_companies?: Array<{
        id: number;
        name: string;
        logo_path: string | null;
        origin_country: string;
    }>;
}

// TV Show interface with detailed fields
export interface TMDBTVShow extends TMDBMediaBase {
    name: string;
    original_name: string;
    first_air_date: string;
    // Detailed fields from TV details endpoint
    genres?: TMDBGenre[];
    episode_run_time?: number[];
    created_by?: Array<{
        id: number;
        name: string;
        profile_path: string | null;
    }>;
    in_production?: boolean;
    languages?: string[];
    last_air_date?: string;
    last_episode_to_air?: {
        id: number;
        name: string;
        overview: string;
        air_date: string;
        episode_number: number;
        season_number: number;
    };
    next_episode_to_air?: {
        id: number;
        name: string;
        overview: string;
        air_date: string;
        episode_number: number;
        season_number: number;
    } | null;
    networks?: Array<{
        id: number;
        name: string;
        logo_path: string | null;
        origin_country: string;
    }>;
    number_of_episodes?: number;
    number_of_seasons?: number;
    seasons?: Array<{
        id: number;
        name: string;
        overview: string;
        air_date: string | null;
        episode_count: number;
        poster_path: string | null;
        season_number: number;
    }>;
    status?: string;
    type?: string;
}

export interface TMDBResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

export interface TMDBCastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order?: number;
}

export interface TMDBCrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path?: string | null; // Make profile_path optional
}

export interface TMDBCredits {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
}

export type TMDBMediaItem = TMDBMovie | TMDBTVShow;