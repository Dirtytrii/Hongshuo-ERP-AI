import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, HardHat, Package, 
  Plus, Clock, TrendingUp, AlertTriangle, 
  ChevronRight, ArrowRightLeft, 
  X, Check, Building2, 
  History, BrainCircuit, Sparkles, Send, Search, Filter, Settings, Trash2, ChevronDown, User
} from 'lucide-react';
import { analyzeConstructionData } from './services/geminiService';
import { apiService } from './services/apiService';
import { Project, InventoryItem, FinanceRecord, StockLog, SystemLog, Role, AppState } from './types';
import Dashboard from './components/Dashboard/Dashboard';

const ROLES = {
  ADMIN: { id: 'admin', name: '王总 (Admin)', label: '管理员' },
  PM: { id: 'pm', name: '李工 (PM)', label: '项目经理' },
  FINANCE: { id: 'finance', name: '赵姐 (Finance)', label: '财务' },
  CLERK: { id: 'clerk', name: '小张 (Clerk)', label: '录入员' }
};

const STATUS_COLORS: Record<string, string> = {
  '施工中': 'bg-blue-100 text-blue-700',
  '验收中': 'bg-purple-100 text-purple-700',
  '已完工': 'bg-green-100 text-green-700',
  'pending': 'bg-orange-100 text-orange-700',
  'active': 'bg-green-100 text-green-700',
  'rejected': 'bg-red-100 text-red-700',
};

