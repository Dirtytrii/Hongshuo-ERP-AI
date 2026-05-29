import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService, resolveApiBaseUrl } from './apiService';
import type {
  CreateMilestonePayload,
  CreateProjectPayload,
  UpdateMilestonePayload,
  UpdateProjectPayload,
} from '../types';

describe('apiService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('resolveApiBaseUrl uses VITE_API_BASE_URL and trims trailing slashes', () => {
    expect(resolveApiBaseUrl(' https://api.example.com/api/// ')).toBe('https://api.example.com/api');
    expect(resolveApiBaseUrl('')).toBe('http://localhost:8080/api');
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
    const project: CreateProjectPayload = {
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

  it('updateProject sends PUT with typed project payload', async () => {
    const project: UpdateProjectPayload = {
      name: 'Updated',
      managerId: 'M2',
      contractAmount: 2000,
      totalBudget: null,
      status: '验收中',
      startDate: '2025-02-01',
      endDate: '',
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...project, id: 1, code: 'P002', milestones: [] }),
    } as Response);

    await apiService.updateProject(1, project);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/projects/1',
      expect.objectContaining({
        method: 'PUT',
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

  it('addMilestone sends POST with typed milestone payload', async () => {
    const milestone: CreateMilestonePayload = {
      name: '主体封顶',
      planDate: '2025-06-30',
      status: 'pending',
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...milestone, id: 2, actualDate: null }),
    } as Response);

    await apiService.addMilestone(1, milestone);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/projects/1/milestones',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(milestone),
      })
    );
  });

  it('updateMilestone sends PUT with typed milestone payload', async () => {
    const milestone: UpdateMilestonePayload = {
      name: '主体封顶完成',
      actualDate: '2025-07-02',
      status: 'completed',
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...milestone, id: 2, planDate: '2025-06-30' }),
    } as Response);

    await apiService.updateMilestone(1, 2, milestone);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/projects/1/milestones/2',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(milestone),
      })
    );
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
