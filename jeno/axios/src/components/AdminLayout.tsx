import React from 'react';
import { Card, Button } from '../components/UI';
import { 
  LayoutDashboard, 
  Settings2, 
  Map as MapIcon, 
  Users, 
  ShieldCheck, 
  ClipboardList, 
  SlidersHorizontal,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/Common';
import { useAuthStore, useConfigStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const activeConfig = useConfigStore(state => state.activeConfig);

  const menuItems = [
    { label: 'Tableau de Bord', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Configurations', icon: Settings2, path: '/admin/configurations' },
    { label: 'Carte Editor', icon: MapIcon, path: '/admin/editor' },
    { label: 'Utilisateurs', icon: Users, path: '/admin/users' },
    { label: 'Agents', icon: ShieldCheck, path: '/admin/agents' },
    { label: 'Historique', icon: ClipboardList, path: '/admin/history' },
    { label: 'Paramètres', icon: SlidersHorizontal, path: '/admin/settings' },
  ];

  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState([
    { id: 1, title: 'Parking Zone A Saturé', desc: 'Capacité atteinte à 98%', time: 'Il y a 5 min', unread: true },
    { id: 2, title: 'Nouveau Scan Échoué', desc: 'Badge expiré détecté au portail ECOPO', time: 'Il y a 15 min', unread: true },
    { id: 3, title: 'Agent de service en retard', desc: 'Agent Kasongo n\'a pas encore pointé', time: 'Il y a 1h', unread: false },
  ]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-bg-secondary border-r border-border z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Imara Admin</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden ml-auto p-2 text-text-secondary"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/20" 
                      : "text-text-secondary hover:bg-bg-surface hover:text-accent-primary"
                  )}
                >
                  <item.icon size={20} className={cn(isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-border mt-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center font-bold text-accent-primary">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-text-muted truncate">{user?.email || 'admin@imara.cd'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-danger hover:bg-danger/10 transition-colors font-medium text-sm"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-bg-secondary border-b border-border flex items-center px-6 lg:px-10 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 lg:hidden text-text-secondary"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 ml-4 lg:ml-0">
            <div className="relative max-w-md hidden sm:block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Rechercher un utilisateur, un scan..."
                className="w-full bg-bg-surface border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-bg-secondary focus:border-accent-primary/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-widest border border-success/20">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Système En Direct
            </div>
            <ThemeToggle />
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={cn(
                  "p-2.5 rounded-xl bg-bg-surface text-text-secondary hover:text-accent-primary relative transition-colors",
                  isNotifOpen && "text-accent-primary bg-bg-secondary border border-border shadow-sm"
                )}
              >
                <Bell size={20} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger border-2 border-bg-secondary" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-bg-secondary rounded-2xl shadow-2xl border border-border z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <h4 className="font-bold">Notifications</h4>
                        <button 
                          onClick={() => setNotifications(n => n.map(notif => ({ ...notif, unread: false })))}
                          className="text-[10px] uppercase font-black text-accent-primary hover:underline"
                        >
                          Tout lire
                        </button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={cn(
                              "p-4 hover:bg-bg-surface transition-colors cursor-pointer relative",
                              notif.unread && "bg-accent-primary/5"
                            )}
                          >
                            {notif.unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary" />}
                            <p className="text-sm font-bold mb-0.5">{notif.title}</p>
                            <p className="text-xs text-text-secondary leading-tight mb-1">{notif.desc}</p>
                            <p className="text-[10px] text-text-muted">{notif.time}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-bg-surface text-center">
                        <button className="text-xs font-bold text-text-secondary hover:text-accent-primary">Voir toutes les alertes</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 lg:p-10 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
