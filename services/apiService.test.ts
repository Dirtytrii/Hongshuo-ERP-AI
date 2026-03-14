import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from './apiService';

describe('apiService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getProjects returns array on success', async () => {
    const mockProjects = [{ id: 1, name: 'Test', code: 'P001' }];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProjects),
    } as Response);

    const result = await apiService.getProjects();
    expect(result).toEqual(mockProjects);
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/projects', expect.any(Object));
  });

  it('getProjects throws on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server Error' }),
    } as Response);

    await expect(apiService.getProjects()).rejects.toThrow('Server Error');
  });

  it('createProject sends POST with body', async () => {
    const project = {
      name: 'New',
      code: 'P002',
      managerId: 'M1',
      contractAmount: 1000,
      receivedAmount: 0,
      materialCost: 0,
      laborCost: 0,
      otherCost: 0,
      status: '施工中',
      progress: 0,
      startDate: '2025-01-01',
      endDate: '',
      milestones: [],
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...project, id: 1 }),
    } as Response);

    await apiService.createProject(project);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(project),
      })
    );
  });

  it('deleteProject sends DELETE request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    const result = await apiService.deleteProject(1);
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/projects/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('getInventory returns array', async () => {
    const mockInventory = [{ id: 1, name: 'Item', spec: 'S1', unit: '个', price: 10, quantity: 100, threshold: 20 }];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInventory),
    } as Response);
    const result = await apiService.getInventory();
    expect(result).toEqual(mockInventory);
  });

  it('getAppState returns state object for AI', async () => {
    const state = { projects: [], inventory: [], financeRecords: [], stockLogs: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(state),
    } as Response);
    const result = await apiService.getAppState();
    expect(result).toEqual(state);
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/app-state', expect.any(Object));
  });
});
