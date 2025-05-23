import React from 'react';
import { MediaCard, MediaCardProps } from './MediaCard';
import { MediaSkeletonGrid } from './MediaSkeleton';

export interface MediaGridProps {
  items: MediaCardProps[];
  loading?: boolean;
  skeletonCount?: number;
  onItemClick?: (item: MediaCardProps) => void;
  emptyMessage?: string;
  className?: string;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  loading = false,
  skeletonCount = 10,
  onItemClick,
  emptyMessage = 'No items found',
  className = '',
}) => {
  if (loading) {
    return <MediaSkeletonGrid count={skeletonCount} className={className} />;
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
      {items.map((item, index) => (
        <MediaCard
          key={item.id || index}
          {...item}
          onClick={() => onItemClick?.(item)}
        />
      ))}
    </div>
  );
}; 