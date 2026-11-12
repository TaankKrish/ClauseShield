import { useState, useCallback } from 'react';
import { analyzeDocument } from '../services/analysis-orchestrator.js';

export function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const executeAnalysis = useCallback(async ({ file, rawText, contractType = 'all' }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeDocument({
        file,
        rawText,
        contractType,
        onProgress: setProgress,
      });
      setResult(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(null);
  }, []);

  return {
    result,
    loading,
    progress,
    error,
    executeAnalysis,
    reset,
  };
}

