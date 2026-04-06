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

export type SidebarItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  permission: string | null;
  adminOnly?: boolean;
  special?: boolean;
};

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, permission: null },
  { id: 'projects', label: '项目管理', icon: Building2, permission: 'projects.view' },
  { id: 'inventory', label: '物料仓库', icon: Package, permission: 'inventory.view' },
  { id: 'inventory-management', label: '物料管理', icon: Settings, permission: 'inventory-management.view' },
  { id: 'contracts', label: '合同管理', icon: FileText, permission: 'contracts.view' },
  { id: 'reimbursements', label: '报销管理', icon: Receipt, permission: 'reimbursements.view' },
  { id: 'loans', label: '借还款管理', icon: HandCoins, permission: 'loans.view' },
  { id: 'departments', label: '部门管理', icon: Building2, permission: 'departments.view' },
  { id: 'approval-center', label: '审批中心', icon: CheckSquare, permission: 'approval-center.view' },
  { id: 'integration', label: '集成中心', icon: Smartphone, permission: 'integration.view' },
  { id: 'finance', label: '财务收支', icon: Wallet, permission: 'finance.view' },
  { id: 'suppliers', label: '供应商管理', icon: Truck, permission: 'finance.view' },
  { id: 'change-orders', label: '变更/签证单', icon: FileEdit, permission: 'projects.view' },
  { id: 'reports', label: '报表', icon: BarChart2, permission: 'reports.view' },
  { id: 'history', label: '操作日志', icon: History, permission: 'history.view' },
  { id: 'ai', label: 'AI 决策室', icon: BrainCircuit, special: true, permission: 'ai.view' },
  { id: 'users', label: '用户管理', icon: User, adminOnly: true, permission: null },
  { id: 'roles', label: '角色管理', icon: Settings, adminOnly: true, permission: null },
  { id: 'permissions', label: '权限管理', icon: Settings, adminOnly: true, permission: null },
];

export function getVisibleSidebarItems(params: {
  currentUserId: string;
  hasPermission: (permission: string) => boolean;
}): SidebarItem[] {
  const { currentUserId, hasPermission } = params;

  return SIDEBAR_ITEMS.filter((item) => {
    if (item.adminOnly) {
      return currentUserId === 'admin';
    }
    if (!item.permission) {
      return true;
    }
    return hasPermission(item.permission);
  });
}
