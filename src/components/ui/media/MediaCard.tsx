import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { MediaType } from '@/types/media/common';

export interface MediaCardProps {
  id?: number | string;
  title: string;
  imageUrl: string | null;
  rating?: string;
  year?: number;
  mediaType?: MediaType;
  onClick?: () => void;
  className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  imageUrl,
  rating,
  year,
  mediaType,
  onClick,
  className = '',
}) => {
  return (
    <Card 
      className={`overflow-hidden h-full transition-transform duration-200 hover:scale-105 cursor-pointer flex flex-col ${className}`}
      onClick={onClick}
    >
      <div className="relative w-full h-0 pb-[150%] bg-gray-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute top-0 left-0 w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image';
            }}
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700 text-gray-500">
            No Image
          </div>
        )}
        
        {rating && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-yellow-400 px-2 py-1 rounded-full flex items-center text-xs">
            <Star className="w-3 h-3 mr-1" />
            {rating}
          </div>
        )}
      </div>
      <CardContent className="p-3 flex-grow flex flex-col justify-between bg-gray-800">
        <div>
          <h3 className="font-medium text-white text-sm line-clamp-2">{title}</h3>
          {year && <p className="text-gray-400 text-xs mt-1">{year}</p>}
        </div>
        {mediaType && (
          <div className="mt-2">
            <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-blue-400">
              {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 