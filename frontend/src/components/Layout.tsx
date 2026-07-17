import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Boxes,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { KeystoneMark } from './KeystoneMark';
import { useAuth } from '../auth/AuthContext';
import * as api from '../api/endpoints';
import type { NotificationRow } from '../types';
import { formatDistanceToNow } from 'date-fns';

const ROLE_LABEL: Record<string, string> = {
  DISPATCHER: 'Dispatcher',
  TECHNICIAN: 'Technician',
  MANAGER: 'Manager',
  CUSTOMER: 'Customer',
};

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  useEffect(() => {
    let mounted = true;
    api
      .fetchNotifications()
      .then((rows) => mounted && setNotifications(rows))
      .catch(() => {});
    const interval = setInterval(() => {
      api
        .fetchNotifications()
        .then((rows) => mounted && setNotifications(rows))
        .catch(() => {});
    }, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!user) return null;

  const workOrdersLabel =
    user.role === 'TECHNICIAN' ? 'My Jobs' : user.role === 'CUSTOMER' ? 'My Requests' : 'Work Orders';

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { to: '/work-orders', label: workOrdersLabel, icon: ClipboardList, show: true },
    { to: '/customers', label: 'Customers & Sites', icon: Building2, show: user.role === 'DISPATCHER' || user.role === 'MANAGER' },
    { to: '/parts', label: 'Parts Inventory', icon: Boxes, show: user.role === 'MANAGER' },
    { to: '/users', label: 'Team & Users', icon: Users, show: user.role === 'MANAGER' },
  ].filter((i) => i.show);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleNotificationClick(n: NotificationRow) {
    if (!n.read) {
      await api.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
    }
    if (n.workOrderId) {
      navigate(`/work-orders/${n.workOrderId}`);
      setNotifOpen(false);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-paper">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform bg-ink text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <KeystoneMark size={30} />
            <div>
              <p className="font-display text-lg font-semibold leading-none tracking-tight">KEYSTONE</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/40">Field Service</p>
            </div>
          </div>
          <button className="text-white/60 lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-gold text-ink' : 'text-white/70 hover:bg-ink-light hover:text-white'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm font-semibold">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-white/50">{ROLE_LABEL[user.role]}</p>
            </div>
            <button onClick={logout} className="text-white/50 hover:text-white" aria-label="Log out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4 lg:px-6">
          <button className="text-ink lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-lg p-2 text-ink2 hover:bg-paper hover:text-ink"
              aria-label="Notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-cancelled text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 rounded-xl border border-border bg-white shadow-pop animate-fade-in">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-ink">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-ink2">You're all caught up.</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`block w-full border-b border-border px-4 py-3 text-left text-sm last:border-b-0 hover:bg-paper ${
                          n.read ? 'text-ink2' : 'font-medium text-ink'
                        }`}
                      >
                        <p>{n.message}</p>
                        <p className="mt-0.5 text-xs text-ink2">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
