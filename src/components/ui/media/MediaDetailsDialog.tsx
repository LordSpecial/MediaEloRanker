import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Star, StarHalf, Calendar, Film, Tv, Music, BookOpen } from 'lucide-react';
import { MediaCardProps } from './MediaCard';
import { useLibraryActions } from '@/hooks/library/useLibraryActions';
import { MediaType } from '@/types/media/common';
import { useToast } from '@/components/ui/use-toast';

interface MediaDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaCardProps | null;
}

export const MediaDetailsDialog: React.FC<MediaDetailsDialogProps> = ({
  isOpen,
  onClose,
  media
}) => {
  const { addToLibrary, checkInLibrary, loading } = useLibraryActions();
  const [inLibrary, setInLibrary] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (media?.id) {
      const checkLibraryStatus = async () => {
        const result = await checkInLibrary(media.id!.toString());
        setInLibrary(result);
      };
      checkLibraryStatus();
    }
  }, [media, checkInLibrary]);

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add media to library",
        variant: "destructive",
      });
    }
  };

  const getMediaIcon = () => {
    switch (media?.mediaType) {
      case 'film': return <Film className="h-5 w-5" />;
      case 'tv': return <Tv className="h-5 w-5" />;
      case 'music': return <Music className="h-5 w-5" />;
      case 'anime': return <BookOpen className="h-5 w-5" />;
      default: return <Film className="h-5 w-5" />;
    }
  };

  if (!media) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {media.imageUrl && (
              <div className="flex-shrink-0 h-36 w-24 overflow-hidden rounded-md">
                <img
                  src={media.imageUrl}
                  alt={media.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-xl">{media.title}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {media.year && (
                  <span className="inline-flex items-center text-sm text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    {media.year}
                  </span>
                )}
                {media.rating && (
                  <span className="inline-flex items-center text-sm text-yellow-400">
                    <Star className="h-4 w-4 mr-1" />
                    {media.rating}
                  </span>
                )}
                {media.mediaType && (
                  <span className="inline-flex items-center text-sm px-2 py-0.5 bg-gray-700 rounded-full text-blue-400">
                    {getMediaIcon()}
                    <span className="ml-1">
                      {media.mediaType.charAt(0).toUpperCase() + media.mediaType.slice(1)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogDescription className="mt-4">
            View details and manage this item in your library.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-4">
          {!inLibrary ? (
            <Button 
              disabled={loading || inLibrary} 
              onClick={handleAddToLibrary}
              className="w-full flex items-center justify-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Library
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose} className="w-full">
              Already in Library
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 