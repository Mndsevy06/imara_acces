import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { ShieldCheck, Plus, Calendar, Clock, MapPin, UserCheck, MoreVertical, X, Edit, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function AgentManagementScreen() {
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [readers, setReaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    portail: 'Entrée Principale',
    shiftStart: '08:00',
    shiftEnd: '16:00',
    readerId: '',
    status: 'ACTIVE'
  });

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/agents`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReaders = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/readers`);
      if (res.ok) {
        const data = await res.json();
        setReaders(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchReaders();
  }, []);

  const handleOpenAdd = () => {
    setEditingAgent(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      portail: 'Entrée Principale',
      shiftStart: '08:00',
      shiftEnd: '16:00',
      readerId: readers.length > 0 ? readers[0].id : '',
      status: 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingAgent(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      password: '',
      portail: user.agent?.portail || 'Entrée Principale',
      shiftStart: user.agent?.shiftStart || '08:00',
      shiftEnd: user.agent?.shiftEnd || '16:00',
      readerId: user.agent?.readerId || '',
      status: user.agent?.status || 'OFFLINE'
    });
    setActiveDropdown(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAgent 
        ? `${import.meta.env.VITE_API_BASE_URL}/agents/${editingAgent.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/agents`;
      
      const method = editingAgent ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      await fetchAgents();
      setShowModal(false);
      setEditingAgent(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet agent ?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/agents/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchAgents();
      }
    } catch (error) {
      console.error(error);
    }
    setActiveDropdown(null);
  };

  const activeAgentsCount = agents.filter(a => a.agent?.status === 'ACTIVE').length;

  return (
    <div className="space-y-8" onClick={() => setActiveDropdown(null)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agents de Sécurité</h2>
          <p className="text-text-secondary">Planifiez les tours de garde et assignez les portails</p>
        </div>
        <Button icon={Plus} onClick={handleOpenAdd}>Nouvel Agent</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
             <UserCheck size={32} />
          </div>
          <div>
            <p className="text-3xl font-bold">{agents.length}</p>
            <p className="text-sm font-medium text-text-secondary">Total Agents</p>
          </div>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-success/10 text-success flex items-center justify-center">
             <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-3xl font-bold">{activeAgentsCount}</p>
            <p className="text-sm font-medium text-text-secondary">Actuellement en service</p>
          </div>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-warning/10 text-warning flex items-center justify-center">
             <Calendar size={32} />
          </div>
          <div>
            <p className="text-3xl font-bold">24h</p>
            <p className="text-sm font-medium text-text-secondary">Couverture Sécurité</p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {/* En-tête du tableau */}
        <div className="hidden lg:grid grid-cols-[2fr_1fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-2 text-xs font-black uppercase tracking-widest text-text-muted border-b border-border">
          <div>Nom complet</div>
          <div>Portail</div>
          <div>Lecteur RFID</div>
          <div>Horaires</div>
          <div>Statut</div>
          <div className="text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-10 text-text-muted bg-bg-secondary rounded-2xl border border-border border-dashed">
             Aucun agent trouvé.
          </div>
        ) : (
          agents.map((user) => (
            <Card 
              key={user.id} 
              className={cn(
                "p-4 flex items-center justify-between !overflow-visible relative",
                activeDropdown === user.id ? "z-50" : "z-10"
              )}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1.2fr_1fr_1fr] w-full items-center gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-11 h-11 rounded-full bg-bg-surface flex items-center justify-center font-bold text-text-secondary border border-border">
                     {user.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <h4 className="font-bold text-sm">{user.name}</h4>
                      <div className="text-xs text-text-muted">{user.email}</div>
                   </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-text-muted" /> 
                  <span className="font-medium">{user.agent?.portail || 'Non assigné'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-accent-primary">{user.agent?.reader?.label || 'Aucun lecteur'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-text-muted" /> 
                  <span className="font-medium">{user.agent?.shiftStart || '--'} - {user.agent?.shiftEnd || '--'}</span>
                </div>

                <div>
                   <div className={cn(
                     "inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                     user.agent?.status === 'ACTIVE' ? "bg-success/10 text-success" : "bg-bg-surface text-text-muted"
                   )}>
                     {user.agent?.status === 'ACTIVE' ? 'En Service' : 'Fin de Service'}
                   </div>
                </div>
              </div>

              <div className="relative flex items-center justify-end pl-4">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     setActiveDropdown(activeDropdown === user.id ? null : user.id);
                   }}
                   className="p-2 hover:bg-bg-surface rounded-lg transition-colors"
                 >
                    <MoreVertical size={18} />
                 </button>
                 
                 <AnimatePresence>
                   {activeDropdown === user.id && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95, y: -10 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95, y: -10 }}
                       className="absolute right-0 top-full mt-1 w-40 bg-bg-secondary border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                     >
                       <button 
                         onClick={() => handleOpenEdit(user)}
                         className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-bg-surface transition-colors"
                       >
                         <Edit size={16} /> Modifier
                       </button>
                       <button 
                         onClick={() => handleDelete(user.id)}
                         className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                       >
                         <Trash2 size={16} /> Supprimer
                       </button>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            </Card>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-bg-secondary rounded-2xl shadow-2xl p-8 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">{editingAgent ? 'Modifier Agent' : 'Nouvel Agent'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-text-primary">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <Input 
                  label="Nom complet" 
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                  required 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Email" 
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
                    required 
                    autoComplete="off"
                  />
                  {!editingAgent && (
                    <Input 
                      label="Mot de passe" 
                      type="password"
                      value={formData.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
                      required 
                      autoComplete="new-password"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1">Portail assigné</label>
                    <select 
                      className="w-full bg-bg-surface border-border border rounded-xl py-3 px-4 outline-none" 
                      value={formData.portail}
                      onChange={e => setFormData({...formData, portail: e.target.value})}
                    >
                      <option value="Entrée Principale">Entrée Principale</option>
                      <option value="Portail ECOPO">Portail ECOPO</option>
                      <option value="Entrée Église">Entrée Église</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1">Lecteur Carte RFID</label>
                    <select 
                      className="w-full bg-bg-surface border-border border rounded-xl py-3 px-4 outline-none" 
                      value={formData.readerId}
                      onChange={e => setFormData({...formData, readerId: e.target.value})}
                    >
                      <option value="">-- Sélectionner un lecteur --</option>
                      {readers.map((reader: any) => (
                        <option key={reader.id} value={reader.id}>
                          {reader.label} ({reader.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Heure Début" 
                    type="time" 
                    value={formData.shiftStart}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, shiftStart: e.target.value})}
                  />
                  <Input 
                    label="Heure Fin" 
                    type="time" 
                    value={formData.shiftEnd}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, shiftEnd: e.target.value})}
                  />
                </div>

                {editingAgent && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1">Statut Présence</label>
                    <select 
                      className="w-full bg-bg-surface border-border border rounded-xl py-3 px-4 outline-none" 
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="ACTIVE">En Service</option>
                      <option value="OFFLINE">Fin de Service</option>
                    </select>
                  </div>
                )}
                
                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1" type="button" onClick={() => setShowModal(false)}>Annuler</Button>
                  <Button variant="primary" className="flex-1" type="submit">Enregistrer</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
