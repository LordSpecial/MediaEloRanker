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
    QueryConstraint
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface MediaItem {
    id: string;
    mediaId: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    title: string;
    imageUrl: string;
    releaseYear: number;
    userRating: number | null;
    globalEloScore: number;
    categoryEloScore: number;
    addedAt: Date;
}

interface AddToLibraryParams {
    mediaId: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    title: string;
    releaseYear: number;
    imageUrl: string | null;
}

type SortField = 'dateAdded' | 'globalEloScore' | 'categoryEloScore' | 'userRating';

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
            await this.ensureUserProfile(userId);

            const mediaMetadataRef = doc(db, 'mediaMetadata', mediaData.mediaId);
            const mediaMetadata = await getDoc(mediaMetadataRef);

            if (!mediaMetadata.exists()) {
                const mediaDocument = {
                    id: mediaData.mediaId,
                    type: mediaData.type,
                    title: mediaData.title,
                    releaseYear: mediaData.releaseYear,
                    imageUrl: mediaData.imageUrl,
                    createdAt: serverTimestamp()
                };

                const validDocument = Object.entries(mediaDocument).reduce((acc, [key, value]) => {
                    if (value !== undefined) {
                        acc[key] = value;
                    }
                    return acc;
                }, {} as Record<string, any>);

                await setDoc(mediaMetadataRef, validDocument);
            }

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

            // Build query constraints
            const constraints: QueryConstraint[] = [];

            // Only add type filter if not "all"
            if (category !== 'all') {
                constraints.push(where('type', '==', category));
            }

            // Handle sorting
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

            // If we're not filtering by type, we don't need the composite index
            if (category === 'all') {
                constraints.push(orderBy(sortField, 'desc'));
            } else {
                // When filtering by type, we need to handle the index requirement
                try {
                    constraints.push(orderBy(sortField, 'desc'));
                    const libraryQuery = query(libraryRef, ...constraints);
                    const snapshot = await getDocs(libraryQuery);

                    const libraryData = await Promise.all(
                        snapshot.docs.map(async (document) => {
                            const libraryData = document.data();
                            const mediaMetadataRef = doc(db, 'mediaMetadata', libraryData.mediaId);
                            const mediaMetadataSnap = await getDoc(mediaMetadataRef);
                            const mediaMetadata = mediaMetadataSnap.data();

                            if (!mediaMetadata) {
                                console.warn(`No metadata found for media item: ${libraryData.mediaId}`);
                                return null;
                            }

                            return {
                                id: document.id,
                                ...libraryData,
                                ...mediaMetadata,
                                addedAt: libraryData.addedAt?.toDate() || new Date(),
                            } as MediaItem;
                        })
                    );

                    return libraryData.filter((item): item is MediaItem => item !== null);
                } catch (error: any) {
                    // If we get an index error, fall back to client-side sorting
                    if (error?.message?.includes('index')) {
                        console.warn('Index not ready, falling back to client-side sorting');

                        // Remove the orderBy constraint and fetch all items of this type
                        const basicQuery = query(libraryRef, where('type', '==', category));
                        const snapshot = await getDocs(basicQuery);

                        const libraryData = await Promise.all(
                            snapshot.docs.map(async (document) => {
                                const libraryData = document.data();
                                const mediaMetadataRef = doc(db, 'mediaMetadata', libraryData.mediaId);
                                const mediaMetadataSnap = await getDoc(mediaMetadataRef);
                                const mediaMetadata = mediaMetadataSnap.data();

                                if (!mediaMetadata) {
                                    return null;
                                }

                                return {
                                    id: document.id,
                                    ...libraryData,
                                    ...mediaMetadata,
                                    addedAt: libraryData.addedAt?.toDate() || new Date(),
                                } as MediaItem;
                            })
                        );

                        const filteredData = libraryData.filter((item): item is MediaItem => item !== null);

                        // Sort the data client-side
                        return filteredData.sort((a, b) => {
                            if (sortOrder === 'dateAdded') {
                                return b.addedAt.getTime() - a.addedAt.getTime();
                            }
                            return (b[sortOrder] || 0) - (a[sortOrder] || 0);
                        });
                    }
                    throw error;
                }
            }

            // If we get here, we're just doing a simple sort without type filtering
            const libraryQuery = query(libraryRef, ...constraints);
            const snapshot = await getDocs(libraryQuery);

            const libraryData = await Promise.all(
                snapshot.docs.map(async (document) => {
                    const libraryData = document.data();
                    const mediaMetadataRef = doc(db, 'mediaMetadata', libraryData.mediaId);
                    const mediaMetadataSnap = await getDoc(mediaMetadataRef);
                    const mediaMetadata = mediaMetadataSnap.data();

                    if (!mediaMetadata) {
                        return null;
                    }

                    return {
                        id: document.id,
                        ...libraryData,
                        ...mediaMetadata,
                        addedAt: libraryData.addedAt?.toDate() || new Date(),
                    } as MediaItem;
                })
            );

            return libraryData.filter((item): item is MediaItem => item !== null);
        } catch (error) {
            console.error('Error fetching library items:', error);
            throw error;
        }
    }
};