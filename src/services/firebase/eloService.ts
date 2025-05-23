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
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase';

// Constants for Glicko-2 algorithm
const DEFAULT_RATING = 1500;
const DEFAULT_RD = 350;
const DEFAULT_VOL = 0.06;
const SCALE_FACTOR = 173.7178; // Convert from Glicko-2 to Glicko-1 scale

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
      
      return metadataSnap.data();
    } catch (error) {
      console.error('Error getting ELO metadata:', error);
      throw error;
    }
  },
  
  /**
   * Initialize ELO fields for all existing media documents
   */
  async initializeEloFields() {
    try {
      // First initialize metadata if it doesn't exist
      await this.initializeEloMetadata();
      
      // Get all media documents
      const mediaRef = collection(db, 'mediaMetadata');
      const mediaSnapshot = await getDocs(mediaRef);
      
      if (mediaSnapshot.empty) {
        console.log('No media documents found to initialize');
        return 0;
      }
      
      // Process in batches to avoid hitting write limits
      const batchSize = 500;
      const batches = [];
      
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      let totalOperations = 0;
      
      mediaSnapshot.forEach(doc => {
        // Check if elo field already exists
        const data = doc.data();
        if (data.elo) {
          // Skip documents that already have ELO data
          return;
        }
        
        // Add ELO fields
        currentBatch.update(doc.ref, {
          'elo': {
            rating: DEFAULT_RATING,
            rd: DEFAULT_RD,
            vol: DEFAULT_VOL,
            comparisonCount: 0,
            lastCompared: serverTimestamp(),
            provisional: true,
            categoryRatings: {}
          }
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
      
      // Commit all batches
      if (batches.length > 0) {
        await Promise.all(batches.map(batch => batch.commit()));
        console.log(`ELO fields initialized for ${totalOperations} media documents`);
      } else {
        console.log('No documents needed ELO field initialization');
      }
      
      return totalOperations;
    } catch (error) {
      console.error('Error initializing ELO fields:', error);
      throw error;
    }
  },
  
  /**
   * Initialize the entire ELO system (metadata and fields)
   */
  async initializeEloSystem() {
    try {
      // Step 1: Initialize metadata
      const metadataInitialized = await this.initializeEloMetadata();
      
      // Step 2: Initialize fields for all media documents
      const fieldsInitialized = await this.initializeEloFields();
      
      return {
        metadataInitialized,
        fieldsInitialized
      };
    } catch (error) {
      console.error('Error initializing ELO system:', error);
      throw error;
    }
  }
  
  // Other methods will be implemented in future stages...
}; 