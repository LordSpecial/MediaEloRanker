# Component and API Documentation

## Component Documentation

### Media Components

#### MediaCard
```typescript
interface MediaCardProps {
    id?: number;
    title: string;
    imageUrl: string | null;
    rating: string;
    year: number;
    mediaType: 'film' | 'tv' | 'anime' | 'music';
}

/**
 * Displays a media item card with image, title, rating, and library controls.
 * @component
 * @example
 * <MediaCard
 *   id={123}
 *   title="The Matrix"
 *   imageUrl="https://image.tmdb.org/t/p/w500/path.jpg"
 *   rating="4.5"
 *   year={1999}
 *   mediaType="film"
 * />
 */
```

Features:
- Image with fallback
- Rating badge
- Add to Library button with states
- Loading states
- Error handling

#### MediaCarousel
```typescript
interface MediaCarouselProps {
    title: string;
    items: MediaCardProps[];
    onExplore: () => void;
    loading?: boolean;
}

/**
 * Horizontal scrollable list of media cards with header and explore button.
 * @component
 * @example
 * <MediaCarousel
 *   title="Trending Movies"
 *   items={movies}
 *   onExplore={() => navigate('/explore/movies')}
 *   loading={false}
 * />
 */
```

Features:
- Smooth scrolling
- Loading skeletons
- Responsive design
- Dynamic content loading

### Page Components

#### DiscoverPage
```typescript
/**
 * Main discovery page showing various media categories.
 * @component
 */
export const DiscoverPage: React.FC = () => {
    const navigate = useNavigate();
    const { movies: trendingMovies, loading: moviesLoading } = useMovies('trending');
    const { shows: trendingTV, loading: tvLoading } = useTV('trending');
    
    // Implementation...
};
```

Features:
- Multiple media carousels
- Category navigation
- Dynamic data loading
- Error boundaries

#### MediaExplorePage
```typescript
interface ExplorePageProps {
    mediaType: 'movies' | 'tv' | 'anime' | 'music';
}

/**
 * Detailed exploration page for a specific media type.
 * @component
 */
```

Features:
- Search functionality
- Filtering options
- Grid/List view
- Infinite scrolling

### Auth Components

#### Login
```typescript
/**
 * User login form with email/password authentication.
 * @component
 */
export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Implementation...
};
```

Features:
- Form validation
- Error handling
- Loading states
- Redirect logic

## API Integration Examples

### TMDB API Integration

#### Configuration
```typescript
// src/services/config/tmdb.config.ts
export const tmdbConfig = {
    apiKey: import.meta.env.VITE_TMDB_API_KEY,
    baseUrl: import.meta.env.VITE_TMDB_BASE_URL,
    imageBaseUrl: 'https://image.tmdb.org/t/p/',
    posterSizes: {
        small: 'w185',
        medium: 'w342',
        large: 'w500',
        original: 'original'
    }
};
```

#### API Client Example
```typescript
// src/services/api/tmdb/tmdbApi.ts
import axios from 'axios';
import { tmdbConfig } from '../../config/tmdb.config';

const api = axios.create({
    baseURL: tmdbConfig.baseUrl,
    params: {
        api_key: tmdbConfig.apiKey,
    },
});

export const tmdbApi = {
    // Get trending content
    getTrending: async (mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'week') => {
        const response = await api.get(`/trending/${mediaType}/${timeWindow}`);
        return response.data;
    },

    // Search media
    searchMedia: async (query: string, page: number = 1) => {
        const response = await api.get('/search/multi', {
            params: {
                query,
                page,
                include_adult: false
            }
        });
        return response.data;
    },

    // Get movie details
    getMovieDetails: async (movieId: number) => {
        const response = await api.get(`/movie/${movieId}`, {
            params: {
                append_to_response: 'credits,videos,similar'
            }
        });
        return response.data;
    }
};
```

### Custom Hooks Usage

#### useMovies Hook
```typescript
// Example usage in a component
const MoviesList: React.FC = () => {
    const { 
        movies, 
        loading, 
        error,
        hasMore,
        loadMore 
    } = useMovies('popular');

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorMessage error={error} />;

    return (
        <div>
            {movies.map(movie => (
                <MediaCard 
                    key={movie.id}
                    {...formatMovieData(movie)}
                />
            ))}
            {hasMore && (
                <button onClick={loadMore}>
                    Load More
                </button>
            )}
        </div>
    );
};
```

#### useSearch Hook
```typescript
// Example usage in a search component
const SearchComponent: React.FC = () => {
    const { 
        query,
        results,
        loading,
        setQuery,
        search 
    } = useSearch({ autoSearch: true, debounceMs: 300 });

    return (
        <div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
            />
            {loading ? (
                <LoadingSkeleton />
            ) : (
                <SearchResults results={results} />
            )}
        </div>
    );
};
```

### Firebase Integration Examples

#### Library Service
```typescript
// src/services/firebase/libraryService.ts
export const libraryService = {
    // Add to library
    async addToLibrary(userId: string, mediaData: AddToLibraryParams) {
        try {
            // Create media metadata
            const mediaMetadataRef = doc(db, 'mediaMetadata', mediaData.mediaId);
            const mediaMetadata = await getDoc(mediaMetadataRef);

            if (!mediaMetadata.exists()) {
                await setDoc(mediaMetadataRef, {
                    id: mediaData.mediaId,
                    type: mediaData.type,
                    title: mediaData.title,
                    releaseYear: mediaData.releaseYear,
                    imageUrl: mediaData.imageUrl,
                    createdAt: serverTimestamp()
                });
            }

            // Add to user's library
            const userLibraryRef = doc(db, `users/${userId}/library/${mediaData.mediaId}`);
            await setDoc(userLibraryRef, {
                mediaId: mediaData.mediaId,
                addedAt: serverTimestamp(),
                userRating: null,
                globalEloScore: 1500,
                globalEloMatches: 0,
                categoryEloScore: 1500,
                categoryEloMatches: 0,
                lastUpdated: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error adding to library:', error);
            throw error;
        }
    },

    // Get user's library
    async getUserLibrary(userId: string) {
        try {
            const libraryRef = collection(db, `users/${userId}/library`);
            const snapshot = await getDocs(libraryRef);
            
            const library = await Promise.all(
                snapshot.docs.map(async (doc) => {
                    const mediaData = await getDoc(
                        doc(db, 'mediaMetadata', doc.data().mediaId)
                    );
                    return {
                        ...mediaData.data(),
                        ...doc.data()
                    };
                })
            );

            return library;
        } catch (error) {
            console.error('Error getting library:', error);
            throw error;
        }
    }
};
```

### Error Handling Examples

#### API Error Handler
```typescript
// src/services/api/errorHandler.ts
export const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        // Handle Axios errors
        const status = error.response?.status;
        const message = error.response?.data?.status_message;

        switch (status) {
            case 401:
                return 'Invalid API key. Please check your configuration.';
            case 404:
                return 'The requested resource was not found.';
            case 429:
                return 'Rate limit exceeded. Please try again later.';
            default:
                return message || 'An unexpected error occurred.';
        }
    }

    // Handle other errors
    return error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred.';
};
```