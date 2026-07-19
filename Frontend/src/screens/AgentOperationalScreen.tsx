import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '../components/UI';
import {
  ShieldCheck,
  LogOut,
  Clock,
  CheckCircle2,
  XCircle,
  Nfc,
  Loader2,
  Wifi,
  WifiOff,
  Save,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { useSocketStore } from '../store/useSocketStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Capacitor } from '@capacitor/core';
import { CapacitorNfc } from '@capgo/capacitor-nfc';

export function AgentOperationalScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isConnected, scans } = useSocketStore();

  const [scanStatus, setScanStatus] = useState<'WAITING' | 'SUCCESS' | 'FAILED'>('WAITING');
  const [activeTab, setActiveTab] = useState<'AUTO' | 'NFC-WRITE' | 'NFC-DELETE'>('AUTO');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentScan, setCurrentScan] = useState<any>(null);
  const [scanPulseKey, setScanPulseKey] = useState(0);
  const [isNfcDetected, setIsNfcDetected] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPlate, setVisitorPlate] = useState('');
  const [parkings, setParkings] = useState<any[]>([]);
  const [selectedParkingId, setSelectedParkingId] = useState('');
  const [toast, setToast] = useState<{ status: 'SUCCESS' | 'ERROR'; message: string } | null>(null);
  // 'INIT' = waiting for deviceready, 'READY' = NFC listeners active, 'UNAVAILABLE' = NFC not found
  const [nfcStatus, setNfcStatus] = useState<'INIT' | 'READY' | 'UNAVAILABLE'>('INIT');

  // Refs to avoid stale closures in NFC callbacks
  const nfcHandlerRef = useRef<any>(null);
  const activeTabRef = useRef(activeTab);
  const isWritingRef = useRef(isWriting);
  const isDeletingRef = useRef(isDeleting);
  const visitorNameRef = useRef(visitorName);
  const visitorPlateRef = useRef(visitorPlate);
  const selectedParkingIdRef = useRef(selectedParkingId);
  const displayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProcessedScanIdRef = useRef<string | null>(null);
  const isProcessingNfcRef = useRef(false);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { isWritingRef.current = isWriting; }, [isWriting]);
  useEffect(() => { isDeletingRef.current = isDeleting; }, [isDeleting]);
  useEffect(() => { visitorNameRef.current = visitorName; }, [visitorName]);
  useEffect(() => { visitorPlateRef.current = visitorPlate; }, [visitorPlate]);
  useEffect(() => { selectedParkingIdRef.current = selectedParkingId; }, [selectedParkingId]);

  // Fetch parkings on mount
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/parkings`)
      .then(res => res.json())
      .then(data => {
        setParkings(data);
        if (data.length > 0) setSelectedParkingId(data[0].id);
      })
      .catch(err => console.error('[Parkings] Fetch error:', err));
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── NFC setup ────────────────────────────────────────────────────────────────
  const setupNfc = async () => {
    if (!Capacitor.isNativePlatform()) {
      setNfcStatus('UNAVAILABLE');
      return;
    }
    if (nfcHandlerRef.current) return;

    try {
      await CapacitorNfc.startScanning();
      const handler = (event: any) => handleNfcScan(event);
      nfcHandlerRef.current = await CapacitorNfc.addListener('tagDiscovered', handler);
      setNfcStatus('READY');
      console.log('[NFC] Listener activé');
    } catch (err) {
      console.error('[NFC] Erreur listener:', err);
      setNfcStatus('UNAVAILABLE');
    }
  };

  const teardownNfc = async () => {
    if (!Capacitor.isNativePlatform()) return;
    if (nfcHandlerRef.current) {
      try {
        await CapacitorNfc.stopScanning();
        await nfcHandlerRef.current.remove();
      } catch (err) {
        console.error('[NFC] Erreur retrait listener:', err);
      }
      nfcHandlerRef.current = null;
    }
  };

  useEffect(() => {
    const init = async () => { await teardownNfc(); await setupNfc(); };
    init();

    const handleResume = () => { init(); };
    document.addEventListener('resume', handleResume);

    return () => {
      document.removeEventListener('resume', handleResume);
      teardownNfc();
      if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── WebSocket Scan Listener ──────────────────────────────────────────────────
  useEffect(() => {
    if (scans.length > 0) {
      const latestScan = scans[0];
      
      // Update local parkings array with real-time capacity from WebSocket
      if (latestScan.parking) {
        setParkings(prev => prev.map(p => 
          p.id === latestScan.parking.id ? latestScan.parking : p
        ));
      }

      if (activeTab === 'AUTO') {
        const scanTime = new Date(latestScan.timestamp || Date.now()).getTime();
        
        // On ignore les vieux scans (de plus de 5 secondes) ou déjà traités
        if (Date.now() - scanTime < 5000 && lastProcessedScanIdRef.current !== latestScan.id) {
          lastProcessedScanIdRef.current = latestScan.id;
          setScanPulseKey(prev => prev + 1);
          setScanStatus(latestScan.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED');
          setCurrentScan(latestScan);
          
          if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
          displayTimerRef.current = setTimeout(() => { 
            setScanStatus('WAITING'); 
            setCurrentScan(null); 
          }, 5000);
        }
      }
    }
  }, [scans, activeTab]);

  // ── NFC scan handler ─────────────────────────────────────────────────────────
  const handleNfcScan = (event: any) => {
    if (isProcessingNfcRef.current) return;
    isProcessingNfcRef.current = true;
    setTimeout(() => { isProcessingNfcRef.current = false; }, 3000);

    console.log('[NFC] Événement reçu — tag:', JSON.stringify(event));

    // Vérification des horaires de l'agent
    if (user?.role === 'AGENT' && user?.agent) {
      const { shiftStart, shiftEnd } = user.agent;
      const now = new Date();
      const currentHHmm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      const isWithinShift = shiftStart <= shiftEnd 
        ? (currentHHmm >= shiftStart && currentHHmm <= shiftEnd)
        : (currentHHmm >= shiftStart || currentHHmm <= shiftEnd);
      
      if (!isWithinShift) {
        showToast('ERROR', `Accès refusé : Vous êtes hors de votre horaire de service (${shiftStart} - ${shiftEnd})`);
        setIsNfcDetected(false);
        setIsWriting(false);
        setIsDeleting(false);
        return;
      }
    }

    try {
      // @capgo/capacitor-nfc usually provides event.id or event.tag.id directly as hex/string
      // or event.tag.id as an array. We handle multiple formats just in case.
      const tag = event.tag || event;
      if (!tag || !tag.id) {
        console.warn('[NFC] Événement sans identifiant UID:', JSON.stringify(tag));
        return;
      }

      let cardId = '';
      if (Array.isArray(tag.id)) {
        cardId = tag.id.map((b: number) => (b & 0xFF).toString(16).padStart(2, '0')).join('');
      } else if (typeof tag.id === 'string') {
        cardId = tag.id;
      }

      cardId = cardId.replace(/[:\-\s]/g, '').toUpperCase();
      console.log('[NFC] Card ID:', cardId);

      setIsNfcDetected(true);
      setTimeout(() => setIsNfcDetected(false), 2500);

      const tab = activeTabRef.current;
      if (tab === 'AUTO') {
        verifyCard(cardId);
      } else if (tab === 'NFC-WRITE' && isWritingRef.current) {
        performWriteNFC(cardId);
      } else if (tab === 'NFC-DELETE' && isDeletingRef.current) {
        performDeleteNFC(cardId);
      }
    } catch (err) {
      console.error('[NFC] handleNfcScan erreur:', err);
    }
  };

  const showToast = (status: 'SUCCESS' | 'ERROR', message: string) => {
    setToast({ status, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  // ── API calls ────────────────────────────────────────────────────────────────
  const verifyCard = async (cardId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/scans/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, readerId: user?.agent?.readerId ?? undefined, source: 'PHONE' }),
      });
      const payload = await res.json().catch(() => ({}));
      setScanPulseKey(prev => prev + 1);
      setScanStatus(payload.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED');
      const scanData = payload.log || payload;
      if (!scanData.id) scanData.id = `local-${Date.now()}`;
      lastProcessedScanIdRef.current = scanData.id;
      setCurrentScan(scanData);
      if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
      displayTimerRef.current = setTimeout(() => { setScanStatus('WAITING'); setCurrentScan(null); }, 5000);
    } catch {
      setScanPulseKey(prev => prev + 1);
      setScanStatus('FAILED');
      setCurrentScan({ id: `err-${Date.now()}`, failReason: 'Serveur injoignable' });
      if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
      displayTimerRef.current = setTimeout(() => { setScanStatus('WAITING'); setCurrentScan(null); }, 5000);
    }
  };

  const performWriteNFC = async (cardId: string) => {
    const name = visitorNameRef.current;
    const plate = visitorPlateRef.current;
    const parkingId = selectedParkingIdRef.current;
    
    if (!plate || !parkingId) {
      showToast('ERROR', 'Veuillez remplir la plaque et sélectionner un parking');
      return;
    }
    try {
      // L'écriture physique est ignorée, on lie uniquement l'UID côté base de données

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || 'Conducteur Temporaire', licensePlate: plate, cardId, parkingId }),
      });

      const data = await res.json();

      setIsWriting(false);
      
      if (res.ok) {
        setVisitorName('');
        setVisitorPlate('');
        showToast('SUCCESS', `Carte programmée : ${plate}`);
        
        // Rafraîchir les parkings pour avoir le compte à jour
        fetch(`${import.meta.env.VITE_API_BASE_URL}/parkings`)
          .then(r => r.json())
          .then(setParkings)
          .catch(console.error);
      } else {
        showToast('ERROR', data.error || 'Erreur d\'enregistrement');
      }
    } catch (err: any) {
      console.error('[NFC] Erreur écriture :', err);
      setIsWriting(false);
      showToast('ERROR', `Écriture échouée : ${err.message || 'rapprochez mieux la carte'}`);
    }
  };

  const performDeleteNFC = async (cardId: string) => {
    try {
      // On se contente d'effacer le lien en base de données, pas besoin de toucher à la carte physiquement

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/visitors`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });

      setIsDeleting(false);
      
      if (res.ok) {
        showToast('SUCCESS', 'Carte réinitialisée avec succès');
        fetch(`${import.meta.env.VITE_API_BASE_URL}/parkings`)
          .then(r => r.json())
          .then(setParkings)
          .catch(console.error);
      } else {
        showToast('ERROR', 'Tag effacé — erreur base de données');
      }
    } catch (err: any) {
      console.error('[NFC] Erreur suppression :', err);
      setIsDeleting(false);
      showToast('ERROR', `Erreur réinitialisation : ${err.message || ''}`);
    }
  };

  const simulateScan = (type: 'SUCCESS' | 'FAILED') => {
    verifyCard(type === 'SUCCESS' ? 'CARTE_TEST_123' : 'CARTE_INVALIDE');
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-screen bg-bg-primary flex flex-col overflow-hidden max-w-md mx-auto border-x border-border shadow-2xl">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-0 left-0 right-0 z-50 px-4 pt-3 pb-2"
          >
            <div className={cn(
              'flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl border',
              toast.status === 'SUCCESS' ? 'bg-success text-white border-success' : 'bg-danger text-white border-danger',
            )}>
              {toast.status === 'SUCCESS'
                ? <CheckCircle2 size={22} className="shrink-0" />
                : <XCircle size={22} className="shrink-0" />}
              <p className="font-bold text-sm">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-bg-secondary p-5 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-primary/10 text-accent-primary rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            {(() => {
              const currentHour = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              const start = user?.agent?.shiftStart || '08:00';
              const end = user?.agent?.shiftEnd || '16:00';
              const isWithinShift = start <= end
                ? (currentHour >= start && currentHour <= end)
                : (currentHour >= start || currentHour <= end);
              return (
                <div className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-0.5',
                  isWithinShift ? 'bg-accent-primary/10 text-accent-primary' : 'bg-amber-500/10 text-amber-500'
                )}>
                  <Clock size={10} />
                  {isWithinShift ? 'Opérationnel' : 'Hors service'}
                </div>
              );
            })()}
            <p className="font-bold text-sm truncate">{user?.name || 'Agent Mobile'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
              isConnected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}>
              {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isConnected ? 'En ligne' : 'Hors ligne'}
            </div>
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
          <button
            onClick={() => navigate('/')}
            className="p-2 text-text-muted hover:text-danger"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 overflow-y-auto flex flex-col">

        {/* Status indicator */}
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
                  <div className={cn(
                    'relative w-40 h-40 rounded-full border-4 border-dashed flex items-center justify-center transition-colors duration-300',
                    isNfcDetected ? 'border-success bg-success/10' : 'border-accent-primary',
                  )}>
                    {isNfcDetected
                      ? <CheckCircle2 size={48} className="text-success" />
                      : (isWriting || isDeleting)
                        ? <Nfc size={48} className="text-accent-primary animate-pulse" />
                        : <Loader2 size={48} className="text-accent-primary animate-spin" />}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {isWriting ? 'Approchez la carte...' : isDeleting ? 'Approchez pour effacer...' : 'En attente de scan...'}
                  </h2>
                  <p className="text-text-secondary">
                    {isWriting ? "Prêt pour l'écriture du conducteur" : 'Prêt pour la détection au portail'}
                  </p>
                </div>
                {!Capacitor.isNativePlatform() && (
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => simulateScan('SUCCESS')}>Simul Succès</Button>
                    <Button size="sm" variant="outline" onClick={() => simulateScan('FAILED')}>Simul Échec</Button>
                  </div>
                )}
              </motion.div>
            ) : scanStatus === 'SUCCESS' ? (
              <motion.div
                key={`success-${currentScan?.id}-${scanPulseKey}`}
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="w-48 h-48 rounded-full bg-success flex items-center justify-center shadow-xl shadow-success/30">
                  <CheckCircle2 size={96} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-success uppercase tracking-tighter">
                    {currentScan?.eventType === 'ENTREE' ? 'ENTRÉE VALIDÉE' : 'SORTIE VALIDÉE'}
                  </h2>
                  <p className="text-text-secondary font-medium">Badge valide détecté</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`failed-${currentScan?.id}-${scanPulseKey}`}
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="w-48 h-48 rounded-full bg-danger flex items-center justify-center shadow-xl shadow-danger/30">
                  <XCircle size={96} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-danger uppercase tracking-tighter">
                    {currentScan?.failReason === 'Carte non reconnue' ? 'CARTE INCONNUE' : 'ACCÈS REFUSÉ'}
                  </h2>
                  <p className="text-text-secondary font-medium italic">
                    {currentScan?.failReason === 'Carte non reconnue'
                      ? "Cette carte n'est enregistrée dans aucun compte"
                      : currentScan?.failReason || 'Badge non valide'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scan detail card */}
        <AnimatePresence>
          {scanStatus !== 'WAITING' && currentScan && (
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
                    <p className="font-bold truncate">{currentScan.userNameSnapshot || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Destination</p>
                    <p className="font-bold truncate">{currentScan.parking?.name || 'Inconnu'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Plaque</p>
                    <p className="font-mono font-bold bg-white dark:bg-bg-secondary px-2 py-0.5 rounded border border-border truncate">
                      {currentScan.plateSnapshot || '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Statut</p>
                    <p className={cn('font-bold', scanStatus === 'SUCCESS' ? 'text-success' : 'text-danger')}>
                      {scanStatus === 'SUCCESS' ? 'AUTORISÉ' : currentScan.failReason || 'REFUSÉ'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom panel */}
        <div className="bg-bg-secondary border-t border-border mt-auto p-6 space-y-6">
          <div className="flex bg-bg-surface p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('AUTO'); setIsWriting(false); setIsDeleting(false); }}
              className={cn('flex-1 py-2 text-xs font-bold rounded-lg transition-all', activeTab === 'AUTO' ? 'bg-white dark:bg-bg-secondary shadow-sm text-accent-primary' : 'text-text-muted')}
            >
              SCAN AUTO
            </button>
            <button
              onClick={() => { setActiveTab('NFC-WRITE'); setIsDeleting(false); }}
              className={cn('flex-1 py-2 text-xs font-bold rounded-lg transition-all', activeTab === 'NFC-WRITE' ? 'bg-white dark:bg-bg-secondary shadow-sm text-accent-primary' : 'text-text-muted')}
            >
              CONDUCTEUR TEMP.
            </button>
            <button
              onClick={() => { setActiveTab('NFC-DELETE'); setIsWriting(false); }}
              className={cn('flex-1 py-2 text-xs font-bold rounded-lg transition-all', activeTab === 'NFC-DELETE' ? 'bg-white dark:bg-bg-secondary shadow-sm text-accent-primary' : 'text-text-muted')}
            >
              LIBÉRER CARTE
            </button>
          </div>

          <div className="space-y-4 min-h-[140px]">
            {activeTab === 'AUTO' && (
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <Nfc size={40} className={cn(
                    nfcStatus === 'READY' ? 'text-success opacity-70' : 'text-text-muted opacity-20'
                  )} />
                </div>
                <p className="text-sm text-text-muted">Approchez une carte pour valider l'entrée ou la sortie automatiquement.</p>
                {/* NFC status badge — helps diagnose if the plugin isn't ready */}
                <div className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
                  nfcStatus === 'READY' ? 'bg-success/10 text-success' :
                  nfcStatus === 'UNAVAILABLE' ? 'bg-danger/10 text-danger' :
                  'bg-text-muted/10 text-text-muted',
                )}>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    nfcStatus === 'READY' ? 'bg-success animate-pulse' :
                    nfcStatus === 'UNAVAILABLE' ? 'bg-danger' : 'bg-text-muted',
                  )} />
                  {nfcStatus === 'READY' ? 'NFC Actif' : nfcStatus === 'UNAVAILABLE' ? 'NFC Indisponible' : 'NFC Init...'}
                </div>
              </div>
            )}

            {activeTab === 'NFC-WRITE' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Nom du conducteur"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="bg-bg-surface border border-border rounded-xl px-4 py-2 font-bold"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="PLAQUE D'IMMATRICULATION"
                      value={visitorPlate}
                      onChange={(e) => setVisitorPlate(e.target.value.toUpperCase())}
                      className="flex-1 bg-bg-surface border border-border rounded-xl px-4 font-mono font-bold"
                    />
                    <Button
                      icon={isWriting ? Loader2 : Save}
                      disabled={!visitorPlate || !selectedParkingId || isWriting}
                      onClick={() => setIsWriting(true)}
                      className={isWriting ? 'animate-pulse' : ''}
                    >
                      {isWriting ? 'Prêt...' : 'Valider'}
                    </Button>
                  </div>
                  
                  <div className="flex flex-col mt-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 ml-1">Destination du visiteur</label>
                    <select
                      value={selectedParkingId}
                      onChange={(e) => setSelectedParkingId(e.target.value)}
                      title="Parking de destination"
                      aria-label="Parking de destination"
                      className="w-full bg-bg-surface border-border border rounded-xl py-2 px-3 text-sm font-bold outline-none"
                    >
                      {parkings.length === 0 && <option value="">Chargement...</option>}
                      {parkings.map(p => {
                        const isFull = p.capacity > 0 && p.currentCount >= p.capacity;
                        return (
                          <option key={p.id} value={p.id} disabled={isFull}>
                            {p.name} ({p.currentCount}/{p.capacity || '∞'}) {isFull ? '- PLEIN' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                {isWriting
                  ? <p className="text-[10px] text-accent-primary text-center font-bold animate-bounce uppercase">Touchez la carte avec le téléphone maintenant !</p>
                  : <p className="text-[10px] text-text-muted text-center italic">Remplissez les infos, cliquez Valider, puis approchez la carte.</p>}
              </div>
            )}

            {activeTab === 'NFC-DELETE' && (
              <button
                onClick={() => setIsDeleting(prev => !prev)}
                className={cn(
                  'w-full flex flex-col items-center justify-center py-6 gap-3 border border-dashed rounded-xl transition-all',
                  isDeleting ? 'bg-danger/10 border-danger animate-pulse' : 'bg-danger/5 border-danger/20 hover:bg-danger/10',
                )}
              >
                {isDeleting ? (
                  <>
                    <Nfc size={32} className="text-danger" />
                    <p className="text-sm font-bold text-danger uppercase">Approchez la carte à effacer</p>
                  </>
                ) : (
                  <>
                    <Trash2 size={32} className="text-danger" />
                    <p className="text-sm font-bold text-danger">Cliquer pour activer la suppression</p>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

