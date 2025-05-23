import React from 'react';
import { Compass } from 'lucide-react';
import { MediaCard, MediaCardProps } from './MediaCard';
import { MediaSkeleton } from './MediaSkeleton';

export interface MediaCarouselProps {
  title: string;
  items: MediaCardProps[];
  loading?: boolean;
  itemCount?: number;
  onExplore?: () => void;
  onItemClick?: (item: MediaCardProps) => void;
  className?: string;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  title,
  items,
  loading = false,
  itemCount = 5,
  onExplore,
  onItemClick,
  className = '',
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {onExplore && (
          <button
            onClick={onExplore}
            className="flex items-center px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Explore <Compass className="ml-2 h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {loading
          ? Array(itemCount)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40 md:w-48 mr-4 h-72">
                  <MediaSkeleton />
                </div>
              ))
          : items.map((item, index) => (
              <div key={item.id || index} className="flex-shrink-0 w-40 md:w-48 mr-4 h-72">
                <MediaCard
                  {...item}
                  onClick={() => onItemClick?.(item)}
                />
              </div>
            ))}
      </div>
    </div>
  );
}; 