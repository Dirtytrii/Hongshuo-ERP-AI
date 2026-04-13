import type { ApprovalNavigationTarget, ApprovalSourceType } from '../model';

export const APPROVAL_TARGET_TAB_MAP: Record<ApprovalSourceType, ApprovalNavigationTarget> = {
  finance: 'finance',
  reimbursement: 'reimbursements',
  loan: 'loans',
  repayment: 'loans',
  inventory: 'inventory',
  'change-order': 'change-orders',
};
