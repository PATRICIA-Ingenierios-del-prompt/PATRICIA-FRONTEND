import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';
import { Search, Send, Smile, Paperclip, MoreHorizontal, ArrowLeft, Heart } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTheme } from '../store/ThemeContext';
import { motion } from 'motion/react';
import { addToast } from '../components/ToastSystem';
import { friendlyError } from '../lib/errorMessages';
import { matchingService } from '../services/matchingService';
import { userService, type PerfilResponse } from '../services/userService';
import { dmService } from '../services/dmService';
import { apiClient } from '../services/apiClient';
import { ComunicacionSocket, type ChatMessage } from '../services/comunicacionSocket';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from 'react-i18next';
import type { MatchResponse } from '../types/patricia';

// ── Visual-only helpers (el backend no manda color de avatar) ───────────────
const GRADIENTS = [
  'linear-gradient(135deg,#6C63FF,#FF6B9D)',
  'linear-gradient(135deg,#7FE7C4,#6C63FF)',
  'linear-gradient(135deg,#FFB347,#FF6B9D)',
  'linear-gradient(135deg,#A78BFA,#5BC8FF)',
  'linear-gradient(135deg,#FF6B9D,#FFB347)',
];
function gradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}
function getInitials(nombre?: string, apellidos?: string): string {
  const full = [nombre, apellidos].filter(Boolean).join(' ');
  const parts = full.split(' ').filter(Boolean).slice(0, 2);
  return parts.length ? parts.map(w => w[0]!.toUpperCase()).join('') : '?';
}

const DISPONIBILIDAD_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  OCUPADO: 'Ocupado',
  NO_MOLESTAR: 'No molestar',
};

interface Contact {
  matchId: string;
  userId: string;
  name: string;
  program: string;
  avatar: string;
  gradient: string;
  foto?: string;
  matchPct?: number;
  disponibilidad?: string;
}

type ViewId = 'home' | 'matching' | 'parches' | 'campus' | 'eventos' | 'bienestar' | 'album' | 'notificaciones' | 'ranking' | 'ajustes' | 'perfil';

