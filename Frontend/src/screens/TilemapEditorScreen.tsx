import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../components/UI';
import { 
  Building2, 
  Route as RouteIcon, 
  ParkingSquare, 
  DoorOpen, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  Eraser, 
  Save, 
  Undo2,
  Plus,
  X,
  Settings,
  Maximize2,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Tool = 'BUILDING' | 'ROAD' | 'PARKING' | 'GATE' | 'ARROW_UP' | 'ARROW_DOWN' | 'ARROW_LEFT' | 'ARROW_RIGHT' | 'ERASER';

interface TileData {
  type: Tool | 'EMPTY';
  id?: string;
  parkingName?: string;
  parkingType?: 'PROFESSOR' | 'STUDENT' | 'VISITOR' | 'STAFF' | 'CHURCH';
  capacity?: number;
  portalId?: string;
  label?: string;
}

export function TilemapEditorScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const configId = queryParams.get('configId');

  const [activeTool, setActiveTool] = useState<Tool>('ROAD');
  const [selectedTile, setSelectedTile] = useState<{r: number, c: number} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState<TileData[][]>(
    Array(20).fill(null).map(() => Array(20).fill({ type: 'EMPTY' }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Charger la carte si un configId est présent
  React.useEffect(() => {
    if (!configId) return;

    const fetchMap = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/configurations/${configId}/tilemap`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.gridData) {
            setGrid(data.gridData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch map:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMap();
  }, [configId]);

  const handleSaveMap = async () => {
    if (!configId) {
      alert('Erreur: Aucun ID de configuration trouvé.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/configurations/${configId}/tilemap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridData: grid,
          width: 20,
          height: 20,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la publication');

      alert('Carte publiée avec succès !');
      navigate('/admin/configurations');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const tools = [
    { id: 'ROAD', icon: RouteIcon, label: 'Route', color: 'bg-slate-400', category: 'Base' },
    { id: 'BUILDING', icon: Building2, label: 'Bâtiment', color: 'bg-slate-700', category: 'Base' },
    { id: 'PARKING', icon: ParkingSquare, label: 'Parking', color: 'bg-blue-600', category: 'Destinations' },
    { id: 'GATE', icon: DoorOpen, label: 'Portail', color: 'bg-emerald-600', category: 'Destinations' },
    { id: 'ARROW_UP', icon: ArrowUp, label: 'Haut', color: 'bg-indigo-500', category: 'Guidage' },
    { id: 'ARROW_DOWN', icon: ArrowDown, label: 'Bas', color: 'bg-indigo-500', category: 'Guidage' },
    { id: 'ARROW_LEFT', icon: ArrowLeft, label: 'Gauche', color: 'bg-indigo-500', category: 'Guidage' },
    { id: 'ARROW_RIGHT', icon: ArrowRight, label: 'Droite', color: 'bg-indigo-500', category: 'Guidage' },
    { id: 'ERASER', icon: Eraser, label: 'Gomme', color: 'bg-rose-500', category: 'System' },
  ];

  const handleCellClick = (r: number, c: number) => {
    const newGrid = [...grid];
    newGrid[r] = [...newGrid[r]];
    const currentTile = newGrid[r][c];

    if (activeTool === 'ERASER') {
      newGrid[r][c] = { type: 'EMPTY' };
      setSelectedTile(null);
    } else {
      newGrid[r][c] = { 
        ...currentTile, 
        type: activeTool,
        parkingName: activeTool === 'PARKING' ? (currentTile.parkingName || `Parking ${r}-${c}`) : undefined,
        parkingType: activeTool === 'PARKING' ? (currentTile.parkingType || 'VISITOR') : undefined,
        capacity: activeTool === 'PARKING' ? (currentTile.capacity || 20) : undefined,
        portalId: activeTool === 'GATE' ? (currentTile.portalId || `Portail-${Math.floor(Math.random()*1000)}`) : undefined,
      };
      setSelectedTile({ r, c });
    }
    setGrid(newGrid);
  };

  const updateTileData = (data: Partial<TileData>) => {
    if (!selectedTile) return;
    const { r, c } = selectedTile;
    const newGrid = [...grid];
    newGrid[r] = [...newGrid[r]];
    newGrid[r][c] = { ...newGrid[r][c], ...data };
    setGrid(newGrid);
  };

  const selectedTileData = selectedTile ? grid[selectedTile.r][selectedTile.c] : null;

  return (
    <div className="flex flex-col h-screen -m-10">
      {/* Header Editor */}
      <header className="h-16 bg-bg-secondary border-b border-border flex items-center px-8 justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center text-white">
                <Settings size={20} />
             </div>
             <div>
                <h2 className="font-bold text-sm leading-none">Éditeur Tilemap Pro</h2>
                <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-bold">Imara / ECOPO Access</p>
             </div>
          </div>
          <div className="h-8 w-px bg-border mx-2" />
          <div className="flex bg-bg-surface p-1 rounded-lg">
             <button className="px-3 py-1 text-xs font-bold bg-white dark:bg-bg-secondary shadow-sm rounded-md transition-all">Édition</button>
             <button className="px-3 py-1 text-xs font-bold text-text-muted hover:text-text-primary transition-all">Aperçu Client</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface rounded-lg border border-border">
             <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1 hover:text-accent-primary"><Undo2 size={16} /></button>
             <span className="text-xs font-mono font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1 hover:text-accent-primary"><Plus size={16} /></button>
          </div>
          <Button variant="outline" size="sm" icon={Undo2} onClick={() => navigate(-1)}>Quitter</Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={Save} 
            loading={isSaving} 
            onClick={handleSaveMap}
          >
            Publier la Carte
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar Left */}
        <aside className="w-72 bg-bg-secondary border-r border-border p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
          {['Base', 'Destinations', 'Guidage'].map(cat => (
            <div key={cat} className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">{cat}</h3>
              <div className="grid grid-cols-2 gap-2">
                {tools.filter(t => t.category === cat).map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as Tool)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 group",
                      activeTool === tool.id 
                        ? "border-accent-primary bg-accent-primary/5 text-accent-primary shadow-inner" 
                        : "border-transparent hover:bg-bg-surface text-text-secondary"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                      tool.color
                    )}>
                      <tool.icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-auto pt-6 border-t border-border">
            <button className="w-full flex items-center justify-between p-3 bg-bg-surface rounded-xl hover:bg-border transition-colors">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-text-primary text-white rounded-lg"><Layers size={16} /></div>
                  <span className="text-sm font-bold">Layers</span>
               </div>
               <Plus size={14} className="text-text-muted" />
            </button>
          </div>
        </aside>

        {/* Workspace */}
        <div className="flex-1 bg-bg-surface/50 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[size:32px_32px]" />
          
          <div 
            ref={containerRef}
            className="transition-transform duration-200 ease-out p-12"
            style={{ transform: `scale(${zoom})` }}
          >
            <div 
              className="bg-white dark:bg-bg-secondary rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border-8 border-white dark:border-bg-secondary p-0.5 overflow-hidden ring-1 ring-border"
              style={{ width: 'min-content' }}
            >
              <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[2px] bg-border/20">
                {grid.map((row, r) => row.map((cell, c) => (
                  <Tile 
                    key={`${r}-${c}`}
                    cell={cell}
                    isSelected={selectedTile?.r === r && selectedTile?.c === c}
                    onClick={() => handleCellClick(r, c)}
                    coords={{r, c}}
                  />
                )))}
              </div>
            </div>
          </div>

          {/* Floaters */}
          <div className="absolute bottom-10 left-10 flex gap-4">
             <div className="px-4 py-2 bg-white/80 dark:bg-bg-secondary/80 backdrop-blur rounded-full border border-border shadow-xl text-[10px] font-mono font-bold text-text-muted flex items-center gap-3">
                <span className="text-accent-primary">COORD</span>
                <span>{selectedTile ? `${selectedTile.c} : ${selectedTile.r}` : '-- : --'}</span>
             </div>
          </div>
        </div>

        {/* Info Right */}
        <aside className="w-80 bg-bg-secondary border-l border-border shrink-0 flex flex-col z-30">
          <div className="p-6 border-b border-border">
             <h3 className="font-bold">Propriétés de la Tuile</h3>
             <p className="text-xs text-text-muted">Éditez les métadonnées de l'élément</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {selectedTileData ? (
                <motion.div
                  key="props"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4 p-4 bg-bg-surface rounded-2xl">
                     <div className={cn(
                       "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                       tools.find(t => t.id === selectedTileData.type)?.color
                     )}>
                        {React.createElement(tools.find(t => t.id === selectedTileData.type)?.icon || Settings, { size: 24 })}
                     </div>
                     <div>
                        <h4 className="font-bold text-sm tracking-tight">{tools.find(t => t.id === selectedTileData.type)?.label}</h4>
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{selectedTileData.type}</p>
                     </div>
                  </div>

                  <div className="space-y-5">
                    <Input 
                      label="Libellé personnalisé" 
                      placeholder="Ex: Entrée Est, Pavillon A"
                      value={selectedTileData.label || ''}
                      onChange={(e) => updateTileData({ label: e.target.value })}
                    />

                    {selectedTileData.type === 'PARKING' && (
                      <>
                        <Input 
                          label="Nom du Parking" 
                          value={selectedTileData.parkingName || ''}
                          onChange={(e) => updateTileData({ parkingName: e.target.value })}
                        />
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-text-secondary">Type de Parking</label>
                          <select 
                            className="w-full bg-bg-surface border-border border rounded-2xl py-3 px-4 font-medium outline-none focus:border-accent-primary transition-all"
                            value={selectedTileData.parkingType || 'VISITOR'}
                            onChange={(e) => updateTileData({ parkingType: e.target.value as any })}
                          >
                            <option value="PROFESSOR">Professeurs</option>
                            <option value="STUDENT">Étudiants</option>
                            <option value="STAFF">Personnel</option>
                            <option value="VISITOR">Visiteurs</option>
                            <option value="CHURCH">Église</option>
                          </select>
                        </div>
                        <Input 
                          label="Capacité (véhicules)" 
                          type="number"
                          value={selectedTileData.capacity || 0}
                          onChange={(e) => updateTileData({ capacity: parseInt(e.target.value) })}
                        />
                      </>
                    )}

                    {selectedTileData.type === 'GATE' && (
                      <Input 
                        label="ID Portail matériel" 
                        value={selectedTileData.portalId || ''}
                        onChange={(e) => updateTileData({ portalId: e.target.value })}
                      />
                    )}

                    <div className="pt-6 border-t border-border">
                       <p className="text-xs font-bold text-text-muted mb-3 uppercase">Règles Conditionnelles</p>
                       <div className="bg-bg-surface rounded-xl p-3 border border-border">
                          <p className="text-[10px] italic text-text-secondary leading-relaxed">
                             Cet élément sera utilisé par l'algorithme de calcul d'itinéraire vocal.
                          </p>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                   <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-text-muted">
                      <Maximize2 size={24} />
                   </div>
                   <p className="text-sm font-medium text-text-muted">Sélectionnez une tuile sur la grille pour éditer ses propriétés.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 border-t border-border bg-bg-surface/30">
             <Button variant="outline" className="w-full justify-start gap-3 border-none bg-transparent hover:bg-danger/10 hover:text-danger" icon={Eraser}>
                Supprimer de la Carte
             </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Tile({ cell, isSelected, onClick, coords }: { cell: TileData, isSelected: boolean, onClick: () => void, coords: {r: number, c: number}, key?: any }) {
  const isArrow = cell.type.startsWith('ARROW_');
  const toolInfo = {
    ROAD: { color: 'bg-slate-400', icon: RouteIcon },
    BUILDING: { color: 'bg-slate-700', icon: Building2 },
    PARKING: { color: 'bg-blue-600', icon: ParkingSquare },
    GATE: { color: 'bg-emerald-600', icon: DoorOpen },
    ARROW_UP: { color: 'bg-indigo-500', icon: ArrowUp },
    ARROW_DOWN: { color: 'bg-indigo-500', icon: ArrowDown },
    ARROW_LEFT: { color: 'bg-indigo-500', icon: ArrowLeft },
    ARROW_RIGHT: { color: 'bg-indigo-500', icon: ArrowRight },
    EMPTY: { color: 'bg-white dark:bg-bg-secondary', icon: null }
  };
  
  const current = toolInfo[cell.type as keyof typeof toolInfo] || toolInfo.EMPTY;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center cursor-pointer transition-all duration-200 relative group",
        isSelected && "ring-4 ring-yellow-400 z-20 scale-110 shadow-2xl rounded-sm",
        current.color,
        cell.type === 'EMPTY' && 'hover:bg-accent-primary/10'
      )}
    >
       <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 pointer-events-none transition-opacity" />
       
       {cell.type === 'BUILDING' && <Building2 size={16} className="text-white/40" />}
       {cell.type === 'PARKING' && (
         <div className="text-white flex flex-col items-center">
           <ParkingSquare size={16} />
           <span className="text-[6px] font-black absolute bottom-0.5">{cell.capacity}</span>
         </div>
       )}
       {cell.type === 'GATE' && <DoorOpen size={16} className="text-white" />}
       {isArrow && current.icon && <current.icon size={16} className="text-white" />}

       {/* Grid coords on hover */}
       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none bg-black/10 transition-opacity">
          <span className="text-[8px] font-black text-white">{coords.c},{coords.r}</span>
       </div>
    </div>
  );
}
