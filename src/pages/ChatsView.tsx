import { useState, useRef, useEffect } from 'react';
import { Search, Send, Smile, Paperclip, Phone, Video, MoreHorizontal, Check, CheckCheck } from 'lucide-react';
import { useTheme } from '../store/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: number;
  name: string;
  program: string;
  avatar: string;
  gradient: string;
  status: 'online' | 'away' | 'offline';
  lastMsg: string;
  lastTime: string;
  unread: number;
  match: number;
}

interface Message {
  id: number;
  text: string;
  time: string;
  isMe: boolean;
  read: boolean;
}

const CONTACTS: Contact[] = [
  { id: 1, name: 'Camila Rodríguez', program: 'Ing. Sistemas', avatar: 'CR', gradient: 'linear-gradient(135deg,#6C63FF,#FF6B9D)', status: 'online', lastMsg: '¿Hacemos parche de estudio mañana? 📚', lastTime: '10:34', unread: 2, match: 96 },
  { id: 2, name: 'Felipe Arango',    program: 'Ing. Industrial', avatar: 'FA', gradient: 'linear-gradient(135deg,#7FE7C4,#6C63FF)', status: 'away',   lastMsg: '¡El parcial estuvo brutal jaja 😅',  lastTime: 'Ayer',   unread: 0, match: 88 },
  { id: 3, name: 'Sofía Martínez',   program: 'Ing. Civil',     avatar: 'SM', gradient: 'linear-gradient(135deg,#FFB347,#FF6B9D)', status: 'online', lastMsg: 'Te mando los apuntes ahora mismo',  lastTime: 'Ayer',   unread: 0, match: 82 },
  { id: 4, name: 'Andrés Torres',    program: 'Ing. Eléctrica', avatar: 'AT', gradient: 'linear-gradient(135deg,#A78BFA,#5BC8FF)', status: 'offline',lastMsg: '¿Quedamos para el hackathon?',       lastTime: 'Lun',    unread: 0, match: 77 },
  { id: 5, name: 'María González',   program: 'Ing. Ambiental', avatar: 'MG', gradient: 'linear-gradient(135deg,#FF6B9D,#FFB347)', status: 'online', lastMsg: 'Vi tu post del proyecto de IA 🔥',  lastTime: 'Lun',    unread: 0, match: 74 },
];

const CHAT_HISTORY: Record<number, Message[]> = {
  1: [
    { id:1, text:'Hola! Vi que tienes un 96% de compatibilidad conmigo 😄', time:'10:00', isMe:false, read:true },
    { id:2, text:'¡Hola Camila! Sí, en serio? Qué bueno! Hola :)', time:'10:02', isMe:true, read:true },
    { id:3, text:'Jeje sí! Vi que también te gusta Python y la IA. Yo estoy trabajando en un proyecto de NLP', time:'10:05', isMe:false, read:true },
    { id:4, text:'Qué interesante! Yo también estoy aprendiendo TensorFlow para un proyecto de visión por computadora 🤖', time:'10:08', isMe:true, read:true },
    { id:5, text:'¡Qué chévere! Oye, ¿hacemos parche de estudio mañana? Tengo el parcial de Cálculo pasado mañana 📚', time:'10:34', isMe:false, read:false },
    { id:6, text:'¿Quedamos a las 3pm en la biblio del bloque E?', time:'10:34', isMe:false, read:false },
  ],
  2: [
    { id:1, text:'Ey! Cómo te fue en el parcial de Estadística?', time:'Ayer 09:20', isMe:true, read:true },
    { id:2, text:'¡El parcial estuvo brutal jaja 😅 Creo que la cagué en la parte de regresión', time:'Ayer 09:45', isMe:false, read:true },
    { id:3, text:'Uy no... a mí tampoco me fue bien en eso. Para el próximo hacemos parche', time:'Ayer 10:00', isMe:true, read:true },
  ],
  3: [
    { id:1, text:'Hola Sofía! Tienes los apuntes de Mecánica de Suelos?', time:'Ayer 14:00', isMe:true, read:true },
    { id:2, text:'Te mando los apuntes ahora mismo', time:'Ayer 14:05', isMe:false, read:true },
    { id:3, text:'📎 apuntes_mecanica_suelos.pdf', time:'Ayer 14:06', isMe:false, read:true },
    { id:4, text:'Gracias! Eres la mejor 🙌', time:'Ayer 14:08', isMe:true, read:true },
  ],
};

const STATUS_COLOR: Record<string, string> = { online: '#7FE7C4', away: '#FFB347', offline: '#555' };

