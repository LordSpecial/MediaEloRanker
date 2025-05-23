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

// Constants for ELO calculation
const DEFAULT_RATING = 1500;
const DEFAULT_RD = 350; // Rating deviation for new players
const DEFAULT_K_FACTOR = 24; // K-factor determines how much ratings change (lower = smaller changes)
const RECENT_COMPARISONS_LIMIT = 20; // Number of recent comparisons to track per user

// Expected outcome calculation using standard ELO formula
function expectedOutcome(ratingA: number, ratingB: number): number {
  // Standard ELO formula with 400 scaling factor
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

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
        console.log('ELO system metadata initialized successfully');
        return true;
      } else {
        console.log('ELO system metadata already exists');
        return false;
      }
    } catch (error) {
      console.error('Error initializing ELO metadata:', error);
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
      console.error('Error getting ELO metadata:', error);
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
        console.log('No library items found to initialize');
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
        console.log(`ELO fields initialized for ${totalOperations} library items`);
      } else {
        console.log('No library items needed ELO field initialization');
      }
      
      return totalOperations;
    } catch (error) {
      console.error('Error initializing user ELO fields:', error);
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
      console.error('Error initializing ELO system:', error);
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
        console.log('No library items found for random selection');
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
      console.error('Error selecting random item:', error);
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
      
      console.log(`Found ${recentPairs.length} recent comparisons to avoid`);
      
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
        console.log('No library items found for comparison');
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
      
      // Log the number of filtered candidates
      console.log(`Found ${candidates.length} valid items for comparison after filtering`);
      
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
          // Log selection with detailed information for debugging
          console.log(`Selected comparison pair:
            First: ${firstItem.id} (Score: ${firstItem.score.toFixed(2)}, Rating: ${firstItem.rating}, RD: ${firstItem.rd}, Matches: ${firstItem.matches})
            Second: ${secondItem.id} (Score: ${secondItem.score.toFixed(2)}, Rating: ${secondItem.rating}, RD: ${secondItem.rd}, Matches: ${secondItem.matches})
          `);
          return [firstItem, secondItem];
        }
      }
      
      // If all top matches have been recently compared, take the best match anyway
      console.log('All top matches recently compared, using best match anyway');
      return [firstItem, matchPool[0]];
    } catch (error) {
      console.error('Error selecting pair for comparison:', error);
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
        console.log('Permission error accessing recent comparisons, continuing without this feature');
      } else {
        console.error('Error getting recent comparisons:', error);
      }
      // Return empty array on error so the selection can continue
      return [];
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
        console.log('Permission error storing recent comparison, continuing without this feature');
      } else {
        console.error('Error storing comparison pair:', error);
      }
      // Don't throw, this is a non-critical operation
      return false;
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
        console.log(`Cleaned up ${docsToDelete.length} old comparison records`);
      }
      
      return true;
    } catch (error) {
      // If we get a permission error, log it but continue without blocking the app
      if ((error as any)?.message?.includes('permission')) {
        console.log('Permission error cleaning up old comparisons, continuing without this feature');
      } else {
        console.error('Error cleaning up old comparisons:', error);
      }
      // Don't throw, this is a non-critical operation
      return false;
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
      console.log('===== updateRatings START =====');
      console.log(`Updating ratings - userId: ${userId}, winnerId: ${winnerId}, loserId: ${loserId}, isDraw: ${isDraw}`);
      
      // Try to store this comparison pair but don't let errors block the main functionality
      try {
        await this.storeComparisonPair(userId, winnerId, loserId);
      } catch (error) {
        console.log('Could not store comparison pair, but continuing with rating update');
      }
      
      // Get current ratings for both items
      console.log('Getting document references for winner and loser');
      const winnerRef = doc(db, `users/${userId}/library`, winnerId);
      const loserRef = doc(db, `users/${userId}/library`, loserId);
      
      console.log('Fetching winner and loser documents from Firestore');
      const [winnerSnap, loserSnap] = await Promise.all([
        getDoc(winnerRef),
        getDoc(loserRef)
      ]);
      
      console.log(`Winner exists: ${winnerSnap.exists()}, Loser exists: ${loserSnap.exists()}`);
      if (!winnerSnap.exists() || !loserSnap.exists()) {
        console.error(`Winner/loser document not found - winnerExists: ${winnerSnap.exists()}, loserExists: ${loserSnap.exists()}`);
        throw new Error('One or both media items not found in the library');
      }
      
      const winner = winnerSnap.data();
      const loser = loserSnap.data();
      console.log('Winner data:', winner);
      console.log('Loser data:', loser);
      
      // Get metadata for system parameters
      console.log('Fetching ELO metadata');
      const metadata = await this.getEloMetadata();
      console.log('ELO metadata:', metadata);
      
      // Get current ratings
      const winnerRating = winner.globalEloScore || DEFAULT_RATING;
      const loserRating = loser.globalEloScore || DEFAULT_RATING;
      
      // Calculate K-factor adjustments based on number of matches
      // K-factor decreases as the number of matches increases (stabilizes with more matches)
      const winnerMatches = winner.globalEloMatches || 0;
      const loserMatches = loser.globalEloMatches || 0;
      const winnerK = this.getAdjustedKFactor(winnerMatches, metadata);
      const loserK = this.getAdjustedKFactor(loserMatches, metadata);
      
      console.log('Current ratings - winner:', winnerRating, 'loser:', loserRating);
      console.log('K-factors - winner:', winnerK, 'loser:', loserK);
      
      // Calculate expected outcomes
      const winnerExpected = expectedOutcome(winnerRating, loserRating);
      const loserExpected = expectedOutcome(loserRating, winnerRating);
      console.log('Expected outcomes - winner:', winnerExpected, 'loser:', loserExpected);
      
      // Determine actual outcome
      let winnerOutcome, loserOutcome;
      if (isDraw) {
        winnerOutcome = 0.5;
        loserOutcome = 0.5;
      } else {
        winnerOutcome = 1.0; // Winner
        loserOutcome = 0.0; // Loser
      }
      console.log('Actual outcomes - winner:', winnerOutcome, 'loser:', loserOutcome);
      
      // Calculate new ratings using standard ELO formula
      const newWinnerRating = this.calculateNewRating(winnerRating, loserRating, winnerOutcome, winnerK);
      const newLoserRating = this.calculateNewRating(loserRating, winnerRating, loserOutcome, loserK);
      
      console.log('New ratings - winner:', newWinnerRating, 'loser:', newLoserRating);
      
      // Explicitly log the rating changes
      const winnerChange = newWinnerRating - winnerRating;
      const loserChange = newLoserRating - loserRating;
      console.log('Rating changes - winner:', winnerChange, 'loser:', loserChange);
      
      // Check if changes are too small
      const minChange = 1.0; // Minimum meaningful change
      let adjustedWinnerRating = newWinnerRating;
      let adjustedLoserRating = newLoserRating;
      
      // If changes are very small, ensure at least a small change in the appropriate direction
      if (Math.abs(winnerChange) < minChange && Math.abs(loserChange) < minChange && !isDraw) {
        console.warn('Both rating changes are very small, applying minimum change');
        adjustedWinnerRating = winnerRating + minChange;
        adjustedLoserRating = loserRating - minChange;
      }
      
      // Get category-specific values
      console.log('Checking for category-specific updates');
      const winnerType = winner.type;
      const loserType = loser.type;
      const isSameCategory = winnerType === loserType;
      console.log('Winner type:', winnerType, 'Loser type:', loserType, 'Same category:', isSameCategory);
      
      // Update database in a batch
      console.log('Creating batch update');
      const batch = writeBatch(db);
      
      // Update winner
      console.log('Preparing batch update for winner');
      batch.update(winnerRef, {
        globalEloScore: adjustedWinnerRating,
        globalEloMatches: winnerMatches + 1,
        eloRD: DEFAULT_RD / (1 + winnerMatches/50), // RD decreases with more matches
        lastUpdated: serverTimestamp(),
        provisional: winnerMatches + 1 < metadata.provisionalThreshold
      });
      
      // Update category scores if same category
      if (isSameCategory) {
        console.log('Adding category-specific updates for winner');
        batch.update(winnerRef, {
          categoryEloScore: adjustedWinnerRating,
          categoryEloMatches: (winner.categoryEloMatches || 0) + 1
        });
      }
      
      // Update loser
      console.log('Preparing batch update for loser');
      batch.update(loserRef, {
        globalEloScore: adjustedLoserRating,
        globalEloMatches: loserMatches + 1,
        eloRD: DEFAULT_RD / (1 + loserMatches/50), // RD decreases with more matches
        lastUpdated: serverTimestamp(),
        provisional: loserMatches + 1 < metadata.provisionalThreshold
      });
      
      // Update category scores if same category
      if (isSameCategory) {
        console.log('Adding category-specific updates for loser');
        batch.update(loserRef, {
          categoryEloScore: adjustedLoserRating,
          categoryEloMatches: (loser.categoryEloMatches || 0) + 1
        });
      }
      
      // Update ELO metadata
      console.log('Preparing metadata update');
      const metadataRef = doc(db, 'eloSystem', 'metadata');
      batch.update(metadataRef, {
        totalComparisons: metadata.totalComparisons + 1,
        updatedAt: serverTimestamp()
      });
      
      console.log('Committing batch update to Firestore');
      await batch.commit();
      console.log('Batch update committed successfully');
      
      // Return the results of the update
      const result = {
        winner: {
          id: winnerId,
          oldRating: winnerRating,
          newRating: adjustedWinnerRating,
          ratingChange: adjustedWinnerRating - winnerRating
        },
        loser: {
          id: loserId,
          oldRating: loserRating,
          newRating: adjustedLoserRating,
          ratingChange: adjustedLoserRating - loserRating
        }
      };
      
      console.log('Rating update result:', result);
      console.log('===== updateRatings END =====');
      return result;
    } catch (error) {
      console.error('===== updateRatings ERROR =====');
      console.error('Error updating ratings:', error);
      console.error('Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        stack: (error as any).stack
      });
      console.error('Parameters:', { userId, winnerId, loserId, isDraw });
      throw error;
    }
  },

  /**
   * Get a K-factor adjusted based on number of matches
   * K-factor determines how fast ratings change
   */
  getAdjustedKFactor(matches: number, metadata: any): number {
    // K-factor starts higher for new items and decreases as they get more matches
    if (matches < 5) {
      return DEFAULT_K_FACTOR * 1.5; // Higher K for very new items (fast initial adjustment)
    } else if (matches < metadata.provisionalThreshold) {
      return DEFAULT_K_FACTOR * 1.2; // Slightly higher K for newer items
    } else {
      return DEFAULT_K_FACTOR; // Normal K for established items
    }
  },

  /**
   * Calculate new rating using standard ELO formula
   */
  calculateNewRating(ratingA: number, ratingB: number, outcome: number, kFactor: number = DEFAULT_K_FACTOR): number {
    try {
      console.log('=== calculateNewRating START ===');
      console.log('Input parameters:', { ratingA, ratingB, outcome, kFactor });
      
      // Get expected outcome using standard ELO formula
      const expected = expectedOutcome(ratingA, ratingB);
      
      // Standard ELO calculation
      let ratingChange = kFactor * (outcome - expected);
      
      // Round to one decimal place for cleaner numbers
      ratingChange = Math.round(ratingChange * 10) / 10;
      
      console.log(`Rating calculation: ${ratingA} + ${ratingChange} (outcome: ${outcome}, expected: ${expected.toFixed(4)})`);
      
      const newRating = ratingA + ratingChange;
      
      console.log('=== calculateNewRating END ===');
      console.log('Result:', newRating);
      return newRating;
    } catch (error) {
      console.error('=== calculateNewRating ERROR ===');
      console.error('Error in calculateNewRating:', error);
      console.error('Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        stack: (error as any).stack
      });
      console.error('Input parameters:', { ratingA, ratingB, outcome, kFactor });
      
      // Return a fallback result
      console.warn('Returning default fallback values');
      return ratingA + 1; // Small default change
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
      console.error('Error getting top ranked items:', error);
      throw error;
    }
  }
}; 