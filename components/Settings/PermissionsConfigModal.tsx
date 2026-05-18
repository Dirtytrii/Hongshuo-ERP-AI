import React from 'react';
import { Settings, X } from 'lucide-react';
import type { Role } from '../../types';

export interface PermissionsConfigForm {
  lowStockThreshold: string;
  largeExpenseThreshold: string;
}

interface PermissionsConfigModalProps {
  permissionsConfig: Record<string, string[]>;
  permissions: Record<string, string[]>;
  roleLabelMap: Record<string, Role>;
  configForm: PermissionsConfigForm;
  onPermissionChange: (permission: string, role: string, checked: boolean) => void;
  onConfigFormChange: (form: PermissionsConfigForm) => void;
  onClose: () => void;
  onCancel: () => void;
  onSave: () => void | Promise<void>;
}

const PAGE_PERMISSION_LABELS: Record<string, string> = {
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
  'reports.view': '报表页面',
  'history.view': '操作日志页面',
  'ai.view': 'AI 决策室页面',
  'users.view': '用户管理页面',
};

const ACTION_PERMISSION_LABELS: Record<string, string> = {
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

const PermissionsConfigModal: React.FC<PermissionsConfigModalProps> = ({
  permissionsConfig,
  permissions,
  roleLabelMap,
  configForm,
  onPermissionChange,
  onConfigFormChange,
  onClose,
  onCancel,
  onSave,
}) => {
  const roleIds = Object.keys(roleLabelMap);
  const pagePermissions = Object.keys(permissionsConfig).filter((permission) => permission.endsWith('.view'));
  const actionPermissions = Object.keys(permissionsConfig).filter((permission) => !permission.endsWith('.view'));

  const renderPermissionGroup = (permission: string, labelMap: Record<string, string>) => (
    <div key={permission} className="border border-slate-200 rounded-xl p-4">
      <h4 className="font-bold text-slate-700 mb-3">{labelMap[permission] || permission}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {roleIds.map((roleId) => {
          const role = roleLabelMap[roleId];
          return (
            <label key={role.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(permissions[permission] || []).includes(role.id)}
                onChange={(event) => onPermissionChange(permission, role.id, event.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700">{role.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        <div className="p-6 flex items-center justify-between text-white bg-purple-600">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Settings size={20} />
            权限管理
          </h3>
          <button type="button" onClick={onClose} className="hover:rotate-90 transition-transform" aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <p className="text-sm text-slate-600 mb-4">配置各角色的权限。勾选表示该角色拥有该权限。</p>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b pb-2">页面访问权限</h3>
              {pagePermissions.map((permission) => renderPermissionGroup(permission, PAGE_PERMISSION_LABELS))}
            </div>

            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-bold text-slate-700 border-b pb-2">功能操作权限</h3>
              {actionPermissions.map((permission) => renderPermissionGroup(permission, ACTION_PERMISSION_LABELS))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-700 mb-4">系统配置</h3>
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-4">
                  <label htmlFor="low-stock-threshold" className="block text-sm font-bold text-slate-700 mb-2">
                    低库存标准阈值
                  </label>
                  <input
                    id="low-stock-threshold"
                    type="number"
                    value={configForm.lowStockThreshold}
                    onChange={(event) => onConfigFormChange({ ...configForm, lowStockThreshold: event.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="默认: 100"
                  />
                  <p className="text-xs text-slate-500 mt-1">当物料数量低于此值时，系统会显示低库存警告</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-4">
                  <label htmlFor="large-expense-threshold" className="block text-sm font-bold text-slate-700 mb-2">
                    大额财务审批标准（元）
                  </label>
                  <input
                    id="large-expense-threshold"
                    type="number"
                    value={configForm.largeExpenseThreshold}
                    onChange={(event) =>
                      onConfigFormChange({ ...configForm, largeExpenseThreshold: event.target.value })
                    }
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
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg hover:bg-purple-700 transition-transform active:scale-95"
          >
            保存所有配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsConfigModal;