// 权限配置状态（从后端加载）
let permissionsConfig: Record<string, string[]> = {
  // 页面级别权限
  'projects.view': ['admin', 'pm'],
  'inventory.view': ['admin', 'pm', 'finance', 'clerk'],
  'inventory-management.view': ['admin', 'pm'],
  'finance.view': ['admin', 'pm', 'finance'],
  'history.view': ['admin'],
  'ai.view': ['admin', 'pm', 'finance', 'clerk'],
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

const App = () => {
  const [currentUser, setCurrentUser] = useState<Role>(ROLES.ADMIN);
  const [activeTab, setActiveTab] = useState('inventory'); // 默认切到仓库方便查看
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
  
  // Project Modal States
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    code: '',
    managerId: '',
    contractAmount: 0,
    receivedAmount: 0,
    materialCost: 0,
    laborCost: 0,
    otherCost: 0,
    status: '施工中',
    progress: 0,
    startDate: '',
    endDate: ''
  });
  
  // Finance Modal States
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeForm, setFinanceForm] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: 0,
    projectId: null as number | null,
    desc: ''
  });

  // AI States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // User Switch State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
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
    threshold: 0
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
  
  // Toast Component
  const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
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

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [projectsData, inventoryData, financeData, stockData, logsData, permissionsData] = await Promise.all([
          apiService.getProjects().catch(() => []) as Promise<Project[]>,
          apiService.getInventory().catch(() => []) as Promise<InventoryItem[]>,
          apiService.getFinanceRecords().catch(() => []) as Promise<FinanceRecord[]>,
          apiService.getStockLogs().catch(() => []) as Promise<StockLog[]>,
          apiService.getSystemLogs().catch(() => []) as Promise<SystemLog[]>,
          apiService.getPermissions().catch(() => ({})) as Promise<Record<string, string[]>>
        ]);
        
        const projects = Array.isArray(projectsData) ? projectsData : [];
        const inventory = Array.isArray(inventoryData) ? inventoryData : [];
        const finance = Array.isArray(financeData) ? financeData : [];
        const stock = Array.isArray(stockData) ? stockData : [];
        const logs = Array.isArray(logsData) ? logsData : [];
        const perms = permissionsData && Object.keys(permissionsData).length > 0 ? permissionsData : permissionsConfig;
        
        // 加载配置
        const configData = await apiService.getConfig().catch(() => ({})) as { lowStockThreshold?: string; largeExpenseThreshold?: string };
        if (configData && (configData.lowStockThreshold || configData.largeExpenseThreshold)) {
          setConfig({
            lowStockThreshold: configData.lowStockThreshold || '100',
            largeExpenseThreshold: configData.largeExpenseThreshold || '100000'
          });
          setConfigForm({
            lowStockThreshold: configData.lowStockThreshold || '100',
            largeExpenseThreshold: configData.largeExpenseThreshold || '100000'
          });
        }
        
        setProjects(projects);
        setInventory(inventory);
        setFinanceRecords(finance);
        setStockLogs(stock);
        setSystemLogs(logs);
        setPermissions(perms);
        
        // Set default selected values
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
    
    loadData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Stock Action Handler
  const handleStockSubmit = async () => {
    if (stockAmount <= 0) {
      alert("请输入有效的数量！");
      return;
    }

    if (!selectedItemId) {
      alert("请选择物料！");
      return;
    }

    const selectedItem = inventory.find(i => i.id === selectedItemId);
    if (!selectedItem) {
      alert("物料不存在！");
      return;
    }

    try {
      const stockLogData = {
        type: stockModalType,
        itemId: selectedItemId,
        qty: stockAmount,
        price: selectedItem.price,
        projectId: stockModalType === 'out' ? targetProjectId : null,
        creator: currentUser.name,
        note: ''
      };

      await apiService.createStockLog(stockLogData);
      
      // 重新加载所有数据，确保数据同步
      const [inventoryData, stockData] = await Promise.all([
        apiService.getInventory().catch(() => []) as Promise<InventoryItem[]>,
        apiService.getStockLogs().catch(() => []) as Promise<StockLog[]>
      ]);
      
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setStockLogs(Array.isArray(stockData) ? stockData : []);
      
      // 显示提示信息
      if (stockModalType === 'out') {
        const isAdmin = currentUser.id === 'admin' || currentUser.name.includes('Admin') || currentUser.name.includes('王总');
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
    } catch (error: any) {
      setToast({ message: error.message || "操作失败，请稍后重试。", type: 'error' });
    }
  };

  // 审批出库申请
  const handleApproveStock = async (logId: number, approved: boolean, note?: string) => {
    try {
      await apiService.approveStockOut(logId, currentUser.name, approved, note || '');
      
      // 重新加载数据
      const [inventoryData, stockData] = await Promise.all([
        apiService.getInventory().catch(() => []) as Promise<InventoryItem[]>,
        apiService.getStockLogs().catch(() => []) as Promise<StockLog[]>
      ]);
      
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setStockLogs(Array.isArray(stockData) ? stockData : []);
      
      setToast({ message: approved ? "审批通过！" : "已拒绝该申请。", type: approved ? 'success' : 'info' });
    } catch (error: any) {
      setToast({ message: error.message || "审批操作失败，请稍后重试。", type: 'error' });
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
        status: project.status,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.endDate || ''
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
        status: '施工中',
        progress: 0,
        startDate: '',
        endDate: ''
      });
    }
    setIsProjectModalOpen(true);
  };

  // 保存项目
  const handleSaveProject = async () => {
    try {
      const projectData = {
        ...projectForm,
        milestones: editingProject?.milestones || []
      };

      if (editingProject) {
        await apiService.updateProject(editingProject.id, projectData);
        setToast({ message: '项目更新成功！', type: 'success' });
      } else {
        await apiService.createProject(projectData);
        setToast({ message: '项目创建成功！', type: 'success' });
      }

      // 重新加载数据
      const projectsData = await apiService.getProjects().catch(() => []) as Promise<Project[]>;
      setProjects(Array.isArray(projectsData) ? projectsData : []);

      setIsProjectModalOpen(false);
      setEditingProject(null);
    } catch (error: any) {
      setToast({ message: error.message || "操作失败，请稍后重试。", type: 'error' });
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

      // 重新加载数据
      const projectsData = await apiService.getProjects().catch(() => []) as Promise<Project[]>;
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error: any) {
      setToast({ message: error.message || "删除失败，请稍后重试。", type: 'error' });
    }
  };

  // 打开财务记录模态框
  const openFinanceModal = () => {
    setFinanceForm({
      type: 'expense',
      category: '',
      amount: 0,
      projectId: null,
      desc: ''
    });
    setIsFinanceModalOpen(true);
  };

  // 保存财务记录
  const handleSaveFinance = async () => {
    try {
      const financeData = {
        ...financeForm,
        creator: currentUser.name,
        date: new Date().toISOString().split('T')[0]
      };

      await apiService.createFinanceRecord(financeData);
      setToast({ message: '财务记录创建成功！', type: 'success' });

      // 重新加载数据
      const financeData2 = await apiService.getFinanceRecords().catch(() => []) as Promise<FinanceRecord[]>;
      setFinanceRecords(Array.isArray(financeData2) ? financeData2 : []);

      setIsFinanceModalOpen(false);
    } catch (error: any) {
      setToast({ message: error.message || "操作失败，请稍后重试。", type: 'error' });
    }
  };

  // 审批财务记录
  const handleApproveFinance = async (recordId: number, approved: boolean, note?: string) => {
    try {
      await apiService.approveFinanceRecord(recordId, currentUser.name, approved, note || '');
      setToast({ message: approved ? "审批通过！" : "已拒绝该申请。", type: approved ? 'success' : 'info' });

      // 重新加载数据
      const financeData = await apiService.getFinanceRecords().catch(() => []) as Promise<FinanceRecord[]>;
      setFinanceRecords(Array.isArray(financeData) ? financeData : []);
    } catch (error: any) {
      setToast({ message: error.message || "审批操作失败，请稍后重试。", type: 'error' });
    }
  };

  const handleAiAnalysis = async () => {
    if (!aiPrompt.trim() || isAiThinking) return;
    setIsAiThinking(true);
    setAiResponse(null);
    try {
      // 从后端获取完整的数据快照
      const appState = await apiService.getAppState() as any;
      const data: AppState = {
        projects: (appState.projects || []) as Project[],
        inventory: (appState.inventory || []) as InventoryItem[],
        financeRecords: (appState.financeRecords || []) as FinanceRecord[],
        stockLogs: (appState.stockLogs || []) as StockLog[]
      };
      const result = await analyzeConstructionData(aiPrompt, data);
      setAiResponse(result);
    } catch (error) {
      console.error('AI Analysis error:', error);
      setAiResponse("分析失败，请稍后重试。");
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
      const perms = await apiService.getPermissions().catch(() => ({})) as Record<string, string[]>;
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
        largeExpenseThreshold: configForm.largeExpenseThreshold
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
      const inventoryData = await apiService.getInventory().catch(() => []) as InventoryItem[];
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
        [permission]: [...currentRoles, role]
      });
    } else {
      setPermissions({
        ...permissions,
        [permission]: currentRoles.filter(r => r !== role)
      });
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


  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Stock Modal */}
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {isStockModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-6 flex items-center justify-between text-white ${stockModalType === 'in' ? 'bg-green-600' : 'bg-blue-600'}`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {stockModalType === 'in' ? <Plus size={20}/> : <ArrowRightLeft size={20}/>}
                物料{stockModalType === 'in' ? '入库登记' : '出库申请'}
              </h3>
              <button onClick={() => setIsStockModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">选择物料</label>
                <select 
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(Number(e.target.value))}
                >
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.spec})</option>)}
                </select>
              </div>
              
              {stockModalType === 'out' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">关联项目</label>
                  <select 
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(Number(e.target.value))}
                  >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">操作数量 ({inventory.find(i => i.id === selectedItemId)?.unit})</label>
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

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex items-center justify-between text-white bg-blue-600">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Building2 size={20}/>
                {editingProject ? '编辑项目' : '新建项目'}
              </h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目名称 *</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目编号 *</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.code}
                    onChange={(e) => setProjectForm({...projectForm, code: e.target.value})}
                    disabled={!!editingProject}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目经理ID</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.managerId}
                    onChange={(e) => setProjectForm({...projectForm, managerId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目状态</label>
                  <select 
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({...projectForm, status: e.target.value})}
                  >
                    <option value="施工中">施工中</option>
                    <option value="验收中">验收中</option>
                    <option value="已完工">已完工</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">合同金额</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.contractAmount}
                    onChange={(e) => setProjectForm({...projectForm, contractAmount: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">已收款</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.receivedAmount}
                    onChange={(e) => setProjectForm({...projectForm, receivedAmount: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">进度 (%)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.progress}
                    onChange={(e) => setProjectForm({...projectForm, progress: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">开始日期</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({...projectForm, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">结束日期</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({...projectForm, endDate: e.target.value})}
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
                <Wallet size={20}/>
                新增财务记录
              </h3>
              <button onClick={() => setIsFinanceModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">类型</label>
                <select 
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  value={financeForm.type}
                  onChange={(e) => setFinanceForm({...financeForm, type: e.target.value as 'income' | 'expense'})}
                >
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">类别</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="如：材料费、人工费等"
                  value={financeForm.category}
                  onChange={(e) => setFinanceForm({...financeForm, category: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">金额</label>
                <input 
                  type="number"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  value={financeForm.amount}
                  onChange={(e) => setFinanceForm({...financeForm, amount: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">关联项目（可选）</label>
                <select 
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  value={financeForm.projectId || ''}
                  onChange={(e) => setFinanceForm({...financeForm, projectId: e.target.value ? Number(e.target.value) : null})}
                >
                  <option value="">不关联项目</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">备注</label>
                <textarea 
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  value={financeForm.desc}
                  onChange={(e) => setFinanceForm({...financeForm, desc: e.target.value})}
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
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <HardHat size={20} />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">宏硕建设 ERP</span>}
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, permission: null }, // 仪表盘所有人可见
            { id: 'projects', label: '项目管理', icon: Building2, permission: 'projects.view' },
            { id: 'inventory', label: '物料仓库', icon: Package, permission: 'inventory.view' },
            { id: 'inventory-management', label: '物料管理', icon: Settings, permission: 'inventory-management.view' },
            { id: 'finance', label: '财务收支', icon: Wallet, permission: 'finance.view' },
            { id: 'history', label: '操作日志', icon: History, permission: 'history.view' },
            { id: 'ai', label: 'AI 决策室', icon: BrainCircuit, special: true, permission: 'ai.view' },
            { id: 'permissions', label: '权限管理', icon: Settings, adminOnly: true, permission: null }, // 权限管理只有admin可见
          ]
          .filter((item) => {
            // 权限管理只有admin可见
            if (item.id === 'permissions') {
              return currentUser.id === 'admin';
            }
            // 如果没有权限要求，默认可见
            if (!item.permission) {
              return true;
            }
            // 使用权限系统检查
            return hasPermission(currentUser, item.permission);
          })
          .map((item) => (
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
                  ? (item.special ? 'bg-indigo-600 text-white shadow-lg' : 'bg-blue-50 text-blue-700') 
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
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm z-10">
          <h2 className="text-lg font-bold capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
             <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 border ${
               isBackendConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
             }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs font-medium ${
                  isBackendConnected ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isBackendConnected ? '后端连接正常' : '后端连接失败'}
                </span>
             </div>
             
             {/* 重置数据按钮（仅Admin可见，测试用） */}
             {currentUser.id === 'admin' && (
               <button
                 onClick={handleResetData}
                 className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                 title="重置所有数据（测试用）"
               >
                 <Trash2 size={14}/> 重置数据
               </button>
             )}
             
             {/* 用户切换下拉菜单 */}
             <div className="relative">
               <button
                 onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                 className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
               >
                 <User size={18} className="text-slate-600" />
                 <span className="text-sm font-medium text-slate-700">{currentUser.label}</span>
                 <ChevronDown size={16} className={`text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
               </button>
               
               {isUserMenuOpen && (
                 <>
                   <div 
                     className="fixed inset-0 z-40" 
                     onClick={() => setIsUserMenuOpen(false)}
                   ></div>
                   <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                     <div className="p-2">
                       {Object.values(ROLES).map((role) => (
                         <button
                           key={role.id}
                           onClick={() => {
                             setCurrentUser(role);
                             setIsUserMenuOpen(false);
                           }}
                           className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                             currentUser.id === role.id
                               ? 'bg-blue-50 text-blue-700 font-medium'
                               : 'text-slate-700 hover:bg-slate-50'
                           }`}
                         >
                           <div className={`w-2 h-2 rounded-full ${
                             currentUser.id === role.id ? 'bg-blue-600' : 'bg-slate-300'
                           }`}></div>
                           <div className="flex-1">
                             <p className="text-sm font-medium">{role.name}</p>
                             <p className="text-xs text-slate-500">{role.label}</p>
                           </div>
                           {currentUser.id === role.id && (
                             <Check size={16} className="text-blue-600" />
                           )}
                         </button>
                       ))}
                     </div>
                   </div>
                 </>
               )}
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
            <Dashboard 
              projects={projects}
              inventory={inventory}
              stockLogs={stockLogs}
              financeRecords={financeRecords}
              systemLogs={systemLogs}
            />
          )}
          
          {/* 如果当前页面没有权限，显示提示 */}
          {!isLoading && activeTab !== 'dashboard' && !hasPermission(currentUser, `${activeTab}.view`) && activeTab !== 'permissions' && (
            <div className="p-20 text-center">
              <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md mx-auto">
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
                      <p className="text-3xl font-bold">￥{(inventory.reduce((a, b) => a + b.price * b.quantity, 0) / 10000).toFixed(1)}万</p>
                  </div>
                  <div className="bg-white border p-6 rounded-2xl flex justify-between items-center hover:border-red-200 transition-colors">
                     <div>
                        <p className="text-slate-500 text-sm">低库存预警</p>
                        <p className="text-3xl font-bold text-red-500">{inventory.filter(i => i.quantity < i.threshold).length}</p>
                     </div>
                     <div className="p-3 bg-red-50 text-red-500 rounded-xl"><AlertTriangle size={24}/></div>
                  </div>
                  <div className="bg-white border p-6 rounded-2xl flex justify-between items-center hover:border-blue-200 transition-colors">
                     <div>
                        <p className="text-slate-500 text-sm">今日操作记录</p>
                        <p className="text-3xl font-bold text-blue-600">{stockLogs.length}</p>
                     </div>
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ArrowRightLeft size={24}/></div>
                  </div>
               </div>
               
               <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
                    <h3 className="font-bold flex items-center gap-2 text-slate-700"><Package size={18}/> 实时库存明细</h3>
                    <div className="flex gap-3">
                      {hasPermission(currentUser, 'inventory.create') && (
                        <button 
                          onClick={() => { setStockModalType('in'); setIsStockModalOpen(true); }}
                          className="px-4 py-2 border border-green-200 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-100 transition-colors shadow-sm"
                        >
                          <Plus size={16}/> 入库登记
                        </button>
                      )}
                      {(hasPermission(currentUser, 'inventory.outbound.direct') || hasPermission(currentUser, 'inventory.outbound.request')) && (
                        <button 
                          onClick={() => { setStockModalType('out'); setIsStockModalOpen(true); }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                        >
                          <ArrowRightLeft size={16}/> 出库申请
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
                          inventory.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-700">{item.name}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{item.spec}</td>
                            <td className="px-6 py-4 text-slate-600 font-mono">￥{item.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${item.quantity < item.threshold ? 'text-red-500' : 'text-slate-800'}`}>
                                {item.quantity.toLocaleString()} {item.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {item.threshold.toLocaleString()} {item.unit}
                            </td>
                            <td className="px-6 py-4">
                              {item.quantity < item.threshold ? (
                                <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-red-100">
                                  <AlertTriangle size={12}/> 低于安全位
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-green-100">
                                  <Check size={12}/> 供应充足
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
               
               {/* 待审批列表 - 项目经理和管理员可见 */}
               {hasPermission(currentUser, 'inventory.approve') && stockLogs.filter(log => log.status === 'pending' && log.type === 'out').length > 0 && (
                 <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 shadow-sm">
                   <h3 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
                     <Clock size={18}/> 待审批出库申请 ({stockLogs.filter(log => log.status === 'pending' && log.type === 'out').length})
                   </h3>
                   <div className="space-y-3">
                     {stockLogs
                       .filter(log => log.status === 'pending' && log.type === 'out')
                       .map(log => {
                         const item = inventory.find(i => i.id === log.itemId);
                         const project = projects.find(p => p.id === log.projectId);
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
                                 <Check size={16}/> 批准
                               </button>
                               <button
                                 onClick={async () => {
                                   const note = prompt('请输入拒绝原因（可选）:');
                                   await handleApproveStock(Number(log.id), false, note || '');
                                 }}
                                 className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                               >
                                 <X size={16}/> 拒绝
                               </button>
                             </div>
                           </div>
                         );
                       })}
                   </div>
                 </div>
               )}
               
               {/* 简易操作日志 */}
               {stockLogs.length > 0 && (
                 <div className="bg-white rounded-2xl border p-6 shadow-sm">
                   <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><History size={18}/> 最近出入库流水</h3>
                   <div className="space-y-3">
                     {[...stockLogs]
                       .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                       .map(log => {
                       const item = inventory.find(i => i.id === log.itemId);
                       const statusBadge = log.status === 'pending' ? (
                         <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-xs font-bold">
                           待审批
                         </span>
                       ) : log.status === 'rejected' ? (
                         <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold">
                           已拒绝
                         </span>
                       ) : null;
                       
                       return (
                         <div key={log.id} className="flex items-center justify-between py-3 border-b border-dashed last:border-0">
                           <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${log.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                {log.type === 'in' ? <Plus size={14}/> : <ArrowRightLeft size={14}/>}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold">
                                    {log.type === 'in' ? '物料入库' : '物料出库'} - {item?.name || '未知物料'}
                                  </p>
                                  {statusBadge}
                                </div>
                                <p className="text-xs text-slate-400">
                                  {log.date} · 操作员: {log.creator}
                                  {log.approver && ` · 审批人: ${log.approver}`}
                                </p>
                              </div>
                           </div>
                           <div className="text-right">
                             <p className={`font-bold ${log.type === 'in' ? 'text-green-600' : 'text-blue-600'}`}>
                               {log.type === 'in' ? '+' : '-'}{log.qty} {item?.unit || ''}
                             </p>
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
            <div className="h-full flex flex-col max-w-4xl mx-auto space-y-6">
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
                      已同步仓库实时数据。您可以询问：“目前哪些物料需要立刻补货？”或“分析上月的物料损耗情况”。
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {['库存预警分析', '成本异常检测', '补货策略建议', '出库频率分析'].map(s => (
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
               
               <div className="flex-1 bg-white rounded-3xl border shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {!aiResponse && !isAiThinking && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                        <Sparkles size={48} className="mb-4 opacity-20" />
                        <p>在下方输入您的问题，让 AI 深度分析数据库...</p>
                      </div>
                    )}
                    {isAiThinking && (
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 animate-pulse"><BrainCircuit size={20} /></div>
                        <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-slate-600 text-sm border flex items-center gap-2">
                           <span className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                           </span>
                           深度数据对齐中...
                        </div>
                      </div>
                    )}
                    {aiResponse && (
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg text-white"><BrainCircuit size={20} /></div>
                        <div className="bg-indigo-50 p-5 rounded-3xl rounded-tl-none text-slate-800 text-sm border border-indigo-100 leading-relaxed shadow-sm w-full">
                           <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br/>') }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 border-t flex gap-3">
                    <input 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiAnalysis()}
                      className="flex-1 bg-white border rounded-2xl px-6 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
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
          )}

          {/* 财务收支页面 */}
          {/* 物料管理页面 */}
          {!isLoading && activeTab === 'inventory-management' && hasPermission(currentUser, 'inventory-management.view') && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold flex items-center gap-2 text-slate-700"><Package size={18}/> 物料管理</h3>
                  {(hasPermission(currentUser, 'inventory.edit') || hasPermission(currentUser, 'inventory.create')) && (
                    <button 
                      onClick={() => {
                        setEditingInventoryItem(null);
                        setInventoryForm({ name: '', spec: '', unit: '', price: 0, quantity: 0, threshold: 0 });
                        setIsInventoryModalOpen(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg"
                    >
                      <Plus size={16}/> 新建物料
                    </button>
                  )}
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
                        {(hasPermission(currentUser, 'inventory.edit') || hasPermission(currentUser, 'inventory.delete')) && (
                          <th className="px-6 py-4 font-bold">操作</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {inventory.length === 0 ? (
                        <tr>
                          <td colSpan={hasPermission(currentUser, 'inventory.edit') || hasPermission(currentUser, 'inventory.delete') ? 8 : 7} className="px-6 py-12 text-center text-slate-400">
                            暂无物料，点击"新建物料"添加
                          </td>
                        </tr>
                      ) : (
                        inventory.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-700">{item.name}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{item.spec}</td>
                            <td className="px-6 py-4 text-slate-600">{item.unit}</td>
                            <td className="px-6 py-4 text-slate-600 font-mono">￥{item.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${item.quantity < item.threshold ? 'text-red-500' : 'text-slate-800'}`}>
                                {item.quantity.toLocaleString()} {item.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {item.threshold.toLocaleString()} {item.unit}
                            </td>
                            <td className="px-6 py-4">
                              {item.quantity < item.threshold ? (
                                <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-red-100">
                                  <AlertTriangle size={12}/> 低于安全位
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-green-100">
                                  <Check size={12}/> 供应充足
                                </span>
                              )}
                            </td>
                            {(hasPermission(currentUser, 'inventory.edit') || hasPermission(currentUser, 'inventory.delete')) && (
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
                                          threshold: item.threshold
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
                                            const inventoryData = await apiService.getInventory().catch(() => []) as InventoryItem[];
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
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold flex items-center gap-2 text-slate-700"><Wallet size={18}/> 财务收支记录</h3>
                  {hasPermission(currentUser, 'finance.create') && (
                    <button 
                      onClick={openFinanceModal}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg"
                    >
                      <Plus size={16}/> 新增财务记录
                    </button>
                  )}
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
                          <td colSpan={currentUser.id === 'admin' ? 8 : 7} className="px-6 py-12 text-center text-slate-400">
                            暂无财务记录
                          </td>
                        </tr>
                      ) : (
                        financeRecords.map(record => {
                          const project = projects.find(p => p.id === record.projectId);
                          return (
                            <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 text-slate-600">{record.date}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  record.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {record.type === 'income' ? '收入' : '支出'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-700">{record.category}</td>
                              <td className={`px-6 py-4 font-bold ${
                                record.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {record.type === 'income' ? '+' : '-'}￥{record.amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-slate-500">{project?.name || '未关联'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  record.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  record.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {record.status === 'approved' ? '已批准' : 
                                   record.status === 'pending' ? '待审批' : '已拒绝'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-500">{record.creator}</td>
                              {hasPermission(currentUser, 'finance.approve.normal') && record.status === 'pending' && (
                                <td className="px-6 py-4">
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
                                      // 标记为财务记录
                                      (window as any).__pendingRejectIsFinance = true;
                                    }}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                                  >
                                    拒绝
                                  </button>
                                  </div>
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

          {/* 操作日志页面 */}
          {!isLoading && activeTab === 'history' && hasPermission(currentUser, 'history.view') && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="font-bold flex items-center gap-2 text-slate-700"><History size={18}/> 系统操作日志</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">时间</th>
                        <th className="px-6 py-4 font-bold">操作人</th>
                        <th className="px-6 py-4 font-bold">操作类型</th>
                        <th className="px-6 py-4 font-bold">详细信息</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {systemLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                            暂无操作日志
                          </td>
                        </tr>
                      ) : (
                        systemLogs
                          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                          .map(log => (
                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 text-slate-600">{new Date(log.time).toLocaleString('zh-CN')}</td>
                              <td className="px-6 py-4 text-slate-700 font-medium">{log.user}</td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-500">{log.detail}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 项目管理页面 */}
          {!isLoading && activeTab === 'projects' && hasPermission(currentUser, 'projects.view') && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold flex items-center gap-2 text-slate-700"><Building2 size={18}/> 项目列表</h3>
                  {hasPermission(currentUser, 'project.create') && (
                    <button 
                      onClick={() => openProjectModal()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      <Plus size={16}/> 新建项目
                    </button>
                  )}
                </div>
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
                        {hasPermission(currentUser, 'project.edit') && (
                          <th className="px-6 py-4 font-bold">操作</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {projects.length === 0 ? (
                        <tr>
                          <td colSpan={currentUser.id === 'admin' || currentUser.id === 'pm' ? 8 : 7} className="px-6 py-12 text-center text-slate-400">
                            暂无项目
                          </td>
                        </tr>
                      ) : (
                        projects.map(project => (
                          <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-700">{project.name}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">{project.code}</td>
                            <td className="px-6 py-4 text-slate-600 font-mono">￥{project.contractAmount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-green-600 font-mono">￥{project.receivedAmount.toLocaleString()}</td>
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
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[project.status] || 'bg-slate-100 text-slate-700'}`}>
                                {project.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{project.startDate}</td>
                            {hasPermission(currentUser, 'project.edit') && (
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
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
        </div>
      </main>

      {/* 权限管理模态框 */}
      {isPermissionsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="p-6 flex items-center justify-between text-white bg-purple-600">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings size={20}/>
                权限管理
              </h3>
              <button onClick={() => setIsPermissionsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm text-slate-600 mb-4">配置各角色的权限。勾选表示该角色拥有该权限。</p>
                
                {/* 页面级别权限 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 border-b pb-2">页面访问权限</h3>
                  {Object.keys(permissionsConfig)
                    .filter(permission => permission.endsWith('.view'))
                    .map((permission) => {
                      const permissionLabels: Record<string, string> = {
                        'projects.view': '项目管理页面',
                        'inventory.view': '物料仓库页面',
                        'inventory-management.view': '物料管理页面',
                        'finance.view': '财务收支页面',
                        'history.view': '操作日志页面',
                        'ai.view': 'AI 决策室页面',
                      };
                      
                      return (
                        <div key={permission} className="border border-slate-200 rounded-xl p-4">
                          <h4 className="font-bold text-slate-700 mb-3">{permissionLabels[permission] || permission}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.values(ROLES).map((role) => (
                              <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(permissions[permission] || []).includes(role.id)}
                                  onChange={(e) => handlePermissionChange(permission, role.id, e.target.checked)}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm text-slate-700">{role.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {/* 按钮级别权限 */}
                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-bold text-slate-700 border-b pb-2">功能操作权限</h3>
                  {Object.keys(permissionsConfig)
                    .filter(permission => !permission.endsWith('.view'))
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
                          <h4 className="font-bold text-slate-700 mb-3">{permissionLabels[permission] || permission}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.values(ROLES).map((role) => (
                              <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(permissions[permission] || []).includes(role.id)}
                                  onChange={(e) => handlePermissionChange(permission, role.id, e.target.checked)}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm text-slate-700">{role.label}</span>
                              </label>
                            ))}
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
                        onChange={(e) => setConfigForm({...configForm, lowStockThreshold: e.target.value})}
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
                        onChange={(e) => setConfigForm({...configForm, largeExpenseThreshold: e.target.value})}
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
                <X size={20}/>
                拒绝原因
              </h3>
              <button onClick={() => {
                setIsRejectNoteModalOpen(false);
                setPendingRejectLogId(null);
                setRejectNote('');
              }} className="hover:rotate-90 transition-transform"><X size={20}/></button>
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
                <Package size={20}/>
                {editingInventoryItem ? '编辑物料' : '新建物料'}
              </h3>
              <button onClick={() => setIsInventoryModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">物料名称 *</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    value={inventoryForm.name}
                    onChange={(e) => setInventoryForm({...inventoryForm, name: e.target.value})}
                    placeholder="如：42.5级硅酸盐水泥"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">规格参数 *</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    value={inventoryForm.spec}
                    onChange={(e) => setInventoryForm({...inventoryForm, spec: e.target.value})}
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
                    onChange={(e) => setInventoryForm({...inventoryForm, unit: e.target.value})}
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
                    onChange={(e) => setInventoryForm({...inventoryForm, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">初始库存数量</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    value={inventoryForm.quantity}
                    onChange={(e) => setInventoryForm({...inventoryForm, quantity: Number(e.target.value)})}
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
                    onChange={(e) => setInventoryForm({...inventoryForm, threshold: Number(e.target.value)})}
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
