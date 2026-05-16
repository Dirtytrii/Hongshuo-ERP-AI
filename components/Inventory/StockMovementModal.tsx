import React from 'react';
import { ArrowRightLeft, Plus, X } from 'lucide-react';
import type { InventoryItem, Project } from '../../types';
import SearchableSelect from '../ui/SearchableSelect';

interface SupplierOption {
  id: number;
  name: string;
}

interface StockMovementModalProps {
  type: 'in' | 'out';
  inventory: InventoryItem[];
  projects: Project[];
  suppliers: SupplierOption[];
  selectedItemId: number;
  stockAmount: number;
  targetProjectId: number;
  stockSupplierId: number | null;
  onSelectedItemIdChange: (value: number) => void;
  onStockAmountChange: (value: number) => void;
  onTargetProjectIdChange: (value: number) => void;
  onStockSupplierIdChange: (value: number | null) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({
  type,
  inventory,
  projects,
  suppliers,
  selectedItemId,
  stockAmount,
  targetProjectId,
  stockSupplierId,
  onSelectedItemIdChange,
  onStockAmountChange,
  onTargetProjectIdChange,
  onStockSupplierIdChange,
  onClose,
  onSubmit,
}) => {
  const isStockIn = type === 'in';
  const selectedItem = inventory.find((item) => item.id === selectedItemId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div
          className={`p-6 flex items-center justify-between text-white ${isStockIn ? 'bg-green-600' : 'bg-blue-600'}`}
        >
          <h3 className="text-lg font-bold flex items-center gap-2">
            {isStockIn ? <Plus size={20} /> : <ArrowRightLeft size={20} />}
            物料{isStockIn ? '入库登记' : '出库申请'}
          </h3>
          <button type="button" onClick={onClose} className="hover:rotate-90 transition-transform" aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">选择物料</label>
            <SearchableSelect
              options={inventory.map((item) => ({ value: item.id, label: `${item.name} (${item.spec})` }))}
              value={selectedItemId}
              onChange={(value) => onSelectedItemIdChange(Number(value))}
              placeholder="请选择或输入检索物料..."
              maxHeight="240px"
            />
          </div>

          {!isStockIn && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">关联项目</label>
              <SearchableSelect
                options={projects.map((project) => ({ value: project.id, label: project.name }))}
                value={targetProjectId}
                onChange={(value) => onTargetProjectIdChange(Number(value))}
                placeholder="请选择或输入检索项目..."
                maxHeight="240px"
              />
            </div>
          )}
          {isStockIn && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">供应商（可选）</label>
              <SearchableSelect
                options={[
                  { value: '', label: '不关联供应商' },
                  ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
                ]}
                value={stockSupplierId ?? ''}
                onChange={(value) => onStockSupplierIdChange(value === '' ? null : Number(value))}
                placeholder="请选择或检索供应商..."
                maxHeight="240px"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              操作数量 ({selectedItem?.unit})
            </label>
            <input
              type="number"
              className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入数量..."
              value={stockAmount || ''}
              onChange={(event) => onStockAmountChange(Number(event.target.value))}
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
              className={`flex-1 px-4 py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${isStockIn ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              确认{isStockIn ? '入库' : '出库'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMovementModal;
