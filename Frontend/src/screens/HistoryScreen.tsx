import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { ClipboardList, Download, Filter, Calendar, Search, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSocketStore } from '../store/useSocketStore';

export function HistoryScreen() {
  const [fetchedLogs, setFetchedLogs] = useState<any[]>([]);
  
  // Ecoute du store global qui reçoit les sockets en temps réel
  const realtimeScans = useSocketStore(state => state.scans);

  function formatLogEntry(raw: any) {
    const timestamp: string = raw.timestamp ?? new Date().toISOString();
    const dateObj = new Date(timestamp);
    return {
      id: raw.id,
      timestamp,
      date: dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hour: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      user: raw.user?.name ?? raw.user ?? raw.userNameSnapshot ?? 'Inconnu',
      plate: raw.user?.licensePlate ?? raw.plate ?? raw.plateSnapshot ?? 'N/A',
      type: raw.type ?? raw.eventType,
      parking: raw.parking?.name ?? raw.parking ?? 'Inconnu',
      status: raw.status,
      reason: raw.reason ?? raw.failReason ?? undefined,
      source: raw.source ?? 'PHONE',
    };
  }

  // ── Initial fetch from API ──────────────────────────────────────────────────
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    
    // Fonction robuste pour aller chercher les dernières données de l'API
    const loadScans = async () => {
      try {
        const r = await fetch(`${baseUrl}/scans`);
        if (r.ok) {
          const data = await r.json();
          const formatted = (Array.isArray(data) ? data : []).map(formatLogEntry);
          setFetchedLogs(formatted);
        }
      } catch (err) {
        console.error('Erreur chargement logs', err);
      }
    };

    // Premier chargement
    loadScans();

    // SOLUTION RADICALE: Rafraîchissement garanti du tableau de l'historique
    // Même si la connexion Socket/WebSocket tombe ou est ignorée, 
    // le tableau ira vérifier l'API toutes les 2,5 secondes en arrière-plan sans rechargement de page.
    const autoRefreshInterval = setInterval(loadScans, 2500);

    return () => clearInterval(autoRefreshInterval);
  }, []);

  // On combine astucieusement les logs historiques (API) et les logs websockets (store)
  const displayLogs = React.useMemo(() => {
    const formattedRealtime = realtimeScans.map(formatLogEntry);
    const realtimeIds = new Set(formattedRealtime.map(s => s.id));
    
    // On ajoute les anciens logs qui ne sont pas DEJA dans les logs reçus en temps réel
    const oldLogs = fetchedLogs.filter(l => !realtimeIds.has(l.id));
    
    const combined = [...formattedRealtime, ...oldLogs];
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return combined.slice(0, 100); // Garder les 100 plus récents
  }, [fetchedLogs, realtimeScans]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Historique des Scans</h2>
          <p className="text-text-secondary">Consultez et exportez les rapports d'activités en temps réel</p>
        </div>
        <Button variant="outline" icon={Download} onClick={() => alert('Le téléchargement du rapport CSV va commencer...')}>Exporter CSV</Button>
      </div>

      <Card className="p-4 bg-bg-surface/50 border-dashed">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Input icon={Search} placeholder="Rechercher..." />
           <Input icon={Calendar} type="date" />
           <Button variant="outline" icon={Filter} className="w-full">Filtrer par parking</Button>
           <Button variant="secondary" className="w-full">Appliquer</Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface border-b border-border">
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Date</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Heure</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Utilisateur</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Type</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Parking</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Résultat</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted italic">Aucun scan enregistré</td>
                </tr>
              ) : (
                displayLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-bg-surface/30 transition-colors">
                    <td className="p-4 whitespace-nowrap text-sm text-text-secondary">{log.date}</td>
                    <td className="p-4 whitespace-nowrap text-sm text-text-secondary">{log.hour}</td>
                    <td className="p-4">
                      <p className="font-bold text-sm leading-none mb-1">{log.user}</p>
                      <p className="text-[10px] font-mono text-text-muted">{log.plate}</p>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        log.type === 'ENTREE' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                      )}>{log.type}</span>
                    </td>
                    <td className="p-4 text-sm font-medium">{log.parking}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                         {log.status === 'SUCCESS' ? (
                           <CheckCircle2 size={16} className="text-success" />
                         ) : (
                           <XCircle size={16} className="text-danger" />
                         )}
                         <span className={cn("text-xs font-bold", log.status === 'SUCCESS' ? "text-success" : "text-danger")}>
                           {log.status === 'SUCCESS' ? 'Validé' : (log.reason || 'Échec')}
                         </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        log.source === 'BOITIER'
                          ? 'bg-orange-500/10 text-orange-500'
                          : 'bg-sky-500/10 text-sky-500'
                      )}>
                        {log.source === 'BOITIER' ? '📡 Boitier' : '📱 Téléphone'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

