import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface MediaSkeletonProps {
  className?: string;
}

export const MediaSkeleton: React.FC<MediaSkeletonProps> = ({ className = '' }) => {
  return (
    <Card className={`overflow-hidden h-full flex flex-col ${className}`}>
      <div className="relative w-full h-0 pb-[150%] bg-gray-800">
        <Skeleton className="absolute top-0 left-0 w-full h-full" />
      </div>
      <CardContent className="p-3 bg-gray-800">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );
};

export const MediaSkeletonGrid: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 10, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
      {Array(count).fill(0).map((_, i) => (
        <MediaSkeleton key={i} />
      ))}
    </div>
  );
}; 