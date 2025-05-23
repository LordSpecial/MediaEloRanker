import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eloService } from '../../services/firebase/eloService';
import { EloMetadata } from '../../types/elo';
import { doc, deleteDoc, collection, getDocs, query, where, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from '../../components/ui/use-toast';
import { useAuth } from '../../contexts/AuthContext';

const EloAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [metadata, setMetadata] = useState<EloMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [deletingTest, setDeletingTest] = useState(false);
  const [migratingData, setMigratingData] = useState(false);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);
  const [resettingElo, setResettingElo] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  useEffect(() => {
    fetchEloMetadata();
  }, []);

  const fetchEloMetadata = async () => {
    setLoadingMetadata(true);
    try {
      const metadataResult = await eloService.getEloMetadata();
      setMetadata(metadataResult);
    } catch (error) {
      console.error('Error fetching ELO metadata:', error);
      setMetadata(null);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleInitialize = async () => {
    if (loading || !user) return;

    setLoading(true);
    setResult(null);

    try {
      const initResult = await eloService.initializeEloSystem(user.uid);
      setResult(initResult);
      // Refresh metadata after initialization
      await fetchEloMetadata();
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error?.message || 'Unknown error occurred'}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to remove the test document if it exists
  const handleRemoveTestDocument = async () => {
    try {
      setDeletingTest(true);
      
      // Try to delete the test document
      await deleteDoc(doc(db, 'mediaMetadata', 'test'));
      
      toast({
        title: "Test Document Removed",
        description: "The test document has been successfully removed from the database.",
      });
    } catch (error: any) {
      console.error('Error removing test document:', error);
      toast({
        title: "Error",
        description: `Could not remove test document: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setDeletingTest(false);
    }
  };

  // Function to clean up orphaned library items (items with no corresponding mediaMetadata)
  const handleCleanOrphanedItems = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to clean orphaned items",
        variant: "destructive"
      });
      return;
    }

    setCleaningOrphans(true);
    setResult(null);
    
    try {
      // 1. Get all library items for the user
      const libraryRef = collection(db, `users/${user.uid}/library`);
      const librarySnap = await getDocs(libraryRef);
      
      if (librarySnap.empty) {
        toast({
          title: "No Library Items",
          description: "No library items were found to check",
        });
        setCleaningOrphans(false);
        return;
      }
      
      // 2. Check each library item to see if its mediaId exists in mediaMetadata
      const batch = writeBatch(db);
      let orphanedCount = 0;
      
      // Process in batches since there might be many items
      const batchPromises = [];
      
      for (const libraryDoc of librarySnap.docs) {
        const libraryData = libraryDoc.data();
        const mediaId = libraryData.mediaId;
        
        if (!mediaId) {
          console.log(`Library item ${libraryDoc.id} has no mediaId, skipping`);
          continue;
        }
        
        // Check if mediaId exists in mediaMetadata
        const mediaRef = doc(db, 'mediaMetadata', mediaId);
        batchPromises.push(
          getDoc(mediaRef).then(mediaSnap => {
            if (!mediaSnap.exists()) {
              // If mediaId doesn't exist in mediaMetadata, delete the library item
              batch.delete(libraryDoc.ref);
              orphanedCount++;
            }
          })
        );
      }
      
      // Wait for all checks to complete
      await Promise.all(batchPromises);
      
      // If there are orphaned items, commit the batch delete
      if (orphanedCount > 0) {
        await batch.commit();
        
        setResult({
          success: true,
          message: `Successfully deleted ${orphanedCount} orphaned library items.`
        });
        
        toast({
          title: "Cleanup Complete",
          description: `Successfully deleted ${orphanedCount} orphaned library items.`
        });
      } else {
        setResult({
          success: true,
          message: "No orphaned library items found."
        });
        
        toast({
          title: "Cleanup Complete",
          description: "No orphaned library items found."
        });
      }
    } catch (error: any) {
      console.error('Error cleaning orphaned items:', error);
      setResult({
        success: false,
        message: `Error cleaning orphaned items: ${error.message || 'Unknown error'}`
      });
      
      toast({
        title: "Cleanup Failed",
        description: error.message || "An error occurred during cleanup",
        variant: "destructive"
      });
    } finally {
      setCleaningOrphans(false);
    }
  };

  // Function to migrate data from mediaMetadata to user library
  const handleMigrateData = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to migrate data",
        variant: "destructive"
      });
      return;
    }

    setMigratingData(true);
    setResult(null);
    
    try {
      // 1. Get all media items with ELO data
      const mediaRef = collection(db, 'mediaMetadata');
      const mediaQuery = query(mediaRef, where('elo', '!=', null));
      const mediaSnap = await getDocs(mediaQuery);
      
      if (mediaSnap.empty) {
        toast({
          title: "No Data to Migrate",
          description: "No media items with ELO data were found",
        });
        setMigratingData(false);
        return;
      }
      
      // 2. Get the user's library items
      const libraryRef = collection(db, `users/${user.uid}/library`);
      const librarySnap = await getDocs(libraryRef);
      
      // Create a map of mediaId to library document ID
      const libraryMap = new Map();
      librarySnap.forEach(doc => {
        const data = doc.data();
        if (data.mediaId) {
          libraryMap.set(data.mediaId, { id: doc.id, ...data });
        }
      });
      
      // 3. Migrate data in batches
      const batch = writeBatch(db);
      let migrationCount = 0;
      let errorCount = 0;
      
      for (const mediaDoc of mediaSnap.docs) {
        const mediaData = mediaDoc.data();
        const eloData = mediaData.elo;
        
        if (!eloData) continue;
        
        // Find corresponding library item
        const libraryItem = libraryMap.get(mediaDoc.id);
        
        if (libraryItem) {
          // Update existing library item
          const libraryItemRef = doc(db, `users/${user.uid}/library`, libraryItem.id);
          batch.update(libraryItemRef, {
            globalEloScore: eloData.rating || 1500,
            globalEloMatches: eloData.comparisonCount || 0,
            categoryEloScore: eloData.rating || 1500,
            categoryEloMatches: eloData.comparisonCount || 0,
            eloRD: eloData.rd || 350,
            eloVolatility: eloData.vol || 0.06,
            provisional: eloData.provisional !== undefined ? eloData.provisional : true,
            lastUpdated: eloData.lastCompared || new Date()
          });
          migrationCount++;
        } else {
          errorCount++;
          console.warn(`No library item found for media ${mediaDoc.id}`);
        }
      }
      
      // Commit the batch
      await batch.commit();
      
      setResult({
        success: true,
        message: `Successfully migrated ELO data for ${migrationCount} items. ${errorCount} items couldn't be migrated.`
      });
      
      toast({
        title: "Migration Complete",
        description: `Successfully migrated ELO data for ${migrationCount} items. ${errorCount} items couldn't be migrated.`
      });
    } catch (error: any) {
      console.error('Error migrating data:', error);
      setResult({
        success: false,
        message: `Error migrating data: ${error.message || 'Unknown error'}`
      });
      
      toast({
        title: "Migration Failed",
        description: error.message || "An error occurred during migration",
        variant: "destructive"
      });
    } finally {
      setMigratingData(false);
    }
  };

  // Function to handle showing the reset confirmation dialog
  const handleShowResetConfirmation = () => {
    setShowResetConfirmation(true);
  };

  // Function to reset the entire ELO system for the user
  const handleResetEloSystem = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to reset the ELO system",
        variant: "destructive"
      });
      return;
    }

    setResettingElo(true);
    setResult(null);
    setShowResetConfirmation(false);
    
    try {
      // Call the resetEloSystem function from eloService
      const resetResult = await eloService.resetEloSystem(user.uid);
      
      setResult({
        success: resetResult.success,
        message: resetResult.message
      });
      
      if (resetResult.success) {
        toast({
          title: "ELO System Reset",
          description: resetResult.message
        });
        
        // Refresh metadata after reset
        await fetchEloMetadata();
      } else {
        toast({
          title: "Reset Failed",
          description: resetResult.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error resetting ELO system:', error);
      setResult({
        success: false,
        message: `Error resetting ELO system: ${error.message || 'Unknown error'}`
      });
      
      toast({
        title: "Reset Failed",
        description: error.message || "An error occurred during the reset operation",
        variant: "destructive"
      });
    } finally {
      setResettingElo(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 text-red-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
          <p>You need to be logged in to access the ELO admin features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ELO Rating System Administration</h1>
      
      {/* System Status */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        
        {loadingMetadata ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : metadata ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">Total Comparisons</h3>
              <p className="text-2xl font-bold">{metadata.totalComparisons}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">Provisional Threshold</h3>
              <p className="text-2xl font-bold">{metadata.provisionalThreshold} comparisons</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">Last RD Decay</h3>
              <p className="text-lg">
                {metadata.lastRDDecay ? new Date(metadata.lastRDDecay.toMillis()).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 bg-yellow-50 text-yellow-800 rounded-md">
            <p>ELO metadata not found. Please initialize the system.</p>
          </div>
        )}
        
        <div className="mt-4">
          <Link 
            to="/rank/compare" 
            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
          >
            Go to Comparison Tool
          </Link>
          <button
            onClick={fetchEloMetadata}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Refresh Status
          </button>
        </div>
      </div>
      
      {/* Data Migration */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Data Migration</h2>
        <p className="mb-4">
          Migrate ELO data from the global mediaMetadata collection to your user library.
          This is necessary if you're switching from the global ELO system to user-specific ratings.
        </p>
        
        <button
          onClick={handleMigrateData}
          disabled={migratingData}
          className={`px-4 py-2 rounded-md mr-4 ${
            migratingData
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {migratingData ? 'Migrating...' : 'Migrate ELO Data to User Library'}
        </button>
        
        <p className="text-sm text-gray-600 mt-2">
          This will copy ELO data from the global mediaMetadata collection to your personal library items.
        </p>
      </div>
      
      {/* Maintenance Tools */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Maintenance</h2>
        <p className="mb-4">Use these tools to clean up or fix issues with the ELO system:</p>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={handleRemoveTestDocument}
            disabled={deletingTest}
            className={`px-4 py-2 rounded-md ${
              deletingTest
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {deletingTest ? 'Removing...' : 'Remove Test Document'}
          </button>
          
          <button
            onClick={handleCleanOrphanedItems}
            disabled={cleaningOrphans}
            className={`px-4 py-2 rounded-md ${
              cleaningOrphans
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {cleaningOrphans ? 'Cleaning...' : 'Clean Orphaned Library Items'}
          </button>

          <button
            onClick={handleShowResetConfirmation}
            disabled={resettingElo}
            className={`px-4 py-2 rounded-md ${
              resettingElo
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {resettingElo ? 'Resetting...' : 'Reset ELO System'}
          </button>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Remove Test Document:</span> Removes the test document from the database if it exists. This can fix comparison issues.
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Clean Orphaned Library Items:</span> Deletes library items that reference media IDs which no longer exist in the mediaMetadata collection.
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Reset ELO System:</span> Resets all ELO ratings to default values (1500), clears comparison counts, and resets metadata. All ranking progress will be lost.
          </p>
        </div>
      </div>
      
      {/* Reset Confirmation Dialog */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Confirm ELO System Reset</h3>
            <p className="mb-4">
              Are you sure you want to reset the entire ELO rating system? This action will:
            </p>
            <ul className="list-disc pl-5 mb-4 text-gray-700">
              <li>Reset all media ratings to their default value (1500)</li>
              <li>Clear all comparison counts and history</li>
              <li>Set all items back to provisional status</li>
              <li>Reset the system-wide metadata counters</li>
            </ul>
            <p className="font-bold mb-6 text-red-600">
              This action cannot be undone!
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResetEloSystem}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* System Initialization */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">System Initialization</h2>
        <p className="mb-2">
          Initialize the ELO rating system by creating the required database structures.
          This will:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>Create the ELO system metadata document if it doesn't exist</li>
          <li>Add ELO rating fields to your library items that don't have them</li>
        </ul>
        
        <button
          onClick={handleInitialize}
          disabled={loading}
          className={`px-4 py-2 rounded-md ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Initializing...' : 'Initialize ELO System'}
        </button>
        
        {result && (
          <div className={`mt-4 p-3 rounded-md ${
            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <p>{result.message}</p>
          </div>
        )}
      </div>
      
      {/* System Parameters */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">System Parameters</h2>
        
        {metadata ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Rating Parameters</h3>
              <ul className="space-y-2">
                <li><span className="font-medium">Tau (volatility constraint):</span> {metadata.tau}</li>
                <li><span className="font-medium">RD Decay Rate:</span> {(metadata.decayRate * 100).toFixed(1)}% per day</li>
                <li><span className="font-medium">UCB Exploration Weight:</span> {metadata.ucbExplorationWeight}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Default Values</h3>
              <ul className="space-y-2">
                <li><span className="font-medium">Initial Rating:</span> 1500</li>
                <li><span className="font-medium">Initial RD:</span> 350</li>
                <li><span className="font-medium">Initial Volatility:</span> 0.06</li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="italic text-gray-600">
            Parameter configuration will be available after system initialization.
          </p>
        )}
      </div>
    </div>
  );
};

export default EloAdminPage; 