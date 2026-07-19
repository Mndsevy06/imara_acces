import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSocketStore } from '../store/useSocketStore';
import { useAuthStore } from '../store/useStore';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { setConnected, addScan, updateParking, setLastDiscoveredReaderId } = useSocketStore();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const rawSocketUrl = import.meta.env.VITE_WS_URL
      || import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '');
    const socketUrl = rawSocketUrl?.replace(/\/$/, '');
    
    if (!socketUrl) {
      console.error("[Socket] ERREUR : VITE_WS_URL (ou VITE_API_BASE_URL) n'est pas défini dans votre fichier .env");
      return;
    }
    
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      setConnected(true);

      // Admin joins "admin" room; agents join their personal room
      if (user?.role === 'ADMIN') {
        socket.emit('join:room', 'admin');
      } else if (user?.role === 'AGENT' && user.agent?.id) {
        socket.emit('join:room', `agent:${user.agent.id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      console.info(
        `[Socket] Vérifiez que le backend est lancé avec le serveur custom Socket.IO (ex: npm run dev dans Backend). URL: ${socketUrl}`
      );
      setConnected(false);
    });

    socket.on('scan:new', (data) => {
      console.log('[Socket] New scan received:', data);
      addScan(data);
    });

    socket.on('parking:update', (data) => {
      console.log('[Socket] Parking update received:', data);
      updateParking(data);
    });

    socket.on('reader:discovered', (data: { readerId: string }) => {
      console.log('[Socket] Reader discovered:', data.readerId);
      setLastDiscoveredReaderId(data.readerId);
    });

    // Mise à jour en temps réel des horaires de l'agent sans redémarrage de l'app
    socket.on('agent:updated', (updatedAgent: {
      id: string;
      shiftStart: string;
      shiftEnd: string;
      readerId: string | null;
      status: string;
      configurationId: string | null;
    }) => {
      console.log('[Socket] Agent updated received:', updatedAgent);
      // On ne met à jour que si c'est bien l'agent connecté
      const currentAgent = useAuthStore.getState().user;
      if (currentAgent?.agent?.id === updatedAgent.id) {
        setUser({
          ...currentAgent,
          agent: {
            ...currentAgent.agent,
            shiftStart: updatedAgent.shiftStart,
            shiftEnd: updatedAgent.shiftEnd,
            readerId: updatedAgent.readerId ?? currentAgent.agent.readerId,
            status: updatedAgent.status as any,
            configurationId: updatedAgent.configurationId ?? currentAgent.agent.configurationId,
          },
        });
        console.log('[Socket] ✅ Horaires agent mis à jour :', updatedAgent.shiftStart, '→', updatedAgent.shiftEnd);
      }
    });

    socketRef.current = socket;
    setSocket(socket);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  // Re-connect when user changes (login/logout) to join the correct room
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, setConnected, addScan, updateParking, setLastDiscoveredReaderId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
