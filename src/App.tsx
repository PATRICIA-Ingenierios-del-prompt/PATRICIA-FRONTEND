import { useState, useEffect, useRef } from 'react';
import {
  Compass, Heart, Users, MessageSquare, Calendar, Smile, Image,
  Bell, Settings, ChevronLeft, ChevronRight, Zap,
  Sun, Moon, LogOut, Menu, MapPin, ShieldCheck
} from 'lucide-react';
import { HomeView } from './pages/HomeView';
import { ChatsView } from './pages/ChatsView';
import { ParchesView } from './pages/ParchesView';
import { EventosView, type EnrolledEvent } from './pages/EventosView';
import { LocationView } from './pages/LocationView';
import { MatchingView } from './pages/MatchingView';
import { BienestarView } from './pages/BienestarView';
import { ProfileView } from './pages/ProfileView';
import { LoginView } from './pages/LoginView';
import { RegisterView } from './pages/RegisterView';
import { LandingPage } from './pages/LandingPage';
import { OnboardingView } from './pages/OnboardingView';
import { MicrosoftCallback } from './pages/MicrosoftCallback';
import { AdminView } from './pages/AdminView';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ReportsProvider } from './store/ReportsContext';
import { SupportProvider } from './store/SupportContext';
import { isAdminEmail } from './lib/admin';
import { userService } from './services/userService';
import { matchingService } from './services/matchingService';
import { logrosService } from './services/logrosService';
import { tokenManager } from './services/tokenManager';
import { ToastContainer, addToast } from './components/ToastSystem';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ThemeContext, getTheme, useTheme } from './store/ThemeContext';
import { LAST_APP_PATH_KEY, SESSION_EXPIRED_KEY } from './lib/sessionKeys';
import { AccessibilityPanel, ColorBlindFilters, applyDyslexiaMode, getVisionFilter, type VisionMode } from './components/ColorAccessibility';
import { ImageWithFallback } from './components/ImageWithFallback';
import { LegalModals, type LegalModalType } from './components/LegalContent';
import logoNuevoOscuroImg from './assets/logoNuevoOscuro.png';
import logoNuevoClaroImg from './assets/logoNuevoClaro.png';
import { useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
type AuthState = 'login' | 'loginform' | 'register' | 'callback' | 'onboarding' | 'app';
type ViewId = 'home' | 'matching' | 'parches' | 'chats' | 'eventos' | 'bienestar' | 'album' | 'notificaciones' | 'ajustes' | 'perfil' | 'admin';


const NAV_ITEMS: { id: ViewId; label: string; icon: React.ComponentType<any>; badge?: number }[] = [
  { id: 'home',          label: 'Descubrir',       icon: Compass },
  { id: 'matching',      label: 'Matching',         icon: Heart },
  { id: 'parches',       label: 'Parches',          icon: Users },
  { id: 'eventos',       label: 'Eventos',          icon: Calendar },
  { id: 'ubicacion',     label: 'Ubicación en vivo', icon: MapPin },
  { id: 'bienestar',     label: 'Bienestar 24/7',   icon: Smile },
  { id: 'album',         label: 'Álbum de Monas',   icon: Image },
  { id: 'ajustes',       label: 'Ajustes',          icon: Settings },
];

const APP_VIEW_PATHS: Record<ViewId, string> = {
  home: '/app/home',
  matching: '/app/matching',
  parches: '/app/parches',
  chats: '/app/chats',
  eventos: '/app/eventos',
  ubicacion: '/app/ubicacion',
  bienestar: '/app/bienestar',
  album: '/app/album',
  notificaciones: '/app/notificaciones',
  ajustes: '/app/ajustes',
  perfil: '/app/perfil',
  admin: '/app/admin',
};

const APP_ROUTE_SET = new Set(Object.values(APP_VIEW_PATHS));
const AUTH_STORAGE_KEY = 'ulink-authenticated';

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized === '' ? '/' : normalized;
}

function getViewFromPath(pathname: string): ViewId {
  const normalized = normalizePathname(pathname);
  if (normalized === '/app') return 'home';
  if (!normalized.startsWith('/app/')) return 'home';

  const view = normalized.slice('/app/'.length) as ViewId;
  return view in APP_VIEW_PATHS ? view : 'home';
}

const VIEW_LABELS: Record<ViewId, string> = {
  home:           'Descubrir',
  matching:       'Matching',
  parches:        'Parches',
  chats:          'Chats Privados',
  eventos:        'Eventos',
  ubicacion:      'Ubicación en vivo',
  bienestar:      'Bienestar 24/7',
  album:          'Álbum de Monas',
  notificaciones: 'Notificaciones',
  ajustes:        'Ajustes',
  perfil:         'Mi Perfil',
  admin:          'Panel Admin',
};

type NotificationItem = { id: string; type: 'match' | 'chat' | 'evento' | 'reporte' | 'xp' | 'logro' | 'info'; text: string; time: string; read: boolean };

const notifEmoji: Record<string, string> = { match: '💜', chat: '💬', evento: '🎉', reporte: '⚠️', xp: '⚡', logro: '🏆', info: 'ℹ️' };

