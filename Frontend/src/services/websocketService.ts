type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export interface BusData {
  id: string;
  lat: number;
  lng: number;
  bus_number: string;
  route_name?: string;
  from_address?: string;
  from_lat?: number;
  from_lng?: number;
  to_address?: string;
  to_lat?: number;
  to_lng?: number;
  speed?: number;
  heading?: number;
  lastUpdate?: string;
}

interface WebSocketServiceState {
  buses: Map<string, BusData>;
  status: ConnectionStatus;
  lastMessage: string | null;
  error: Error | null;
}

type Listener = (state: WebSocketServiceState) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Set<Listener> = new Set();

  private state: WebSocketServiceState = {
    buses: new Map<string, BusData>(),
    status: 'disconnected',
    lastMessage: null,
    error: null,
  };

  constructor(private url: string) {}

  public connect(): void {
    if (this.socket) {
      this.disconnect();
    }

    this.setState({ status: 'connecting' });

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = this.handleOpen;
      this.socket.onmessage = this.handleMessage;
      this.socket.onclose = this.handleClose;
      this.socket.onerror = this.handleError;

      this.reconnectAttempts = 0;
    } catch (error) {
      this.setState({
        status: 'disconnected',
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      });
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;

      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }

      this.socket = null;
    }

    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.setState({ status: 'disconnected' });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): WebSocketServiceState {
    return { ...this.state };
  }

  private setState(newState: Partial<WebSocketServiceState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private handleOpen = (): void => {
    this.setState({ status: 'connected', error: null });
    this.reconnectAttempts = 0;
  };

  private handleMessage = (event: MessageEvent): void => {
    try {
      const message = event.data;
      this.setState({ lastMessage: message });

      const data = JSON.parse(message);

      if (Array.isArray(data)) {
        const newBuses = new Map<string, BusData>();
        for (const bus of data) {
          const busId = bus.bus_number || bus.id;
          if (busId) {
            newBuses.set(busId, {
              id: busId,
              bus_number: busId,
              lat: bus.lat,
              lng: bus.lon,
              route_name: bus.route_name,
              from_address: bus.from_address,
              from_lat: bus.from_lat,
              from_lng: bus.from_lng,
              to_address: bus.to_address,
              to_lat: bus.to_lat,
              to_lng: bus.to_lng,
              lastUpdate: bus.last_updated || new Date().toISOString(),
              route: bus.route,
              speed: bus.speed,
              heading: bus.heading,
            });
          }
        }
        this.setState({ buses: newBuses });
      } else {
        const busId = data.bus_number || data.id;
        if (busId) {
          const newBuses = new Map(this.state.buses);
          newBuses.set(busId, {
            id: busId,
            bus_number: busId,
            lat: data.lat,
            lng: data.lon,
            route_name: data.route_name,
            from_address: data.from_address,
            from_lat: data.from_lat,
            from_lng: data.from_lng,
            to_address: data.to_address,
            to_lat: data.to_lat,
            to_lng: data.to_lng,
            lastUpdate: data.last_updated || new Date().toISOString(),
            route: data.route,
            speed: data.speed,
            heading: data.heading,
          });
          this.setState({ buses: newBuses });
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.setState({ error: new Error(`Failed to parse message: ${error.message}`) });
    }
  };

  private handleClose = (event: CloseEvent): void => {
    if (!event.wasClean) {
      this.setState({
        status: 'disconnected',
        error: new Error(`Connection closed abnormally. Code: ${event.code}`),
      });
      this.scheduleReconnect();
    } else {
      this.setState({ status: 'disconnected', error: null });
    }
  };

  private handleError = (event: Event): void => {
    this.setState({
      status: 'disconnected',
      error: new Error('WebSocket error occurred'),
    });
  };

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      this.reconnectTimeout = window.setTimeout(() => {
        this.reconnectTimeout = null;
        this.connect();
      }, delay);
    }
  }

  private watchId: number | null = null;
  private lastSentTime: number = 0;
  private throttleInterval: number = 30000;

  public startTracking(driverBusId: string): void {
    if (!navigator.geolocation) {
      this.setState({ error: new Error("Geolocation is not supported by this browser.") });
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log("WebSocket not connected, attempting to connect...");
      this.connect();
      setTimeout(() => this.startTracking(driverBusId), 1000);
      return;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - this.lastSentTime < this.throttleInterval) {
          return;
        }

        const { latitude, longitude } = position.coords;
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          const updateMessage = JSON.stringify({
            bus_number: driverBusId,
            lat: latitude,
            lon: longitude,
          });
          this.socket.send(updateMessage);
          console.log("Sent location update:", updateMessage);
          this.lastSentTime = now;
        } else {
          this.setState({ error: new Error("WebSocket disconnected during tracking.") });
          console.warn("WebSocket not open, skipping location update.");
        }
      },
      (error) => {
        this.setState({ error: new Error(`Geolocation error: ${error.message}`) });
        console.error("Error getting location:", error);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  }

  public stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log("Tracking stopped.");
    }
  }
}

export const busWebSocketService = new WebSocketService('/ws/bus/');

window.startTracking = busWebSocketService.startTracking.bind(busWebSocketService);
window.stopTracking = busWebSocketService.stopTracking.bind(busWebSocketService);