export function ChatsView({ onNavigate: _onNavigate }: { onNavigate?: (v: ViewId) => void }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const { userId: meId, userName } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [rtMessages, setRtMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [showContactProfile, setShowContactProfile] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ComunicacionSocket | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  // Cachea el channelId ya resuelto por userId para no golpear el backend
  // cada vez que se vuelve a seleccionar el mismo contacto.
  const channelCacheRef = useRef<Record<string, string>>({});
  const location = useLocation();
  const initialUserId = (location.state as { initialUserId?: string } | null)?.initialUserId;

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const raw: MatchResponse[] = await matchingService.listarMatches();
      const perfiles = await userService.getPerfiles(raw.map(m => m.otroUsuarioId));
      const built: Contact[] = raw.map(m => {
        const p: PerfilResponse | undefined = perfiles[m.otroUsuarioId];
        return {
          matchId: m.matchId,
          userId: m.otroUsuarioId,
          name: [p?.nombre, p?.apellidos].filter(Boolean).join(' ') || 'Usuario',
          program: p?.carrera || 'Programa no especificado',
          avatar: getInitials(p?.nombre, p?.apellidos),
          gradient: gradientFor(m.otroUsuarioId),
          foto: p?.foto,
          matchPct: m.scoreTotal != null ? Math.round(m.scoreTotal * 100) : undefined,
          disponibilidad: (p as any)?.disponibilidad,
        };
      });
      setContacts(built);
    } catch (e) {
      addToast({ type: 'info', title: tr('chats.error_loading_title'), message: friendlyError(e, tr('chats.error_loading_msg')) });
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => { void loadContacts(); }, [loadContacts]);

  // Si venimos desde Matching con un usuario pre-seleccionado, abrirlo automáticamente.
  useEffect(() => {
    if (!initialUserId || loadingContacts || contacts.length === 0) return;
    const target = contacts.find(c => c.userId === initialUserId);
    if (target) setSelected(target);
  }, [initialUserId, contacts, loadingContacts]);

  // Socket init — una sola conexión STOMP para toda la vista de chats.
  useEffect(() => {
    const socket = new ComunicacionSocket({ onConnect: () => console.log('[comms] conectado (DM)') });
    socket.setDisplayName(userName);
    socket.activate();
    socketRef.current = socket;
    return () => { socket.deactivate(); };
  }, []);

  // Al elegir un contacto: asegurar el canal privado, traer historial y
  // suscribirse en tiempo real. Mismo patrón que ParchesView con su parche.
  useEffect(() => {
    unsubRef.current?.();
    setRtMessages([]);
    setChannelId(null);
    if (!selected) return;

    let alive = true;
    setLoadingChannel(true);

    const cached = channelCacheRef.current[selected.userId];
    const ensure = cached ? Promise.resolve(cached) : dmService.ensureChannel(selected.userId);

    ensure
      .then(cid => {
        if (!alive) return;
        channelCacheRef.current[selected.userId] = cid;
        setChannelId(cid);

        apiClient.get(`/api/chat/${cid}/messages?page=0&size=50`)
          .then(r => { if (alive) setRtMessages([...(r.data.content ?? [])].reverse()); })
          .catch(() => {});

        const unsub = socketRef.current?.subscribeToParche(cid, {
          onMessage: msg => {
            setRtMessages(prev => [...prev, msg]);
          },
        });
        if (unsub) unsubRef.current = unsub;
      })
      .catch(e => {
        if (alive) addToast({ type: 'info', title: tr('chats.error_open_chat_title'), message: friendlyError(e, tr('chats.error_loading_msg')) });
      })
      .finally(() => { if (alive) setLoadingChannel(false); });

    return () => { alive = false; unsubRef.current?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rtMessages]);

  const send = () => {
    if (!input.trim() || !channelId) return;
    if (!navigator.onLine) {
      addToast({ type: 'reporte', title: tr('chats.offline_title'), message: tr('chats.offline_msg') });
      return;
    }
    socketRef.current?.sendMessage(channelId, input.trim());
    setInput('');
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.program.toLowerCase().includes(search.toLowerCase())
  );

  const cardStyle = { background: t.cardBg, borderColor: t.cardBorder };

  return (
    <>
    <div className="h-full overflow-hidden flex rounded-2xl border" style={cardStyle}>

      {/* ── Contact list ── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r" style={{ background: t.darkMode ? '#13111F' : '#FAFAFF', borderColor: t.divider }}>
        <div className="p-4 border-b" style={{ borderColor: t.divider }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: t.text, marginBottom: '12px' }}>{tr('chats.title')}</h3>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={tr('chats.search')}
              className="w-full rounded-xl pl-8 pr-3 py-2 text-xs outline-none"
              style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.cardBorder}` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {loadingContacts ? (
            <p style={{ fontSize: '0.78rem', color: t.textMuted, textAlign: 'center', padding: '32px 16px' }}>{tr('chats.loading')}</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
              {contacts.length === 0 ? (
                <>
                  <Heart size={22} style={{ color: t.textMuted }} />
                  <p style={{ fontSize: '0.78rem', color: t.textMuted }}>{tr('chats.no_matches')}</p>
                </>
              ) : (
                <>
                  <Search size={22} style={{ color: t.textMuted }} />
                  <p style={{ fontSize: '0.78rem', color: t.textMuted }}>{tr('chats.no_results', { search })}</p>
                </>
              )}
            </div>
          ) : filtered.map(contact => {
            const isActive = selected?.matchId === contact.matchId;
            return (
              <button key={contact.matchId} onClick={() => setSelected(contact)}
                className="w-full text-left px-3 py-2.5 mx-2 flex items-start gap-3 transition-all rounded-xl"
                style={{
                  width: 'calc(100% - 16px)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(108,99,255,0.22), rgba(108,99,255,0.10))'
                    : 'transparent',
                  borderLeft: `3px solid ${isActive ? '#6C63FF' : 'transparent'}`,
                  boxShadow: isActive ? '0 2px 12px rgba(108,99,255,0.15)' : 'none',
                }}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{
                    background: contact.gradient,
                    fontSize: '0.72rem', fontWeight: 800, color: 'white',
                    outline: isActive ? '2px solid rgba(108,99,255,0.45)' : 'none',
                    outlineOffset: '2px',
                  }}>
                  {contact.foto ? <img src={contact.foto} alt={contact.name} className="w-full h-full object-cover" /> : contact.avatar}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span style={{
                    fontSize: '0.85rem', fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#6C63FF' : t.text,
                  }}>{contact.name.split(' ')[0]}</span>
                  <p className="truncate" style={{ fontSize: '0.72rem', color: t.textMuted, marginTop: '2px' }}>{contact.program}</p>
                  {contact.matchPct != null && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span style={{ fontSize: '0.6rem', color: '#7FE7C4', fontWeight: 600 }}>
                        {contact.matchPct}% match
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat area ── */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center" style={{ background: t.darkMode ? '#0D0B1E' : t.bg }}>
          <p style={{ fontSize: '0.85rem', color: t.textMuted }}>{tr('chats.select_chat')}</p>
        </div>
      ) : (
      <div className="flex-1 flex flex-col" style={{ background: t.darkMode ? '#0D0B1E' : t.bg }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
          style={{ background: t.darkMode ? '#13111F' : t.cardBg, borderColor: t.divider }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: selected.gradient, fontSize: '0.7rem', fontWeight: 800, color: 'white' }}>
              {selected.foto ? <img src={selected.foto} alt={selected.name} className="w-full h-full object-cover" /> : selected.avatar}
            </div>
            <div>
              <button onClick={() => setShowContactProfile(true)}
                style={{ fontWeight: 700, fontSize: '0.95rem', color: t.text, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.textDecorationColor = t.textMuted; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.textDecorationColor = 'transparent'; }}>
                {selected.name}
              </button>
              <p style={{ fontSize: '0.7rem', color: t.textMuted }}>{selected.program}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              style={{ background: t.inputBg }}>
              <MoreHorizontal size={16} style={{ color: t.textMuted }} />
            </button>
          </div>
        </div>

        {/* Match badge */}
        {selected.matchPct != null && (
          <div className="flex justify-center pt-4 pb-2">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
              <span style={{ fontSize: '0.75rem', color: '#6C63FF' }}>{tr('chats.compatibility_with', { pct: selected.matchPct, name: selected.name.split(' ')[0] })}</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2"
          style={{ background: t.darkMode ? '#0D0B1E' : t.bg }}>
          {loadingChannel ? (
            <div className="h-full flex items-center justify-center text-center px-6">
              <p style={{ fontSize: '0.82rem', color: t.textMuted }}>{tr('chats.connecting')}</p>
            </div>
          ) : rtMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center px-6">
              <p style={{ fontSize: '0.82rem', color: t.textMuted }}>
                {tr('chats.no_messages', { name: selected.name.split(' ')[0] })}
              </p>
            </div>
          ) : rtMessages.map(msg => {
            const isMe = msg.senderId === meId;
            const time = new Date(msg.sentAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[65%]">
                  <div className="px-4 py-2.5 rounded-2xl"
                    style={{
                      background: isMe
                        ? 'linear-gradient(135deg, #6C63FF, #8B7FFF)'
                        : t.darkMode ? '#1E1C30' : '#F0EEFF',
                      color: isMe ? '#FFFFFF' : t.darkMode ? '#E0DAFF' : '#1A1829',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      border: isMe ? 'none' : `1px solid ${t.darkMode ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.2)'}`,
                      fontSize: '0.87rem', lineHeight: 1.5,
                    }}>
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                    <span style={{ fontSize: '0.6rem', color: t.textMuted }}>{time}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t flex-shrink-0" style={{ background: t.darkMode ? '#13111F' : t.cardBg, borderColor: t.divider }}>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border"
            style={{ background: t.inputBg, borderColor: t.cardBorder }}>
            <button className="hover:opacity-70"><Smile size={18} style={{ color: t.textMuted }} /></button>
            <button className="hover:opacity-70"><Paperclip size={18} style={{ color: t.textMuted }} /></button>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={tr('chats.message_placeholder', { name: selected.name.split(' ')[0] })}
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: '0.87rem', color: t.text }} />
            <button onClick={send}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{ background: '#6C63FF' }}>
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      </div>
      )}
    </div>

    {/* Contact profile modal */}
    {showContactProfile && selected && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}
        onClick={() => setShowContactProfile(false)}>
        <div className="rounded-3xl border w-full max-w-sm overflow-hidden"
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
          onClick={e => e.stopPropagation()}>
          {/* Hero */}
          <div className="relative h-36 flex items-center justify-center overflow-hidden" style={{ background: selected.foto ? undefined : selected.gradient }}>
            {selected.foto && <img src={selected.foto} alt={selected.name} className="absolute inset-0 w-full h-full object-cover" />}
            <button onClick={() => setShowContactProfile(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <ArrowLeft size={16} color="white" />
            </button>
            {!selected.foto && (
              <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white/30 font-black text-white text-2xl"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                {selected.avatar}
              </div>
            )}
          </div>
          <div className="p-5">
            <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: t.text }}>{selected.name}</h3>
            <p style={{ fontSize: '0.8rem', color: t.textMuted, marginBottom: '12px' }}>{selected.program}</p>
            {selected.matchPct != null && (
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(108,99,255,0.12)', color: '#6C63FF' }}>
                  {tr('chats.compatibility', { pct: selected.matchPct })}
                </span>
              </div>
            )}
            {selected.disponibilidad && (
              <div className="flex items-center gap-2">
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: t.text }}>Disponibilidad:</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--p-divider)', color: '#6C63FF' }}>
                  {DISPONIBILIDAD_LABEL[selected.disponibilidad] ?? selected.disponibilidad}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
