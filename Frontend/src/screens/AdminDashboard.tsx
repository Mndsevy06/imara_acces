import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI';
import { 
  Car, 
  ParkingSquare, 
  ScanBarcode, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { PexelsImage } from '../components/Common';
import { useNavigate } from 'react-router-dom';
import { useSocketStore } from '../store/useSocketStore';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { scans: realTimeScans, parkingData: socketParkingData } = useSocketStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard`);
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Chargement initial
    fetchDashboardData();

    // SOLUTION RADICALE: Rafraichir le dashboard automatiquement
    const autoRefreshInterval = setInterval(fetchDashboardData, 2500);

    return () => clearInterval(autoRefreshInterval);
  }, []);

  const stats = [
    { label: 'Véhicules Présents', value: dashboardData?.stats?.totalVehicles ?? '...', icon: Car, trend: '', color: 'blue' },
    { label: 'Places Libres', value: dashboardData?.stats?.freeSpaces ?? '...', icon: ParkingSquare, trend: '', color: 'green' },
    { label: 'Scans du Jour', value: dashboardData?.stats?.scansToday ?? '...', icon: ScanBarcode, trend: '', color: 'indigo' },
    { label: 'Agents Actifs', value: dashboardData?.stats?.activeAgents ?? '...', icon: ShieldCheck, trend: 'En service', color: 'slate' },
  ];

  const dbScans = dashboardData?.recentScans || [];

  // Combine real-time scans with DB scans, deduplicating by id
  const displayScans = Array.from(new Map([...realTimeScans, ...dbScans].map(s => [s.id, s])).values()).slice(0, 8);
  
  // Merge socket parking data with DB parking data
  const mergedParkingData = { ...dashboardData?.parkingData, ...socketParkingData };

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <Card className="relative p-0 border-none overflow-hidden h-64 flex flex-col justify-end">
        <PexelsImage query="car" className="absolute inset-0 z-0" />
        <div className="relative z-10 p-8 lg:p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold mb-2 tracking-tight">Bonjour, Super Admin</h2>
            <p className="text-white/80 max-w-lg">
              Le système fonctionne normalement. Toutes les zones de parking sont opérationnelles et les agents sont à leurs postes.
            </p>
          </motion.div>
        </div>
      </Card>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Real-time Flow */}
        <Card className="xl:col-span-2">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-lg">Flux de Scans en Temps Réel</h3>
            <button 
              onClick={() => navigate('/admin/history')}
              className="text-sm font-medium text-accent-primary hover:underline outline-none"
            >
              Voir tout l'historique
            </button>
          </div>
          <div className="divide-y divide-border">
            {displayScans.map((scan) => (
              <div key={scan.id} className="p-4 flex items-center gap-4 hover:bg-bg-surface transition-colors">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  scan.status === 'SUCCESS' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                )}>
                  {scan.status === 'SUCCESS' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold truncate">{scan.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg-surface text-text-muted uppercase tracking-wider">{scan.profile}</span>
                  </div>
                  <p className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span className={cn(
                      "font-bold",
                      scan.type === 'ENTRÉE' ? "text-blue-500" : "text-purple-500"
                    )}>{scan.type}</span>
                    <span>•</span>
                    <span>{scan.parking}</span>
                    {scan.reason && (
                      <>
                        <span>•</span>
                        <span className="text-danger font-medium">{scan.reason}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-text-muted flex items-center justify-end gap-1">
                    <Clock size={12} />
                    {scan.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Capacity Gauges */}
        <Card>
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-lg">Capacité des Parkings</h3>
          </div>
          <div className="p-6 space-y-8">
            <CapacityGauge 
              label="Zone A (Professeurs)" 
              current={mergedParkingData['zone-a']?.current ?? 0} 
              total={mergedParkingData['zone-a']?.total ?? 50} 
              color="accent" 
            />
            <CapacityGauge 
              label="Zone ECOPO (Étudiants)" 
              current={mergedParkingData['ecopo']?.current ?? 0} 
              total={mergedParkingData['ecopo']?.total ?? 100} 
              color="indigo" 
            />
            <CapacityGauge 
              label="Zone B (Visiteurs)" 
              current={mergedParkingData['zone-b']?.current ?? 0} 
              total={mergedParkingData['zone-b']?.total ?? 30} 
              color="warning" 
            />
            <CapacityGauge 
              label="Gym / Église" 
              current={mergedParkingData['church']?.current ?? 0} 
              total={mergedParkingData['church']?.total ?? 20} 
              color="success" 
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ stat, index }: { stat: any; index: number; key?: any }) {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="p-6 hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            stat.color === 'blue' ? "bg-blue-50 text-blue-500 dark:bg-blue-500/10" :
            stat.color === 'green' ? "bg-green-50 text-green-500 dark:bg-green-500/10" :
            stat.color === 'indigo' ? "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10" :
            "bg-slate-50 text-slate-500 dark:bg-slate-500/10"
          )}>
            <Icon size={24} />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
            stat.trend.startsWith('+') ? "bg-success/10 text-success" : 
            stat.trend.startsWith('-') ? "bg-danger/10 text-danger" :
            "bg-bg-surface text-text-muted"
          )}>
            {stat.trend.startsWith('+') ? <ArrowUpRight size={14} /> : 
             stat.trend.startsWith('-') ? <ArrowDownRight size={14} /> : null}
            {stat.trend}
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold mb-1 tracking-tight">{stat.value}</p>
          <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
        </div>
      </Card>
    </motion.div>
  );
}

function CapacityGauge({ label, current, total, color }: { label: string; current: number; total: number; color: string }) {
  const percent = (current / total) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-text-secondary">{label}</span>
        <span className="font-bold">{current} / {total}</span>
      </div>
      <div className="h-3 bg-bg-surface rounded-full overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn(
            "h-full rounded-full transition-colors",
            percent > 90 ? "bg-danger" : 
            percent > 70 ? "bg-warning" : 
            color === 'accent' ? "bg-accent-primary" : 
            color === 'indigo' ? "bg-indigo-500" :
            "bg-success"
          )}
        />
      </div>
    </div>
  );
}
