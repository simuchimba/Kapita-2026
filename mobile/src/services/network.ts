import NetInfo from '@react-native-community/netinfo';

type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
};

class NetworkService {
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus = {
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  };

  async initialize(): Promise<void> {
    const status = await NetInfo.fetch();
    this.currentStatus = {
      isConnected: status.isConnected ?? false,
      isInternetReachable: status.isInternetReachable,
      type: status.type,
    };
  }

  async getStatus(): Promise<NetworkStatus> {
    const status = await NetInfo.fetch();
    this.currentStatus = {
      isConnected: status.isConnected ?? false,
      isInternetReachable: status.isInternetReachable,
      type: status.type,
    };
    return this.currentStatus;
  }

  isConnected(): boolean {
    return this.currentStatus.isConnected && this.currentStatus.isInternetReachable === true;
  }

  addListener(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.push(callback);
    
    const unsubscribe = NetInfo.addEventListener((state) => {
      const status: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };
      this.currentStatus = status;
      this.listeners.forEach(listener => listener(status));
    });

    return unsubscribe;
  }

  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isConnected()) {
        resolve(true);
        return;
      }

      const timer = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.addListener((status) => {
        if (status.isConnected && status.isInternetReachable) {
          clearTimeout(timer);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

export const networkService = new NetworkService();
export default networkService;