export function ChatsView() {
  const t = useTheme();
  const [selected, setSelected] = useState<Contact>(CONTACTS[0]);
  const [messages, setMessages] = useState<Message[]>(CHAT_HISTORY[1] || []);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(CHAT_HISTORY[selected.id] || []);
  }, [selected.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    setMessages(p => [...p, { id: p.length + 1, text: input, time: now, isMe: true, read: false }]);
    setInput('');
  };

  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.program.toLowerCase().includes(search.toLowerCase())
  );

  const cardStyle = { background: t.cardBg, borderColor: t.cardBorder };

  return (
    <div className="h-full overflow-hidden flex rounded-2xl border" style={cardStyle}>

      {/* ── Contact list ── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r" style={{ background: t.darkMode ? '#13111F' : '#FAFAFF', borderColor: t.divider }}>
        <div className="p-4 border-b" style={{ borderColor: t.divider }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: t.text, marginBottom: '12px' }}>Chats Privados</h3>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar chat..."
              className="w-full rounded-xl pl-8 pr-3 py-2 text-xs outline-none"
              style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.cardBorder}` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {filtered.map(contact => {
            const isActive = selected.id === contact.id;
            return (
              <button key={contact.id} onClick={() => setSelected(contact)}
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
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center ring-2"
                    style={{
                      background: contact.gradient,
                      fontSize: '0.72rem', fontWeight: 800, color: 'white',
                      ringColor: isActive ? 'rgba(108,99,255,0.5)' : 'transparent',
                      outline: isActive ? '2px solid rgba(108,99,255,0.45)' : 'none',
                      outlineOffset: '2px',
                    }}>
                    {contact.avatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{ background: STATUS_COLOR[contact.status], borderColor: t.darkMode ? '#13111F' : '#FAFAFF' }} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span style={{
                      fontSize: '0.85rem', fontWeight: isActive ? 700 : 600,
                      color: isActive ? '#6C63FF' : t.text,
                    }}>{contact.name.split(' ')[0]}</span>
                    <span style={{ fontSize: '0.65rem', color: t.textMuted }}>{contact.lastTime}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="truncate" style={{ fontSize: '0.72rem', color: t.textMuted, maxWidth: '130px' }}>{contact.lastMsg}</p>
                    {contact.unread > 0 && (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#FF4D6A', fontSize: '0.6rem', fontWeight: 700, color: 'white' }}>
                        {contact.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span style={{ fontSize: '0.6rem', color: '#7FE7C4', fontWeight: 600 }}>
                      💜 {contact.match}% match
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col" style={{ background: t.darkMode ? '#0D0B1E' : t.bg }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
          style={{ background: t.darkMode ? '#13111F' : t.cardBg, borderColor: t.divider }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: selected.gradient, fontSize: '0.7rem', fontWeight: 800, color: 'white' }}>
                {selected.avatar}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: STATUS_COLOR[selected.status], borderColor: t.cardBg }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: t.text }}>{selected.name}</p>
              <p style={{ fontSize: '0.7rem', color: selected.status === 'online' ? '#7FE7C4' : t.textMuted }}>
                {selected.status === 'online' ? '● En línea' : selected.status === 'away' ? '● Ausente' : '● Desconectado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              style={{ background: t.inputBg }}>
              <Phone size={16} style={{ color: '#7FE7C4' }} />
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              style={{ background: t.inputBg }}>
              <Video size={16} style={{ color: '#6C63FF' }} />
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              style={{ background: t.inputBg }}>
              <MoreHorizontal size={16} style={{ color: t.textMuted }} />
            </button>
          </div>
        </div>

        {/* Match badge */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
            <span style={{ fontSize: '0.75rem', color: '#6C63FF' }}>💜 {selected.match}% de compatibilidad con {selected.name.split(' ')[0]}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2"
          style={{ background: t.darkMode ? '#0D0B1E' : t.bg }}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[65%]">
                <div className="px-4 py-2.5 rounded-2xl"
                  style={{
                    background: msg.isMe
                      ? 'linear-gradient(135deg, #6C63FF, #8B7FFF)'
                      : t.darkMode ? '#1E1C30' : '#F0EEFF',
                    color: msg.isMe ? '#FFFFFF' : t.darkMode ? '#E0DAFF' : '#1A1829',
                    borderRadius: msg.isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    border: msg.isMe ? 'none' : `1px solid ${t.darkMode ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.2)'}`,
                    fontSize: '0.87rem', lineHeight: 1.5,
                  }}>
                  {msg.text.startsWith('📎') ? (
                    <div className="flex items-center gap-2">
                      <span>📎</span>
                      <span style={{ fontSize: '0.82rem' }}>{msg.text.replace('📎 ', '')}</span>
                    </div>
                  ) : msg.text}
                </div>
                <div className={`flex items-center gap-1 mt-1 ${msg.isMe ? 'justify-end' : ''}`}>
                  <span style={{ fontSize: '0.6rem', color: t.textMuted }}>{msg.time}</span>
                  {msg.isMe && (msg.read
                    ? <CheckCheck size={12} style={{ color: '#7FE7C4' }} />
                    : <Check size={12} style={{ color: t.textMuted }} />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
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
              placeholder={`Mensaje a ${selected.name.split(' ')[0]}...`}
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
    </div>
  );
}
