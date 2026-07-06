import { useState, useEffect, useRef } from 'react';
import {
  Compass, Heart, Users, MessageSquare, Calendar, Smile, Image,
  Bell, Settings, ChevronLeft, ChevronRight, Search, Zap,
  Sun, Moon, LogOut, Menu
} from 'lucide-react';
import { HomeView } from './pages/HomeView';
import { ChatsView } from './pages/ChatsView';
import { ParchesView } from './pages/ParchesView';
import { EventosView } from './pages/EventosView';
import { MatchingView } from './pages/MatchingView';
import { BienestarView } from './pages/BienestarView';
import { ProfileView } from './pages/ProfileView';
import { LoginView } from './pages/LoginView';
import { RegisterView } from './pages/RegisterView';
import { LandingPage } from './pages/LandingPage';
import { MicrosoftCallback } from './pages/MicrosoftCallback';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ToastContainer, addToast } from './components/ToastSystem';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ThemeContext, getTheme, useTheme } from './store/ThemeContext';
import { AccessibilityPanel, ColorBlindFilters, applyDyslexiaMode, getVisionFilter, type VisionMode } from './components/ColorAccessibility';
import { ImageWithFallback } from './components/ImageWithFallback';
import logoNuevoOscuroImg from './assets/logoNuevoOscuro.png';
import logoNuevoClaroImg from './assets/logoNuevoClaro.png';
import { motion, AnimatePresence } from 'motion/react';

type AuthState = 'login' | 'loginform' | 'register' | 'callback' | 'app';
type ViewId = 'home' | 'matching' | 'parches' | 'chats' | 'eventos' | 'bienestar' | 'album' | 'notificaciones' | 'ajustes' | 'perfil';

const NAV_ITEMS: { id: ViewId; label: string; icon: React.ComponentType<any>; badge?: number }[] = [
  { id: 'home',          label: 'Descubrir',       icon: Compass },
  { id: 'matching',      label: 'Matching',         icon: Heart,  badge: 3 },
  { id: 'parches',       label: 'Parches',          icon: Users,  badge: 10 },
  { id: 'eventos',       label: 'Eventos',          icon: Calendar },
  { id: 'bienestar',     label: 'Bienestar 24/7',   icon: Smile },
  { id: 'album',         label: 'Álbum de Monas',   icon: Image },
  { id: 'ajustes',       label: 'Ajustes',          icon: Settings },
];

const VIEW_LABELS: Record<ViewId, string> = {
  home:           'Descubrir',
  matching:       'Matching',
  parches:        'Parches',
  chats:          'Chats Privados',
  eventos:        'Eventos',
  bienestar:      'Bienestar 24/7',
  album:          'Álbum de Monas',
  notificaciones: 'Notificaciones',
  ajustes:        'Ajustes',
  perfil:         'Mi Perfil',
};

const NOTIFICATIONS_DATA = [
  { id: 1, type: 'match' as const, text: '¡Nuevo match con Camila Rodríguez! 💜', time: '2 min', read: false },
  { id: 2, type: 'chat' as const,  text: 'Tu parche "Cálculo III" tiene 3 mensajes nuevos', time: '15 min', read: false },
  { id: 3, type: 'evento' as const,text: 'El Hackathon ECI 2026 empieza mañana 🚀', time: '1h', read: false },
  { id: 4, type: 'match' as const, text: 'Isabela te envió una solicitud de match ❤️', time: '2h', read: false },
  { id: 5, type: 'xp' as const,    text: 'Subiste al Nivel 12 — ¡Eres un Explorador! ⬆️', time: '1d', read: true },
];

const notifEmoji: Record<string, string> = { match: '💜', chat: '💬', evento: '🎉', reporte: '⚠️', xp: '⚡', logro: '🏆', info: 'ℹ️' };

