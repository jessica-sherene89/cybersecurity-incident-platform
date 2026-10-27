import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  PlusCircle,
  FileText,
  UserCheck,
  FolderArchive,
  ListTodo,
  BarChart3,
  Users,
  User,
  Settings,
  Shield,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isAnalyst, isUser } = useAuth();

  // Role-specific navigation items
  // Admin module: Exactly eight navigation items in exact specified order:
  // 1. Dashboard, 2. All Incidents, 3. Evidence Vault, 4. Response Actions,
  // 5. Reports & Analytics, 6. User Management, 7. Activity Logs, 8. Settings
  const adminNavItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'All Incidents',
      path: '/incidents',
      icon: ShieldAlert,
    },
    {
      label: 'Evidence Vault',
      path: '/evidence',
      icon: FolderArchive,
    },
    {
      label: 'Response Actions',
      path: '/response-tracking',
      icon: ListTodo,
    },
    {
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
    },
    {
      label: 'User Management',
      path: '/users',
      icon: Users,
    },
    {
      label: 'Activity Logs',
      path: '/activity-logs',
      icon: History,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  // Preserved Analyst workflow
  const analystNavItems = [
    {
      label: 'SOC Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'My Assignments',
      path: '/my-assignments',
      icon: UserCheck,
    },
    {
      label: 'All Incidents',
      path: '/incidents',
      icon: ShieldAlert,
    },
    {
      label: 'Report Incident',
      path: '/report-incident',
      icon: PlusCircle,
    },
    {
      label: 'Evidence Vault',
      path: '/evidence',
      icon: FolderArchive,
    },
    {
      label: 'Response Actions',
      path: '/response-tracking',
      icon: ListTodo,
    },
  ];

  // Preserved User workflow
  const userNavItems = [
    {
      label: 'User Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Report an Incident',
      path: '/report-incident',
      icon: PlusCircle,
    },
    {
      label: 'My Incidents',
      path: '/my-incidents',
      icon: FileText,
    },
  ];

  let activeNavItems = userNavItems;
  if (isAdmin) {
    activeNavItems = adminNavItems;
  } else if (isAnalyst) {
    activeNavItems = analystNavItems;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            display: 'block',
          }}
        />
      )}

      <aside
        className="sidebar"
        style={{
          width: '260px',
          height: '100vh',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(0)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Brand Logo Header */}
        <div
          style={{
            padding: '1.5rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
            }}
          >
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.125rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              CyberGuard<span style={{ color: 'var(--accent-cyan)' }}> SOC</span>
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {isAdmin ? 'ADMIN CONSOLE' : isAnalyst ? 'ANALYST WORKBENCH' : 'USER PORTAL'}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '1.25rem 0.75rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '0.5rem 0.75rem',
              letterSpacing: '0.08em',
            }}
          >
            {isAdmin ? 'Administrative Operations' : 'Operations'}
          </div>

          {activeNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: isActive
                    ? 'rgba(6, 182, 212, 0.15)'
                    : 'transparent',
                  borderLeft: isActive
                    ? '3px solid var(--accent-cyan)'
                    : '3px solid transparent',
                  transition: 'all 0.2s ease',
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Utility Nav */}
        <div
          style={{
            padding: '1rem 0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <NavLink
            to="/profile"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.875rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            })}
          >
            <User size={17} />
            <span>My Profile</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
