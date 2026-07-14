/**
 * Comunicación MS — STOMP client for real-time chat and WebRTC voice.
 * Adapted to the new frontend architecture (tokenManager, sessionStorage).
 */

import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { tokenManager } from './tokenManager';

export interface ChatMessage {
  id: string;
  parcheId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  fileUrl?: string | null;
  sentAt: string;
}

export interface VoiceEvent {
  signalType: 'JOIN' | 'LEAVE';
  senderUserId: string;
  senderUsername: string;
}

export interface VoiceSignalPayload {
  signalType: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'JOIN' | 'LEAVE';
  targetUserId?: string;
  signalData?: string;
  senderUserId?: string;
  senderUsername?: string;
}

export interface ParcheChannelHandlers {
  onMessage?: (msg: ChatMessage) => void;
  onVoiceEvent?: (evt: VoiceEvent) => void;
}

export interface ComunicacionSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onVoiceSignal?: (signal: VoiceSignalPayload) => void;
  onKicked?: (evt: { parcheId: string; reason: string }) => void;
}

const WS_URL = '/ws-stomp'; // proxied by vite to localhost:8084

export class ComunicacionSocket {
  private client: Client;
  private channelSubs = new Map<string, StompSubscription[]>();
  private globalSubs: StompSubscription[] = [];

  constructor(private opts: ComunicacionSocketOptions = {}) {
    this.client = new Client({
      brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${WS_URL}`,
      beforeConnect: async () => {
        const token = tokenManager.getAccessToken() ?? '';
        // The gateway validates the JWT on the HTTP upgrade itself; browsers
        // can't set headers on a WebSocket handshake, so the token rides
        // ?access_token= (same mechanism as /ws/geo) and the gateway strips it
        // before forwarding. The CONNECT header stays for the MS's own check.
        this.client.brokerURL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${WS_URL}?access_token=${encodeURIComponent(token)}`;
        this.client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        this._subscribeGlobal();
        opts.onConnect?.();
      },
      onWebSocketClose: () => opts.onDisconnect?.(),
    });
  }

  activate(): void { this.client.activate(); }
  get connected(): boolean { return this.client.connected; }

  async deactivate(): Promise<void> {
    this.channelSubs.forEach(list => list.forEach(s => s.unsubscribe()));
    this.channelSubs.clear();
    this.globalSubs.forEach(s => s.unsubscribe());
    this.globalSubs = [];
    await this.client.deactivate();
  }

  subscribeToParche(chatId: string, handlers: ParcheChannelHandlers): () => void {
    if (!this.client.connected) return () => {};
    const list: StompSubscription[] = [];

    if (handlers.onMessage) {
      list.push(this.client.subscribe(`/topic/chat/${chatId}`, (m: IMessage) =>
        handlers.onMessage?.(JSON.parse(m.body)),
      ));
    }

    if (handlers.onVoiceEvent) {
      list.push(this.client.subscribe(`/topic/voice/${chatId}`, (m: IMessage) => {
        const frame = JSON.parse(m.body) as VoiceEvent | VoiceSignalPayload;
        if (frame.signalType === 'JOIN' || frame.signalType === 'LEAVE') {
          handlers.onVoiceEvent?.(frame as VoiceEvent);
        }
      }));
    }

    this.channelSubs.set(chatId, [...(this.channelSubs.get(chatId) ?? []), ...list]);
    return () => {
      list.forEach(s => s.unsubscribe());
      this.channelSubs.delete(chatId);
    };
  }

  sendMessage(chatId: string, content: string, type = 'TEXT'): void {
    this.client.publish({ destination: `/app/chat.send/${chatId}`, body: JSON.stringify({ content, type }) });
  }

  markRead(chatId: string): void {
    this.client.publish({ destination: `/app/chat.read/${chatId}`, body: '{}' });
  }

  joinVoice(chatId: string): void {
    this.client.publish({ destination: `/app/voice.join/${chatId}`, body: '{}' });
  }

  leaveVoice(chatId: string): void {
    this.client.publish({ destination: `/app/voice.leave/${chatId}`, body: '{}' });
  }

  sendVoiceSignal(chatId: string, signal: VoiceSignalPayload): void {
    this.client.publish({ destination: `/app/voice.signal/${chatId}`, body: JSON.stringify(signal) });
  }

  private _subscribeGlobal(): void {
    this.globalSubs.push(
      this.client.subscribe('/user/queue/voice-signal', (m: IMessage) =>
        this.opts.onVoiceSignal?.(JSON.parse(m.body)),
      ),
      this.client.subscribe('/user/queue/kicked', (m: IMessage) =>
        this.opts.onKicked?.(JSON.parse(m.body)),
      ),
    );
  }
}
