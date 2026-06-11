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
  Info,
  ArrowRight
} from 'lucide-react';
import { Configuration, CardReader, Agent } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useSocketStore } from '../store/useSocketStore';
import { useAuthStore } from '../store/useStore';
import { useEffect } from 'react';

type AgentAssignmentDraft = {
  agentId: string;
  readerId: string;
  shiftStart: string;
  shiftEnd: string;
  status: 'ACTIVE' | 'OFFLINE';
  enabled: boolean;
};

export function ConfigurationsScreen() {
  const currentUser = useAuthStore(state => state.user);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('INFO');
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null);
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nouveaux états pour les lecteurs et agents
  const [readers, setReaders] = useState<CardReader[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [parkings, setParkings] = useState<any[]>([]);
  const [selectedReaderIds, setSelectedReaderIds] = useState<string[]>([]);
  const [agentAssignments, setAgentAssignments] = useState<AgentAssignmentDraft[]>([]);
  const { lastDiscoveredReaderId, clearLastDiscoveredReaderId } = useSocketStore();

  // États pour l'ajout manuel d'un lecteur
  const [showReaderModal, setShowReaderModal] = useState(false);
  const [newReaderData, setNewReaderData] = useState({
    id: '',
    label: '',
    location: '',
    type: 'NFC' as 'NFC' | 'RFID' | 'BOTH'
  });

  // États pour l'ajout/modification d'un parking
  const [showParkingModal, setShowParkingModal] = useState(false);
  const [newParkingData, setNewParkingData] = useState({
    id: '',
    name: '',
    type: 'VISITOR',
    capacity: 0,
  });

  // États pour les parkings et lecteurs en attente d'enregistrement
  const [stagingParkings, setStagingParkings] = useState<any[]>([]);
  const [stagingReaders, setStagingReaders] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'EDITABLE' as 'LOCKED' | 'EDITABLE'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [configsRes, readersRes, agentsRes, parkingsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/configurations`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/readers`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/agents`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/parkings`)
      ]);

      if (configsRes.ok) setConfigs(await configsRes.json());
      if (readersRes.ok) setReaders(await readersRes.json());
      if (parkingsRes.ok) setParkings(await parkingsRes.json());
      if (agentsRes.ok) {
        const rawAgents = await agentsRes.json();
        const normalizedAgents: Agent[] = (Array.isArray(rawAgents) ? rawAgents : []).map((user: any) => ({
          id: user?.agent?.id || user?.id,
          userId: user?.id,
          portail: user?.agent?.portail || '',
          status: user?.agent?.status || 'OFFLINE',
          shiftStart: user?.agent?.shiftStart || '08:00',
          shiftEnd: user?.agent?.shiftEnd || '16:00',
          readerId: user?.agent?.readerId || undefined,
          user: {
            id: user?.id,
            name: user?.name || 'Agent',
            role: 'AGENT',
            email: user?.email || undefined,
          },
          reader: user?.agent?.reader || undefined,
        }));
        setAgents(normalizedAgents);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch — runs once
  useEffect(() => {
    fetchData();
  }, []);

  // React to reader:discovered events — handled centrally in SocketProvider/store
  useEffect(() => {
    if (!lastDiscoveredReaderId) return;

    // If modal is already open, pre-fill immediately and consume the event
    if (showReaderModal) {
      setNewReaderData(prev => ({
        ...prev,
        id: lastDiscoveredReaderId,
      }));
      clearLastDiscoveredReaderId();
    }
    // If modal is not open, the value stays in the store; the button click
    // handler will consume it when the user opens the modal (see below)
  }, [lastDiscoveredReaderId, showReaderModal]); // Added showReaderModal to dependencies

  useEffect(() => {
    if (!showModal || editingConfig) return;
    setAgentAssignments(
      agents.map((agent) => ({
        agentId: agent.id,
        readerId: '',
        shiftStart: agent.shiftStart || '08:00',
        shiftEnd: agent.shiftEnd || '16:00',
        status: agent.status || 'OFFLINE',
        enabled: false,
      }))
    );
  }, [agents, showModal, editingConfig]);

  useEffect(() => {
    setAgentAssignments((prev) =>
      prev.map((assignment) => {
        if (assignment.readerId && !selectedReaderIds.includes(assignment.readerId)) {
          return { ...assignment, readerId: '', enabled: false };
        }
        return assignment;
      })
    );
  }, [selectedReaderIds]);

  const handleEdit = async (config: Configuration) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description,
      status: config.status
    });
    setError(null);

    try {
      const detailRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/configurations/${config.id}`);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const configReaders = Array.isArray(detail?.readers) ? detail.readers : [];
        const configAgents = Array.isArray(detail?.agents) ? detail.agents : [];

        setSelectedReaderIds(configReaders.map((reader: any) => reader.id));

        setAgentAssignments(
          agents.map((agent) => {
            const match = configAgents.find((item: any) => item.id === agent.id);
            return {
              agentId: agent.id,
              readerId: match?.readerId || '',
              shiftStart: match?.shiftStart || agent.shiftStart || '08:00',
              shiftEnd: match?.shiftEnd || agent.shiftEnd || '16:00',
              status: match?.status || agent.status || 'OFFLINE',
              enabled: Boolean(match),
            };
          })
        );
      }
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les détails de la configuration');
    }

    setActiveTab('INFO');
    setShowModal(true);
  };

  const steps = ['INFO', 'PARKINGS', 'READERS', 'AGENTS'];

  const goToNextStep = () => {
    if (activeTab === 'INFO') {
      if (!formData.name.trim()) {
        setError('Le nom de la configuration est obligatoire.');
        return;
      }
      setError(null);
      setActiveTab('PARKINGS');
      return;
    }

    if (activeTab === 'PARKINGS') {
      setError(null);
      setActiveTab('READERS');
      return;
    }

    if (activeTab === 'READERS') {
      if (selectedReaderIds.length === 0) {
        setError('Vous devez assigner au moins un lecteur.');
        return;
      }
      setError(null);
      setActiveTab('AGENTS');
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = steps.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(steps[currentIndex - 1]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Le nom de la configuration est obligatoire.');
      return;
    }

    if (activeTab !== 'AGENTS') {
      goToNextStep();
      return;
    }

    if (selectedReaderIds.length === 0) {
      setError('Vous devez assigner au moins un lecteur.');
      return;
    }

    const enabledAssignments = agentAssignments
      .filter((assignment) => assignment.enabled)
      .filter((assignment) => assignment.readerId && selectedReaderIds.includes(assignment.readerId));

    setIsSaving(true);
    setError(null);

    try {
      // Étape 1: Enregistrer les parkings du staging
      const createdParkingIds: string[] = [];
      for (const parking of stagingParkings) {
        if (parking.isStaging) {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/parkings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: parking.name,
              type: parking.type,
              capacity: parking.capacity,
            })
          });
          if (!res.ok) throw new Error(`Erreur lors de l'enregistrement du parking ${parking.name}`);
          const created = await res.json();
          createdParkingIds.push(created.id);
        }
      }

      // Étape 2: Enregistrer les lecteurs du staging
      const createdReaderIds: string[] = [];
      for (const reader of stagingReaders) {
        if (reader.isStaging) {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/readers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: reader.id,
              label: reader.label,
              type: reader.type,
              location: reader.location,
            })
          });
          if (!res.ok) throw new Error(`Erreur lors de l'enregistrement du lecteur ${reader.label}`);
          createdReaderIds.push(reader.id);
        }
      }

      // Étape 3: Enregistrer la configuration
      const url = editingConfig 
        ? `${import.meta.env.VITE_API_BASE_URL}/configurations/${editingConfig.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/configurations`;
      
      const method = editingConfig ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creatorId: !editingConfig ? currentUser?.id : undefined,
          readerIds: selectedReaderIds,
          agentAssignments: enabledAssignments.map((assignment) => ({
            agentId: assignment.agentId,
            readerId: assignment.readerId,
            shiftStart: assignment.shiftStart,
            shiftEnd: assignment.shiftEnd,
            status: assignment.status,
          })),
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement de la configuration');

      // Réinitialiser les éléments du staging
      setStagingParkings([]);
      setStagingReaders([]);

      await fetchData();
      setShowModal(false);
      setEditingConfig(null);
      setSelectedReaderIds([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/configurations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveParking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!newParkingData.id;
      const parkingData = {
        id: newParkingData.id || `staging-${Date.now()}`,
        name: newParkingData.name,
        type: newParkingData.type,
        capacity: parseInt(newParkingData.capacity.toString() || '0', 10),
        isStaging: true,
        currentCount: 0,
      };

      if (isEdit) {
        // Modifier un parking du staging
        setStagingParkings(prev => prev.map(p => p.id === newParkingData.id ? parkingData : p));
      } else {
        // Ajouter un nouveau parking au staging
        setStagingParkings(prev => [...prev, parkingData]);
      }

      setShowParkingModal(false);
      setNewParkingData({ id: '', name: '', type: 'VISITOR', capacity: 0 });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteParking = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce parking ?')) return;
    try {
      // Vérifier si c'est un parking du staging
      const stagingParking = stagingParkings.find(p => p.id === id);
      if (stagingParking) {
        setStagingParkings(prev => prev.filter(p => p.id !== id));
        return;
      }

      // Sinon, supprimer directement de la BD
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/parkings/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erreur lors de la suppression');
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const tabs = [
    { id: 'INFO', label: 'Informations', icon: Info },
    { id: 'PARKINGS', label: 'Parkings', icon: Building2 },
    { id: 'READERS', label: 'Lecteurs', icon: Cpu },
    { id: 'AGENTS', label: 'Agents & Horaires', icon: RouteIcon },
  ];

  if (isLoading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurations Système</h2>
          <p className="text-text-secondary">Concevez vos scénarios de déploiement et de guidage</p>
        </div>
        <Button icon={Plus} onClick={() => { 
          setEditingConfig(null); 
          setFormData({ name: '', description: '', status: 'EDITABLE' });
          setSelectedReaderIds([]);
          setAgentAssignments(
            agents.map((agent) => ({
              agentId: agent.id,
              readerId: '',
              shiftStart: agent.shiftStart || '08:00',
              shiftEnd: agent.shiftEnd || '16:00',
              status: agent.status || 'OFFLINE',
              enabled: false,
            }))
          );
          setActiveTab('INFO'); 
          setShowModal(true); 
        }}>
          Nouvelle Configuration
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3">
          <Info size={20} />
          <p>{error}</p>
        </div>
      )}

      {configs.length === 0 ? (
        <div className="text-center py-20 bg-bg-secondary rounded-3xl border border-border border-dashed">
          <Settings2 size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
          <p className="text-text-secondary font-medium">Aucune configuration trouvée.</p>
          <p className="text-sm text-text-muted">Commencez par en créer une nouvelle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {configs.map((config) => {
            const isCreator = config.creatorId === currentUser?.id;
            const canEdit = config.status === 'EDITABLE' || isCreator;

            return (
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
                          <Building2 size={12} /> {config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'N/A'}
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
                  
                  <p className="text-sm text-text-secondary mb-8 leading-relaxed max-w-md line-clamp-2 h-10">
                    {config.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-bg-surface p-4 rounded-2xl border border-border group-hover:border-accent-primary/20 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Lecteurs</p>
                        <Cpu size={14} className="text-accent-primary opacity-50" />
                      </div>
                      <p className="text-2xl font-bold">{config.readerCount || 0} <span className="text-sm font-medium text-text-muted">Unités</span></p>
                    </div>
                    <div className="bg-bg-surface p-4 rounded-2xl border border-border group-hover:border-accent-primary/20 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Agents</p>
                        <Users size={14} className="text-accent-primary opacity-50" />
                      </div>
                      <p className="text-2xl font-bold">{config.agentCount} <span className="text-sm font-medium text-text-muted">Unités</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="flex-1 shadow-lg" 
                      icon={Edit3} 
                      onClick={() => handleEdit(config)}
                      disabled={!canEdit}
                    >
                      Configurer
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      icon={Trash2} 
                      className="text-danger border-danger/20 hover:bg-danger/5" 
                      onClick={() => handleDelete(config.id)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  {!canEdit && (
                    <p className="text-[10px] text-amber-500 mt-2 font-bold flex items-center justify-center">
                      Seul le créateur peut modifier ou supprimer.
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Editor Modal - Pro Overhaul */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-5xl bg-bg-secondary rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex flex-col h-[85vh] overflow-hidden border border-border"
            >
              {/* Onboarding Header */}
              <div className="border-b border-border p-8 flex items-center justify-between bg-bg-surface/30">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Settings2 size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold">Configurateur</h3>
                       <p className="text-sm text-text-secondary">Définissez les paramètres de routage</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    {tabs.map((tab, index) => {
                      const isActive = activeTab === tab.id;
                      const isPast = steps.indexOf(activeTab) > index;
                      return (
                        <React.Fragment key={tab.id}>
                          <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300",
                            isActive ? "bg-accent-primary text-white scale-110 shadow-lg shadow-accent-primary/30" 
                            : isPast ? "bg-accent-primary/20 text-accent-primary"
                            : "bg-bg-surface text-text-muted border border-border"
                          )}>
                            {isPast ? <div className="w-2 h-2 rounded-full bg-accent-primary" /> : index + 1}
                          </div>
                          {index < tabs.length - 1 && (
                            <div className={cn(
                              "w-12 h-1 rounded-full transition-all duration-300",
                              isPast ? "bg-accent-primary/50" : "bg-border"
                            )} />
                          )}
                        </React.Fragment>
                      );
                    })}
                 </div>
                 <button type="button" onClick={() => !isSaving && setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-bg-surface hover:bg-bg-secondary text-text-muted transition-colors border border-border" title="Fermer" aria-label="Fermer">
                    <X size={20} />
                 </button>
              </div>

              {/* Onboarding Content */}
              <main className="flex-1 overflow-y-auto p-12 bg-transparent">
                 <form onSubmit={(e) => { e.preventDefault(); if (activeTab !== 'AGENTS') handleSave(e as any); }} className="max-w-3xl mx-auto h-full flex flex-col text-text-primary dark:text-white">
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
                                <Input 
                                  label="Nom de la configuration" 
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  required 
                                />
                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-text-secondary">Description</label>
                                  <textarea 
                                    className="w-full bg-bg-surface dark:bg-bg-secondary border-border border rounded-3xl py-4 px-6 outline-none focus:border-accent-primary h-32 transition-all light:text-slate-900 text-text-primary dark:text-white placeholder:text-text-muted"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Expliquez quand et comment utiliser ce scénario..."
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-secondary">Verrouillage de sécurité</label>
                                    <select 
                                      className="w-full bg-bg-surface dark:bg-bg-secondary border-border border rounded-2xl py-3 px-4 font-medium outline-none focus:border-accent-primary transition-all light:text-slate-900 text-text-primary dark:text-white"
                                      value={formData.status}
                                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                      title="Verrouillage de sécurité"
                                      aria-label="Verrouillage de sécurité"
                                    >
                                      <option value="EDITABLE">Permettre les modifications</option>
                                      <option value="LOCKED">Figer la configuration</option>
                                    </select>
                                  </div>
                                  <div className="flex items-end">
                                    <p className="text-xs text-text-muted italic mb-2">
                                      Créé le {editingConfig?.createdAt || new Date().toISOString().split('T')[0]}
                                    </p>
                                  </div>
                                </div>
                             </section>
                          </motion.div>
                         )}

                        {activeTab === 'PARKINGS' && (
                          <motion.div 
                            key="parkings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                          >
                             <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-lg font-bold">Gestion des Parkings</h4>
                                    <p className="text-sm text-text-secondary">Définissez les zones de parking et leurs capacités pour contrôler l'accès.</p>
                                  </div>
                                  <Button size="sm" type="button" variant="outline" icon={Plus} onClick={() => {
                                    setNewParkingData({ id: '', name: '', type: 'VISITOR', capacity: 0 });
                                    setShowParkingModal(true);
                                  }}>
                                    Ajouter un parking
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  {parkings.length === 0 && stagingParkings.length === 0 ? (
                                    <p className="text-sm text-text-muted italic p-6 bg-bg-surface rounded-2xl border border-dashed border-border text-center">
                                      Aucun parking disponible.
                                    </p>
                                  ) : (
                                    [...parkings, ...stagingParkings].map(parking => (
                                      <div key={parking.id} className="p-4 bg-bg-surface border border-border rounded-xl flex items-center justify-between">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="font-bold">{parking.name}</p>
                                            {parking.isStaging && <span className="text-xs bg-accent-primary text-white px-2 py-0.5 rounded-lg font-bold">En attente</span>}
                                          </div>
                                          <div className="flex gap-4 mt-1">
                                            <span className="text-xs bg-bg-secondary px-2 py-0.5 rounded text-text-muted">Type: {parking.type}</span>
                                            <span className="text-xs font-bold text-accent-primary">Places: {parking.capacity || 'Illimité'}</span>
                                            {!parking.isStaging && <span className="text-xs font-bold text-success">Occupées: {parking.currentCount}</span>}
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              setNewParkingData({ id: parking.id, name: parking.name, type: parking.type, capacity: parking.capacity });
                                              setShowParkingModal(true);
                                            }}
                                            className="p-2 text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                          >
                                            <span className="text-sm font-bold">Modifier</span>
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => handleDeleteParking(parking.id)}
                                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                            title="Supprimer"
                                            aria-label="Supprimer le parking"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                             </section>
                          </motion.div>
                        )}

                        {activeTab === 'READERS' && (
                          <motion.div 
                            key="readers"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                          >
                             <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-lg font-bold">Assignation des Lecteurs</h4>
                                    <p className="text-sm text-text-secondary">Sélectionnez un ou plusieurs lecteurs pour cette configuration.</p>
                                  </div>
                                  <Button size="sm" type="button" variant="outline" icon={Plus} onClick={() => {
                                    // Pre-fill from a pending discovered reader (scanned before modal opened)
                                    const pendingId = lastDiscoveredReaderId || '';
                                    if (pendingId) clearLastDiscoveredReaderId();
                                    setNewReaderData({ id: pendingId, label: '', location: '', type: 'NFC' });
                                    setShowReaderModal(true);
                                  }}>
                                    Ajouter un lecteur
                                  </Button>
                                </div>



                                <div className="space-y-3">
                                  {readers.length === 0 && stagingReaders.length === 0 ? (
                                    <p className="text-sm text-text-muted italic p-6 bg-bg-surface rounded-2xl border border-dashed border-border text-center">
                                      Aucun lecteur enregistré. Branchez un lecteur puis scannez une carte pour récupérer son ID automatiquement.
                                    </p>
                                  ) : (
                                    [...readers, ...stagingReaders].map((reader) => {
                                      const selected = selectedReaderIds.includes(reader.id);
                                      return (
                                        <button
                                          key={reader.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedReaderIds((prev) => {
                                              if (prev.includes(reader.id)) {
                                                return prev.filter((id) => id !== reader.id);
                                              }
                                              return [...prev, reader.id];
                                            });
                                          }}
                                          className={cn(
                                            'w-full text-left bg-bg-surface p-4 rounded-2xl border transition-all',
                                            selected ? 'border-accent-primary ring-2 ring-accent-primary/20' : 'border-border hover:border-accent-primary/40'
                                          )}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-bg-secondary rounded-xl flex items-center justify-center border border-border">
                                                <Cpu size={18} className="text-text-muted" />
                                              </div>
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <p className="font-bold text-sm">{reader.label}</p>
                                                  {reader.isStaging && <span className="text-xs bg-accent-primary text-white px-2 py-0.5 rounded-lg font-bold">En attente</span>}
                                                </div>
                                                <p className="text-[10px] text-text-muted uppercase font-bold">{reader.type} • {reader.location}</p>
                                              </div>
                                            </div>
                                            <div className={cn('text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg', selected ? 'bg-accent-primary text-white' : 'bg-bg-secondary text-text-muted border border-border')}>
                                              {selected ? 'Assigné' : 'Non assigné'}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                             </section>
                          </motion.div>
                        )}

                        {activeTab === 'AGENTS' && (
                          <motion.div key="agents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                           <div className="flex items-center justify-between mb-6">
                            <div>
                              <h4 className="text-lg font-bold">Assignation Agents et Horaires</h4>
                              <p className="text-sm text-text-secondary">Chaque agent peut etre assigné a un lecteur avec une plage horaire.</p>
                            </div>
                            {selectedReaderIds.length > 0 && agents.length > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const allEnabled = agentAssignments.every(a => a.enabled);
                                  setAgentAssignments(prev => prev.map(a => ({
                                    ...a,
                                    enabled: !allEnabled,
                                    readerId: !allEnabled && selectedReaderIds.length === 1 ? selectedReaderIds[0] : (allEnabled ? '' : a.readerId)
                                  })));
                                }}
                              >
                                {agentAssignments.every(a => a.enabled) ? 'Tout désélectionner' : 'Tout assigner'}
                              </Button>
                            )}
                           </div>

                           {selectedReaderIds.length === 0 ? (
                            <p className="text-sm text-text-muted italic p-6 bg-bg-surface rounded-2xl border border-dashed border-border text-center">
                              Selectionnez d'abord au moins un lecteur a l'etape precedente.
                            </p>
                           ) : (
                            <div className="space-y-3">
                              {agents.length === 0 ? (
                               <p className="text-sm text-text-muted italic p-6 bg-bg-surface rounded-2xl border border-dashed border-border text-center">
                                Aucun agent disponible. Creez vos agents dans Gestion des Agents.
                               </p>
                              ) : (
                               agents.map((agent) => {
                                const draft = agentAssignments.find((assignment) => assignment.agentId === agent.id);
                                const isEnabled = Boolean(draft?.enabled);
                                return (
                                  <div key={agent.id} className="bg-bg-surface p-4 rounded-2xl border border-border space-y-3">
                                   <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-bg-secondary rounded-xl flex items-center justify-center border border-border">
                                       <Users size={18} className="text-text-muted" />
                                      </div>
                                      <div>
                                       <p className="font-bold text-sm">{agent.user?.name || 'Agent'}</p>
                                       <p className="text-[11px] text-text-muted">{agent.user?.email || 'Sans email'}</p>
                                      </div>
                                    </div>
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-text-secondary">
                                      <input
                                       type="checkbox"
                                       checked={isEnabled}
                                       onChange={(e) => {
                                        setAgentAssignments((prev) => prev.map((assignment) =>
                                          assignment.agentId === agent.id
                                           ? { 
                                               ...assignment, 
                                               enabled: e.target.checked, 
                                               readerId: e.target.checked 
                                                 ? (selectedReaderIds.length === 1 ? selectedReaderIds[0] : assignment.readerId) 
                                                 : '' 
                                             }
                                           : assignment
                                        ));
                                       }}
                                       className="accent-accent-primary"
                                      />
                                      Assigner
                                    </label>
                                   </div>

                                   {isEnabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                      <div className="space-y-1">
                                       <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Lecteur assigné</label>
                                       <select
                                        className={cn(
                                          "w-full bg-bg-secondary border-border border rounded-xl py-2.5 px-3 outline-none focus:border-accent-primary light:text-slate-900 text-text-primary dark:text-white",
                                          selectedReaderIds.length === 1 && "opacity-70 cursor-not-allowed bg-bg-surface"
                                        )}
                                        value={draft?.readerId || ''}
                                        title="Lecteur assigné"
                                        aria-label="Lecteur assigné"
                                        disabled={selectedReaderIds.length === 1}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setAgentAssignments((prev) => prev.map((assignment) =>
                                           assignment.agentId === agent.id ? { ...assignment, readerId: value } : assignment
                                          ));
                                        }}
                                       >
                                        <option value="">Sélectionner un lecteur</option>
                                        {readers
                                          .filter((reader) => selectedReaderIds.includes(reader.id))
                                          .map((reader) => (
                                           <option key={reader.id} value={reader.id}>{reader.label}</option>
                                          ))}
                                       </select>
                                      </div>

                                      <div className="space-y-1">
                                       <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Debut</label>
                                       <input
                                        type="time"
                                        className="w-full bg-bg-secondary border-border border rounded-xl py-2.5 px-3 outline-none focus:border-accent-primary"
                                        value={draft?.shiftStart || '08:00'}
                                        title="Heure de début"
                                        aria-label="Heure de début"
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setAgentAssignments((prev) => prev.map((assignment) =>
                                           assignment.agentId === agent.id ? { ...assignment, shiftStart: value } : assignment
                                          ));
                                        }}
                                       />
                                      </div>

                                      <div className="space-y-1">
                                       <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Fin</label>
                                       <input
                                        type="time"
                                        className="w-full bg-bg-secondary border-border border rounded-xl py-2.5 px-3 outline-none focus:border-accent-primary"
                                        value={draft?.shiftEnd || '16:00'}
                                        title="Heure de fin"
                                        aria-label="Heure de fin"
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setAgentAssignments((prev) => prev.map((assignment) =>
                                           assignment.agentId === agent.id ? { ...assignment, shiftEnd: value } : assignment
                                          ));
                                        }}
                                       />
                                      </div>

                                      <div className="space-y-1">
                                       <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Statut</label>
                                       <select
                                        className="w-full bg-bg-secondary border-border border rounded-xl py-2.5 px-3 outline-none focus:border-accent-primary light:text-slate-900 text-text-primary dark:text-white"
                                        value={draft?.status || 'OFFLINE'}
                                        title="Statut de l'agent"
                                        aria-label="Statut de l'agent"
                                        onChange={(e) => {
                                          const value = e.target.value as 'ACTIVE' | 'OFFLINE';
                                          setAgentAssignments((prev) => prev.map((assignment) =>
                                           assignment.agentId === agent.id ? { ...assignment, status: value } : assignment
                                          ));
                                        }}
                                       >
                                        <option value="OFFLINE">Repos</option>
                                        <option value="ACTIVE">Actif</option>
                                       </select>
                                      </div>
                                    </div>
                                   )}
                                  </div>
                                );
                               })
                              )}
                            </div>
                           )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-auto pt-12 flex gap-4">
                        <Button variant="ghost" className="flex-1 h-14 rounded-2xl" type="button" onClick={() => setShowModal(false)} disabled={isSaving}>Annuler</Button>

                        {activeTab !== 'INFO' && (
                          <Button variant="outline" className="flex-1 h-14 rounded-2xl" type="button" onClick={goToPreviousStep} disabled={isSaving}>
                            Etape precedente
                          </Button>
                        )}

                        {activeTab !== 'AGENTS' ? (
                          <Button variant="primary" className="flex-1 h-14 rounded-2xl shadow-xl shadow-accent-primary/30" type="button" onClick={goToNextStep} disabled={isSaving} icon={ArrowRight}>
                            Etape suivante
                          </Button>
                        ) : (
                          <Button variant="primary" className="flex-1 h-14 rounded-2xl shadow-xl shadow-accent-primary/30" type="button" onClick={(e) => handleSave(e as any)} loading={isSaving}>
                            {editingConfig ? 'Enregistrer les Modifications' : 'Créer la Configuration'}
                          </Button>
                        )}
                      </div>
                   </form>
                </main>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ajout Parking */}
      <AnimatePresence>
        {showParkingModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowParkingModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-bg-secondary rounded-2xl shadow-2xl p-8 overflow-hidden"
            >
              <form onSubmit={handleSaveParking}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">{newParkingData.id ? 'Modifier le Parking' : 'Nouveau Parking'}</h3>
                  <button type="button" onClick={() => setShowParkingModal(false)} className="p-2 text-text-muted hover:text-text-primary" title="Fermer" aria-label="Fermer">
                    <X />
                  </button>
                </div>

                <div className="space-y-6">
                  <Input 
                    label="Nom du parking" 
                    value={newParkingData.name}
                    onChange={e => setNewParkingData({...newParkingData, name: e.target.value})}
                    placeholder="Parking Visiteurs, Zone VIP..."
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1">Type de zone</label>
                    <select 
                      className="w-full bg-bg-surface dark:bg-bg-secondary border-border border rounded-xl py-3 px-4 outline-none focus:border-accent-primary transition-all light:text-slate-900 text-text-primary dark:text-white"
                      value={newParkingData.type}
                      title="Type de zone"
                      aria-label="Type de zone"
                      onChange={e => setNewParkingData({...newParkingData, type: e.target.value as any})}
                    >
                      <option value="">Sélectionner un type...</option>
                      <option value="PROFESSOR">Professeurs</option>
                      <option value="STUDENT">Étudiants</option>
                      <option value="VISITOR">Visiteurs / Temporaire</option>
                      <option value="STAFF">Personnel / Staff</option>
                      <option value="CHURCH">Église / Chapelle</option>
                    </select>
                  </div>

                  <Input 
                    label="Capacité (Places max, 0 = illimité)" 
                    type="number"
                    min="0"
                    value={newParkingData.capacity.toString()}
                    onChange={e => setNewParkingData({...newParkingData, capacity: parseInt(e.target.value || '0', 10)})}
                    placeholder="0"
                    required
                  />

                  <div className="pt-4 flex gap-3">
                    <Button variant="ghost" className="flex-1" type="button" onClick={() => setShowParkingModal(false)}>Annuler</Button>
                    <Button variant="primary" className="flex-1" type="submit" disabled={!newParkingData.name || !newParkingData.type}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ajout Lecteur */}
      <AnimatePresence>
        {showReaderModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowReaderModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-bg-secondary rounded-2xl shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Nouveau Lecteur</h3>
                <button onClick={() => setShowReaderModal(false)} className="p-2 text-text-muted hover:text-text-primary" title="Fermer" aria-label="Fermer">
                  <X />
                </button>
              </div>

              <div className="space-y-6">
                <Input 
                  label="ID du lecteur (readerId)" 
                  value={newReaderData.id}
                  onChange={e => setNewReaderData({...newReaderData, id: e.target.value})}
                  placeholder="Scannez une carte pour auto-remplir ou saisissez l'ID..."
                  required
                />

                <Input 
                  label="Nom du lecteur (ex: Entrée Nord)" 
                  value={newReaderData.label}
                  onChange={e => setNewReaderData({...newReaderData, label: e.target.value})}
                  placeholder="Portail A, Bureau 101..."
                  required
                />

                <Input 
                  label="Emplacement / Lieu" 
                  value={newReaderData.location}
                  onChange={e => setNewReaderData({...newReaderData, location: e.target.value})}
                  placeholder="Rez-de-chaussée, Parking..."
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary ml-1">Type de technologie</label>
                  <select 
                    className="w-full bg-bg-surface dark:bg-bg-secondary border-border border rounded-xl py-3 px-4 outline-none focus:border-accent-primary transition-all light:text-slate-900 text-text-primary dark:text-white"
                    value={newReaderData.type}
                    title="Type de technologie"
                    aria-label="Type de technologie"
                    onChange={e => setNewReaderData({...newReaderData, type: e.target.value as any})}
                  >
                    <option value="NFC">NFC</option>
                    <option value="RFID">RFID</option>
                    <option value="BOTH">Les deux (NFC & RFID)</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1" type="button" onClick={() => setShowReaderModal(false)}>Annuler</Button>
                  <Button 
                    variant="primary" 
                    className="flex-1" 
                    disabled={!newReaderData.id || !newReaderData.label}
                    onClick={() => {
                      try {
                        // Ajouter le lecteur au staging
                        const readerData = {
                          ...newReaderData,
                          isStaging: true,
                        };
                        setStagingReaders((prev) => [...prev, readerData]);
                        setSelectedReaderIds((prev) => prev.includes(newReaderData.id) ? prev : [...prev, newReaderData.id]);
                        setShowReaderModal(false);
                        setNewReaderData({ id: '', label: '', location: '', type: 'NFC' });
                      } catch (err: any) {
                        setError(err.message || 'Erreur lors de la création du lecteur');
                      }
                    }}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
