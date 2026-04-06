import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
  LayoutDashboard,
  Wallet,
  HardHat,
  Package,
  Plus,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ArrowRightLeft,
  X,
  Check,
  CheckSquare,
  Building2,
  History,
  BrainCircuit,
  Sparkles,
  Send,
  Search,
  Filter,
  Settings,
  Trash2,
  ChevronDown,
  User,
  Download,
  Bell,
  Eye,
  BarChart2,
  Truck,
  FileEdit,
  FileText,
  Receipt,
  HandCoins,
  Smartphone,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  downloadFinanceImportTemplate,
  downloadInventoryImportTemplate,
  downloadProjectImportTemplate,
  exportProjectsToExcel,
  exportInventoryToExcel,
  exportFinanceToExcel,
  exportAppStateAsBackup,
} from './utils/export';
import {
  parseBackupFile,
  restoreFromBackup,
  parseProjectExcel,
  parseInventoryExcel,
  parseFinanceExcel,
} from './utils/import';
import { analyzeConstructionDataStream } from './services/deepseekService';
import { apiService, getStoredUser, clearStoredAuth } from './services/apiService';
import type { AiMessage, AiSession } from './utils/aiHistory';
import { loadSessions, appendOrUpdateSession, sessionTitleFromMessages, removeSession } from './utils/aiHistory';
import {
  Project,
  InventoryItem,
  FinanceRecord,
  StockLog,
  SystemLog,
  Role,
  RoleDefinition,
  AppState,
  OperationDashboardSummary,
  BudgetExecutionItem,
  Department,
  ProjectDocumentRecord,
} from './types';
import Login from './components/Login/Login';
import SearchableSelect from './components/ui/SearchableSelect';
import RoleManagement from './components/Users/RoleManagement';
import SupplierManagement from './components/Suppliers/SupplierManagement';
import ChangeOrderManagement from './components/ChangeOrders/ChangeOrderManagement';
import ContractManagement from './components/Contracts/ContractManagement';
import ReimbursementManagement from './components/Reimbursements/ReimbursementManagement';
import LoanManagement from './components/Loans/LoanManagement';
import DepartmentManagement from './components/Departments/DepartmentManagement';
import IntegrationCenter from './components/Integration/IntegrationCenter';
import ApprovalCenter from './components/ApprovalCenter/ApprovalCenter';
import { getVisibleSidebarItems } from './app/navigation/sidebarItems';

function formatSessionTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const t = d.getTime();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  if (t >= today) return `今天 ${h}:${m}`;
  if (t >= yesterday) return `昨天 ${h}:${m}`;
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${mon}-${day} ${h}:${m}`;
}

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
import ProjectDetail from './components/ProjectDetail/ProjectDetail';
import ProjectKanban from './components/Projects/ProjectKanban';
import FinanceReport from './components/Reports/FinanceReport';
import InventoryReport from './components/Reports/InventoryReport';
import ProjectReport from './components/Reports/ProjectReport';

const ROLES: Record<string, Role> = {
  admin: { id: 'admin', name: '王总 (Admin)', label: '管理员' },
  pm: { id: 'pm', name: '李工 (PM)', label: '项目经理' },
  finance: { id: 'finance', name: '赵姐 (Finance)', label: '财务' },
  clerk: { id: 'clerk', name: '小张 (Clerk)', label: '录入员' },
};
const ROLE_OPTIONS = Object.values(ROLES);

const STATUS_COLORS: Record<string, string> = {
  施工中: 'bg-blue-100 text-blue-700',
  验收中: 'bg-purple-100 text-purple-700',
  已完工: 'bg-green-100 text-green-700',
  pending: 'bg-orange-100 text-orange-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

// 权限配置状态（从后端加载）
const permissionsConfig: Record<string, string[]> = {
  // 页面级别权限
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
  // 按钮级别权限
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

type AuthUser = { id: number; username: string; role: string; enabled: boolean };

const App = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(getStoredUser());
  const [roleDefs, setRoleDefs] = useState<RoleDefinition[]>([]);

  const roleLabelMap = useMemo(() => {
    const map: Record<string, Role> = { ...ROLES };
    roleDefs.forEach((r) => {
      map[r.code] = { id: r.code, name: r.name, label: r.name };
    });
    return map;
  }, [roleDefs]);

  const currentUser: Role = useMemo(() => {
    if (!authUser) return ROLES.admin;
    const r = roleLabelMap[authUser.role];
    return { id: authUser.role, name: authUser.username, label: r ? r.label : authUser.role };
  }, [authUser, roleLabelMap]);

  const [activeTab, setActiveTab] = useState('inventory');
  const [tabInitializedFromUrl, setTabInitializedFromUrl] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Modal States
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState<'in' | 'out'>('in');
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [stockAmount, setStockAmount] = useState<number>(0);
  const [targetProjectId, setTargetProjectId] = useState<number>(0);
  const [stockSupplierId, setStockSupplierId] = useState<number | null>(null);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: number; name: string; contactPerson?: string; contactPhone?: string; bankInfo?: string }>
  >([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Project Modal States
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [userOptions, setUserOptions] = useState<{ id: number; username: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<Project | null>(null);
  const [projectViewMode, setProjectViewMode] = useState<'table' | 'kanban'>('table');
  const [projectForm, setProjectForm] = useState({
    name: '',
    code: '',
    managerId: '',
    contractAmount: 0,
    receivedAmount: 0,
    materialCost: 0,
    laborCost: 0,
    otherCost: 0,
    totalBudget: 0 as number | '',
    status: '施工中',
    progress: 0,
    startDate: '',
    endDate: '',
  });

  // Finance Modal States
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeForm, setFinanceForm] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: 0,
    projectId: null as number | null,
    departmentId: null as number | null,
    paymentPlanItemId: null as number | null,
    supplierId: null as number | null,
    desc: '',
  });
  const [financeCategories, setFinanceCategories] = useState<{ code: string; label: string; costType: string }[]>([]);
  const [paymentPlanOptionsForFinance, setPaymentPlanOptionsForFinance] = useState<{ id: number; name: string }[]>([]);
  const [financeDetailModalType, setFinanceDetailModalType] = useState<'income' | 'expense' | 'all' | null>(null);

  // User management (admin)
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'clerk' as string, enabled: true });

  // AI States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiHistorySessions, setAiHistorySessions] = useState<AiSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Log filters (history page)
  const [logFilterUser, setLogFilterUser] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('');
  const [reportSubTab, setReportSubTab] = useState<'finance' | 'inventory' | 'project'>('finance');
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportProjectId, setReportProjectId] = useState<number | ''>('');
  const [historyFilteredLogs, setHistoryFilteredLogs] = useState<SystemLog[] | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [upcomingPaymentPlans, setUpcomingPaymentPlans] = useState<
    Array<{
      id: number;
      projectId: number;
      name: string;
      planDate: string;
      planAmount: number;
      receivedAmount: number;
      status: string;
    }>
  >([]);
  const [overdueMilestones, setOverdueMilestones] = useState<
    Array<{ id: number; name: string; planDate: string; status: string; projectId: number; projectName?: string }>
  >([]);
  const [operationDashboard, setOperationDashboard] = useState<OperationDashboardSummary | null>(null);
  const [budgetExecutionDashboard, setBudgetExecutionDashboard] = useState<BudgetExecutionItem[]>([]);
  const [importMode, setImportMode] = useState<'restore' | 'project' | 'inventory' | 'finance' | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Permissions State
  const [permissions, setPermissions] = useState<Record<string, string[]>>(permissionsConfig);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Config State
  const [config, setConfig] = useState({ lowStockThreshold: '100', largeExpenseThreshold: '100000' });
  const [configForm, setConfigForm] = useState({ lowStockThreshold: '100', largeExpenseThreshold: '100000' });

  // Inventory Management States
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [inventoryForm, setInventoryForm] = useState({
    name: '',
    spec: '',
    unit: '',
    price: 0,
    quantity: 0,
    threshold: 0,
  });

  // Reject Note Modal State
  const [isRejectNoteModalOpen, setIsRejectNoteModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [pendingRejectLogId, setPendingRejectLogId] = useState<number | null>(null);

  // 权限检查函数（使用动态权限配置）
  const hasPermission = (currentUser: Role, permission: string): boolean => {
    const allowedRoles = permissions[permission] || [];
    return allowedRoles.includes(currentUser.id);
  };

  // 统一数据刷新函数：供按钮成功回调调用
  const reloadCoreData = async () => {
    if (!authUser) return;
    setIsLoading(true);
    try {
      const [
        projectsData,
        inventoryData,
        financeData,
        stockData,
        logsData,
        permissionsData,
        rolesData,
        suppliersData,
        departmentsData,
      ] = await Promise.all([
        apiService.getProjects().catch(() => []) as Promise<Project[]>,
        apiService.getInventory().catch(() => []) as Promise<InventoryItem[]>,
        apiService.getFinanceRecords().catch(() => []) as Promise<FinanceRecord[]>,
        apiService.getStockLogs().catch(() => []) as Promise<StockLog[]>,
        apiService.getSystemLogs().catch(() => []) as Promise<SystemLog[]>,
        apiService.getPermissions().catch(() => ({})) as Promise<Record<string, string[]>>,
        apiService.getRoles().catch(() => []) as Promise<RoleDefinition[]>,
        apiService.getSuppliers().catch(() => []) as Promise<Array<{ id: number; name: string }>>,
        apiService.getDepartments().catch(() => []) as Promise<Department[]>,
      ]);

      const projects = Array.isArray(projectsData) ? projectsData : [];
      const inventory = Array.isArray(inventoryData) ? inventoryData : [];
      const finance = Array.isArray(financeData) ? financeData : [];
      const stock = Array.isArray(stockData) ? stockData : [];
      const logs = Array.isArray(logsData) ? logsData : [];
      const suppliersList = Array.isArray(suppliersData) ? suppliersData : [];
      const departmentsList = Array.isArray(departmentsData) ? departmentsData : [];
      const perms = (() => {
        const apiPerms = permissionsData && Object.keys(permissionsData).length > 0 ? permissionsData : {};
        return { ...permissionsConfig, ...apiPerms };
      })();

      const configData = (await apiService.getConfig().catch(() => ({}))) as {
        lowStockThreshold?: string;
        largeExpenseThreshold?: string;
      };
      if (configData && (configData.lowStockThreshold || configData.largeExpenseThreshold)) {
        setConfig({
          lowStockThreshold: configData.lowStockThreshold || '100',
          largeExpenseThreshold: configData.largeExpenseThreshold || '100000',
        });
        setConfigForm({
          lowStockThreshold: configData.lowStockThreshold || '100',
          largeExpenseThreshold: configData.largeExpenseThreshold || '100000',
        });
      }

      setProjects(projects);
      setInventory(inventory);
      setFinanceRecords(finance);
      setStockLogs(stock);
      setSystemLogs(logs);
      setSuppliers(suppliersList);
      setDepartments(departmentsList);
      setPermissions(perms);
      if (Array.isArray(rolesData) && rolesData.length > 0) {
        setRoleDefs(rolesData);
      }

      if (inventory.length > 0) {
        setSelectedItemId(inventory[0].id);
      }
      if (projects.length > 0) {
        setTargetProjectId(projects[0].id);
      }

      setIsBackendConnected(true);
    } catch (error) {
      console.error('Failed to load data:', error);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Toast Component
  const Toast = ({
    message,
    type,
    onClose,
  }: {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
  }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    const icon = type === 'success' ? <Check size={20} /> : type === 'error' ? <X size={20} /> : <Clock size={20} />;

    return (
      <div className="fixed top-20 right-8 z-[200] animate-in slide-in-from-right duration-300">
        <div className={`${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]`}>
          <div className="flex-shrink-0">{icon}</div>
          <p className="flex-1 font-medium">{message}</p>
          <button onClick={onClose} className="flex-shrink-0 hover:opacity-80 transition-opacity">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  };

  // Load data from backend（仅登录后加载）
  useEffect(() => {
    if (tabInitializedFromUrl) return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const id = params.get('id');
    const allowedTabs = new Set([
      'dashboard',
      'projects',
      'inventory',
      'inventory-management',
      'finance',
      'suppliers',
      'contracts',
      'change-orders',
      'reimbursements',
      'loans',
      'departments',
      'approval-center',
      'integration',
      'reports',
      'history',
      'ai',
      'users',
      'roles',
    ]);
    if (tab && allowedTabs.has(tab)) {
      setActiveTab(tab);
      if (tab === 'projects' && id && !Number.isNaN(Number(id))) {
        setSelectedProjectId(Number(id));
      }
    }
    setTabInitializedFromUrl(true);
  }, [tabInitializedFromUrl]);

  // Load data from backend（仅登录后加载）
  useEffect(() => {
    if (!authUser) return;
    reloadCoreData();
  }, [authUser]);

  // Load project detail when viewing a project (backend does not include milestones in project JSON, so fetch separately)
  useEffect(() => {
    if (selectedProjectId == null) {
      setSelectedProjectDetail(null);
      return;
    }
    Promise.all([
      apiService.getProjectById(selectedProjectId),
      apiService.getMilestones(selectedProjectId).catch(() => []),
    ])
      .then(([p, milestones]) =>
        setSelectedProjectDetail({ ...(p as Project), milestones: milestones as Project['milestones'] })
      )
      .catch(() => setSelectedProjectDetail(null));
  }, [selectedProjectId]);

  // Load user options for project form "项目经理" dropdown when opening project modal
  useEffect(() => {
    if (!isProjectModalOpen) return;
    apiService
      .getUserOptions()
      .then((list) => setUserOptions(Array.isArray(list) ? list : []))
      .catch(() => setUserOptions([]));
  }, [isProjectModalOpen]);

  // Load finance categories for expense dropdown when opening finance modal
  useEffect(() => {
    if (!isFinanceModalOpen) return;
    apiService
      .getFinanceCategories()
      .then((list) => setFinanceCategories(Array.isArray(list) ? list : []))
      .catch(() => setFinanceCategories([]));
  }, [isFinanceModalOpen]);

  // Load payment plan options when income + projectId selected (for 计入回款计划节点)
  useEffect(() => {
    if (!isFinanceModalOpen || financeForm.type !== 'income' || !financeForm.projectId) {
      setPaymentPlanOptionsForFinance([]);
      return;
    }
    apiService
      .getPaymentPlansByProject(financeForm.projectId)
      .then((list: { id: number; name: string }[]) => setPaymentPlanOptionsForFinance(Array.isArray(list) ? list : []))
      .catch(() => setPaymentPlanOptionsForFinance([]));
  }, [isFinanceModalOpen, financeForm.type, financeForm.projectId]);

  useEffect(() => {
    if (!authUser || !['finance', 'suppliers', 'inventory'].includes(activeTab)) return;
    apiService
      .getSuppliers()
      .then((list) => setSuppliers(Array.isArray(list) ? list : []))
      .catch(() => setSuppliers([]));
  }, [authUser, activeTab]);

  useEffect(() => {
    if (!authUser || !['finance', 'reimbursements', 'loans', 'departments'].includes(activeTab)) return;
    apiService
      .getDepartments()
      .then((list) => setDepartments(Array.isArray(list) ? (list as Department[]) : []))
      .catch(() => setDepartments([]));
  }, [authUser, activeTab]);

  // Load users when opening user management (admin only)
  useEffect(() => {
    if (activeTab !== 'users' || currentUser.id !== 'admin') return;
    (async () => {
      try {
        const list = await apiService.getUsers();
        setUsers(list);
      } catch (err: unknown) {
        setUsers([]);
        setToast((prev) => prev ?? { message: '加载用户列表失败，请尝试重新登录。', type: 'error' });
      }
    })();
  }, [activeTab, currentUser.id]);

  // Load AI history when user changes
  useEffect(() => {
    setAiHistorySessions(loadSessions(authUser?.id));
    setAiMessages([]);
    setCurrentSessionId(null);
  }, [authUser?.id]);

  // 操作日志：按用户/操作筛选时使用后端 API
  useEffect(() => {
    if (!logFilterUser && !logFilterAction) {
      setHistoryFilteredLogs(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        if (logFilterUser && logFilterAction) {
          const byUser = (await apiService.getSystemLogsByUser(logFilterUser)) as SystemLog[];
          const list = Array.isArray(byUser) ? byUser.filter((l) => l.action === logFilterAction) : [];
          if (!cancelled) setHistoryFilteredLogs(list);
        } else if (logFilterUser) {
          const list = (await apiService.getSystemLogsByUser(logFilterUser)) as SystemLog[];
          if (!cancelled) setHistoryFilteredLogs(Array.isArray(list) ? list : []);
        } else {
          const list = (await apiService.getSystemLogsByAction(logFilterAction)) as SystemLog[];
          if (!cancelled) setHistoryFilteredLogs(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) setHistoryFilteredLogs([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [logFilterUser, logFilterAction]);

  // Load upcoming payment plans & overdue milestones when on dashboard
  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    Promise.all([
      apiService.getUpcomingPaymentPlans(15).catch(() => []),
      apiService.getOverdueMilestones().catch(() => []),
      apiService.getOperationDashboard(15).catch(() => null),
      apiService.getBudgetExecutionDashboard().catch(() => []),
    ])
      .then(([upcoming, overdue, operation, budgetExecution]) => {
        setUpcomingPaymentPlans(Array.isArray(upcoming) ? (upcoming as any) : []);
        setOverdueMilestones(Array.isArray(overdue) ? (overdue as any) : []);
        setOperationDashboard(
          operation && typeof operation === 'object' ? (operation as OperationDashboardSummary) : null
        );
        setBudgetExecutionDashboard(Array.isArray(budgetExecution) ? (budgetExecution as BudgetExecutionItem[]) : []);
      })
      .catch(() => {
        setUpcomingPaymentPlans([]);
        setOverdueMilestones([]);
        setOperationDashboard(null);
        setBudgetExecutionDashboard([]);
      });
  }, [activeTab]);

  // Stock Action Handler
  const handleStockSubmit = async () => {
    if (stockAmount <= 0) {
      alert('请输入有效的数量！');
      return;
    }

    if (!selectedItemId) {
      alert('请选择物料！');
      return;
    }

    const selectedItem = inventory.find((i) => i.id === selectedItemId);
    if (!selectedItem) {
      alert('物料不存在！');
      return;
    }

    try {
      const stockLogData = {
        type: stockModalType,
        itemId: selectedItemId,
        qty: stockAmount,
        price: selectedItem.price,
        projectId: stockModalType === 'out' ? targetProjectId : null,
        supplierId: stockModalType === 'in' ? (stockSupplierId ?? undefined) : undefined,
        creator: currentUser.name,
        note: '',
      };

      await apiService.createStockLog(stockLogData);
      await reloadCoreData();

      // 显示提示信息
      if (stockModalType === 'out') {
        const isAdmin =
          currentUser.id === 'admin' || currentUser.name.includes('Admin') || currentUser.name.includes('王总');
        if (isAdmin) {
          setToast({ message: '出库成功！', type: 'success' });
        } else {
          setToast({ message: '出库申请已提交，等待项目经理审核。', type: 'info' });
        }
      } else {
        setToast({ message: '入库成功！', type: 'success' });
      }

      // Close & Reset
      setIsStockModalOpen(false);
      setStockAmount(0);
      setStockSupplierId(null);
    } catch (error: any) {
      setToast({ message: error.message || '操作失败，请稍后重试。', type: 'error' });
    }
  };

  // 审批出库申请
  const handleApproveStock = async (logId: number, approved: boolean, note?: string) => {
    try {
      await apiService.approveStockOut(logId, currentUser.name, approved, note || '');

      // 重新加载数据
      const [inventoryData, stockData] = await Promise.all([
        apiService.getInventory().catch(() => []) as Promise<InventoryItem[]>,
        apiService.getStockLogs().catch(() => []) as Promise<StockLog[]>,
      ]);

      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setStockLogs(Array.isArray(stockData) ? stockData : []);

      setToast({ message: approved ? '审批通过！' : '已拒绝该申请。', type: approved ? 'success' : 'info' });
    } catch (error: any) {
      setToast({ message: error.message || '审批操作失败，请稍后重试。', type: 'error' });
    }
  };

  // 打开项目编辑模态框
  const openProjectModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({
        name: project.name,
        code: project.code,
        managerId: project.managerId,
        contractAmount: project.contractAmount,
        receivedAmount: project.receivedAmount,
        materialCost: project.materialCost,
        laborCost: project.laborCost,
        otherCost: project.otherCost,
        totalBudget: project.totalBudget ?? 0,
        status: project.status,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.endDate || '',
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        name: '',
        code: '',
        managerId: '',
        contractAmount: 0,
        receivedAmount: 0,
        materialCost: 0,
        laborCost: 0,
        otherCost: 0,
        totalBudget: 0,
        status: '施工中',
        progress: 0,
        startDate: '',
        endDate: '',
      });
    }
    setIsProjectModalOpen(true);
  };

  // 保存项目
  const handleSaveProject = async () => {
    try {
      const projectData = {
        ...projectForm,
        totalBudget:
          projectForm.totalBudget === '' || projectForm.totalBudget == null ? null : Number(projectForm.totalBudget),
        milestones: editingProject?.milestones || [],
      };

      if (editingProject) {
        await apiService.updateProject(editingProject.id, projectData);
        setToast({ message: '项目更新成功！', type: 'success' });
      } else {
        await apiService.createProject(projectData);
        setToast({ message: '项目创建成功！', type: 'success' });
      }

      await reloadCoreData();

      setIsProjectModalOpen(false);
      setEditingProject(null);
    } catch (error: any) {
      setToast({ message: error.message || '操作失败，请稍后重试。', type: 'error' });
    }
  };

  // 删除项目
  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('确定要删除该项目吗？此操作不可恢复。')) {
      return;
    }

    try {
      await apiService.deleteProject(projectId);
      setToast({ message: '项目删除成功！', type: 'success' });

      await reloadCoreData();
    } catch (error: any) {
      setToast({ message: error.message || '删除失败，请稍后重试。', type: 'error' });
    }
  };

  // 打开财务记录模态框
  const openFinanceModal = () => {
    setFinanceForm({
      type: 'expense',
      category: '',
      amount: 0,
      projectId: null,
      departmentId: null,
      paymentPlanItemId: null,
      supplierId: null,
      desc: '',
    });
    setPaymentPlanOptionsForFinance([]);
    setIsFinanceModalOpen(true);
  };

  // 保存财务记录
  const handleSaveFinance = async () => {
    try {
      const financeData = {
        ...financeForm,
        supplierId: financeForm.supplierId ?? undefined,
        departmentId: financeForm.departmentId ?? undefined,
        paymentPlanItemId: financeForm.paymentPlanItemId ?? undefined,
        creator: currentUser.name,
        date: new Date().toISOString().split('T')[0],
      };

      await apiService.createFinanceRecord(financeData);
      setToast({ message: '财务记录创建成功！', type: 'success' });

      await reloadCoreData();

      setIsFinanceModalOpen(false);
    } catch (error: any) {
      setToast({ message: error.message || '操作失败，请稍后重试。', type: 'error' });
    }
  };

  // 审批财务记录
  const handleApproveFinance = async (recordId: number, approved: boolean, note?: string) => {
    try {
      await apiService.approveFinanceRecord(recordId, currentUser.name, approved, note || '');
      setToast({ message: approved ? '审批通过！' : '已拒绝该申请。', type: approved ? 'success' : 'info' });

      await reloadCoreData();
    } catch (error: any) {
      setToast({ message: error.message || '审批操作失败，请稍后重试。', type: 'error' });
    }
  };

  // 红字冲销财务记录
  const handleReversalFinance = async (originalId: number) => {
    if (!confirm('确定对该笔已审批记录进行红字冲销吗？将生成一笔负金额冲销单并回减项目成本/已收款。')) return;
    try {
      await apiService.createFinanceReversal(originalId, `冲销：原单#${originalId}`, currentUser.name);
      setToast({ message: '冲销单已创建，待审批通过后生效。', type: 'success' });
      await reloadCoreData();
    } catch (error: any) {
      setToast({ message: error.message || '冲销失败，请稍后重试。', type: 'error' });
    }
  };

  // 红字冲销库存记录
  const handleReversalStock = async (originalId: number) => {
    if (!confirm('确定对该笔已生效库存记录进行红字冲销吗？冲销单审批通过后将回调库存数量。')) return;
    try {
      await apiService.createStockReversal(originalId, `冲销：原单#${originalId}`, currentUser.name);
      setToast({ message: '库存冲销单已创建，待审批通过后生效。', type: 'success' });
      await reloadCoreData();
    } catch (error: any) {
      setToast({ message: error.message || '库存冲销失败，请稍后重试。', type: 'error' });
    }
  };

  // 审批库存冲销单
  const handleApproveStockReversal = async (logId: number, approved: boolean) => {
    const note = approved ? '' : prompt('请输入拒绝原因：') || '';
    if (!approved && note === '') return;
    try {
      await apiService.approveStockReversal(logId, currentUser.name, approved, note);
      setToast({ message: approved ? '冲销单已通过，库存已回调。' : '冲销单已拒绝。', type: 'success' });
      await reloadCoreData();
    } catch (error: any) {
      setToast({ message: error.message || '审批失败，请稍后重试。', type: 'error' });
    }
  };

  const handleAiAnalysis = async () => {
    if (!aiPrompt.trim() || isAiThinking) return;
    const userContent = aiPrompt.trim();
    setAiPrompt('');
    setAiMessages((prev) => [...prev, { role: 'user', content: userContent }]);
    setAiMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    setIsAiThinking(true);
    try {
      const appState = (await apiService.getAppState()) as any;
      const data: AppState = {
        projects: (appState.projects || []) as Project[],
        inventory: (appState.inventory || []) as InventoryItem[],
        financeRecords: (appState.financeRecords || []) as FinanceRecord[],
        stockLogs: (appState.stockLogs || []) as StockLog[],
        projectDocuments: (appState.projectDocuments || []) as ProjectDocumentRecord[],
      };
      const fullText = await analyzeConstructionDataStream(userContent, data, (delta) => {
        setAiMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant') {
            next[next.length - 1] = { ...last, content: last.content + delta };
          }
          return next;
        });
      });
      setAiMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: fullText };
        const id = currentSessionId ?? `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const title = sessionTitleFromMessages(next);
        const createdAt = currentSessionId
          ? (aiHistorySessions.find((s) => s.id === currentSessionId)?.createdAt ?? Date.now())
          : Date.now();
        const session: AiSession = { id, title, messages: next, createdAt };
        const nextHistory = appendOrUpdateSession(authUser?.id, aiHistorySessions, session);
        setTimeout(() => {
          setAiHistorySessions(nextHistory);
          setCurrentSessionId(id);
        }, 0);
        return next;
      });
    } catch (error) {
      console.error('AI Analysis error:', error);
      setAiMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: '分析失败，请稍后重试。' };
        return next;
      });
    } finally {
      setIsAiThinking(false);
    }
  };

  // 保存权限配置
  const handleSavePermissions = async () => {
    try {
      await apiService.savePermissions(permissions);
      setToast({ message: '权限配置已保存', type: 'success' });
      setIsPermissionsModalOpen(false);
      // 重新加载权限配置
      const perms = (await apiService.getPermissions().catch(() => ({}))) as Record<string, string[]>;
      if (perms && Object.keys(perms).length > 0) {
        setPermissions(perms);
      }
    } catch (error: any) {
      setToast({ message: error.message || '保存权限配置失败', type: 'error' });
    }
  };

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      await apiService.saveConfig({
        lowStockThreshold: configForm.lowStockThreshold,
        largeExpenseThreshold: configForm.largeExpenseThreshold,
      });
      setConfig(configForm);
      setToast({ message: '系统配置已保存', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || '保存配置失败', type: 'error' });
    }
  };

  // 保存物料
  const handleSaveInventoryItem = async () => {
    try {
      if (!inventoryForm.name || !inventoryForm.spec || !inventoryForm.unit) {
        setToast({ message: '请填写完整的物料信息', type: 'error' });
        return;
      }

      if (editingInventoryItem) {
        await apiService.updateInventoryItem(editingInventoryItem.id, inventoryForm);
        setToast({ message: '物料已更新', type: 'success' });
      } else {
        await apiService.createInventoryItem(inventoryForm);
        setToast({ message: '物料已创建', type: 'success' });
      }

      setIsInventoryModalOpen(false);
      const inventoryData = (await apiService.getInventory().catch(() => [])) as InventoryItem[];
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (error: any) {
      setToast({ message: error.message || '操作失败', type: 'error' });
    }
  };

  // 确认拒绝操作
  const handleConfirmReject = async (isFinance: boolean = false) => {
    if (pendingRejectLogId === null) return;

    try {
      if (isFinance) {
        await handleApproveFinance(pendingRejectLogId, false, rejectNote);
      } else {
        await handleApproveStock(pendingRejectLogId, false, rejectNote);
      }
    } catch (error: any) {
      setToast({ message: error.message || '操作失败', type: 'error' });
    }

    setIsRejectNoteModalOpen(false);
    setPendingRejectLogId(null);
    setRejectNote('');
  };

  // 更新权限配置
  const handlePermissionChange = (permission: string, role: string, checked: boolean) => {
    const currentRoles = permissions[permission] || [];
    if (checked) {
      setPermissions({
        ...permissions,
        [permission]: [...currentRoles, role],
      });
    } else {
      setPermissions({
        ...permissions,
        [permission]: currentRoles.filter((r) => r !== role),
      });
    }
  };

  // 恢复备份 / 导入 Excel
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !importMode) return;
    const mode = importMode;
    setImportMode(null);
    try {
      if (mode === 'restore') {
        const data = await parseBackupFile(file);
        const result = await restoreFromBackup(
          data,
          {
            createProject: apiService.createProject.bind(apiService),
            createInventoryItem: apiService.createInventoryItem.bind(apiService),
            createFinanceRecord: apiService.createFinanceRecord.bind(apiService),
            createStockLog: apiService.createStockLog.bind(apiService),
          },
          currentUser.name
        );
        if (result.success) {
          setToast({ message: result.message, type: 'success' });
          const [projectsData, inventoryData, financeData, stockData] = await Promise.all([
            apiService.getProjects().catch(() => []),
            apiService.getInventory().catch(() => []),
            apiService.getFinanceRecords().catch(() => []),
            apiService.getStockLogs().catch(() => []),
          ]);
          setProjects(Array.isArray(projectsData) ? projectsData : []);
          setInventory(Array.isArray(inventoryData) ? inventoryData : []);
          setFinanceRecords(Array.isArray(financeData) ? financeData : []);
          setStockLogs(Array.isArray(stockData) ? stockData : []);
        } else {
          setToast({ message: result.message, type: 'error' });
        }
      } else if (mode === 'project') {
        const rows = await parseProjectExcel(file);
        let ok = 0;
        for (const row of rows) {
          if (!row.name || !row.code) continue;
          try {
            await apiService.createProject({ ...row, milestones: [] });
            ok++;
          } catch (_) {
            /* skip duplicate or invalid */
          }
        }
        setToast({ message: `已导入 ${ok} 条项目`, type: 'success' });
        const projectsData = await apiService.getProjects().catch(() => []);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } else if (mode === 'inventory') {
        const rows = await parseInventoryExcel(file);
        let ok = 0;
        for (const row of rows) {
          if (!row.name || !row.spec || !row.unit) continue;
          try {
            await apiService.createInventoryItem(row);
            ok++;
          } catch (_) {
            /* skip invalid row */
          }
        }
        setToast({ message: `已导入 ${ok} 条物料`, type: 'success' });
        const inventoryData = await apiService.getInventory().catch(() => []);
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      } else if (mode === 'finance') {
        const rows = await parseFinanceExcel(file);
        let ok = 0;
        for (const row of rows) {
          try {
            await apiService.createFinanceRecord({ ...row, creator: currentUser.name });
            ok++;
          } catch (_) {
            /* skip invalid row */
          }
        }
        setToast({ message: `已导入 ${ok} 条财务记录`, type: 'success' });
        const financeData = await apiService.getFinanceRecords().catch(() => []);
        setFinanceRecords(Array.isArray(financeData) ? financeData : []);
      }
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : '操作失败', type: 'error' });
    }
  };

  // 重置数据
  const handleResetData = async () => {
    if (!confirm('⚠️ 警告：此操作将清空所有数据！\n\n确定要继续吗？')) {
      return;
    }

    try {
      await apiService.resetData();
      setToast({ message: '数据已重置，请刷新页面或重启后端应用', type: 'info' });
    } catch (error: any) {
      setToast({ message: error.message || '重置数据失败', type: 'error' });
    }
  };

  const openUserModal = (user?: AuthUser) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ username: user.username, password: '', role: user.role, enabled: user.enabled });
    } else {
      setEditingUser(null);
      setUserForm({ username: '', password: '', role: 'clerk', enabled: true });
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim()) {
      setToast({ message: '请输入用户名', type: 'error' });
      return;
    }
    if (!editingUser && !userForm.password) {
      setToast({ message: '请输入密码', type: 'error' });
      return;
    }
    try {
      if (editingUser) {
        await apiService.updateUser(editingUser.id, {
          username: userForm.username.trim(),
          ...(userForm.password ? { password: userForm.password } : {}),
          role: userForm.role,
          enabled: userForm.enabled,
        });
        setToast({ message: '用户已更新', type: 'success' });
      } else {
        await apiService.createUser({
          username: userForm.username.trim(),
          password: userForm.password,
          role: userForm.role,
        });
        setToast({ message: '用户已创建', type: 'success' });
      }
      const list = await apiService.getUsers();
      setUsers(list);
      setIsUserModalOpen(false);
    } catch (err: unknown) {
      setToast({ message: (err as Error).message || '操作失败', type: 'error' });
    }
  };

  const handleDeleteUser = async (user: AuthUser) => {
    if (user.id === authUser?.id) {
      setToast({ message: '不能删除当前登录用户', type: 'error' });
      return;
    }
    if (!confirm(`确定删除用户「${user.username}」？`)) return;
    try {
      await apiService.deleteUser(user.id);
      setToast({ message: '已删除', type: 'success' });
      setUsers(await apiService.getUsers());
    } catch (err: unknown) {
      setToast({ message: (err as Error).message || '删除失败', type: 'error' });
    }
  };

  if (!authUser) {
    return <Login onSuccess={() => setAuthUser(getStoredUser())} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Stock Modal */}
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <input
        type="file"
        ref={fileInputRef}
        accept={importMode === 'restore' ? '.json' : '.xlsx'}
        className="hidden"
        onChange={handleFileImport}
      />

      {isStockModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div
              className={`p-6 flex items-center justify-between text-white ${stockModalType === 'in' ? 'bg-green-600' : 'bg-blue-600'}`}
            >
              <h3 className="text-lg font-bold flex items-center gap-2">
                {stockModalType === 'in' ? <Plus size={20} /> : <ArrowRightLeft size={20} />}
                物料{stockModalType === 'in' ? '入库登记' : '出库申请'}
              </h3>
              <button onClick={() => setIsStockModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">选择物料</label>
                <SearchableSelect
                  options={inventory.map((i) => ({ value: i.id, label: `${i.name} (${i.spec})` }))}
                  value={selectedItemId}
                  onChange={(v) => setSelectedItemId(Number(v))}
                  placeholder="请选择或输入检索物料..."
                  maxHeight="240px"
                />
              </div>

              {stockModalType === 'out' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">关联项目</label>
                  <SearchableSelect
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    value={targetProjectId}
                    onChange={(v) => setTargetProjectId(Number(v))}
                    placeholder="请选择或输入检索项目..."
                    maxHeight="240px"
                  />
                </div>
              )}
              {stockModalType === 'in' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">供应商（可选）</label>
                  <SearchableSelect
                    options={[
                      { value: '', label: '不关联供应商' },
                      ...suppliers.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                    value={stockSupplierId ?? ''}
                    onChange={(v) => setStockSupplierId(v === '' ? null : Number(v))}
                    placeholder="请选择或检索供应商..."
                    maxHeight="240px"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  操作数量 ({inventory.find((i) => i.id === selectedItemId)?.unit})
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入数量..."
                  value={stockAmount || ''}
                  onChange={(e) => setStockAmount(Number(e.target.value))}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsStockModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleStockSubmit}
                  className={`flex-1 px-4 py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${stockModalType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  确认{stockModalType === 'in' ? '入库' : '出库'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 财务细项弹窗（仪表盘卡片点击） */}
      {financeDetailModalType && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setFinanceDetailModalType(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-700">
                {financeDetailModalType === 'income'
                  ? '收入明细'
                  : financeDetailModalType === 'expense'
                    ? '支出明细'
                    : '收支明细'}
              </h3>
              <button
                type="button"
                onClick={() => setFinanceDetailModalType(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-bold">日期</th>
                    <th className="px-4 py-3 font-bold">类型</th>
                    <th className="px-4 py-3 font-bold">类别</th>
                    <th className="px-4 py-3 font-bold">金额</th>
                    <th className="px-4 py-3 font-bold">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(() => {
                    const list =
                      financeDetailModalType === 'all'
                        ? financeRecords
                        : financeRecords.filter((r) => r.type === financeDetailModalType);
                    const sorted = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    if (sorted.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                            暂无记录
                          </td>
                        </tr>
                      );
                    }
                    return sorted.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{new Date(r.date).toLocaleDateString('zh-CN')}</td>
                        <td className="px-4 py-3">
                          <span className={r.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {r.type === 'income' ? '收入' : '支出'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{r.category}</td>
                        <td className="px-4 py-3 font-medium">{r.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              r.status === 'approved'
                                ? 'text-green-600'
                                : r.status === 'rejected'
                                  ? 'text-red-600'
                                  : 'text-orange-600'
                            }
                          >
                            {r.status === 'approved' ? '已审批' : r.status === 'rejected' ? '已拒绝' : '待审批'}
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 用户新建/编辑弹窗 */}
      {isUserModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100/80 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-700">{editingUser ? '编辑用户' : '新建用户'}</h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">用户名</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="登录用户名"
                  required
                  disabled={!!editingUser}
                />
                {editingUser && <p className="text-xs text-slate-400 mt-1">用户名不可修改</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  密码{editingUser ? '（留空不修改）' : ''}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder={editingUser ? '留空则不修改密码' : '登录密码'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">角色</label>
                <SearchableSelect
                  options={Object.keys(roleLabelMap).map((roleId) => ({
                    value: roleId,
                    label: roleLabelMap[roleId]?.label ?? roleId,
                  }))}
                  value={userForm.role}
                  onChange={(v) => setUserForm((f) => ({ ...f, role: String(v) }))}
                  placeholder="请选择或检索角色..."
                  className="w-full"
                  inputClassName="px-3 py-2 border border-slate-200 rounded-xl"
                  maxHeight="200px"
                />
              </div>
              {editingUser && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="user-enabled"
                    checked={userForm.enabled}
                    onChange={(e) => setUserForm((f) => ({ ...f, enabled: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="user-enabled" className="text-sm text-slate-600">
                    启用
                  </label>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  {editingUser ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex items-center justify-between text-white bg-blue-600">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Building2 size={20} />
                {editingProject ? '编辑项目' : '新建项目'}
              </h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目名称 *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目编号 *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.code}
                    onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value })}
                    disabled={!!editingProject}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目经理 *</label>
                  <SearchableSelect
                    options={userOptions.map((u) => ({ value: u.username, label: u.username }))}
                    value={projectForm.managerId}
                    onChange={(v) => setProjectForm({ ...projectForm, managerId: String(v) })}
                    placeholder="请选择用户..."
                    maxHeight="200px"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目状态</label>
                  <SearchableSelect
                    options={[
                      { value: '施工中', label: '施工中' },
                      { value: '验收中', label: '验收中' },
                      { value: '已完工', label: '已完工' },
                    ]}
                    value={projectForm.status}
                    onChange={(v) => setProjectForm({ ...projectForm, status: String(v) })}
                    placeholder="请选择状态..."
                    maxHeight="180px"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">合同金额</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.contractAmount}
                    onChange={(e) => setProjectForm({ ...projectForm, contractAmount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">控制预算（可选）</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.totalBudget === '' ? '' : projectForm.totalBudget}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        totalBudget: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    placeholder="不填则不启用预算预警"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">已收款</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-600">
                    ￥{projectForm.receivedAmount.toLocaleString()}（由财务收入审批自动汇总）
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">进度 (%)</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-600">
                    {projectForm.progress}%（由里程碑自动计算，请在项目详情中维护里程碑）
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">材料成本</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-600">
                    ￥{projectForm.materialCost.toLocaleString()}（由财务支出审批自动汇总）
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">人工成本</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-600">
                    ￥{projectForm.laborCost.toLocaleString()}（由财务支出审批自动汇总）
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">其他成本</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-600">
                    ￥{projectForm.otherCost.toLocaleString()}（由财务支出审批自动汇总）
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">开始日期</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">结束日期</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsProjectModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveProject}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
                >
                  {editingProject ? '更新' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finance Modal */}
      {isFinanceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex items-center justify-between text-white bg-green-600">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Wallet size={20} />
                新增财务记录
              </h3>
              <button onClick={() => setIsFinanceModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">类型</label>
                <SearchableSelect
                  options={[
                    { value: 'income', label: '收入' },
                    { value: 'expense', label: '支出' },
                  ]}
                  value={financeForm.type}
                  onChange={(v) => {
                    const newType = v as 'income' | 'expense';
                    setFinanceForm({
                      ...financeForm,
                      type: newType,
                      category: newType === 'income' ? '项目收款' : '材料采购',
                    });
                  }}
                  placeholder="请选择类型..."
                  inputClassName="focus:ring-green-500 focus:border-green-500"
                  maxHeight="180px"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">类别</label>
                <SearchableSelect
                  options={
                    financeForm.type === 'income'
                      ? [{ value: '项目收款', label: '项目收款' }]
                      : financeCategories.map((c) => ({ value: c.code, label: c.label }))
                  }
                  value={financeForm.category}
                  onChange={(v) => setFinanceForm({ ...financeForm, category: String(v) })}
                  placeholder={financeForm.type === 'income' ? '项目收款' : '请选择类别...'}
                  inputClassName="focus:ring-green-500 focus:border-green-500"
                  maxHeight="200px"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">金额</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  value={financeForm.amount}
                  onChange={(e) => setFinanceForm({ ...financeForm, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">关联项目（可选）</label>
                <SearchableSelect
                  options={[
                    { value: '', label: '不关联项目' },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  value={financeForm.projectId ?? ''}
                  onChange={(v) =>
                    setFinanceForm({ ...financeForm, projectId: v === '' ? null : Number(v), paymentPlanItemId: null })
                  }
                  placeholder="请选择或检索项目..."
                  inputClassName="focus:ring-green-500 focus:border-green-500"
                  maxHeight="240px"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">关联部门（可选）</label>
                <SearchableSelect
                  options={[
                    { value: '', label: '不关联部门' },
                    ...departments.map((d) => ({ value: d.id, label: `${d.name}(${d.code})` })),
                  ]}
                  value={financeForm.departmentId ?? ''}
                  onChange={(v) => setFinanceForm({ ...financeForm, departmentId: v === '' ? null : Number(v) })}
                  placeholder="请选择或检索部门..."
                  inputClassName="focus:ring-green-500 focus:border-green-500"
                  maxHeight="240px"
                />
              </div>
              {financeForm.type === 'income' && financeForm.projectId != null && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    计入回款计划节点（可选）
                  </label>
                  <SearchableSelect
                    options={[
                      { value: '', label: '不计入节点' },
                      ...paymentPlanOptionsForFinance.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                    value={financeForm.paymentPlanItemId ?? ''}
                    onChange={(v) => setFinanceForm({ ...financeForm, paymentPlanItemId: v === '' ? null : Number(v) })}
                    placeholder="请选择回款节点..."
                    inputClassName="focus:ring-green-500 focus:border-green-500"
                    maxHeight="240px"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">供应商（可选）</label>
                <SearchableSelect
                  options={[
                    { value: '', label: '不关联供应商' },
                    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  value={financeForm.supplierId ?? ''}
                  onChange={(v) => setFinanceForm({ ...financeForm, supplierId: v === '' ? null : Number(v) })}
                  placeholder="请选择或检索供应商..."
                  inputClassName="focus:ring-green-500 focus:border-green-500"
                  maxHeight="240px"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">备注</label>
                <textarea
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  value={financeForm.desc}
                  onChange={(e) => setFinanceForm({ ...financeForm, desc: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsFinanceModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveFinance}
                  className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg hover:bg-green-700 transition-transform active:scale-95"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 侧边栏 */}
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200/70 transition-all duration-300 flex flex-col rounded-r-2xl overflow-hidden`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <HardHat size={20} />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">宏硕建设 ERP</span>}
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {getVisibleSidebarItems({
            currentUserId: currentUser.id,
            hasPermission: (permission) => hasPermission(currentUser, permission),
          }).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'permissions') {
                  setIsPermissionsModalOpen(true);
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                activeTab === item.id
                  ? item.special
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200/70 px-8 flex items-center justify-between shadow-sm z-10 rounded-b-2xl">
          <h2 className="text-lg font-bold capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div
              className={`px-3 py-1.5 rounded-full flex items-center gap-2 border ${
                isBackendConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
              ></div>
              <span className={`text-xs font-medium ${isBackendConnected ? 'text-green-700' : 'text-red-700'}`}>
                {isBackendConnected ? '后端连接正常' : '后端连接失败'}
              </span>
            </div>

            {/* 消息中心：待审批出库、财务待审批、低库存预警；红点与列表项均含上述三类数量 */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                title="消息通知"
              >
                <Bell size={18} className="text-slate-600" />
                {(stockLogs.filter((l) => l.status === 'pending' && l.type === 'out').length > 0 ||
                  financeRecords.filter((r) => r.status === 'pending').length > 0 ||
                  inventory.filter((i) => i.quantity < i.threshold).length > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stockLogs.filter((l) => l.status === 'pending' && l.type === 'out').length +
                      financeRecords.filter((r) => r.status === 'pending').length +
                      inventory.filter((i) => i.quantity < i.threshold).length}
                  </span>
                )}
              </button>
              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b bg-slate-50 font-medium text-slate-700 text-sm">消息中心</div>
                    <div className="p-2 space-y-1">
                      {stockLogs.filter((l) => l.status === 'pending' && l.type === 'out').length > 0 && (
                        <button
                          onClick={() => {
                            setActiveTab('inventory');
                            setIsNotificationOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm flex items-center gap-2"
                        >
                          <Clock size={14} className="text-orange-500" />
                          待审批出库 {stockLogs.filter((l) => l.status === 'pending' && l.type === 'out').length} 条
                        </button>
                      )}
                      {financeRecords.filter((r) => r.status === 'pending').length > 0 && (
                        <button
                          onClick={() => {
                            setActiveTab('finance');
                            setIsNotificationOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm flex items-center gap-2"
                        >
                          <Clock size={14} className="text-orange-500" />
                          财务待审批 {financeRecords.filter((r) => r.status === 'pending').length} 条
                        </button>
                      )}
                      {inventory.filter((i) => i.quantity < i.threshold).length > 0 && (
                        <button
                          onClick={() => {
                            setActiveTab('inventory');
                            setIsNotificationOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm flex items-center gap-2"
                        >
                          <AlertTriangle size={14} className="text-red-500" />
                          低库存预警 {inventory.filter((i) => i.quantity < i.threshold).length} 种
                        </button>
                      )}
                      {stockLogs.filter((l) => l.status === 'pending' && l.type === 'out').length === 0 &&
                        financeRecords.filter((r) => r.status === 'pending').length === 0 &&
                        inventory.filter((i) => i.quantity < i.threshold).length === 0 && (
                          <p className="px-3 py-2 text-slate-400 text-sm">暂无新消息</p>
                        )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 重置数据按钮（仅Admin可见，测试用） */}
            {currentUser.id === 'admin' && (
              <>
                <button
                  onClick={async () => {
                    try {
                      const state = (await apiService.getAppState()) as {
                        projects: unknown[];
                        inventory: unknown[];
                        financeRecords: unknown[];
                        stockLogs: unknown[];
                      };
                      exportAppStateAsBackup(state);
                      setToast({ message: '备份已下载', type: 'success' });
                    } catch (e) {
                      setToast({ message: '备份失败', type: 'error' });
                    }
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2"
                  title="导出当前数据为 JSON 备份"
                >
                  <Download size={14} /> 备份
                </button>
                <button
                  onClick={() => {
                    setImportMode('restore');
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2"
                  title="从 JSON 备份恢复"
                >
                  恢复
                </button>
                <button
                  onClick={handleResetData}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                  title="重置所有数据（测试用）"
                >
                  <Trash2 size={14} /> 重置数据
                </button>
              </>
            )}

            {/* 当前用户与退出 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {authUser.username}（{currentUser.label}）
              </span>
              <button
                type="button"
                onClick={() => {
                  clearStoredAuth();
                  setAuthUser(null);
                }}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                退出
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500">加载数据中...</p>
              </div>
            </div>
          )}
          {!isLoading && activeTab === 'dashboard' && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              }
            >
              <Dashboard
                projects={projects}
                inventory={inventory}
                stockLogs={stockLogs}
                financeRecords={financeRecords}
                systemLogs={systemLogs}
                upcomingPaymentPlans={upcomingPaymentPlans}
                overdueMilestones={overdueMilestones}
                operationDashboard={operationDashboard}
                budgetExecutionDashboard={budgetExecutionDashboard}
                onTabNavigate={(tab) => setActiveTab(tab)}
                onProjectClick={(id) => {
                  setSelectedProjectId(id);
                  setActiveTab('projects');
                }}
                onFinanceCardClick={(type) => setFinanceDetailModalType(type)}
              />
            </Suspense>
          )}

          {/* 如果当前页面没有权限，显示提示 */}
          {!isLoading &&
            activeTab !== 'dashboard' &&
            !hasPermission(currentUser, `${activeTab}.view`) &&
            activeTab !== 'permissions' && (
              <div className="p-20 text-center">
                <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-8 max-w-md mx-auto">
                  <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
                  <h3 className="text-lg font-bold text-slate-700 mb-2">无访问权限</h3>
                  <p className="text-slate-500 mb-4">您当前没有访问此页面的权限，请联系管理员。</p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    返回仪表盘
                  </button>
                </div>
              </div>
            )}

          {!isLoading && activeTab === 'inventory' && hasPermission(currentUser, 'inventory.view') && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                    <Package size={140} />
                  </div>
                  <p className="text-blue-100 text-sm">仓库物料总值</p>
                  <p className="text-3xl font-bold">
                    ￥{(inventory.reduce((a, b) => a + b.price * b.quantity, 0) / 10000).toFixed(1)}万
                  </p>
                </div>
                <div className="bg-white border border-slate-100/80 p-6 rounded-3xl flex justify-between items-center hover:border-red-200 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm">低库存预警</p>
                    <p className="text-3xl font-bold text-red-500">
                      {inventory.filter((i) => i.quantity < i.threshold).length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                    <AlertTriangle size={24} />
                  </div>
                </div>
                <div className="bg-white border border-slate-100/80 p-6 rounded-3xl flex justify-between items-center hover:border-blue-200 transition-colors">
                  <div>
                    <p className="text-slate-500 text-sm">今日操作记录</p>
                    <p className="text-3xl font-bold text-blue-600">{stockLogs.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <ArrowRightLeft size={24} />
                  </div>
                </div>
              </div>

              {/* 待审批列表 - 项目经理和管理员可见，放在库存明细之上 */}
              {hasPermission(currentUser, 'inventory.approve') &&
                stockLogs.filter((log) => log.status === 'pending' && log.type === 'out' && !log.isReversal).length >
                  0 && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
                      <Clock size={18} /> 待审批出库申请 (
                      {
                        stockLogs.filter((log) => log.status === 'pending' && log.type === 'out' && !log.isReversal)
                          .length
                      }
                      )
                    </h3>
                    <div className="space-y-3">
                      {stockLogs
                        .filter((log) => log.status === 'pending' && log.type === 'out' && !log.isReversal)
                        .map((log) => {
                          const item = inventory.find((i) => i.id === log.itemId);
                          const project = projects.find((p) => p.id === log.projectId);
                          return (
                            <div key={log.id} className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-700">
                                    物料出库 - {item?.name || '未知物料'}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {log.date} · 申请人: {log.creator} · 关联项目: {project?.name || '未指定'}
                                  </p>
                                  <p className="text-sm font-bold text-blue-600 mt-2">
                                    数量: {log.qty} {item?.unit || ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveStock(Number(log.id), true)}
                                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Check size={16} /> 批准
                                </button>
                                <button
                                  onClick={async () => {
                                    const note = prompt('请输入拒绝原因（可选）:');
                                    await handleApproveStock(Number(log.id), false, note || '');
                                  }}
                                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <X size={16} /> 拒绝
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* 待审批冲销单 - 管理员可见 */}
              {(currentUser.id === 'admin' || authUser?.role === 'admin') &&
                stockLogs.filter((log) => log.status === 'pending' && log.isReversal).length > 0 && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-amber-700 mb-4 flex items-center gap-2">
                      <Clock size={18} /> 待审批库存冲销单 (
                      {stockLogs.filter((log) => log.status === 'pending' && log.isReversal).length})
                    </h3>
                    <div className="space-y-3">
                      {stockLogs
                        .filter((log) => log.status === 'pending' && log.isReversal)
                        .map((log) => {
                          const item = inventory.find((i) => i.id === log.itemId);
                          const project = projects.find((p) => p.id === log.projectId);
                          return (
                            <div key={log.id} className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-700">
                                    冲销{log.type === 'in' ? '入库' : '出库'} - {item?.name || '未知物料'}
                                    <span className="ml-2 text-xs text-amber-600">原单#{log.reversalOfId}</span>
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {log.date} · 申请人: {log.creator} · 关联项目: {project?.name || '未指定'}
                                  </p>
                                  <p className="text-sm font-bold text-amber-600 mt-2">
                                    冲销数量: {Math.abs(log.qty)} {item?.unit || ''}
                                    {log.type === 'out' ? '（将回增库存）' : '（将回减库存）'}
                                  </p>
                                  {log.note && <p className="text-xs text-slate-500 mt-1">说明: {log.note}</p>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveStockReversal(Number(log.id), true)}
                                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Check size={16} /> 批准冲销
                                </button>
                                <button
                                  onClick={() => handleApproveStockReversal(Number(log.id), false)}
                                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <X size={16} /> 拒绝
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

              <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold flex items-center gap-2 text-slate-700">
                    <Package size={18} /> 实时库存明细
                  </h3>
                  <div className="flex gap-3">
                    {hasPermission(currentUser, 'inventory.create') && (
                      <button
                        onClick={() => {
                          setStockModalType('in');
                          setIsStockModalOpen(true);
                        }}
                        className="px-4 py-2 border border-green-200 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-100 transition-colors shadow-sm"
                      >
                        <Plus size={16} /> 入库登记
                      </button>
                    )}
                    {(hasPermission(currentUser, 'inventory.outbound.direct') ||
                      hasPermission(currentUser, 'inventory.outbound.request')) && (
                      <button
                        onClick={() => {
                          setStockModalType('out');
                          setIsStockModalOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                      >
                        <ArrowRightLeft size={16} /> 出库申请
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">物料名称</th>
                        <th className="px-6 py-4 font-bold">规格参数</th>
                        <th className="px-6 py-4 font-bold">参考单价</th>
                        <th className="px-6 py-4 font-bold">库存余额</th>
                        <th className="px-6 py-4 font-bold">预警阈值</th>
                        <th className="px-6 py-4 font-bold">当前状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {inventory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                            暂无物料
                          </td>
                        </tr>
                      ) : (
                        inventory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-700">{item.name}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{item.spec}</td>
                            <td className="px-6 py-4 text-slate-600 font-mono">￥{item.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`font-bold ${item.quantity < item.threshold ? 'text-red-500' : 'text-slate-800'}`}
                              >
                                {item.quantity.toLocaleString()} {item.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {item.threshold.toLocaleString()} {item.unit}
                            </td>
                            <td className="px-6 py-4">
                              {item.quantity < item.threshold ? (
                                <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-red-100">
                                  <AlertTriangle size={12} /> 低于安全位
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-green-100">
                                  <Check size={12} /> 供应充足
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 简易操作日志 */}
              {stockLogs.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100/80 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <History size={18} /> 最近出入库流水
                  </h3>
                  <div className="space-y-3">
                    {[...stockLogs]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((log) => {
                        const item = inventory.find((i) => i.id === log.itemId);
                        const isReversalLog = Boolean(log.isReversal);
                        const statusBadge =
                          log.status === 'pending' && isReversalLog ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold">
                              冲销待审批
                            </span>
                          ) : log.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-xs font-bold">
                              待审批
                            </span>
                          ) : log.status === 'rejected' && isReversalLog ? (
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold">
                              冲销已拒绝
                            </span>
                          ) : log.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold">
                              已拒绝
                            </span>
                          ) : isReversalLog && log.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold">
                              已冲销
                            </span>
                          ) : null;

                        const canReversal =
                          log.status === 'active' &&
                          !isReversalLog &&
                          (currentUser.id === 'admin' ||
                            authUser?.role === 'admin' ||
                            authUser?.role === 'clerk' ||
                            currentUser.name?.includes('管理员') ||
                            currentUser.name?.includes('库管'));
                        const canApproveReversal =
                          isReversalLog &&
                          log.status === 'pending' &&
                          (currentUser.id === 'admin' ||
                            authUser?.role === 'admin' ||
                            currentUser.name?.includes('管理员'));

                        return (
                          <div
                            key={log.id}
                            className={`flex items-center justify-between py-3 border-b border-dashed last:border-0 ${isReversalLog ? 'bg-amber-50/50' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${isReversalLog ? 'bg-amber-50 text-amber-600' : log.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}
                              >
                                {log.type === 'in' ? <Plus size={14} /> : <ArrowRightLeft size={14} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold">
                                    {isReversalLog ? '冲销' : ''}
                                    {log.type === 'in' ? '物料入库' : '物料出库'} - {item?.name || '未知物料'}
                                  </p>
                                  {statusBadge}
                                </div>
                                <p className="text-xs text-slate-400">
                                  {log.date} · 操作员: {log.creator}
                                  {log.approver && ` · 审批人: ${log.approver}`}
                                  {log.reversalOfId && ` · 原单#${log.reversalOfId}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p
                                  className={`font-bold ${isReversalLog ? 'text-amber-600' : log.type === 'in' ? 'text-green-600' : 'text-blue-600'}`}
                                >
                                  {log.qty > 0 ? (log.type === 'in' ? '+' : '-') : ''}
                                  {log.qty} {item?.unit || ''}
                                </p>
                              </div>
                              {canReversal && (
                                <button
                                  onClick={() => handleReversalStock(Number(log.id))}
                                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 whitespace-nowrap"
                                >
                                  冲销
                                </button>
                              )}
                              {canApproveReversal && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleApproveStockReversal(Number(log.id), true)}
                                    className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                                  >
                                    通过
                                  </button>
                                  <button
                                    onClick={() => handleApproveStockReversal(Number(log.id), false)}
                                    className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                                  >
                                    拒绝
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoading && activeTab === 'ai' && hasPermission(currentUser, 'ai.view') && (
            <div className="w-full flex flex-col max-w-5xl mx-auto space-y-6 pb-4">
              <div className="bg-gradient-to-br from-indigo-700 to-blue-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div className="relative z-10 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                      <BrainCircuit size={28} />
                    </div>
                    <h2 className="text-2xl font-bold">宏硕 AI 决策官</h2>
                  </div>
                  <p className="text-indigo-100 max-w-lg mb-6">
                    已同步仓库实时数据。您可以询问："目前哪些物料需要立刻补货？"或"分析上月的物料损耗情况"。
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['库存预警分析', '成本异常检测', '补货策略建议', '出库频率分析'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setAiPrompt(s)}
                        className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-xs backdrop-blur-sm transition-all text-center border border-white/10"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 flex-1 min-h-0 bg-white/60 rounded-3xl border border-slate-100/80 backdrop-blur-sm p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_4px_24px_-4px_rgba(15,23,42,0.08),0_16px_48px_-12px_rgba(15,23,42,0.06)]">
                {/* 历史对话 */}
                <div className="w-52 flex-shrink-0 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between rounded-t-3xl">
                    <span className="font-semibold text-slate-700 text-sm">历史对话</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (aiMessages.length > 0) {
                          const id = currentSessionId ?? `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                          const title = sessionTitleFromMessages(aiMessages);
                          const createdAt = currentSessionId
                            ? (aiHistorySessions.find((s) => s.id === currentSessionId)?.createdAt ?? Date.now())
                            : Date.now();
                          const session: AiSession = { id, title, messages: [...aiMessages], createdAt };
                          setAiHistorySessions((prev) => appendOrUpdateSession(authUser?.id, prev, session));
                        }
                        setAiMessages([]);
                        setCurrentSessionId(null);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      新建对话
                    </button>
                  </div>
                  <ul className="flex-1 overflow-y-auto p-2 space-y-1.5 rounded-b-3xl">
                    {aiHistorySessions.map((s) => (
                      <li
                        key={s.id}
                        className={`group flex items-center gap-1 rounded-2xl transition-colors ${currentSessionId === s.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50/50 border border-transparent'}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setAiMessages(s.messages);
                            setCurrentSessionId(s.id);
                          }}
                          className="flex-1 min-w-0 text-left px-3 py-2.5 rounded-2xl text-sm truncate transition-colors border-0 bg-transparent text-inherit focus:outline-none focus:ring-0"
                          title={s.title}
                        >
                          <span
                            className={`block truncate ${currentSessionId === s.id ? 'text-indigo-700' : 'text-slate-700'}`}
                          >
                            {s.title}
                          </span>
                          <span className="block text-xs text-slate-400 mt-0.5">{formatSessionTime(s.createdAt)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAiHistorySessions((prev) => removeSession(authUser?.id, prev, s.id));
                            if (currentSessionId === s.id) {
                              setAiMessages([]);
                              setCurrentSessionId(null);
                            }
                          }}
                          className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${currentSessionId === s.id ? 'text-indigo-500 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                          title="删除该对话"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex-1 bg-white rounded-3xl border border-slate-100/80 shadow-sm flex flex-col overflow-hidden min-h-[400px] max-h-[calc(100vh-320px)]">
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {aiMessages.length === 0 && !isAiThinking && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                        <Sparkles size={48} className="mb-4 opacity-20" />
                        <p>在下方输入您的问题，让 AI 深度分析数据库...</p>
                      </div>
                    )}
                    {aiMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="bg-indigo-600 p-2 rounded-lg text-white flex-shrink-0">
                            <BrainCircuit size={20} />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] p-4 rounded-2xl text-sm border ${msg.role === 'user' ? 'bg-indigo-50 border-indigo-100 rounded-tr-none text-slate-800' : 'bg-slate-50 border-slate-100 rounded-tl-none text-slate-800 leading-relaxed'}`}
                        >
                          {msg.role === 'user' ? (
                            <span>{msg.content}</span>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 text-xs font-medium">
                            {authUser?.username?.slice(0, 1) ?? '我'}
                          </div>
                        )}
                      </div>
                    ))}
                    {isAiThinking &&
                      (aiMessages.length === 0 || aiMessages[aiMessages.length - 1]?.role !== 'assistant') && (
                        <div className="flex items-start gap-3">
                          <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 animate-pulse">
                            <BrainCircuit size={20} />
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-slate-600 text-sm border border-slate-100/80 flex items-center gap-2">
                            <span className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </span>
                            深度数据对齐中...
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100/80 flex gap-3 rounded-b-3xl">
                    <input
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiAnalysis()}
                      className="flex-1 bg-white border border-slate-200/80 rounded-2xl px-6 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 shadow-sm"
                      placeholder="咨询 AI 决策建议..."
                    />
                    <button
                      onClick={handleAiAnalysis}
                      disabled={isAiThinking || !aiPrompt.trim()}
                      className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 财务收支页面 */}
          {/* 物料管理页面 */}
          {!isLoading &&
            activeTab === 'inventory-management' &&
            hasPermission(currentUser, 'inventory-management.view') && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
                  <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
                    <h3 className="font-bold flex items-center gap-2 text-slate-700">
                      <Package size={18} /> 物料管理
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportInventoryToExcel(inventory)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                      >
                        <Download size={16} /> 导出 Excel
                      </button>
                      {(hasPermission(currentUser, 'inventory.edit') ||
                        hasPermission(currentUser, 'inventory.create')) && (
                        <>
                          <button
                            onClick={downloadInventoryImportTemplate}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                          >
                            下载模板
                          </button>
                          <button
                            onClick={() => {
                              setImportMode('inventory');
                              setTimeout(() => fileInputRef.current?.click(), 0);
                            }}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                          >
                            导入 Excel
                          </button>
                          <button
                            onClick={() => {
                              setEditingInventoryItem(null);
                              setInventoryForm({ name: '', spec: '', unit: '', price: 0, quantity: 0, threshold: 0 });
                              setIsInventoryModalOpen(true);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg"
                          >
                            <Plus size={16} /> 新建物料
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-bold">物料名称</th>
                          <th className="px-6 py-4 font-bold">规格参数</th>
                          <th className="px-6 py-4 font-bold">单位</th>
                          <th className="px-6 py-4 font-bold">参考单价</th>
                          <th className="px-6 py-4 font-bold">库存余额</th>
                          <th className="px-6 py-4 font-bold">预警阈值</th>
                          <th className="px-6 py-4 font-bold">当前状态</th>
                          {(hasPermission(currentUser, 'inventory.edit') ||
                            hasPermission(currentUser, 'inventory.delete')) && (
                            <th className="px-6 py-4 font-bold">操作</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm">
                        {inventory.length === 0 ? (
                          <tr>
                            <td
                              colSpan={
                                hasPermission(currentUser, 'inventory.edit') ||
                                hasPermission(currentUser, 'inventory.delete')
                                  ? 8
                                  : 7
                              }
                              className="px-6 py-12 text-center text-slate-400"
                            >
                              暂无物料，点击"新建物料"添加
                            </td>
                          </tr>
                        ) : (
                          inventory.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-700">{item.name}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-500">{item.spec}</td>
                              <td className="px-6 py-4 text-slate-600">{item.unit}</td>
                              <td className="px-6 py-4 text-slate-600 font-mono">￥{item.price.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`font-bold ${item.quantity < item.threshold ? 'text-red-500' : 'text-slate-800'}`}
                                >
                                  {item.quantity.toLocaleString()} {item.unit}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">
                                {item.threshold.toLocaleString()} {item.unit}
                              </td>
                              <td className="px-6 py-4">
                                {item.quantity < item.threshold ? (
                                  <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-red-100">
                                    <AlertTriangle size={12} /> 低于安全位
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-green-100">
                                    <Check size={12} /> 供应充足
                                  </span>
                                )}
                              </td>
                              {(hasPermission(currentUser, 'inventory.edit') ||
                                hasPermission(currentUser, 'inventory.delete')) && (
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    {hasPermission(currentUser, 'inventory.edit') && (
                                      <button
                                        onClick={() => {
                                          setEditingInventoryItem(item);
                                          setInventoryForm({
                                            name: item.name,
                                            spec: item.spec,
                                            unit: item.unit,
                                            price: item.price,
                                            quantity: item.quantity,
                                            threshold: item.threshold,
                                          });
                                          setIsInventoryModalOpen(true);
                                        }}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                                      >
                                        编辑
                                      </button>
                                    )}
                                    {hasPermission(currentUser, 'inventory.delete') && (
                                      <button
                                        onClick={async () => {
                                          if (confirm(`确定要删除物料 "${item.name}" 吗？此操作不可恢复！`)) {
                                            try {
                                              await apiService.deleteInventoryItem(item.id);
                                              setToast({ message: '物料已删除', type: 'success' });
                                              const inventoryData = (await apiService
                                                .getInventory()
                                                .catch(() => [])) as InventoryItem[];
                                              setInventory(Array.isArray(inventoryData) ? inventoryData : []);
                                            } catch (error: any) {
                                              setToast({ message: error.message || '删除失败', type: 'error' });
                                            }
                                          }
                                        }}
                                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                                      >
                                        删除
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          {!isLoading && activeTab === 'finance' && hasPermission(currentUser, 'finance.view') && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold flex items-center gap-2 text-slate-700">
                    <Wallet size={18} /> 财务收支记录
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportFinanceToExcel(financeRecords)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <Download size={16} /> 导出 Excel
                    </button>
                    {hasPermission(currentUser, 'finance.create') && (
                      <>
                        <button
                          onClick={downloadFinanceImportTemplate}
                          className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                          下载模板
                        </button>
                        <button
                          onClick={() => {
                            setImportMode('finance');
                            setTimeout(() => fileInputRef.current?.click(), 0);
                          }}
                          className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                          导入 Excel
                        </button>
                        <button
                          onClick={openFinanceModal}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg"
                        >
                          <Plus size={16} /> 新增财务记录
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">日期</th>
                        <th className="px-6 py-4 font-bold">类型</th>
                        <th className="px-6 py-4 font-bold">类别</th>
                        <th className="px-6 py-4 font-bold">金额</th>
                        <th className="px-6 py-4 font-bold">关联项目</th>
                        <th className="px-6 py-4 font-bold">状态</th>
                        <th className="px-6 py-4 font-bold">操作人</th>
                        {hasPermission(currentUser, 'finance.approve.normal') && (
                          <th className="px-6 py-4 font-bold">操作</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {financeRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={currentUser.id === 'admin' ? 8 : 7}
                            className="px-6 py-12 text-center text-slate-400"
                          >
                            暂无财务记录
                          </td>
                        </tr>
                      ) : (
                        financeRecords.map((record) => {
                          const project = projects.find((p) => p.id === record.projectId);
                          return (
                            <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 text-slate-600">{record.date}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    record.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {record.type === 'income' ? '收入' : '支出'}
                                  {record.isReversal && <span className="ml-1 text-amber-600">冲销</span>}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-700">{record.category}</td>
                              <td
                                className={`px-6 py-4 font-bold ${
                                  record.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {record.type === 'income' ? '+' : '-'}￥{record.amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-slate-500">{project?.name || '未关联'}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    record.status === 'approved'
                                      ? 'bg-green-100 text-green-700'
                                      : record.status === 'pending'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {record.status === 'approved'
                                    ? '已批准'
                                    : record.status === 'pending'
                                      ? '待审批'
                                      : '已拒绝'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-500">{record.creator}</td>
                              {hasPermission(currentUser, 'finance.approve.normal') && (
                                <td className="px-6 py-4">
                                  {record.status === 'pending' ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleApproveFinance(Number(record.id), true)}
                                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                                      >
                                        批准
                                      </button>
                                      <button
                                        onClick={() => {
                                          setPendingRejectLogId(Number(record.id));
                                          setRejectNote('');
                                          setIsRejectNoteModalOpen(true);
                                          (window as any).__pendingRejectIsFinance = true;
                                        }}
                                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                                      >
                                        拒绝
                                      </button>
                                    </div>
                                  ) : record.status === 'approved' &&
                                    !record.isReversal &&
                                    (currentUser.id === 'admin' ||
                                      authUser?.role === 'finance' ||
                                      currentUser.name?.includes('财务')) ? (
                                    <button
                                      onClick={() => handleReversalFinance(Number(record.id))}
                                      className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
                                    >
                                      冲销
                                    </button>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'suppliers' && hasPermission(currentUser, 'finance.view') && (
            <div className="p-6 overflow-auto">
              <SupplierManagement />
            </div>
          )}

          {!isLoading && activeTab === 'reimbursements' && hasPermission(currentUser, 'reimbursements.view') && (
            <div className="p-6 overflow-auto">
              <ReimbursementManagement
                projects={projects}
                departments={departments}
                approverName={currentUser.name}
                currentUserName={currentUser.name}
              />
            </div>
          )}

          {!isLoading && activeTab === 'loans' && hasPermission(currentUser, 'loans.view') && (
            <div className="p-6 overflow-auto">
              <LoanManagement
                projects={projects}
                departments={departments}
                approverName={currentUser.name}
                currentUserName={currentUser.name}
              />
            </div>
          )}

          {!isLoading && activeTab === 'departments' && hasPermission(currentUser, 'departments.view') && (
            <div className="p-6 overflow-auto">
              <DepartmentManagement />
            </div>
          )}

          {!isLoading && activeTab === 'approval-center' && hasPermission(currentUser, 'approval-center.view') && (
            <div className="p-6 overflow-auto">
              <ApprovalCenter
                onNavigateTab={(tab) => setActiveTab(tab)}
                projects={projects}
                inventory={inventory}
                overdueMilestones={overdueMilestones}
              />
            </div>
          )}

          {!isLoading && activeTab === 'integration' && hasPermission(currentUser, 'integration.view') && (
            <div className="p-6 overflow-auto">
              <IntegrationCenter />
            </div>
          )}

          {!isLoading && activeTab === 'contracts' && hasPermission(currentUser, 'contracts.view') && (
            <div className="p-6 overflow-auto">
              <ContractManagement
                projects={projects}
                onProjectRefresh={() =>
                  apiService.getProjects().then((data: unknown) => setProjects(Array.isArray(data) ? data : []))
                }
              />
            </div>
          )}

          {!isLoading && activeTab === 'change-orders' && hasPermission(currentUser, 'projects.view') && (
            <div className="p-6 overflow-auto">
              <ChangeOrderManagement
                projects={projects}
                approverName={currentUser.name}
                onProjectRefresh={() =>
                  apiService.getProjects().then((data: unknown) => setProjects(Array.isArray(data) ? data : []))
                }
              />
            </div>
          )}

          {/* 报表页面 */}
          {!isLoading && activeTab === 'reports' && hasPermission(currentUser, 'reports.view') && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-4 flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-slate-600">日期范围</span>
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={reportDateFrom}
                  onChange={(e) => setReportDateFrom(e.target.value)}
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={reportDateTo}
                  onChange={(e) => setReportDateTo(e.target.value)}
                />
                <span className="text-sm font-medium text-slate-600 ml-2">项目</span>
                <SearchableSelect
                  options={[
                    { value: '', label: '全部项目' },
                    ...projects.map((p) => ({ value: String(p.id), label: p.name })),
                  ]}
                  value={reportProjectId === '' ? '' : String(reportProjectId)}
                  onChange={(v) => setReportProjectId(v === '' ? '' : Number(v))}
                  placeholder="全部项目"
                  className="min-w-[160px]"
                  inputClassName="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  maxHeight="220px"
                />
              </div>
              <div className="flex gap-2 border-b border-slate-200 pb-2">
                {(['finance', 'inventory', 'project'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setReportSubTab(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${reportSubTab === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {key === 'finance' ? '财务报表' : key === 'inventory' ? '库存报表' : '项目报表'}
                  </button>
                ))}
              </div>
              {reportSubTab === 'finance' && (
                <FinanceReport
                  financeRecords={financeRecords}
                  dateFrom={reportDateFrom || undefined}
                  dateTo={reportDateTo || undefined}
                  projectId={reportProjectId === '' ? undefined : reportProjectId}
                />
              )}
              {reportSubTab === 'inventory' && (
                <InventoryReport
                  inventory={inventory}
                  stockLogs={stockLogs}
                  projects={projects}
                  dateFrom={reportDateFrom || undefined}
                  dateTo={reportDateTo || undefined}
                  projectId={reportProjectId === '' ? undefined : reportProjectId}
                />
              )}
              {reportSubTab === 'project' && (
                <ProjectReport
                  projects={projects}
                  dateFrom={reportDateFrom || undefined}
                  dateTo={reportDateTo || undefined}
                  projectId={reportProjectId === '' ? undefined : reportProjectId}
                />
              )}
            </div>
          )}

          {/* 操作日志页面 */}
          {!isLoading && activeTab === 'history' && hasPermission(currentUser, 'history.view') && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b flex flex-wrap items-center gap-4">
                  <h3 className="font-bold flex items-center gap-2 text-slate-700">
                    <History size={18} /> 系统操作日志
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <span className="text-sm text-slate-500">操作人</span>
                    <SearchableSelect
                      options={[
                        { value: '', label: '全部' },
                        ...Array.from(new Set(systemLogs.map((l) => l.user)))
                          .sort()
                          .map((u) => ({ value: u, label: u })),
                      ]}
                      value={logFilterUser}
                      onChange={(v) => setLogFilterUser(String(v))}
                      placeholder="全部"
                      className="min-w-[120px]"
                      inputClassName="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                      maxHeight="220px"
                    />
                    <span className="text-sm text-slate-500 ml-2">操作类型</span>
                    <SearchableSelect
                      options={[
                        { value: '', label: '全部' },
                        ...Array.from(new Set(systemLogs.map((l) => l.action)))
                          .sort()
                          .map((a) => ({ value: a, label: a })),
                      ]}
                      value={logFilterAction}
                      onChange={(v) => setLogFilterAction(String(v))}
                      placeholder="全部"
                      className="min-w-[120px]"
                      inputClassName="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                      maxHeight="220px"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">时间</th>
                        <th className="px-6 py-4 font-bold">操作人</th>
                        <th className="px-6 py-4 font-bold">操作类型</th>
                        <th className="px-6 py-4 font-bold">详细信息</th>
                        {hasPermission(currentUser, 'log.delete') && <th className="px-6 py-4 font-bold w-20">操作</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {(() => {
                        const displayedLogs = historyFilteredLogs !== null ? historyFilteredLogs : systemLogs;
                        const filtered = displayedLogs.sort(
                          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
                        );
                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan={hasPermission(currentUser, 'log.delete') ? 5 : 4}
                                className="px-6 py-12 text-center text-slate-400"
                              >
                                暂无操作日志
                              </td>
                            </tr>
                          );
                        }
                        return filtered.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 text-slate-600">{new Date(log.time).toLocaleString('zh-CN')}</td>
                            <td className="px-6 py-4 text-slate-700 font-medium">{log.user}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{log.detail}</td>
                            {hasPermission(currentUser, 'log.delete') && (
                              <td className="px-6 py-4">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!confirm('确定删除该条日志？')) return;
                                    try {
                                      await apiService.deleteLog(Number(log.id));
                                      const logs = (await apiService.getSystemLogs().catch(() => [])) as SystemLog[];
                                      setSystemLogs(Array.isArray(logs) ? logs : []);
                                      if (logFilterUser || logFilterAction) {
                                        if (logFilterUser && logFilterAction) {
                                          const byUser = (await apiService.getSystemLogsByUser(
                                            logFilterUser
                                          )) as SystemLog[];
                                          setHistoryFilteredLogs(
                                            Array.isArray(byUser)
                                              ? byUser.filter((l) => l.action === logFilterAction)
                                              : []
                                          );
                                        } else if (logFilterUser) {
                                          const list = (await apiService.getSystemLogsByUser(
                                            logFilterUser
                                          )) as SystemLog[];
                                          setHistoryFilteredLogs(Array.isArray(list) ? list : []);
                                        } else {
                                          const list = (await apiService.getSystemLogsByAction(
                                            logFilterAction
                                          )) as SystemLog[];
                                          setHistoryFilteredLogs(Array.isArray(list) ? list : []);
                                        }
                                      } else {
                                        setHistoryFilteredLogs(null);
                                      }
                                    } catch (e) {
                                      setToast({ message: (e as Error).message || '删除失败', type: 'error' });
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="删除"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 用户管理页面（仅管理员） */}
          {!isLoading && activeTab === 'users' && currentUser.id === 'admin' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold flex items-center gap-2 text-slate-700">
                    <User size={18} /> 用户管理
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="搜索用户名或角色..."
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => openUserModal()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
                    >
                      <Plus size={16} /> 新建用户
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">用户名</th>
                        <th className="px-6 py-4 font-bold">角色</th>
                        <th className="px-6 py-4 font-bold">状态</th>
                        <th className="px-6 py-4 font-bold w-32">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {(() => {
                        const keyword = userSearch.trim().toLowerCase();
                        const filtered = !keyword
                          ? users
                          : users.filter((u) => {
                              const roleInfo = roleLabelMap[u.role] || ROLES[u.role];
                              const roleLabel = roleInfo?.label ?? u.role;
                              return (
                                u.username.toLowerCase().includes(keyword) || roleLabel.toLowerCase().includes(keyword)
                              );
                            });
                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                暂无用户
                              </td>
                            </tr>
                          );
                        }
                        return filtered.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-700">{u.username}</td>
                            <td className="px-6 py-4 text-slate-600">{ROLES[u.role]?.label ?? u.role}</td>
                            <td className="px-6 py-4">
                              <span className={u.enabled ? 'text-green-600' : 'text-slate-400'}>
                                {u.enabled ? '启用' : '禁用'}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openUserModal(u)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="编辑"
                              >
                                <Settings size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="删除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 角色管理页面（仅管理员） */}
          {!isLoading && activeTab === 'roles' && currentUser.id === 'admin' && (
            <div className="space-y-6">
              <RoleManagement
                roles={roleDefs}
                onReload={async () => {
                  const list = (await apiService.getRoles().catch(() => [])) as RoleDefinition[];
                  if (Array.isArray(list)) {
                    setRoleDefs(list);
                  }
                }}
              />
            </div>
          )}

          {/* 项目管理页面 */}
          {!isLoading && activeTab === 'projects' && hasPermission(currentUser, 'projects.view') && (
            <div className="space-y-6">
              {selectedProjectDetail ? (
                <ProjectDetail
                  project={selectedProjectDetail}
                  financeRecords={financeRecords}
                  stockLogs={stockLogs}
                  inventory={inventory}
                  onClose={() => {
                    setSelectedProjectId(null);
                    setSelectedProjectDetail(null);
                  }}
                  onEdit={
                    hasPermission(currentUser, 'project.edit')
                      ? (p) => {
                          setSelectedProjectId(null);
                          setSelectedProjectDetail(null);
                          openProjectModal(p);
                        }
                      : undefined
                  }
                  onDelete={
                    hasPermission(currentUser, 'project.delete')
                      ? (id) => {
                          handleDeleteProject(id);
                          setSelectedProjectId(null);
                          setSelectedProjectDetail(null);
                        }
                      : undefined
                  }
                  onMilestoneUpdate={
                    selectedProjectId
                      ? async () => {
                          const ms = await apiService.getMilestones(selectedProjectId).catch(() => []);
                          setSelectedProjectDetail((prev) =>
                            prev ? { ...prev, milestones: ms as Project['milestones'] } : null
                          );
                        }
                      : undefined
                  }
                  canEditMilestones={hasPermission(currentUser, 'project.edit')}
                />
              ) : (
                <div className="space-y-4">
                  {/* 工具栏：视图切换 + 操作按钮 */}
                  <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-4 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold flex items-center gap-2 text-slate-700">
                        <Building2 size={18} /> 项目管理
                      </h3>
                      <div className="flex bg-slate-100 rounded-xl p-0.5">
                        <button
                          onClick={() => setProjectViewMode('table')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                            projectViewMode === 'table'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <List size={14} /> 列表
                        </button>
                        <button
                          onClick={() => setProjectViewMode('kanban')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                            projectViewMode === 'kanban'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <LayoutGrid size={14} /> 看板
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportProjectsToExcel(projects)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                      >
                        <Download size={16} /> 导出 Excel
                      </button>
                      {hasPermission(currentUser, 'project.create') && (
                        <button
                          onClick={downloadProjectImportTemplate}
                          className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                          下载模板
                        </button>
                      )}
                      {hasPermission(currentUser, 'project.create') && (
                        <button
                          onClick={() => {
                            setImportMode('project');
                            setTimeout(() => fileInputRef.current?.click(), 0);
                          }}
                          className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                          导入 Excel
                        </button>
                      )}
                      {hasPermission(currentUser, 'project.create') && (
                        <button
                          onClick={() => openProjectModal()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
                        >
                          <Plus size={16} /> 新建项目
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 看板视图 */}
                  {projectViewMode === 'kanban' && (
                    <ProjectKanban projects={projects} onSelect={(id) => setSelectedProjectId(id)} />
                  )}

                  {/* 列表视图 */}
                  {projectViewMode === 'table' && (
                    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4 font-bold">项目名称</th>
                              <th className="px-6 py-4 font-bold">项目编号</th>
                              <th className="px-6 py-4 font-bold">合同金额</th>
                              <th className="px-6 py-4 font-bold">已收款</th>
                              <th className="px-6 py-4 font-bold">进度</th>
                              <th className="px-6 py-4 font-bold">状态</th>
                              <th className="px-6 py-4 font-bold">开始日期</th>
                              <th className="px-6 py-4 font-bold">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-sm">
                            {projects.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                  暂无项目
                                </td>
                              </tr>
                            ) : (
                              projects.map((project) => (
                                <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-6 py-4">
                                    <span className="font-bold text-slate-700">{project.name}</span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{project.code}</td>
                                  <td className="px-6 py-4 text-slate-600 font-mono">
                                    ￥{project.contractAmount.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-green-600 font-mono">
                                    ￥{project.receivedAmount.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div
                                          className="bg-blue-600 h-full transition-all"
                                          style={{ width: `${project.progress}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs font-bold text-slate-600 w-12">{project.progress}%</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[project.status] || 'bg-slate-100 text-slate-700'}`}
                                    >
                                      {project.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500">{project.startDate}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setSelectedProjectId(project.id)}
                                        className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1"
                                      >
                                        <Eye size={14} /> 查看
                                      </button>
                                      {hasPermission(currentUser, 'project.edit') && (
                                        <button
                                          onClick={() => openProjectModal(project)}
                                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                                        >
                                          编辑
                                        </button>
                                      )}
                                      {hasPermission(currentUser, 'project.delete') && (
                                        <button
                                          onClick={() => handleDeleteProject(project.id)}
                                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                                        >
                                          删除
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 权限管理模态框 */}
      {isPermissionsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="p-6 flex items-center justify-between text-white bg-purple-600">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings size={20} />
                权限管理
              </h3>
              <button onClick={() => setIsPermissionsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm text-slate-600 mb-4">配置各角色的权限。勾选表示该角色拥有该权限。</p>

                {/* 页面级别权限 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 border-b pb-2">页面访问权限</h3>
                  {Object.keys(permissionsConfig)
                    .filter((permission) => permission.endsWith('.view'))
                    .map((permission) => {
                      const permissionLabels: Record<string, string> = {
                        'projects.view': '项目管理页面',
                        'inventory.view': '物料仓库页面',
                        'inventory-management.view': '物料管理页面',
                        'contracts.view': '合同管理页面',
                        'reimbursements.view': '报销管理页面',
                        'loans.view': '借还款管理页面',
                        'departments.view': '部门管理页面',
                        'approval-center.view': '审批中心页面',
                        'integration.view': '集成中心页面',
                        'finance.view': '财务收支页面',
                        'history.view': '操作日志页面',
                        'ai.view': 'AI 决策室页面',
                      };

                      return (
                        <div key={permission} className="border border-slate-200 rounded-xl p-4">
                          <h4 className="font-bold text-slate-700 mb-3">
                            {permissionLabels[permission] || permission}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.keys(roleLabelMap).map((roleId) => {
                              const role = roleLabelMap[roleId];
                              return (
                                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={(permissions[permission] || []).includes(role.id)}
                                    onChange={(e) => handlePermissionChange(permission, role.id, e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                  />
                                  <span className="text-sm text-slate-700">{role.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* 按钮级别权限 */}
                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-bold text-slate-700 border-b pb-2">功能操作权限</h3>
                  {Object.keys(permissionsConfig)
                    .filter((permission) => !permission.endsWith('.view'))
                    .map((permission) => {
                      const permissionLabels: Record<string, string> = {
                        'inventory.create': '创建物料',
                        'inventory.outbound.direct': '直接出库',
                        'inventory.outbound.request': '申请出库',
                        'inventory.approve': '审批出库',
                        'inventory.delete': '删除物料',
                        'inventory.edit': '编辑物料',
                        'project.create': '创建项目',
                        'project.edit': '编辑项目',
                        'project.delete': '删除项目',
                        'finance.create': '创建财务记录',
                        'finance.approve.large': '审批大额财务',
                        'finance.approve.normal': '审批普通财务',
                        'finance.delete': '删除财务记录',
                        'log.export': '导出日志',
                        'log.delete': '删除日志',
                      };

                      return (
                        <div key={permission} className="border border-slate-200 rounded-xl p-4">
                          <h4 className="font-bold text-slate-700 mb-3">
                            {permissionLabels[permission] || permission}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.keys(roleLabelMap).map((roleId) => {
                              const role = roleLabelMap[roleId];
                              return (
                                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={(permissions[permission] || []).includes(role.id)}
                                    onChange={(e) => handlePermissionChange(permission, role.id, e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                  />
                                  <span className="text-sm text-slate-700">{role.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* 系统配置 */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-700 mb-4">系统配置</h3>
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-xl p-4">
                      <label className="block text-sm font-bold text-slate-700 mb-2">低库存标准阈值</label>
                      <input
                        type="number"
                        value={configForm.lowStockThreshold}
                        onChange={(e) => setConfigForm({ ...configForm, lowStockThreshold: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="默认: 100"
                      />
                      <p className="text-xs text-slate-500 mt-1">当物料数量低于此值时，系统会显示低库存警告</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4">
                      <label className="block text-sm font-bold text-slate-700 mb-2">大额财务审批标准（元）</label>
                      <input
                        type="number"
                        value={configForm.largeExpenseThreshold}
                        onChange={(e) => setConfigForm({ ...configForm, largeExpenseThreshold: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="默认: 100000"
                      />
                      <p className="text-xs text-slate-500 mt-1">当财务支出金额大于等于此值时，需要管理员审批</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setIsPermissionsModalOpen(false);
                  setConfigForm(config); // 重置表单
                }}
                className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  await handleSavePermissions();
                  await handleSaveConfig();
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg hover:bg-purple-700 transition-transform active:scale-95"
              >
                保存所有配置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 拒绝原因输入模态框 */}
      {isRejectNoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex items-center justify-between text-white bg-red-600">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <X size={20} />
                拒绝原因
              </h3>
              <button
                onClick={() => {
                  setIsRejectNoteModalOpen(false);
                  setPendingRejectLogId(null);
                  setRejectNote('');
                }}
                className="hover:rotate-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">请输入拒绝原因（可选）</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  rows={4}
                  placeholder="请输入拒绝原因..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setIsRejectNoteModalOpen(false);
                  setPendingRejectLogId(null);
                  setRejectNote('');
                }}
                className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleConfirmReject((window as any).__pendingRejectIsFinance || false)}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg hover:bg-red-700 transition-transform active:scale-95"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 物料管理模态框 */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex items-center justify-between text-white bg-purple-600">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Package size={20} />
                {editingInventoryItem ? '编辑物料' : '新建物料'}
              </h3>
              <button onClick={() => setIsInventoryModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">物料名称 *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    value={inventoryForm.name}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                    placeholder="如：42.5级硅酸盐水泥"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">规格参数 *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    value={inventoryForm.spec}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, spec: e.target.value })}
                    placeholder="如：Φ12"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">单位 *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    value={inventoryForm.unit}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                    placeholder="如：袋、吨、立方米"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">参考单价（元）</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    value={inventoryForm.price}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">初始库存数量</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    value={inventoryForm.quantity}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">低库存预警阈值 *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="flex-1 bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    value={inventoryForm.threshold}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, threshold: Number(e.target.value) })}
                    placeholder="当库存低于此值时显示预警"
                  />
                  <span className="text-sm text-slate-500">{inventoryForm.unit || '单位'}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">当物料数量低于此阈值时，系统会显示低库存警告</p>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setIsInventoryModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveInventoryItem}
                className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg hover:bg-purple-700 transition-transform active:scale-95"
              >
                {editingInventoryItem ? '更新' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
