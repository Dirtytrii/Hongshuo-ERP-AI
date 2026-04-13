import React from 'react';
import { AlertTriangle, Check, Download, Package, Plus } from 'lucide-react';
import type { InventoryItem } from '../../types';

interface InventoryManagementPageProps {
  inventory: InventoryItem[];
  canCreateInventory: boolean;
  canEditInventory: boolean;
  canDeleteInventory: boolean;
  onExport: () => void;
  onDownloadTemplate: () => void;
  onImport: () => void;
  onCreate: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => Promise<void>;
}

const InventoryManagementPage: React.FC<InventoryManagementPageProps> = ({
  inventory,
  canCreateInventory,
  canEditInventory,
  canDeleteInventory,
  onExport,
  onDownloadTemplate,
  onImport,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const showImportActions = canEditInventory || canCreateInventory;
  const showActionColumn = canEditInventory || canDeleteInventory;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <Package size={18} /> 物料管理
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExport}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Download size={16} /> 导出 Excel
            </button>
            {showImportActions && (
              <>
                <button
                  type="button"
                  onClick={onDownloadTemplate}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  下载模板
                </button>
                <button
                  type="button"
                  onClick={onImport}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  导入 Excel
                </button>
                <button
                  type="button"
                  onClick={onCreate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg"
                >
                  <Plus size={16} /> 新建物料
                </button>
              </>
            )}
          </div>
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
                {showActionColumn && <th className="px-6 py-4 font-bold">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={showActionColumn ? 8 : 7} className="px-6 py-12 text-center text-slate-400">
                    暂无物料，点击“新建物料”开始录入。
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{item.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{item.spec}</td>
                    <td className="px-6 py-4 text-slate-600">{item.unit}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono">RMB {item.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold ${item.quantity < item.threshold ? 'text-red-500' : 'text-slate-800'}`}
                      >
                        {item.quantity.toLocaleString()} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.threshold.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      {item.quantity < item.threshold ? (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-red-100">
                          <AlertTriangle size={12} /> 低于安全值
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-green-100">
                          <Check size={12} /> 供应充足
                        </span>
                      )}
                    </td>
                    {showActionColumn && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {canEditInventory && (
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                            >
                              编辑
                            </button>
                          )}
                          {canDeleteInventory && (
                            <button
                              type="button"
                              onClick={() => void onDelete(item)}
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
  );
};

export default InventoryManagementPage;
