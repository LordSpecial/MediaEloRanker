// Shared ELO calculation logic for frontend and backend
import { EloMetadata, RatingUpdateResult } from '../../types/elo';

export const DEFAULT_RATING = 1500;
export const DEFAULT_RD = 350;
export const DEFAULT_K_FACTOR = 15;
export const K_ADJUSTMENT_STRENGTH = 7.5;

// Standard ELO expected outcome formula
export function expectedOutcome(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// K-factor adjustment based on number of matches
export function getAdjustedKFactor(matches: number, metadata: EloMetadata): number {
  if (matches < 5) {
    return DEFAULT_K_FACTOR * 2.0;
  } else if (matches < 10) {
    return DEFAULT_K_FACTOR * 1.5;
  } else if (matches < metadata.provisionalThreshold) {
    return DEFAULT_K_FACTOR * 1.2;
  } else if (matches >= 50) {
    return DEFAULT_K_FACTOR * 0.8;
  }
  return DEFAULT_K_FACTOR;
}

// Calculate ELO rating changes for a comparison
export function calculateEloResult({
  winnerRating,
  loserRating,
  winnerMatches,
  loserMatches,
  metadata,
  isDraw = false
}: {
  winnerRating: number;
  loserRating: number;
  winnerMatches: number;
  loserMatches: number;
  metadata: EloMetadata;
  isDraw?: boolean;
}): RatingUpdateResult {
  const winnerExpected = expectedOutcome(winnerRating, loserRating);
  const loserExpected = expectedOutcome(loserRating, winnerRating);
  const winnerK = getAdjustedKFactor(winnerMatches, metadata);
  const loserK = getAdjustedKFactor(loserMatches, metadata);
  const [winnerOutcome, loserOutcome] = isDraw ? [0.5, 0.5] : [1.0, 0.0];
  const ratingDiff = winnerRating - loserRating;
  const diffFactor = Math.abs(ratingDiff) / 400;
  let winnerKMod = winnerK;
  let loserKMod = loserK;
  if (!isDraw) {
    const wasExpectedOutcome = (ratingDiff > 0 && winnerOutcome === 1.0) || (ratingDiff < 0 && winnerOutcome === 0.0);
    const adjustmentFactor = diffFactor * K_ADJUSTMENT_STRENGTH;
    if (wasExpectedOutcome) {
      winnerKMod *= Math.max(0.5, 1 - adjustmentFactor);
      loserKMod *= Math.max(0.5, 1 - adjustmentFactor);
    } else {
      winnerKMod *= Math.min(1.5, 1 + adjustmentFactor);
      loserKMod *= Math.min(1.5, 1 + adjustmentFactor);
    }
  }
  const winnerChange = winnerKMod * (winnerOutcome - winnerExpected);
  const loserChange = loserKMod * (loserOutcome - loserExpected);
  const newWinnerRating = Math.round((winnerRating + winnerChange) * 10) / 10;
  const newLoserRating = Math.round((loserRating + loserChange) * 10) / 10;
  return {
    winner: {
      id: '', // Fill in at call site if needed
      oldRating: winnerRating,
      newRating: newWinnerRating,
      ratingChange: newWinnerRating - winnerRating
    },
    loser: {
      id: '', // Fill in at call site if needed
      oldRating: loserRating,
      newRating: newLoserRating,
      ratingChange: newLoserRating - loserRating
    }
  };
} 