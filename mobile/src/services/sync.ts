import { networkService } from './network';
import { dbOperations, getDatabase } from './database';
import { api } from './api';

class SyncService {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  async startAutoSync(intervalMs: number = 60000): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (networkService.isConnected() && !this.isSyncing) {
        await this.sync();
      }
    }, intervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync(): Promise<void> {
    if (this.isSyncing || !networkService.isConnected()) {
      return;
    }

    this.isSyncing = true;
    console.log('Starting sync...');

    try {
      // Sync pending operations from queue
      await this.syncQueue();
      
      // Sync data from server
      await this.syncFromServer();
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncQueue(): Promise<void> {
    const queue = await dbOperations.getSyncQueue();
    
    for (const item of queue) {
      try {
        const data = JSON.parse(item.data);
        
        switch (item.table_name) {
          case 'sales':
            await this.syncSale(item.operation, data);
            break;
          case 'customers':
            await this.syncCustomer(item.operation, data);
            break;
          case 'expenses':
            await this.syncExpense(item.operation, data);
            break;
          case 'credits':
            await this.syncCredit(item.operation, data);
            break;
          case 'reinvestments':
            await this.syncReinvestment(item.operation, data);
            break;
          case 'products':
            await this.syncProduct(item.operation, data);
            break;
          case 'suppliers':
            await this.syncSupplier(item.operation, data);
            break;
          case 'purchase_orders':
            await this.syncPurchaseOrder(item.operation, data);
            break;
          default:
            console.warn('Unknown table in sync queue:', item.table_name);
        }

        // Remove from queue after successful sync
        await dbOperations.removeFromSyncQueue(item.id);
      } catch (error) {
        console.error('Failed to sync item:', item.id, error);
        await dbOperations.updateSyncQueueRetry(item.id, String(error));
      }
    }
  }

  private async syncSale(operation: string, data: any): Promise<void> {
    if (operation === 'create') {
      const response = await api.post('/sales/', data);
      const serverId = response.data.id;
      await dbOperations.markAsSynced('sales', data.local_id, serverId);
    }
  }

  private async syncCustomer(operation: string, data: any): Promise<void> {
    if (operation === 'create') {
      const response = await api.post('/customers/', data);
      const serverId = response.data.id;
      await dbOperations.markAsSynced('customers', data.local_id, serverId);
    }
  }

  private async syncExpense(operation: string, data: any): Promise<void> {
    if (operation === 'create') {
      const response = await api.post('/expenses/', data);
      const serverId = response.data.id;
      await dbOperations.markAsSynced('expenses', data.local_id, serverId);
    }
  }

  private async syncCredit(operation: string, data: any): Promise<void> {
    if (operation === 'create') {
      const response = await api.post('/credits/', data);
      const serverId = response.data.id;
      await dbOperations.markAsSynced('credits', data.local_id, serverId);
    } else if (operation === 'record_payment') {
      await api.post(`/credits/${data.credit_id}/record_payment/`, data);
    }
  }

  private async syncReinvestment(operation: string, data: any): Promise<void> {
    if (operation === 'create') {
      const response = await api.post('/reinvestments/', data);
      const serverId = response.data.id;
      await dbOperations.markAsSynced('reinvestments', data.local_id, serverId);
    }
  }

  private async syncProduct(operation: string, data: any): Promise<void> {
    if (operation === 'create') {
      const response = await api.post('/products/', data);
      const serverId = response.data.id;
      await dbOperations.markAsSynced('products', data.local_id, serverId);
    }
  }

  private async syncSupplier(operation: string, data: any): Promise<void> {
    if (operation === 'create') {
      const response = await api.post('/suppliers/', data);
      const serverId = response.data.id;
      await dbOperations.markAsSynced('suppliers', data.local_id, serverId);
    }
  }

  private async syncPurchaseOrder(operation: string, data: any): Promise<void> {
    if (operation === 'create') {
      const response = await api.post('/purchase-orders/', data);
      const serverId = response.data.id;
      await dbOperations.markAsSynced('purchase_orders', data.local_id, serverId);
    }
  }

  private async syncFromServer(): Promise<void> {
    const lastSync = await this.getLastSyncTimestamp();
    
    // Sync products
    await this.syncTableFromServer('products', '/products/', lastSync);
    
    // Sync customers
    await this.syncTableFromServer('customers', '/customers/', lastSync);
    
    // Sync suppliers
    await this.syncTableFromServer('suppliers', '/suppliers/', lastSync);
    
    await this.updateLastSyncTimestamp();
  }

  private async syncTableFromServer(
    tableName: string,
    endpoint: string,
    lastSync: string | null
  ): Promise<void> {
    try {
      const params = lastSync ? { updated_after: lastSync } : {};
      const response = await api.get(endpoint, { params });
      const items = response.data.results || response.data;
      
      const database = await getDatabase();
      
      for (const item of items) {
        // Check if item exists
        const existing = await database.getFirstAsync(
          `SELECT id FROM ${tableName} WHERE server_id = ?`,
          [item.id]
        );
        
        if (existing) {
          // Update existing
          const fields = Object.keys(item)
            .filter(key => key !== 'id')
            .map(key => `${key} = ?`)
            .join(', ');
          const values = Object.keys(item)
            .filter(key => key !== 'id')
            .map(key => item[key]);
          
          await database.runAsync(
            `UPDATE ${tableName} SET ${fields}, sync_status = 'synced' WHERE server_id = ?`,
            [...values, item.id] as any
          );
        } else {
          // Insert new
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item);
          
          await database.runAsync(
            `INSERT INTO ${tableName} (${columns}, sync_status) VALUES (?, 'synced')`,
            [...values] as any
          );
        }
      }
    } catch (error) {
      console.error(`Failed to sync ${tableName} from server:`, error);
    }
  }

  private async getLastSyncTimestamp(): Promise<string | null> {
    const database = await getDatabase();
    const result = await database.getFirstAsync('SELECT timestamp FROM sync_metadata WHERE id = 1') as any;
    return result ? result.timestamp : null;
  }

  private async updateLastSyncTimestamp(): Promise<void> {
    const database = await getDatabase();
    const timestamp = new Date().toISOString();

    await database.runAsync(
      'INSERT OR REPLACE INTO sync_metadata (id, timestamp) VALUES (1, ?)',
      [timestamp]
    );
  }

  async forceSync(): Promise<void> {
    await this.sync();
  }

  getSyncStatus(): { isSyncing: boolean; isOnline: boolean } {
    return {
      isSyncing: this.isSyncing,
      isOnline: networkService.isConnected(),
    };
  }
}

export const syncService = new SyncService();
export default syncService;
