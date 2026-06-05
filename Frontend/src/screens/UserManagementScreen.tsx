import React, { useState } from 'react';
import { Card, Button, Input } from '../components/UI';
import { cn } from '../lib/utils';
import { PexelsImage } from '../components/Common';
import { motion, AnimatePresence } from 'motion/react';
import { useSocketStore } from '../store/useSocketStore';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Car, 
  Mail, 
  MoreVertical, 
  X, 
  Shield, 
  UserCog, 
  Key, 
  Trash2, 
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function UserManagementScreen() {
  const [showModal, setShowModal] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [parkings, setParkings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    profile: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const latestSocketScan = useSocketStore((state) => state.scans[0]);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MEMBER',
    profile: 'ETUDIANT',
    licensePlate: '',
    cardId: '',
    assignedParkingId: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.profile) params.append('profile', filters.profile);

      const [usersRes, parkingsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/users?${params.toString()}`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/parkings`)
      ]);

      if (!usersRes.ok || !parkingsRes.ok) throw new Error('Erreur lors du chargement des données');

      let usersData = await usersRes.json();
      const parkingsData = await parkingsRes.json();

      // Appliquer la logique stricte: Les temporaires ne s'affichent QUE si le filtre 'TEMPORAIRE' est actif.
      if (filters.profile === 'TEMPORAIRE') {
        usersData = usersData.filter((u: any) => u.profile === null && u.role === 'MEMBER');
      } else {
        usersData = usersData.filter((u: any) => !(u.profile === null && u.role === 'MEMBER'));
      }

      setUsers(usersData);
      setParkings(parkingsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1); // Reset page on filter/search change
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters]);

  React.useEffect(() => {
    if (!latestSocketScan) return;

    // If modal is open and the scan includes a cardId (especially from an unknown card), auto-fill it
    if (showModal && latestSocketScan.cardId) {
      setFormData(prev => ({ ...prev, cardId: latestSocketScan.cardId }));
    }

    if (latestSocketScan.status !== 'SUCCESS') return;

    const scannedUserId = latestSocketScan.user?.id || latestSocketScan.userId;
    const scannedPresence = latestSocketScan.user?.presenceStatus;

    if (!scannedUserId || !scannedPresence) return;

    setUsers((prev) => {
      const index = prev.findIndex((u) => u.id === scannedUserId);
      if (index === -1) return prev;

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        presenceStatus: scannedPresence,
      };
      return updated;
    });
  }, [latestSocketScan, showModal]);

  const handleOpenAdd = (role: string) => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: role,
      profile: 'ETUDIANT',
      licensePlate: '',
      cardId: '',
      assignedParkingId: ''
    });
    setShowRoleMenu(false);
    setShowModal(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      password: '', // On ne pré-remplit pas le mot de passe
      role: user.role,
      profile: user.profile || 'ETUDIANT',
      licensePlate: user.licensePlate || '',
      cardId: user.cardId || '',
      assignedParkingId: user.assignedParkingId || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const url = editingUser 
        ? `${import.meta.env.VITE_API_BASE_URL}/users/${editingUser.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/users`;
      
      const method = editingUser ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'enregistrement');

      await fetchData();
      setShowModal(false);
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (user: any) => {
    const newPass = prompt(`Entrez le nouveau mot de passe pour ${user.name} :`);
    if (!newPass) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass }),
      });

      if (!response.ok) throw new Error('Erreur lors de la réinitialisation');
      alert('Mot de passe mis à jour !');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const profileLabels: Record<string, string> = {
    'PROFESSEUR': 'Professeur',
    'ETUDIANT': 'Étudiant',
    'PERSONNEL': 'Personnel',
    'DIRECTION': 'Direction',
    'FIDELE': 'Fidèle'
  };

  const roleInfo: Record<string, { label: string, icon: any, color: string }> = {
    'ADMIN': { label: 'Administrateur', icon: Shield, color: 'text-rose-500 bg-rose-500/10' },
    'AGENT': { label: 'Agent Sécurité', icon: UserCog, color: 'text-amber-500 bg-amber-500/10' },
    'MEMBER': { label: 'Conducteur', icon: Users, color: 'text-blue-500 bg-blue-500/10' }
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8">
      {/* ... (Header remains similar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-[60]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion Utilisateurs</h2>
          <p className="text-text-secondary">Contrôlez les accès administrateurs, agents et conducteurs</p>
        </div>
        
        <div className="relative">
          <Button 
            icon={Plus} 
            className="gap-2"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
          >
            Ajouter Utilisateur <ChevronDown size={16} />
          </Button>
          
          <AnimatePresence>
            {showRoleMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-56 bg-bg-secondary border border-border rounded-2xl shadow-2xl z-50 p-2"
              >
                {[
                  { id: 'ADMIN', label: 'Administrateur', icon: Shield, desc: 'Gestion complète du système' },
                  { id: 'AGENT', label: 'Agent Sécurité', icon: UserCog, desc: 'Accès portail et contrôle' },
                  { id: 'MEMBER', label: 'Conducteur', icon: Users, desc: 'Accès parking (Étudiants, Profs...)' }
                ].map(role => (
                  <button 
                    key={role.id}
                    onClick={() => handleOpenAdd(role.id)}
                    className="w-full flex items-start gap-3 p-3 hover:bg-bg-surface rounded-xl transition-colors text-left group"
                  >
                    <div className={cn("p-2 rounded-lg", roleInfo[role.id].color)}>
                      <role.icon size={18} />
                    </div>
                    <div>
                       <p className="text-sm font-bold">{role.label}</p>
                       <p className="text-[10px] text-text-muted">{role.desc}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Card className="p-4 bg-bg-surface/50 border-none shadow-sm relative z-50 !overflow-visible">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:max-w-sm">
             <Input 
                icon={Search} 
                placeholder="Rechercher par nom, email ou plaque..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-bg-secondary"
              />
          </div>
          <div className="flex gap-2">
             <div className="relative">
                <Button 
                  variant={activeFiltersCount > 0 ? "primary" : "outline"} 
                  icon={Filter}
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  Filtres {activeFiltersCount > 0 && <span className="bg-white text-accent-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">{activeFiltersCount}</span>}
                </Button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-72 bg-bg-secondary border border-border rounded-2xl shadow-2xl z-50 p-6 space-y-6"
                    >
                      <div className="flex items-center justify-between">
                         <h4 className="font-bold">Filtres avancés</h4>
                         <button 
                           onClick={() => setFilters({ role: '', status: '', profile: '' })}
                           className="text-[10px] font-black uppercase text-accent-primary hover:underline"
                         >
                           Réinitialiser
                         </button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Rôle</label>
                          <select 
                            className="w-full bg-bg-surface border-border border rounded-xl py-2 px-3 text-xs font-bold outline-none"
                            value={filters.role}
                            title="Filtre par rôle"
                            aria-label="Filtre par rôle"
                            onChange={(e) => {
                              const newRole = e.target.value;
                              setFilters(prev => ({ 
                                ...prev, 
                                role: newRole,
                                status: newRole === 'MEMBER' ? prev.status : '',
                                profile: newRole === 'MEMBER' ? prev.profile : ''
                              }));
                            }}
                          >
                            <option value="">Tous les rôles</option>
                            <option value="ADMIN">Administrateurs</option>
                            <option value="AGENT">Agents</option>
                            <option value="MEMBER">Conducteurs</option>
                          </select>
                        </div>
                        
                        {filters.role === 'MEMBER' && (
                          <>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Statut Présence</label>
                              <select 
                                className="w-full bg-bg-surface border-border border rounded-xl py-2 px-3 text-xs font-bold outline-none"
                                value={filters.status}
                                title="Filtre par statut de présence"
                                aria-label="Filtre par statut de présence"
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                              >
                                <option value="">Tous les statuts</option>
                                <option value="IN">Présents</option>
                                <option value="OUT">Absents</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Profil Conducteur</label>
                              <select 
                                className="w-full bg-bg-surface border-border border rounded-xl py-2 px-3 text-xs font-bold outline-none"
                                value={filters.profile}
                                title="Filtre par profil conducteur"
                                aria-label="Filtre par profil conducteur"
                                onChange={(e) => setFilters({ ...filters, profile: e.target.value })}
                              >
                                <option value="">Tous les profils (Sauf Temporaires)</option>
                                <option value="PROFESSEUR">Professeurs</option>
                                <option value="ETUDIANT">Étudiants</option>
                                <option value="PERSONNEL">Personnel</option>
                                <option value="DIRECTION">Direction</option>
                                <option value="FIDELE">Fidèle</option>
                                <option value="TEMPORAIRE">Conducteurs Temporaires</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {users.length > 0 && !isLoading && (
          <div className="hidden lg:grid grid-cols-[2.5fr_1fr_1fr_auto] gap-6 px-6 py-2 text-xs font-black uppercase tracking-widest text-text-muted border-b border-border mb-2">
            <div>Informations Utilisateur</div>
            <div>Parking Assigné</div>
            <div>Statut</div>
            <div className="text-right">Actions</div>
          </div>
        )}

        {isLoading && users.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-bg-secondary rounded-3xl border border-border border-dashed">
            <Users size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
            <p className="text-text-secondary font-medium">Aucun utilisateur trouvé.</p>
          </div>
        ) : paginatedUsers.map((user) => (
          <Card key={user.id} className="p-4 hover:bg-bg-surface/30 transition-all border-none group">
            <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr_1fr_auto] items-center gap-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner", roleInfo[user.role]?.color || "bg-bg-surface")}>
                   {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">{user.name}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                      roleInfo[user.role]?.color
                    )}>{roleInfo[user.role]?.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-text-muted">
                    {user.email && (
                      <p className="text-xs flex items-center gap-1.5"><Mail size={14} /> {user.email}</p>
                    )}
                    {user.licensePlate && (
                      <p className="text-xs flex items-center gap-1.5"><Car size={14} /> {user.licensePlate}</p>
                    )}
                    {user.role === 'MEMBER' && (
                      <span className="text-[10px] bg-bg-surface px-2 py-0.5 rounded font-bold">{profileLabels[user.profile] || user.profile}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                 {user.role === 'MEMBER' && (
                   <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 lg:hidden">Parking</p>
                      <p className="text-sm font-bold text-text-primary">{user.assignedParking?.name || '--'}</p>
                   </div>
                 )}
              </div>

              <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 lg:hidden">Statut</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", user.presenceStatus === 'IN' ? "bg-success animate-pulse" : "bg-text-muted")} />
                    <span className={cn("text-xs font-bold", user.presenceStatus === 'IN' ? "text-success" : "text-text-muted")}>
                      {user.presenceStatus === 'IN' ? 'Présent' : 'Absent'}
                    </span>
                  </div>
              </div>

              <div className="flex items-center gap-2 justify-end border-t lg:border-none pt-4 lg:pt-0">
                 <button 
                   onClick={() => handleEdit(user)}
                   title="Modifier"
                   className="p-2.5 hover:bg-bg-surface rounded-xl text-text-muted hover:text-accent-primary transition-colors"
                 >
                   <MoreVertical size={20} />
                 </button>
                 {(user.role === 'ADMIN' || user.role === 'AGENT') && (
                   <button 
                     onClick={() => handleResetPassword(user)}
                     title="Réinitialiser MDP"
                     className="p-2.5 hover:bg-bg-surface rounded-xl text-text-muted hover:text-amber-500 transition-colors"
                   >
                     <Key size={20} />
                   </button>
                 )}
                 {!user.isSuperAdmin && (
                   <button 
                     onClick={() => handleDelete(user.id)}
                     title="Supprimer"
                     className="p-2.5 hover:bg-danger/10 rounded-xl text-text-muted hover:text-danger transition-colors"
                   >
                     <Trash2 size={20} />
                   </button>
                 )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <p className="text-sm text-text-muted font-medium">
            Affichage de <span className="text-text-primary font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text-primary font-bold">{Math.min(currentPage * itemsPerPage, users.length)}</span> sur <span className="text-text-primary font-bold">{users.length}</span> résultats
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3"
            >
              <ChevronLeft size={18} />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center text-sm",
                    currentPage === i + 1 
                      ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/20" 
                      : "text-text-muted hover:bg-bg-surface hover:text-text-primary"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => !isSaving && setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-bg-secondary rounded-[2rem] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight">{editingUser ? 'Édition Profil' : 'Nouvel Utilisateur'}</h3>
                    <p className="text-text-muted mt-1 font-medium">Type: {roleInfo[formData.role]?.label}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-full bg-bg-surface text-text-muted hover:text-text-primary transition-all" title="Fermer" aria-label="Fermer">
                    <X size={24} />
                  </button>
                </div>

                {error && (
                  <div className="mb-8 p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm font-bold flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-danger" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="Nom complet" 
                      placeholder="Ex: Jean Paul"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required 
                      className="bg-bg-surface h-14"
                    />
                    {(formData.role === 'ADMIN' || formData.role === 'AGENT') && (
                      <Input 
                        label="Adresse Email" 
                        type="email"
                        placeholder="nom@ecopo.cd"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required 
                        className="bg-bg-surface h-14"
                      />
                    )}
                  </div>

                  {(formData.role === 'ADMIN' || formData.role === 'AGENT') && !editingUser && (
                    <Input 
                      label="Mot de passe initial" 
                      type="password"
                      placeholder="Minimum 6 caractères"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required 
                      className="bg-bg-surface h-14"
                    />
                  )}

                  {formData.role === 'MEMBER' && (
                    <>
                      <div className="grid grid-cols-2 gap-6">
                        <Input 
                          label="Plaque d'immatriculation" 
                          placeholder="Ex: AA-000-BB"
                          value={formData.licensePlate}
                          onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                          required 
                          className="bg-bg-surface h-14"
                        />
                        <Input 
                          label="ID Badge / NFC" 
                          placeholder="Code série" 
                          value={formData.cardId}
                          onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                          className="bg-bg-surface h-14"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Profil Conducteur</label>
                          <select 
                            className="w-full bg-bg-surface border-border border rounded-2xl h-14 px-5 font-bold outline-none focus:border-accent-primary transition-all appearance-none"
                            value={formData.profile}
                            title="Profil Conducteur"
                            aria-label="Profil Conducteur"
                            onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                          >
                            <option value="PROFESSEUR">👨‍🏫 Professeur</option>
                            <option value="ETUDIANT">🎓 Étudiant ECOPO</option>
                            <option value="PERSONNEL">🏢 Personnel</option>
                            <option value="DIRECTION">💼 Direction</option>
                            <option value="FIDELE">⛪ Fidèle Église</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Parking Assigné</label>
                          <select 
                            className="w-full bg-bg-surface border-border border rounded-2xl h-14 px-5 font-bold outline-none focus:border-accent-primary transition-all appearance-none"
                            value={formData.assignedParkingId}
                            title="Parking Assigné"
                            aria-label="Parking Assigné"
                            onChange={(e) => setFormData({ ...formData, assignedParkingId: e.target.value })}
                          >
                            <option value="">🚫 Aucun parking</option>
                            {parkings.map(p => (
                              <option key={p.id} value={p.id}>🅿️ {p.name} ({p.type})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="pt-6 flex gap-4">
                    <Button variant="ghost" className="flex-1 h-16 rounded-2xl font-bold" type="button" onClick={() => setShowModal(false)} disabled={isSaving}>Annuler</Button>
                    <Button variant="primary" className="flex-1 h-16 rounded-2xl font-black text-lg shadow-xl shadow-accent-primary/20" type="submit" loading={isSaving}>
                      {editingUser ? 'Mettre à jour' : 'Enregistrer'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
