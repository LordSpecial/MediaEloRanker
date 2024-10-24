# Media Library Firestore Structure Documentation

## Overview
This database structure supports a media library application where users can:
- Add various types of media (films, TV shows, anime, music) to their personal library
- Rate media items
- Participate in ELO-based ranking system
- View personalized rankings both globally and by category

## Database Structure

### Collections Overview
```
/mediaMetadata/{mediaId}     - Global media information
/users/{userId}              - User profiles
  └── /library/{mediaId}     - User's personal library items
  └── /rankings/{type}       - Cached ranking lists
```

### Collection Details

#### 1. mediaMetadata Collection
Stores global information about media items. Single source of truth for media details.

```typescript
interface MediaMetadata {
  id: string;                  // Matches document ID
  type: "film" | "tv" | "anime" | "music";
  title: string;
  releaseYear: number;
  imageUrl: string;
  createdAt: Timestamp;
  
  // Optional fields based on type
  director?: string;           // for films
  seasons?: number;            // for tv/anime
  episodes?: number;           // for tv/anime
  artist?: string;            // for music
  duration?: number;          // length in minutes
}
```

Example document:
```javascript
// Document ID: inception2010
{
  id: "inception2010",
  type: "film",
  title: "Inception",
  releaseYear: 2010,
  imageUrl: "https://example.com/inception.jpg",
  director: "Christopher Nolan",
  duration: 148,
  createdAt: Timestamp
}
```

#### 2. users Collection
Stores user profiles and contains subcollections for library and rankings.

```typescript
interface UserProfile {
  email: string;
  displayName: string;
  createdAt: Timestamp;
  settings: {
    preferredTypes: string[];
  }
}
```

#### 3. library Subcollection
Stores user-specific data for each media item in their library.

```typescript
interface UserLibraryItem {
  mediaId: string;            // Reference to mediaMetadata
  addedAt: Timestamp;
  userRating: number | null;  // 1-10 rating scale
  notes?: string;            // Optional user notes
  
  // ELO rankings
  globalEloScore: number;     // Starting at 1500
  globalEloMatches: number;   // Number of matches played
  categoryEloScore: number;   // Type-specific ELO
  categoryEloMatches: number;
  
  lastUpdated: Timestamp;
}
```

#### 4. rankings Subcollection
Caches ranking results for quick access.

```typescript
interface RankingCache {
  lastUpdated: Timestamp;
  topGlobal: Array<{
    mediaId: string;
    score: number;
  }>;
  topCategory: Array<{
    mediaId: string;
    score: number;
  }>;
}
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Media metadata - public read, admin write
    match /mediaMetadata/{mediaId} {
      allow read: if true;
      allow write: if false; // Configure admin access separately
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      
      // Library subcollection
      match /library/{mediaId} {
        allow read: if isAuthenticated() && isOwner(userId);
        allow write: if isAuthenticated() && isOwner(userId);
      }
      
      // Rankings subcollection
      match /rankings/{type} {
        allow read: if isAuthenticated() && isOwner(userId);
        allow write: if false; // Updated via Cloud Functions
      }
    }
  }
}
```

## Required Indexes

```javascript
{
  "indexes": [
    // Library queries by type and score
    {
      "collectionGroup": "library",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "globalEloScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "library",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "categoryEloScore", "order": "DESCENDING" }
      ]
    },
    // User ratings query
    {
      "collectionGroup": "library",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "userRating", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Common Operations

### Adding Media to Library
```typescript
async function addToLibrary(userId: string, mediaId: string) {
    const userLibraryRef = doc(db, `users/${userId}/library/${mediaId}`);
    
    await setDoc(userLibraryRef, {
        mediaId,
        addedAt: serverTimestamp(),
        userRating: null,
        globalEloScore: 1500,
        globalEloMatches: 0,
        categoryEloScore: 1500,
        categoryEloMatches: 0,
        lastUpdated: serverTimestamp()
    });
}
```

### Retrieving User's Library
```typescript
async function getUserLibrary(userId: string) {
    // Get library items
    const libraryRef = collection(db, `users/${userId}/library`);
    const librarySnapshot = await getDocs(libraryRef);
    
    // Get media details
    const mediaIds = librarySnapshot.docs.map(doc => doc.id);
    const mediaDetails = await Promise.all(
        mediaIds.map(id => getDoc(doc(db, 'mediaMetadata', id)))
    );
    
    // Combine data
    return librarySnapshot.docs.map((libDoc, index) => ({
        ...mediaDetails[index].data(),
        ...libDoc.data()
    }));
}
```

### Updating ELO Scores
```typescript
async function updateEloScores(
    userId: string,
    winnerId: string,
    loserId: string,
    category: 'global' | MediaType
) {
    const batch = writeBatch(db);
    const K = 32; // ELO K-factor
    
    const winnerRef = doc(db, `users/${userId}/library/${winnerId}`);
    const loserRef = doc(db, `users/${userId}/library/${loserId}`);
    
    // Get current scores
    const [winnerDoc, loserDoc] = await Promise.all([
        getDoc(winnerRef),
        getDoc(loserRef)
    ]);
    
    // Calculate new scores
    const scoreField = `${category}EloScore`;
    const matchesField = `${category}EloMatches`;
    
    const winnerScore = winnerDoc.data()?.[scoreField];
    const loserScore = loserDoc.data()?.[scoreField];
    
    const expectedWinner = 1 / (1 + Math.pow(10, (loserScore - winnerScore) / 400));
    const newWinnerScore = winnerScore + K * (1 - expectedWinner);
    const newLoserScore = loserScore + K * (0 - (1 - expectedWinner));
    
    // Update scores
    batch.update(winnerRef, {
        [scoreField]: newWinnerScore,
        [matchesField]: increment(1),
        lastUpdated: serverTimestamp()
    });
    
    batch.update(loserRef, {
        [scoreField]: newLoserScore,
        [matchesField]: increment(1),
        lastUpdated: serverTimestamp()
    });
    
    await batch.commit();
}
```

## Implementation Notes

1. Initialize Firebase in your project:
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

2. Create indexes before deploying:
```bash
firebase deploy --only firestore:indexes
```

3. Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

4. Consider implementing Cloud Functions for:
- Updating ranking caches
- Cleaning up unused media references
- Maintaining data consistency
- Processing ELO updates

5. Regular maintenance:
- Monitor document sizes
- Update ranking caches periodically
- Clean up orphaned media references
- Back up data regularly

Would you like me to:
- Add more implementation examples?
- Include migration scripts?
- Add Cloud Functions templates?
- Include more query patterns?
- Add data validation examples?