import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, HardHat, Package, 
  Plus, Clock, TrendingUp, AlertTriangle, 
  ChevronRight, ArrowRightLeft, 
  X, Check, Building2, 
  History, BrainCircuit, Sparkles, Send, Search, Filter, Settings, Trash2
} from 'lucide-react';
import { analyzeConstructionData } from './services/geminiService';
import { apiService } from './services/apiService';
import { Project, InventoryItem, FinanceRecord, StockLog, SystemLog, Role, AppState } from './types';

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

const App = () => {
  const [currentUser, setCurrentUser] = useState<Role>(ROLES.ADMIN);
  const [activeTab, setActiveTab] = useState('inventory'); // 默认切到仓库方便查看
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  
  // Modal States
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState<'in' | 'out'>('in');
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [stockAmount, setStockAmount] = useState<number>(0);
  const [targetProjectId, setTargetProjectId] = useState<number>(0);

  // AI States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [projectsData, inventoryData, financeData, stockData] = await Promise.all([
          apiService.getProjects().catch(() => []) as Promise<Project[]>,
          apiService.getInventory().catch(() => []) as Promise<InventoryItem[]>,
          apiService.getFinanceRecords().catch(() => []) as Promise<FinanceRecord[]>,
          apiService.getStockLogs().catch(() => []) as Promise<StockLog[]>
        ]);
        
        const projects = Array.isArray(projectsData) ? projectsData : [];
        const inventory = Array.isArray(inventoryData) ? inventoryData : [];
        const finance = Array.isArray(financeData) ? financeData : [];
        const stock = Array.isArray(stockData) ? stockData : [];
        
        setProjects(projects);
        setInventory(inventory);
        setFinanceRecords(finance);
        setStockLogs(stock);
        
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

      const newLog = await apiService.createStockLog(stockLogData);
      
      // 如果是入库，立即更新库存显示
      if (stockModalType === 'in') {
        setInventory(prev => prev.map(item => 
          item.id === selectedItemId 
            ? { ...item, quantity: item.quantity + stockAmount }
            : item
        ));
      }
      
      // 更新日志列表
      setStockLogs(prev => [newLog, ...prev]);
      
      // 如果是出库，显示提示信息
      if (stockModalType === 'out') {
        alert("出库申请已提交，等待项目经理审核。");
      }
      
      // Close & Reset
      setIsStockModalOpen(false);
      setStockAmount(0);
    } catch (error: any) {
      alert(error.message || "操作失败，请稍后重试。");
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

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[
        { title: '在建项目', value: projects.length, icon: Building2, color: 'blue' },
        { title: '累计出库量', value: stockLogs.filter(l => l.type === 'out').reduce((acc, curr) => acc + curr.qty, 0), icon: ArrowRightLeft, color: 'orange' },
        { title: '库存预警', value: inventory.filter(i => i.quantity < i.threshold).length, icon: AlertTriangle, color: 'red' },
        { title: 'AI 建议', value: '3条', icon: Sparkles, color: 'purple' },
      ].map((s, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
          <div className={`p-3 rounded-xl bg-${s.color}-50 text-${s.color}-600`}>
            <s.icon size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">{s.title}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Stock Modal */}
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
            { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
            { id: 'projects', label: '项目管理', icon: Building2 },
            { id: 'inventory', label: '物料仓库', icon: Package },
            { id: 'finance', label: '财务收支', icon: Wallet },
            { id: 'history', label: '操作日志', icon: History },
            { id: 'ai', label: 'AI 决策室', icon: BrainCircuit, special: true },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
          {!isLoading && activeTab === 'dashboard' && <><StatsCards /> <div className="p-20 text-center text-slate-400">仪表盘概览模块</div></>}
          
          {!isLoading && activeTab === 'inventory' && (
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
                      <button 
                        onClick={() => { setStockModalType('in'); setIsStockModalOpen(true); }}
                        className="px-4 py-2 border border-green-200 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-100 transition-colors shadow-sm"
                      >
                        <Plus size={16}/> 入库登记
                      </button>
                      <button 
                        onClick={() => { setStockModalType('out'); setIsStockModalOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                      >
                        <ArrowRightLeft size={16}/> 出库申请
                      </button>
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
                          <th className="px-6 py-4 font-bold">当前状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm">
                        {inventory.map(item => (
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
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
               
               {/* 简易操作日志 */}
               {stockLogs.length > 0 && (
                 <div className="bg-white rounded-2xl border p-6 shadow-sm">
                   <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><History size={18}/> 最近出入库流水</h3>
                   <div className="space-y-3">
                     {stockLogs.map(log => (
                       <div key={log.id} className="flex items-center justify-between py-3 border-b border-dashed last:border-0">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${log.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                              {log.type === 'in' ? <Plus size={14}/> : <ArrowRightLeft size={14}/>}
                            </div>
                            <div>
                              <p className="text-sm font-bold">
                                {log.type === 'in' ? '物料入库' : '物料出库'} - {inventory.find(i => i.id === log.itemId)?.name}
                              </p>
                              <p className="text-xs text-slate-400">{log.date} · 操作员: {log.creator}</p>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className={`font-bold ${log.type === 'in' ? 'text-green-600' : 'text-blue-600'}`}>
                             {log.type === 'in' ? '+' : '-'}{log.qty} {inventory.find(i => i.id === log.itemId)?.unit}
                           </p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          )}

          {!isLoading && activeTab === 'ai' && (
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
        </div>
      </main>
    </div>
  );
};

export default App;
