import React from 'react';
import { Card, Button, Input } from '../components/UI';
import { ClipboardList, Download, Filter, Calendar, Search, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function HistoryScreen() {
  const logs = [
    { id: 1, time: '23/04/2026 21:04', user: 'Jean Kabamba', plate: 'AA-482-BC', type: 'ENTRÉE', parking: 'Zone A', status: 'SUCCESS' },
    { id: 2, time: '23/04/2026 21:12', user: 'Alice Mutombo', plate: 'EB-991-LX', type: 'ENTRÉE', parking: 'ECOPO', status: 'SUCCESS' },
    { id: 3, time: '23/04/2026 21:25', user: 'Inconnu', plate: 'ZG-001-FF', type: 'ENTRÉE', parking: 'Zone B', status: 'FAILED', reason: 'Parking Plein' },
    { id: 4, time: '23/04/2026 21:40', user: 'Patrick Lumu', plate: 'PR-100-CD', type: 'SORTIE', parking: 'Zone A', status: 'SUCCESS' },
    { id: 5, time: '23/04/2026 21:55', user: 'Marc Tshimanga', plate: 'CH-222-ZZ', type: 'ENTRÉE', parking: 'Église', status: 'SUCCESS' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Historique des Scans</h2>
          <p className="text-text-secondary">Consultez et exportez les rapports d'activités</p>
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
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Horodatage</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Utilisateur</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Type</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Parking</th>
                <th className="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-bg-surface/30 transition-colors">
                  <td className="p-4 whitespace-nowrap text-sm text-text-secondary">{log.time}</td>
                  <td className="p-4">
                    <p className="font-bold text-sm leading-none mb-1">{log.user}</p>
                    <p className="text-[10px] font-mono text-text-muted">{log.plate}</p>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      log.type === 'ENTRÉE' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
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
                         {log.status === 'SUCCESS' ? 'Validé' : log.reason}
                       </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
