import React, { useState, useEffect } from 'react';
import { MediaCardProps } from '../media/MediaCard';
import { LibraryItemDetailsDialog } from '../library/LibraryItemDetailsDialog';
import { Button } from '@/components/ui/button';
import { Plus, Star } from 'lucide-react';
import { useLibraryActions } from '@/hooks/library/useLibraryActions';
import { MediaType } from '@/types/media/common';
import { useToast } from '@/components/ui/use-toast';

interface MediaDetailsDialogWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaCardProps | null;
}

/**
 * Wrapper component that adapts the MediaDetailsDialog interface to use LibraryItemDetailsDialog
 * This allows us to reuse the comprehensive library dialog in the discover page
 * while maintaining the "Add to Library" functionality
 */
export const MediaDetailsDialogWrapper: React.FC<MediaDetailsDialogWrapperProps> = ({
  isOpen,
  onClose,
  media
}) => {
  const { addToLibrary, checkInLibrary, loading } = useLibraryActions();
  const [inLibrary, setInLibrary] = useState(false);
  const { toast } = useToast();

  // Check if the media is already in the library
  useEffect(() => {
    if (media?.id && isOpen) {
      const checkLibraryStatus = async () => {
        try {
          const result = await checkInLibrary(media.id!.toString());
          setInLibrary(result);
        } catch (error) {
          console.error('Error checking library status:', error);
        }
      };
      checkLibraryStatus();
    }
  }, [media, checkInLibrary, isOpen]);

  // Dummy handler for rating updates (not needed for discover page)
  const handleRatingUpdate = (id: string, newRating: number) => {
    console.log('Rating updated in discover page:', id, newRating);
    // No action needed as this is for display only on discover page
  };

  // Add media to library
  const handleAddToLibrary = async () => {
    if (!media) return;
    
    try {
      await addToLibrary({
        mediaId: media.id!.toString(),
        title: media.title,
        type: (media.mediaType || 'film') as MediaType,
        releaseYear: media.year || new Date().getFullYear(),
        imageUrl: media.imageUrl || '',
      });
      setInLibrary(true);
      
      toast({
        title: "Added to Library",
        description: `${media.title} has been added to your library.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add media to library",
        variant: "destructive",
      });
    }
  };

  // Custom action button to add item to library
  const renderAddToLibraryButton = () => {
    if (inLibrary) {
      return (
        <Button variant="secondary" disabled className="w-full my-2">
          Already in Library
        </Button>
      );
    }
    
    return (
      <Button 
        disabled={loading} 
        onClick={handleAddToLibrary}
        className="w-full my-2 flex items-center justify-center"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add to Library
      </Button>
    );
  };

  // Get an alternate header node that replaces the rating section with TMDB rating info
  const renderTmdbRatingHeader = () => {
    if (!media) return null;

    // This will replace the "Your Rating" section in the dialog
    return (
      <div className="mb-3">
        <h3 className="text-md font-semibold text-white flex items-center mb-2">
          <Star className="w-4 h-4 mr-2 text-yellow-400" /> TMDB Rating
        </h3>
        {media.rating && media.rating !== 'NR' ? (
          <div className="flex items-center">
            <span className="text-lg font-medium text-yellow-400">{media.rating}</span>
            <span className="text-sm text-gray-400 ml-1">/5</span>
            <span className="text-xs text-gray-500 ml-2">(Average user rating from TMDB)</span>
          </div>
        ) : (
          <span className="text-gray-400">No ratings available</span>
        )}
      </div>
    );
  };

  return (
    <LibraryItemDetailsDialog 
      isOpen={isOpen}
      onClose={onClose}
      mediaItem={media}
      onRatingUpdate={handleRatingUpdate}
      customActionButton={renderAddToLibraryButton()}
      hideRatingInput={true} // Hide the user rating input since this is discover page
      alternateRatingHeader={renderTmdbRatingHeader()} // Use TMDB rating display instead
    />
  );
}; 