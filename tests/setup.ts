import '@testing-library/jest-dom';

// Mock fetch for API tests
const mockFetch = (globalThis as any).fetch;
if (!mockFetch) {
  (globalThis as any).fetch = () => Promise.reject(new Error('fetch not mocked'));
}
