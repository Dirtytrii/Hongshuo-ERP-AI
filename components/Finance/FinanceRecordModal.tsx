import React from 'react';
import { Wallet, X } from 'lucide-react';
import type { Department, Project } from '../../types';
import SearchableSelect from '../ui/SearchableSelect';

export interface FinanceRecordForm {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  projectId: number | null;
  departmentId: number | null;
  paymentPlanItemId: number | null;
  supplierId: number | null;
  desc: string;
}

interface FinanceCategoryOption {
  code: string;
  label: string;
  costType: string;
}

interface PaymentPlanOption {
  id: number;
  name: string;
}

interface SupplierOption {
  id: number;
  name: string;
}

interface FinanceRecordModalProps {
  financeForm: FinanceRecordForm;
  financeCategories: FinanceCategoryOption[];
  paymentPlanOptionsForFinance: PaymentPlanOption[];
  projects: Project[];
  departments: Department[];
  suppliers: SupplierOption[];
  onFinanceFormChange: (form: FinanceRecordForm) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

const FinanceRecordModal: React.FC<FinanceRecordModalProps> = ({
  financeForm,
  financeCategories,
  paymentPlanOptionsForFinance,
  projects,
  departments,
  suppliers,
  onFinanceFormChange,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 flex items-center justify-between text-white bg-green-600">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Wallet size={20} />
            新增财务记录
          </h3>
          <button type="button" onClick={onClose} className="hover:rotate-90 transition-transform" aria-label="关闭">
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
              onChange={(value) => {
                const newType = value as 'income' | 'expense';
                onFinanceFormChange({
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
                  : financeCategories.map((category) => ({ value: category.code, label: category.label }))
              }
              value={financeForm.category}
              onChange={(value) => onFinanceFormChange({ ...financeForm, category: String(value) })}
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
              onChange={(event) => onFinanceFormChange({ ...financeForm, amount: Number(event.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">关联项目（可选）</label>
            <SearchableSelect
              options={[
                { value: '', label: '不关联项目' },
                ...projects.map((project) => ({ value: project.id, label: project.name })),
              ]}
              value={financeForm.projectId ?? ''}
              onChange={(value) =>
                onFinanceFormChange({
                  ...financeForm,
                  projectId: value === '' ? null : Number(value),
                  paymentPlanItemId: null,
                })
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
                ...departments.map((department) => ({
                  value: department.id,
                  label: `${department.name}(${department.code})`,
                })),
              ]}
              value={financeForm.departmentId ?? ''}
              onChange={(value) =>
                onFinanceFormChange({ ...financeForm, departmentId: value === '' ? null : Number(value) })
              }
              placeholder="请选择或检索部门..."
              inputClassName="focus:ring-green-500 focus:border-green-500"
              maxHeight="240px"
            />
          </div>
          {financeForm.type === 'income' && financeForm.projectId != null && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">计入回款计划节点（可选）</label>
              <SearchableSelect
                options={[
                  { value: '', label: '不计入节点' },
                  ...paymentPlanOptionsForFinance.map((paymentPlan) => ({
                    value: paymentPlan.id,
                    label: paymentPlan.name,
                  })),
                ]}
                value={financeForm.paymentPlanItemId ?? ''}
                onChange={(value) =>
                  onFinanceFormChange({ ...financeForm, paymentPlanItemId: value === '' ? null : Number(value) })
                }
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
                ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
              ]}
              value={financeForm.supplierId ?? ''}
              onChange={(value) =>
                onFinanceFormChange({ ...financeForm, supplierId: value === '' ? null : Number(value) })
              }
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
              onChange={(event) => onFinanceFormChange({ ...financeForm, desc: event.target.value })}
            />
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
              className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg hover:bg-green-700 transition-transform active:scale-95"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceRecordModal;
