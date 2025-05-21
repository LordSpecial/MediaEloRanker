/**
 * Media types - Backward compatibility file
 * 
 * This file re-exports types from the media directory for backward 
 * compatibility with existing imports. New code should import directly
 * from the specific files in the types/media directory.
 * 
 * @deprecated Import from '@/types/media/*' instead
 */

export * from './media/common';
export * from './media/movie';
export * from './media/tv';
export * from './media/anime';
export * from './media/music'; 