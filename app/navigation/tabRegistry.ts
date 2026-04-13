import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  BrainCircuit,
  Building2,
  CheckSquare,
  FileEdit,
  FileText,
  HandCoins,
  History,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Smartphone,
  Truck,
  User,
  Wallet,
} from 'lucide-react';

export type SidebarGroupId = 'operations' | 'projects' | 'resources' | 'collaboration' | 'system';

export type AppTabId =
  | 'dashboard'
  | 'reports'
  | 'ai'
  | 'projects'
  | 'contracts'
  | 'change-orders'
  | 'inventory'
  | 'inventory-management'
  | 'finance'
  | 'suppliers'
  | 'reimbursements'
  | 'loans'
  | 'departments'
  | 'approval-center'
  | 'integration'
  | 'history'
  | 'users'
  | 'roles'
  | 'permissions';

export type AppTabDefinition = {
  id: AppTabId;
  label: string;
  icon: LucideIcon;
  group: SidebarGroupId;
  viewPermission: string | null;
  adminOnly?: boolean;
  special?: boolean;
};

export const DEFAULT_TAB: AppTabId = 'inventory';

export const APP_TABS: AppTabDefinition[] = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, viewPermission: null, group: 'operations' },
  { id: 'reports', label: '报表', icon: BarChart2, viewPermission: 'reports.view', group: 'operations' },
  { id: 'ai', label: 'AI 决策室', icon: BrainCircuit, special: true, viewPermission: 'ai.view', group: 'operations' },
  { id: 'projects', label: '项目管理', icon: Building2, viewPermission: 'projects.view', group: 'projects' },
  { id: 'contracts', label: '合同管理', icon: FileText, viewPermission: 'contracts.view', group: 'projects' },
  { id: 'change-orders', label: '变更/签证单', icon: FileEdit, viewPermission: 'projects.view', group: 'projects' },
  { id: 'inventory', label: '物料仓库', icon: Package, viewPermission: 'inventory.view', group: 'resources' },
  {
    id: 'inventory-management',
    label: '物料管理',
    icon: Settings,
    viewPermission: 'inventory-management.view',
    group: 'resources',
  },
  { id: 'finance', label: '财务收支', icon: Wallet, viewPermission: 'finance.view', group: 'resources' },
  { id: 'suppliers', label: '供应商管理', icon: Truck, viewPermission: 'finance.view', group: 'resources' },
  { id: 'reimbursements', label: '报销管理', icon: Receipt, viewPermission: 'reimbursements.view', group: 'resources' },
  { id: 'loans', label: '借还款管理', icon: HandCoins, viewPermission: 'loans.view', group: 'resources' },
  { id: 'departments', label: '部门管理', icon: Building2, viewPermission: 'departments.view', group: 'resources' },
  {
    id: 'approval-center',
    label: '审批中心',
    icon: CheckSquare,
    viewPermission: 'approval-center.view',
    group: 'collaboration',
  },
  {
    id: 'integration',
    label: '集成中心',
    icon: Smartphone,
    viewPermission: 'integration.view',
    group: 'collaboration',
  },
  { id: 'history', label: '操作日志', icon: History, viewPermission: 'history.view', group: 'system' },
  { id: 'users', label: '用户管理', icon: User, adminOnly: true, viewPermission: null, group: 'system' },
  { id: 'roles', label: '角色管理', icon: Settings, adminOnly: true, viewPermission: null, group: 'system' },
  { id: 'permissions', label: '权限管理', icon: Settings, adminOnly: true, viewPermission: null, group: 'system' },
];

export const SIDEBAR_GROUP_LABELS: Record<SidebarGroupId, string> = {
  operations: '经营',
  projects: '项目',
  resources: '资源',
  collaboration: '协同',
  system: '系统',
};

export function getTabDefinition(tabId: string): AppTabDefinition | undefined {
  return APP_TABS.find((item) => item.id === tabId);
}

export function getTabTitle(tabId: string): string {
  return getTabDefinition(tabId)?.label ?? '工作台';
}

export function getKnownTabIds(): AppTabId[] {
  return APP_TABS.map((item) => item.id);
}

export function canAccessTab(params: {
  tabId: string;
  currentUserId: string;
  hasPermission: (permission: string) => boolean;
}): boolean {
  const { tabId, currentUserId, hasPermission } = params;
  const tab = getTabDefinition(tabId);
  if (!tab) {
    return false;
  }
  if (tab.adminOnly) {
    return currentUserId === 'admin';
  }
  if (!tab.viewPermission) {
    return true;
  }
  return hasPermission(tab.viewPermission);
}

export function parseInitialTabState(search: string): { tabId?: AppTabId; projectId?: number } {
  const params = new URLSearchParams(search);
  const tab = params.get('tab');
  const id = params.get('id');
  if (!tab || !getKnownTabIds().includes(tab as AppTabId)) {
    return {};
  }

  const nextState: { tabId?: AppTabId; projectId?: number } = { tabId: tab as AppTabId };
  if (tab === 'projects' && id && !Number.isNaN(Number(id))) {
    nextState.projectId = Number(id);
  }
  return nextState;
}
