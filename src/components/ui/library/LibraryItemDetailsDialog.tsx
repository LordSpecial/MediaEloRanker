import React, { useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Star, Calendar, Film, Tv, Music, BookOpen, 
  Info, Tag, ClipboardList, Clock 
} from 'lucide-react';
import { MediaCardProps } from '../media/MediaCard';
import { useLibraryContext } from '@/contexts/LibraryContext';
import { MediaMetadata, MediaType } from '@/types/media/common';
import { tmdbApiClient } from '@/services/api/tmdb/tmdbApiClient';
import { TMDBMovie, TMDBTVShow } from '@/types/api/tmdb';
import { AsyncBoundary } from '../AsyncBoundary';
import { ErrorMessage } from '../ErrorMessage';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAsync } from '@/hooks/common/useAsync';

interface LibraryItemDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: MediaCardProps | null;
  onRatingUpdate?: (id: string, newRating: number) => void;
  customActionButton?: ReactNode;
  hideRatingInput?: boolean;
  alternateRatingHeader?: ReactNode;
}

export const LibraryItemDetailsDialog: React.FC<LibraryItemDetailsDialogProps> = ({
  isOpen,
  onClose,
  mediaItem,
  onRatingUpdate,
  customActionButton,
  hideRatingInput = false,
  alternateRatingHeader
}) => {
  const { getMediaMetadata, updateUserRating, refetch } = useLibraryContext();
  const [storedMetadata, setStoredMetadata] = useState<MediaMetadata | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Fetch library item metadata
  useEffect(() => {
    if (mediaItem?.id && isOpen) {
      const fetchMetadata = async () => {
        try {
          console.log(`Fetching metadata for item ${mediaItem.id}`);
          const metadata = await getMediaMetadata(mediaItem.id!.toString());
          console.log('Fetched metadata:', metadata);
          setStoredMetadata(metadata);
          
          // Extract user rating from the mediaItem props
          if (mediaItem.rating && mediaItem.rating !== 'NR') {
            setUserRating(parseFloat(mediaItem.rating));
          }
        } catch (error) {
          console.error('Error fetching library metadata:', error);
        }
      };
      fetchMetadata();
    }
  }, [mediaItem?.id, isOpen, getMediaMetadata]);

  // Fetch additional TMDB data based on media type
  const {
    data: additionalData,
    loading: dataLoading,
    error: dataError,
    execute: fetchAdditionalData
  } = useAsync(async () => {
    if (!mediaItem?.id) return null;

    try {
      console.log(`Fetching TMDB data for ${mediaItem.mediaType} with ID ${mediaItem.id}`);
      if (mediaItem.mediaType === 'film') {
        const data = await tmdbApiClient.getMovieDetails(mediaItem.id.toString());
        console.log('Fetched movie details:', data);
        return data;
      } else if (mediaItem.mediaType === 'tv') {
        const data = await tmdbApiClient.getTVShowDetails(mediaItem.id.toString());
        console.log('Fetched TV details:', data);
        return data;
      }
      console.log('Not a film or TV show, not fetching TMDB data');
      return null;
    } catch (error) {
      console.error('Error fetching additional data:', error);
      return null;
    }
  }, {
    onSettled: (data, error) => {
      console.log('TMDB data fetch settled:', { data, error });
      setFetchAttempted(true);
    }
  });

  // Fetch additional data when media item changes
  useEffect(() => {
    if (isOpen && mediaItem?.id && (mediaItem.mediaType === 'film' || mediaItem.mediaType === 'tv') && !fetchAttempted) {
      console.log('Executing TMDB data fetch');
      fetchAdditionalData();
    }
  }, [mediaItem?.id, mediaItem?.mediaType, isOpen, fetchAdditionalData, fetchAttempted]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFetchAttempted(false);
    }
  }, [isOpen]);

  const getMediaIcon = () => {
    switch (mediaItem?.mediaType) {
      case 'film': return <Film className="h-5 w-5" />;
      case 'tv': return <Tv className="h-5 w-5" />;
      case 'music': return <Music className="h-5 w-5" />;
      case 'anime': return <BookOpen className="h-5 w-5" />;
      default: return <Film className="h-5 w-5" />;
    }
  };

  const handleRatingChange = async (newRating: number) => {
    if (!mediaItem?.id) return;
    
    try {
      await updateUserRating(mediaItem.id.toString(), newRating);
      setUserRating(newRating);
      
      // Notify parent component of rating change
      if (onRatingUpdate) {
        onRatingUpdate(mediaItem.id.toString(), newRating);
      }
      
      // Refresh library data to update UI
      await refetch();
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  // Handle star click with half-star precision
  const handleStarClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, starPosition: number) => {
    // Get position of click within the star
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    
    // If clicked on left half of star, assign half star value
    // If clicked on right half, assign full star value
    const isLeftHalf = x < rect.width / 2;
    const rating = isLeftHalf ? starPosition - 0.5 : starPosition;
    
    handleRatingChange(rating);
  }, [handleRatingChange]);

  // Helper to render stars with half-star precision display
  const renderRatingStars = (currentRating: number | null) => {
    return Array.from({ length: 5 }, (_, i) => {
      // Convert array index to star position (1-5)
      const position = i + 1;
      
      // Check if this star should be full, half, or empty
      const isFullStar = currentRating !== null && currentRating >= position;
      const isHalfStar = currentRating !== null && currentRating >= position - 0.5 && currentRating < position;
      
      return (
        <button
          key={position}
          onClick={(e) => handleStarClick(e, position)}
          className="p-1 relative w-8 h-8 rounded-full text-gray-600 hover:text-gray-400"
          title={`Click left side for ${position - 0.5} stars, right side for ${position} stars`}
        >
          {isHalfStar ? (
            <div className="relative">
              {/* Half star */}
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="w-6 h-6 text-yellow-400" fill="currentColor" />
              </div>
              <Star className="w-6 h-6" />
            </div>
          ) : (
            <Star 
              className={`w-6 h-6 ${isFullStar ? 'text-yellow-400' : ''}`} 
              fill={isFullStar ? "currentColor" : "none"} 
            />
          )}
        </button>
      );
    });
  };

  if (!mediaItem) return null;

  // Format the additional data for display with proper type checking
  const formattedAdditionalData = additionalData ? {
    overview: additionalData.overview,
    genres: additionalData.genres?.map((g: any) => g.name).join(', '),
    runtime: mediaItem.mediaType === 'film' 
      ? (additionalData as TMDBMovie).runtime 
      : (additionalData as TMDBTVShow).episode_run_time?.[0],
    voteAverage: additionalData.vote_average,
    status: additionalData.status,
    // TV-specific fields
    seasons: mediaItem.mediaType === 'tv' ? (additionalData as TMDBTVShow).number_of_seasons : undefined,
    episodes: mediaItem.mediaType === 'tv' ? (additionalData as TMDBTVShow).number_of_episodes : undefined,
    // Movie-specific fields
    budget: mediaItem.mediaType === 'film' ? (additionalData as TMDBMovie).budget : undefined,
    revenue: mediaItem.mediaType === 'film' ? (additionalData as TMDBMovie).revenue : undefined
  } : null;

  // Description text for accessibility
  const descriptionText = `Details for ${mediaItem.title}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="dialog-description">
        <span id="dialog-description" className="sr-only">{descriptionText}</span>
        <DialogHeader>
          <div className="flex items-start gap-4">
            {mediaItem.imageUrl && (
              <div className="flex-shrink-0 h-48 w-32 overflow-hidden rounded-md">
                <img
                  src={mediaItem.imageUrl}
                  alt={mediaItem.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-xl">{mediaItem.title}</DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                View details and manage your ratings
              </DialogDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                {mediaItem.year && (
                  <span className="inline-flex items-center text-sm text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    {mediaItem.year}
                  </span>
                )}
                {userRating && !hideRatingInput && (
                  <span className="inline-flex items-center text-sm text-yellow-400">
                    <Star className="h-4 w-4 mr-1" />
                    {userRating}
                  </span>
                )}
                {mediaItem.mediaType && (
                  <span className="inline-flex items-center text-sm px-2 py-0.5 bg-gray-700 rounded-full text-blue-400">
                    {getMediaIcon()}
                    <span className="ml-1">
                      {mediaItem.mediaType.charAt(0).toUpperCase() + mediaItem.mediaType.slice(1)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Library Item Details */}
          <div className="mt-6 space-y-4">
            {/* Use alternate rating header or show rating input based on props */}
            {alternateRatingHeader ? (
              alternateRatingHeader
            ) : (
              !hideRatingInput && (
                <div>
                  <h3 className="text-md font-semibold text-white flex items-center mb-2">
                    <Info className="w-4 h-4 mr-2" /> Your Rating
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderRatingStars(userRating)}
                    </div>
                    <span className="text-sm text-gray-400 ml-2">
                      {userRating !== null ? `${userRating.toFixed(1)}` : 'Not rated'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Click left side of a star for half value, right side for full value
                  </p>
                </div>
              )
            )}

            {/* Stored Metadata */}
            {storedMetadata && (
              <div>
                <h3 className="text-md font-semibold text-white flex items-center">
                  <ClipboardList className="w-4 h-4 mr-2" /> Library Details
                </h3>
                <div className="mt-2 space-y-2 text-gray-300">
                  {storedMetadata.description && (
                    <p className="text-sm">{storedMetadata.description}</p>
                  )}
                  {storedMetadata.genre && storedMetadata.genre.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {storedMetadata.genre.map((genre, index) => (
                          <span key={index} className="text-xs px-2 py-1 bg-gray-700 rounded-full">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional TMDB Data */}
            {(mediaItem.mediaType === 'film' || mediaItem.mediaType === 'tv') && (
              <div>
                <h3 className="text-md font-semibold text-white flex items-center">
                  <Info className="w-4 h-4 mr-2" /> Additional Details
                </h3>
                
                {dataLoading && (
                  <div className="py-4">
                    <LoadingSpinner text="Loading additional data..." size="sm" />
                  </div>
                )}
                
                {dataError && (
                  <ErrorMessage 
                    message="Failed to load additional data" 
                    details={dataError.message}
                    severity="info"
                    className="mt-2"
                  />
                )}
                
                {formattedAdditionalData && !dataLoading && !dataError && (
                  <div className="mt-2 space-y-3 text-gray-300">
                    {formattedAdditionalData.overview && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400">Overview</h4>
                        <p className="text-sm mt-1">{formattedAdditionalData.overview}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      {formattedAdditionalData.genres && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Genres</h4>
                          <p className="text-sm">{formattedAdditionalData.genres}</p>
                        </div>
                      )}
                      
                      {formattedAdditionalData.runtime && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Runtime</h4>
                          <p className="text-sm flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formattedAdditionalData.runtime} min
                          </p>
                        </div>
                      )}
                      
                      {formattedAdditionalData.status && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Status</h4>
                          <p className="text-sm">{formattedAdditionalData.status}</p>
                        </div>
                      )}
                      
                      {formattedAdditionalData.voteAverage && !alternateRatingHeader && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">TMDB Rating</h4>
                          <p className="text-sm flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow-400" />
                            {(formattedAdditionalData.voteAverage / 2).toFixed(1)}/5
                          </p>
                        </div>
                      )}
                      
                      {/* TV-specific info */}
                      {mediaItem.mediaType === 'tv' && formattedAdditionalData.seasons && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Seasons</h4>
                          <p className="text-sm">{formattedAdditionalData.seasons}</p>
                        </div>
                      )}
                      
                      {mediaItem.mediaType === 'tv' && formattedAdditionalData.episodes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Episodes</h4>
                          <p className="text-sm">{formattedAdditionalData.episodes}</p>
                        </div>
                      )}
                      
                      {/* Movie-specific info */}
                      {mediaItem.mediaType === 'film' && formattedAdditionalData.budget && formattedAdditionalData.budget > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Budget</h4>
                          <p className="text-sm">${formattedAdditionalData.budget.toLocaleString()}</p>
                        </div>
                      )}
                      
                      {mediaItem.mediaType === 'film' && formattedAdditionalData.revenue && formattedAdditionalData.revenue > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Revenue</h4>
                          <p className="text-sm">${formattedAdditionalData.revenue.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <DialogFooter className="mt-6">
          {/* Render custom action button if provided */}
          {customActionButton}
          
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 