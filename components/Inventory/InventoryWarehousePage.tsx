import React from 'react';
import { AlertTriangle, ArrowRightLeft, Check, Clock, History, Package, Plus, X } from 'lucide-react';
import type { InventoryItem, Project, StockLog } from '../../types';

interface InventoryWarehousePageProps {
  inventory: InventoryItem[];
  stockLogs: StockLog[];
  projects: Project[];
  currentUserId: string;
  currentUserName: string;
  authRole?: string;
  canCreateStockEntry: boolean;
  canRequestOutbound: boolean;
  canApproveOutbound: boolean;
  onOpenInbound: () => void;
  onOpenOutbound: () => void;
  onApproveStock: (logId: number, approved: boolean, note?: string) => Promise<void>;
  onApproveStockReversal: (logId: number, approved: boolean) => Promise<void>;
  onReverseStock: (logId: number) => Promise<void>;
}

const InventoryWarehousePage: React.FC<InventoryWarehousePageProps> = ({
  inventory,
  stockLogs,
  projects,
  currentUserId,
  currentUserName,
  authRole,
  canCreateStockEntry,
  canRequestOutbound,
  canApproveOutbound,
  onOpenInbound,
  onOpenOutbound,
  onApproveStock,
  onApproveStockReversal,
  onReverseStock,
}) => {
  const pendingOutboundLogs = stockLogs.filter(
    (log) => log.status === 'pending' && log.type === 'out' && !log.isReversal
  );
  const pendingReversalLogs = stockLogs.filter((log) => log.status === 'pending' && log.isReversal);
  const lowStockCount = inventory.filter((item) => item.quantity < item.threshold).length;
  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isAdmin = currentUserId === 'admin' || authRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
            <Package size={140} />
          </div>
          <p className="text-blue-100 text-sm">仓库物料总值</p>
          <p className="text-3xl font-bold">{(totalInventoryValue / 10000).toFixed(1)} 万</p>
        </div>
        <div className="bg-white border border-slate-100/80 p-6 rounded-3xl flex justify-between items-center hover:border-red-200 transition-colors">
          <div>
            <p className="text-slate-500 text-sm">低库存预警</p>
            <p className="text-3xl font-bold text-red-500">{lowStockCount}</p>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="bg-white border border-slate-100/80 p-6 rounded-3xl flex justify-between items-center hover:border-blue-200 transition-colors">
          <div>
            <p className="text-slate-500 text-sm">库存流水</p>
            <p className="text-3xl font-bold text-blue-600">{stockLogs.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ArrowRightLeft size={24} />
          </div>
        </div>
      </div>

      {canApproveOutbound && pendingOutboundLogs.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
            <Clock size={18} /> 待审批出库申请 ({pendingOutboundLogs.length})
          </h3>
          <div className="space-y-3">
            {pendingOutboundLogs.map((log) => {
              const item = inventory.find((inventoryItem) => inventoryItem.id === log.itemId);
              const project = projects.find((projectItem) => projectItem.id === log.projectId);

              return (
                <div key={log.id} className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">物料出库 - {item?.name || '未知物料'}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {log.date} 路 申请人 {log.creator} 路 关联项目: {project?.name || '未指定'}
                      </p>
                      <p className="text-sm font-bold text-blue-600 mt-2">
                        数量: {log.qty} {item?.unit || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onApproveStock(Number(log.id), true)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> 批准
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const note = prompt('请输入拒绝原因（可选）:');
                        await onApproveStock(Number(log.id), false, note || '');
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={16} /> 拒绝
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && pendingReversalLogs.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-amber-700 mb-4 flex items-center gap-2">
            <Clock size={18} /> 待审批库存冲销 ({pendingReversalLogs.length})
          </h3>
          <div className="space-y-3">
            {pendingReversalLogs.map((log) => {
              const item = inventory.find((inventoryItem) => inventoryItem.id === log.itemId);
              const project = projects.find((projectItem) => projectItem.id === log.projectId);

              return (
                <div key={log.id} className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">
                        冲销{log.type === 'in' ? '入库' : '出库'} - {item?.name || '未知物料'}
                        <span className="ml-2 text-xs text-amber-600">原单 #{log.reversalOfId}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {log.date} 路 申请人 {log.creator} 路 关联项目: {project?.name || '未指定'}
                      </p>
                      <p className="text-sm font-bold text-amber-600 mt-2">
                        冲销数量: {Math.abs(log.qty)} {item?.unit || ''}
                      </p>
                      {log.note && <p className="text-xs text-slate-500 mt-1">说明: {log.note}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onApproveStockReversal(Number(log.id), true)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> 批准冲销
                    </button>
                    <button
                      type="button"
                      onClick={() => void onApproveStockReversal(Number(log.id), false)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={16} /> 拒绝
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <Package size={18} /> 实时库存明细
          </h3>
          <div className="flex gap-3">
            {canCreateStockEntry && (
              <button
                type="button"
                onClick={onOpenInbound}
                className="px-4 py-2 border border-green-200 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-100 transition-colors shadow-sm"
              >
                <Plus size={16} /> 入库登记
              </button>
            )}
            {canRequestOutbound && (
              <button
                type="button"
                onClick={onOpenOutbound}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                <ArrowRightLeft size={16} /> 出库申请
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">物料名称</th>
                <th className="px-6 py-4 font-bold">规格参数</th>
                <th className="px-6 py-4 font-bold">参考单价</th>
                <th className="px-6 py-4 font-bold">库存余额</th>
                <th className="px-6 py-4 font-bold">预警阈值</th>
                <th className="px-6 py-4 font-bold">当前状态</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    暂无物料
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{item.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{item.spec}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {stockLogs.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100/80 p-6 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <History size={18} /> 最近出入库流水
          </h3>
          <div className="space-y-3">
            {[...stockLogs]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((log) => {
                const item = inventory.find((inventoryItem) => inventoryItem.id === log.itemId);
                const isReversalLog = Boolean(log.isReversal);
                const statusBadge =
                  log.status === 'pending' && isReversalLog ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold">
                      冲销待审批
                    </span>
                  ) : log.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-xs font-bold">
                      待审批
                    </span>
                  ) : log.status === 'rejected' ? (
                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold">
                      已拒绝
                    </span>
                  ) : isReversalLog && log.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold">
                      已冲销
                    </span>
                  ) : null;

                const canReversal =
                  log.status === 'active' &&
                  !isReversalLog &&
                  (currentUserId === 'admin' ||
                    authRole === 'admin' ||
                    authRole === 'clerk' ||
                    currentUserName.includes('管理员') ||
                    currentUserName.includes('库管'));
                const canApproveReversal =
                  isReversalLog &&
                  log.status === 'pending' &&
                  (currentUserId === 'admin' || authRole === 'admin' || currentUserName.includes('管理员'));

                return (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between py-3 border-b border-dashed last:border-0 ${isReversalLog ? 'bg-amber-50/50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isReversalLog
                            ? 'bg-amber-50 text-amber-600'
                            : log.type === 'in'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {log.type === 'in' ? <Plus size={14} /> : <ArrowRightLeft size={14} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">
                            {isReversalLog ? '冲销' : ''}
                            {log.type === 'in' ? '物料入库' : '物料出库'} - {item?.name || '未知物料'}
                          </p>
                          {statusBadge}
                        </div>
                        <p className="text-xs text-slate-400">
                          {log.date} 路 操作人 {log.creator}
                          {log.approver && ` 路 审批人 ${log.approver}`}
                          {log.reversalOfId && ` 路 原单 #${log.reversalOfId}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`font-bold ${isReversalLog ? 'text-amber-600' : log.type === 'in' ? 'text-green-600' : 'text-blue-600'}`}
                        >
                          {log.qty > 0 ? (log.type === 'in' ? '+' : '-') : ''}
                          {log.qty} {item?.unit || ''}
                        </p>
                      </div>
                      {canReversal && (
                        <button
                          type="button"
                          onClick={() => void onReverseStock(Number(log.id))}
                          className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 whitespace-nowrap"
                        >
                          冲销
                        </button>
                      )}
                      {canApproveReversal && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => void onApproveStockReversal(Number(log.id), true)}
                            className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                          >
                            通过
                          </button>
                          <button
                            type="button"
                            onClick={() => void onApproveStockReversal(Number(log.id), false)}
                            className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryWarehousePage;
