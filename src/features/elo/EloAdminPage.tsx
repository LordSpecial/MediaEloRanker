import React, { useState } from 'react';
import { initializeEloSystem } from '../../utils/eloInitializer';

const EloAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInitialize = async () => {
    if (loading) return;

    setLoading(true);
    setResult(null);

    try {
      const initResult = await initializeEloSystem();
      setResult(initResult);
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error?.message || 'Unknown error occurred'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ELO Rating System Administration</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">System Initialization</h2>
        <p className="mb-2">
          Initialize the ELO rating system by creating the required database structures.
          This will:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>Create the ELO system metadata document if it doesn't exist</li>
          <li>Add ELO rating fields to all media documents that don't have them</li>
        </ul>
        
        <button
          onClick={handleInitialize}
          disabled={loading}
          className={`px-4 py-2 rounded-md ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Initializing...' : 'Initialize ELO System'}
        </button>
        
        {result && (
          <div className={`mt-4 p-3 rounded-md ${
            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <p>{result.message}</p>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">System Parameters</h2>
        <p className="italic text-gray-600">
          Parameter configuration will be implemented in the next phase.
        </p>
      </div>
    </div>
  );
};

export default EloAdminPage; 