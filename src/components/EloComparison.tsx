import React, { useState, useEffect } from 'react';
import { eloService } from '../services/firebase/eloService';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateEloResult, expectedOutcome, getAdjustedKFactor } from '../services/utils/eloMath';
import { EloMetadata } from '../types/elo';

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

const mediaTypes = [
  { id: 'all', label: 'All' },
  { id: 'film', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
  { id: 'anime', label: 'Anime' },
  { id: 'music', label: 'Music' },
];
const compareMethods = [
  { id: 'default', label: 'Default' },
  { id: 'compareSingle', label: 'Compare to Single' },
];

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
  const [ratingOverlays, setRatingOverlays] = useState<{
    winnerId?: string;
    loserId?: string;
    winnerChange?: number;
    loserChange?: number;
    winnerNewRating?: number;
    loserNewRating?: number;
  } | null>(null);
  // Preload next pair
  const [nextPair, setNextPair] = useState<ComparisonItem[] | null>(null);
  const [nextMediaDetails, setNextMediaDetails] = useState<Record<string, any>>({});
  const [eloMetadata, setEloMetadata] = useState<EloMetadata | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('default');
  const [anchorItem, setAnchorItem] = useState<ComparisonItem | null>(null);
  const [showEloChange, setShowEloChange] = useState<boolean>(true);

  // Fetch ELO metadata once
  useEffect(() => {
    if (user) {
      eloService.getEloMetadata().then(setEloMetadata);
    }
  }, [user]);

  // Initial load and preload
  useEffect(() => {
    if (user) {
      setLoading(true);
      setItems([]);
      setMediaDetails({});
      setError(null);
      setNextPair(null);
      setNextMediaDetails({});
      loadPair();
    }
    // eslint-disable-next-line
  }, [user, selectedType, selectedMethod, anchorItem]);

  // Preload the next pair
  const preloadNextPair = async () => {
    if (!user) return;
    try {
      const typeArg = selectedType === 'all' ? null : selectedType;
      const pair = await eloService.selectPairForComparison(user.uid, typeArg) as ComparisonItem[];
      if (pair && pair.length >= 2) {
        const mediaIds = pair.map(item => item.mediaId).filter(Boolean);
        const details = await fetchMediaDetails(mediaIds);
        setNextPair(pair);
        setNextMediaDetails(details);
      } else {
        setNextPair(null);
        setNextMediaDetails({});
      }
    } catch {
      setNextPair(null);
      setNextMediaDetails({});
    }
  };

  // Modified loadPair to use preloaded pair if available
  const loadPair = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const typeArg = selectedType === 'all' ? null : selectedType;
      const pair = await eloService.selectPairForComparison(user.uid, typeArg) as ComparisonItem[];
      if (pair && pair.length > 0) {
        const missingProps = pair.filter(item => {
          return !('mediaId' in item) || !('type' in item);
        });
        if (missingProps.length > 0) {
          console.warn("Some items are missing required properties:", missingProps);
        }
        const mediaIds = pair.map(item => item.mediaId).filter(Boolean);
        const details = await fetchMediaDetails(mediaIds);
        setMediaDetails(details);
      }
      if (!pair || pair.length < 2) {
        setError('Not enough items available for comparison. Please add more media to your library or change your filter.');
        setItems([]);
      } else {
        setItems(pair);
        preloadNextPair();
      }
    } catch (err: any) {
      setError(`Error loading items: ${err.message || 'Unknown error'}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic selection handler
  const handleSelection = async (winnerId: string, loserId: string) => {
    if (!user || !eloMetadata) return;
    // Find winner/loser items
    const winner = items.find(i => i.id === winnerId);
    const loser = items.find(i => i.id === loserId);
    if (!winner || !loser) return;
    // Calculate ELO result locally
    const updateResult = calculateEloResult({
      winnerRating: winner.globalEloScore || 1500,
      loserRating: loser.globalEloScore || 1500,
      winnerMatches: winner.globalEloMatches || 0,
      loserMatches: loser.globalEloMatches || 0,
      metadata: eloMetadata,
      isDraw: false
    });
    updateResult.winner.id = winnerId;
    updateResult.loser.id = loserId;
    if (showEloChange) {
      setRatingOverlays({
        winnerId: updateResult.winner.id,
        loserId: updateResult.loser.id,
        winnerChange: updateResult.winner.ratingChange,
        loserChange: updateResult.loser.ratingChange,
        winnerNewRating: updateResult.winner.newRating,
        loserNewRating: updateResult.loser.newRating
      });
      setResult(updateResult);
      if (onComparisonComplete) onComparisonComplete(updateResult);
      setTimeout(() => {
        setRatingOverlays(null);
        setResult(null);
        if (nextPair && nextPair.length >= 2) {
          setItems(nextPair);
          setMediaDetails(nextMediaDetails);
          setNextPair(null);
          setNextMediaDetails({});
          preloadNextPair();
        } else {
          loadPair();
        }
      }, 1250);
    } else {
      // Skip overlay, go straight to next pair
      if (onComparisonComplete) onComparisonComplete(updateResult);
      if (nextPair && nextPair.length >= 2) {
        setItems(nextPair);
        setMediaDetails(nextMediaDetails);
        setNextPair(null);
        setNextMediaDetails({});
        preloadNextPair();
      } else {
        loadPair();
      }
    }
    // Send backend update in background
    eloService.updateRatings(user.uid, winnerId, loserId, false)
      .catch(err => {
        setError(`Error updating ratings: ${err.message || 'Unknown error'}`);
      });
  };

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
      
      if (showEloChange) {
        setRatingOverlays({
          winnerId: updateResult.winner.id,
          loserId: updateResult.loser.id,
          winnerChange: updateResult.winner.ratingChange,
          loserChange: updateResult.loser.ratingChange,
          winnerNewRating: updateResult.winner.newRating,
          loserNewRating: updateResult.loser.newRating
        });
        setResult(updateResult);
        if (onComparisonComplete) {
          console.log('Calling onComparisonComplete callback with result');
          onComparisonComplete(updateResult);
        }
        setTimeout(() => {
          console.log('Overlay display time complete, loading next pair');
          setRatingOverlays(null);
          loadPair();
        }, 500);
      } else {
        if (onComparisonComplete) onComparisonComplete(updateResult);
        loadPair();
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
    setRatingOverlays(null);
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

  console.log('Rendering comparison state with items:', items);
  return (
    <div className="min-h-screen bg-gray-900 pt-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Filter Bar */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Type:</span>
              <div className="flex flex-wrap gap-2">
                {mediaTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      selectedType === type.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Method:</span>
              <div className="flex flex-wrap gap-2">
                {compareMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      selectedMethod === method.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Anchor picker placeholder */}
          {selectedMethod === 'compareSingle' && (
            <div className="mt-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <span className="text-gray-300">Anchor selection coming soon...</span>
              </div>
            </div>
          )}
          {/* Show ELO change toggle switch */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-gray-300">Show ELO Change Overlay</span>
            <button
              type="button"
              onClick={() => setShowEloChange(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                showEloChange ? 'bg-blue-600' : 'bg-gray-600'
              }`}
              aria-pressed={showEloChange}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showEloChange ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-lg shadow-lg border border-gray-700 text-gray-200">
          <h2 className="text-xl font-bold mb-6 text-center">Which do you prefer?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[200px]">
            {(error || items.length < 2) ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-8">
                <p className="text-red-600 font-semibold mb-4">
                  {error || 'Not enough items available for comparison. Please add more media to your library.'}
                </p>
                <button
                  onClick={loadPair}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Refresh
                </button>
              </div>
            ) : (
              items.map((item, index) => {
                const mediaDetail = mediaDetails[item.mediaId] || {};
                const isItemWinner = ratingOverlays && ratingOverlays.winnerId === item.id;
                const isItemLoser = ratingOverlays && ratingOverlays.loserId === item.id;
                const showOverlay = isItemWinner || isItemLoser;
                const ratingChange = isItemWinner ? ratingOverlays?.winnerChange : ratingOverlays?.loserChange;
                const newRating = isItemWinner ? ratingOverlays?.winnerNewRating : ratingOverlays?.loserNewRating;
                return (
                  <div key={item.id} className="flex flex-col items-center">
                    <div className="relative w-full pb-[140%] mb-4">
                      {mediaDetail.imageUrl ? (
                        <>
                          <img
                            src={mediaDetail.imageUrl}
                            alt={mediaDetail.title || 'Media item'}
                            className="absolute inset-0 w-full h-full object-cover rounded-md shadow-md"
                          />
                          {/* Rating change overlay */}
                          {showOverlay && (
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white rounded-md">
                              <p className="text-2xl font-bold mb-2">{newRating?.toFixed(0)}</p>
                              <p className={`text-xl font-bold ${ratingChange && ratingChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {ratingChange && ratingChange > 0 ? "+" : ""}{ratingChange?.toFixed(0)}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center rounded-md shadow-md">
                          <span className="text-gray-500">No Image</span>
                          {/* Rating change overlay for items without images */}
                          {showOverlay && (
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white rounded-md">
                              <p className="text-2xl font-bold mb-2">{newRating?.toFixed(0)}</p>
                              <p className={`text-xl font-bold ${ratingChange && ratingChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {ratingChange && ratingChange > 0 ? "+" : ""}{ratingChange?.toFixed(0)}
                              </p>
                            </div>
                          )}
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
                      disabled={ratingOverlays !== null}
                    >
                      Prefer This
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                if (items.length < 2) return;
                console.log('Draw button clicked');
                handleDrawSelection(items[0].id, items[1].id);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              disabled={!!error}
            >
              Equal / Can't Decide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EloComparison; 