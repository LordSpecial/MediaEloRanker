import { useLibrary as useLibraryNew } from './library';
import { SortField } from '@/types/media';

/**
 * @deprecated Use hooks from 'hooks/library' instead
 * This hook is maintained for backward compatibility
 */
interface UseLibraryProps {
    category?: string;
    sortOrder?: SortField;
}

/**
 * @deprecated Use hooks from 'hooks/library' instead
 */
export const useLibrary = (props: UseLibraryProps = {}) => {
    console.warn(
        'The useLibrary hook is deprecated. Please use hooks from hooks/library directory instead.'
    );
    return useLibraryNew(props);
};

// Re-export types for backward compatibility
export type { SortField };
export type { 
    FilmTVMetadata,
    AnimeMetadata,
    MusicMetadata,
    MediaMetadata
} from '@/types/media';