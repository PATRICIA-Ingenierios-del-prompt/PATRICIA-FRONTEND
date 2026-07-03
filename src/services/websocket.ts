import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Stroke, CursorMessage } from '../types/board';

const WS_URL = 'http://localhost:8086/ws';

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
      // We use webSocketFactory because the server uses SockJS fallback
      webSocketFactory: () => new SockJS(WS_URL),
      debug: (str) => {
        // console.log('[STOMP] ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
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
    this.client.deactivate();
  }

  private subscribeToBoard() {
    const strokeSub = this.client.subscribe(`/topic/board/${this.boardId}`, (message: IMessage) => {
      if (message.body) {
        const stroke: Stroke = JSON.parse(message.body);
        this.onStrokeReceived(stroke);
      }
    });
    this.subscriptions.set('stroke', strokeSub);

    const clearSub = this.client.subscribe(`/topic/board/${this.boardId}/clear`, () => {
      this.onClearReceived();
    });
    this.subscriptions.set('clear', clearSub);

    const cursorSub = this.client.subscribe(`/topic/board/${this.boardId}/cursor`, (message: IMessage) => {
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
