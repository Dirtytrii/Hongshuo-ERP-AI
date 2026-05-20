import React from 'react';
import { Building2, X } from 'lucide-react';
import type { Project } from '../../types';
import SearchableSelect from '../ui/SearchableSelect';

export interface ProjectFormValues {
  name: string;
  code: string;
  managerId: string;
  contractAmount: number;
  receivedAmount: number;
  materialCost: number;
  laborCost: number;
  otherCost: number;
  totalBudget: number | '';
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
}

interface UserOption {
  id: number;
  username: string;
}

interface ProjectFormModalProps {
  projectForm: ProjectFormValues;
  editingProject: Project | null;
  userOptions: UserOption[];
  onProjectFormChange: (form: ProjectFormValues) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

const PROJECT_STATUS_OPTIONS = [
  { value: '施工中', label: '施工中' },
  { value: '验收中', label: '验收中' },
  { value: '已完工', label: '已完工' },
];

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  projectForm,
  editingProject,
  userOptions,
  onProjectFormChange,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(editingProject);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 flex items-center justify-between text-white bg-blue-600">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Building2 size={20} />
            {isEditing ? '编辑项目' : '新建项目'}
          </h3>
          <button type="button" onClick={onClose} className="hover:rotate-90 transition-transform" aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-name" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                项目名称 *
              </label>
              <input
                id="project-name"
                type="text"
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={projectForm.name}
                onChange={(event) => onProjectFormChange({ ...projectForm, name: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="project-code" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                项目编号 *
              </label>
              <input
                id="project-code"
                type="text"
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={projectForm.code}
                onChange={(event) => onProjectFormChange({ ...projectForm, code: event.target.value })}
                disabled={isEditing}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目经理 *</label>
              <SearchableSelect
                options={userOptions.map((user) => ({ value: user.username, label: user.username }))}
                value={projectForm.managerId}
                onChange={(value) => onProjectFormChange({ ...projectForm, managerId: String(value) })}
                placeholder="请选择用户..."
                maxHeight="200px"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">项目状态</label>
              <SearchableSelect
                options={PROJECT_STATUS_OPTIONS}
                value={projectForm.status}
                onChange={(value) => onProjectFormChange({ ...projectForm, status: String(value) })}
                placeholder="请选择状态..."
                maxHeight="180px"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="project-contract-amount"
                className="block text-xs font-bold text-slate-400 uppercase mb-2"
              >
                合同金额
              </label>
              <input
                id="project-contract-amount"
                type="number"
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={projectForm.contractAmount}
                onChange={(event) =>
                  onProjectFormChange({ ...projectForm, contractAmount: Number(event.target.value) })
                }
              />
            </div>
            <div>
              <label htmlFor="project-total-budget" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                控制预算（可选）
              </label>
              <input
                id="project-total-budget"
                type="number"
                min={0}
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={projectForm.totalBudget === '' ? '' : projectForm.totalBudget}
                onChange={(event) =>
                  onProjectFormChange({
                    ...projectForm,
                    totalBudget: event.target.value === '' ? '' : Number(event.target.value),
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
              <label htmlFor="project-start-date" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                开始日期
              </label>
              <input
                id="project-start-date"
                type="date"
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={projectForm.startDate}
                onChange={(event) => onProjectFormChange({ ...projectForm, startDate: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="project-end-date" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                结束日期
              </label>
              <input
                id="project-end-date"
                type="date"
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={projectForm.endDate}
                onChange={(event) => onProjectFormChange({ ...projectForm, endDate: event.target.value })}
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => void onSubmit()}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
            >
              {isEditing ? '更新' : '创建'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;
