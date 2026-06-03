import React, { useState } from 'react';
import { Card, Button, Input } from '../components/UI';
import { 
  Settings2, 
  Plus, 
  Lock, 
  Unlock, 
  Trash2, 
  Edit3, 
  Building2, 
  X, 
  Cpu, 
  Users, 
  Map as MapIcon, 
  Route as RouteIcon,
  ChevronRight,
  Info,
  ArrowRight
} from 'lucide-react';
import { Configuration } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function ConfigurationsScreen() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('INFO');
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null);
  const [configs, setConfigs] = useState<Configuration[]>([
    { id: '1', name: 'Imara Principal 2026', description: 'Déploiement standard pour le portail principal du Collège Imara.', status: 'LOCKED', createdAt: '2026-04-20', agentCount: 4, parkingCount: 3 },
    { id: '2', name: 'ECOPO - Session Sombre', description: 'Configuration optimisée pour les cours du soir et les événements.', status: 'EDITABLE', createdAt: '2026-04-22', agentCount: 2, parkingCount: 1 },
  ]);

  const handleEdit = (config: Configuration) => {
    setEditingConfig(config);
    setActiveTab('INFO');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setEditingConfig(null);
    alert('Configuration enregistrée avec succès !');
  };

  const tabs = [
    { id: 'INFO', label: 'Informations', icon: Info },
    { id: 'MAP', label: 'Carte & Portails', icon: MapIcon },
    { id: 'AGENTS', label: 'Lecteurs & Agents', icon: Cpu },
    { id: 'ROUTING', label: 'Règles de Routage', icon: RouteIcon },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurations Système</h2>
          <p className="text-text-secondary">Concevez vos scénarios de déploiement et de guidage</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingConfig(null); setActiveTab('INFO'); setShowModal(true); }}>
          Nouvelle Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configs.map((config) => (
          <Card key={config.id} className="group p-6 hover:shadow-xl transition-all border-l-4 border-l-transparent hover:border-l-accent-primary overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Settings2 size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-bg-surface text-accent-primary rounded-2xl flex items-center justify-center border border-border shadow-sm group-hover:bg-accent-primary group-hover:text-white transition-colors">
                    <Settings2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl group-hover:text-accent-primary transition-colors">{config.name}</h3>
                    <p className="text-xs text-text-muted flex items-center gap-1 font-medium italic">
                      <Building2 size={12} /> {config.createdAt}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm",
                  config.status === 'LOCKED' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"
                )}>
                  {config.status === 'LOCKED' ? <Lock size={12} /> : <Unlock size={12} />}
                  {config.status === 'LOCKED' ? 'Verrouillée' : 'Éditable'}
                </div>
              </div>
              
              <p className="text-sm text-text-secondary mb-8 leading-relaxed max-w-md">
                {config.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-bg-surface p-4 rounded-2xl border border-border group-hover:border-accent-primary/20 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                     <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Dispositifs</p>
                     <Cpu size={14} className="text-accent-primary opacity-50" />
                  </div>
                  <p className="text-2xl font-bold">{config.agentCount} <span className="text-sm font-medium text-text-muted">Unités</span></p>
                </div>
                <div className="bg-bg-surface p-4 rounded-2xl border border-border group-hover:border-accent-primary/20 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                     <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Zones Map</p>
                     <MapIcon size={14} className="text-accent-primary opacity-50" />
                  </div>
                  <p className="text-2xl font-bold">{config.parkingCount} <span className="text-sm font-medium text-text-muted">Pôles</span></p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="primary" size="lg" className="flex-1 shadow-lg" icon={Edit3} onClick={() => handleEdit(config)}>
                   Configurer
                </Button>
                <Button variant="outline" size="lg" icon={Trash2} className="text-danger border-danger/20 hover:bg-danger/5" onClick={() => {}} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Editor Modal - Pro Overhaul */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-bg-secondary rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex flex-col h-[85vh] overflow-hidden border border-border"
            >
              {/* Modal Sidebar */}
              <div className="flex h-full">
                <aside className="w-72 border-r border-border bg-bg-surface/30 p-10 flex flex-col gap-10">
                   <div className="space-y-1">
                      <div className="w-12 h-12 bg-accent-primary rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
                         <Settings2 size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Configurateur</h3>
                      <p className="text-xs text-text-muted">Définissez les paramètres de routage</p>
                   </div>

                   <nav className="space-y-4">
                      {tabs.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all group",
                            activeTab === tab.id 
                              ? "bg-white dark:bg-bg-secondary shadow-xl text-accent-primary border border-border scale-105" 
                              : "text-text-muted hover:text-text-primary hover:bg-bg-surface"
                          )}
                        >
                          <tab.icon size={20} className={cn(activeTab === tab.id ? "text-accent-primary" : "text-text-muted group-hover:text-text-primary")} />
                          {tab.label}
                        </button>
                      ))}
                   </nav>

                   <div className="mt-auto bg-bg-surface rounded-2xl p-4 border border-border">
                      <p className="text-[10px] font-black uppercase text-text-muted mb-2 tracking-widest">Aide</p>
                      <p className="text-[11px] leading-relaxed italic text-text-secondary">
                        Liez des lecteurs de cartes NFC/RFID aux agents pour valider les entrées.
                      </p>
                   </div>
                </aside>

                {/* Modal Content */}
                <main className="flex-1 overflow-y-auto p-12 bg-white dark:bg-bg-secondary">
                   <form onSubmit={handleSave} className="max-w-2xl mx-auto h-full flex flex-col">
                      <AnimatePresence mode="wait">
                        {activeTab === 'INFO' && (
                          <motion.div 
                            key="info"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                          >
                             <section className="space-y-6">
                                <h4 className="text-lg font-bold">Identité du Scénario</h4>
                                <Input label="Nom de la configuration" defaultValue={editingConfig?.name} required />
                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-text-secondary">Mission et Contexte</label>
                                  <textarea 
                                    className="w-full bg-bg-surface border-border border rounded-3xl py-4 px-6 outline-none focus:border-accent-primary h-32 transition-all"
                                    defaultValue={editingConfig?.description}
                                    placeholder="Expliquez quand et comment utiliser ce scénario..."
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                  <Input label="Date de déploiement" type="date" defaultValue={editingConfig?.createdAt} />
                                  <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-secondary">Verrouillage de sécurité</label>
                                    <select className="w-full bg-bg-surface border-border border rounded-2xl py-3 px-4 font-medium outline-none">
                                      <option value="EDITABLE">Permettre les modifications</option>
                                      <option value="LOCKED">Figer la configuration</option>
                                    </select>
                                  </div>
                                </div>
                             </section>
                          </motion.div>
                        )}

                        {activeTab === 'MAP' && (
                          <motion.div 
                            key="map"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                          >
                             <section className="space-y-6">
                                <h4 className="text-lg font-bold">Cartographie & Infrastructure</h4>
                                <div className="p-8 bg-bg-surface rounded-[2.5rem] border border-dashed border-border text-center space-y-6">
                                   <div className="w-24 h-24 bg-white dark:bg-bg-secondary rounded-full flex items-center justify-center mx-auto shadow-xl border border-border">
                                      <MapIcon size={40} className="text-accent-primary" />
                                   </div>
                                   <div>
                                      <p className="font-bold">Lier une Tilemap active</p>
                                      <p className="text-sm text-text-secondary">Actuellement: Carte Imara Campus v4.2</p>
                                   </div>
                                   <Button variant="outline" icon={MapIcon} onClick={() => navigate('/admin/map')}>Lancer l'Éditeur de Carte</Button>
                                </div>

                                <div className="space-y-4">
                                   <p className="text-xs font-black uppercase text-text-muted tracking-widest">Portails Détectés sur la carte</p>
                                   <div className="space-y-2">
                                      {['Portail Principal', 'Portail ECOPO', 'Entrée Technique'].map(p => (
                                        <div key={p} className="flex items-center justify-between p-4 bg-bg-surface rounded-2xl border border-border">
                                           <div className="flex items-center gap-3">
                                              <MapIcon size={16} className="text-text-muted" />
                                              <span className="font-bold text-sm tracking-tight">{p}</span>
                                           </div>
                                           <span className="text-[10px] font-mono text-text-muted">ID: PORT_{p.split(' ')[1]?.toUpperCase()}</span>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                             </section>
                          </motion.div>
                        )}

                        {activeTab === 'AGENTS' && (
                           <motion.div key="agents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                              <h4 className="text-lg font-bold">Assignation Lecteurs & Agents</h4>
                              <p className="text-sm text-text-secondary">Attribuez un lecteur de carte physique à un agent de terrain.</p>
                              
                              <div className="space-y-4">
                                 {[
                                   { reader: 'Reader #001', agent: 'Agent Mutombo', loc: 'Portail Principal' },
                                   { reader: 'Reader #002', agent: 'Agent Kasongo', loc: 'Portail ECOPO' },
                                 ].map((item, i) => (
                                   <div key={i} className="bg-bg-surface p-6 rounded-[2rem] border border-border flex items-center justify-between gap-6">
                                      <div className="flex items-center gap-4">
                                         <div className="p-3 bg-white dark:bg-bg-secondary rounded-2xl shadow-sm"><Cpu size={20} className="text-accent-primary" /></div>
                                         <div>
                                            <p className="font-bold text-sm">{item.reader}</p>
                                            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{item.loc}</p>
                                         </div>
                                      </div>
                                      <ArrowRight size={20} className="text-text-muted opacity-20" />
                                      <div className="flex items-center gap-4 bg-white dark:bg-bg-secondary px-4 py-2 rounded-2xl border border-border shadow-sm">
                                         <Users size={16} className="text-text-muted" />
                                         <span className="text-sm font-bold">{item.agent}</span>
                                      </div>
                                   </div>
                                 ))}
                                 <Button variant="outline" className="w-full h-16 border-dashed" icon={Plus}>Ajouter une Assignation</Button>
                              </div>
                           </motion.div>
                        )}

                        {activeTab === 'ROUTING' && (
                          <motion.div key="route" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                             <h4 className="text-lg font-bold">Règles de Routage (Fallback)</h4>
                             <p className="text-sm text-text-secondary italic">Si le parking réservé est plein, vers lequel diriger le conducteur ?</p>
                             
                             <div className="space-y-4">
                                <div className="grid grid-cols-7 items-center gap-4">
                                   <div className="col-span-3 p-4 bg-bg-surface rounded-2xl border border-border font-bold text-sm">Zone A (Profs)</div>
                                   <div className="flex justify-center"><ChevronRight size={20} className="text-accent-primary" /></div>
                                   <div className="col-span-3">
                                      <select className="w-full bg-bg-surface border-border border rounded-2xl py-4 px-6 font-bold outline-none focus:border-accent-primary">
                                         <option>Parking ECOPO</option>
                                         <option>Zone B (Visiteurs)</option>
                                         <option>Stationnement Rue</option>
                                      </select>
                                   </div>
                                </div>
                                <div className="grid grid-cols-7 items-center gap-4">
                                   <div className="col-span-3 p-4 bg-bg-surface rounded-2xl border border-border font-bold text-sm">ECOPO (Étudiants)</div>
                                   <div className="flex justify-center"><ChevronRight size={20} className="text-accent-primary" /></div>
                                   <div className="col-span-3">
                                      <select className="w-full bg-bg-surface border-border border rounded-2xl py-4 px-6 font-bold outline-none focus:border-accent-primary">
                                         <option>Zone B (Visiteurs)</option>
                                         <option>Terrain Sport (Exceptionnel)</option>
                                      </select>
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-auto pt-12 flex gap-4">
                        <Button variant="ghost" className="flex-1 h-14 rounded-2xl" type="button" onClick={() => setShowModal(false)}>Annuler</Button>
                        <Button variant="primary" className="flex-1 h-14 rounded-2xl shadow-xl shadow-accent-primary/30" type="submit">Enregistrer les Modifications</Button>
                      </div>
                   </form>
                </main>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
