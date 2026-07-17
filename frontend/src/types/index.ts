export type Role = 'DISPATCHER' | 'TECHNICIAN' | 'MANAGER' | 'CUSTOMER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkOrderStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export type SlaStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'MET' | 'NONE';

export interface CurrentUser {
  userId: number;
  name: string;
  email: string;
  role: Role;
  customerId: number | null;
  customerName: string | null;
}

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
  customerId: number | null;
  expiresInMs: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Customer {
  id: number;
  name: string;
  contactEmail: string | null;
  phone: string | null;
  createdAt: string;
  siteCount: number;
}

export interface Site {
  id: number;
  customerId: number;
  customerName: string;
  name: string;
  address: string | null;
  createdAt: string;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  customerId: number | null;
  customerName: string | null;
  active: boolean;
  openJobCount: number;
  createdAt: string;
}

export interface Part {
  id: number;
  name: string;
  sku: string;
  unitCost: number;
  stockQty: number;
}

export interface PartUsage {
  id: number;
  partId: number;
  partName: string;
  sku: string;
  qtyUsed: number;
  lineCost: number;
  loggedByName: string | null;
  usedAt: string;
}

export interface TimeLogEntry {
  id: number;
  minutes: number;
  note: string | null;
  technicianName: string;
  loggedAt: string;
}

export interface StatusHistoryEntry {
  id: number;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus;
  changedByName: string;
  changedAt: string;
  note: string | null;
}

export interface WorkOrderRow {
  id: number;
  code: string;
  title: string;
  priority: Priority;
  status: WorkOrderStatus;
  slaDueAt: string | null;
  slaStatus: SlaStatus;
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  assignedToId: number | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderDetail {
  id: number;
  code: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: WorkOrderStatus;
  slaDueAt: string | null;
  slaStatus: SlaStatus;
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  siteAddress: string | null;
  assignedToId: number | null;
  assignedToName: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  closedAt: string | null;
  totalPartsCost: number;
  totalMinutesLogged: number;
  history: StatusHistoryEntry[];
  partsUsed: PartUsage[];
  timeLogs: TimeLogEntry[];
}

export interface DashboardSummary {
  countsByStatus: Record<string, number>;
  totalOpen: number;
  overdueCount: number;
  slaCompliancePct: number;
  byTechnician: { technicianId: number; technicianName: string; openJobs: number; completedJobs: number }[];
  bySite: { siteId: number; siteName: string; customerName: string; openJobs: number }[];
}

export interface NotificationRow {
  id: number;
  message: string;
  workOrderId: number | null;
  workOrderCode: string | null;
  read: boolean;
  createdAt: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}
