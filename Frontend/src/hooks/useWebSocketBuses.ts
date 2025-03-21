
import { useEffect, useState } from 'react';
import { busWebSocketService, BusData } from '../services/websocketService';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface UseBusesResult {
  buses: BusData[];
  status: ConnectionStatus;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocketBuses(): UseBusesResult {
  const [buses, setBuses] = useState<BusData[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscribe to WebSocket service updates
    const unsubscribe = busWebSocketService.subscribe((state) => {
      setBuses(Array.from(state.buses.values()));
      setStatus(state.status);
      setError(state.error);
    });

    // Connect to WebSocket on component mount
    busWebSocketService.connect();

    // Cleanup on unmount
    return () => {
      unsubscribe();
      busWebSocketService.disconnect();
    };
  }, []);

  // Return memoized functions to avoid unnecessary renders
  const connect = () => busWebSocketService.connect();
  const disconnect = () => busWebSocketService.disconnect();

  return {
    buses,
    status,
    error,
    connect,
    disconnect
  };
}
