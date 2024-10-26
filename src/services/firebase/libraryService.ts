import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    QueryConstraint,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

// Base metadata interface
export interface BaseMediaMetadata {
    description: string;
    genre: string[];
}

// Media-specific metadata interfaces
export interface FilmTVMetadata extends BaseMediaMetadata {
    director: string;
    writers: string[];
    cast: string[];
    duration: string;
}

export interface AnimeMetadata extends BaseMediaMetadata {
    studio: string;
    director: string;
    writers: string[];
    cast: string[];
    episodes: number;
}

export interface MusicMetadata extends BaseMediaMetadata {
    artist: string;
    album: string;
    tracks: number;
    label: string;
}

export type MediaMetadata = FilmTVMetadata | AnimeMetadata | MusicMetadata;

export interface MediaItem {
    id: number;
    mediaId: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    title: string;
    imageUrl: string | null;
    releaseYear: number;
    userRating: number | null;
    globalEloScore: number;
    categoryEloScore: number;
    addedAt: Date;
    metadata?: MediaMetadata;
}

export interface AddToLibraryParams {
    mediaId: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    title: string;
    releaseYear: number;
    imageUrl: string | null;
    metadata?: MediaMetadata;
}

type SortField = 'dateAdded' | 'globalEloScore' | 'categoryEloScore' | 'userRating';

// Firestore document types
interface LibraryDocument {
    mediaId: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    addedAt: any;
    userRating: number | null;
    globalEloScore: number;
    globalEloMatches: number;
    categoryEloScore: number;
    categoryEloMatches: number;
    lastUpdated: any;
}

interface MediaMetadataDocument {
    id: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    title: string;
    releaseYear: number;
    imageUrl: string | null;
    metadata?: MediaMetadata;
    createdAt: any;
}

type MediaItemWithOptionalMetadata = Omit<MediaItem, 'metadata'> & {
    metadata?: MediaMetadata;
};

