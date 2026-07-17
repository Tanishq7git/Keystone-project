import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { WorkOrderDetailPage } from './pages/WorkOrderDetailPage';
import { CustomersPage } from './pages/CustomersPage';
import { PartsPage } from './pages/PartsPage';
import { UsersPage } from './pages/UsersPage';
import { NotFoundPage } from './pages/NotFoundPage';

function LoginRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/work-orders" element={<WorkOrdersPage />} />
            <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
            <Route
              path="/customers"
              element={
                <ProtectedRoute allow={['DISPATCHER', 'MANAGER']}>
                  <CustomersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parts"
              element={
                <ProtectedRoute allow={['MANAGER']}>
                  <PartsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allow={['MANAGER']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
