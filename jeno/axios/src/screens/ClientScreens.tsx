import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/UI';
import { 
  Car, 
  Map as MapIcon, 
  Volume2, 
  Navigation, 
  LogOut, 
  ScanLine,
  ArrowRight,
  ArrowUp,
  X,
  ParkingSquare
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PexelsImage } from '../components/Common';
import { cn } from '../lib/utils';

export function ClientGuidanceSystem() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [step, setStep] = useState<'STANDBY' | 'GUIDANCE'>('STANDBY');

  // Simulate receiving a scan event from WebSocket
  useEffect(() => {
    if (step === 'STANDBY') {
      const timer = setTimeout(() => {
        setStep('GUIDANCE');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleFinish = () => {
    setStep('STANDBY');
  };

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden max-w-md mx-auto border-x border-border shadow-2xl relative">
      <AnimatePresence mode="wait">
        {step === 'STANDBY' ? (
          <motion.div
            key="standby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col pt-20"
          >
             <PexelsImage query="car" className="absolute inset-0 z-0 h-full w-full opacity-30 blur-sm" />
             <div className="relative z-10 px-8 space-y-12 text-center">
                <div className="space-y-4">
                   <div className="w-24 h-24 bg-accent-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-accent-primary/20">
                      <ScanLine size={48} className="text-accent-primary animate-pulse" />
                   </div>
                   <h2 className="text-3xl font-bold">Bienvenue, {user?.name || 'Visiteur'}</h2>
                   <p className="text-text-secondary leading-relaxed">
                     Approchez votre badge du lecteur au portail pour activer votre itinéraire.
                   </p>
                </div>

                <Card className="p-6 bg-bg-secondary/50 backdrop-blur-md">
                   <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Votre Identifiant</p>
                   <div className="flex items-center justify-center gap-4">
                      <div className="p-3 bg-bg-surface rounded-xl">
                         <Car size={24} className="text-accent-primary" />
                      </div>
                      <div className="text-left font-mono text-xl font-bold letter-spacing-tight">
                         {user?.licensePlate || 'AA-1234-CD'}
                      </div>
                   </div>
                </Card>

                <button 
                  onClick={() => navigate('/')} 
                  className="mx-auto flex items-center gap-2 text-text-secondary hover:text-danger text-sm font-medium pt-8"
                >
                  <LogOut size={16} />
                  Se déconnecter
                </button>
             </div>
          </motion.div>
        ) : (
          <motion.div
            key="guidance"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="flex-1 flex flex-col bg-bg-primary z-20"
          >
            {/* Header Guidance */}
            <div className="bg-accent-primary p-6 text-white text-center pb-12 rounded-b-[40px] shadow-lg relative">
              <button 
                onClick={handleFinish}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-primary mb-2 shadow-xl">
                    <ArrowUp size={32} />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">DROIT DEVANT</h3>
                    <p className="text-white/80 font-medium italic">Vers Parking ECOPO (Place n°42)</p>
                 </div>
              </div>
            </div>

            {/* Map Preview */}
            <div className="flex-1 p-6 -mt-8 flex flex-col min-h-0">
               <Card className="flex-1 shadow-2xl relative overflow-hidden bg-bg-surface p-4 flex items-center justify-center border-none">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,0.2)_1px,transparent_0)] bg-[size:24px_24px]" />
                  
                  {/* Real Grid for Client Map Display */}
                  <div className="grid grid-cols-5 gap-1.5 relative z-10 w-full max-w-[320px]">
                     {Array(25).fill(null).map((_, i) => {
                       const isPath = [22, 17, 12, 7, 6, 5].includes(i);
                       return (
                        <motion.div 
                          key={i} 
                          initial={isPath ? { scale: 0, opacity: 0 } : { opacity: 0.1 }}
                          animate={{ scale: 1, opacity: isPath ? 1 : 0.05 }}
                          transition={{ delay: i * 0.02 }}
                          className={cn(
                            "aspect-square rounded-md flex items-center justify-center transition-all",
                            isPath ? "bg-accent-primary shadow-lg ring-2 ring-white/50" : "bg-text-muted/10",
                            i === 22 && "bg-success scale-110 !opacity-100",
                            i === 5 && "bg-indigo-500 scale-110 !opacity-100"
                          )}
                        >
                          {i === 22 && <DoorOpen size={14} className="text-white" />}
                          {i === 5 && <ParkingSquare size={14} className="text-white" />}
                          {isPath && i !== 22 && i !== 5 && (
                            <div className="w-1 h-1 rounded-full bg-white/80 animate-pulse" />
                          )}
                        </motion.div>
                       );
                     })}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <div className="bg-white/90 backdrop-blur dark:bg-bg-secondary/90 px-3 py-1.5 rounded-full border border-border text-[10px] font-bold text-text-secondary flex items-center gap-2">
                       <Navigation size={12} className="text-accent-primary" />
                       GUIDAGE ACTIF
                    </div>
                    <div className="bg-white/90 backdrop-blur dark:bg-bg-secondary/90 px-3 py-1.5 rounded-full border border-border text-[10px] font-bold text-text-secondary">
                       85 m restant
                    </div>
                  </div>
               </Card>
            </div>

            {/* Vocal Controls Bar */}
            <div className="p-6 pt-0 flex gap-4">
               <Button variant="outline" className="flex-1 h-14 rounded-2xl" icon={Volume2}>
                 Réécouter
               </Button>
               <Button variant="primary" className="flex-1 h-14 rounded-2xl" onClick={handleFinish}>
                 J'ai garé
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DoorOpen = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);
