import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { eloService } from '../services/firebase/eloService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface EloRankingsProps {
  mediaType?: string | null;
  limitCount?: number;
  minComparisons?: number;
}

const EloRankings: React.FC<EloRankingsProps> = ({ 
  mediaType = null, 
  limitCount = 20,
  minComparisons = 5
}) => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaDetails, setMediaDetails] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (user) {
      loadRankings();
    } else {
      setError("You must be logged in to view rankings");
      setLoading(false);
    }
  }, [mediaType, limitCount, minComparisons, user]);

  // Function to fetch media details from mediaMetadata for display
  const fetchMediaDetails = async (mediaIds: string[]) => {
    if (!mediaIds || mediaIds.length === 0) return {};
    
    try {
      const detailsPromises = mediaIds.map(async (mediaId) => {
        const mediaRef = doc(db, 'mediaMetadata', mediaId);
        const mediaSnap = await getDoc(mediaRef);
        
        if (mediaSnap.exists()) {
          return { id: mediaId, ...mediaSnap.data() };
        }
        return null;
      });
      
      const results = await Promise.all(detailsPromises);
      const detailsMap: {[key: string]: any} = {};
      
      results.filter(Boolean).forEach(item => {
        if (item) detailsMap[item.id] = item;
      });
      
      return detailsMap;
    } catch (err) {
      console.error('Error fetching media details:', err);
      return {};
    }
  };

  const loadRankings = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the new eloService function to get rankings from user library
      const rankedItems = await eloService.getTopRankedItems(
        user.uid,
        mediaType,
        limitCount,
        minComparisons
      );
      
      if (rankedItems.length > 0) {
        // Get all the mediaIds to fetch details
        const mediaIds = rankedItems.map(item => item.mediaId).filter(Boolean);
        const details = await fetchMediaDetails(mediaIds);
        setMediaDetails(details);
      }
      
      setRankings(rankedItems);
    } catch (err: any) {
      console.error('Error loading rankings:', err);
      setError(`Error loading rankings: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
        <p className="font-semibold">Authentication Required</p>
        <p>You need to be logged in to view rankings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Loading rankings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        <button 
          onClick={loadRankings}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="p-4 text-center bg-gray-100 rounded-md">
        <p className="text-gray-600">
          No ranked items available yet. Complete more comparisons to see rankings.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Items need at least {minComparisons} comparisons to be ranked.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        {mediaType 
          ? `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} Rankings` 
          : 'Overall Rankings'
        }
      </h2>
      
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
              <th className="py-3 px-6 text-left">Rank</th>
              <th className="py-3 px-6 text-left">Media</th>
              <th className="py-3 px-6 text-center">Type</th>
              <th className="py-3 px-6 text-center">Year</th>
              <th className="py-3 px-6 text-center">Rating</th>
              <th className="py-3 px-6 text-center">Uncertainty</th>
              <th className="py-3 px-6 text-center">Comparisons</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {rankings.map((item) => {
              const mediaDetail = mediaDetails[item.mediaId] || {};
              
              return (
                <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    <div className="font-bold">{item.rank}</div>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <div className="flex items-center">
                      {mediaDetail.imageUrl && (
                        <div className="mr-2">
                          <img 
                            className="w-8 h-12 object-cover rounded" 
                            src={mediaDetail.imageUrl} 
                            alt={mediaDetail.title || 'Media item'} 
                          />
                        </div>
                      )}
                      <span className="font-medium">
                        {mediaDetail.title || `Item ${item.mediaId}`}
                      </span>
                      {item.provisional && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Provisional
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-6 text-center">{item.type}</td>
                  <td className="py-3 px-6 text-center">{mediaDetail.releaseYear || '-'}</td>
                  <td className="py-3 px-6 text-center font-bold">{Math.round(item.globalEloScore)}</td>
                  <td className="py-3 px-6 text-center text-gray-500">±{Math.round(item.eloRD || 0)}</td>
                  <td className="py-3 px-6 text-center">{item.globalEloMatches}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EloRankings; 