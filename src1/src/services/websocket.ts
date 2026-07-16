import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { tokenManager } from './tokenManager';
import { Stroke, CursorMessage } from '../types/board';

/**
 * Live board STOMP client (Board MS).
 *
 * Transport: native WebSocket (the backend registers /ws/board both with and
 * without SockJS — native is simpler and matches the geo/chat sockets).
 * Browsers can't set an Authorization header on a WS upgrade, so the JWT
 * rides `?access_token=<jwt>` — the Gateway validates it, strips it, and
 * proxies the upgrade to the Board MS.
 *
 * Destinations (must match BoardWebSocketController):
 *   SEND      /app/board/{boardId}/stroke | /cursor
 *   SUBSCRIBE /exchange/amq.topic/board.{boardId}[.clear|.cursor]
 */
function wsOrigin(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}

export class BoardWebSocketService {
  private client: Client;
  private subscriptions: Map<string, StompSubscription> = new Map();

  constructor(
    onConnect: () => void,
    onDisconnect: () => void,
    private boardId: string,
    private onStrokeReceived: (stroke: Stroke) => void,
    private onClearReceived: () => void,
    private onCursorReceived: (cursor: CursorMessage) => void
  ) {
    this.client = new Client({
      // Re-read the token on EVERY (re)connect attempt: if the JWT rotated or
      // expired mid-session, a reconnect with the original URL would 401 forever.
      beforeConnect: () => {
        const token = tokenManager.getAccessToken() ?? '';
        this.client.brokerURL = `${wsOrigin()}/ws/board?access_token=${encodeURIComponent(token)}`;
      },
      brokerURL: `${wsOrigin()}/ws/board`,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {},
    });

    this.client.onConnect = () => {
      onConnect();
      this.subscribeToBoard();
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.onWebSocketClose = () => {
      onDisconnect();
    };
  }

  public connect() {
    this.client.activate();
  }

  public disconnect() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    void this.client.deactivate();
  }

  private subscribeToBoard() {
    const strokeSub = this.client.subscribe(`/exchange/amq.topic/board.${this.boardId}`, (message: IMessage) => {
      if (message.body) {
        const stroke: Stroke = JSON.parse(message.body);
        this.onStrokeReceived(stroke);
      }
    });
    this.subscriptions.set('stroke', strokeSub);

    const clearSub = this.client.subscribe(`/exchange/amq.topic/board.${this.boardId}.clear`, () => {
      this.onClearReceived();
    });
    this.subscriptions.set('clear', clearSub);

    const cursorSub = this.client.subscribe(`/exchange/amq.topic/board.${this.boardId}.cursor`, (message: IMessage) => {
      if (message.body) {
        const cursor: CursorMessage = JSON.parse(message.body);
        this.onCursorReceived(cursor);
      }
    });
    this.subscriptions.set('cursor', cursorSub);
  }

  public sendStroke(stroke: Stroke) {
    if (this.client.connected) {
      this.client.publish({
        destination: `/app/board/${this.boardId}/stroke`,
        body: JSON.stringify(stroke)
      });
    }
  }

  public sendCursor(cursor: CursorMessage) {
    if (this.client.connected) {
      this.client.publish({
        destination: `/app/board/${this.boardId}/cursor`,
        body: JSON.stringify(cursor)
      });
    }
  }
}
