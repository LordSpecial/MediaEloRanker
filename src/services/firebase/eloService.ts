import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { EloMetadata, RatingUpdateResult } from '../../types/elo';
import { useAuth } from '../../contexts/AuthContext';
import { expectedOutcome, getAdjustedKFactor, calculateEloResult, DEFAULT_RD } from '../utils/eloMath';

// Constants for ELO calculation
const DEFAULT_RATING = 1500;
const DEFAULT_K_FACTOR = 20; // Base K-factor
const K_ADJUSTMENT_STRENGTH = 5.0; // How strongly rating differences affect K-factor adjustments
const RECENT_COMPARISONS_LIMIT = 20; // Number of recent comparisons to track per user

// ELO Service implementation
export const eloService = {
  /**
   * Initialize the ELO system metadata document
   */
  async initializeEloMetadata() {
    try {
      const metadataRef = doc(db, 'eloSystem', 'metadata');
      const metadataSnap = await getDoc(metadataRef);
      
      // Only create if it doesn't exist
      if (!metadataSnap.exists()) {
        await setDoc(metadataRef, {
          totalComparisons: 0,
          lastRDDecay: serverTimestamp(),
          tau: 0.5,                 // Moderate volatility constraint
          decayRate: 0.015,         // ~1.5% increase in RD per day of inactivity
          provisionalThreshold: 15, // Exit provisional state after 15 comparisons
          ucbExplorationWeight: 1.414, // Standard UCB exploration weight (sqrt(2))
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get the ELO system metadata
   */
  async getEloMetadata() {
    try {
      const metadataRef = doc(db, 'eloSystem', 'metadata');
      const metadataSnap = await getDoc(metadataRef);
      
      if (!metadataSnap.exists()) {
        throw new Error('ELO metadata not initialized');
      }
      
      return metadataSnap.data() as EloMetadata;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Initialize ELO fields for a user's library items
   * @param userId The user ID to initialize ELO fields for
   */
  async initializeUserEloFields(userId: string) {
    try {
      // First initialize metadata if it doesn't exist
      await this.initializeEloMetadata();
      
      // Get all library items for the user
      const libraryRef = collection(db, `users/${userId}/library`);
      const librarySnapshot = await getDocs(libraryRef);
      
      if (librarySnapshot.empty) {
        return 0;
      }
      
      // Process in batches to avoid hitting write limits
      const batchSize = 500;
      const batches = [];
      
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      let totalOperations = 0;
      
      librarySnapshot.forEach(doc => {
        const data = doc.data();
        
        // Only update if ELO fields don't exist or are not properly set
        if (!data.globalEloScore || !data.globalEloMatches) {
          currentBatch.update(doc.ref, {
            globalEloScore: DEFAULT_RATING,
            globalEloMatches: 0,
            categoryEloScore: DEFAULT_RATING,
            categoryEloMatches: 0,
            lastUpdated: serverTimestamp(),
            eloRD: DEFAULT_RD,
            eloVolatility: DEFAULT_RD / 400,
            provisional: true
          });
          
          operationCount++;
          totalOperations++;
        }
        
        // Create a new batch when this one is full
        if (operationCount >= batchSize) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      });
      
      // Push the last batch if it has operations
      if (operationCount > 0) {
        batches.push(currentBatch);
      }
      
      // Commit all batches
      if (batches.length > 0) {
        await Promise.all(batches.map(batch => batch.commit()));
      }
      
      return totalOperations;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Initialize the entire ELO system (metadata and fields)
   * @param userId The user ID to initialize ELO fields for
   */
  async initializeEloSystem(userId?: string) {
    try {
      // Step 1: Initialize metadata
      const metadataInitialized = await this.initializeEloMetadata();
      
      // Step 2: Initialize fields for the user's library if userId is provided
      let fieldsInitialized = 0;
      if (userId) {
        fieldsInitialized = await this.initializeUserEloFields(userId);
      }
      
      return {
        success: true,
        message: `ELO system initialized. Metadata: ${metadataInitialized ? 'Created new' : 'Already exists'}. User items initialized: ${fieldsInitialized}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error initializing ELO system: ${error.message}`
      };
    }
  },

  /**
   * Select a single random item from the user's library
   * @param userId The user ID
   * @param type Optional media type to filter by
   */
  async selectRandomItem(userId: string, type: string | null = null) {
    try {
      const constraints: any[] = [];
      
      // Add type filter if specified
      if (type) {
        constraints.push(where('type', '==', type));
      }
      
      const libraryRef = collection(db, `users/${userId}/library`);
      const queryRef = constraints.length > 0 ? query(libraryRef, ...constraints) : query(libraryRef);
      const snapshot = await getDocs(queryRef);
      
      if (snapshot.empty) {
        return null;
      }
      
      // Select a random document from the results
      const randomIndex = Math.floor(Math.random() * snapshot.size);
      const randomDoc = snapshot.docs[randomIndex];
      
      return {
        id: randomDoc.id,
        ...randomDoc.data()
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Select two items for comparison using a balanced algorithm that considers
   * uncertainty, rating, and ensures variety between comparisons
   * @param userId The user ID
   * @param type Optional media type to filter by
   */
  async selectPairForComparison(userId: string, type: string | null = null) {
    try {
      // Get ELO metadata for parameters
      const metadata = await this.getEloMetadata();
      const { ucbExplorationWeight } = metadata;
      
      // First, get recently compared pairs to avoid repeats
      const recentPairs = await this.getRecentComparisons(userId);
      const recentPairMap = new Map();
      
      // Create a map of item pairs for quick lookup
      recentPairs.forEach(pair => {
        // Store both item1-item2 and item2-item1 to catch pairs regardless of order
        recentPairMap.set(`${pair.item1Id}-${pair.item2Id}`, true);
        recentPairMap.set(`${pair.item2Id}-${pair.item1Id}`, true);
      });
      
      // Keep track of items that were recently the "first" item in a comparison
      // This helps ensure we don't always pick the same first item
      const recentFirstItems = new Set();
      recentPairs.slice(0, 5).forEach(pair => {
        recentFirstItems.add(pair.item1Id);
      });
      
      // Query constraints for items
      const constraints: any[] = [
        limit(150) // Get a larger pool of candidates
      ];
      
      if (type) {
        constraints.unshift(where('type', '==', type));
      }
      
      // Execute query
      const libraryRef = collection(db, `users/${userId}/library`);
      const candidatesQuery = query(libraryRef, ...constraints);
      const candidatesSnapshot = await getDocs(candidatesQuery);
      
      if (candidatesSnapshot.empty) {
        return [];
      }
      
      // Calculate scores for each item, considering uncertainty (RD) and match count
      const candidates = candidatesSnapshot.docs
        .map(doc => {
          const data = doc.data();
          const globalMatches = data.globalEloMatches || 0;
          const rating = data.globalEloScore || DEFAULT_RATING;
          const rd = data.eloRD || DEFAULT_RD;
          
          // Higher score for:
          // 1. Items with fewer matches (needs exploration)
          // 2. Items with higher RD (more uncertainty)
          // 3. Items with higher ratings (proven quality)
          
          // Normalize match count (inverse so fewer matches = higher score)
          const matchScore = Math.max(1, 30 - globalMatches) / 30;
          
          // Normalize RD (higher RD = higher score)
          const rdScore = rd / DEFAULT_RD;
          
          // Normalize rating around 1500
          const ratingScore = (rating - 1400) / 200;
          
          // Combined score with weights
          const score = (
            (matchScore * 0.5) +     // 50% weight on fewer matches
            (rdScore * 0.3) +        // 30% weight on uncertainty
            (ratingScore * 0.2)      // 20% weight on rating
          );
          
          // Add small random factor to break ties and add variety (±10%)
          const randomFactor = 0.9 + (Math.random() * 0.2);
          const finalScore = score * randomFactor;
          
          return {
            id: doc.id,
            score: finalScore,
            ucbScore: rating + ucbExplorationWeight * Math.sqrt(Math.log(metadata.totalComparisons + 1) / (globalMatches + 1)),
            mediaId: data.mediaId,
            type: data.type,
            matches: globalMatches,
            rd: rd,
            rating: rating,
            wasRecentFirstItem: recentFirstItems.has(doc.id),
            ...data
          } as any;
        })
        .filter(item => {
          // Filter out items missing essential properties
          return item?.mediaId && item?.type;
        });
      
      // If we have fewer than 2 items, we can't make a comparison
      if (candidates.length < 2) {
        return candidates;
      }
      
      // Sort by score
      candidates.sort((a, b) => b.score - a.score);
      
      // Select a pool of top candidates for first and second positions
      const topCandidatesCount = Math.min(15, Math.floor(candidates.length / 2));
      const poolForFirstItem = candidates.slice(0, topCandidatesCount).filter(item => !item.wasRecentFirstItem);
      
      // If all top candidates were recently first items, use the original pool
      const firstItemPool = poolForFirstItem.length > 0 ? poolForFirstItem : candidates.slice(0, topCandidatesCount);
      
      // Select first item with some randomness from top pool
      const firstItemIndex = Math.floor(Math.random() * Math.min(5, firstItemPool.length));
      const firstItem = firstItemPool[firstItemIndex];
      
      // Remove the selected first item from consideration for second item
      const remainingCandidates = candidates.filter(item => item.id !== firstItem.id);
      
      // Find a good match for the first item:
      // 1. Similar rating range (within about ±200 points) for competitive match
      // 2. High uncertainty (RD) to help refine ratings
      // 3. Not recently compared with first item
      
      // Calculate rating similarity score and combine with base score
      remainingCandidates.forEach(item => {
        const ratingDiff = Math.abs(item.rating - firstItem.rating);
        // Higher score for closer ratings (up to ±200 points)
        const ratingMatchScore = Math.max(0, 1 - (ratingDiff / 400));
        // Combine with original score
        item.matchScore = (item.score * 0.5) + (ratingMatchScore * 0.5);
      });
      
      // Sort by match score
      remainingCandidates.sort((a, b) => b.matchScore - a.matchScore);
      
      // Get a pool of good matches
      const matchPool = remainingCandidates.slice(0, 10);
      
      // Try to find a pair that hasn't been recently compared
      for (const secondItem of matchPool) {
        const pairKey = `${firstItem.id}-${secondItem.id}`;
        if (!recentPairMap.has(pairKey)) {
          return [firstItem, secondItem];
        }
      }
      
      // If all top matches have been recently compared, take the best match anyway
      return [firstItem, matchPool[0]];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get recent comparison pairs for a user to avoid repeats
   * @param userId The user ID
   */
  async getRecentComparisons(userId: string) {
    try {
      const comparisonsRef = collection(db, `users/${userId}/recentComparisons`);
      const comparisonsQuery = query(
        comparisonsRef,
        orderBy('timestamp', 'desc'),
        limit(RECENT_COMPARISONS_LIMIT)
      );
      
      const snapshot = await getDocs(comparisonsQuery);
      
      if (snapshot.empty) {
        return [];
      }
      
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      // If we get a permission error, log it and continue without blocking the app
      if ((error as any)?.message?.includes('permission')) {
        return [];
      } else {
        throw error;
      }
    }
  },

  /**
   * Store a comparison pair to prevent it from being selected again soon
   * @param userId The user ID
   * @param item1Id First item ID
   * @param item2Id Second item ID
   */
  async storeComparisonPair(userId: string, item1Id: string, item2Id: string) {
    try {
      // Create a document with a unique ID
      const comparisonRef = doc(collection(db, `users/${userId}/recentComparisons`));
      
      // Store the comparison data
      await setDoc(comparisonRef, {
        item1Id,
        item2Id,
        timestamp: serverTimestamp()
      });
      
      // Clean up old comparisons to keep collection size manageable
      await this.cleanupOldComparisons(userId);
      
      return true;
    } catch (error) {
      // If we get a permission error, log it but continue without blocking the app
      if ((error as any)?.message?.includes('permission')) {
        return false;
      } else {
        throw error;
      }
    }
  },

  /**
   * Clean up old comparison records to keep the collection size manageable
   * @param userId The user ID
   */
  async cleanupOldComparisons(userId: string) {
    try {
      const comparisonsRef = collection(db, `users/${userId}/recentComparisons`);
      const allComparisonsQuery = query(
        comparisonsRef,
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(allComparisonsQuery);
      
      // If we have more than the limit, delete the oldest ones
      if (snapshot.docs.length > RECENT_COMPARISONS_LIMIT) {
        // Get IDs of documents to delete (the oldest ones)
        const docsToDelete = snapshot.docs.slice(RECENT_COMPARISONS_LIMIT);
        
        // Delete in batch to be efficient
        const batch = writeBatch(db);
        docsToDelete.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
      }
      
      return true;
    } catch (error) {
      // If we get a permission error, log it but continue without blocking the app
      if ((error as any)?.message?.includes('permission')) {
        return false;
      } else {
        throw error;
      }
    }
  },

  /**
   * Update ratings after a comparison
   * @param userId The user ID
   * @param winnerId ID of the winning item
   * @param loserId ID of the losing item
   * @param isDraw Whether the comparison was a draw
   */
  async updateRatings(userId: string, winnerId: string, loserId: string, isDraw: boolean = false): Promise<RatingUpdateResult> {
    try {
      // Get current ratings
      const [winnerSnap, loserSnap] = await Promise.all([
        getDoc(doc(db, `users/${userId}/library`, winnerId)),
        getDoc(doc(db, `users/${userId}/library`, loserId))
      ]);
      if (!winnerSnap.exists() || !loserSnap.exists()) {
        throw new Error('One or both media items not found');
      }
      const winner = winnerSnap.data();
      const loser = loserSnap.data();
      const metadata = await this.getEloMetadata();
      // Get current ratings and matches
      const winnerRating = winner.globalEloScore || DEFAULT_RATING;
      const loserRating = loser.globalEloScore || DEFAULT_RATING;
      const winnerMatches = winner.globalEloMatches || 0;
      const loserMatches = loser.globalEloMatches || 0;
      // Use shared ELO calculation
      const updateResult = calculateEloResult({
        winnerRating,
        loserRating,
        winnerMatches,
        loserMatches,
        metadata,
        isDraw
      });
      updateResult.winner.id = winnerId;
      updateResult.loser.id = loserId;
      // Update database
      const batch = writeBatch(db);
      const isSameCategory = winner.type === loser.type;
      batch.update(winnerSnap.ref, {
        globalEloScore: updateResult.winner.newRating,
        globalEloMatches: winnerMatches + 1,
        eloRD: DEFAULT_RD / (1 + winnerMatches/50),
        lastUpdated: serverTimestamp(),
        provisional: winnerMatches + 1 < metadata.provisionalThreshold,
        ...(isSameCategory && {
          categoryEloScore: updateResult.winner.newRating,
          categoryEloMatches: (winner.categoryEloMatches || 0) + 1
        })
      });
      batch.update(loserSnap.ref, {
        globalEloScore: updateResult.loser.newRating,
        globalEloMatches: loserMatches + 1,
        eloRD: DEFAULT_RD / (1 + loserMatches/50),
        lastUpdated: serverTimestamp(),
        provisional: loserMatches + 1 < metadata.provisionalThreshold,
        ...(isSameCategory && {
          categoryEloScore: updateResult.loser.newRating,
          categoryEloMatches: (loser.categoryEloMatches || 0) + 1
        })
      });
      batch.update(doc(db, 'eloSystem', 'metadata'), {
        totalComparisons: metadata.totalComparisons + 1,
        updatedAt: serverTimestamp()
      });
      await batch.commit();
      return updateResult;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get top ranked items from a user's library
   * @param userId The user ID
   * @param mediaType Optional media type filter
   * @param limit Maximum number of items to return
   * @param minComparisons Minimum number of comparisons required
   */
  async getTopRankedItems(userId: string, mediaType: string | null = null, limit: number = 20, minComparisons: number = 5) {
    try {
      const constraints: any[] = [
        where('globalEloMatches', '>=', minComparisons),
        orderBy('globalEloScore', 'desc'),
        limit
      ];
      
      if (mediaType) {
        constraints.unshift(where('type', '==', mediaType));
      }
      
      const libraryRef = collection(db, `users/${userId}/library`);
      const rankingsQuery = query(libraryRef, ...constraints);
      const snapshot = await getDocs(rankingsQuery);
      
      if (snapshot.empty) {
        return [];
      }
      
      return snapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          rank: index + 1,
          id: doc.id,
          mediaId: data.mediaId,
          type: data.type,
          globalEloScore: data.globalEloScore,
          categoryEloScore: data.categoryEloScore,
          globalEloMatches: data.globalEloMatches,
          categoryEloMatches: data.categoryEloMatches,
          eloRD: data.eloRD,
          provisional: data.provisional
        };
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset all ELO ratings and parameters for a user
   * This will reset all library items to their default ELO values and reset total comparisons in metadata
   * @param userId The user ID to reset ELO data for
   */
  async resetEloSystem(userId: string) {
    try {
      // 1. Get all library items for the user
      const libraryRef = collection(db, `users/${userId}/library`);
      const librarySnapshot = await getDocs(libraryRef);
      
      if (librarySnapshot.empty) {
        return {
          success: true,
          message: 'No library items found to reset',
          itemsReset: 0
        };
      }
      
      // Process in batches to avoid hitting write limits
      const batchSize = 500;
      const batches = [];
      
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      let totalOperations = 0;
      
      librarySnapshot.forEach(doc => {
        currentBatch.update(doc.ref, {
          globalEloScore: DEFAULT_RATING,
          globalEloMatches: 0,
          categoryEloScore: DEFAULT_RATING,
          categoryEloMatches: 0,
          lastUpdated: serverTimestamp(),
          eloRD: DEFAULT_RD,
          eloVolatility: DEFAULT_RD / 400,
          provisional: true
        });
        
        operationCount++;
        totalOperations++;
        
        // Create a new batch when this one is full
        if (operationCount >= batchSize) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      });
      
      // Push the last batch if it has operations
      if (operationCount > 0) {
        batches.push(currentBatch);
      }
      
      // 2. Reset ELO metadata counters
      const metadataRef = doc(db, 'eloSystem', 'metadata');
      const metadataSnap = await getDoc(metadataRef);
      
      // Create one more batch for metadata update
      const metadataBatch = writeBatch(db);
      
      if (metadataSnap.exists()) {
        metadataBatch.update(metadataRef, {
          totalComparisons: 0,
          updatedAt: serverTimestamp()
        });
      }
      
      // 3. Clear all recent comparisons
      try {
        const comparisonsRef = collection(db, `users/${userId}/recentComparisons`);
        const comparisonsSnap = await getDocs(comparisonsRef);
        
        if (!comparisonsSnap.empty) {
          const comparisonsBatch = writeBatch(db);
          comparisonsSnap.forEach(doc => {
            comparisonsBatch.delete(doc.ref);
          });
          batches.push(comparisonsBatch);
        }
      } catch (error) {
      }
      
      // Commit all batches including the metadata batch
      batches.push(metadataBatch);
      
      // Start committing all batches
      await Promise.all(batches.map(batch => batch.commit()));
      
      return {
        success: true,
        message: `Successfully reset ELO ratings for ${totalOperations} library items`,
        itemsReset: totalOperations
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error resetting ELO system: ${error.message || 'Unknown error'}`,
        itemsReset: 0
      };
    }
  }
}; 