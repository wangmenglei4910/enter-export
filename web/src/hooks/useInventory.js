import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getInventoryStore,
  calcStockMap,
  todayStr,
  emptyData,
  listLocalBackups,
} from '@/services/inventoryStore';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [tick, setTick] = useState(0);
  const store = useMemo(() => getInventoryStore(), [tick]);
  const [snapshot, setSnapshot] = useState(() => store.getSnapshot());

  useEffect(() => {
    const onReset = () => setTick((t) => t + 1);
    window.addEventListener('inventory-store-reset', onReset);
    return () => window.removeEventListener('inventory-store-reset', onReset);
  }, []);

  useEffect(() => {
    const off = store.onChange(setSnapshot);
    setSnapshot(store.getSnapshot());
    store.init().then(() => setSnapshot(store.getSnapshot()));
    return () => {
      off();
    };
  }, [store]);

  const value = useMemo(() => {
    const data = snapshot?.data || emptyData();
    return {
      ...snapshot,
      data,
      writing: Boolean(snapshot?.writing),
      session: snapshot?.session || null,
      stockMap: calcStockMap(data),
      today: todayStr(),
      upsert: store.upsert.bind(store),
      remove: store.remove.bind(store),
      replaceCollection: store.replaceCollection.bind(store),
      pullRemote: store.pullRemote.bind(store),
      getConfigLink: store.getConfigLink.bind(store),
      login: store.login?.bind(store),
      register: store.register?.bind(store),
      exportBackup: store.exportBackup?.bind(store),
      importBackup: store.importBackup?.bind(store),
      restoreLocalBackup: store.restoreLocalBackup?.bind(store),
      restoreCloudLatest: store.restoreCloudLatest?.bind(store),
      listCloudBackups: store.listCloudBackups?.bind(store),
      createManualBackup: store.createManualBackup?.bind(store),
      listLocalBackups: store.listLocalBackups?.bind(store) || listLocalBackups,
    };
  }, [snapshot, store]);

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error('useInventory 必须在 InventoryProvider 内使用');
  }
  return ctx;
}
