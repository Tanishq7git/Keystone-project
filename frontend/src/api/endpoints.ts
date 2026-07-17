import { apiClient } from './client';
import type {
  Customer,
  CurrentUser,
  DashboardSummary,
  LoginResponse,
  NotificationRow,
  PageResponse,
  Part,
  PartUsage,
  Site,
  TimeLogEntry,
  UserRow,
  WorkOrderDetail,
  WorkOrderRow,
} from '../types';

// ---------- Auth ----------
export const login = (email: string, password: string) =>
  apiClient.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data);

export const fetchCurrentUser = () => apiClient.get<CurrentUser>('/auth/me').then((r) => r.data);

// ---------- Customers & Sites ----------
export const fetchCustomers = (search?: string, page = 0, size = 50) =>
  apiClient
    .get<PageResponse<Customer>>('/customers', { params: { search, page, size } })
    .then((r) => r.data);

export const fetchCustomer = (id: number) => apiClient.get<Customer>(`/customers/${id}`).then((r) => r.data);

export const createCustomer = (payload: { name: string; contactEmail?: string; phone?: string }) =>
  apiClient.post<Customer>('/customers', payload).then((r) => r.data);

export const updateCustomer = (id: number, payload: { name: string; contactEmail?: string; phone?: string }) =>
  apiClient.put<Customer>(`/customers/${id}`, payload).then((r) => r.data);

export const fetchSites = (customerId: number) =>
  apiClient.get<Site[]>(`/customers/${customerId}/sites`).then((r) => r.data);

export const createSite = (payload: { customerId: number; name: string; address?: string }) =>
  apiClient.post<Site>('/sites', payload).then((r) => r.data);

// ---------- Users ----------
export const fetchUsers = () => apiClient.get<UserRow[]>('/users').then((r) => r.data);

export const fetchTechnicians = () => apiClient.get<UserRow[]>('/users/technicians').then((r) => r.data);

export const createUser = (payload: {
  name: string;
  email: string;
  password: string;
  role: string;
  customerId?: number | null;
}) => apiClient.post<UserRow>('/users', payload).then((r) => r.data);

export const setUserActive = (id: number, active: boolean) =>
  apiClient.patch<UserRow>(`/users/${id}/active`, null, { params: { active } }).then((r) => r.data);

// ---------- Parts ----------
export const fetchParts = () => apiClient.get<Part[]>('/parts').then((r) => r.data);

export const createPart = (payload: { name: string; sku: string; unitCost: number; stockQty: number }) =>
  apiClient.post<Part>('/parts', payload).then((r) => r.data);

export const updatePart = (id: number, payload: { name: string; sku: string; unitCost: number; stockQty: number }) =>
  apiClient.put<Part>(`/parts/${id}`, payload).then((r) => r.data);

// ---------- Work Orders ----------
export interface WorkOrderFilters {
  status?: string;
  priority?: string;
  technicianId?: number;
  siteId?: number;
  customerId?: number;
  search?: string;
  page?: number;
  size?: number;
}

export const fetchWorkOrders = (filters: WorkOrderFilters) =>
  apiClient.get<PageResponse<WorkOrderRow>>('/work-orders', { params: filters }).then((r) => r.data);

export const fetchWorkOrder = (id: number) =>
  apiClient.get<WorkOrderDetail>(`/work-orders/${id}`).then((r) => r.data);

export const createWorkOrder = (payload: {
  title: string;
  description?: string;
  priority: string;
  customerId: number;
  siteId: number;
}) => apiClient.post<WorkOrderRow>('/work-orders', payload).then((r) => r.data);

export const updateWorkOrder = (
  id: number,
  payload: { title: string; description?: string; priority: string }
) => apiClient.put<WorkOrderRow>(`/work-orders/${id}`, payload).then((r) => r.data);

export const assignWorkOrder = (id: number, technicianId: number) =>
  apiClient.post<WorkOrderRow>(`/work-orders/${id}/assign`, { technicianId }).then((r) => r.data);

export const changeWorkOrderStatus = (id: number, toStatus: string, note?: string) =>
  apiClient.post<WorkOrderRow>(`/work-orders/${id}/status`, { toStatus, note }).then((r) => r.data);

export const logPartUsage = (id: number, partId: number, qtyUsed: number) =>
  apiClient.post<PartUsage>(`/work-orders/${id}/parts`, { partId, qtyUsed }).then((r) => r.data);

export const logTime = (id: number, minutes: number, note?: string) =>
  apiClient.post<TimeLogEntry>(`/work-orders/${id}/time`, { minutes, note }).then((r) => r.data);

// ---------- Reports ----------
export const fetchDashboardSummary = () =>
  apiClient.get<DashboardSummary>('/reports/summary').then((r) => r.data);

// ---------- Notifications ----------
export const fetchNotifications = () =>
  apiClient.get<NotificationRow[]>('/notifications').then((r) => r.data);

export const markNotificationRead = (id: number) => apiClient.patch(`/notifications/${id}/read`);
