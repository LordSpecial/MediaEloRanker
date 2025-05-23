import React, { useState, useEffect } from 'react';
import { eloService } from '../services/firebase/eloService';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ComparisonItem {
  id: string;
  mediaId: string;
  type?: string;
  globalEloScore?: number;
  globalEloMatches?: number;
  ucbScore?: number;
  eloRD?: number;
  eloVolatility?: number;
  provisional?: boolean;
  [key: string]: any; // Allow for additional properties
}

interface MediaDetail {
  id: string;
  title?: string;
  type?: string;
  year?: number;
  imageUrl?: string;
  eloRating?: number;
  [key: string]: any;
}

interface EloComparisonProps {
  mediaType?: string | null;
  onComparisonComplete?: (result: any) => void;
}

const EloComparison: React.FC<EloComparisonProps> = ({ 
  mediaType = null, 
  onComparisonComplete 
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaDetails, setMediaDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user) {
      console.log('Component mounted with user, loading initial pair');
      loadPair();
    }
  }, [user, mediaType]);  // Only run on mount and when user/mediaType changes

  // Function to fetch media details from mediaMetadata for display
  const fetchMediaDetails = async (mediaIds: string[]) => {
    if (!mediaIds || mediaIds.length === 0) return {};
    
    try {
      console.log('Fetching media details for IDs:', mediaIds);
      const detailsPromises = mediaIds.map(async (mediaId) => {
        const mediaRef = doc(db, 'mediaMetadata', mediaId);
        const mediaSnap = await getDoc(mediaRef);
        
        if (mediaSnap.exists()) {
          return { id: mediaId, ...mediaSnap.data() };
        }
        console.warn(`Media item with ID ${mediaId} not found in mediaMetadata`);
        return null;
      });
      
      const results = await Promise.all(detailsPromises);
      const detailsMap: Record<string, any> = {};
      
      results.filter(Boolean).forEach(item => {
        if (item) detailsMap[item.id] = item;
      });
      
      console.log('Fetched media details:', detailsMap);
      return detailsMap;
    } catch (err) {
      console.error('Error fetching media details:', err);
      return {};
    }
  };

  const loadPair = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting to select pair for comparison with mediaType: ${mediaType}`);
      const pair = await eloService.selectPairForComparison(user.uid, mediaType) as ComparisonItem[];
      console.log(`Received ${pair?.length || 0} items for comparison:`, pair);
      
      // Check if items have required properties
      if (pair && pair.length > 0) {
        const missingProps = pair.filter(item => {
          return !('mediaId' in item) || !('type' in item);
        });
        
        if (missingProps.length > 0) {
          console.warn("Some items are missing required properties:", missingProps);
        }
        
        // Fetch media details for the pair
        const mediaIds = pair.map(item => item.mediaId).filter(Boolean);
        const details = await fetchMediaDetails(mediaIds);
        setMediaDetails(details);
      }
      
      // If we didn't get enough items with the UCB method, try random selection as fallback
      if (!pair || pair.length < 2) {
        console.log("Not enough items with UCB method, trying random selection as fallback");
        
        // First item is what we already have (if any)
        const firstItem = pair && pair.length === 1 ? pair[0] : null;
        
        // Try to get a second random item that's different from the first
        let attempts = 0;
        let secondItem = null;
        
        while (attempts < 3 && !secondItem) {
          attempts++;
          console.log(`Random selection attempt ${attempts}/3`);
          const randomItem = await eloService.selectRandomItem(user.uid, mediaType) as ComparisonItem | null;
          
          // Make sure we don't select the same item twice
          if (randomItem && (!firstItem || randomItem.id !== firstItem.id)) {
            secondItem = randomItem;
          }
        }
        
        // If we have both items, use them
        if (firstItem && secondItem) {
          console.log("Successfully created pair using random fallback");
          
          // Fetch media details - make sure to add null checks
          const mediaIds = [];
          if (firstItem?.mediaId) mediaIds.push(firstItem.mediaId);
          if (secondItem?.mediaId) mediaIds.push(secondItem.mediaId);
          
          const details = await fetchMediaDetails(mediaIds);
          setMediaDetails(details);
          
          setItems([firstItem, secondItem]);
        } else {
          console.log("Failed to create a valid pair even with fallback");
          setError('Not enough items available for comparison. Please add more media items to your library with ELO data.');
          setItems([]);
        }
      } else {
        // We got a valid pair from the UCB method
        setItems(pair);
      }
    } catch (err: any) {
      console.error('Error loading comparison pair:', err);
      setError(`Error loading items: ${err.message || 'Unknown error'}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelection = async (winnerId: string, loserId: string) => {
    if (!user) {
      console.error('Cannot process selection: User not logged in');
      return;
    }
    
    console.log(`Processing selection - Winner ID: ${winnerId}, Loser ID: ${loserId}`);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Calling eloService.updateRatings with:', {
        userId: user.uid,
        winnerId,
        loserId,
        isDraw: false
      });
      
      const updateResult = await eloService.updateRatings(user.uid, winnerId, loserId);
      console.log('Rating update successful, result:', updateResult);
      
      setResult(updateResult);
      
      if (onComparisonComplete) {
        console.log('Calling onComparisonComplete callback with result');
        onComparisonComplete(updateResult);
      }
    } catch (err: any) {
      console.error('Error updating ratings:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setError(`Error updating ratings: ${err.message || 'Unknown error'}`);
    } finally {
      console.log('Setting loading state to false');
      setLoading(false);
    }
  };

  const handleDrawSelection = async (id1: string, id2: string) => {
    if (!user) {
      console.error('Cannot process draw: User not logged in');
      return;
    }
    
    console.log(`Processing draw between items - ID1: ${id1}, ID2: ${id2}`);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Calling eloService.updateRatings with draw=true');
      const updateResult = await eloService.updateRatings(user.uid, id1, id2, true); // true indicates a draw
      console.log('Draw update successful, result:', updateResult);
      
      setResult(updateResult);
      
      if (onComparisonComplete) {
        console.log('Calling onComparisonComplete callback with result');
        onComparisonComplete(updateResult);
      }
    } catch (err: any) {
      console.error('Error updating ratings for draw:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setError(`Error updating ratings: ${err.message || 'Unknown error'}`);
    } finally {
      console.log('Setting loading state to false');
      setLoading(false);
    }
  };

  const handleNextPair = () => {
    console.log('Loading next pair');
    setResult(null);
    loadPair();
  };

  if (!user) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
        <p className="font-semibold">Authentication Required</p>
        <p>You need to be logged in to use the comparison feature.</p>
      </div>
    );
  }

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        <button 
          onClick={loadPair}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length < 2) {
    console.log('Rendering "not enough items" state');
    return (
      <div className="text-center p-8 bg-gray-100 rounded-md">
        <p className="text-gray-600 mb-4">
          Not enough items available for comparison. Please add more media to your library.
        </p>
        <button 
          onClick={loadPair}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>
    );
  }
  
  if (result) {
    console.log('Rendering result state with:', result);
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-6">Comparison Result</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="font-semibold text-lg mb-2">
              {mediaDetails[result.winner.id]?.title || 'Winner'}
            </h3>
            <p className="mb-1 text-gray-600">Previous rating: {result.winner.oldRating.toFixed(0)}</p>
            <p className="mb-1 text-gray-600">New rating: {result.winner.newRating.toFixed(0)}</p>
            <p className={result.winner.ratingChange >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
              Change: {result.winner.ratingChange > 0 ? "+" : ""}{result.winner.ratingChange.toFixed(0)}
            </p>
          </div>

          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="font-semibold text-lg mb-2">
              {mediaDetails[result.loser.id]?.title || 'Loser'}
            </h3>
            <p className="mb-1 text-gray-600">Previous rating: {result.loser.oldRating.toFixed(0)}</p>
            <p className="mb-1 text-gray-600">New rating: {result.loser.newRating.toFixed(0)}</p>
            <p className={result.loser.ratingChange >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
              Change: {result.loser.ratingChange > 0 ? "+" : ""}{result.loser.ratingChange.toFixed(0)}
            </p>
          </div>
        </div>

        <button
          onClick={handleNextPair}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full md:w-auto"
        >
          Next Comparison
        </button>
      </div>
    );
  }

  console.log('Rendering comparison state with items:', items);
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-6 text-center">Which do you prefer?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, index) => {
          const mediaDetail = mediaDetails[item.mediaId] || {};
          
          return (
            <div key={item.id} className="flex flex-col items-center">
              <div className="relative w-full pb-[140%] mb-4">
                {mediaDetail.imageUrl ? (
                  <img
                    src={mediaDetail.imageUrl}
                    alt={mediaDetail.title || 'Media item'}
                    className="absolute inset-0 w-full h-full object-cover rounded-md shadow-md"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center rounded-md shadow-md">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold mb-1">{mediaDetail.title || `Item ${item.mediaId}`}</h3>
              <p className="text-sm text-gray-500 mb-4">{mediaDetail.releaseYear || item.type}</p>
              
              <div className="text-sm text-gray-500 mb-3 text-center">
                <p>Current Rating: {item.globalEloScore?.toFixed(0) || 1500}</p>
                <p>Comparisons: {item.globalEloMatches || 0}</p>
              </div>
              
              <button
                onClick={() => {
                  console.log(`Selection button clicked for item ${index}:`, item.id);
                  handleSelection(item.id, items[1-index].id);
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full"
              >
                Prefer This
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            console.log('Draw button clicked');
            handleDrawSelection(items[0].id, items[1].id);
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Equal / Can't Decide
        </button>
      </div>
    </div>
  );
};

export default EloComparison; 