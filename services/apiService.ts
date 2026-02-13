/**
 * API Service to communicate with Java Spring Boot Backend
 */
const BASE_URL = 'http://localhost:8080/api';

// 统一错误处理
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const apiService = {
  // ========== Projects ==========
  async getProjects() {
    const res = await fetch(`${BASE_URL}/projects`);
    return handleResponse(res);
  },

  async getProjectById(id: number) {
    const res = await fetch(`${BASE_URL}/projects/${id}`);
    return handleResponse(res);
  },

  async createProject(project: any) {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    return handleResponse(res);
  },

  async updateProject(id: number, project: any) {
    const res = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    return handleResponse(res);
  },

  async deleteProject(id: number) {
    const res = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  },

  async getMilestones(projectId: number) {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/milestones`);
    return handleResponse(res);
  },

  async addMilestone(projectId: number, milestone: any) {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestone)
    });
    return handleResponse(res);
  },
  
  // ========== Inventory ==========
  async getInventory() {
    const res = await fetch(`${BASE_URL}/inventory`);
    return handleResponse(res);
  },

  async getInventoryById(id: number) {
    const res = await fetch(`${BASE_URL}/inventory/${id}`);
    return handleResponse(res);
  },

  async createInventoryItem(item: any) {
    const res = await fetch(`${BASE_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return handleResponse(res);
  },

  async updateInventoryItem(id: number, item: any) {
    const res = await fetch(`${BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return handleResponse(res);
  },

  async deleteInventoryItem(id: number) {
    const res = await fetch(`${BASE_URL}/inventory/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  },

  async getLowStockItems() {
    const res = await fetch(`${BASE_URL}/inventory/low-stock`);
    return handleResponse(res);
  },

  // ========== Finance ==========
  async getFinanceRecords() {
    const res = await fetch(`${BASE_URL}/finance`);
    return handleResponse(res);
  },

  async getPendingFinanceRecords() {
    const res = await fetch(`${BASE_URL}/finance/pending`);
    return handleResponse(res);
  },

  async getFinanceRecordById(id: number) {
    const res = await fetch(`${BASE_URL}/finance/${id}`);
    return handleResponse(res);
  },

  async getFinanceRecordsByProjectId(projectId: number) {
    const res = await fetch(`${BASE_URL}/finance/project/${projectId}`);
    return handleResponse(res);
  },

  async createFinanceRecord(record: any) {
    const res = await fetch(`${BASE_URL}/finance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return handleResponse(res);
  },

  async approveFinanceRecord(id: number, approver: string, approved: boolean, approvalNote?: string) {
    const res = await fetch(`${BASE_URL}/finance/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, approved, approvalNote: approvalNote || '' })
    });
    return handleResponse(res);
  },

  // ========== Stock Operations ==========
  async getStockLogs() {
    const res = await fetch(`${BASE_URL}/stock`);
    return handleResponse(res);
  },

  async getPendingStockLogs() {
    const res = await fetch(`${BASE_URL}/stock/pending`);
    return handleResponse(res);
  },

  async getStockLogById(id: number) {
    const res = await fetch(`${BASE_URL}/stock/${id}`);
    return handleResponse(res);
  },

  async createStockLog(log: any) {
    const res = await fetch(`${BASE_URL}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    return handleResponse(res);
  },

  async approveStockOut(id: number, approver: string, approved: boolean, approvalNote?: string) {
    const res = await fetch(`${BASE_URL}/stock/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, approved, approvalNote: approvalNote || '' })
    });
    return handleResponse(res);
  },

  // ========== System Logs ==========
  async getSystemLogs() {
    const res = await fetch(`${BASE_URL}/logs`);
    return handleResponse(res);
  },

  async getSystemLogsByUser(user: string) {
    const res = await fetch(`${BASE_URL}/logs/user/${user}`);
    return handleResponse(res);
  },

  async getSystemLogsByAction(action: string) {
    const res = await fetch(`${BASE_URL}/logs/action/${action}`);
    return handleResponse(res);
  },

  // ========== App State (for AI Analysis) ==========
  async getAppState() {
    const res = await fetch(`${BASE_URL}/app-state`);
    return handleResponse(res);
  }
};
