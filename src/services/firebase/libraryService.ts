import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

interface AddToLibraryParams {
    mediaId: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    title: string;
    releaseYear: number;
    imageUrl: string | null;
}

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
            // Ensure user profile exists first
            await this.ensureUserProfile(userId);

            // Create media metadata with proper typing
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

                // Validate the document before saving
                const validDocument = Object.entries(mediaDocument).reduce((acc, [key, value]) => {
                    if (value !== undefined) {
                        acc[key] = value;
                    }
                    return acc;
                }, {} as Record<string, any>);

                await setDoc(mediaMetadataRef, validDocument);
            }

            // Add to user's library with proper typing
            const userLibraryRef = doc(db, `users/${userId}/library/${mediaData.mediaId}`);
            const libraryDocument = {
                mediaId: mediaData.mediaId,
                type: mediaData.type, // Add type to library document
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
            // Ensure user profile exists first
            await this.ensureUserProfile(userId);

            const libraryItemRef = doc(db, `users/${userId}/library/${mediaId}`);
            const docSnap = await getDoc(libraryItemRef);
            return docSnap.exists();
        } catch (error) {
            console.error('Error checking library:', error);
            return false;
        }
    }
};