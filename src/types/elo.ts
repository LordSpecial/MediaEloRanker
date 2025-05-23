import { Timestamp } from 'firebase/firestore';

/**
 * Category-specific ELO rating data
 */
export interface CategoryEloRating {
  rating: number;
  rd: number;
  vol: number;
  comparisonCount: number;
  lastCompared: Timestamp;
}

/**
 * ELO data stored in each media document
 */
export interface EloData {
  rating: number;
  rd: number;
  vol: number;
  comparisonCount: number;
  lastCompared: Timestamp;
  provisional: boolean;
  categoryRatings: {
    [category: string]: CategoryEloRating;
  };
}

/**
 * Global ELO system metadata
 */
export interface EloMetadata {
  totalComparisons: number;
  lastRDDecay: Timestamp;
  tau: number;
  decayRate: number;
  provisionalThreshold: number;
  ucbExplorationWeight: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Media document with ELO data
 */
export interface MediaWithElo {
  id: string;
  title: string;
  type: string;
  imageUrl: string;
  releaseYear: number;
  createdAt: Timestamp;
  metadata: any;
  elo: EloData;
}

/**
 * Result of a rating update
 */
export interface RatingUpdateResult {
  winner: {
    id: string;
    oldRating: number;
    newRating: number;
    ratingChange: number;
  };
  loser: {
    id: string;
    oldRating: number;
    newRating: number;
    ratingChange: number;
  };
} 