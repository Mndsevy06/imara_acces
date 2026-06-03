import React, { useState } from 'react';
import { Card, Button, Input } from '../components/UI';
import { ShieldCheck, Plus, Calendar, Clock, MapPin, UserCheck, MoreVertical, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function AgentManagementScreen() {
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [agents, setAgents] = useState([
    { id: '1', name: 'Agent Mutombo', portail: 'Entrée Principale', status: 'ACTIVE', shift: '08:00 - 16:00' },
    { id: '2', name: 'Agent Kasongo', portail: 'Portail ECOPO', status: 'ACTIVE', shift: '08:00 - 16:00' },
    { id: '3', name: 'Agent Lumu', portail: 'Entrée Principale', status: 'OFFLINE', shift: '16:00 - 00:00' },
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setEditingAgent(null);
    alert('Agent enregistré avec succès !');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agents de Sécurité</h2>
          <p className="text-text-secondary">Planifiez les tours de garde et assignez les portails</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingAgent(null); setShowModal(true); }}>Nouvel Agent</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
             <UserCheck size={32} />
          </div>
          <div>
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm font-medium text-text-secondary">Total Agents</p>
          </div>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-success/10 text-success flex items-center justify-center">
             <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-3xl font-bold">8</p>
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
        <h3 className="font-bold text-lg px-2">Agents à leurs postes</h3>
        {agents.map((agent) => (
          <Card key={agent.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-11 h-11 rounded-full bg-bg-surface flex items-center justify-center font-bold text-text-secondary border border-border">
                 {agent.name.split(' ')[1][0]}
               </div>
               <div>
                  <h4 className="font-bold text-sm">{agent.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <MapPin size={12} /> {agent.portail}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={12} /> {agent.shift}
                    </span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className={cn(
                 "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                 agent.status === 'ACTIVE' ? "bg-success/10 text-success" : "bg-bg-surface text-text-muted"
               )}>
                 {agent.status === 'ACTIVE' ? 'En Service' : 'Fin de Service'}
               </div>
               <button 
                 onClick={() => { setEditingAgent(agent); setShowModal(true); }}
                 className="p-2 hover:bg-bg-surface rounded-lg transition-colors"
               >
                  <MoreVertical size={18} />
               </button>
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
                <h3 className="text-2xl font-bold">{editingAgent ? 'Modifier Agent' : 'Nouvel Agent'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-text-primary">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <Input label="Nom complet" defaultValue={editingAgent?.name} required />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1">Portail assigné</label>
                    <select className="w-full bg-bg-surface border-border border rounded-xl py-3 px-4 outline-none" defaultValue={editingAgent?.portail || 'Entrée Principale'}>
                      <option value="Entrée Principale">Entrée Principale</option>
                      <option value="Portail ECOPO">Portail ECOPO</option>
                      <option value="Entrée Église">Entrée Église</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1">Lecteur Carte ID</label>
                    <select className="w-full bg-bg-surface border-border border rounded-xl py-3 px-4 outline-none" defaultValue={editingAgent?.readerId || 'READER_01'}>
                      <option value="READER_01">Lecteur #001 (NFC)</option>
                      <option value="READER_02">Lecteur #002 (RFID)</option>
                      <option value="READER_03">Lecteur #003 (QR)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Heure Début" type="time" defaultValue={editingAgent?.shift?.split(' - ')[0] || '08:00'} />
                  <Input label="Heure Fin" type="time" defaultValue={editingAgent?.shift?.split(' - ')[1] || '16:00'} />
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