/**
 * Sin microservicio de notificaciones todavía: por ahora armamos la lista a
 * partir de señales reales que sí existen (solicitudes de match pendientes).
 * Cuando exista un endpoint de notificaciones dedicado, reemplazar este fetch.
 */
function NotificationsView() {
  const t = useTheme();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ids = await matchingService.solicitudesRecibidas();
        if (cancelled) return;
        setNotifs(ids.map(id => ({
          id: `solicitud-${id}`,
          type: 'match',
          text: 'Tienes una nueva solicitud de match esperando tu respuesta.',
          time: 'reciente',
          read: false,
        })));
      } catch {
        if (!cancelled) setNotifs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: t.text }}>Notificaciones</h2>
        {notifs.length > 0 && (
          <button onClick={() => setNotifs(p => p.map(n => ({ ...n, read: true })))}
            className="text-sm hover:opacity-70" style={{ color: '#6C63FF' }}>
            Marcar todas como leídas
          </button>
        )}
      </div>
      {loading ? (
        <p style={{ fontSize: '0.85rem', color: t.textMuted, padding: '48px 0', textAlign: 'center' }}>Cargando notificaciones...</p>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
          <Bell size={32} style={{ color: t.textMuted, margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: t.text }}>No tienes notificaciones por ahora</p>
          <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '6px' }}>Te avisaremos aquí cuando pase algo nuevo</p>
        </div>
      ) : (
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
      )}
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


/** Metadatos visuales por mona — el backend no manda color/imagen/rareza, solo datos de logro. */
const MONA_VISUALS: Record<string, { color: string; img: string; rarity: 'Común' | 'Rara' | 'Épica' | 'Legendaria' }> = {
  MONA_CODER:      { color: '#6C63FF', img: monoCODERImg,   rarity: 'Épica' },
  MONA_DJ:         { color: '#5BC8FF', img: monoDJImg,      rarity: 'Épica' },
  MONA_CIENTIFICA: { color: '#A78BFA', img: monoCIENTImg,   rarity: 'Rara' },
  MONA_CULTURA:    { color: '#FF9BAE', img: monoCULTImg,    rarity: 'Rara' },
  MONA_TRANQUILA:  { color: '#7FE7C4', img: monoTRANQImg,   rarity: 'Común' },
  MONA_RESPIRA:    { color: '#00D9FF', img: monoRESPIRAImg, rarity: 'Común' },
  MONA_MUSICA:     { color: '#FF6B9D', img: monoMUSICAImg,  rarity: 'Rara' },
  MONA_GAMER:      { color: '#FFB347', img: monoJUEGOSImg,  rarity: 'Épica' },
  MONA_ESTUDIOSA:  { color: '#6C63FF', img: monoESTUDIOImg, rarity: 'Común' },
  MONA_ARTE:       { color: '#FF9BAE', img: monoARTEImg,    rarity: 'Épica' },
  MONA_AIRE_LIBRE: { color: '#7FE7C4', img: monoAIREImg,    rarity: 'Legendaria' },
  MONA_FOODIE:     { color: '#FFB347', img: monoCOMIDAImg,  rarity: 'Legendaria' },
  MONA_SOCIAL:     { color: '#FF6B9D', img: monoSOCIALImg,  rarity: 'Épica' },
};
const DEFAULT_MONA_VISUAL = { color: '#8B85B0', img: monoULinkImg, rarity: 'Común' as const };

interface DisplayMona {
  codigo: string; name: string; desc: string; xp: number; unlocked: boolean;
  color: string; img: string; rarity: 'Común' | 'Rara' | 'Épica' | 'Legendaria';
}

const ALBUM_SEEN_KEY = 'patricia_album_seen_codigos';

function loadSeenCodigos(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(ALBUM_SEEN_KEY) ?? '[]')); }
  catch { return new Set(); }
}
function saveSeenCodigos(codigos: Set<string>) {
  try { localStorage.setItem(ALBUM_SEEN_KEY, JSON.stringify(Array.from(codigos))); } catch { /* almacenamiento no disponible */ }
}

