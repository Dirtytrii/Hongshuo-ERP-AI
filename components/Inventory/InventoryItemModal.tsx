import React from 'react';
import { Package, X } from 'lucide-react';
import type { InventoryItem } from '../../types';

export type InventoryItemForm = Omit<InventoryItem, 'id'>;

interface InventoryItemModalProps {
  inventoryForm: InventoryItemForm;
  editingInventoryItem: InventoryItem | null;
  onInventoryFormChange: (form: InventoryItemForm) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  inventoryForm,
  editingInventoryItem,
  onInventoryFormChange,
  onClose,
  onSubmit,
}) => {
  const updateForm = <K extends keyof InventoryItemForm>(field: K, value: InventoryItemForm[K]) => {
    onInventoryFormChange({ ...inventoryForm, [field]: value });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 flex items-center justify-between text-white bg-purple-600">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Package size={20} />
            {editingInventoryItem ? '编辑物料' : '新建物料'}
          </h3>
          <button type="button" onClick={onClose} className="hover:rotate-90 transition-transform" aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="inventory-name" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  物料名称 *
                </label>
                <input
                  id="inventory-name"
                  type="text"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                  value={inventoryForm.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  placeholder="如：42.5级硅酸盐水泥"
                />
              </div>
              <div>
                <label htmlFor="inventory-spec" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  规格参数 *
                </label>
                <input
                  id="inventory-spec"
                  type="text"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                  value={inventoryForm.spec}
                  onChange={(event) => updateForm('spec', event.target.value)}
                  placeholder="如：Φ12"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="inventory-unit" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  单位 *
                </label>
                <input
                  id="inventory-unit"
                  type="text"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                  value={inventoryForm.unit}
                  onChange={(event) => updateForm('unit', event.target.value)}
                  placeholder="如：袋、吨、立方米"
                />
              </div>
              <div>
                <label htmlFor="inventory-price" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  参考单价（元）
                </label>
                <input
                  id="inventory-price"
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                  value={inventoryForm.price}
                  onChange={(event) => updateForm('price', Number(event.target.value))}
                />
              </div>
              <div>
                <label htmlFor="inventory-quantity" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  初始库存数量
                </label>
                <input
                  id="inventory-quantity"
                  type="number"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                  value={inventoryForm.quantity}
                  onChange={(event) => updateForm('quantity', Number(event.target.value))}
                />
              </div>
            </div>
            <div>
              <label htmlFor="inventory-threshold" className="block text-xs font-bold text-slate-400 uppercase mb-2">
                低库存预警阈值 *
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="inventory-threshold"
                  type="number"
                  className="flex-1 bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                  value={inventoryForm.threshold}
                  onChange={(event) => updateForm('threshold', Number(event.target.value))}
                  placeholder="当库存低于此值时显示预警"
                />
                <span className="text-sm text-slate-500">{inventoryForm.unit || '单位'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">当物料数量低于此阈值时，系统会显示低库存警告</p>
            </div>
          </div>
          <div className="p-6 border-t flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg hover:bg-purple-700 transition-transform active:scale-95"
            >
              {editingInventoryItem ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryItemModal;
