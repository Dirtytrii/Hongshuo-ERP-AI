/**
 * API Service to communicate with Java Spring Boot Backend
 */
import type { RoleDefinition } from '../types';
const BASE_URL = 'http://localhost:8080/api';

const AUTH_TOKEN_KEY = 'erp_token';
const AUTH_USER_KEY = 'erp_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
export function setStoredAuth(token: string, user: { id: number; username: string; role: string; enabled: boolean }) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}
export function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
export function getStoredUser(): { id: number; username: string; role: string; enabled: boolean } | null {
  const s = localStorage.getItem(AUTH_USER_KEY);
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const t = getStoredToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** 带认证头的 fetch，用于除 login 外的所有请求 */
function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  Object.entries(authHeaders()).forEach(([k, v]) => headers.set(k, v));
  return fetch(url, { ...init, headers });
}

// 统一错误处理
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const apiService = {
  // ========== Contracts ==========
  async getContracts(params?: { projectId?: number; settlementStatus?: string; monitoringStatus?: string }) {
    const q = new URLSearchParams();
    if (params?.projectId != null) q.set('projectId', String(params.projectId));
    if (params?.settlementStatus) q.set('settlementStatus', params.settlementStatus);
    if (params?.monitoringStatus) q.set('monitoringStatus', params.monitoringStatus);
    const res = await apiFetch(`${BASE_URL}/contracts${q.toString() ? '?' + q.toString() : ''}`);
    return handleResponse(res);
  },

  async getContractById(id: number) {
    const res = await apiFetch(`${BASE_URL}/contracts/${id}`);
    return handleResponse(res);
  },

  async createContract(contract: {
    projectId: number;
    contractNo: string;
    name: string;
    contractAmount: number;
    signedDate: string;
    settlementStatus?: string;
    monitoringStatus?: string;
    remark?: string;
  }) {
    const res = await apiFetch(`${BASE_URL}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contract),
    });
    return handleResponse(res);
  },

  async updateContract(
    id: number,
    contract: Partial<{
      projectId: number;
      contractNo: string;
      name: string;
      contractAmount: number;
      signedDate: string;
      settlementStatus: string;
      monitoringStatus: string;
      remark: string;
    }>
  ) {
    const res = await apiFetch(`${BASE_URL}/contracts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contract),
    });
    return handleResponse(res);
  },

  async deleteContract(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/contracts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除合同失败');
  },

  // ========== Dashboard ==========
  async getOperationDashboard(days: number = 15) {
    const res = await apiFetch(`${BASE_URL}/dashboard/operation?days=${days}`);
    return handleResponse(res);
  },

  async getBudgetExecutionDashboard() {
    const res = await apiFetch(`${BASE_URL}/dashboard/budget-execution`);
    return handleResponse(res);
  },

  // ========== Projects ==========
  async getProjects() {
    const res = await apiFetch(`${BASE_URL}/projects`);
    return handleResponse(res);
  },

  async getProjectById(id: number) {
    const res = await apiFetch(`${BASE_URL}/projects/${id}`);
    return handleResponse(res);
  },

  async createProject(project: any) {
    const res = await apiFetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return handleResponse(res);
  },

  async updateProject(id: number, project: any) {
    const res = await apiFetch(`${BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return handleResponse(res);
  },

  /** 供项目表单「项目经理」下拉使用，返回 { id, username }[] */
  async getUserOptions(): Promise<{ id: number; username: string }[]> {
    const res = await apiFetch(`${BASE_URL}/users/options`);
    return handleResponse(res);
  },

  async deleteProject(id: number) {
    const res = await apiFetch(`${BASE_URL}/projects/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async getMilestones(projectId: number) {
    const res = await apiFetch(`${BASE_URL}/projects/${projectId}/milestones`);
    return handleResponse(res);
  },

  async addMilestone(projectId: number, milestone: any) {
    const res = await apiFetch(`${BASE_URL}/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestone),
    });
    return handleResponse(res);
  },

  async updateMilestone(projectId: number, milestoneId: number, milestone: any) {
    const res = await apiFetch(`${BASE_URL}/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestone),
    });
    return handleResponse(res);
  },

  async deleteMilestone(projectId: number, milestoneId: number) {
    const res = await apiFetch(`${BASE_URL}/projects/${projectId}/milestones/${milestoneId}`, { method: 'DELETE' });
    return res.ok;
  },

  // ========== Inventory ==========
  async getInventory() {
    const res = await apiFetch(`${BASE_URL}/inventory`);
    return handleResponse(res);
  },

  async getInventoryById(id: number) {
    const res = await apiFetch(`${BASE_URL}/inventory/${id}`);
    return handleResponse(res);
  },

  async createInventoryItem(item: any) {
    const res = await apiFetch(`${BASE_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return handleResponse(res);
  },

  async updateInventoryItem(id: number, item: any) {
    const res = await apiFetch(`${BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return handleResponse(res);
  },

  async deleteInventoryItem(id: number) {
    const res = await apiFetch(`${BASE_URL}/inventory/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async getLowStockItems() {
    const res = await apiFetch(`${BASE_URL}/inventory/low-stock`);
    return handleResponse(res);
  },

  // ========== Finance ==========
  async getFinanceRecords() {
    const res = await apiFetch(`${BASE_URL}/finance`);
    return handleResponse(res);
  },

  async getPendingFinanceRecords() {
    const res = await apiFetch(`${BASE_URL}/finance/pending`);
    return handleResponse(res);
  },

  async getFinanceRecordById(id: number) {
    const res = await apiFetch(`${BASE_URL}/finance/${id}`);
    return handleResponse(res);
  },

  async getFinanceRecordsByProjectId(projectId: number) {
    const res = await apiFetch(`${BASE_URL}/finance/project/${projectId}`);
    return handleResponse(res);
  },

  /** 支出类别枚举，供财务表单下拉 */
  async getFinanceCategories(): Promise<{ code: string; label: string; costType: string }[]> {
    const res = await apiFetch(`${BASE_URL}/finance/categories`);
    return handleResponse(res);
  },

  async createFinanceRecord(record: any) {
    const res = await apiFetch(`${BASE_URL}/finance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return handleResponse(res);
  },

  /** 红字冲销：对已审批记录创建冲销单 */
  async createFinanceReversal(originalId: number, description?: string, creator?: string) {
    const res = await apiFetch(`${BASE_URL}/finance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isReversal: true,
        reversalOfId: originalId,
        description: description || `冲销：原单#${originalId}`,
        creator: creator || 'system',
      }),
    });
    return handleResponse(res);
  },

  async approveFinanceRecord(id: number, approver: string, approved: boolean, approvalNote?: string) {
    const res = await apiFetch(`${BASE_URL}/finance/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, approved, approvalNote: approvalNote || '' }),
    });
    return handleResponse(res);
  },

  // ========== Payment plans (回款计划) ==========
  async getPaymentPlansByProject(projectId: number) {
    const res = await apiFetch(`${BASE_URL}/payment-plans?projectId=${projectId}`);
    return handleResponse(res);
  },
  async getUpcomingPaymentPlans(days: number = 15) {
    const res = await apiFetch(`${BASE_URL}/payment-plans/upcoming?days=${days}`);
    return handleResponse(res);
  },
  async getOverdueMilestones() {
    const res = await apiFetch(`${BASE_URL}/milestones/overdue`);
    return handleResponse(res);
  },
  async createPaymentPlan(
    projectId: number,
    item: { name: string; planDate: string; planAmount: number; receivedAmount?: number; status?: string }
  ) {
    const res = await apiFetch(`${BASE_URL}/payment-plans?projectId=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return handleResponse(res);
  },
  async updatePaymentPlan(
    id: number,
    item: Partial<{ name: string; planDate: string; planAmount: number; receivedAmount: number; status: string }>
  ) {
    const res = await apiFetch(`${BASE_URL}/payment-plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return handleResponse(res);
  },
  async deletePaymentPlan(id: number) {
    const res = await apiFetch(`${BASE_URL}/payment-plans/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || res.statusText);
    }
  },

  // ========== Project documents (项目文档清单 P2-1) ==========
  async getProjectDocuments(projectId: number, source?: string) {
    const q = new URLSearchParams({ projectId: String(projectId) });
    if (source) q.set('source', source);
    const res = await apiFetch(`${BASE_URL}/project-documents?${q.toString()}`);
    return handleResponse(res);
  },
  async createProjectDocument(projectId: number, doc: { name: string; link?: string; remark?: string }) {
    const res = await apiFetch(`${BASE_URL}/project-documents?projectId=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    return handleResponse(res);
  },
  async updateProjectDocument(id: number, doc: Partial<{ name: string; link: string; remark: string }>) {
    const res = await apiFetch(`${BASE_URL}/project-documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    return handleResponse(res);
  },
  async deleteProjectDocument(id: number) {
    const res = await apiFetch(`${BASE_URL}/project-documents/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || res.statusText);
    }
  },

  // ========== Reimbursements (Phase 2) ==========
  async getReimbursements(params?: { projectId?: number; departmentId?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.projectId != null) q.set('projectId', String(params.projectId));
    if (params?.departmentId != null) q.set('departmentId', String(params.departmentId));
    if (params?.status) q.set('status', params.status);
    const res = await apiFetch(`${BASE_URL}/reimbursements${q.toString() ? '?' + q.toString() : ''}`);
    return handleResponse(res);
  },
  async createReimbursement(body: any) {
    const res = await apiFetch(`${BASE_URL}/reimbursements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async updateReimbursement(id: number, body: any) {
    const res = await apiFetch(`${BASE_URL}/reimbursements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async submitReimbursement(id: number) {
    const res = await apiFetch(`${BASE_URL}/reimbursements/${id}/submit`, { method: 'POST' });
    return handleResponse(res);
  },
  async approveReimbursement(id: number, approver: string, approved: boolean, approvalNote?: string) {
    const res = await apiFetch(`${BASE_URL}/reimbursements/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, approved, approvalNote: approvalNote || '' }),
    });
    return handleResponse(res);
  },
  async deleteReimbursement(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/reimbursements/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除报销单失败');
  },

  // ========== Loans / Repayments (Phase 2) ==========
  async getLoans(params?: { projectId?: number; departmentId?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.projectId != null) q.set('projectId', String(params.projectId));
    if (params?.departmentId != null) q.set('departmentId', String(params.departmentId));
    if (params?.status) q.set('status', params.status);
    const res = await apiFetch(`${BASE_URL}/loans${q.toString() ? '?' + q.toString() : ''}`);
    return handleResponse(res);
  },
  async createLoan(body: any) {
    const res = await apiFetch(`${BASE_URL}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async updateLoan(id: number, body: any) {
    const res = await apiFetch(`${BASE_URL}/loans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async submitLoan(id: number) {
    const res = await apiFetch(`${BASE_URL}/loans/${id}/submit`, { method: 'POST' });
    return handleResponse(res);
  },
  async approveLoan(id: number, approver: string, approved: boolean, approvalNote?: string) {
    const res = await apiFetch(`${BASE_URL}/loans/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, approved, approvalNote: approvalNote || '' }),
    });
    return handleResponse(res);
  },
  async deleteLoan(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/loans/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除借款单失败');
  },
  async getLoanOutstanding(id: number) {
    const res = await apiFetch(`${BASE_URL}/loans/${id}/outstanding`);
    return handleResponse(res);
  },
  async getLoanRepayments(params?: { loanId?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.loanId != null) q.set('loanId', String(params.loanId));
    if (params?.status) q.set('status', params.status);
    const res = await apiFetch(`${BASE_URL}/loan-repayments${q.toString() ? '?' + q.toString() : ''}`);
    return handleResponse(res);
  },
  async createLoanRepayment(body: any) {
    const res = await apiFetch(`${BASE_URL}/loan-repayments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async submitLoanRepayment(id: number) {
    const res = await apiFetch(`${BASE_URL}/loan-repayments/${id}/submit`, { method: 'POST' });
    return handleResponse(res);
  },
  async approveLoanRepayment(id: number, approver: string, approved: boolean, approvalNote?: string) {
    const res = await apiFetch(`${BASE_URL}/loan-repayments/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, approved, approvalNote: approvalNote || '' }),
    });
    return handleResponse(res);
  },
  async deleteLoanRepayment(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/loan-repayments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除还款单失败');
  },

  // ========== Departments (Phase 3) ==========
  async getDepartments() {
    const res = await apiFetch(`${BASE_URL}/departments`);
    return handleResponse(res);
  },
  async createDepartment(body: { name: string; code: string; parentId?: number | null }) {
    const res = await apiFetch(`${BASE_URL}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async updateDepartment(id: number, body: { name: string; code: string; parentId?: number | null }) {
    const res = await apiFetch(`${BASE_URL}/departments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async deleteDepartment(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/departments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除部门失败');
  },
  async getDepartmentCostSummary() {
    const res = await apiFetch(`${BASE_URL}/departments/reports/cost`);
    return handleResponse(res);
  },

  // ========== Stock Operations ==========
  async getStockLogs() {
    const res = await apiFetch(`${BASE_URL}/stock`);
    return handleResponse(res);
  },

  async getPendingStockLogs() {
    const res = await apiFetch(`${BASE_URL}/stock/pending`);
    return handleResponse(res);
  },

  async getStockLogById(id: number) {
    const res = await apiFetch(`${BASE_URL}/stock/${id}`);
    return handleResponse(res);
  },

  async createStockLog(log: any) {
    const res = await apiFetch(`${BASE_URL}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    return handleResponse(res);
  },

  async approveStockOut(id: number, approver: string, approved: boolean, approvalNote?: string) {
    const res = await apiFetch(`${BASE_URL}/stock/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, approved, approvalNote: approvalNote || '' }),
    });
    return handleResponse(res);
  },

  // ========== System Logs ==========
  async getSystemLogs() {
    const res = await apiFetch(`${BASE_URL}/logs`);
    return handleResponse(res);
  },

  async getSystemLogsByUser(user: string) {
    const res = await apiFetch(`${BASE_URL}/logs/user/${encodeURIComponent(user)}`);
    return handleResponse(res);
  },

  async getSystemLogsByAction(action: string) {
    const res = await apiFetch(`${BASE_URL}/logs/action/${encodeURIComponent(action)}`);
    return handleResponse(res);
  },

  async deleteLog(id: number) {
    const res = await apiFetch(`${BASE_URL}/logs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除日志失败');
  },

  // ========== App State (for AI Analysis) ==========
  async getAppState() {
    const res = await apiFetch(`${BASE_URL}/app-state`);
    return handleResponse(res);
  },

  // ========== Permissions ==========
  async getPermissions() {
    const res = await apiFetch(`${BASE_URL}/permissions`);
    return handleResponse(res);
  },

  async savePermissions(permissions: Record<string, string[]>) {
    const res = await apiFetch(`${BASE_URL}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissions),
    });
    return handleResponse(res);
  },

  // ========== Roles ==========
  async getRoles(): Promise<RoleDefinition[]> {
    const res = await apiFetch(`${BASE_URL}/roles`);
    return handleResponse(res);
  },

  async createRole(body: { code: string; name: string; description?: string }): Promise<RoleDefinition> {
    const res = await apiFetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async updateRole(id: number, body: { code?: string; name?: string; description?: string }): Promise<RoleDefinition> {
    const res = await apiFetch(`${BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async deleteRole(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/roles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除角色失败');
  },

  // ========== Data Reset ==========
  async resetData() {
    const res = await apiFetch(`${BASE_URL}/data/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  // ========== Config ==========
  async getConfig() {
    const res = await apiFetch(`${BASE_URL}/config`);
    return handleResponse(res);
  },

  async saveConfig(config: { lowStockThreshold?: string; largeExpenseThreshold?: string }) {
    const res = await apiFetch(`${BASE_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return handleResponse(res);
  },

  // ========== Auth ==========
  async login(
    username: string,
    password: string
  ): Promise<{ token: string; user: { id: number; username: string; role: string; enabled: boolean } }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = (await handleResponse(res)) as {
      token: string;
      user: { id: number; username: string; role: string; enabled: boolean };
    };
    return data;
  },

  async getMe(): Promise<{ id: number; username: string; role: string; enabled: boolean }> {
    const res = await apiFetch(`${BASE_URL}/auth/me`);
    return handleResponse(res);
  },

  // ========== Users (admin) ==========
  async getUsers(): Promise<Array<{ id: number; username: string; role: string; enabled: boolean }>> {
    const res = await apiFetch(`${BASE_URL}/users`);
    return handleResponse(res);
  },

  async createUser(body: {
    username: string;
    password: string;
    role: string;
    departmentId?: number | null;
  }): Promise<{ id: number; username: string; role: string; enabled: boolean }> {
    const res = await apiFetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async updateUser(
    id: number,
    body: { username?: string; password?: string; role?: string; enabled?: boolean; departmentId?: number | null }
  ): Promise<{ id: number; username: string; role: string; enabled: boolean }> {
    const res = await apiFetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async deleteUser(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除用户失败');
  },

  // ========== Suppliers (P1-1) ==========
  async getSuppliers(): Promise<
    Array<{ id: number; name: string; contactPerson?: string; contactPhone?: string; bankInfo?: string }>
  > {
    const res = await apiFetch(`${BASE_URL}/suppliers`);
    return handleResponse(res);
  },

  async getSupplierById(id: number) {
    const res = await apiFetch(`${BASE_URL}/suppliers/${id}`);
    return handleResponse(res);
  },

  async createSupplier(supplier: { name: string; contactPerson?: string; contactPhone?: string; bankInfo?: string }) {
    const res = await apiFetch(`${BASE_URL}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });
    return handleResponse(res);
  },

  async updateSupplier(
    id: number,
    supplier: Partial<{ name: string; contactPerson: string; contactPhone: string; bankInfo: string }>
  ) {
    const res = await apiFetch(`${BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });
    return handleResponse(res);
  },

  async deleteSupplier(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/suppliers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除供应商失败');
  },

  /** 单个供应商应付/已付/欠款 */
  async getSupplierBalance(
    supplierId: number
  ): Promise<{ supplierId: number; supplierName: string; payable: number; paid: number; balance: number }> {
    const res = await apiFetch(`${BASE_URL}/suppliers/${supplierId}/balance`);
    return handleResponse(res);
  },

  /** 供应商应付/已付/欠款报表列表 */
  async getSupplierBalanceList(): Promise<
    Array<{ supplierId: number; supplierName: string; payable: number; paid: number; balance: number }>
  > {
    const res = await apiFetch(`${BASE_URL}/suppliers/reports/balance`);
    return handleResponse(res);
  },

  // ========== Change Orders (P1-3) ==========
  async getChangeOrders(params?: { projectId?: number; status?: string }): Promise<Array<ChangeOrderType>> {
    const q = new URLSearchParams();
    if (params?.projectId != null) q.set('projectId', String(params.projectId));
    if (params?.status) q.set('status', params.status);
    const res = await apiFetch(`${BASE_URL}/change-orders${q.toString() ? '?' + q : ''}`);
    return handleResponse(res);
  },

  async getChangeOrderById(id: number): Promise<ChangeOrderType> {
    const res = await apiFetch(`${BASE_URL}/change-orders/${id}`);
    return handleResponse(res);
  },

  async createChangeOrder(order: { projectId: number; reason: string; amount: number }) {
    const res = await apiFetch(`${BASE_URL}/change-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...order, status: 'pending' }),
    });
    return handleResponse(res);
  },

  async updateChangeOrder(id: number, order: Partial<{ reason: string; amount: number }>) {
    const res = await apiFetch(`${BASE_URL}/change-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return handleResponse(res);
  },

  async deleteChangeOrder(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/change-orders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除变更单失败');
  },

  async approveChangeOrder(id: number, approver: string, approved: boolean, approvalNote?: string) {
    const res = await apiFetch(`${BASE_URL}/change-orders/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, approved, approvalNote: approvalNote || '' }),
    });
    return handleResponse(res);
  },
};

export type ChangeOrderType = {
  id: number;
  projectId: number;
  reason: string;
  amount: number;
  status: string;
  approver?: string;
  approvalDate?: string;
  approvalNote?: string;
  createdAt?: string;
  updatedAt?: string;
};
