export interface Project {
  id: number;
  name: string;
  code: string;
  managerId: string;
  contractAmount: number;
  receivedAmount: number;
  materialCost: number;
  laborCost: number;
  otherCost: number;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  planDate: string;
  actualDate: string | null;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface InventoryItem {
  id: number;
  name: string;
  spec: string;
  unit: string;
  price: number;
  quantity: number;
  threshold: number;
}

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  projectId: number | null;
  status: string;
  date: string;
  creator: string;
  desc?: string;
}

export interface StockLog {
  id: string;
  type: 'in' | 'out';
  itemId: number;
  qty: number;
  price: number;
  projectId: number | null;
  status: string;
  date: string;
  creator: string;
  note?: string;
}

export interface SystemLog {
  id: number | string;
  time: string;
  user: string;
  action: string;
  detail: string;
}

export interface Role {
  id: string;
  name: string;
  label: string;
}

export interface AppState {
  projects: Project[];
  inventory: InventoryItem[];
  financeRecords: FinanceRecord[];
  stockLogs: StockLog[];
}