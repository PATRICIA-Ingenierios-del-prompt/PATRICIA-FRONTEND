import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { tokenManager } from './tokenManager';
import type { GeoBroadcastMessage, GeoSnapshotMessage, UUID } from '../types/patricia';

/**
 * Live geo STOMP client (Location MS).
 *
 * Transport: raw WebSocket STOMP (the backend endpoint /ws/geo is registered
 * WITHOUT SockJS), tunneled by the gateway. Browsers can't set an Authorization
 * header on a WS upgrade, so the JWT travels as `?access_token=<jwt>` — the
 * gateway validates it, strips it, and injects the trusted X-User-Id that
 * becomes the STOMP Principal.
 *
 * Destinations (must match the backend exactly):
 *   SEND      /app/geo/{eventId}                   -> position update
 *   SUBSCRIBE /topic/geo/{eventId}                 -> live broadcasts
 *   SUBSCRIBE /user/queue/geo/{eventId}/snapshot   -> one-shot seed after subscribe
 *
 * The server seeds the snapshot in response to the /topic subscription, so we
 * subscribe to the snapshot queue FIRST to avoid a race.
 */

/** ws(s):// origin of the current page — vite proxy (dev) / ingress (prod) tunnels /ws. */
function wsOrigin(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}

export interface EventGeoHandlers {
  onPosition?: (msg: GeoBroadcastMessage) => void;
  onSnapshot?: (msg: GeoSnapshotMessage) => void;
}
export interface LocationSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onStompError?: (frame: { headers: Record<string, string>; body: string }) => void;
}

export class LocationSocket {
  private client: Client;
  private subs: StompSubscription[] = [];

  constructor(opts: LocationSocketOptions = {}) {
    this.client = new Client({
      // Re-read the token on EVERY (re)connect attempt: if the JWT rotated or
      // expired mid-session, a reconnect with the original URL would 401 forever.
      beforeConnect: () => {
        const token = tokenManager.getAccessToken() ?? '';
        this.client.brokerURL = `${wsOrigin()}/ws/geo?access_token=${encodeURIComponent(token)}`;
      },
      brokerURL: `${wsOrigin()}/ws/geo`,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => opts.onConnect?.(),
      onWebSocketClose: () => opts.onDisconnect?.(),
      onStompError: (f) => opts.onStompError?.({ headers: f.headers as Record<string, string>, body: f.body }),
    });
  }

  activate() { this.client.activate(); }
  get connected() { return this.client.connected; }

  /** Subscribe to an event's live channel. Call after onConnect fires. */
  subscribeToEvent(eventId: UUID, handlers: EventGeoHandlers) {
    if (handlers.onSnapshot) {
      this.subs.push(this.client.subscribe(`/user/queue/geo/${eventId}/snapshot`,
        (m: IMessage) => handlers.onSnapshot?.(JSON.parse(m.body))));
    }
    if (handlers.onPosition) {
      this.subs.push(this.client.subscribe(`/topic/geo/${eventId}`,
        (m: IMessage) => handlers.onPosition?.(JSON.parse(m.body))));
    }
  }

  sendPosition(eventId: UUID, latitude: number, longitude: number) {
    this.client.publish({ destination: `/app/geo/${eventId}`, body: JSON.stringify({ latitude, longitude }) });
  }

  deactivate() {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    void this.client.deactivate();
  }
}
