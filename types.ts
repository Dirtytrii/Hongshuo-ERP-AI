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
  /** 来自财务已审批支出的材料成本汇总（项目详情接口返回） */
  materialCostFromFinance?: number;
  /** 来自出库的材料金额汇总（项目详情接口返回） */
  materialCostFromStock?: number;
  /** 材料成本合计 = 财务 + 出库（项目详情接口返回） */
  materialCostTotal?: number;
  /** 控制预算（总预算） */
  totalBudget?: number;
  /** 实际成本合计（项目详情/列表接口返回） */
  actualCostTotal?: number;
  /** 预算使用比例 0~1+（项目详情/列表接口返回） */
  budgetRatio?: number;
  /** 预算预警状态 green | yellow | red（项目详情/列表接口返回） */
  budgetAlertStatus?: 'green' | 'yellow' | 'red';
}

export interface Contract {
  id: number;
  projectId: number;
  contractNo: string;
  name: string;
  contractAmount: number;
  signedDate: string;
  settlementStatus: 'unsettled' | 'partial' | 'settled';
  monitoringStatus: 'normal' | 'warning' | 'risk';
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperationDashboardSummary {
  contractSignedAmount: number;
  contractSettledAmount: number;
  approvedIncomeAmount: number;
  approvedExpenseAmount: number;
  upcomingReceivableAmount: number;
  overdueReceivableAmount: number;
  upcomingReceivableCount: number;
  overBudgetProjectCount: number;
}

export interface BudgetExecutionItem {
  projectId: number;
  projectName: string;
  totalBudget: number | null;
  actualCostTotal: number;
  budgetRatio: number | null;
  budgetAlertStatus: 'green' | 'yellow' | 'red' | null;
}

export interface Milestone {
  id: number;
  name: string;
  planDate: string;
  actualDate: string | null;
  status: 'completed' | 'in_progress' | 'pending';
  description?: string;
  dueDate?: string;
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
  /** 红字冲销：关联的原单ID */
  reversalOfId?: number | null;
  /** 是否为冲销单 */
  isReversal?: boolean;
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

// 后端维护的角色定义（用于角色管理与权限配置）
export interface RoleDefinition {
  id: number;
  code: string;
  name: string;
  description?: string;
  builtIn: boolean;
  userCount?: number;
}

export interface AppState {
  projects: Project[];
  inventory: InventoryItem[];
  financeRecords: FinanceRecord[];
  stockLogs: StockLog[];
}
