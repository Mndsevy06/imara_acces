import React, { useState } from 'react';
import { Card, Button, Input } from '../components/UI';
import { SlidersHorizontal, Bell, Shield, Database, Layout, User, Save, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useThemeStore } from '../store/useStore';

export function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('PROFIL');
  const [vocalGuidance, setVocalGuidance] = useState(true);
  const [strictCapacity, setStrictCapacity] = useState(false);
  const [notifs, setNotifs] = useState(true);

  const handleSave = () => {
    alert('Paramètres système mis à jour avec succès !');
  };

  const tabs = [
    { id: 'PROFIL', icon: User, label: 'Profil Admin' },
    { id: 'APP', icon: Layout, label: 'Apparence' },
    { id: 'NOTIF', icon: Bell, label: 'Notifications' },
    { id: 'SECURE', icon: Shield, label: 'Sécurité' },
    { id: 'DATA', icon: Database, label: 'Données' },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Paramètres du Système</h2>
        <p className="text-text-secondary">Configurez vos préférences globales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 space-y-2">
           {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id ? "bg-accent-primary text-white shadow-md" : "text-text-secondary hover:bg-bg-surface"
              )}
             >
               <tab.icon size={18} />
               {tab.label}
             </button>
           ))}
        </aside>

        <section className="md:col-span-3 space-y-6">
           <Card className="p-6">
              {activeTab === 'PROFIL' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-lg mb-6">Informations de l'Établissement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Nom de l'établissement" defaultValue="Collège Imara / ECOPO" />
                    <Input label="Email de support" defaultValue="support@imara.cd" />
                  </div>
                  <Input label="Adresse Physique" defaultValue="Avenue de l'Église, Lubumbashi" />
                  
                  <div className="space-y-6 pt-4 border-t border-border">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-text-muted">Options de Guidage</h4>
                    <ToggleItem 
                      label="Mode de Guidage Vocal" 
                      desc="Activer la synthèse vocale pour les conducteurs" 
                      active={vocalGuidance} 
                      onChange={setVocalGuidance} 
                    />
                    <ToggleItem 
                      label="Contrôle Strict de Capacité" 
                      desc="Interdire l'entrée si le parking est saturé" 
                      active={strictCapacity} 
                      onChange={setStrictCapacity} 
                    />
                  </div>
                </div>
              )}

              {activeTab === 'APP' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-lg mb-6">Personnalisation de l'Interface</h3>
                  <ToggleItem 
                    label="Mode Sombre" 
                    desc="Appliquer le thème sombre sur tous les terminaux" 
                    active={isDarkMode} 
                    onChange={toggleTheme} 
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Couleur d'accentuation</p>
                    <div className="flex gap-3">
                       {['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'].map(color => (
                         <div key={color} className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" style={{ backgroundColor: color }} />
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'NOTIF' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-lg mb-6">Alertes et Notifications</h3>
                  <ToggleItem 
                    label="Alertes Parking Plein" 
                    desc="Notifier les agents quand un parking atteint 95%" 
                    active={notifs} 
                    onChange={(val) => {
                      setNotifs(val);
                      if (val) {
                        alert('Notifications push activées !');
                      }
                    }} 
                  />
                  <ToggleItem 
                    label="Rapports Journaliers" 
                    desc="Envoyer un résumé PDF chaque soir par email" 
                    active={true} 
                    onChange={() => alert('Option réservée aux administrateurs certifiés')} 
                  />
                </div>
              )}

              {activeTab === 'SECURE' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-lg mb-6">Sécurité des Accès</h3>
                  <div className="space-y-4">
                    <Input label="Nouveau mot de passe admin" type="password" />
                    <Input label="Confirmer le mot de passe" type="password" />
                    <Button variant="outline" size="sm">Changer le mot de passe</Button>
                  </div>
                  <div className="pt-6 border-t border-border">
                    <ToggleItem 
                      label="Double Authentification" 
                      desc="Requérir un code OTP pour les nouveaux agents" 
                      active={false} 
                      onChange={() => {}} 
                    />
                  </div>
                </div>
              )}

              {activeTab === 'DATA' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-lg mb-6">Gestion des Données</h3>
                  <Card className="bg-bg-surface border-dashed p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Sauvegarde Cloud</p>
                      <p className="text-xs text-text-muted">Dernière sauvegarde: il y a 2h</p>
                    </div>
                    <Button variant="outline" size="sm">Sauvegarder maintenant</Button>
                  </Card>
                  <div className="pt-4 space-y-4">
                    <p className="text-sm font-bold text-danger">Zone de danger</p>
                    <Button variant="outline" className="text-danger border-danger/20 hover:bg-danger/5 w-full justify-start" icon={Trash2}>
                      Réinitialiser toutes les données de parking
                    </Button>
                  </div>
                </div>
              )}
           </Card>

           <div className="flex justify-end gap-3 text-right">
              <Button variant="outline" onClick={() => { setVocalGuidance(true); setStrictCapacity(false); }}>Réinitialiser</Button>
              <Button icon={Save} onClick={handleSave}>Enregistrer les changements</Button>
           </div>
        </section>
      </div>
    </div>
  );
}

function ToggleItem({ label, desc, active, onChange }: { label: string, desc: string, active: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-bg-surface rounded-xl border border-border">
      <div>
        <p className="font-bold text-sm">{label}</p>
        <p className="text-xs text-text-muted">{desc}</p>
      </div>
      <div 
        onClick={() => onChange(!active)}
        className={cn(
          "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors",
          active ? "bg-accent-primary" : "bg-text-muted/20"
        )}
      >
        <div className={cn(
          "w-4 h-4 bg-white rounded-full transition-all",
          active ? "ml-auto" : "ml-0"
        )} />
      </div>
    </div>
  );
}
