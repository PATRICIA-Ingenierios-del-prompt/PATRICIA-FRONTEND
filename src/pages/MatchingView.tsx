import { useState, useRef } from 'react';
import { X, Heart, MessageCircle, Flame, Check, Send, ArrowLeft, RotateCcw, Star, Zap } from 'lucide-react';
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

const SCHEDULE_DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const SCHEDULE_SLOTS = ['8-10', '10-12', '12-14', '14-16', '16-18', '18-20'];

function buildSchedule(seed: number): Set<string> {
  const s = new Set<string>();
  const patterns = [
    ['0-1','0-2','1-0','1-1','2-0','3-2','4-1','4-2'],
    ['0-0','1-1','2-2','3-0','3-1','4-0','4-3'],
    ['0-2','0-3','1-2','2-1','2-3','4-2','4-3'],
  ];
  patterns[seed % patterns.length].forEach(k => s.add(k));
  return s;
}

// Profile modal for viewing a user's profile before accepting/rejecting
function ProfileModal({ person, onClose, onAccept, onReject, showActions }: {
  person: typeof INIT_REQUESTS[0];
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  showActions: boolean;
}) {
  const t = useTheme();
  const schedule = buildSchedule(person.id);
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
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>{person.program}</span>
          </div>
        </div>
        <div className="p-5">
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: t.text }}>{person.name}, {person.age}</h3>
          <p style={{ fontSize: '0.8rem', color: t.textMuted, marginBottom: '10px' }}>{person.program} · {person.semester} sem.</p>
          <p style={{ fontSize: '0.85rem', color: t.textSub, lineHeight: 1.6, marginBottom: '12px' }}>{person.bio}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {person.interests.map(i => (
              <span key={i} className="px-2.5 py-1 rounded-full text-sm"
                style={{ background: 'var(--p-divider)', color: '#6C63FF' }}>{i}</span>
            ))}
          </div>

          {/* Availability schedule — shown only for friends (matches) */}
          {!showActions && (
            <div className="mb-5">
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: t.text, marginBottom: '8px' }}>
                Disponibilidad semanal
              </p>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(6, 1fr)', gap: 2, minWidth: 280 }}>
                  {/* Header row */}
                  <div />
                  {SCHEDULE_DAYS.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: t.textMuted, paddingBottom: 2 }}>{d}</div>
                  ))}
                  {/* Slot rows */}
                  {SCHEDULE_SLOTS.map((slot, si) => (
                    <>
                      <div key={`label-${si}`} style={{ fontSize: '0.55rem', color: t.textMuted, display: 'flex', alignItems: 'center', paddingRight: 2 }}>{slot}</div>
                      {SCHEDULE_DAYS.map((_, di) => {
                        const active = schedule.has(`${di}-${si}`);
                        return (
                          <div key={`${di}-${si}`}
                            style={{
                              height: 18,
                              borderRadius: 4,
                              background: active ? 'linear-gradient(135deg,#6C63FF,#A78BFA)' : t.inputBg,
                              border: `1px solid ${active ? 'transparent' : t.cardBorder}`,
                            }} />
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>
          )}

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
  const [hasPhoto, setHasPhoto]       = useState(false);
  const [verifying, setVerifying]     = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setVerifyError('El archivo debe ser una imagen (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setVerifyError('La imagen es demasiado grande. El máximo es 10 MB.');
      return;
    }
    setVerifyError(null);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleVerify = () => {
    if (!photoPreview) return;
    if (!navigator.onLine) {
      setVerifyError('Sin conexión a internet. Verifica tu red e inténtalo de nuevo.');
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    setTimeout(() => {
      setVerifying(false);
      // Simulate backend response: randomly fail ~30% of the time for demo
      // In production this would be the actual API response
      const faceDetected = Math.random() > 0.3;
      if (!faceDetected) {
        setVerifyError('No detectamos una cara de persona en la foto. Por favor sube una foto tuya, de frente y bien iluminada.');
        return;
      }
      setHasPhoto(true);
    }, 2200);
  };

  const [currentIdx, setCurrentIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  // sentRequests: IDs we've liked — waiting for them to accept
  const [sentRequests, setSentRequests] = useState<number[]>([]);
  // matches: mutual — profile + accepted
  const [matches, setMatches] = useState<{ uid: string; profileId: number }[]>([]);
  const [requests, setRequests] = useState(INIT_REQUESTS);
  const [tab, setTab] = useState<TabId>('discover');
  const [viewProfile, setViewProfile] = useState<typeof INIT_REQUESTS[0] | null>(null);
  const [viewProfileIsMatch, setViewProfileIsMatch] = useState(false);
  const [chatWith, setChatWith] = useState<{ name: string; avatar: string; gradient: string } | null>(null);

  const current = PROFILES[currentIdx % PROFILES.length];
  const next = PROFILES[(currentIdx + 1) % PROFILES.length];

  /* ── Photo gate: show before matching ── */
  if (!hasPhoto) {
    return (
      <div className="h-full overflow-y-auto pb-6 flex items-center justify-center">
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
          className="w-full max-w-md rounded-3xl border overflow-hidden"
          style={{ background: t.cardBg, borderColor: t.cardBorder, boxShadow:'0 24px 64px rgba(108,99,255,0.18)' }}>

          {/* Header */}
          <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
            style={{ background:'linear-gradient(135deg,#3B2F8E 0%,#6C63FF 60%,#9B55D4 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize:'14px 14px' }} />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.3)' }}>
                📸
              </div>
              <h2 style={{ fontWeight:900, fontSize:'1.4rem', color:'white', letterSpacing:'-0.02em', marginBottom:8 }}>
                Foto de perfil obligatoria
              </h2>
              <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.78)', lineHeight:1.6 }}>
                Para usar Matching necesitas subir una foto real tuya. La verificamos automáticamente para garantizar una comunidad segura.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Info pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                'Foto privada y segura',
                'Verificación automática con IA',
                'Solo fotos de personas reales',
              ].map(text => (
                <div key={text} className="flex items-center px-3 py-1.5 rounded-full"
                  style={{ background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.2)' }}>
                  <span style={{ fontSize:'0.72rem', color:'#6C63FF', fontWeight:600 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Photo picker */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

            {photoPreview ? (
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative">
                  <img src={photoPreview} alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4"
                    style={{ borderColor:'#6C63FF', boxShadow:'0 8px 32px rgba(108,99,255,0.4)' }} />
                  <button onClick={() => { setPhotoPreview(null); setVerifyError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ background:'#FF4D6A', color:'white', border:'2px solid white' }}>
                    ✕
                  </button>
                </div>
                <p style={{ fontSize:'0.8rem', color: t.textMuted, textAlign:'center' }}>
                  Foto seleccionada. Al verificar, la IA confirma que es una foto real de una persona.
                </p>
              </div>
            ) : (
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed py-8 flex flex-col items-center gap-3 mb-6 transition-all hover:opacity-80"
                style={{ borderColor:'rgba(108,99,255,0.4)', background:'rgba(108,99,255,0.05)' }}>
                <span style={{ fontSize:'2.5rem' }}>📷</span>
                <div className="text-center">
                  <p style={{ fontWeight:700, color:'#6C63FF', marginBottom:4 }}>Subir mi foto</p>
                  <p style={{ fontSize:'0.75rem', color: t.textMuted }}>JPG, PNG · Máx. 10 MB</p>
                </div>
              </motion.button>
            )}

            {verifyError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-4"
                style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>❌</span>
                <div>
                  <p style={{ fontSize: '0.82rem', color: '#FF4D6A', fontWeight: 600, marginBottom: 2 }}>Verificación fallida</p>
                  <p style={{ fontSize: '0.78rem', color: '#FF4D6A', lineHeight: 1.5 }}>{verifyError}</p>
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={photoPreview && !verifying ? { scale:1.02 } : {}}
              whileTap={photoPreview && !verifying ? { scale:0.98 } : {}}
              onClick={handleVerify}
              disabled={!photoPreview || verifying}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-40"
              style={{ background: verifying ? 'rgba(108,99,255,0.6)' : 'linear-gradient(135deg,#6C63FF,#8B7FFF)', color:'white',
                boxShadow: photoPreview && !verifying ? '0 8px 28px rgba(108,99,255,0.4)' : 'none' }}>
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                    style={{ display:'inline-block' }}>⟳</motion.span>
                  Verificando que eres una persona real...
                </span>
              ) : '🤖 Verificar y acceder al Matching'}
            </motion.button>

            <p className="text-center mt-4" style={{ fontSize:'0.72rem', color: t.textMuted, lineHeight:1.5 }}>
              Sin foto verificada no puedes ver ni conectar con otros usuarios. Puedes añadir más fotos después.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

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
            showActions={!viewProfileIsMatch}
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
        <div className="flex flex-col items-center pb-6">

          {/* Card stack — centered, full gradient Tinder style */}
          <div className="relative w-full max-w-sm" style={{ height: 'clamp(560px, 72vh, 660px)' }}>

            {/* Ghost card (next) */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden"
              style={{ background: next.gradient, transform: 'scale(0.94) translateY(14px)', zIndex: 1, opacity: 0.3, filter: 'blur(2px)' }} />

            {/* Main card */}
            <AnimatePresence mode="wait">
              <motion.div key={currentIdx}
                initial={{ scale: 0.93, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotate: swipeDir === 'left' ? -22 : swipeDir === 'right' ? 22 : 0, x: swipeDir === 'left' ? -500 : swipeDir === 'right' ? 500 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ zIndex: 3, boxShadow: '0 28px 64px rgba(0,0,0,0.4), 0 6px 20px rgba(108,99,255,0.2)' }}>

                {/* Full-screen gradient background */}
                <div className="absolute inset-0" style={{ background: current.gradient }} />

                {/* Bottom dark overlay for text */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.1) 70%, transparent 100%)' }} />

                {/* Avatar — centered in upper portion */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '38%' }}>
                  <div className="w-32 h-32 rounded-full flex items-center justify-center font-black text-white border-4 border-white/20"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', fontSize: '3.2rem', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
                    {current.avatar}
                  </div>
                </div>

                {/* Top badges */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full z-10"
                  style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>⭐ Nv. {current.level}</span>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full z-10"
                  style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#7FE7C4' }} />
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Activo hoy</span>
                </div>

                {/* Bottom info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  {hasSentTo(current.id) && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                      style={{ background: 'rgba(127,231,196,0.2)', border: '1px solid rgba(127,231,196,0.4)' }}>
                      <Check size={13} style={{ color: '#7FE7C4' }} />
                      <span style={{ fontSize: '0.75rem', color: '#7FE7C4', fontWeight: 600 }}>Solicitud enviada · esperando respuesta</span>
                    </div>
                  )}

                  {/* Name + age */}
                  <div className="flex items-end gap-3 mb-1">
                    <h3 style={{ fontWeight: 900, fontSize: '2rem', color: 'white', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                      {current.name.split(' ')[0]}
                    </h3>
                    <span style={{ fontWeight: 700, fontSize: '1.6rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>{current.age}</span>
                  </div>

                  {/* Program */}
                  <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', marginBottom: '10px', fontWeight: 500 }}>
                    {current.program} · {current.semester} sem.
                  </p>

                  {/* Bio snippet */}
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, marginBottom: '12px' }}>
                    {current.bio}
                  </p>

                  {/* Interest tags */}
                  <div className="flex gap-2 flex-wrap">
                    {current.interests.slice(0, 3).map(interest => (
                      <span key={interest} className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Swipe feedback overlays */}
                <AnimatePresence>
                  {swipeDir === 'right' && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-start pl-8 z-20"
                      style={{ background: 'rgba(127,231,196,0.15)' }}>
                      <div className="px-5 py-2.5 rounded-2xl border-4 -rotate-12"
                        style={{ borderColor: '#7FE7C4', color: '#7FE7C4', background: 'rgba(0,0,0,0.25)', fontSize: '1.5rem', fontWeight: 900, backdropFilter: 'blur(4px)' }}>
                        SOLICITUD ❤️
                      </div>
                    </motion.div>
                  )}
                  {swipeDir === 'left' && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-end pr-8 z-20"
                      style={{ background: 'rgba(255,71,87,0.15)' }}>
                      <div className="px-5 py-2.5 rounded-2xl border-4 rotate-12"
                        style={{ borderColor: '#FF4757', color: '#FF4757', background: 'rgba(0,0,0,0.25)', fontSize: '1.5rem', fontWeight: 900, backdropFilter: 'blur(4px)' }}>
                        NOPE ✕
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 3 Tinder-style action buttons */}
          <div className="flex items-center justify-center gap-5 mt-5">

            {/* Rewind — small yellow */}
            <motion.button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all"
              style={{ background: 'rgba(255,179,71,0.1)', borderColor: 'rgba(255,179,71,0.45)', boxShadow: '0 4px 14px rgba(255,179,71,0.15)' }}>
              <RotateCcw size={20} style={{ color: '#FFB347' }} />
            </motion.button>

            {/* Like — large green checkmark (middle) */}
            <motion.button onClick={() => swipe('right')} disabled={hasSentTo(current.id)}
              whileHover={!hasSentTo(current.id) ? { scale: 1.1, boxShadow: '0 12px 36px rgba(127,231,196,0.55)' } : {}}
              whileTap={!hasSentTo(current.id) ? { scale: 0.93 } : {}}
              className="rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: 68, height: 68,
                background: hasSentTo(current.id) ? 'rgba(127,231,196,0.2)' : 'linear-gradient(135deg, #7FE7C4, #5BC8FF)',
                boxShadow: hasSentTo(current.id) ? 'none' : '0 8px 28px rgba(127,231,196,0.45)',
              }}>
              <Check size={30} color="white" strokeWidth={3} />
            </motion.button>

            {/* Nope — large red */}
            <motion.button onClick={() => swipe('left')}
              whileHover={{ scale: 1.1, boxShadow: '0 8px 28px rgba(255,71,87,0.35)' }} whileTap={{ scale: 0.92 }}
              className="w-18 h-18 rounded-full flex items-center justify-center border-2 transition-all"
              style={{ width: 68, height: 68, background: 'rgba(255,71,87,0.1)', borderColor: 'rgba(255,71,87,0.45)', boxShadow: '0 6px 20px rgba(255,71,87,0.18)' }}>
              <X size={30} style={{ color: '#FF4757' }} />
            </motion.button>
          </div>

          <p style={{ fontSize: '0.7rem', color: t.textMuted, marginTop: '10px', textAlign: 'center' }}>
            {hasSentTo(current.id) ? '💜 Solicitud enviada · esperando respuesta' : '↩ Anterior  ·  ✕ Pasar  ·  ✓ Solicitud'}
          </p>

        </div>
      )}

      {/* ── REQUESTS (incoming) — Tinder Gold grid ── */}
      {tab === 'requests' && (
        <div className="max-w-2xl">
          {/* Header count */}
          {requests.length > 0 && (
            <div className="flex items-center gap-3 mb-5 px-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.15), rgba(108,99,255,0.15))', border: '1px solid rgba(255,107,157,0.3)' }}>
                <Heart size={14} fill="#FF6B9D" style={{ color: '#FF6B9D' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FF6B9D' }}>
                  {requests.length} {requests.length === 1 ? 'persona' : 'personas'} te dieron solicitud
                </span>
              </div>
            </div>
          )}

          {requests.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <Check size={40} style={{ color: '#7FE7C4', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, color: t.text }}>¡Todas las solicitudes revisadas!</p>
              <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '6px' }}>Sigue explorando en Descubrir</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {requests.map((req, i) => (
                <motion.div key={req.id} layout
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ aspectRatio: '3/4', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
                  onClick={() => { setViewProfile(req); setViewProfileIsMatch(false); }}>

                  {/* Full gradient background */}
                  <div className="absolute inset-0" style={{ background: req.gradient }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)' }} />

                  {/* Avatar */}
                  <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '32%' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl border-2 border-white/25"
                      style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                      {req.avatar}
                    </div>
                  </div>

                  {/* Time badge */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>hace {req.sent}</span>
                  </div>

                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p style={{ fontWeight: 800, fontSize: '0.88rem', color: 'white', lineHeight: 1.2 }}>
                      {req.name.split(' ')[0]}, {req.age}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px', marginBottom: '8px' }}>
                      {req.program}
                    </p>

                    {/* Accept / Reject buttons */}
                    <div className="flex gap-2">
                      <button onClick={e => { e.stopPropagation(); rejectRequest(req.id); }}
                        className="flex-1 py-1.5 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                        style={{ background: 'rgba(255,71,87,0.25)', border: '1px solid rgba(255,71,87,0.5)' }}>
                        <X size={14} style={{ color: '#FF6B6B' }} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); acceptRequest(req); }}
                        className="flex-1 py-1.5 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                        style={{ background: 'rgba(127,231,196,0.3)', border: '1px solid rgba(127,231,196,0.6)' }}>
                        <Heart size={14} fill="#7FE7C4" style={{ color: '#7FE7C4' }} />
                      </button>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                    style={{ background: 'rgba(108,99,255,0.12)', border: '2px solid rgba(108,99,255,0.5)' }} />
                </motion.div>
              ))}
            </div>
          )}
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
                  <p style={{ fontSize: '0.75rem', color: t.textMuted }}>{req.program} · {req.semester} sem.</p>
                  <button onClick={() => openChat({ name: req.name, avatar: req.avatar, gradient: req.gradient })}
                    className="mt-3 w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
                    style={{ background: '#6C63FF', color: 'white' }}>
                    <MessageCircle size={14} /> Enviar mensaje
                  </button>
                  <button onClick={() => { setViewProfile(req); setViewProfileIsMatch(true); }}
                    className="mt-2 w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-80 border"
                    style={{ color: t.text, borderColor: t.cardBorder, background: 'transparent' }}>
                    Ver perfil
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
