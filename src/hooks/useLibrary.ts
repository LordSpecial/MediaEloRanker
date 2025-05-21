import { SortField } from '@/types/media/common';
import { useLibrary as useLibraryNew } from './library';

/**
 * @deprecated Use hooks from the 'hooks/library' directory instead
 * This hook provides backward compatibility for the old useLibrary hook.
 */

export interface UseLibraryProps {
    /** The current active category (all, film, tv, etc.) */
    activeCategory?: string;
    /** The field to sort media items by */
    sortOrder?: SortField;
}

// Re-export types for backward compatibility
export type {
    MediaType,
    BaseMediaItem,
    MediaRating,
    MediaItem,
    MediaMetadata,
    BaseMediaMetadata,
    AddToLibraryParams
} from '@/types/media/common';

export { useLibraryNew as useLibrary };