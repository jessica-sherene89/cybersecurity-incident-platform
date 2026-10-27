import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// 15 Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetails from './pages/IncidentDetails';
import ReportIncident from './pages/ReportIncident';
import MyIncidents from './pages/MyIncidents';
import MyAssignments from './pages/MyAssignments';
import Evidence from './pages/Evidence';
import ResponseTracking from './pages/ResponseTracking';
import Reports from './pages/Reports';
import Users from './pages/Users';
import ActivityLogs from './pages/ActivityLogs';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes for All Authenticated Users */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'User',
                  'Analyst',
                  'Admin',
                ]}
              />
            }
          >
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/incidents/:id" element={<IncidentDetails />} />
              <Route path="/report-incident" element={<ReportIncident />} />
              <Route path="/my-incidents" element={<MyIncidents />} />
              <Route path="/profile" element={<Profile />} />

              {/* Analyst & Admin Operational Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      'Analyst',
                      'Admin',
                    ]}
                  />
                }
              >
                <Route path="/my-assignments" element={<MyAssignments />} />
                <Route path="/evidence" element={<Evidence />} />
                <Route path="/response-tracking" element={<ResponseTracking />} />
              </Route>

              {/* Admin Only Strategic Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<Users />} />
                <Route path="/activity-logs" element={<ActivityLogs />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
