import type { Role } from '../../types';

export const DEFAULT_ROLES: Record<string, Role> = {
  admin: { id: 'admin', name: '王总 (Admin)', label: '管理员' },
  pm: { id: 'pm', name: '李工 (PM)', label: '项目经理' },
  finance: { id: 'finance', name: '赵姐 (Finance)', label: '财务' },
  clerk: { id: 'clerk', name: '小张 (Clerk)', label: '录入员' },
};

export const STATUS_COLORS: Record<string, string> = {
  施工中: 'bg-blue-100 text-blue-700',
  验收中: 'bg-purple-100 text-purple-700',
  已完工: 'bg-green-100 text-green-700',
  pending: 'bg-orange-100 text-orange-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const DEFAULT_PERMISSIONS_CONFIG: Record<string, string[]> = {
  'projects.view': ['admin', 'pm'],
  'inventory.view': ['admin', 'pm', 'finance', 'clerk'],
  'inventory-management.view': ['admin', 'pm'],
  'contracts.view': ['admin', 'pm', 'finance'],
  'reimbursements.view': ['admin', 'pm', 'finance', 'clerk'],
  'loans.view': ['admin', 'pm', 'finance', 'clerk'],
  'departments.view': ['admin', 'finance'],
  'approval-center.view': ['admin', 'pm', 'finance'],
  'integration.view': ['admin', 'pm', 'finance'],
  'finance.view': ['admin', 'pm', 'finance'],
  'reports.view': ['admin', 'pm', 'finance'],
  'history.view': ['admin'],
  'ai.view': ['admin', 'pm', 'finance', 'clerk'],
  'users.view': ['admin'],
  'inventory.create': ['admin', 'pm', 'clerk'],
  'inventory.outbound.direct': ['admin'],
  'inventory.outbound.request': ['clerk'],
  'inventory.approve': ['pm', 'admin'],
  'inventory.delete': ['admin', 'pm'],
  'inventory.edit': ['admin', 'pm'],
  'project.create': ['admin', 'pm'],
  'project.edit': ['admin', 'pm'],
  'project.delete': ['admin'],
  'finance.create': ['admin', 'finance'],
  'finance.approve.large': ['admin'],
  'finance.approve.normal': ['admin', 'finance'],
  'finance.delete': ['admin'],
  'log.export': ['admin'],
  'log.delete': ['admin'],
};
