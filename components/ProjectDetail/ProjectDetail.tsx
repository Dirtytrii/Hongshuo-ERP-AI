import React from 'react';
import { Building2, X, Edit, Trash2 } from 'lucide-react';
import { Project, FinanceRecord, StockLog } from '../../types';
import MilestoneList from './MilestoneList';
import ProjectFinance from './ProjectFinance';

interface ProjectDetailProps {
  project: Project;
  financeRecords: FinanceRecord[];
  stockLogs: StockLog[];
  onClose: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: number) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ 
  project, 
  financeRecords, 
  stockLogs,
  onClose, 
  onEdit,
  onDelete 
}) => {
  // 计算项目总成本
  const totalCost = project.materialCost + project.laborCost + project.otherCost;
  const profit = project.receivedAmount - totalCost;
  const profitMargin = project.contractAmount > 0 ? ((project.receivedAmount - totalCost) / project.contractAmount * 100).toFixed(1) : '0';

  // 获取项目关联的物料使用记录
  const projectStockLogs = stockLogs.filter(log => log.projectId === project.id);

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
      <div className="bg-white rounded-2xl border shadow-sm p-6">
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
                  <div 
                    className="bg-blue-600 h-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-slate-600 w-12">{project.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 项目成本分析卡片 */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4">项目成本分析</h3>
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
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">净利润</p>
            <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ￥{profit.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">利润率</p>
            <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin}%
            </p>
          </div>
        </div>
      </div>

      {/* 物料使用情况 */}
      {projectStockLogs.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-700 mb-4">物料使用情况</h3>
          <div className="space-y-2">
            {projectStockLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">物料ID: {log.itemId}</p>
                  <p className="text-xs text-slate-500">{log.date} · 操作员: {log.creator}</p>
                </div>
                <span className="text-sm font-bold text-blue-600">
                  -{log.qty} 单位
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 里程碑列表 */}
      <MilestoneList 
        projectId={project.id} 
        milestones={project.milestones || []}
        onRefresh={() => window.location.reload()} // 临时方案，后续可以优化
      />

      {/* 项目财务关联 */}
      <ProjectFinance 
        projectId={project.id} 
        financeRecords={financeRecords}
      />
    </div>
  );
};

export default ProjectDetail;