/** Tarjeta de "raspar" para revelar una mona que el backend ya confirmó como desbloqueada. */
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
  const { userId } = useAuth();
  const t = useTheme();
  const ad = t.darkMode;
  const aText    = ad ? 'white'                        : '#2A1F6E';
  const aSub     = ad ? 'rgba(255,255,255,0.52)'       : 'rgba(42,31,110,0.6)';
  const aNumBg   = ad ? 'rgba(0,0,0,0.65)'             : 'rgba(255,255,255,0.8)';
  const aNumTxt  = ad ? 'rgba(255,255,255,0.88)'       : '#2A1F6E';
  const aNavBg   = ad ? 'rgba(255,255,255,0.1)'        : 'rgba(42,31,110,0.1)';
  const aNavTxt  = ad ? 'rgba(255,255,255,0.85)'       : '#2A1F6E';
  const aNavBord = ad ? 'rgba(255,255,255,0.15)'       : 'rgba(42,31,110,0.25)';
  const aDotOff  = ad ? 'rgba(255,255,255,0.25)'       : 'rgba(42,31,110,0.3)';
  const aCnt     = ad ? 'rgba(255,255,255,0.45)'       : 'rgba(42,31,110,0.45)';
  const aDotTex  = ad ? 'rgba(255,255,255,0.06)'       : 'rgba(42,31,110,0.06)';

  const [showMonasGuide, setShowMonasGuide] = useState(false);
  const [guidePage, setGuidePage] = useState(0);
  const [albumPage, setAlbumPage] = useState(0);
  const [justUnlocked, setJustUnlocked] = useState<DisplayMona | null>(null);
  const [scratchPopupMona, setScratchPopupMona] = useState<DisplayMona | null>(null);
  const [monas, setMonas] = useState<DisplayMona[]>([]);
  const [xpTotal, setXpTotal] = useState(0);
  const [loadingMonas, setLoadingMonas] = useState(true);
  // Monas que el usuario ya "raspó" para revelar — el backend solo nos dice si las ganó,
  // la revelación (y su animación) es un momento local que se recuerda entre visitas.
  const [revealedCodigos, setRevealedCodigos] = useState<Set<string>>(() => loadSeenCodigos());

  useEffect(() => {
    if (!userId) { setLoadingMonas(false); return; }
    let cancelled = false;
    logrosService.getLogros(userId)
      .then(data => {
        if (cancelled) return;
        const display: DisplayMona[] = data.logros.map(l => {
          const v = MONA_VISUALS[l.codigo] ?? DEFAULT_MONA_VISUAL;
          return { codigo: l.codigo, name: l.nombre, desc: l.descripcion, xp: l.xp, unlocked: l.desbloqueado, ...v };
        });
        setMonas(display);
        setXpTotal(data.xpTotal);
      })
      .catch(() => { if (!cancelled) setMonas([]); })
      .finally(() => { if (!cancelled) setLoadingMonas(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const rarityColor: Record<string, string> = { 'Común': '#8B85B0', 'Rara': '#7FE7C4', 'Épica': '#6C63FF', 'Legendaria': '#FFB347' };

  const isRevealed = (mona: DisplayMona) => mona.unlocked && revealedCodigos.has(mona.codigo);
  const canScratch = (mona: DisplayMona) => mona.unlocked && !revealedCodigos.has(mona.codigo);

  const handleScratchComplete = (mona: DisplayMona) => {
    setScratchPopupMona(null);
    setRevealedCodigos(prev => {
      const s = new Set(prev);
      s.add(mona.codigo);
      saveSeenCodigos(s);
      return s;
    });
    setTimeout(() => {
      setJustUnlocked(mona);
      addToast({ type: 'logro', title: '¡Mona desbloqueada!', message: `¡Conseguiste la ${mona.name}!` });
    }, 300);
  };

  const PAGES = [monas.slice(0, 8), monas.slice(8)];
  const unlockedCount = monas.filter(m => m.unlocked).length;
  const hasScratchable = monas.some(canScratch);

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
                {unlockedCount}/{monas.length} coleccionadas
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(255,179,71,0.28)', color: '#FFD95A', backdropFilter: 'blur(8px)' }}>
                ⚡ {xpTotal.toLocaleString()} XP
              </span>
              <button onClick={() => { setShowMonasGuide(true); setGuidePage(0); }}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-85"
                style={{ background: 'rgba(127,231,196,0.22)', color: '#7FE7C4', border: '1px solid rgba(127,231,196,0.4)', backdropFilter: 'blur(8px)' }}>
                ¿Cómo se ganan?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontSize: '0.75rem', color: t.textMuted }}>Progreso del álbum</p>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6C63FF' }}>{monas.length > 0 ? Math.round((unlockedCount / monas.length) * 100) : 0}%</p>
      </div>
      <div className="h-2 rounded-full mb-5 overflow-hidden" style={{ background: t.divider }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${monas.length > 0 ? (unlockedCount / monas.length) * 100 : 0}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6C63FF, #7FE7C4)' }} />
      </div>

      {loadingMonas && (
        <p style={{ fontSize: '0.82rem', color: t.textMuted, textAlign: 'center', padding: '24px 0' }}>Cargando álbum...</p>
      )}

      {/* Scratch hint banner */}
      {hasScratchable && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
          style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)' }}>
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }} style={{ fontSize: '1.1rem' }}>✦</motion.span>
          <p style={{ fontSize: '0.8rem', color: '#A89BFF', fontWeight: 500 }}>
            ¡Ganaste monas nuevas! <strong style={{ color: '#6C63FF' }}>Tócalas para rasparlas y verlas.</strong>
          </p>
        </motion.div>
      )}

      {/* ── Album pages ── */}
      <div className="rounded-3xl overflow-hidden mb-2 relative" style={{
        background: t.darkMode ? '#0E0C22' : '#EDE9FF',
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
            backgroundImage: `radial-gradient(circle, ${aDotTex} 1px, transparent 1px)`,
            backgroundSize: '18px 18px',
          }} />
        </div>

        {/* Page header strip */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <p style={{ fontWeight: 900, fontSize: '1.1rem', color: aText, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              MONAS U•LINK
            </p>
            <p style={{ fontSize: '0.62rem', color: aSub, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
              Colección ECI · {albumPage === 0 ? '#01 — #08' : '#09 — #14'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[0, 1].map(i => (
              <button key={i} onClick={() => setAlbumPage(i)}
                style={{
                  height: 7, borderRadius: 4, transition: 'all 0.2s',
                  width: albumPage === i ? 28 : 8,
                  background: albumPage === i ? '#7FE7C4' : aDotOff,
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
              className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {PAGES[albumPage].map((mona, i) => {
                const unlk = isRevealed(mona);
                const scratchable = canScratch(mona);
                const rc = rarityColor[mona.rarity];
                const displayNum = albumPage * 8 + i + 1;

                return (
                  <motion.div key={mona.codigo}
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
                      <span style={{ display:'block', padding:'2px 5px', borderRadius:4, background:aNumBg, backdropFilter:'blur(6px)', color:aNumTxt, fontSize:'0.42rem', fontFamily:'monospace', fontWeight:900, letterSpacing:'0.04em' }}>
                        #{String(displayNum).padStart(2,'0')}
                      </span>
                    </div>

                    {/* Mona image — fills the card */}
                    <div style={{ position:'absolute', top:5, left:0, right:0, bottom:26, display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 4px 0' }}>
                      <ImageWithFallback src={mona.img} alt={mona.name}
                        style={{
                          width:'100%', height:'100%', objectFit:'contain',
                          opacity: unlk ? 1 : scratchable ? 0.07 : 0.14,
                          filter: unlk ? `drop-shadow(0 6px 20px ${mona.color}70)` : 'grayscale(1)',
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
            style={{ background: aNavBg, color: aNavTxt, border: `1px solid ${aNavBord}`, backdropFilter: 'blur(8px)' }}>
            ← Anterior
          </button>
          <span style={{ fontSize:'0.68rem', color: aCnt, fontWeight:600 }}>
            {albumPage + 1} / 2
          </span>
          <button onClick={() => setAlbumPage(1)} disabled={albumPage === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-25"
            style={{ background: aNavBg, color: aNavTxt, border: `1px solid ${aNavBord}`, backdropFilter: 'blur(8px)' }}>
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
                style={{ width: 'min(320px, 100%)', aspectRatio: '1 / 1', background: t.darkMode ? '#12102A' : '#D8D1FF' }}>
                {/* Mona visible underneath */}
                <div className="absolute inset-0 flex items-center justify-center p-3">
                  <ImageWithFallback
                    src={scratchPopupMona.img}
                    alt={scratchPopupMona.name}
                    className="object-contain w-full h-full"
                    style={{ filter: `drop-shadow(0 8px 28px ${scratchPopupMona.color}70)` }}
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

      {/* ── Monas Guide Popup — libro por rareza ── */}
      {(() => {
        const GUIDE_PAGES = [
          { rarity:'Común',      color:'#8B85B0', xp:100,  gradient:'linear-gradient(135deg,#4A4470 0%,#8B85B0 100%)' },
          { rarity:'Rara',       color:'#7FE7C4', xp:300,  gradient:'linear-gradient(135deg,#1A5C4C 0%,#7FE7C4 100%)' },
          { rarity:'Épica',      color:'#6C63FF', xp:500,  gradient:'linear-gradient(135deg,#3B2F8E 0%,#6C63FF 60%,#9B55D4 100%)' },
          { rarity:'Legendaria', color:'#FFB347', xp:1000, gradient:'linear-gradient(135deg,#7A4A00 0%,#FFB347 100%)' },
        ];
        const pg = GUIDE_PAGES[guidePage];
        const pageMonas = monas.filter(m => m.rarity === pg.rarity);
        return (
          <AnimatePresence>
            {showMonasGuide && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
                style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'blur(10px)' }}
                onClick={() => setShowMonasGuide(false)}>
                <motion.div initial={{ scale:0.88, y:30 }} animate={{ scale:1, y:0 }} exit={{ scale:0.88, y:30 }}
                  transition={{ type:'spring', stiffness:260, damping:22 }}
                  className="rounded-3xl w-full overflow-hidden flex flex-col"
                  style={{ background: t.darkMode ? '#0F0D22' : '#F0EEFF', maxWidth:680, maxHeight:'92vh',
                    boxShadow:'0 32px 80px rgba(0,0,0,0.65)', border:'2px solid rgba(108,99,255,0.3)' }}
                  onClick={e => e.stopPropagation()}>

                  {/* ── Portada / encabezado de página ── */}
                  <div className="relative flex-shrink-0 overflow-hidden" style={{ background: pg.gradient, padding:'24px 22px 20px' }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px)', backgroundSize:'14px 14px' }} />
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div>
                        <p style={{ fontSize:'0.58rem', fontWeight:800, color:'rgba(255,255,255,0.55)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:5 }}>
                          Álbum U•link · Guía Oficial · Página {guidePage + 1} de {GUIDE_PAGES.length}
                        </p>
                        <h3 style={{ fontWeight:900, fontSize:'1.55rem', color:'white', letterSpacing:'-0.02em', lineHeight:1.1 }}>
                          {pg.rarity}
                        </h3>
                        <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.72)', marginTop:5 }}>
                          +{pg.xp} XP por mona desbloqueada · {pageMonas.length} personaje{pageMonas.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button onClick={() => setShowMonasGuide(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-70 transition-all mt-1"
                        style={{ background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)' }}>
                        <span style={{ fontSize:'0.9rem', color:'white' }}>✕</span>
                      </button>
                    </div>
                    {/* Tabs de rareza como pestañas */}
                    <div className="relative z-10 flex gap-1.5 mt-4">
                      {GUIDE_PAGES.map((gp, i) => (
                        <button key={gp.rarity} onClick={() => setGuidePage(i)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: guidePage === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)',
                            color: guidePage === i ? gp.color : 'rgba(255,255,255,0.65)',
                            border: guidePage === i ? 'none' : '1px solid rgba(255,255,255,0.15)',
                          }}>
                          {gp.rarity}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Contenido de la página ── */}
                  <div className="overflow-y-auto flex-1 p-5" style={{ scrollbarWidth:'thin' }}>
                    <AnimatePresence mode="wait">
                      <motion.div key={guidePage}
                        initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                        transition={{ duration:0.28, ease:'easeOut' }}
                        className="grid grid-cols-1 gap-4">
                        {pageMonas.map(mona => {
                          const unlk = mona.unlocked;
                          return (
                            <div key={mona.codigo} className="rounded-2xl border overflow-hidden"
                              style={{
                                background: unlk
                                  ? (t.darkMode ? `linear-gradient(135deg,${mona.color}18,${mona.color}06)` : `linear-gradient(135deg,${mona.color}10,${mona.color}04)`)
                                  : (t.darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.04)'),
                                borderColor: unlk ? `${mona.color}50` : 'rgba(108,99,255,0.14)',
                              }}>
                              <div style={{ height:3, background: unlk ? mona.color : pg.color }} />
                              <div className="flex gap-5 p-5">
                                {/* Imagen grande */}
                                <div className="flex-shrink-0 flex items-center justify-center rounded-2xl"
                                  style={{ width:110, height:110,
                                    background: unlk ? `${mona.color}15` : (t.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.07)'),
                                    border:`2px solid ${unlk ? mona.color+'45' : 'rgba(108,99,255,0.14)'}` }}>
                                  <ImageWithFallback src={mona.img} alt={mona.name}
                                    style={{ width:96, height:96, objectFit:'contain',
                                      opacity: unlk ? 1 : 0.22,
                                      filter: unlk ? `drop-shadow(0 4px 14px ${mona.color}60)` : 'grayscale(1)' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/* Nombre + estado */}
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span style={{ fontWeight:800, fontSize:'1.05rem', color: unlk ? mona.color : t.text }}>
                                      {mona.name}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                                      style={{ background: unlk ? 'rgba(127,231,196,0.18)' : 'rgba(139,133,176,0.15)',
                                        color: unlk ? '#7FE7C4' : t.textMuted }}>
                                      {unlk ? 'Obtenida' : 'Bloqueada'}
                                    </span>
                                  </div>
                                  {/* XP */}
                                  <p className="mb-3" style={{ fontSize:'0.72rem', color: t.textMuted }}>
                                    +{mona.xp} XP al desbloquear
                                  </p>
                                  {/* Cómo ganarla */}
                                  <div className="rounded-xl px-4 py-3"
                                    style={{ background: t.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.07)',
                                      border:`1px solid ${t.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.13)'}` }}>
                                    <p style={{ fontSize:'0.62rem', fontWeight:800, color: unlk ? mona.color : pg.color,
                                      textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>
                                      Cómo ganarla
                                    </p>
                                    <p style={{ fontSize:'0.82rem', color: t.textSub, lineHeight:1.6 }}>{mona.desc}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* ── Navegación entre páginas ── */}
                  <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-t"
                    style={{ borderColor: t.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.12)' }}>
                    <button
                      onClick={() => setGuidePage(p => Math.max(0, p - 1))}
                      disabled={guidePage === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
                      style={{ background: t.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)',
                        color: t.darkMode ? 'rgba(255,255,255,0.8)' : '#6C63FF',
                        border: `1px solid ${t.darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(108,99,255,0.2)'}` }}>
                      ← Anterior
                    </button>
                    <div className="flex items-center gap-2">
                      {GUIDE_PAGES.map((gp, i) => (
                        <button key={i} onClick={() => setGuidePage(i)}
                          style={{ width: guidePage === i ? 24 : 8, height:8, borderRadius:4, border:'none', cursor:'pointer', transition:'all 0.2s',
                            background: guidePage === i ? pg.color : (t.darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(108,99,255,0.25)') }} />
                      ))}
                    </div>
                    <button
                      onClick={() => setGuidePage(p => Math.min(GUIDE_PAGES.length - 1, p + 1))}
                      disabled={guidePage === GUIDE_PAGES.length - 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
                      style={{ background: t.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)',
                        color: t.darkMode ? 'rgba(255,255,255,0.8)' : '#6C63FF',
                        border: `1px solid ${t.darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(108,99,255,0.2)'}` }}>
                      Siguiente →
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        );
      })()}
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
  const { userId } = useAuth();
  const [notifToggles, setNotifToggles] = useState({ matches: true, parches: true, eventos: false });
  const [privacy, setPrivacy] = useState('publico');
  const [incognito, setIncognito] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [activeSection, setActiveSection] = useState<'privacidad' | 'notificaciones' | 'mas'>('privacidad');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [pendingDeletionSince, setPendingDeletionSince] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    userService.getEstadoCuenta(userId)
      .then(estado => { if (!cancelled) setPendingDeletionSince(estado.pendienteEliminacion ? estado.fechaSolicitudEliminacion : null); })
      .catch(() => { /* si falla la consulta, simplemente no mostramos el banner */ });
    return () => { cancelled = true; };
  }, [userId]);

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await userService.solicitarEliminacionCuenta(userId);
      addToast({ type: 'info', title: 'Cuenta programada para eliminación', message: 'Tienes 24 horas para recuperarla — inicia sesión de nuevo antes de que pase ese tiempo.', duration: 8000 });
      setShowDeleteConfirm(false);
      onLogout();
    } catch (e) {
      setDeleteError(friendlyError(e, 'No se pudo procesar la solicitud. Intenta de nuevo.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleRecoverAccount = async () => {
    if (!userId) return;
    setRecovering(true);
    try {
      await userService.cancelarEliminacionCuenta(userId);
      setPendingDeletionSince(null);
      addToast({ type: 'info', title: 'Cuenta recuperada', message: 'Se canceló la eliminación. Tu cuenta sigue activa.' });
    } catch (e) {
      addToast({ type: 'reporte', title: 'No se pudo recuperar la cuenta', message: friendlyError(e, 'Intenta de nuevo o contacta soporte.') });
    } finally {
      setRecovering(false);
    }
  };
  // En xl+ las pestañas se ocultan y todo se ve junto; por debajo de xl, solo se
  // muestra la sección activa (evita un scroll larguísimo en móvil).
  const sectionVisibility = (id: 'privacidad' | 'notificaciones' | 'mas') =>
    activeSection === id ? '' : 'hidden xl:block';

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
      {/* Banner de recuperación — solo si en este navegador se pidió eliminar la cuenta hace menos de 24h */}
      {pendingDeletionSince != null && (
        <div className="flex flex-wrap items-center gap-3 mb-5 p-4 rounded-2xl border"
          style={{ background: 'rgba(255,77,106,0.08)', borderColor: 'rgba(255,77,106,0.3)' }}>
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <div className="flex-1 min-w-[200px]">
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FF4D6A' }}>Tu cuenta se eliminará pronto</p>
            <p style={{ fontSize: '0.78rem', color: t.textMuted }}>Pediste eliminarla — todavía estás dentro de las 24 horas de gracia. Puedes recuperarla ahora.</p>
          </div>
          <button onClick={handleRecoverAccount} disabled={recovering}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60 flex-shrink-0"
            style={{ background: '#7FE7C4', color: '#0F0E1A' }}>
            {recovering ? 'Recuperando…' : 'Recuperar cuenta'}
          </button>
        </div>
      )}
      {/* Section nav */}
      <div className="flex gap-1 mb-5 p-1 rounded-2xl border xl:hidden overflow-x-auto"
        style={{ background: t.cardBg, borderColor: t.cardBorder }}>
        {([
          { id: 'privacidad', label: 'Privacidad' },
          { id: 'notificaciones', label: 'Notifs' },
          { id: 'mas', label: 'Más' },
        ] as const).map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: activeSection === s.id ? '#6C63FF' : 'transparent', color: activeSection === s.id ? 'white' : t.textMuted }}>
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
          <div className={`rounded-2xl p-5 border ${sectionVisibility('mas')}`} style={{ background: 'rgba(255,77,106,0.04)', borderColor: 'rgba(255,77,106,0.2)' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: '#FF4D6A' }}>Sesión y cuenta</p>
            <div className="space-y-2">
              <button onClick={onLogout}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#FF4D6A', color: 'white' }}>
                Cerrar sesión
              </button>
              <button onClick={() => { setDeleteError(null); setShowDeleteConfirm(true); }}
                className="w-full py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-red-500/10"
                style={{ color: '#FF4D6A', borderColor: 'rgba(255,77,106,0.25)' }}>
                Eliminar cuenta
              </button>
            </div>
          </div>

          {/* Notificaciones */}
          <div className={`rounded-2xl border overflow-hidden ${sectionVisibility('notificaciones')}`} style={{ background: t.cardBg, borderColor: 'var(--p-divider)' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(108,99,255,0.1)', background: 'rgba(108,99,255,0.05)' }}>
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
          <div className={`rounded-2xl border overflow-hidden ${sectionVisibility('privacidad')}`} style={{ background: t.cardBg, borderColor: 'var(--p-divider)' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(108,99,255,0.1)', background: 'rgba(108,99,255,0.05)' }}>
              <span style={{ fontWeight: 700, color: '#6C63FF', fontSize: '0.9rem' }}>Privacidad</span>
            </div>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--p-input)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '12px' }}>Visibilidad del perfil</p>
              <div className="flex gap-3">
                {[{ val: 'publico', label: 'Público' }, { val: 'privado', label: 'Privado' }].map(opt => (
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
          <div className={`rounded-2xl p-5 border ${sectionVisibility('mas')}`} style={{ background: t.cardBg, borderColor: 'var(--p-divider)' }}>
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
              {([
                { label: 'Términos de uso', type: 'terminos' as const },
                { label: 'Política de privacidad', type: 'privacidad' as const },
                { label: 'Centro de ayuda', type: 'ayuda' as const },
              ]).map(link => (
                <button key={link.type} onClick={() => setLegalModal(link.type)} className="w-full text-left text-sm hover:underline" style={{ color: '#6C63FF' }}>{link.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <LegalModals open={legalModal} darkMode={t.darkMode} onClose={() => setLegalModal(null)} />

      {/* Confirmación de eliminar cuenta */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => !deleting && setShowDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              className="rounded-3xl border w-full max-w-sm overflow-hidden"
              style={{ background: t.cardBg, borderColor: 'rgba(255,77,106,0.35)' }}
              onClick={e => e.stopPropagation()}>
              <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF4D6A,#FF6B9D)' }} />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,77,106,0.14)' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: '1.05rem', color: t.text }}>¿Eliminar tu cuenta?</p>
                </div>
                <p style={{ fontSize: '0.85rem', color: t.textMuted, lineHeight: 1.6, marginBottom: '20px' }}>
                  Tienes <strong>24 horas</strong> para recuperar tu cuenta antes de que se borre. Pasado ese tiempo, el borrado es permanente y no se puede deshacer.
                </p>
                {deleteError && (
                  <p style={{ fontSize: '0.8rem', color: '#FF4D6A', marginBottom: '16px' }}>{deleteError}</p>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl text-sm disabled:opacity-50"
                    style={{ background: 'rgba(108,99,255,0.1)', color: t.textMuted }}>
                    Cancelar
                  </button>
                  <button onClick={handleDeleteAccount} disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: '#FF4D6A', color: 'white' }}>
                    {deleting ? 'Procesando…' : 'Sí, eliminar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AppCore() {
  // Detect Microsoft OAuth callback before any other state
  const isMsCallback =
    window.location.pathname === '/auth/callback' &&
    new URLSearchParams(window.location.search).has('code');

  const [authState, setAuthState] = useState<AuthState>(() => {
  if (isMsCallback) return 'callback';
  if (tokenManager.getAccessToken()) return 'app';
  return 'login';
});
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = normalizePathname(location.pathname);
  const isAppRoute = currentPath === '/app' || currentPath.startsWith('/app/');

  // Auth — name derived from JWT email claim (karol.estupinan-v@ → "Karol Estupinan")
  const { userName, userEmail, userId } = useAuth();
  const displayName = userName ?? userEmail ?? 'Usuario';
  const initials = displayName
    .split(' ').filter(Boolean).slice(0, 2)
    .map((w: string) => w[0].toUpperCase()).join('');
  const isAdmin = isAdminEmail(userEmail);
  const navItemsBase = NAV_ITEMS.map(item => item.id === 'matching' && pendingRequests > 0 ? { ...item, badge: pendingRequests } : item);
  const navItems = isAdmin ? [...navItemsBase, { id: 'admin' as ViewId, label: 'Admin', icon: ShieldCheck }] : navItemsBase;

  const setLandingTarget = (target: 'login' | 'register') => {
    setAuthState(target === 'login' ? 'loginform' : 'register');
  };
  const [visionMode, setVisionMode] = useState<VisionMode>('normal');
  const [dyslexiaMode, setDyslexiaMode] = useState(false);
  const [linkedEvents, setLinkedEvents] = useState<Array<{parcheId: number; eventTitle: string; eventEmoji: string; eventDate: string}>>([]);
  // Events the user has enrolled in (lifted so the Location view can track them).
  const [enrolledEvents, setEnrolledEvents] = useState<EnrolledEvent[]>([]);
  const [trackEventId, setTrackEventId] = useState<string | null>(null);
  const enrolledIds = new Set(enrolledEvents.map(e => e.eventId));
  const theme = getTheme(darkMode);

  useEffect(() => {
    if (authState !== 'app') return;

    if (!isAppRoute) {
      navigate('/app/home', { replace: true });
      return;
    }

    const viewFromPath = getViewFromPath(currentPath);
    if (viewFromPath === 'admin' && !isAdmin) {
      navigate('/app/home', { replace: true });
      return;
    }
    if (activeView !== viewFromPath) {
      setActiveView(viewFromPath);
    }

    if (!APP_ROUTE_SET.has(currentPath)) {
      navigate('/app/home', { replace: true });
      return;
    }

    sessionStorage.setItem(LAST_APP_PATH_KEY, currentPath);
  }, [authState, activeView, currentPath, isAppRoute, isAdmin, navigate]);

  // If a previous session was force-logged-out (expired refresh token), explain why.
  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_EXPIRED_KEY)) return;
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    addToast({
      type: 'reporte',
      title: 'Tu sesión expiró',
      message: 'Por seguridad cerramos tu sesión. Inicia sesión de nuevo.',
    });
  }, []);

  const goToAppView = (view: ViewId) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    navigate(APP_VIEW_PATHS[view]);
  };

  const handleLoginSuccess = async (fromRegister = false) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    // Leer el userId directo del token — React puede no haber re-renderizado aún
    const uid = userId ?? tokenManager.getUserIdFromToken();
    if (uid) {
      try {
        const necesita = await userService.necesitaOnboarding(uid);
        if (necesita) {
          setAuthState('onboarding');
          return;
        }
        // Cuenta existente intentando registrarse de nuevo → aviso y entra al app
        if (fromRegister) {
          addToast({
            type: 'info',
            title: 'Ya tienes una cuenta',
            message: 'Este correo ya está registrado en U•link. ¡Bienvenido de vuelta!',
            duration: 5000,
          });
        }
      } catch {
        // Si falla la verificación (red caída etc.), dejar pasar al app sin bloquear
      }
    }
    setAuthState('app');
    const lastPath = sessionStorage.getItem(LAST_APP_PATH_KEY);
    navigate(lastPath && APP_ROUTE_SET.has(lastPath) ? lastPath : '/app/home', { replace: true });
  };

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(LAST_APP_PATH_KEY);
    setAuthState('login');
    setMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  const handleEditProfile = () => {
    goToAppView('perfil');
  };

  // Welcome toast on login
  useEffect(() => {
    if (authState !== 'app') return;
    const t0 = setTimeout(() => addToast({ type: 'logro', title: '¡Bienvenido, Explorador!', message: '¡Qué bueno tenerte de vuelta en U•link!', duration: 5000 }), 600);
    return () => clearTimeout(t0);
  }, [authState]);

  // Solicitudes de match pendientes reales — alimenta el badge de Matching y el punto de la campana.
  useEffect(() => {
    if (authState !== 'app') return;
    let cancelled = false;
    matchingService.solicitudesRecibidas()
      .then(ids => { if (!cancelled) setPendingRequests(ids.length); })
      .catch(() => { if (!cancelled) setPendingRequests(0); });
    return () => { cancelled = true; };
  }, [authState]);

  if (authState === 'callback')
    return (
      <MicrosoftCallback
        onSuccess={handleLoginSuccess}
        onError={() => setAuthState('loginform')}
        darkMode={darkMode}
      />
    );
  if (authState === 'login')
    return <LandingPage onLogin={() => setLandingTarget('login')} onRegister={() => setLandingTarget('register')} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (authState === 'loginform')
    return <LoginView onLogin={() => handleLoginSuccess(false)} onGoRegister={() => setAuthState('register')} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (authState === 'register')
    return <RegisterView onRegister={() => handleLoginSuccess(true)} onGoLogin={() => setAuthState('loginform')} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (authState === 'onboarding')
    return (
      <OnboardingView
        onComplete={() => { setAuthState('app'); navigate('/app/home', { replace: true }); }}
        darkMode={darkMode}
      />
    );

  const renderView = () => {
    switch (activeView) {
      case 'home':           return <HomeView onNavigate={goToAppView} />;
      case 'parches':        return <ParchesView linkedEvents={linkedEvents} />;
      case 'chats':          return <ChatsView onNavigate={goToAppView} />;
      case 'eventos':        return <EventosView
                                onTrackEvent={(eventId) => { setTrackEventId(eventId); goToAppView('ubicacion'); }}
                                enrolledIds={enrolledIds}
                                onEnroll={(e) => setEnrolledEvents(prev => prev.some(x => x.eventId === e.eventId) ? prev : [...prev, e])} />;
      case 'ubicacion':      return <LocationView eventId={trackEventId} enrolledEvents={enrolledEvents} onConsumePreset={() => setTrackEventId(null)} />;
      case 'matching':       return <MatchingView />;
      case 'bienestar':      return <BienestarView />;
      case 'perfil':         return <ProfileView />;
      case 'notificaciones': return <NotificationsView />;
      case 'album':          return <AlbumView />;
      case 'ajustes':        return <AjustesView onLogout={handleLogout} onEditProfile={handleEditProfile} visionMode={visionMode} setVisionMode={setVisionMode} dyslexiaMode={dyslexiaMode} setDyslexiaMode={(v) => { setDyslexiaMode(v); applyDyslexiaMode(v); }} />;
      case 'admin':           return isAdmin ? <AdminView /> : <HomeView onNavigate={goToAppView} />;
      default:               return <HomeView onNavigate={goToAppView} />;
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
                <button onClick={() => goToAppView('perfil')}
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
                {navItems.map(item => {
                  const isActive = activeView === item.id;
                  return (
                    <button key={item.id} onClick={() => goToAppView(item.id)}
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
                <button onClick={handleLogout}
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
          <div className="flex-1" />
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => goToAppView('chats')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              style={{ background: 'rgba(108,99,255,0.1)' }}
              title="Chats">
              <MessageSquare size={17} style={{ color: 'var(--p-muted)' }} />
            </button>
            <button onClick={() => goToAppView('notificaciones')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              style={{ background: 'rgba(108,99,255,0.1)' }}>
              <Bell size={17} style={{ color: 'var(--p-muted)' }} />
              {pendingRequests > 0 && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#FF4D6A' }} />}
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
            <button onClick={() => goToAppView('perfil')}
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
      <ReportsProvider>
        <SupportProvider>
          <AppCore />
        </SupportProvider>
      </ReportsProvider>
    </AuthProvider>
  );
}
