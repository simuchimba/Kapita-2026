import React, { createContext, useContext, useState, useEffect } from 'react';
import { networkService } from '../services/network';

interface NetworkContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  syncNow: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);

  useEffect(() => {
    initializeNetwork();
  }, []);

  const initializeNetwork = async () => {
    await networkService.initialize();
    setIsOnline(networkService.isConnected());

    // Listen for network changes
    const unsubscribe = networkService.addListener((status) => {
      const online = status.isConnected && status.isInternetReachable === true;
      setIsOnline(online);
      
      // Auto-sync when coming back online
      if (online) {
        syncNow();
      }
    });

    return () => unsubscribe();
  };

  const syncNow = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const { syncService } = await import('../services/sync');
      await syncService.forceSync();
      
      // Update pending operations count
      const { dbOperations } = await import('../services/database');
      const queue = await dbOperations.getSyncQueue();
      setPendingOperations(queue.length);
    } catch (error) {
      // Silently ignore — SQLite not available in Expo Go
    } finally {
      setIsSyncing(false);
    }
  };

  // Periodically check pending operations
  useEffect(() => {
    const checkPending = async () => {
      try {
        const { dbOperations } = await import('../services/database');
        const queue = await dbOperations.getSyncQueue();
        setPendingOperations(queue.length);
      } catch {
        // Silently ignore — SQLite not available in Expo Go
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingOperations,
        syncNow,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
