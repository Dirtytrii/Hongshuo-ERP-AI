
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, HardHat, Package, 
  Plus, Clock, TrendingUp, AlertTriangle, 
  ChevronRight, ArrowRightLeft, 
  X, Check, Building2, 
  History, BrainCircuit, Sparkles, Send, Search, Filter, Settings
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Data States
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: '宏硕·云端大厦', code: 'HS-2024-001', managerId: 'pm', contractAmount: 5000000, receivedAmount: 2000000, materialCost: 1200000, laborCost: 800000, otherCost: 100000, status: '施工中', progress: 45, startDate: '2024-01-10', endDate: '2024-12-30', milestones: [] }
  ]);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 1, name: '42.5级硅酸盐水泥', spec: '50kg/袋', unit: '袋', price: 28, quantity: 1500, threshold: 200 },
    { id: 2, name: '螺纹钢 Φ12', spec: '12m/根', unit: '吨', price: 3850, quantity: 45, threshold: 10 }
  ]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  
  // AI States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Implement handleAiAnalysis to process AI queries with construction data
  const handleAiAnalysis = async () => {
    if (!aiPrompt.trim() || isAiThinking) return;
    
    setIsAiThinking(true);
    setAiResponse(null);
    
    try {
      const data: AppState = {
        projects,
        inventory,
        financeRecords,
        stockLogs
      };
      
      const result = await analyzeConstructionData(aiPrompt, data);
      setAiResponse(result);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAiResponse("抱歉，分析过程中出现了问题。请确认网络连接与 API 密钥。");
    } finally {
      setIsAiThinking(false);
    }
  };

  // 渲染统计卡片
  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[
        { title: '在建项目', value: projects.length, icon: Building2, color: 'blue' },
        { title: '本月支出', value: '￥24.5万', icon: Wallet, color: 'orange' },
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

        <div className="p-4 border-t">
          <button 
            onClick={() => setActiveTab('settings')}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
              {currentUser.name.slice(0, 1)}
            </div>
            {isSidebarOpen && (
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.label}</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">
              {activeTab === 'dashboard' && '运行看板'}
              {activeTab === 'projects' && '项目实时监控'}
              {activeTab === 'inventory' && '仓库物料清单'}
              {activeTab === 'finance' && '财务收支审计'}
              {activeTab === 'ai' && 'AI 智能战略分析'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 border">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-slate-600">后端连接正常</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <>
              <StatsCards />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} /> 最近财务动态</h3>
                  <div className="space-y-4">
                    {financeRecords.length === 0 ? <p className="text-slate-400 text-sm py-10 text-center italic">暂无收支记录</p> : null}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><History size={18} /> 系统操作日志</h3>
                  <div className="space-y-4">
                    {/* Log items placeholder */}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                   <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input className="pl-10 pr-4 py-2 bg-white border rounded-xl text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="搜索项目名称或编号..." />
                   </div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-md">
                   <Plus size={18} /> 立项登记
                </button>
              </div>
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-slate-500 text-sm">
                    <tr>
                      <th className="px-6 py-4 font-semibold">项目名称/编号</th>
                      <th className="px-6 py-4 font-semibold">状态</th>
                      <th className="px-6 py-4 font-semibold">成本消耗</th>
                      <th className="px-6 py-4 font-semibold">当前进度</th>
                      <th className="px-6 py-4 font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {projects.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.code}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-700">￥{((p.materialCost + p.laborCost) / 10000).toFixed(1)}万</p>
                          <p className="text-xs text-slate-400">总包: {p.contractAmount / 10000}万</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500" style={{width: `${p.progress}%`}}></div>
                          </div>
                          <p className="text-xs mt-1 text-slate-400">{p.progress}%</p>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:underline">详情</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                      <Package className="absolute right-[-10px] top-[-10px] opacity-10" size={120} />
                      <p className="text-blue-100 text-sm">总物料种类</p>
                      <p className="text-3xl font-bold">{inventory.length} 种</p>
                  </div>
                  <div className="bg-white border p-6 rounded-2xl flex justify-between items-center">
                     <div>
                        <p className="text-slate-500 text-sm">低库存预警</p>
                        <p className="text-3xl font-bold text-red-500">{inventory.filter(i => i.quantity < i.threshold).length}</p>
                     </div>
                     <div className="p-3 bg-red-50 text-red-500 rounded-xl"><AlertTriangle size={24}/></div>
                  </div>
                  <div className="bg-white border p-6 rounded-2xl flex justify-between items-center">
                     <div>
                        <p className="text-slate-500 text-sm">本月入库量</p>
                        <p className="text-3xl font-bold text-green-500">1,240</p>
                     </div>
                     <div className="p-3 bg-green-50 text-green-500 rounded-xl"><ArrowRightLeft size={24}/></div>
                  </div>
               </div>
               
               <div className="bg-white rounded-2xl border overflow-hidden">
                  <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-bold">物料清单</h3>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 border rounded-xl text-sm flex items-center gap-2 hover:bg-slate-50"><Plus size={16}/> 入库</button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2 hover:bg-blue-700 shadow-md"><ArrowRightLeft size={16}/> 出库申请</button>
                    </div>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-slate-500 text-sm">
                      <tr>
                        <th className="px-6 py-4 font-semibold">物料名</th>
                        <th className="px-6 py-4 font-semibold">规格/单位</th>
                        <th className="px-6 py-4 font-semibold">单价</th>
                        <th className="px-6 py-4 font-semibold">库存余量</th>
                        <th className="px-6 py-4 font-semibold">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {inventory.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold">{item.name}</td>
                          <td className="px-6 py-4 text-slate-500">{item.spec} / {item.unit}</td>
                          <td className="px-6 py-4">￥{item.price}</td>
                          <td className="px-6 py-4 font-medium">{item.quantity}</td>
                          <td className="px-6 py-4">
                            {item.quantity < item.threshold ? (
                              <span className="flex items-center gap-1 text-red-600 font-bold"><AlertTriangle size={14}/> 补货预警</span>
                            ) : (
                              <span className="text-green-600 font-medium font-bold">充足</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="h-full flex flex-col max-w-4xl mx-auto space-y-6">
               <div className="bg-gradient-to-br from-indigo-700 to-blue-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                          <BrainCircuit size={28} />
                       </div>
                       <h2 className="text-2xl font-bold">宏硕 AI 决策官</h2>
                    </div>
                    <p className="text-indigo-100 max-w-lg mb-6">
                      接入最新的 Gemini 3 Pro 深度思考模型，我可以为您分析项目成本异常、库存供应风险以及预测现金流走势。
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {['分析项目成本', '库存预警分析', '战略优化建议', '合同风险检查'].map(s => (
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
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 animate-pulse">
                            <BrainCircuit size={20} />
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-slate-600 text-sm border">
                            <p className="flex items-center gap-2">
                              <span className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                              </span>
                              正在进行深度推理与多维数据对齐 (Thinking Mode)...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {aiResponse && (
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg text-white">
                          <BrainCircuit size={20} />
                        </div>
                        <div className="bg-indigo-50 p-5 rounded-3xl rounded-tl-none text-slate-800 text-sm border border-indigo-100 leading-relaxed prose prose-indigo max-w-none shadow-sm">
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
                      className="flex-1 bg-white border rounded-2xl px-6 py-3 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                      placeholder="例如：帮我分析一下云端大厦项目的成本占比是否合理？"
                    />
                    <button 
                      onClick={handleAiAnalysis}
                      disabled={isAiThinking || !aiPrompt.trim()}
                      className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg"
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