export const libraryService = {
    async ensureUserProfile(userId: string) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                createdAt: serverTimestamp(),
                settings: {
                    preferredTypes: []
                }
            });
        }
    },

    async addToLibrary(userId: string, mediaData: AddToLibraryParams) {
        try {
            // Validate required fields
            if (!mediaData.mediaId || !mediaData.type || !mediaData.title || !mediaData.releaseYear) {
                console.error('Missing required fields:', mediaData);
                throw new Error('Missing required media data');
            }

            // Ensure user profile exists first
            await this.ensureUserProfile(userId);

            // Create or update media metadata
            const mediaMetadataRef = doc(db, 'mediaMetadata', mediaData.mediaId);
            const mediaMetadata = await getDoc(mediaMetadataRef);

            const mediaDocument = {
                id: mediaData.mediaId,
                type: mediaData.type,
                title: mediaData.title,
                releaseYear: mediaData.releaseYear,
                imageUrl: mediaData.imageUrl || null,
                metadata: mediaData.metadata || null, // Add metadata support
                createdAt: serverTimestamp()
            };

            // Create or update media metadata
            if (!mediaMetadata.exists()) {
                await setDoc(mediaMetadataRef, mediaDocument);
            } else {
                // Update existing metadata if new metadata is provided
                if (mediaData.metadata) {
                    await updateDoc(mediaMetadataRef, {
                        metadata: mediaData.metadata,
                        lastUpdated: serverTimestamp()
                    });
                }
            }

            // Add to user's library
            const userLibraryRef = doc(db, `users/${userId}/library/${mediaData.mediaId}`);
            const libraryDocument = {
                mediaId: mediaData.mediaId,
                type: mediaData.type,
                addedAt: serverTimestamp(),
                userRating: null,
                globalEloScore: 1500,
                globalEloMatches: 0,
                categoryEloScore: 1500,
                categoryEloMatches: 0,
                lastUpdated: serverTimestamp()
            };

            await setDoc(userLibraryRef, libraryDocument);

            return true;
        } catch (error) {
            console.error('Error adding to library:', error);
            throw error;
        }
    },

    async isInLibrary(userId: string, mediaId: string): Promise<boolean> {
        try {
            await this.ensureUserProfile(userId);
            const libraryItemRef = doc(db, `users/${userId}/library/${mediaId}`);
            const docSnap = await getDoc(libraryItemRef);
            return docSnap.exists();
        } catch (error) {
            console.error('Error checking library:', error);
            return false;
        }
    },

    async fetchLibraryItems(
        userId: string,
        category: string = 'all',
        sortOrder: SortField = 'dateAdded'
    ): Promise<MediaItem[]> {
        try {
            const libraryRef = collection(db, `users/${userId}/library`);
            const constraints: QueryConstraint[] = [];

            if (category !== 'all') {
                constraints.push(where('type', '==', category));
            }

            let sortField: string;
            switch (sortOrder) {
                case 'dateAdded':
                    sortField = 'addedAt';
                    break;
                case 'globalEloScore':
                case 'categoryEloScore':
                case 'userRating':
                    sortField = sortOrder;
                    break;
                default:
                    sortField = 'addedAt';
            }

            const processDocument = async (document: any) => {
                const libraryData = document.data() as LibraryDocument;
                const mediaMetadataRef = doc(db, 'mediaMetadata', libraryData.mediaId);
                const mediaMetadataSnap = await getDoc(mediaMetadataRef);
                const mediaMetadata = mediaMetadataSnap.data() as MediaMetadataDocument | undefined;

                if (!mediaMetadata) {
                    console.warn(`No metadata found for media item: ${libraryData.mediaId}`);
                    return null;
                }

                const mediaItem: MediaItemWithOptionalMetadata = {
                    id: parseInt(document.id),
                    mediaId: libraryData.mediaId,
                    type: libraryData.type,
                    title: mediaMetadata.title,
                    imageUrl: mediaMetadata.imageUrl,
                    releaseYear: mediaMetadata.releaseYear,
                    userRating: libraryData.userRating,
                    globalEloScore: libraryData.globalEloScore,
                    categoryEloScore: libraryData.categoryEloScore,
                    addedAt: libraryData.addedAt?.toDate() || new Date(),
                    metadata: mediaMetadata.metadata
                };

                return mediaItem;
            };

            if (category === 'all') {
                constraints.push(orderBy(sortField, 'desc'));
                const libraryQuery = query(libraryRef, ...constraints);
                const snapshot = await getDocs(libraryQuery);
                const items = await Promise.all(snapshot.docs.map(processDocument));
                return items.filter((item): item is MediaItem => item !== null);
            }

            try {
                constraints.push(orderBy(sortField, 'desc'));
                const libraryQuery = query(libraryRef, ...constraints);
                const snapshot = await getDocs(libraryQuery);
                const items = await Promise.all(snapshot.docs.map(processDocument));
                return items.filter((item): item is MediaItem => item !== null);
            } catch (error: any) {
                if (error?.message?.includes('index')) {
                    console.warn('Index not ready, falling back to client-side sorting');
                    const basicQuery = query(libraryRef, where('type', '==', category));
                    const snapshot = await getDocs(basicQuery);
                    const items = await Promise.all(snapshot.docs.map(processDocument));
                    const filteredItems = items.filter((item): item is MediaItem => item !== null);

                    return filteredItems.sort((a, b) => {
                        if (sortOrder === 'dateAdded') {
                            return b.addedAt.getTime() - a.addedAt.getTime();
                        }
                        return (b[sortOrder] || 0) - (a[sortOrder] || 0);
                    });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error fetching library items:', error);
            throw error;
        }
    },

    async updateUserRating(userId: string, mediaId: string, rating: number): Promise<void> {
        try {
            if (rating < 0 || rating > 5) {
                throw new Error('Rating must be between 0 and 5');
            }

            const userLibraryRef = doc(db, `users/${userId}/library/${mediaId}`);
            const libraryItem = await getDoc(userLibraryRef);

            if (!libraryItem.exists()) {
                throw new Error('Media item not found in library');
            }

            await updateDoc(userLibraryRef, {
                userRating: rating,
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating user rating:', error);
            throw error;
        }
    },

    async getUserRating(userId: string, mediaId: string): Promise<number | null> {
        try {
            const userLibraryRef = doc(db, `users/${userId}/library/${mediaId}`);
            const libraryItem = await getDoc(userLibraryRef);

            if (!libraryItem.exists()) {
                return null;
            }

            const data = libraryItem.data();
            return data.userRating || null;
        } catch (error) {
            console.error('Error getting user rating:', error);
            return null;
        }
    },

    async getMediaMetadata(userId: string, mediaId: string): Promise<MediaMetadata | null> {
        try {
            // First check if the item is in the user's library
            const userLibraryRef = doc(db, `users/${userId}/library/${mediaId}`);
            const libraryItem = await getDoc(userLibraryRef);

            if (!libraryItem.exists()) {
                return null;
            }

            // Get the metadata from the mediaMetadata collection
            const mediaMetadataRef = doc(db, 'mediaMetadata', mediaId);
            const mediaMetadata = await getDoc(mediaMetadataRef);

            if (!mediaMetadata.exists()) {
                return null;
            }

            const data = mediaMetadata.data();
            return data.metadata || null;
        } catch (error) {
            console.error('Error getting media metadata:', error);
            return null;
        }
    },

    async updateMediaMetadata(mediaId: string, metadata: MediaMetadata): Promise<void> {
        try {
            const mediaMetadataRef = doc(db, 'mediaMetadata', mediaId);
            const mediaMetadataSnap = await getDoc(mediaMetadataRef);

            if (!mediaMetadataSnap.exists()) {
                throw new Error('Media document not found');
            }

            await updateDoc(mediaMetadataRef, {
                metadata,
                lastUpdated: serverTimestamp()
            });

            console.log('Successfully updated metadata for:', mediaId);
        } catch (error) {
            console.error('Error updating media metadata:', error);
            throw error;
        }
    },
};