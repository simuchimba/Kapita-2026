import { api } from './api';
import { networkService } from './network';
import { dbOperations } from './database';
import { syncService } from './sync';

interface OfflineOperation {
  operation: 'create' | 'update' | 'delete' | 'get';
  tableName: string;
  data: any;
  localId?: number;
}

class OfflineApiService {
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    tableName?: string
  ): Promise<T> {
    const isOnline = networkService.isConnected();

    if (isOnline) {
      // Online: make the API call
      try {
        const response = await api.request<T>({
          method,
          url: endpoint,
          data,
        });
        return response.data;
      } catch (error) {
        console.error('API request failed:', error);
        // If offline, fall back to offline mode
        if (!networkService.isConnected()) {
          return this.handleOfflineRequest<T>(method, endpoint, data, tableName);
        }
        throw error;
      }
    } else {
      // Offline: handle locally
      return this.handleOfflineRequest<T>(method, endpoint, data, tableName);
    }
  }

  private async handleOfflineRequest<T>(
    method: string,
    endpoint: string,
    data: any,
    tableName?: string
  ): Promise<T> {
    if (!tableName) {
      throw new Error('Table name required for offline operations');
    }

    const operation = method.toLowerCase() as 'create' | 'update' | 'delete' | 'get';
    
    switch (method.toLowerCase()) {
      case 'post':
        return this.handleOfflineCreate(tableName, data) as T;
      case 'put':
        return this.handleOfflineUpdate(tableName, data) as T;
      case 'delete':
        return this.handleOfflineDelete(tableName, data) as T;
      case 'get':
        return this.handleOfflineGet(tableName, endpoint) as T;
      default:
        throw new Error(`Unsupported method for offline: ${method}`);
    }
  }

  private async handleOfflineCreate(tableName: string, data: any): Promise<any> {
    let localId: number;
    
    switch (tableName) {
      case 'products':
        localId = await dbOperations.insertProduct(data);
        break;
      case 'sales':
        localId = await dbOperations.insertSale(data);
        break;
      case 'customers':
        localId = await dbOperations.insertCustomer(data);
        break;
      case 'expenses':
        localId = await dbOperations.insertExpense(data);
        break;
      case 'credits':
        localId = await dbOperations.insertCredit(data);
        break;
      case 'reinvestments':
        localId = await dbOperations.insertReinvestment(data);
        break;
      case 'suppliers':
        localId = await dbOperations.insertSupplier(data);
        break;
      case 'purchase_orders':
        localId = await dbOperations.insertPurchaseOrder(data);
        break;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }

    // Add to sync queue
    await dbOperations.addToSyncQueue('create', tableName, {
      ...data,
      local_id: localId,
    });

    return { id: localId, ...data, sync_status: 'pending' };
  }

  private async handleOfflineUpdate(tableName: string, data: any): Promise<any> {
    if (!data.id) {
      throw new Error('ID required for update operations');
    }

    switch (tableName) {
      case 'products':
        await dbOperations.updateProduct(data.id, data);
        break;
      // Add other tables as needed
      default:
        throw new Error(`Update not implemented for table: ${tableName}`);
    }

    // Add to sync queue
    await dbOperations.addToSyncQueue('update', tableName, data);

    return { ...data, sync_status: 'pending' };
  }

  private async handleOfflineDelete(tableName: string, data: any): Promise<any> {
    // Add to sync queue for deletion
    await dbOperations.addToSyncQueue('delete', tableName, data);
    return { success: true };
  }

  private async handleOfflineGet(tableName: string, endpoint: string): Promise<any> {
    switch (tableName) {
      case 'products':
        const products = await dbOperations.getProducts();
        return { results: products };
      case 'sales':
        const sales = await dbOperations.getSales();
        return { results: sales };
      case 'customers':
        const customers = await dbOperations.getCustomers();
        return { results: customers };
      default:
        throw new Error(`Get not implemented for table: ${tableName}`);
    }
  }

  async syncNow(): Promise<void> {
    await syncService.forceSync();
  }

  getSyncStatus() {
    return syncService.getSyncStatus();
  }
}

export const offlineApi = new OfflineApiService();
export default offlineApi;
