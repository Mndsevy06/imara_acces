import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginScreen } from './screens/LoginScreen';
import { AdminRegisterScreen } from './screens/AdminRegisterScreen';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './screens/AdminDashboard';
import { TilemapEditorScreen } from './screens/TilemapEditorScreen';
import { ConfigurationsScreen } from './screens/ConfigurationsScreen';
import { UserManagementScreen } from './screens/UserManagementScreen';
import { AgentManagementScreen } from './screens/AgentManagementScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AgentOperationalScreen } from './screens/AgentOperationalScreen';
import { ClientGuidanceSystem } from './screens/ClientScreens';
import { useAuthStore, useThemeStore } from './store/useStore';

import { SocketProvider } from './components/SocketProvider';

// Auth screens consolidated

import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  const { user, role } = useAuthStore();
  const isDarkMode = useThemeStore(state => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <SocketProvider>
      <BrowserRouter>
      <Routes>
        {/* Auth / Profile Selection */}
        <Route path="/" element={<LoginScreen />} />
        <Route path="/admin/login" element={<Navigate to="/" />} />
        <Route path="/agent/login" element={<Navigate to="/" />} />
        <Route path="/member/login" element={<Navigate to="/" />} />
        <Route path="/admin/register" element={<AdminRegisterScreen />} />

        {/* Admin Section */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="editor" element={<TilemapEditorScreen />} />
            <Route path="configurations" element={<ConfigurationsScreen />} />
            <Route path="users" element={<UserManagementScreen />} />
            <Route path="agents" element={<AgentManagementScreen />} />
            <Route path="history" element={<HistoryScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
        </Route>

        {/* Agent Sections */}
        <Route element={<ProtectedRoute allowedRoles={['AGENT']} />}>
          <Route path="/agent/dashboard" element={<AgentOperationalScreen />} />
        </Route>

        {/* Client Sections */}
        <Route element={<ProtectedRoute allowedRoles={['MEMBER']} />}>
          <Route path="/client/standby" element={<ClientGuidanceSystem />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}
