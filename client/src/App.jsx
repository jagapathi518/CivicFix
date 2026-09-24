import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackComplaint from './pages/TrackComplaint';
import CitizenDashboard from './pages/citizen/Dashboard';
import CreateComplaint from './pages/citizen/CreateComplaint';
import ComplaintDetails from './pages/citizen/ComplaintDetails';
import AdminDashboard from './pages/admin/Dashboard';
import AdminComplaints from './pages/admin/Complaints';
import AdminComplaintDetails from './pages/admin/ComplaintDetails';
import WorkerDashboard from './pages/worker/Dashboard';
import WorkerComplaintDetails from './pages/worker/ComplaintDetails';
import DashboardLayout from './layouts/DashboardLayout';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    const dashMap = { CITIZEN: '/dashboard', ADMIN: '/admin', SUPER_ADMIN: '/admin', WORKER: '/worker' };
    return <Navigate to={dashMap[user.role] || '/login'} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }
  if (user) {
    const dashMap = { CITIZEN: '/dashboard', ADMIN: '/admin', SUPER_ADMIN: '/admin', WORKER: '/worker' };
    return <Navigate to={dashMap[user.role] || '/dashboard'} replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/track" element={<TrackComplaint />} />

          {/* Citizen */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['CITIZEN']}>
              <DashboardLayout><CitizenDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/complaints/new" element={
            <ProtectedRoute roles={['CITIZEN']}>
              <DashboardLayout><CreateComplaint /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/complaints/:id" element={
            <ProtectedRoute roles={['CITIZEN']}>
              <DashboardLayout><ComplaintDetails /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <DashboardLayout><AdminDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/complaints" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <DashboardLayout><AdminComplaints /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/complaints/:id" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <DashboardLayout><AdminComplaintDetails /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Worker */}
          <Route path="/worker" element={
            <ProtectedRoute roles={['WORKER']}>
              <DashboardLayout><WorkerDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/worker/complaints/:id" element={
            <ProtectedRoute roles={['WORKER']}>
              <DashboardLayout><WorkerComplaintDetails /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
