import React from 'react';
import { EnhancedMediaCard } from "./EnhancedMediaCard.tsx";
import { MediaCardProps as EnhancedMediaCardProps } from "./EnhancedMediaCard";
import { MediaCarousel as UIMediaCarousel } from '@/components/ui/media';
import { MediaCardProps } from '@/components/ui/media/MediaCard';
import { MediaSkeleton } from '@/components/ui/media';

// This interface is kept for backward compatibility
interface LegacyMediaCardProps {
    id?: string;
    title: string;
    imageUrl: string | null;
    rating: string;
    year: number;
    mediaType: 'film' | 'tv' | 'anime' | 'music';
    description?: string;
    genre?: string[];
    duration?: string;
}

// Re-export the MediaSkeleton from our UI components
export { MediaSkeleton };

// Export a compatible version of the MediaCardSkeleton
export const MediaCardSkeleton = () => (
    <div className="flex-shrink-0 w-48 mr-4">
        <MediaSkeleton className="h-72" />
    </div>
);

// Adapter function to convert from legacy props to new MediaCardProps format
export const convertLegacyToNewProps = (
    legacyProps: LegacyMediaCardProps
): MediaCardProps => {
    return {
        id: legacyProps.id,
        title: legacyProps.title,
        imageUrl: legacyProps.imageUrl,
        rating: legacyProps.rating,
        year: legacyProps.year,
        mediaType: legacyProps.mediaType,
    };
};

interface MediaCarouselProps {
    title: string;
    items: EnhancedMediaCardProps[];
    onExplore: () => void;
    loading?: boolean;
}

// Legacy wrapper around the new MediaCarousel
export const MediaCarousel: React.FC<MediaCarouselProps> = ({ 
    title, 
    items, 
    onExplore, 
    loading = false 
}) => (
    <UIMediaCarousel
        title={title}
        items={items}
        loading={loading}
        onExplore={onExplore}
        onItemClick={() => {}}
    />
);

// Mock data generator helper
export const generateMockMediaItems = (count: number): EnhancedMediaCardProps[] =>
    Array(count).fill(null).map((_, i) => ({
        id: i.toString(),
        title: `Title ${i + 1}`,
        imageUrl: `https://via.placeholder.com/300x450?text=Mock+${i+1}`,
        rating: (Math.random() * 2 + 3).toFixed(1),
        year: 2024 - Math.floor(Math.random() * 5),
        mediaType: 'film',
    }));