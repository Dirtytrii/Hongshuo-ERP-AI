export type ApprovalSourceType = 'finance' | 'reimbursement' | 'loan' | 'repayment' | 'inventory' | 'change-order';

export type ApprovalNavigationTarget = 'finance' | 'reimbursements' | 'loans' | 'inventory' | 'change-orders';

export interface ApprovalTodoSummary {
  id: number | string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  sourceType: ApprovalSourceType;
  targetTab: ApprovalNavigationTarget;
}
