import React, { useState, useEffect } from 'react';
import { Building2, X, Edit, Trash2, FileEdit } from 'lucide-react';
import { Project, FinanceRecord, StockLog, InventoryItem } from '../../types';
import { apiService, type ChangeOrderType } from '../../services/apiService';
import MilestoneList from './MilestoneList';
import MilestoneGantt from './MilestoneGantt';
import PaymentPlanList from './PaymentPlanList';
import ProjectDocumentList from './ProjectDocumentList';
import ProjectFinance from './ProjectFinance';

interface ProjectDetailProps {
  project: Project;
  financeRecords: FinanceRecord[];
  stockLogs: StockLog[];
  inventory?: InventoryItem[];
  onClose: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: number) => void;
  onMilestoneUpdate?: () => void | Promise<void>;
  canEditMilestones?: boolean;
}

const API_BASE = '/api';

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  financeRecords,
  stockLogs,
  inventory = [],
  onClose,
  onEdit,
  onDelete,
  onMilestoneUpdate,
  canEditMilestones,
}) => {
  const [outboundAmount, setOutboundAmount] = useState<number>(0);
  const [changeOrders, setChangeOrders] = useState<ChangeOrderType[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/projects/${project.id}/outbound-sum`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setOutboundAmount(Number(data.outboundAmount) || 0);
      } catch {
        if (!cancelled) setOutboundAmount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  useEffect(() => {
    let cancelled = false;
    apiService
      .getChangeOrders({ projectId: project.id })
      .then((data) => {
        if (!cancelled) setChangeOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setChangeOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  // 计算项目总成本
  const totalCost = project.materialCost + project.laborCost + project.otherCost;
  const profit = project.receivedAmount - totalCost;
  const profitMargin =
    project.contractAmount > 0
      ? (((project.receivedAmount - totalCost) / project.contractAmount) * 100).toFixed(1)
      : '0';

  // 获取项目关联的物料使用记录
  const projectStockLogs = stockLogs.filter((log) => log.projectId === project.id);

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
          <Building2 size={28} />
          {project.name}
        </h2>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(project)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit size={16} />
              编辑项目
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm(`确定要删除项目 "${project.name}" 吗？此操作不可恢复。`)) {
                  onDelete(project.id);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              删除项目
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <X size={16} />
            返回
          </button>
        </div>
      </div>

      {/* 项目基本信息卡片 */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4">项目基本信息</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">合同金额</p>
            <p className="text-lg font-bold text-blue-600">￥{project.contractAmount.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">已收款</p>
            <p className="text-lg font-bold text-green-600">￥{project.receivedAmount.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">项目进度</p>
            <p className="text-lg font-bold text-purple-600">{project.progress}%</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">项目状态</p>
            <p className="text-lg font-bold text-orange-600">{project.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">项目编号</p>
              <p className="text-slate-700 font-mono">{project.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">项目经理</p>
              <p className="text-slate-700">{project.managerId || '未指定'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">开始日期</p>
                <p className="text-slate-700">{project.startDate || '未设置'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">结束日期</p>
                <p className="text-slate-700">{project.endDate || '未设置'}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">项目进度</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all" style={{ width: `${project.progress}%` }}></div>
                </div>
                <span className="text-sm font-bold text-slate-600 w-12">{project.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 项目成本分析卡片 */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4">项目成本分析</h3>
        {project.materialCostFromFinance != null ||
        project.materialCostFromStock != null ||
        project.materialCostTotal != null ? (
          <>
            <div className="mb-4 p-4 bg-slate-50 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">材料成本口径（数据来源）</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">来自财务支出</p>
                  <p className="text-lg font-bold text-slate-700">
                    ￥{(project.materialCostFromFinance ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">已审批且成本类型=材料的支出汇总</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">来自出库领用</p>
                  <p className="text-lg font-bold text-slate-700">
                    ￥{(project.materialCostFromStock ?? outboundAmount ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">已审批出库 qty×price 汇总</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-slate-500 mb-1">材料成本合计</p>
                  <p className="text-lg font-bold text-amber-700">
                    ￥{(project.materialCostTotal ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">财务 + 出库，账实相符</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">人工成本</p>
                <p className="text-lg font-bold text-slate-700">￥{project.laborCost.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">其他成本</p>
                <p className="text-lg font-bold text-slate-700">￥{project.otherCost.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">总成本</p>
                <p className="text-lg font-bold text-slate-700">￥{totalCost.toLocaleString()}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">材料成本</p>
              <p className="text-lg font-bold text-slate-700">￥{project.materialCost.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">人工成本</p>
              <p className="text-lg font-bold text-slate-700">￥{project.laborCost.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">其他成本</p>
              <p className="text-lg font-bold text-slate-700">￥{project.otherCost.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">总成本</p>
              <p className="text-lg font-bold text-slate-700">￥{totalCost.toLocaleString()}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-amber-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">出库材料金额</p>
            <p className="text-lg font-bold text-amber-700">￥{outboundAmount.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">已审批出库汇总</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">总项目收入</p>
            <p className="text-lg font-bold text-green-600">￥{project.receivedAmount.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">已审批收入汇总</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">净利润</p>
            <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ￥{profit.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">利润率</p>
            <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitMargin}%</p>
          </div>
        </div>
        {project.totalBudget != null && project.totalBudget > 0 && (
          <div className="mt-6 p-4 rounded-xl border-2 border-slate-200 bg-slate-50">
            <p className="text-sm font-bold text-slate-700 mb-3">控制预算 vs 实际成本</p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-slate-600">预算 ￥{(project.totalBudget ?? 0).toLocaleString()}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-700 font-medium">
                实际 ￥{(project.actualCostTotal ?? 0).toLocaleString()}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-700">
                使用比例 {project.budgetRatio != null ? (project.budgetRatio * 100).toFixed(1) : '0'}%
              </span>
              {(project.budgetAlertStatus === 'yellow' || project.budgetAlertStatus === 'red') && (
                <>
                  <span className="text-slate-400">|</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold ${project.budgetAlertStatus === 'red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${project.budgetAlertStatus === 'red' ? 'bg-red-500' : 'bg-amber-500'}`}
                    />
                    {project.budgetAlertStatus === 'red' ? '已超预算' : '预算预警（≥80%）'}
                  </span>
                </>
              )}
              {project.budgetAlertStatus === 'green' && (
                <>
                  <span className="text-slate-400">|</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    预算正常
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 物料使用情况 */}
      {projectStockLogs.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-700 mb-4">物料使用情况</h3>
          <div className="space-y-2">
            {projectStockLogs.map((log) => {
              const item = inventory.find((i) => i.id === log.itemId);
              const displayName = item
                ? item.spec
                  ? `${item.name}（${item.spec}）`
                  : item.name
                : `物料ID: ${log.itemId}`;
              return (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{displayName}</p>
                    <p className="text-xs text-slate-500">
                      {log.date} · 操作员: {log.creator}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    -{log.qty} {item?.unit || '单位'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 里程碑列表 */}
      <MilestoneList
        projectId={project.id}
        milestones={project.milestones || []}
        onRefresh={onMilestoneUpdate}
        canEdit={canEditMilestones}
      />

      {/* 里程碑甘特图（P2-2 仅展示） */}
      <MilestoneGantt
        projectName={project.name}
        startDate={project.startDate || ''}
        endDate={project.endDate || null}
        milestones={project.milestones || []}
      />

      {/* 回款计划：入口为 项目 → 点进某个项目 → 详情页里的回款计划区块 */}
      <PaymentPlanList projectId={project.id} />

      {/* 项目文档清单（P2-1） */}
      <ProjectDocumentList projectId={project.id} />

      {/* 项目财务关联 */}
      <ProjectFinance projectId={project.id} financeRecords={financeRecords} />

      {/* 关联变更单 */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileEdit size={18} /> 关联变更单
        </h3>
        {changeOrders.length === 0 ? (
          <p className="text-slate-500 text-sm">该项目暂无变更/签证单</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-left">
                  <th className="py-2 px-3">事由</th>
                  <th className="py-2 px-3 text-right">预估增加金额</th>
                  <th className="py-2 px-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {changeOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100">
                    <td className="py-2 px-3 text-slate-700">{order.reason}</td>
                    <td className="py-2 px-3 text-right font-medium">￥{Number(order.amount).toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          order.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {order.status === 'approved' ? '已通过' : order.status === 'rejected' ? '已拒绝' : '待审批'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
