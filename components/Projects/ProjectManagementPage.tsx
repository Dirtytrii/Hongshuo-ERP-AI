import React from 'react';
import { Building2, Download, Eye, LayoutGrid, List, Plus } from 'lucide-react';
import type { FinanceRecord, InventoryItem, Project, StockLog } from '../../types';
import { STATUS_COLORS } from '../../app/config/appDefaults';
import { downloadProjectImportTemplate, exportProjectsToExcel } from '../../utils/export';
import ProjectDetail from '../ProjectDetail/ProjectDetail';
import ProjectKanban from './ProjectKanban';

interface ProjectManagementPageProps {
  projects: Project[];
  selectedProjectId: number | null;
  selectedProjectDetail: Project | null;
  financeRecords: FinanceRecord[];
  stockLogs: StockLog[];
  inventory: InventoryItem[];
  projectViewMode: 'table' | 'kanban';
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  onChangeViewMode: (mode: 'table' | 'kanban') => void;
  onSelectProject: (projectId: number) => void;
  onCloseDetail: () => void;
  onOpenProjectModal: (project?: Project) => void;
  onDeleteProject: (projectId: number) => void;
  onRefreshMilestones?: () => Promise<void>;
  onImportProjects: () => void;
}

const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({
  projects,
  selectedProjectId,
  selectedProjectDetail,
  financeRecords,
  stockLogs,
  inventory,
  projectViewMode,
  canCreateProject,
  canEditProject,
  canDeleteProject,
  onChangeViewMode,
  onSelectProject,
  onCloseDetail,
  onOpenProjectModal,
  onDeleteProject,
  onRefreshMilestones,
  onImportProjects,
}) => {
  if (selectedProjectDetail) {
    return (
      <div className="space-y-6">
        <ProjectDetail
          project={selectedProjectDetail}
          financeRecords={financeRecords}
          stockLogs={stockLogs}
          inventory={inventory}
          onClose={onCloseDetail}
          onEdit={
            canEditProject
              ? (project) => {
                  onCloseDetail();
                  onOpenProjectModal(project);
                }
              : undefined
          }
          onDelete={
            canDeleteProject
              ? (projectId) => {
                  onDeleteProject(projectId);
                  onCloseDetail();
                }
              : undefined
          }
          onMilestoneUpdate={selectedProjectId ? onRefreshMilestones : undefined}
          canEditMilestones={canEditProject}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <Building2 size={18} /> 项目管理
          </h3>
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => onChangeViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                projectViewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List size={14} /> 列表
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                projectViewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={14} /> 看板
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportProjectsToExcel(projects)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Download size={16} /> 导出 Excel
          </button>
          {canCreateProject && (
            <>
              <button
                type="button"
                onClick={downloadProjectImportTemplate}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                下载模板
              </button>
              <button
                type="button"
                onClick={onImportProjects}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                导入 Excel
              </button>
              <button
                type="button"
                onClick={() => onOpenProjectModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Plus size={16} /> 新建项目
              </button>
            </>
          )}
        </div>
      </div>

      {projectViewMode === 'kanban' && <ProjectKanban projects={projects} onSelect={onSelectProject} />}

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
                      <td className="px-6 py-4 text-slate-600 font-mono">￥{project.contractAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-green-600 font-mono">￥{project.receivedAmount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 h-full transition-all" style={{ width: `${project.progress}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-12">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            STATUS_COLORS[project.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{project.startDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectProject(project.id)}
                            className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1"
                          >
                            <Eye size={14} /> 查看
                          </button>
                          {canEditProject && (
                            <button
                              type="button"
                              onClick={() => onOpenProjectModal(project)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                            >
                              编辑
                            </button>
                          )}
                          {canDeleteProject && (
                            <button
                              type="button"
                              onClick={() => onDeleteProject(project.id)}
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
  );
};

export default ProjectManagementPage;
