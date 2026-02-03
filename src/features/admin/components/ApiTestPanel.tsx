import React, { useEffect, useState } from 'react';
import { booksApi, categoriesApi, authorsApi } from '@/services/api';

interface TestResult {
  status: 'success' | 'error';
  count?: number;
  message?: string;
}

/**
 * API Connection Test Component
 * Verify that all API endpoints are working correctly
 */
export const ApiTestPanel: React.FC = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults: Record<string, TestResult> = {};

    // Test Books API
    try {
      const books = await booksApi.getAll();
      testResults.books = { status: 'success', count: books.length };
    } catch (error: any) {
      testResults.books = { status: 'error', message: error.message };
    }

    // Test Categories API
    try {
      const categories = await categoriesApi.getAll();
      testResults.categories = { status: 'success', count: categories.length };
    } catch (error: any) {
      testResults.categories = { status: 'error', message: error.message };
    }

    // Test Authors API
    try {
      const authors = await authorsApi.getAll();
      testResults.authors = { status: 'success', count: authors.length };
    } catch (error: any) {
      testResults.authors = { status: 'error', message: error.message };
    }

    setResults(testResults);
    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">API Connection Test</h3>
        <button
          onClick={runTests}
          disabled={testing}
          className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Retest'}
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {Object.entries(results).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="font-medium capitalize">{key}:</span>
            {value.status === 'success' ? (
              <span className="text-green-600">✓ {value.count} items</span>
            ) : (
              <span className="text-red-600">✗ {value.message}</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div>API Mode: <span className="font-mono text-green-600">ENABLED</span></div>
          <div>Base URL: <span className="font-mono text-xs">{import.meta.env.VITE_API_BASE_URL}</span></div>
        </div>
      </div>
    </div>
  );
};
