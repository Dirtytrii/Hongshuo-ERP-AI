import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Clock, X, Check, BrainCircuit, Sparkles, Send, Trash2 } from 'lucide-react';
import {
  exportInventoryToExcel,
  exportFinanceToExcel,
  exportAppStateAsBackup,
  downloadInventoryImportTemplate,
  downloadFinanceImportTemplate,
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
import { canAccessTab, DEFAULT_TAB, getTabTitle, parseInitialTabState } from './app/navigation/tabRegistry';
import AppShell from './app/layout/AppShell';
import AppPageViewport from './app/layout/AppPageViewport';
import AppLoadingState from './app/layout/AppLoadingState';
import AppUnauthorizedState from './app/layout/AppUnauthorizedState';
import AppHeader from './app/shell/AppHeader';
import AppSidebar from './app/shell/AppSidebar';
import MessageCenterPopover from './app/shell/MessageCenterPopover';
import { buildAlertSummary } from './modules/dashboard/services/alertSummary';
import { DEFAULT_PERMISSIONS_CONFIG, DEFAULT_ROLES } from './app/config/appDefaults';
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
import FinanceManagementPage from './components/Finance/FinanceManagementPage';
import FinanceRecordModal from './components/Finance/FinanceRecordModal';
import InventoryItemModal from './components/Inventory/InventoryItemModal';
import InventoryManagementPage from './components/Inventory/InventoryManagementPage';
import InventoryWarehousePage from './components/Inventory/InventoryWarehousePage';
import StockMovementModal from './components/Inventory/StockMovementModal';
import OperationLogPage from './components/History/OperationLogPage';
import PermissionsConfigModal from './components/Settings/PermissionsConfigModal';
import UserManagementPage from './components/Users/UserManagementPage';
import ProjectFormModal from './components/Projects/ProjectFormModal';
import RejectNoteModal from './components/ApprovalCenter/RejectNoteModal';

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
import ProjectManagementPage from './components/Projects/ProjectManagementPage';
import FinanceReport from './components/Reports/FinanceReport';
import InventoryReport from './components/Reports/InventoryReport';
import ProjectReport from './components/Reports/ProjectReport';

const ROLES: Record<string, Role> = DEFAULT_ROLES;

// 权限配置状态（从后端加载）
const permissionsConfig: Record<string, string[]> = DEFAULT_PERMISSIONS_CONFIG;

type AuthUser = { id: number; username: string; role: string; enabled: boolean };
type PendingRejectTarget = 'finance' | 'stock';

const isDesktopSidebarViewport = () =>
  typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches;

const FINANCE_STATUS_META: Record<string, { label: string; className: string }> = {
  approved: { label: '已审批', className: 'bg-green-50 text-green-700 ring-green-100' },
  pending: { label: '待审批', className: 'bg-orange-50 text-orange-700 ring-orange-100' },
  rejected: { label: '已拒绝', className: 'bg-red-50 text-red-700 ring-red-100' },
};

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

  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);
  const [tabInitializedFromUrl, setTabInitializedFromUrl] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => isDesktopSidebarViewport());

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
  const [pendingRejectTarget, setPendingRejectTarget] = useState<PendingRejectTarget | null>(null);

  // 权限检查函数（使用动态权限配置）
  const hasPermission = (currentUser: Role, permission: string): boolean => {
    const allowedRoles = permissions[permission] || [];
    return allowedRoles.includes(currentUser.id);
  };

  const navigateToTab = (tabId: string) => {
    setActiveTab(tabId);
  };

  const closeSidebarOnMobile = () => {
    if (!isDesktopSidebarViewport()) {
      setIsSidebarOpen(false);
    }
  };

  const alerts = useMemo(() => {
    return buildAlertSummary({
      inventory,
      stockLogs,
      financeRecords,
      projects,
      upcomingPaymentPlans: upcomingPaymentPlans.map((p) => ({
        projectName: projects.find((proj) => proj.id === p.projectId)?.name,
        planAmount: p.planAmount,
        receivedAmount: p.receivedAmount,
      })),
      overdueMilestones: overdueMilestones.map((m) => ({
        projectName: m.projectName,
        name: m.name,
      })),
    });
  }, [financeRecords, inventory, overdueMilestones, projects, stockLogs, upcomingPaymentPlans]);

  const messageCenterCount = useMemo(() => alerts.reduce((sum, item) => sum + (item.count || 0), 0), [alerts]);

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
    const initial = parseInitialTabState(window.location.search);
    const desiredTab = initial.tabId ?? DEFAULT_TAB;
    const canAccessDesired = canAccessTab({
      tabId: desiredTab,
      currentUserId: currentUser.id,
      hasPermission: (permission) => hasPermission(currentUser, permission),
    });
    const nextTab = canAccessDesired ? desiredTab : 'dashboard';
    setActiveTab(nextTab);
    if (nextTab === 'projects' && initial.projectId) {
      setSelectedProjectId(initial.projectId);
    }
    setTabInitializedFromUrl(true);
  }, [currentUser, tabInitializedFromUrl]);

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

  const handleDeleteLog = async (log: SystemLog) => {
    if (!confirm('确定删除该条日志？')) return;
    try {
      await apiService.deleteLog(Number(log.id));
      const logs = (await apiService.getSystemLogs().catch(() => [])) as SystemLog[];
      setSystemLogs(Array.isArray(logs) ? logs : []);
      if (logFilterUser || logFilterAction) {
        if (logFilterUser && logFilterAction) {
          const byUser = (await apiService.getSystemLogsByUser(logFilterUser)) as SystemLog[];
          setHistoryFilteredLogs(Array.isArray(byUser) ? byUser.filter((l) => l.action === logFilterAction) : []);
        } else if (logFilterUser) {
          const list = (await apiService.getSystemLogsByUser(logFilterUser)) as SystemLog[];
          setHistoryFilteredLogs(Array.isArray(list) ? list : []);
        } else {
          const list = (await apiService.getSystemLogsByAction(logFilterAction)) as SystemLog[];
          setHistoryFilteredLogs(Array.isArray(list) ? list : []);
        }
      } else {
        setHistoryFilteredLogs(null);
      }
    } catch (e) {
      setToast({ message: (e as Error).message || '删除失败', type: 'error' });
    }
  };

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

  const closeRejectNoteModal = () => {
    setIsRejectNoteModalOpen(false);
    setPendingRejectLogId(null);
    setPendingRejectTarget(null);
    setRejectNote('');
  };

  // 确认拒绝操作
  const handleConfirmReject = async () => {
    if (pendingRejectLogId === null || pendingRejectTarget === null) return;

    try {
      if (pendingRejectTarget === 'finance') {
        await handleApproveFinance(pendingRejectLogId, false, rejectNote);
      } else {
        await handleApproveStock(pendingRejectLogId, false, rejectNote);
      }
    } catch (error: any) {
      setToast({ message: error.message || '操作失败', type: 'error' });
    }

    closeRejectNoteModal();
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
    <>
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
        <StockMovementModal
          type={stockModalType}
          inventory={inventory}
          projects={projects}
          suppliers={suppliers}
          selectedItemId={selectedItemId}
          stockAmount={stockAmount}
          targetProjectId={targetProjectId}
          stockSupplierId={stockSupplierId}
          onSelectedItemIdChange={setSelectedItemId}
          onStockAmountChange={setStockAmount}
          onTargetProjectIdChange={setTargetProjectId}
          onStockSupplierIdChange={setStockSupplierId}
          onClose={() => setIsStockModalOpen(false)}
          onSubmit={handleStockSubmit}
        />
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
                    return sorted.map((r) => {
                      const statusMeta = FINANCE_STATUS_META[r.status] ?? {
                        label: r.status,
                        className: 'bg-slate-50 text-slate-600 ring-slate-100',
                      };

                      return (
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
                              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    });
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
        <ProjectFormModal
          projectForm={projectForm}
          editingProject={editingProject}
          userOptions={userOptions}
          onProjectFormChange={setProjectForm}
          onClose={() => setIsProjectModalOpen(false)}
          onSubmit={handleSaveProject}
        />
      )}

      {/* Finance Modal */}
      {isFinanceModalOpen && (
        <FinanceRecordModal
          financeForm={financeForm}
          financeCategories={financeCategories}
          paymentPlanOptionsForFinance={paymentPlanOptionsForFinance}
          projects={projects}
          departments={departments}
          suppliers={suppliers}
          onFinanceFormChange={setFinanceForm}
          onClose={() => setIsFinanceModalOpen(false)}
          onSubmit={handleSaveFinance}
        />
      )}

      <AppShell
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        sidebar={
          <AppSidebar
            activeTab={activeTab}
            currentUserId={currentUser.id}
            hasPermission={(permission) => hasPermission(currentUser, permission)}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((v) => !v)}
            onSelectTab={(tabId) => {
              navigateToTab(tabId);
              closeSidebarOnMobile();
            }}
            onOpenPermissions={() => {
              setIsPermissionsModalOpen(true);
              closeSidebarOnMobile();
            }}
          />
        }
        header={
          <AppHeader
            title={getTabTitle(activeTab)}
            isSidebarOpen={isSidebarOpen}
            isBackendConnected={isBackendConnected}
            authUsername={authUser.username}
            roleLabel={currentUser.label}
            isAdmin={currentUser.id === 'admin'}
            messageCenterCount={messageCenterCount}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
            onToggleMessageCenter={() => setIsNotificationOpen((v) => !v)}
            onBackup={async () => {
              try {
                const state = (await apiService.getAppState()) as {
                  projects: unknown[];
                  inventory: unknown[];
                  financeRecords: unknown[];
                  stockLogs: unknown[];
                };
                exportAppStateAsBackup(state);
                setToast({ message: '备份已下载', type: 'success' });
              } catch {
                setToast({ message: '备份失败', type: 'error' });
              }
            }}
            onRestore={() => {
              setImportMode('restore');
              setTimeout(() => fileInputRef.current?.click(), 0);
            }}
            onResetData={handleResetData}
            onLogout={() => {
              clearStoredAuth();
              setAuthUser(null);
            }}
            messageCenter={
              <MessageCenterPopover
                alerts={alerts}
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                onNavigateTab={(tabId) => {
                  const canAccess = canAccessTab({
                    tabId,
                    currentUserId: currentUser.id,
                    hasPermission: (permission) => hasPermission(currentUser, permission),
                  });
                  navigateToTab(canAccess ? tabId : 'dashboard');
                }}
              />
            }
          />
        }
      >
        <AppPageViewport>
          {isLoading && <AppLoadingState />}
          {!isLoading && activeTab === 'dashboard' && (
            <Suspense fallback={<AppLoadingState />}>
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
            !canAccessTab({
              tabId: activeTab,
              currentUserId: currentUser.id,
              hasPermission: (permission) => hasPermission(currentUser, permission),
            }) && <AppUnauthorizedState onBackToDashboard={() => navigateToTab('dashboard')} />}

          {!isLoading && activeTab === 'inventory' && hasPermission(currentUser, 'inventory.view') && (
            <InventoryWarehousePage
              inventory={inventory}
              stockLogs={stockLogs}
              projects={projects}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              authRole={authUser?.role}
              canCreateStockEntry={hasPermission(currentUser, 'inventory.create')}
              canRequestOutbound={
                hasPermission(currentUser, 'inventory.outbound.direct') ||
                hasPermission(currentUser, 'inventory.outbound.request')
              }
              canApproveOutbound={hasPermission(currentUser, 'inventory.approve')}
              onOpenInbound={() => {
                setStockModalType('in');
                setIsStockModalOpen(true);
              }}
              onOpenOutbound={() => {
                setStockModalType('out');
                setIsStockModalOpen(true);
              }}
              onApproveStock={handleApproveStock}
              onApproveStockReversal={handleApproveStockReversal}
              onReverseStock={handleReversalStock}
            />
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
              <InventoryManagementPage
                inventory={inventory}
                canCreateInventory={hasPermission(currentUser, 'inventory.create')}
                canEditInventory={hasPermission(currentUser, 'inventory.edit')}
                canDeleteInventory={hasPermission(currentUser, 'inventory.delete')}
                onExport={() => exportInventoryToExcel(inventory)}
                onDownloadTemplate={downloadInventoryImportTemplate}
                onImport={() => {
                  setImportMode('inventory');
                  setTimeout(() => fileInputRef.current?.click(), 0);
                }}
                onCreate={() => {
                  setEditingInventoryItem(null);
                  setInventoryForm({ name: '', spec: '', unit: '', price: 0, quantity: 0, threshold: 0 });
                  setIsInventoryModalOpen(true);
                }}
                onEdit={(item) => {
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
                onDelete={async (item) => {
                  if (!confirm(`确定要删除物料“${item.name}”吗？此操作不可恢复。`)) {
                    return;
                  }

                  try {
                    await apiService.deleteInventoryItem(item.id);
                    setToast({ message: '物料已删除', type: 'success' });
                    const inventoryData = (await apiService.getInventory().catch(() => [])) as InventoryItem[];
                    setInventory(Array.isArray(inventoryData) ? inventoryData : []);
                  } catch (error: any) {
                    setToast({ message: error.message || '删除失败', type: 'error' });
                  }
                }}
              />
            )}

          {!isLoading && activeTab === 'finance' && hasPermission(currentUser, 'finance.view') && (
            <FinanceManagementPage
              financeRecords={financeRecords}
              projects={projects}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              authRole={authUser?.role}
              canCreateFinance={hasPermission(currentUser, 'finance.create')}
              canApproveFinance={hasPermission(currentUser, 'finance.approve.normal')}
              onExport={() => exportFinanceToExcel(financeRecords)}
              onDownloadTemplate={downloadFinanceImportTemplate}
              onImport={() => {
                setImportMode('finance');
                setTimeout(() => fileInputRef.current?.click(), 0);
              }}
              onCreate={openFinanceModal}
              onApprove={handleApproveFinance}
              onReject={(recordId) => {
                setPendingRejectLogId(recordId);
                setPendingRejectTarget('finance');
                setRejectNote('');
                setIsRejectNoteModalOpen(true);
              }}
              onReverse={handleReversalFinance}
            />
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
              <ApprovalCenter onNavigateTab={(tab) => setActiveTab(tab)} />
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
            <OperationLogPage
              systemLogs={systemLogs}
              displayedLogs={historyFilteredLogs !== null ? historyFilteredLogs : systemLogs}
              canDelete={hasPermission(currentUser, 'log.delete')}
              logFilterUser={logFilterUser}
              logFilterAction={logFilterAction}
              onFilterUserChange={setLogFilterUser}
              onFilterActionChange={setLogFilterAction}
              onDeleteLog={handleDeleteLog}
            />
          )}

          {/* 用户管理页面（仅管理员） */}
          {!isLoading && activeTab === 'users' && currentUser.id === 'admin' && (
            <UserManagementPage
              users={users}
              search={userSearch}
              getRoleLabel={(role) => ROLES[role]?.label ?? role}
              getSearchRoleLabel={(role) => (roleLabelMap[role] || ROLES[role])?.label ?? role}
              onSearchChange={setUserSearch}
              onCreateUser={() => openUserModal()}
              onEditUser={openUserModal}
              onDeleteUser={handleDeleteUser}
            />
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
            <ProjectManagementPage
              projects={projects}
              selectedProjectId={selectedProjectId}
              selectedProjectDetail={selectedProjectDetail}
              financeRecords={financeRecords}
              stockLogs={stockLogs}
              inventory={inventory}
              projectViewMode={projectViewMode}
              canCreateProject={hasPermission(currentUser, 'project.create')}
              canEditProject={hasPermission(currentUser, 'project.edit')}
              canDeleteProject={hasPermission(currentUser, 'project.delete')}
              onChangeViewMode={setProjectViewMode}
              onSelectProject={setSelectedProjectId}
              onCloseDetail={() => {
                setSelectedProjectId(null);
                setSelectedProjectDetail(null);
              }}
              onOpenProjectModal={openProjectModal}
              onDeleteProject={handleDeleteProject}
              onRefreshMilestones={
                selectedProjectId
                  ? async () => {
                      const ms = await apiService.getMilestones(selectedProjectId).catch(() => []);
                      setSelectedProjectDetail((prev) =>
                        prev ? { ...prev, milestones: ms as Project['milestones'] } : null
                      );
                    }
                  : undefined
              }
              onImportProjects={() => {
                setImportMode('project');
                setTimeout(() => fileInputRef.current?.click(), 0);
              }}
            />
          )}
        </AppPageViewport>
      </AppShell>

      {/* 权限管理模态框 */}
      {isPermissionsModalOpen && (
        <PermissionsConfigModal
          permissionsConfig={permissionsConfig}
          permissions={permissions}
          roleLabelMap={roleLabelMap}
          configForm={configForm}
          onPermissionChange={handlePermissionChange}
          onConfigFormChange={setConfigForm}
          onClose={() => setIsPermissionsModalOpen(false)}
          onCancel={() => {
            setIsPermissionsModalOpen(false);
            setConfigForm(config);
          }}
          onSave={async () => {
            await handleSavePermissions();
            await handleSaveConfig();
          }}
        />
      )}

      {/* 拒绝原因输入模态框 */}
      {isRejectNoteModalOpen && (
        <RejectNoteModal
          rejectNote={rejectNote}
          onRejectNoteChange={setRejectNote}
          onCancel={closeRejectNoteModal}
          onConfirm={handleConfirmReject}
        />
      )}

      {/* 物料管理模态框 */}
      {isInventoryModalOpen && (
        <InventoryItemModal
          inventoryForm={inventoryForm}
          editingInventoryItem={editingInventoryItem}
          onInventoryFormChange={setInventoryForm}
          onClose={() => setIsInventoryModalOpen(false)}
          onSubmit={handleSaveInventoryItem}
        />
      )}
    </>
  );
};

export default App;
