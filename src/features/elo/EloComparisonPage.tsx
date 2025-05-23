import React, { useState, useEffect } from 'react';
import EloComparison from '../../components/EloComparison';
import EloRankings from '../../components/EloRankings';
import { eloService } from '../../services/firebase/eloService';
import { toast } from '../../components/ui/use-toast';
import { useAuth } from '../../contexts/AuthContext';

const mediaTypes = [
  { value: null, label: 'All Types' },
  { value: 'film', label: 'Films' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'anime', label: 'Anime' },
  { value: 'music', label: 'Music' }
];

const EloComparisonPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [comparisonCount, setComparisonCount] = useState<number>(0);
  const [showRankings, setShowRankings] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(false);

  // Check if ELO system is initialized
  useEffect(() => {
    if (!user) return;
    
    const checkAndInitializeSystem = async () => {
      try {
        // Try to get metadata - will throw error if not initialized
        await eloService.getEloMetadata();
        console.log("ELO system is already initialized");
        
        // Even if metadata exists, we need to check user's library items
        await eloService.initializeUserEloFields(user.uid);
      } catch (error) {
        console.log("ELO system not initialized, initializing now...");
        setInitializing(true);
        
        try {
          const result = await eloService.initializeEloSystem(user.uid);
          
          if (result.success) {
            toast({
              title: "ELO System Initialized",
              description: result.message,
            });
          } else {
            toast({
              title: "Initialization Warning",
              description: result.message,
              variant: "destructive"
            });
          }
        } catch (initError: any) {
          console.error("Failed to initialize ELO system:", initError);
          toast({
            title: "Initialization Failed",
            description: initError.message || "Failed to initialize ELO system",
            variant: "destructive"
          });
        } finally {
          setInitializing(false);
        }
      }
    };
    
    checkAndInitializeSystem();
  }, [user]);

  const handleComparisonComplete = () => {
    setComparisonCount(prev => prev + 1);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 text-red-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
          <p>You need to be logged in to use the ELO comparison feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Media Comparison</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center">
            <label htmlFor="mediaType" className="mr-2 whitespace-nowrap">Media Type:</label>
            <select
              id="mediaType"
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value === '' ? null : e.target.value)}
              className="border rounded px-3 py-2 bg-white"
            >
              {mediaTypes.map((type) => (
                <option key={type.label} value={type.value || ''}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowRankings(!showRankings)}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            {showRankings ? 'Hide Rankings' : 'Show Rankings'}
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Compare Media Items</h2>
          <div className="text-sm text-gray-600">
            Comparisons this session: {comparisonCount}
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Choose which item you prefer or select "Equal" if you can't decide.
          Your choices help build up the ranking system.
        </p>
        
        {initializing ? (
          <div className="p-8 flex flex-col items-center justify-center bg-white rounded-lg shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700">Initializing ELO system...</p>
            <p className="text-sm text-gray-500 mt-2">This will only happen once when you first use the comparison feature.</p>
          </div>
        ) : (
          <EloComparison 
            mediaType={selectedType} 
            onComparisonComplete={handleComparisonComplete} 
          />
        )}
      </div>
      
      {showRankings && !initializing && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Current Rankings</h2>
          <EloRankings mediaType={selectedType} limitCount={20} minComparisons={5} />
        </div>
      )}
    </div>
  );
};

export default EloComparisonPage; 