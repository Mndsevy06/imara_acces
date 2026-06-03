import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/UI';
import { 
  ShieldCheck, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Car, 
  User, 
  Nfc,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function AgentOperationalScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [scanStatus, setScanStatus] = useState<'WAITING' | 'SUCCESS' | 'FAILED'>('WAITING');
  const [activeTab, setActiveTab] = useState<'AUTO' | 'NFC-WRITE' | 'NFC-DELETE'>('AUTO');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate a scan detection for demo
  const simulateScan = (type: 'SUCCESS' | 'FAILED') => {
    setScanStatus(type);
    setTimeout(() => setScanStatus('WAITING'), 5000);
  };

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden max-w-md mx-auto border-x border-border shadow-2xl">
      {/* Header */}
      <header className="bg-bg-secondary p-5 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-primary/10 text-accent-primary rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Agent en service</p>
            <p className="font-bold text-sm truncate">{user?.name || 'Agent #218'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-accent-primary font-mono font-bold text-sm">
              <Clock size={14} />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <p className="text-[10px] text-success font-bold uppercase tracking-widest">Portail Imara</p>
          </div>
          <button onClick={() => navigate('/')} className="p-2 text-text-muted hover:text-danger">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Status Indicator */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-6 text-center">
          <AnimatePresence mode="wait">
            {scanStatus === 'WAITING' ? (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-primary/20 rounded-full animate-ping" />
                  <div className="relative w-40 h-40 rounded-full border-4 border-dashed border-accent-primary flex items-center justify-center">
                    <Loader2 size={48} className="text-accent-primary animate-spin" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">En attente de scan...</h2>
                  <p className="text-text-secondary">Prêt pour la détection au portail principal</p>
                </div>
              </motion.div>
            ) : scanStatus === 'SUCCESS' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="w-48 h-48 rounded-full bg-success flex items-center justify-center shadow-xl shadow-success/30">
                  <CheckCircle2 size={96} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-success uppercase tracking-tighter">ACCÈS AUTORISÉ</h2>
                  <p className="text-text-secondary font-medium">Badge valide détecté</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="w-48 h-48 rounded-full bg-danger flex items-center justify-center shadow-xl shadow-danger/30">
                  <XCircle size={96} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-danger uppercase tracking-tighter">ACCÈS REFUSÉ</h2>
                  <p className="text-text-secondary font-medium italic">Vérifiez la capacité du parking</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scan Info Detail */}
        <AnimatePresence>
          {scanStatus !== 'WAITING' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6"
            >
              <Card className="p-5 border-2 border-accent-primary/50 bg-accent-primary/5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Usager</p>
                    <p className="font-bold">Jean Kabamba</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Destination</p>
                    <p className="font-bold">Parking Profs</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Plaque</p>
                    <p className="font-mono font-bold bg-white dark:bg-bg-secondary px-2 py-0.5 rounded border border-border">AA-482-BC</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Places</p>
                    <p className="font-bold text-success">8 / 50 libres</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visitor Controls */}
        <div className="bg-bg-secondary border-t border-border mt-auto p-6 space-y-6">
          <div className="flex bg-bg-surface p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('AUTO')}
              className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", activeTab === 'AUTO' ? "bg-white dark:bg-bg-secondary shadow-sm text-accent-primary" : "text-text-muted")}
            >
              AUTO
            </button>
            <button 
              onClick={() => setActiveTab('NFC-WRITE')}
              className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", activeTab === 'NFC-WRITE' ? "bg-white dark:bg-bg-secondary shadow-sm text-accent-primary" : "text-text-muted")}
            >
              ÉCRIRE NFC
            </button>
            <button 
              onClick={() => setActiveTab('NFC-DELETE')}
              className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", activeTab === 'NFC-DELETE' ? "bg-white dark:bg-bg-secondary shadow-sm text-accent-primary" : "text-text-muted")}
            >
              EFFACER NFC
            </button>
          </div>

          <div className="space-y-4 min-h-[140px]">
             {activeTab === 'AUTO' && (
               <div className="grid grid-cols-2 gap-3">
                 <Button variant="secondary" className="h-24 flex-col gap-1" onClick={() => simulateScan('SUCCESS')}>
                   <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success mb-2">
                     <CheckCircle2 size={24} />
                   </div>
                   Tester Succès
                 </Button>
                 <Button variant="secondary" className="h-24 flex-col gap-1" onClick={() => simulateScan('FAILED')}>
                   <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-2">
                     <XCircle size={24} />
                   </div>
                   Tester Échec
                 </Button>
               </div>
             )}

             {activeTab === 'NFC-WRITE' && (
               <div className="space-y-3">
                 <div className="flex gap-2">
                    <input type="text" placeholder="PLAQUE" className="flex-1 bg-bg-surface border border-border rounded-xl px-4 font-mono font-bold" />
                    <Button icon={Nfc}>Enregistrer</Button>
                 </div>
                 <p className="text-[10px] text-text-muted text-center italic">Approchez une carte vierge du dos de votre téléphone après avoir validé.</p>
               </div>
             )}

             {activeTab === 'NFC-DELETE' && (
               <div className="flex flex-col items-center justify-center py-4 gap-3 bg-danger/5 border border-dashed border-danger/20 rounded-xl">
                 <Nfc size={32} className="text-danger animate-bounce" />
                 <p className="text-sm font-bold text-danger">Lire pour réinitialiser la carte</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
