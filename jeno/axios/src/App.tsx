import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProfileSelectScreen } from './screens/ProfileSelectScreen';
import { AdminLoginScreen } from './screens/AdminLoginScreen';
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
    <BrowserRouter>
      <Routes>
        {/* Auth / Profile Selection */}
        <Route path="/" element={<ProfileSelectScreen />} />
        <Route path="/admin/login" element={<AdminLoginScreen />} />
        
        {/* Agent Login (Simulated) */}
        <Route path="/agent/login" element={
          <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-6 text-center">
               <h1 className="text-2xl font-bold">Connexion Agent</h1>
               <p className="text-text-secondary">Saisissez vos identifiants pour commencer votre service.</p>
               <button 
                 onClick={() => {
                   useAuthStore.getState().setUser({ id: '2', name: 'Agent Mutombo', role: 'AGENT' });
                   window.location.href = '/agent/dashboard';
                 }}
                 className="w-full bg-accent-primary text-white py-4 rounded-2xl font-bold"
                >
                 Démarrer le Service
               </button>
            </div>
          </div>
        } />

        {/* Member Login (Simulated) */}
        <Route path="/member/login" element={
          <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-6 text-center">
               <h1 className="text-2xl font-bold">Connexion Adhérent</h1>
               <p className="text-text-secondary">Entrez votre plaque d'immatriculation pour activer le guidage.</p>
               <button 
                 onClick={() => {
                   useAuthStore.getState().setUser({ id: '3', name: 'Jean Kabamba', role: 'MEMBER', licensePlate: 'AA-482-BC' });
                   window.location.href = '/client/standby';
                 }}
                 className="w-full bg-indigo-500 text-white py-4 rounded-2xl font-bold"
                >
                 Démarrer le Guidage
               </button>
            </div>
          </div>
        } />

        {/* Admin Section */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="editor" element={<TilemapEditorScreen />} />
          <Route path="configurations" element={<ConfigurationsScreen />} />
          <Route path="users" element={<UserManagementScreen />} />
          <Route path="agents" element={<AgentManagementScreen />} />
          <Route path="history" element={<HistoryScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>

        {/* Agent Sections */}
        <Route path="/agent/dashboard" element={<AgentOperationalScreen />} />

        {/* Client Sections */}
        <Route path="/client/standby" element={<ClientGuidanceSystem />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
