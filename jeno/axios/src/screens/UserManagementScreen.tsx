import React, { useState } from 'react';
import { Card, Button, Input } from '../components/UI';
import { Users, Search, Plus, Filter, Car, Mail, MoreVertical, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { PexelsImage } from '../components/Common';
import { motion, AnimatePresence } from 'motion/react';

export function UserManagementScreen() {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [users, setUsers] = useState([
    { id: '1', name: 'Jean Kabamba', profile: 'Professeur', plate: 'AA-482-BC', parking: 'Zone A', status: 'IN' },
    { id: '2', name: 'Alice Mutombo', profile: 'Étudiant', plate: 'EB-991-LX', parking: 'ECOPO', status: 'OUT' },
    { id: '3', name: 'Patrick Lumu', profile: 'Direction', plate: 'PR-100-CD', parking: 'Zone A', status: 'IN' },
    { id: '4', name: 'Marie Tshimanga', profile: 'Fidèle', plate: 'CH-222-ZZ', parking: 'Église', status: 'OUT' },
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setEditingUser(null);
    alert('Utilisateur enregistré avec succès !');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Utilisateurs</h2>
          <p className="text-text-secondary">Gérez les accès et les profils adhérents</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingUser(null); setShowModal(true); }}>Ajouter Adhérent</Button>
      </div>

      <Card className="p-4 bg-bg-surface/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
             <Input icon={Search} placeholder="Rechercher par nom ou plaque..." />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" icon={Filter}>Filtres</Button>
             <Button variant="outline">Tous les profils</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4 hover:bg-bg-surface/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold">
                 {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold">{user.name}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    user.profile === 'Professeur' ? "bg-blue-500/10 text-blue-500" :
                    user.profile === 'Étudiant' ? "bg-purple-500/10 text-purple-500" :
                    "bg-slate-500/10 text-slate-500"
                  )}>{user.profile}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-text-muted flex items-center gap-1">
                    <Car size={12} /> {user.plate}
                  </p>
                  <p className="text-xs text-text-muted flex items-center gap-1">
                    <Mail size={12} /> {user.parking}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Statut</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <div className={cn("w-2 h-2 rounded-full", user.status === 'IN' ? "bg-success animate-pulse" : "bg-text-muted")} />
                    <span className={cn("text-xs font-bold", user.status === 'IN' ? "text-success" : "text-text-muted")}>
                      {user.status === 'IN' ? 'Sur place' : 'Sorti'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => { setEditingUser(user); setShowModal(true); }}
                  className="p-2 hover:bg-bg-surface rounded-lg text-text-muted"
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-lg bg-bg-secondary rounded-2xl shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">{editingUser ? 'Modifier Adhérent' : 'Ajouter Adhérent'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-text-primary">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <Input label="Nom complet" defaultValue={editingUser?.name} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Plaque d'immatriculation" defaultValue={editingUser?.plate} required />
                  <Input label="ID Carte NFC / Badge" placeholder="XXXXXXXXX" defaultValue={editingUser?.cardId} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1">Profil</label>
                    <select className="w-full bg-bg-surface border-border border rounded-xl py-3 px-4 outline-none" defaultValue={editingUser?.profile || 'Étudiant'}>
                      <option value="Professeur">Professeur</option>
                      <option value="Étudiant">Étudiant ECOPO</option>
                      <option value="Personnel">Personnel</option>
                      <option value="Direction">Direction</option>
                      <option value="Fidèle">Fidèle Église</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary ml-1">Parking assigné</label>
                  <select className="w-full bg-bg-surface border-border border rounded-xl py-3 px-4 outline-none" defaultValue={editingUser?.parking || 'Zone A'}>
                    <option value="Zone A">Zone A (Profs)</option>
                    <option value="Zone B">Zone B (Visiteurs)</option>
                    <option value="ECOPO">ECOPO (Étudiants)</option>
                    <option value="Église">Église</option>
                  </select>
                </div>
                
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
