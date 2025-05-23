import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Star, Check, Loader2, Trophy } from 'lucide-react';
import { MediaType } from '@/types/media/common';
import { useLibraryContext } from '@/contexts/LibraryContext';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

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
  const [isHovered, setIsHovered] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [libraryItem, setLibraryItem] = useState<any>(null);
  const { checkInLibrary, addToLibrary, loading: libraryLoading } = useLibraryContext();
  const { user } = useAuth();

  // Function to fetch library item directly from Firestore
  const fetchLibraryItem = async (mediaId: string) => {
    if (!user) return null;
    
    try {
      const libraryItemRef = doc(db, `users/${user.uid}/library/${mediaId}`);
      const docSnap = await getDoc(libraryItemRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching library item:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check if this item is in the library when component mounts
    const checkLibraryStatus = async () => {
      if (!id || !user) return;
      
      setIsChecking(true);
      try {
        const inLibrary = await checkInLibrary(id.toString());
        setIsInLibrary(inLibrary);
        
        // If item is in library, get its details including ratings
        if (inLibrary) {
          const item = await fetchLibraryItem(id.toString());
          setLibraryItem(item);
        }
      } catch (error) {
        console.error('Error checking library status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkLibraryStatus();
  }, [id, checkInLibrary, user]);

  const handleAddToLibrary = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening dialog
    e.preventDefault();

    if (!id || isInLibrary || !user) return;

    try {
      await addToLibrary({
        mediaId: id.toString(),
        type: mediaType || 'film',
        title,
        releaseYear: year,
        imageUrl,
      });
      setIsInLibrary(true);
      
      // Get updated library item after adding
      const item = await fetchLibraryItem(id.toString());
      setLibraryItem(item);
    } catch (error) {
      console.error('Error adding to library:', error);
    }
  };

  return (
    <Card 
      className={`overflow-hidden h-full transition-transform duration-200 hover:scale-105 cursor-pointer flex flex-col ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        
        {/* Rating badge */}
        {rating && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-yellow-400 px-2 py-1 rounded-full flex items-center text-xs">
            <Star className="w-3 h-3 mr-1" />
            {rating}
          </div>
        )}

        {/* In Library indicator */}
        {isInLibrary && (
          <div className="absolute top-2 left-2 bg-green-800 bg-opacity-90 text-white p-1 rounded-full">
            <Check className="w-3 h-3" />
          </div>
        )}

        {/* Show library stats on hover for items in library */}
        {isHovered && isInLibrary && libraryItem && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center transition-opacity p-3">
            <h4 className="text-white text-sm font-semibold mb-3">Library Stats</h4>
            
            {/* User Rating */}
            {libraryItem.userRating !== undefined && libraryItem.userRating !== null && (
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-white text-sm">Your Rating: <span className="font-bold">{libraryItem.userRating?.toFixed(1)}</span>/5</span>
              </div>
            )}
            
            {/* ELO Score */}
            {libraryItem.globalEloScore && (
              <div className="flex items-center mb-1">
                <Trophy className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-white text-sm">ELO Score: <span className="font-bold">{libraryItem.globalEloScore?.toFixed(0)}</span></span>
              </div>
            )}
            
            {/* Matches */}
            {libraryItem.globalEloMatches !== undefined && (
              <div className="text-gray-300 text-xs mt-1">
                {libraryItem.globalEloMatches} comparison{libraryItem.globalEloMatches !== 1 ? 's' : ''}
              </div>
            )}
            
            {/* Provisional Status */}
            {libraryItem.provisional && (
              <div className="mt-1 px-2 py-1 bg-yellow-800 bg-opacity-60 rounded-sm text-yellow-200 text-xs">
                Provisional Rating
              </div>
            )}
          </div>
        )}

        {/* Add to Library hover button */}
        {isHovered && !isInLibrary && !isChecking && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAddToLibrary}
              disabled={libraryLoading || !id}
            >
              {libraryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Library
                </>
              )}
            </Button>
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