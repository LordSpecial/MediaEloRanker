import { eloService } from '../services/firebase/eloService';

/**
 * Initializes the ELO rating system
 * - Creates the ELO metadata document if it doesn't exist
 * - Adds ELO fields to all media documents that don't have them
 */
export const initializeEloSystem = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Starting ELO system initialization...');
    
    const result = await eloService.initializeEloSystem();
    
    if (result.metadataInitialized) {
      console.log('ELO metadata document created successfully');
    } else {
      console.log('ELO metadata document already exists, skipped creation');
    }
    
    console.log(`ELO fields initialized for ${result.fieldsInitialized} media documents`);
    
    return {
      success: true,
      message: `ELO system initialized successfully. Fields added to ${result.fieldsInitialized} documents.`
    };
  } catch (error: any) {
    console.error('Error initializing ELO system:', error);
    return {
      success: false,
      message: `Error initializing ELO system: ${error?.message || 'Unknown error'}`
    };
  }
}; 