function NotificationsView() {
  const t = useTheme();
  const [notifs, setNotifs] = useState(NOTIFICATIONS_DATA);
  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: t.text }}>Notificaciones</h2>
        <button onClick={() => setNotifs(p => p.map(n => ({ ...n, read: true })))}
          className="text-sm hover:opacity-70" style={{ color: '#6C63FF' }}>
          Marcar todas como leídas
        </button>
      </div>
      <div className="space-y-3">
        {notifs.map(n => (
          <div key={n.id}
            className="flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
            style={{ background: n.read ? t.cardBg : 'var(--p-input)', borderColor: n.read ? t.cardBorder : 'rgba(108,99,255,0.3)' }}
            onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(108,99,255,0.1)' }}>
              {notifEmoji[n.type]}
            </div>
            <div className="flex-1">
              <p style={{ fontSize: '0.88rem', color: n.read ? t.textMuted : t.text, fontWeight: n.read ? 400 : 500 }}>{n.text}</p>
              <p style={{ fontSize: '0.72rem', color: t.textMuted, marginTop: '4px' }}>Hace {n.time}</p>
            </div>
            {!n.read && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: '#6C63FF' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function CampusView() {
  const t = useTheme();
  return (
    <div className="h-full overflow-y-auto pb-6">
      <h2 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '8px' }}>Campus ECI</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--p-muted)', marginBottom: '24px' }}>Todo lo que necesitas saber de tu campus</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Biblioteca', desc: 'Horarios, salas de estudio y reservas', emoji: '📚', color: '#6C63FF' },
          { title: 'Laboratorios', desc: 'Disponibilidad en tiempo real', emoji: '🔬', color: '#7FE7C4' },
          { title: 'Cafeterías', desc: 'Menú del día y horarios', emoji: '🍽️', color: '#FFB347' },
          { title: 'Servicios', desc: 'Registro, financiero, bienestar', emoji: '🏛️', color: '#FF6B9D' },
          { title: 'Transporte', desc: 'Rutas de bus universitario', emoji: '🚌', color: '#5BC8FF' },
          { title: 'Deportes', desc: 'Canchas y actividades físicas', emoji: '⚽', color: '#A78BFA' },
        ].map(item => (
          <motion.div key={item.title} whileHover={{ y: -4 }}
            className="rounded-2xl p-5 border cursor-pointer transition-all"
            style={{ background: t.cardBg, borderColor: `${item.color}25` }}>
            <div className="text-3xl mb-3">{item.emoji}</div>
            <h3 style={{ fontWeight: 700, marginBottom: '6px' }}>{item.title}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--p-muted)' }}>{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import monoPATRICIAImg from './assets/monoFondoU.png';
import monoULinkImg    from './assets/monoULink.png';
import monoSOCIALImg   from './assets/monoSocialNew.png';
import monoCODERImg    from './assets/monoCoderNew.png';
import monoDJImg       from './assets/monoDJNew.png';
import monoCIENTImg    from './assets/monoCientificoNew.png';
import monoCULTImg     from './assets/monoCulturaNew.png';
import monoTRANQImg    from './assets/monoTranquiloNew.png';
import monoRESPIRAImg  from './assets/monoRespiraNew.png';
import monoMUSICAImg   from './assets/monoMusicaNew.png';
import monoJUEGOSImg   from './assets/monoGamerNew.png';
import monoESTUDIOImg  from './assets/monoEstudiosoNew.png';
import monoARTEImg     from './assets/monoArteNew.png';
import monoAIREImg     from './assets/monoAireLibreNew.png';
import monoCOMIDAImg   from './assets/monoFoodieNew.png';

function ScratchCanvas({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDown = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const done = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, '#C8C8C8');
    g.addColorStop(0.35, '#A4A4A4');
    g.addColorStop(0.65, '#D6D6D6');
    g.addColorStop(1, '#B4B4B4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦ Raspa para', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('revelar', canvas.width / 2, canvas.height / 2 + 10);
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const scratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDown.current || done.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineWidth = 38;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      ctx.arc(pos.x, pos.y, 19, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPos.current = pos;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] < 128) transparent++; }
    if (transparent / (canvas.width * canvas.height) > 0.52 && !done.current) {
      done.current = true;
      onComplete();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={240} height={240}
      className="absolute inset-0 w-full h-full"
      style={{ cursor: 'crosshair', zIndex: 15, touchAction: 'none' }}
      onMouseDown={e => { isDown.current = true; lastPos.current = null; scratch(e); }}
      onMouseMove={scratch}
      onMouseUp={() => { isDown.current = false; lastPos.current = null; }}
      onMouseLeave={() => { isDown.current = false; lastPos.current = null; }}
      onTouchStart={e => { e.preventDefault(); isDown.current = true; lastPos.current = null; scratch(e); }}
      onTouchMove={e => { e.preventDefault(); scratch(e); }}
      onTouchEnd={() => { isDown.current = false; lastPos.current = null; }}
    />
  );
}

function AlbumView() {
  const t = useTheme();
  const [showMonasGuide, setShowMonasGuide] = useState(false);
  const [unlockedByUser, setUnlockedByUser] = useState(new Set<number>());
  const [justUnlocked, setJustUnlocked] = useState<null | { id: number; name: string; rarity: string; xp: number; color: string; img: string; how: string }>(null);
  const [albumPage, setAlbumPage] = useState(0);
  const [scratchPopupMona, setScratchPopupMona] = useState<null | { id: number; name: string; rarity: string; xp: number; color: string; img: string; how: string }>(null);

  const CAN_UNLOCK_IDS = [4, 8, 10];

  const ALL_MONAS = [
    { id:  1, name: 'Mona Coder',      rarity: 'Épica',      xp: 500,  color: '#6C63FF', img: monoCODERImg,   unlocked: true,  how: 'Únete a un parche de estudio con programación' },
    { id:  2, name: 'Mona DJ',         rarity: 'Épica',      xp: 500,  color: '#5BC8FF', img: monoDJImg,      unlocked: true,  how: 'Crea o únete a un parche o evento de música' },
    { id:  3, name: 'Mona Científica', rarity: 'Rara',       xp: 300,  color: '#A78BFA', img: monoCIENTImg,   unlocked: true,  how: 'Crea o únete a un parche o evento de física o química' },
    { id:  4, name: 'Mona Cultura',    rarity: 'Rara',       xp: 300,  color: '#FF9BAE', img: monoCULTImg,    unlocked: false, how: 'Crea o únete a un parche o evento de cultura' },
    { id:  5, name: 'Mona Tranquila',  rarity: 'Común',      xp: 100,  color: '#7FE7C4', img: monoTRANQImg,   unlocked: true,  how: 'Únete o crea un parche de relajación y realiza los 3 ejercicios de bienestar' },
    { id:  6, name: 'Mona Respira',    rarity: 'Común',      xp: 100,  color: '#00D9FF', img: monoRESPIRAImg, unlocked: false, how: 'Realiza los 3 ejercicios de relajación en Bienestar' },
    { id:  7, name: 'Mona Música',     rarity: 'Rara',       xp: 300,  color: '#FF6B9D', img: monoMUSICAImg,  unlocked: true,  how: 'Crea o únete a un parche o evento de música' },
    { id:  8, name: 'Mona Gamer',      rarity: 'Épica',      xp: 500,  color: '#FFB347', img: monoJUEGOSImg,  unlocked: false, how: 'Gana 3 rondas de Parqués y únete o crea un parche de juegos' },
    { id:  9, name: 'Mona Estudiosa',  rarity: 'Común',      xp: 100,  color: '#6C63FF', img: monoESTUDIOImg, unlocked: true,  how: 'Crea o únete a 3 parches de estudio diferentes' },
    { id: 10, name: 'Mona Arte',       rarity: 'Épica',      xp: 500,  color: '#FF9BAE', img: monoARTEImg,    unlocked: false, how: 'Crea o únete a un evento o parche de arte' },
    { id: 11, name: 'Mona Aire Libre', rarity: 'Legendaria', xp: 1000, color: '#7FE7C4', img: monoAIREImg,    unlocked: false, how: 'Únete a un parche de recreación o deporte' },
    { id: 12, name: 'Mona Foodie',     rarity: 'Legendaria', xp: 1000, color: '#FFB347', img: monoCOMIDAImg,  unlocked: false, how: 'Crea o únete a un parche de comida' },
    { id: 13, name: 'Mona Social',     rarity: 'Épica',      xp: 500,  color: '#FF6B9D', img: monoSOCIALImg,  unlocked: false, how: 'Ten más de 10 matches en la app' },
  ];

  const rarityColor: Record<string, string> = { 'Común': '#8B85B0', 'Rara': '#7FE7C4', 'Épica': '#6C63FF', 'Legendaria': '#FFB347' };

  const isUnlocked = (mona: typeof ALL_MONAS[0]) => mona.unlocked || unlockedByUser.has(mona.id);
  const canScratch = (mona: typeof ALL_MONAS[0]) => CAN_UNLOCK_IDS.includes(mona.id) && !isUnlocked(mona);

  const handleScratchComplete = (mona: typeof ALL_MONAS[0]) => {
    setScratchPopupMona(null);
    setUnlockedByUser(prev => { const s = new Set(prev); s.add(mona.id); return s; });
    setTimeout(() => {
      setJustUnlocked(mona);
      addToast({ type: 'logro', title: '¡Mona desbloqueada!', message: `¡Conseguiste la ${mona.name}!` });
    }, 300);
  };

  const PAGES = [ALL_MONAS.slice(0, 8), ALL_MONAS.slice(8)];

  const unlockedCount = ALL_MONAS.filter(m => isUnlocked(m)).length;
  const xpEarned = ALL_MONAS.filter(m => isUnlocked(m)).reduce((sum, m) => sum + m.xp, 0);
  const hasScratchable = CAN_UNLOCK_IDS.some(id => !isUnlocked(ALL_MONAS.find(m => m.id === id)!));

  return (
    <div className="h-full overflow-y-auto pb-6">

      {/* ── Album Cover Header ── */}
      <div className="relative rounded-3xl overflow-hidden mb-6" style={{ background: 'linear-gradient(135deg, #3B2F8E 0%, #6C63FF 55%, #9B55D4 100%)', minHeight: 170 }}>
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 w-full" style={{ height: 36, display: 'block' }}>
          <path d="M0,30 C300,60 900,0 1200,30 L1200,60 L0,60 Z" fill={t.darkMode ? '#0F0E1A' : '#F9F8FF'} />
        </svg>
        <div className="relative z-10 flex items-center gap-5 p-6 pb-12">
          <ImageWithFallback src={monoULinkImg} alt="Mascota"
            className="object-contain flex-shrink-0"
            style={{ width: 76, height: 76, filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.45))' }} />
          <div className="flex-1 min-w-0">
            <h2 style={{ fontWeight: 900, fontSize: '1.45rem', color: 'white', textShadow: '0 2px 12px rgba(0,0,0,0.35)', letterSpacing: '-0.02em' }}>
              Álbum de Monas
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', marginTop: '3px' }}>U•link · Colección Exclusiva ECI</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(8px)' }}>
                {unlockedCount}/{ALL_MONAS.length} coleccionadas
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(255,179,71,0.28)', color: '#FFD95A', backdropFilter: 'blur(8px)' }}>
                ⚡ {xpEarned.toLocaleString()} XP
              </span>
              <button onClick={() => setShowMonasGuide(true)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-85"
                style={{ background: 'rgba(127,231,196,0.22)', color: '#7FE7C4', border: '1px solid rgba(127,231,196,0.4)', backdropFilter: 'blur(8px)' }}>
                🗺️ ¿Cómo se ganan?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontSize: '0.75rem', color: t.textMuted }}>Progreso del álbum</p>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6C63FF' }}>{Math.round((unlockedCount / ALL_MONAS.length) * 100)}%</p>
      </div>
      <div className="h-2 rounded-full mb-5 overflow-hidden" style={{ background: t.divider }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${(unlockedCount / ALL_MONAS.length) * 100}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6C63FF, #7FE7C4)' }} />
      </div>

      {/* Scratch hint banner */}
      {hasScratchable && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
          style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)' }}>
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }} style={{ fontSize: '1.1rem' }}>✦</motion.span>
          <p style={{ fontSize: '0.8rem', color: '#A89BFF', fontWeight: 500 }}>
            Tienes monas listas para desbloquear. <strong style={{ color: '#6C63FF' }}>¡Tócalas para rasparlas!</strong>
          </p>
        </motion.div>
      )}

      {/* ── Album pages ── */}
      <div className="rounded-3xl overflow-hidden mb-2 relative" style={{
        background: t.darkMode ? '#0E0C22' : '#2B1F6E',
        boxShadow: '0 12px 56px rgba(108,99,255,0.3)',
        border: t.darkMode ? '2px solid rgba(108,99,255,0.35)' : '2px solid rgba(108,99,255,0.4)',
      }}>
        {/* Decorative background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(127,231,196,0.12)', filter:'blur(50px)' }} />
          <div style={{ position:'absolute', bottom:-40, left:-40, width:200, height:200, borderRadius:'50%', background:'rgba(108,99,255,0.18)', filter:'blur(45px)' }} />
          <div style={{ position:'absolute', top:'40%', left:'30%', width:160, height:160, borderRadius:'50%', background:'rgba(255,107,157,0.07)', filter:'blur(40px)' }} />
          {/* Dot texture */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }} />
        </div>

        {/* Page header strip */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <p style={{ fontWeight: 900, fontSize: '1.1rem', color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              MONAS U•LINK
            </p>
            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
              Colección ECI · {albumPage === 0 ? '#01 — #08' : '#09 — #14'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[0, 1].map(i => (
              <button key={i} onClick={() => setAlbumPage(i)}
                style={{
                  height: 7, borderRadius: 4, transition: 'all 0.2s',
                  width: albumPage === i ? 28 : 8,
                  background: albumPage === i ? '#7FE7C4' : 'rgba(255,255,255,0.25)',
                  border: 'none', cursor: 'pointer',
                }} />
            ))}
          </div>
        </div>

        {/* Thin accent line */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(127,231,196,0.6), rgba(108,99,255,0.6), transparent)', margin: '0 20px 16px' }} />

        {/* Sticker grid */}
        <div className="relative z-10 px-4 pb-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={albumPage}
              initial={{ opacity: 0, x: albumPage === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: albumPage === 0 ? 50 : -50 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="grid grid-cols-4 gap-2.5">
              {PAGES[albumPage].map(mona => {
                const unlk = isUnlocked(mona);
                const scratchable = canScratch(mona);
                const rc = rarityColor[mona.rarity as keyof typeof rarityColor];

                return (
                  <motion.div key={mona.id}
                    whileHover={unlk ? { scale: 1.06, y: -6, transition: { duration: 0.18 } } : scratchable ? { scale: 1.04, y: -3, transition: { duration: 0.18 } } : {}}
                    whileTap={scratchable ? { scale: 0.95 } : {}}
                    onClick={() => scratchable && setScratchPopupMona(mona)}
                    style={{
                      position: 'relative',
                      aspectRatio: '3 / 4',
                      borderRadius: 14,
                      overflow: 'hidden',
                      cursor: scratchable ? 'pointer' : 'default',
                      background: unlk
                        ? (t.darkMode ? '#1C1838' : '#FFFFFF')
                        : 'rgba(255,255,255,0.06)',
                      border: `2px solid ${unlk ? mona.color : scratchable ? rc : 'rgba(255,255,255,0.14)'}`,
                      boxShadow: unlk
                        ? `0 8px 32px ${mona.color}50, 0 2px 8px rgba(0,0,0,0.35)`
                        : scratchable
                        ? `0 0 0 1.5px ${rc}50, 0 6px 20px ${rc}30`
                        : '0 3px 12px rgba(0,0,0,0.3)',
                    }}>

                    {/* Rarity color stripe top */}
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:5, zIndex:3,
                      background: unlk || scratchable ? rc : 'rgba(255,255,255,0.15)' }} />

                    {/* #number badge */}
                    <div style={{ position:'absolute', top:9, left:7, zIndex:4 }}>
                      <span style={{ display:'block', padding:'2px 5px', borderRadius:4, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', color:'rgba(255,255,255,0.88)', fontSize:'0.42rem', fontFamily:'monospace', fontWeight:900, letterSpacing:'0.04em' }}>
                        #{String(mona.id).padStart(2,'0')}
                      </span>
                    </div>

                    {/* Mona image — fills the card */}
                    <div style={{ position:'absolute', top:5, left:0, right:0, bottom:26, display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 4px 0' }}>
                      <ImageWithFallback src={mona.img} alt={mona.name}
                        style={{
                          width:'100%', height:'100%', objectFit:'contain',
                          opacity: unlk ? 1 : scratchable ? 0.07 : 0.14,
                          filter: unlk
                            ? `drop-shadow(0 6px 20px ${mona.color}70)`
                            : (!unlk && !scratchable) ? 'grayscale(1)' : 'grayscale(1)',
                        }} />
                    </div>

                    {/* Scratch overlay */}
                    {scratchable && (
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:5 }}>
                        <motion.span
                          animate={{ scale:[1,1.35,1], opacity:[0.85,1,0.85] }}
                          transition={{ duration:1.4, repeat:Infinity, ease:'easeInOut' }}
                          style={{ fontSize:'2.2rem', color:rc, lineHeight:1, filter:`drop-shadow(0 0 8px ${rc})` }}>✦</motion.span>
                        <span style={{ fontSize:'0.55rem', fontWeight:900, color:rc, marginTop:7, textAlign:'center', textShadow:'0 1px 6px rgba(0,0,0,0.5)', lineHeight:1.4 }}>
                          Toca para<br/>raspar
                        </span>
                      </div>
                    )}

                    {/* Lock overlay */}
                    {!unlk && !scratchable && (
                      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:5 }}>
                        <span style={{ fontSize:'1.4rem', opacity:0.55 }}>🔒</span>
                      </div>
                    )}

                    {/* Footer strip — rarity */}
                    <div style={{
                      position:'absolute', bottom:0, left:0, right:0, height:26,
                      background: unlk ? mona.color : scratchable ? `${rc}CC` : 'rgba(255,255,255,0.1)',
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
                    }}>
                      <span style={{ fontSize:'0.5rem', fontWeight:900, color:'white', textTransform:'uppercase', letterSpacing:'0.05em', textShadow:'0 1px 3px rgba(0,0,0,0.35)' }}>
                        {mona.rarity}
                      </span>
                      {unlk && <span style={{ fontSize:'0.42rem', color:'rgba(255,255,255,0.78)', fontWeight:700 }}>+{mona.xp} XP</span>}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Page navigation */}
        <div className="relative z-10 flex items-center justify-between px-5 pb-4">
          <button onClick={() => setAlbumPage(0)} disabled={albumPage === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            ← Anterior
          </button>
          <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.45)', fontWeight:600 }}>
            {albumPage + 1} / 2
          </span>
          <button onClick={() => setAlbumPage(1)} disabled={albumPage === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            Siguiente →
          </button>
        </div>
      </div>

      {/* ── Scratch Popup ── */}
      <AnimatePresence>
        {scratchPopupMona && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[280] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
            onClick={() => setScratchPopupMona(null)}>
            <motion.div
              initial={{ scale: 0.82, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.82, y: 30 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onClick={e => e.stopPropagation()}
              className="rounded-3xl overflow-hidden w-full max-w-sm flex flex-col items-center"
              style={{
                background: t.darkMode ? '#1A1829' : '#F4F2FF',
                border: `2px solid ${scratchPopupMona.color}55`,
                boxShadow: `0 32px 80px ${scratchPopupMona.color}35`,
              }}>

              {/* Header */}
              <div className="w-full px-6 pt-6 pb-4 text-center" style={{ background: `linear-gradient(135deg, ${scratchPopupMona.color}22, ${scratchPopupMona.color}08)` }}>
                <p style={{ fontWeight: 800, fontSize: '0.65rem', color: scratchPopupMona.color, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '6px' }}>
                  Mona desbloqueada
                </p>
                <h3 style={{ fontWeight: 900, fontSize: '1.3rem', color: t.text }}>¡Raspa para revelar!</h3>
                <p style={{ fontSize: '0.78rem', color: t.textMuted, marginTop: '4px' }}>Desliza el dedo sobre la tarjeta</p>
              </div>

              {/* Scratch area */}
              <div className="relative mx-6 mb-4 rounded-2xl overflow-hidden"
                style={{ width: 320, height: 320, background: t.darkMode ? '#12102A' : '#EDE9FF' }}>
                {/* Mona visible underneath */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageWithFallback
                    src={scratchPopupMona.img}
                    alt={scratchPopupMona.name}
                    className="object-contain"
                    style={{ width: 300, height: 300, filter: `drop-shadow(0 8px 28px ${scratchPopupMona.color}70)` }}
                  />
                </div>
                {/* Canvas on top */}
                <ScratchCanvas onComplete={() => handleScratchComplete(scratchPopupMona)} />
              </div>

              {/* Footer info */}
              <div className="w-full px-6 pb-6 text-center">
                <span className="inline-block px-3 py-1 rounded-full mb-3"
                  style={{ background: `${scratchPopupMona.color}18`, color: scratchPopupMona.color, fontSize: '0.78rem', fontWeight: 700 }}>
                  {scratchPopupMona.rarity} · +{scratchPopupMona.xp} XP
                </span>
                <button onClick={() => setScratchPopupMona(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-70"
                  style={{ background: 'rgba(108,99,255,0.1)', color: t.textMuted }}>
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mona Desbloqueada Overlay ── */}
      <AnimatePresence>
        {justUnlocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
            onClick={() => setJustUnlocked(null)}>
            <motion.div
              initial={{ scale: 0.65, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.65, y: 40 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="rounded-3xl overflow-hidden w-full max-w-sm text-center"
              style={{ background: t.darkMode ? '#1A1829' : '#F4F2FF', border: `2px solid ${justUnlocked.color}55`, boxShadow: `0 24px 80px ${justUnlocked.color}30` }}
              onClick={e => e.stopPropagation()}>
              <div style={{ background: `linear-gradient(135deg, ${justUnlocked.color}30, ${justUnlocked.color}08)`, padding: '36px 28px 28px' }}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 0.55, delay: 0.15 }}
                  style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🎉</motion.div>
                <p style={{ fontWeight: 800, fontSize: '0.65rem', color: justUnlocked.color, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '16px' }}>
                  ¡Mona desbloqueada!
                </p>
                <motion.div className="mx-auto" style={{ width: 210, height: 210 }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.1 }}>
                  <ImageWithFallback src={justUnlocked.img} alt={justUnlocked.name}
                    className="w-full h-full object-contain"
                    style={{ filter: `drop-shadow(0 8px 28px ${justUnlocked.color}70)` }} />
                </motion.div>
                <h3 style={{ fontWeight: 900, fontSize: '1.25rem', color: justUnlocked.color, marginTop: '14px', marginBottom: '4px' }}>
                  {justUnlocked.name}
                </h3>
                <span className="inline-block px-3 py-1 rounded-full" style={{ background: `${justUnlocked.color}20`, color: justUnlocked.color, fontSize: '0.78rem', fontWeight: 700 }}>
                  {justUnlocked.rarity} · +{justUnlocked.xp} XP
                </span>
                <div className="mt-6 flex flex-col gap-2">
                  <button onClick={() => setJustUnlocked(null)}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${justUnlocked.color}, ${justUnlocked.color}CC)`, color: 'white' }}>
                    Listo
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Monas Guide Popup ── */}
      <AnimatePresence>
        {showMonasGuide && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background:'rgba(0,0,0,0.8)' }}
            onClick={() => setShowMonasGuide(false)}>
            <motion.div initial={{ scale:0.92, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.92 }}
              className="rounded-3xl w-full max-w-3xl overflow-hidden flex flex-col"
              style={{ background: t.darkMode ? '#1A1829' : '#F4F2FF', border:'1px solid rgba(108,99,255,0.3)', maxHeight:'85vh' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                style={{ borderColor:'rgba(108,99,255,0.2)', background:'rgba(108,99,255,0.06)' }}>
                <div>
                  <h3 style={{ fontWeight:800, fontSize:'1.15rem', color: t.text }}>🗺️ Guía de Monas</h3>
                  <p style={{ fontSize:'0.78rem', color: t.textMuted, marginTop:'2px' }}>Cómo desbloquear cada personaje</p>
                </div>
                <button onClick={() => setShowMonasGuide(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition-all"
                  style={{ background:'rgba(108,99,255,0.15)' }}>
                  <span style={{ fontSize:'1rem', color:'var(--p-muted)' }}>✕</span>
                </button>
              </div>
              <div className="flex gap-3 px-6 py-3 border-b flex-shrink-0 flex-wrap"
                style={{ borderColor:'rgba(108,99,255,0.1)', background: t.darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)' }}>
                {[
                  { rarity:'Común',      color:'#8B85B0', xp:100,  emoji:'⚪' },
                  { rarity:'Rara',       color:'#7FE7C4', xp:300,  emoji:'🟢' },
                  { rarity:'Épica',      color:'#6C63FF', xp:500,  emoji:'🔵' },
                  { rarity:'Legendaria', color:'#FFB347', xp:1000, emoji:'🟡' },
                ].map(r => (
                  <div key={r.rarity} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                    style={{ background:`${r.color}15`, border:`1px solid ${r.color}30` }}>
                    <span style={{ fontSize:'0.75rem' }}>{r.emoji}</span>
                    <span style={{ fontSize:'0.72rem', fontWeight:700, color:r.color }}>{r.rarity}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background:'rgba(255,179,71,0.15)', color:'#FFB347', fontSize:'0.62rem' }}>
                      +{r.xp} XP
                    </span>
                  </div>
                ))}
              </div>
              <div className="overflow-y-auto flex-1 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_MONAS.map(mona => {
                    const unlk = isUnlocked(mona);
                    const rc = rarityColor[mona.rarity as keyof typeof rarityColor];
                    return (
                      <div key={mona.id} className="flex items-center gap-3 rounded-2xl p-3 border transition-all"
                        style={{ background: unlk ? `${mona.color}10` : (t.darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'), borderColor: unlk ? `${mona.color}35` : 'rgba(108,99,255,0.12)' }}>
                        <div className={`flex-shrink-0 ${unlk ? '' : 'grayscale opacity-40'}`} style={{ width:52, height:52 }}>
                          <ImageWithFallback src={mona.img} alt={mona.name}
                            className="w-full h-full object-contain"
                            style={{ filter: unlk ? `drop-shadow(0 2px 8px ${mona.color}50)` : 'none' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span style={{ fontWeight:700, fontSize:'0.85rem', color: unlk ? mona.color : t.textMuted }}>{mona.name}</span>
                            {unlk && <span style={{ fontSize:'0.7rem' }}>✅</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 rounded-full"
                              style={{ fontSize:'0.58rem', color:rc, background:`${rc}18`, fontWeight:600 }}>
                              {mona.rarity}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full"
                              style={{ fontSize:'0.58rem', color:'#FFB347', background:'rgba(255,179,71,0.12)', fontWeight:700 }}>
                              +{mona.xp} XP
                            </span>
                          </div>
                          <p style={{ fontSize:'0.7rem', color: t.textSub, lineHeight:1.4 }}>{mona.how}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AjustesView({ onLogout, onEditProfile, visionMode, setVisionMode, dyslexiaMode, setDyslexiaMode }: {
  onLogout: () => void;
  onEditProfile: () => void;
  visionMode: VisionMode;
  setVisionMode: (m: VisionMode) => void;
  dyslexiaMode: boolean;
  setDyslexiaMode: (v: boolean) => void;
}) {
  const t = useTheme();
  const [notifToggles, setNotifToggles] = useState({ matches: true, parches: true, eventos: false });
  const [privacy, setPrivacy] = useState('publico');
  const [incognito, setIncognito] = useState(false);

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle}
      className="w-11 h-6 rounded-full relative transition-all"
      style={{ background: on ? '#6C63FF' : 'rgba(108,99,255,0.2)' }}>
      <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all"
        style={{ left: on ? '24px' : '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  );

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Section nav */}
      <div className="flex gap-1 mb-5 p-1 rounded-2xl border xl:hidden overflow-x-auto"
        style={{ background: t.cardBg, borderColor: t.cardBorder }}>
        {[
          { id: 'privacidad', label: '🔒 Privacidad' },
          { id: 'notificaciones', label: '🔔 Notifs' },
          { id: 'mas', label: '⚙️ Más' },
        ].map(s => (
          <button key={s.id}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'transparent', color: t.textMuted }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left — main settings */}
        <div className="col-span-1 xl:col-span-2 space-y-4">

          {/* Accesibilidad — primero */}
          <AccessibilityPanel mode={visionMode} setMode={setVisionMode} dyslexia={dyslexiaMode}
            setDyslexia={(v) => { setDyslexiaMode(v); applyDyslexiaMode(v); }} />


        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Cerrar sesión / Eliminar cuenta */}
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,77,106,0.04)', borderColor: 'rgba(255,77,106,0.2)' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: '#FF4D6A' }}>Sesión y cuenta</p>
            <div className="space-y-2">
              <button onClick={onLogout}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#FF4D6A', color: 'white' }}>
                Cerrar sesión
              </button>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-red-500/10"
                style={{ color: '#FF4D6A', borderColor: 'rgba(255,77,106,0.25)' }}>
                Eliminar cuenta
              </button>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: t.cardBg, borderColor: 'var(--p-divider)' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(108,99,255,0.1)', background: 'rgba(108,99,255,0.05)' }}>
              <span style={{ fontSize: '1rem' }}>🔔</span>
              <span style={{ fontWeight: 700, color: '#6C63FF', fontSize: '0.9rem' }}>Notificaciones</span>
            </div>
            {([
              { key: 'matches' as const, label: 'Nuevos matches',     desc: 'Alertas cuando alguien te da match' },
              { key: 'parches' as const, label: 'Mensajes de parches', desc: 'Avisos de chats no leídos' },
              { key: 'eventos' as const, label: 'Eventos cercanos',    desc: 'Recordatorios de eventos próximos' },
            ]).map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 border-b last:border-0"
                style={{ borderColor: 'var(--p-input)' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.label}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--p-muted)', marginTop: '2px' }}>{item.desc}</p>
                </div>
                <Toggle on={notifToggles[item.key]} onToggle={() => setNotifToggles(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
              </div>
            ))}
          </div>

          {/* Privacidad */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: t.cardBg, borderColor: 'var(--p-divider)' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(108,99,255,0.1)', background: 'rgba(108,99,255,0.05)' }}>
              <span style={{ fontSize: '1rem' }}>🔒</span>
              <span style={{ fontWeight: 700, color: '#6C63FF', fontSize: '0.9rem' }}>Privacidad</span>
            </div>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--p-input)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '12px' }}>Visibilidad del perfil</p>
              <div className="flex gap-3">
                {[{ val: 'publico', label: '🌍 Público' }, { val: 'privado', label: '🔒 Privado' }].map(opt => (
                  <button key={opt.val} onClick={() => setPrivacy(opt.val)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ background: privacy === opt.val ? 'rgba(108,99,255,0.2)' : 'transparent', color: privacy === opt.val ? '#6C63FF' : 'var(--p-muted)', border: `1px solid ${privacy === opt.val ? '#6C63FF' : 'rgba(108,99,255,0.2)'}` }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Modo incógnito en Matching</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--p-muted)', marginTop: '2px' }}>Navega sin que nadie te vea</p>
              </div>
              <Toggle on={incognito} onToggle={() => setIncognito(v => !v)} />
            </div>
          </div>

          {/* Sobre U•link — al final */}
          <div className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: 'var(--p-divider)' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px', color: '#6C63FF' }}>Sobre U•link</p>
            <div className="space-y-3">
              {[{ label: 'Versión', value: '1.0.0' }, { label: 'Institución', value: 'ECI' }, { label: 'Soporte', value: '24/7' }].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span style={{ fontSize: '0.82rem', color: 'var(--p-muted)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'rgba(108,99,255,0.1)' }}>
              {['Términos de uso', 'Política de privacidad', 'Centro de ayuda'].map(link => (
                <button key={link} className="w-full text-left text-sm hover:underline" style={{ color: '#6C63FF' }}>{link}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppCore() {
  // Detect Microsoft OAuth callback before any other state
  const isMsCallback =
    window.location.pathname === '/auth/callback' &&
    new URLSearchParams(window.location.search).has('code');

  const [authState, setAuthState] = useState<AuthState>(() =>
    isMsCallback ? 'callback' : 'login',
  );
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  // Auth — name derived from JWT email claim (karol.estupinan-v@ → "Karol Estupinan")
  const { userName, userEmail } = useAuth();
  const displayName = userName ?? userEmail ?? 'Usuario';
  const initials = displayName
    .split(' ').filter(Boolean).slice(0, 2)
    .map((w: string) => w[0].toUpperCase()).join('');

  const setLandingTarget = (target: 'login' | 'register') => {
    setAuthState(target === 'login' ? 'loginform' : 'register');
  };
  const [visionMode, setVisionMode] = useState<VisionMode>('normal');
  const [dyslexiaMode, setDyslexiaMode] = useState(false);
  const [linkedEvents, setLinkedEvents] = useState<Array<{parcheId: number; eventTitle: string; eventEmoji: string; eventDate: string}>>([]);
  const theme = getTheme(darkMode);

  // Welcome + demo toasts on login
  useEffect(() => {
    if (authState !== 'app') return;
    const t0 = setTimeout(() => addToast({ type: 'logro', title: '¡Bienvenido, Explorador! 🐒', message: '¡Qué bueno tenerte de vuelta en U•link!', duration: 5000 }), 600);
    const t1 = setTimeout(() => addToast({ type: 'match', title: '¡Nuevo Match!', message: 'Tú y Camila Rodríguez se gustaron 💜' }), 3000);
    const t2 = setTimeout(() => addToast({ type: 'xp', title: '+100 XP', message: 'Bonus de bienvenida desbloqueado ⚡' }), 5500);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [authState]);

  if (authState === 'callback')
    return (
      <MicrosoftCallback
        onSuccess={() => setAuthState('app')}
        onError={() => setAuthState('loginform')}
        darkMode={darkMode}
      />
    );
  if (authState === 'login')
    return <LandingPage onLogin={() => setLandingTarget('login')} onRegister={() => setLandingTarget('register')} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (authState === 'loginform')
    return <LoginView onLogin={() => setAuthState('app')} onGoRegister={() => setAuthState('register')} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (authState === 'register')
    return <RegisterView onRegister={() => setAuthState('app')} onGoLogin={() => setAuthState('loginform')} darkMode={darkMode} setDarkMode={setDarkMode} />;

  const renderView = () => {
    switch (activeView) {
      case 'home':           return <HomeView onNavigate={setActiveView} />;
      case 'parches':        return <ParchesView linkedEvents={linkedEvents} />;
      case 'chats':          return <ChatsView onNavigate={setActiveView} />;
      case 'eventos':        return <EventosView onLinkEvent={(parcheId, ev) => setLinkedEvents(prev => [...prev, {parcheId, ...ev}])} />;
      case 'matching':       return <MatchingView />;
      case 'bienestar':      return <BienestarView />;
      case 'perfil':         return <ProfileView />;
      case 'notificaciones': return <NotificationsView />;
      case 'album':          return <AlbumView />;
      case 'ajustes':        return <AjustesView onLogout={() => setAuthState('login')} onEditProfile={() => setActiveView('perfil')} visionMode={visionMode} setVisionMode={setVisionMode} dyslexiaMode={dyslexiaMode} setDyslexiaMode={(v) => { setDyslexiaMode(v); applyDyslexiaMode(v); }} />;
      default:               return <HomeView onNavigate={setActiveView} />;
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
    <div className={`size-full flex overflow-hidden relative${!darkMode ? ' light-theme' : ''}`} style={{
      fontFamily: "'Inter', 'Outfit', sans-serif",
      // CSS vars cascade to all children — components can use var(--p-*) in inline styles
      '--p-card':    theme.cardBg,
      '--p-border':  theme.cardBorder,
      '--p-text':    theme.text,
      '--p-muted':   theme.textMuted,
      '--p-sub':     theme.textSub,
      '--p-input':   theme.inputBg,
      '--p-divider': theme.divider,
      '--p-hover':   theme.hoverBg,
      '--p-active':  theme.activeBg,
      '--p-sidebar': theme.sidebarBg,
      '--p-shadow':  theme.shadow,
    } as React.CSSProperties}>
      <ColorBlindFilters />
      <AnimatedBackground light={!darkMode} />
      <ToastContainer />

      {/* ── Sidebar overlay (mobile) ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-10 flex-shrink-0 flex flex-col overflow-hidden transition-transform md:transition-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: theme.sidebarBg, backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(108,99,255,0.15)' }}
      >
        {/* Logo — always visible; click expands when collapsed */}
        <div className="flex items-center justify-center px-3 py-4 flex-shrink-0" style={{ minHeight: 64 }}>
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.button key="icon"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                onClick={() => setCollapsed(false)}
                className="flex items-center justify-center w-full transition-all hover:opacity-80 px-1"
                title="Expandir menú">
                <ImageWithFallback
                  src={theme.darkMode ? logoNuevoOscuroImg : logoNuevoClaroImg}
                  alt="U•link"
                  className="object-contain"
                  style={{ height: 52, width: 'auto', maxWidth: 72 }} />
              </motion.button>
            ) : (
              /* Expanded: full logo + collapse button */
              <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-between w-full gap-2">
                <ImageWithFallback
                  src={theme.darkMode ? logoNuevoOscuroImg : logoNuevoClaroImg}
                  alt="U•link" className="object-contain"
                  style={{ height: 60, maxWidth: 200, filter: theme.darkMode ? 'none' : undefined }} />
                <button onClick={() => setCollapsed(true)}
                  className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center flex-shrink-0 transition-all hover:opacity-70"
                  style={{ background: 'rgba(108,99,255,0.08)' }}
                  title="Colapsar">
                  <ChevronLeft size={14} style={{ color: theme.textMuted }} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content — hidden when collapsed */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col flex-1 overflow-hidden">

              {/* User pill */}
              <div className="px-2 mb-3 flex-shrink-0">
                <button onClick={() => { setActiveView('perfil'); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{ background: activeView === 'perfil' ? 'rgba(108,99,255,0.18)' : 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.12)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6C63FF, #7FE7C4)', fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>
                    {initials}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.text }}>{displayName}</p>
                    <div className="flex items-center gap-1">
                      <Zap size={9} style={{ color: '#FFB347' }} />
                      <span style={{ fontSize: '0.62rem', color: '#FFB347' }}>Nv. 12 · 2,340 XP</span>
                    </div>
                  </div>
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {NAV_ITEMS.map(item => {
                  const isActive = activeView === item.id;
                  return (
                    <button key={item.id} onClick={() => { setActiveView(item.id); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-left"
                      style={{
                        background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
                        borderLeft: `3px solid ${isActive ? '#6C63FF' : 'transparent'}`,
                        paddingLeft: isActive ? '9px' : '12px',
                      }}>
                      <div className="relative flex-shrink-0">
                        <item.icon size={18} style={{ color: isActive ? '#6C63FF' : theme.textMuted }} />
                        {item.badge && (
                          <div className="absolute -top-1.5 -right-1.5 min-w-[15px] h-4 rounded-full flex items-center justify-center px-0.5"
                            style={{ background: '#FF4D6A', fontSize: '0.52rem', fontWeight: 700, color: 'white' }}>
                            {item.badge > 9 ? '9+' : item.badge}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.86rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#6C63FF' : theme.textMuted, whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="px-3 py-3 border-t flex-shrink-0" style={{ borderColor: 'var(--p-divider)' }}>
                <button onClick={() => setAuthState('login')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.15)', color: '#FF4D6A' }}>
                  <LogOut size={15} />
                  <span style={{ fontSize: '0.8rem' }}>Cerrar sesión</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative" style={{ zIndex: 5 }}>
        {/* Topbar */}
        <header className="flex items-center gap-4 px-4 sm:px-6 py-3.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--p-divider)', background: theme.cardBg, backdropFilter: 'blur(20px)' }}>
          <button
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(108,99,255,0.1)' }}
            onClick={() => setMobileMenuOpen(m => !m)}>
            <Menu size={18} style={{ color: theme.textMuted }} />
          </button>
          <h1 style={{ fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap', color: theme.text }}>
            {VIEW_LABELS[activeView]}
          </h1>
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder=""
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none"
                style={{ background: theme.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: theme.text }} />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setActiveView('chats')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              style={{ background: 'rgba(108,99,255,0.1)' }}
              title="Chats">
              <MessageSquare size={17} style={{ color: 'var(--p-muted)' }} />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#FF4D6A' }} />
            </button>
            <button onClick={() => setActiveView('notificaciones')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              style={{ background: 'rgba(108,99,255,0.1)' }}>
              <Bell size={17} style={{ color: 'var(--p-muted)' }} />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#FF4D6A' }} />
            </button>
            {/* Theme toggle in topbar */}
            <button onClick={() => setDarkMode(d => !d)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
              {darkMode
                ? <Sun size={17} style={{ color: '#FFB347' }} />
                : <Moon size={17} style={{ color: '#6C63FF' }} />}
            </button>
            <button onClick={() => setActiveView('perfil')}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 transition-all"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #7FE7C4)', fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>
              {initials}
            </button>
          </div>
        </header>

        {/* Content — max 4/6 of available width, centered. Vision filter applied here */}
        <main className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col"
          style={{
            background: 'var(--p-content)',
            filter: getVisionFilter(visionMode) || undefined,
          }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="size-full">
                {renderView()}
              </motion.div>
            </AnimatePresence>
        </main>
      </div>
    </div>
    </ThemeContext.Provider>
  );
}

// ── Root export — wraps everything in AuthProvider ────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppCore />
    </AuthProvider>
  );
}
