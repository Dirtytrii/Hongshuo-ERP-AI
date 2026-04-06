/**
 * 数据导出工具：Excel（项目、财务、库存）
 */
import * as XLSX from 'xlsx';
import type { Project, InventoryItem, FinanceRecord } from '../types';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportProjectsToExcel(projects: Project[]) {
  const rows = projects.map((p) => ({
    项目名称: p.name,
    项目编号: p.code,
    项目经理ID: p.managerId,
    合同金额: p.contractAmount,
    已收款: p.receivedAmount,
    材料成本: p.materialCost,
    人工成本: p.laborCost,
    其他成本: p.otherCost,
    状态: p.status,
    '进度%': p.progress,
    开始日期: p.startDate,
    结束日期: p.endDate || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '项目列表');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `项目列表_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

export function downloadProjectImportTemplate() {
  const rows = [
    {
      项目名称: '示例项目',
      项目编号: 'P-001',
      项目经理ID: 'pm01',
      合同金额: 1000000,
      已收款: 200000,
      材料成本: 150000,
      人工成本: 80000,
      其他成本: 20000,
      状态: '施工中',
      '进度%': 20,
      开始日期: '2026-01-01',
      结束日期: '2026-12-31',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '项目导入模板');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    '项目导入模板.xlsx'
  );
}

export function exportInventoryToExcel(inventory: InventoryItem[]) {
  const rows = inventory.map((i) => ({
    物料名称: i.name,
    规格: i.spec,
    单位: i.unit,
    参考单价: i.price,
    库存数量: i.quantity,
    预警阈值: i.threshold,
    状态: i.quantity < i.threshold ? '低于安全位' : '正常',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '库存明细');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `库存明细_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

export function downloadInventoryImportTemplate() {
  const rows = [
    {
      物料名称: '示例物料',
      规格: '规格A',
      单位: '件',
      参考单价: 100,
      库存数量: 500,
      预警阈值: 100,
    },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '库存导入模板');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    '库存导入模板.xlsx'
  );
}

export function exportFinanceToExcel(records: FinanceRecord[]) {
  const rows = records.map((r) => ({
    日期: r.date,
    类型: r.type === 'income' ? '收入' : '支出',
    类别: r.category,
    金额: r.amount,
    关联项目ID: r.projectId ?? '',
    状态: r.status,
    创建人: r.creator,
    备注: (r as { desc?: string }).desc ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '财务记录');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `财务记录_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

export function downloadFinanceImportTemplate() {
  const rows = [
    {
      日期: '2026-03-01',
      类型: '支出',
      类别: '材料费',
      金额: 50000,
      关联项目ID: 1,
      状态: 'pending',
      创建人: '财务',
      备注: '示例备注',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '财务导入模板');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    '财务导入模板.xlsx'
  );
}

/** 导出完整应用状态为 JSON 备份 */
export function exportAppStateAsBackup(state: {
  projects: unknown[];
  inventory: unknown[];
  financeRecords: unknown[];
  stockLogs: unknown[];
}) {
  const json = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
  downloadBlob(
    new Blob([json], { type: 'application/json' }),
    `erp_backup_${new Date().toISOString().slice(0, 10)}.json`
  );
}

/** 项目报表导出：成本利润表 */
export function exportProjectReportToExcel(
  rows: Array<{
    name: string;
    code: string;
    contractAmount: number;
    receivedAmount: number;
    materialCost: number;
    laborCost: number;
    otherCost: number;
    totalCost: number;
    profit: number;
    margin: string;
    progress: string;
  }>
) {
  const sheetRows = rows.map((r) => ({
    项目名称: r.name,
    编号: r.code,
    合同金额: r.contractAmount,
    已收款: r.receivedAmount,
    材料成本: r.materialCost,
    人工成本: r.laborCost,
    其他成本: r.otherCost,
    总成本: r.totalCost,
    净利润: r.profit,
    利润率: r.margin,
    进度: r.progress,
  }));
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '项目成本利润');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `项目报表_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

/** 财务报表明细导出（按筛选条件） */
export function exportFinanceDetailToExcel(records: FinanceRecord[]) {
  const rows = records.map((r) => ({
    日期: r.date,
    类型: r.type === 'income' ? '收入' : '支出',
    类别: r.category,
    成本类型: (r as { costType?: string }).costType ?? '-',
    金额: r.amount,
    关联项目ID: r.projectId ?? '',
    状态: r.status,
    创建人: r.creator,
    备注: (r as { desc?: string }).desc ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '财务明细');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `财务明细_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

/** 低库存明细导出 */
export function exportLowStockToExcel(
  items: Array<{ name: string; spec: string; unit: string; quantity: number; threshold: number }>
) {
  const rows = items.map((i) => ({
    物料名称: i.name,
    规格: i.spec,
    单位: i.unit,
    当前库存: i.quantity,
    预警阈值: i.threshold,
    状态: i.quantity < i.threshold ? '低于安全位' : '正常',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '低库存明细');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `低库存明细_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}
