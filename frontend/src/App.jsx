import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import AccessDenied from './pages/AccessDenied';
import RelationshipsPage from './pages/masters/RelationshipsPage';
import MedicalConditionsPage from './pages/masters/MedicalConditionsPage';
import MedicalRecordCategoriesPage from './pages/masters/MedicalRecordCategoriesPage';
import MedicalRecordTagsPage from './pages/masters/MedicalRecordTagsPage';
import SpecialtiesPage from './pages/masters/SpecialtiesPage';
import UserRolesPage from './pages/masters/UserRolesPage';

const ROLE_HOME = {
  super_admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  staff: '/dashboard/staff',
};

function ProtectedRoute({ children, requiredPermission }) {
  const { user, loading, can } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (requiredPermission && !can(requiredPermission)) return <AccessDenied />;
  return children;
}

// Redirect /dashboard to role-specific dashboard
function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/dashboard/staff'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardRedirect />} />
        <Route path="dashboard" element={<DashboardRedirect />} />
        {/* Role-specific dashboards */}
        <Route path="dashboard/admin" element={
          <ProtectedRoute requiredPermission="manage_users"><SuperAdminDashboard /></ProtectedRoute>
        } />
        <Route path="dashboard/manager" element={
          <ProtectedRoute requiredPermission="view_reports"><ManagerDashboard /></ProtectedRoute>
        } />
        <Route path="dashboard/staff" element={
          <ProtectedRoute requiredPermission="view_orders"><StaffDashboard /></ProtectedRoute>
        } />
        {/* Other pages */}
        <Route path="orders" element={<ProtectedRoute requiredPermission="view_orders"><OrdersPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute requiredPermission="manage_users"><UsersPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute requiredPermission="view_reports"><ReportsPage /></ProtectedRoute>} />
        {/* Master Data — each page reads from the public read-only API */}
        <Route path="masters/relationships" element={<ProtectedRoute requiredPermission="view_masters"><RelationshipsPage /></ProtectedRoute>} />
        <Route path="masters/medical-conditions" element={<ProtectedRoute requiredPermission="view_masters"><MedicalConditionsPage /></ProtectedRoute>} />
        <Route path="masters/medical-record-categories" element={<ProtectedRoute requiredPermission="view_masters"><MedicalRecordCategoriesPage /></ProtectedRoute>} />
        <Route path="masters/medical-record-tags" element={<ProtectedRoute requiredPermission="view_masters"><MedicalRecordTagsPage /></ProtectedRoute>} />
        <Route path="masters/specialties" element={<ProtectedRoute requiredPermission="view_masters"><SpecialtiesPage /></ProtectedRoute>} />
        <Route path="masters/user-roles" element={<ProtectedRoute requiredPermission="view_masters"><UserRolesPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '10px', background: '#111', color: '#fff', fontSize: '14px' }
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
