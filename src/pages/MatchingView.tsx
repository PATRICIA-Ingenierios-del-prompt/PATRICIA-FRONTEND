import { useState } from 'react';
import { X, Heart, MessageCircle, Flame, Check, Send, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import { addToast } from '../components/ToastSystem';

const PROFILES = [
  {
    id: 1, name: 'Camila Rodríguez', age: 21, program: 'Ing. Sistemas', semester: '7mo',
    bio: 'Amante del código limpio y el café ☕. Busco compañeros de estudio y amigos para jugar LoL. Apasionada por la IA y el diseño UX.',
    interests: ['Python', 'LoL', 'UX Design', 'Café', 'Fotografía'],
    match: 96, level: 14, monas: 8, likes: 234,
    avatar: 'CR', gradient: 'linear-gradient(160deg, #6C63FF 0%, #FF6B9D 60%, #251F3D 100%)',
  },
  {
    id: 2, name: 'Felipe Arango', age: 22, program: 'Ing. Industrial', semester: '8vo',
    bio: 'Runner 🏃 y gamer. Organizo parches de estudio para parciales. Me encanta el senderismo y explorar Bogotá con amigos.',
    interests: ['Running', 'Gaming', 'Cálculo', 'Senderismo', 'Música'],
    match: 88, level: 11, monas: 5, likes: 187,
    avatar: 'FA', gradient: 'linear-gradient(160deg, #7FE7C4 0%, #6C63FF 60%, #1A1829 100%)',
  },
  {
    id: 3, name: 'Sofía Martínez', age: 20, program: 'Ing. Civil', semester: '5to',
    bio: 'Apasionada por las estructuras y el origami 🏗️. Hago tutorías de Física. Me gustaría conocer gente con quien estudiar.',
    interests: ['Origami', 'Física', 'Senderismo', 'Tutorías', 'Cocina'],
    match: 82, level: 9, monas: 4, likes: 143,
    avatar: 'SM', gradient: 'linear-gradient(160deg, #FFB347 0%, #FF6B9D 60%, #1A1829 100%)',
  },
  {
    id: 4, name: 'Andrés Torres', age: 23, program: 'Ing. Eléctrica', semester: '9no',
    bio: 'Apasionado por la electrónica y la robótica ⚡. Miembro del IEEE Student Branch. Busco equipo para el Hackathon ECI 2026.',
    interests: ['Robótica', 'Arduino', 'Hackathon', 'Música electrónica'],
    match: 77, level: 16, monas: 7, likes: 98,
    avatar: 'AT', gradient: 'linear-gradient(160deg, #A78BFA 0%, #5BC8FF 60%, #1A1829 100%)',
  },
];

// Incoming requests — people who sent us a request
const INIT_REQUESTS = [
  { id: 1, name: 'Juan Pérez',    program: 'Ing. Eléctrica', match: 91, avatar: 'JP', sent: '2h',  gradient: 'linear-gradient(135deg,#6C63FF,#FF6B9D)',
    bio: 'Estudiante de Eléctrica apasionado por la energía renovable y el ciclismo 🚲. Busco compañeros para proyectos.',
    interests: ['Energía solar', 'Ciclismo', 'Arduino'], age: 22, semester: '8vo' },
  { id: 2, name: 'Laura Gómez',   program: 'Ing. Sistemas',  match: 85, avatar: 'LG', sent: '5h',  gradient: 'linear-gradient(135deg,#7FE7C4,#6C63FF)',
    bio: 'Desarrolladora frontend en mis ratos libres. Amante del café y los videojuegos indie 🎮.',
    interests: ['React', 'Diseño', 'Gaming indie'], age: 20, semester: '6to' },
  { id: 3, name: 'David Torres',  program: 'Ing. Civil',     match: 79, avatar: 'DT', sent: '1d',  gradient: 'linear-gradient(135deg,#FFB347,#FF6B9D)',
    bio: 'Estudiante de Civil, fanático del fútbol y la fotografía urbana 📷.',
    interests: ['Fútbol', 'Fotografía', 'Senderismo'], age: 21, semester: '7mo' },
];

type TabId = 'discover' | 'requests' | 'matches';
type ChatMsg = { id: number; from: 'me' | 'them'; text: string; time: string };

// Profile modal for viewing a user's profile before accepting/rejecting
function ProfileModal({ person, onClose, onAccept, onReject, showActions }: {
  person: typeof INIT_REQUESTS[0];
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  showActions: boolean;
}) {
  const t = useTheme();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        className="rounded-3xl border w-full max-w-sm overflow-hidden"
        style={{ background: t.cardBg, borderColor: t.cardBorder }}
        onClick={e => e.stopPropagation()}>
        {/* Hero */}
        <div className="relative h-40 flex items-center justify-center" style={{ background: person.gradient }}>
          <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            <ArrowLeft size={16} color="white" />
          </button>
          <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white/30 text-2xl font-bold text-white">
            {person.avatar}
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <Flame size={12} style={{ color: '#FF6B9D' }} />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>{person.match}%</span>
          </div>
        </div>
        <div className="p-5">
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: t.text }}>{person.name}, {person.age}</h3>
          <p style={{ fontSize: '0.8rem', color: t.textMuted, marginBottom: '10px' }}>{person.program} · {person.semester} sem.</p>
          <p style={{ fontSize: '0.85rem', color: t.textSub, lineHeight: 1.6, marginBottom: '12px' }}>{person.bio}</p>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {person.interests.map(i => (
              <span key={i} className="px-2.5 py-1 rounded-full text-sm"
                style={{ background: 'var(--p-divider)', color: '#6C63FF' }}>{i}</span>
            ))}
          </div>
          {showActions && onAccept && onReject && (
            <div className="flex gap-3">
              <button onClick={onReject}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                style={{ color: '#FF4757', borderColor: 'rgba(255,71,87,0.3)', background: 'rgba(255,71,87,0.05)' }}>
                <X size={14} className="inline mr-1" /> Rechazar
              </button>
              <button onClick={onAccept}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#7FE7C4', color: '#0F0E1A' }}>
                <Check size={14} className="inline mr-1" /> ¡Match!
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Chat modal for matched users
function ChatModal({ person, onClose }: { person: { name: string; avatar: string; gradient: string }; onClose: () => void }) {
  const t = useTheme();
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { id: 1, from: 'them', text: `¡Hola! Acabo de hacer match contigo 😊`, time: 'ahora' },
  ]);
  const [input, setInput] = useState('');
  const send = () => {
    if (!input.trim()) return;
    setMsgs(p => [...p, { id: p.length + 1, from: 'me', text: input, time: 'ahora' }]);
    setInput('');
    setTimeout(() => {
      setMsgs(p => [...p, { id: p.length + 1, from: 'them', text: '¡Genial! ¿Hacemos un parche de estudio esta semana? 📚', time: 'ahora' }]);
    }, 1200);
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60 }}
        className="rounded-3xl border w-full max-w-sm overflow-hidden flex flex-col"
        style={{ background: t.cardBg, borderColor: t.cardBorder, height: 480 }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: t.divider }}>
          <button onClick={onClose}><ArrowLeft size={18} style={{ color: t.textMuted }} /></button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
            style={{ background: person.gradient }}>{person.avatar}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: t.text }}>{person.name}</p>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7FE7C4' }} /><span style={{ fontSize: '0.65rem', color: '#7FE7C4' }}>En línea</span></div>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.map(m => (
            <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl"
                style={{
                  background: m.from === 'me' ? 'linear-gradient(135deg,#6C63FF,#8B7FFF)' : t.inputBg,
                  color: m.from === 'me' ? 'white' : t.text,
                  borderRadius: m.from === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  border: m.from === 'them' ? `1px solid ${t.cardBorder}` : 'none',
                }}>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Input */}
        <div className="p-3 border-t flex gap-2" style={{ borderColor: t.divider }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
          <button onClick={send} className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#6C63FF' }}>
            <Send size={15} color="white" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MatchingView() {
  const t = useTheme();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  // sentRequests: IDs we've liked — waiting for them to accept
  const [sentRequests, setSentRequests] = useState<number[]>([]);
  // matches: mutual — profile + accepted
  const [matches, setMatches] = useState<{ uid: string; profileId: number }[]>([]);
  const [requests, setRequests] = useState(INIT_REQUESTS);
  const [tab, setTab] = useState<TabId>('discover');
  const [viewProfile, setViewProfile] = useState<typeof INIT_REQUESTS[0] | null>(null);
  const [chatWith, setChatWith] = useState<{ name: string; avatar: string; gradient: string } | null>(null);

  const current = PROFILES[currentIdx % PROFILES.length];
  const next = PROFILES[(currentIdx + 1) % PROFILES.length];

  const swipe = (dir: 'left' | 'right') => {
    setSwipeDir(dir);
    if (dir === 'right') {
      // Send request, NOT instant match
      setSentRequests(p => [...p, current.id]);
      addToast({ type: 'info', title: 'Solicitud enviada ✓', message: `Le enviaste una solicitud a ${current.name}` });
    }
    setTimeout(() => { setCurrentIdx(i => i + 1); setSwipeDir(null); }, 380);
  };

  const acceptRequest = (req: typeof INIT_REQUESTS[0]) => {
    setMatches(p => [...p, { uid: `match-${req.id}-${Date.now()}`, profileId: req.id }]);
    setRequests(p => p.filter(r => r.id !== req.id));
    setViewProfile(null);
    addToast({ type: 'match', title: '¡Es un Match! 🎉', message: `Tú y ${req.name} ahora son matches 💜`, duration: 5000 });
  };

  const rejectRequest = (id: number) => {
    setRequests(p => p.filter(r => r.id !== id));
    setViewProfile(null);
  };

  const openChat = (person: { name: string; avatar: string; gradient: string }) => {
    setChatWith(person);
  };

  const hasSentTo = (id: number) => sentRequests.includes(id);

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Modals */}
      <AnimatePresence>
        {viewProfile && (
          <ProfileModal
            person={viewProfile}
            onClose={() => setViewProfile(null)}
            onAccept={() => acceptRequest(viewProfile)}
            onReject={() => rejectRequest(viewProfile.id)}
            showActions={true}
          />
        )}
        {chatWith && <ChatModal person={chatWith} onClose={() => setChatWith(null)} />}
      </AnimatePresence>

      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between mb-6">
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: t.text }}>
            {tab === 'discover' ? 'Descubre Tu Match Perfecto' : tab === 'requests' ? 'Solicitudes recibidas' : 'Tus Matches'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: t.textMuted }}>Conecta con estudiantes de la ECI</p>
        </div>
        <div className="flex gap-1 p-1 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
          {([
            { id: 'discover', label: 'Descubrir' },
            { id: 'requests', label: `Solicitudes (${requests.length})` },
            { id: 'matches',  label: `Matches (${matches.length})` },
          ] as { id: TabId; label: string }[]).map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className="text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all"
              style={{ background: tab === tb.id ? '#6C63FF' : 'transparent', color: tab === tb.id ? 'white' : t.textMuted }}>
              {tb.id === 'discover' && 'Descubrir'}
              {tb.id === 'requests' && (<><span>Solicitudes</span><span className="hidden sm:inline"> ({requests.length})</span></>)}
              {tb.id === 'matches'  && (<><span>Matches</span><span className="hidden sm:inline"> ({matches.length})</span></>)}
            </button>
          ))}
        </div>
      </div>

      {/* ── DISCOVER ── */}
      {tab === 'discover' && (
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-y-auto lg:overflow-hidden">

          {/* ── Card stack column ── */}
          <div className="flex flex-col items-center w-full lg:w-[480px] lg:flex-shrink-0">
            {/* Stack */}
            <div className="relative w-full" style={{ height: 'clamp(500px, 68vh, 700px)' }}>
              {/* Ghost card behind (next profile) */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden border"
                style={{ background: next.gradient, transform: 'scale(0.94) translateY(16px)', zIndex: 1, opacity: 0.35, filter: 'blur(1px)' }}>
                <div className="flex items-end justify-center h-full pb-10">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold text-white">{next.avatar}</div>
                </div>
              </div>

              {/* Main card */}
              <AnimatePresence mode="wait">
                <motion.div key={currentIdx}
                  initial={{ scale: 0.92, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0, rotate: swipeDir === 'left' ? -20 : swipeDir === 'right' ? 20 : 0, x: swipeDir === 'left' ? -480 : swipeDir === 'right' ? 480 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className="absolute inset-0 rounded-3xl overflow-hidden"
                  style={{ zIndex: 3, boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(108,99,255,0.15)' }}>

                  {/* Full gradient hero */}
                  <div className="relative flex flex-col items-center justify-end pb-6" style={{ height: '62%', background: current.gradient }}>
                    {/* Overlay for text readability */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)' }} />

                    {/* Avatar */}
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white/25 flex items-center justify-center mb-4 relative z-10"
                      style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', fontSize: '3rem', fontWeight: 900, color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                      {current.avatar}
                    </div>

                    {/* Name + program on hero */}
                    <div className="relative z-10 text-center px-6">
                      <h3 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'white', marginBottom: '4px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        {current.name}, {current.age}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                        {current.program} · {current.semester} sem.
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full z-10"
                      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>⭐ Nv. {current.level}</span>
                    </div>
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full z-10"
                      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                      <Flame size={13} style={{ color: '#FF6B9D' }} />
                      <span style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>{current.match}%</span>
                    </div>

                    {/* Swipe feedback overlays */}
                    <AnimatePresence>
                      {swipeDir === 'right' && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center z-20"
                          style={{ background: 'rgba(127,231,196,0.25)' }}>
                          <div className="px-6 py-3 rounded-2xl border-4 -rotate-12 text-xl font-black"
                            style={{ borderColor: '#7FE7C4', color: '#7FE7C4', background: 'rgba(0,0,0,0.3)' }}>
                            SOLICITUD ✓
                          </div>
                        </motion.div>
                      )}
                      {swipeDir === 'left' && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center z-20"
                          style={{ background: 'rgba(255,71,87,0.25)' }}>
                          <div className="px-6 py-3 rounded-2xl border-4 rotate-12 text-xl font-black"
                            style={{ borderColor: '#FF4757', color: '#FF4757', background: 'rgba(0,0,0,0.3)' }}>
                            NOPE ✕
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Info card bottom */}
                  <div className="p-5 sm:p-6 flex flex-col gap-3" style={{ background: t.cardBg }}>
                    {hasSentTo(current.id) && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(127,231,196,0.1)', border: '1px solid rgba(127,231,196,0.25)' }}>
                        <Check size={14} style={{ color: '#7FE7C4' }} />
                        <span style={{ fontSize: '0.78rem', color: '#7FE7C4', fontWeight: 600 }}>Solicitud enviada — esperando respuesta</span>
                      </div>
                    )}
                    <p style={{ fontSize: '0.85rem', color: t.textSub, lineHeight: 1.65 }}>{current.bio}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {current.interests.map(interest => (
                        <span key={interest} className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: 'rgba(108,99,255,0.12)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.2)' }}>
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-8 mt-5">
              <motion.button onClick={() => swipe('left')}
                whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.93 }}
                className="w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all"
                style={{ background: 'rgba(255,71,87,0.08)', borderColor: 'rgba(255,71,87,0.4)', boxShadow: '0 6px 24px rgba(255,71,87,0.18)' }}>
                <X size={28} style={{ color: '#FF4757' }} />
              </motion.button>

              <motion.button onClick={() => swipe('right')} disabled={hasSentTo(current.id)}
                whileHover={!hasSentTo(current.id) ? { scale: 1.1, boxShadow: '0 12px 36px rgba(127,231,196,0.55)' } : {}}
                whileTap={!hasSentTo(current.id) ? { scale: 0.95 } : {}}
                className="w-24 h-24 rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed"
                style={{
                  background: hasSentTo(current.id) ? 'rgba(127,231,196,0.2)' : 'linear-gradient(135deg, #7FE7C4, #6C63FF)',
                  boxShadow: hasSentTo(current.id) ? 'none' : '0 10px 32px rgba(127,231,196,0.45)',
                  opacity: hasSentTo(current.id) ? 0.7 : 1,
                }}>
                {hasSentTo(current.id)
                  ? <Check size={32} style={{ color: '#7FE7C4' }} />
                  : <Heart size={34} color="white" fill="white" />}
              </motion.button>

              <motion.button onClick={() => setCurrentIdx(i => i + 1)}
                whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.93 }}
                className="w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all"
                style={{ background: 'rgba(108,99,255,0.08)', borderColor: 'rgba(108,99,255,0.3)', boxShadow: '0 6px 24px rgba(108,99,255,0.12)' }}>
                <MessageCircle size={24} style={{ color: '#6C63FF' }} />
              </motion.button>
            </div>

            <p style={{ fontSize: '0.72rem', color: t.textMuted, marginTop: '8px', textAlign: 'center' }}>
              {hasSentTo(current.id) ? '💜 Solicitud enviada — esperando respuesta' : '✕ Pasar  ·  ❤️ Enviar solicitud  ·  💬 Siguiente'}
            </p>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 flex flex-col gap-4 pb-4">

            {/* Match score hero */}
            <div className="rounded-3xl p-5 border relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(127,231,196,0.06))', borderColor: 'rgba(108,99,255,0.22)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p style={{ fontWeight: 800, fontSize: '1.05rem', color: t.text }}>
                    {current.match}% compatible
                  </p>
                  <p style={{ fontSize: '0.78rem', color: t.textMuted, marginTop: '2px' }}>
                    con {current.name.split(' ')[0]}
                  </p>
                </div>
                {/* Circular progress */}
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(108,99,255,0.15)" strokeWidth="5" />
                    <motion.circle cx="28" cy="28" r="22" fill="none" stroke="#6C63FF" strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - current.match / 100) }}
                      transition={{ duration: 1.2, ease: 'easeOut' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span style={{ fontWeight: 900, fontSize: '0.8rem', color: '#6C63FF' }}>{current.match}%</span>
                  </div>
                </div>
              </div>

              {/* Compatibility bars */}
              <div className="space-y-2.5">
                {[
                  { label: 'Programa académico', pct: 95, color: '#6C63FF' },
                  { label: 'Intereses comunes',  pct: current.match - 8, color: '#7FE7C4' },
                  { label: 'Vibra académica',    pct: current.match - 5, color: '#FF6B9D' },
                  { label: 'Nivel de actividad', pct: current.match - 12, color: '#FFB347' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: '0.73rem', color: t.textSub }}>{item.label}</span>
                      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: item.color }}>{item.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.inputBg }}>
                      <motion.div key={currentIdx} initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intereses en común */}
            <div className="rounded-2xl p-4 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: t.text, marginBottom: '10px' }}>
                🎯 Intereses en común
              </p>
              <div className="flex flex-wrap gap-2">
                {['Python', 'IA'].map(i => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                    style={{ background: 'rgba(127,231,196,0.12)', color: '#7FE7C4', border: '1px solid rgba(127,231,196,0.25)', fontWeight: 600 }}>
                    ✓ {i}
                  </span>
                ))}
                {current.interests.slice(0, 2).map(i => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-sm"
                    style={{ background: 'rgba(108,99,255,0.08)', color: '#8B85B0', border: `1px solid ${t.cardBorder}` }}>
                    {i}
                  </span>
                ))}
              </div>
            </div>

            {/* Pending sent requests */}
            {sentRequests.length > 0 && (
              <div className="rounded-2xl p-4 border" style={{ background: 'rgba(127,231,196,0.06)', borderColor: 'rgba(127,231,196,0.2)' }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#7FE7C4', marginBottom: '4px' }}>
                  ⏳ Solicitudes enviadas
                </p>
                <p style={{ fontSize: '0.78rem', color: t.textMuted, lineHeight: 1.6 }}>
                  {sentRequests.length} solicitud{sentRequests.length > 1 ? 'es' : ''} pendiente{sentRequests.length > 1 ? 's' : ''}. El match ocurre cuando ellos también digan ❤️
                </p>
              </div>
            )}

            {/* Profile stats */}
            <div className="rounded-2xl border p-4" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: t.text, marginBottom: '10px' }}>👤 Sobre {current.name.split(' ')[0]}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Nivel ECI',       value: `Nv. ${current.level}`,        icon: '⭐' },
                  { label: 'Monas',            value: `${current.monas} Monas`,      icon: '🎴' },
                  { label: 'Likes recibidos',  value: `${current.likes}`,            icon: '💜' },
                  { label: 'Semestre',         value: current.semester,              icon: '📚' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{ background: t.inputBg }}>
                    <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                    <div>
                      <p style={{ fontSize: '0.62rem', color: t.textMuted }}>{s.label}</p>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: t.text }}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUESTS (incoming) ── */}
      {tab === 'requests' && (
        <div className="max-w-2xl space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <Check size={40} style={{ color: '#7FE7C4', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, color: t.text }}>¡Todas las solicitudes revisadas!</p>
              <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '6px' }}>Sigue explorando en Descubrir</p>
            </div>
          ) : requests.map(req => (
            <motion.div key={req.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-2xl border"
              style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm cursor-pointer hover:scale-105 transition-all"
                style={{ background: req.gradient }} onClick={() => setViewProfile(req)}>
                {req.avatar}
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => setViewProfile(req)}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: t.text }}>{req.name}</p>
                <p style={{ fontSize: '0.75rem', color: t.textMuted }}>{req.program} · hace {req.sent}</p>
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#7FE7C4' }}>{req.match}%</span>
              <div className="flex gap-2">
                <button onClick={() => rejectRequest(req.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-105"
                  style={{ background: 'rgba(255,71,87,0.08)', borderColor: 'rgba(255,71,87,0.25)' }}>
                  <X size={15} style={{ color: '#FF4757' }} />
                </button>
                <button onClick={() => setViewProfile(req)}
                  className="px-3 py-2 rounded-xl text-sm border transition-all hover:opacity-80"
                  style={{ background: t.inputBg, color: t.textMuted, borderColor: t.cardBorder }}>
                  Ver perfil
                </button>
                <button onClick={() => acceptRequest(req)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: '#7FE7C4', color: '#0F0E1A' }}>
                  <Check size={14} /> ✓ ¡Match!
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── MATCHES ── */}
      {tab === 'matches' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
          {matches.length === 0 ? (
            <div className="col-span-2 sm:col-span-3 text-center py-16 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <Heart size={48} style={{ color: t.textMuted, margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 600, color: t.text }}>Aún no tienes matches</p>
              <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '6px' }}>Empieza enviando solicitudes en Descubrir</p>
            </div>
          ) : matches.map(entry => {
            const req = INIT_REQUESTS.find(r => r.id === entry.profileId);
            if (!req) return null;
            return (
              <motion.div key={entry.uid} whileHover={{ y: -4 }}
                className="rounded-2xl border overflow-hidden"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                <div className="h-24 flex items-center justify-center" style={{ background: req.gradient }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {req.avatar}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <p style={{ fontWeight: 700, color: t.text }}>{req.name}</p>
                  <p style={{ fontSize: '0.75rem', color: t.textMuted }}>{req.match}% match</p>
                  <button onClick={() => openChat({ name: req.name, avatar: req.avatar, gradient: req.gradient })}
                    className="mt-3 w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
                    style={{ background: '#6C63FF', color: 'white' }}>
                    <MessageCircle size={14} /> Enviar mensaje
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
