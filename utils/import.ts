/**
 * 数据导入与恢复：解析备份 JSON、解析 Excel
 */
import * as XLSX from 'xlsx';
import type { Project, InventoryItem, FinanceRecord, StockLog } from '../types';

export interface BackupData {
  projects: Project[];
  inventory: InventoryItem[];
  financeRecords: FinanceRecord[];
  stockLogs: StockLog[];
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result as string) as BackupData & { exportedAt?: string };
        resolve({
          projects: Array.isArray(data.projects) ? data.projects : [],
          inventory: Array.isArray(data.inventory) ? data.inventory : [],
          financeRecords: Array.isArray(data.financeRecords) ? data.financeRecords : [],
          stockLogs: Array.isArray(data.stockLogs) ? data.stockLogs : [],
        });
      } catch (e) {
        reject(new Error('无效的备份文件格式'));
      }
    };
    r.onerror = () => reject(new Error('文件读取失败'));
    r.readAsText(file);
  });
}

/** 从备份恢复：按顺序创建项目、物料、财务、出入库，并映射旧 ID 到新 ID */
export async function restoreFromBackup(
  data: BackupData,
  api: {
    createProject: (p: unknown) => Promise<unknown>;
    createInventoryItem: (i: unknown) => Promise<unknown>;
    createFinanceRecord: (r: unknown) => Promise<unknown>;
    createStockLog: (l: unknown) => Promise<unknown>;
  },
  creator: string
): Promise<{
  success: boolean;
  message: string;
  created?: { projects: number; inventory: number; finance: number; stock: number };
}> {
  const projectIdMap = new Map<number, number>();
  const itemIdMap = new Map<number, number>();
  const created = { projects: 0, inventory: 0, finance: 0, stock: 0 };

  try {
    for (const p of data.projects) {
      const { id: _oldId, milestones: _m, ...rest } = p as Project & { milestones?: unknown[] };
      const createdProject = (await api.createProject({ ...rest, milestones: [] })) as { id: number };
      projectIdMap.set(p.id, createdProject.id);
      created.projects++;
    }
    for (const i of data.inventory) {
      const { id: _oldId, ...rest } = i;
      const createdItem = (await api.createInventoryItem(rest)) as { id: number };
      itemIdMap.set(i.id, createdItem.id);
      created.inventory++;
    }
    for (const r of data.financeRecords) {
      const rec = r as FinanceRecord & { id?: string };
      const newProjectId = rec.projectId != null ? (projectIdMap.get(rec.projectId) ?? null) : null;
      await api.createFinanceRecord({
        type: rec.type,
        category: rec.category,
        amount: rec.amount,
        projectId: newProjectId,
        date: rec.date,
        creator: creator,
        desc: (rec as { desc?: string }).desc,
      });
      created.finance++;
    }
    for (const log of data.stockLogs) {
      const newItemId = itemIdMap.get(log.itemId);
      const newProjectId = log.projectId != null ? (projectIdMap.get(log.projectId) ?? null) : null;
      if (newItemId == null) continue;
      await api.createStockLog({
        type: log.type,
        itemId: newItemId,
        qty: log.qty,
        price: log.price,
        projectId: newProjectId,
        creator: creator,
        note: log.note,
      });
      created.stock++;
    }
    return {
      success: true,
      message: `已恢复：项目 ${created.projects}，物料 ${created.inventory}，财务 ${created.finance}，出入库 ${created.stock}`,
      created,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : '恢复失败',
    };
  }
}

function readExcelFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const wb = XLSX.read(r.result, { type: 'array' });
        resolve(wb);
      } catch (e) {
        reject(new Error('Excel 解析失败'));
      }
    };
    r.onerror = () => reject(new Error('文件读取失败'));
    r.readAsArrayBuffer(file);
  });
}

/** 解析项目 Excel（与导出格式一致） */
export async function parseProjectExcel(file: File): Promise<Array<Partial<Project>>> {
  const wb = await readExcelFile(file);
  const sheet = wb.Sheets[wb.SheetNames[0]] || wb.Sheets[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rows.map((row) => ({
    name: String(row['项目名称'] ?? ''),
    code: String(row['项目编号'] ?? ''),
    managerId: String(row['项目经理ID'] ?? ''),
    contractAmount: Number(row['合同金额']) || 0,
    receivedAmount: Number(row['已收款']) || 0,
    materialCost: Number(row['材料成本']) || 0,
    laborCost: Number(row['人工成本']) || 0,
    otherCost: Number(row['其他成本']) || 0,
    status: String(row['状态'] ?? '施工中'),
    progress: Number(row['进度%']) || 0,
    startDate: String(row['开始日期'] ?? ''),
    endDate: String(row['结束日期'] ?? '') || undefined,
  }));
}

/** 解析物料 Excel */
export async function parseInventoryExcel(file: File): Promise<Array<Partial<InventoryItem>>> {
  const wb = await readExcelFile(file);
  const sheet = wb.Sheets[wb.SheetNames[0]] || wb.Sheets[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rows.map((row) => ({
    name: String(row['物料名称'] ?? ''),
    spec: String(row['规格'] ?? ''),
    unit: String(row['单位'] ?? ''),
    price: Number(row['参考单价']) || 0,
    quantity: Number(row['库存数量']) || 0,
    threshold: Number(row['预警阈值']) || 0,
  }));
}

/** 解析财务 Excel */
export async function parseFinanceExcel(
  file: File
): Promise<
  Array<
    Partial<FinanceRecord> & {
      type: 'income' | 'expense';
      category: string;
      amount: number;
      date: string;
      creator: string;
    }
  >
> {
  const wb = await readExcelFile(file);
  const sheet = wb.Sheets[wb.SheetNames[0]] || wb.Sheets[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rows.map((row) => ({
    type: (row['类型'] === '收入' ? 'income' : 'expense') as 'income' | 'expense',
    category: String(row['类别'] ?? ''),
    amount: Number(row['金额']) || 0,
    projectId: row['关联项目ID'] !== '' && row['关联项目ID'] != null ? Number(row['关联项目ID']) : null,
    status: 'pending' as const,
    date: String(row['日期'] ?? new Date().toISOString().slice(0, 10)),
    creator: String(row['创建人'] ?? ''),
    desc: String(row['备注'] ?? ''),
  }));
}
