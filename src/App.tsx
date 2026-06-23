import { useState, useEffect } from 'react';
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
import { ToastContainer, addToast } from './components/ToastSystem';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ThemeContext, getTheme, useTheme } from './store/ThemeContext';
import { AccessibilityPanel, ColorBlindFilters, applyDyslexiaMode, getVisionFilter, type VisionMode } from './components/ColorAccessibility';
import { ImageWithFallback } from './components/ImageWithFallback';
import logoBlancoImg from './assets/logoBLANCO.png';
import logoNegroImg from './assets/logoNEGRO.png';
import { motion, AnimatePresence } from 'motion/react';

type AuthState = 'login' | 'loginform' | 'register' | 'app';
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

import monoPATRICIAImg from './assets/monoPATRICIA.png';
import monoSOCIALImg   from './assets/monoSINFONDO.png';
import monoCODERImg    from './assets/monoCODER.png';
import monoDJImg       from './assets/monoDJ.png';
import monoCIENTImg    from './assets/monoCIENTIFICO.png';
import monoCULTImg     from './assets/monoCULTURA.png';
import monoTRANQImg    from './assets/monoTRANQUILO.png';
import monoRESPIRAImg  from './assets/monoRESPIRA.png';
import monoMUSICAImg   from './assets/monoMUSICA.png';
import monoJUEGOSImg   from './assets/monoJUEGOS.png';
import monoESTUDIOImg  from './assets/monoESTUDIO.png';
import monoARTEImg     from './assets/monoARTE.png';
import monoAIREImg     from './assets/monoAIRELIBRE.png';
import monoCOMIDAImg   from './assets/monoCOMIDA.png';

function AlbumView() {
  const t = useTheme();
  const [showMonasGuide, setShowMonasGuide] = useState(false);
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
  const rarityColor: Record<string, string> = { 'Común': t.textMuted, 'Rara': '#7FE7C4', 'Épica': '#6C63FF', 'Legendaria': '#FFB347' };
  const rarityBorder: Record<string, string> = { 'Común': '#8B85B025', 'Rara': '#7FE7C435', 'Épica': '#6C63FF45', 'Legendaria': '#FFB34760' };
  const unlocked = ALL_MONAS.filter(m => m.unlocked).length;

  const xpEarned = ALL_MONAS.filter(m => m.unlocked).reduce((sum, m) => sum + m.xp, 0);

  const RARITY_INFO = [
    { rarity: 'Común',     color: '#8B85B0', xp: 100,  desc: 'Actividades básicas:  parches, check-ins, posts',      emoji: '⚪' },
    { rarity: 'Rara',      color: '#7FE7C4', xp: 300,  desc: 'Participación activa en eventos y comunidad',           emoji: '🟢' },
    { rarity: 'Épica',     color: '#6C63FF', xp: 500,  desc: 'Logros especiales: parches creados, torneos ganados',   emoji: '🔵' },
    { rarity: 'Legendaria',color: '#FFB347', xp: 1000, desc: 'Hazañas extraordinarias en la comunidad ECI',           emoji: '🟡' },
  ];

  return (
    <div className="h-full overflow-y-auto pb-6">

      {/* ── Info header — permanent ── */}
      <div className="rounded-3xl border overflow-hidden mb-6"
        style={{ background: t.darkMode ? 'linear-gradient(135deg, #1A1829, #251F3D)' : 'linear-gradient(135deg, #F0EEFF, #E8FBF4)', borderColor: 'rgba(108,99,255,0.22)' }}>

        {/* Top strip */}
        <div className="flex items-start gap-6 p-6">
          {/* Mono image */}
          <div className="flex-shrink-0">
            <ImageWithFallback src={monoPATRICIAImg} alt="Mascota"
              className="object-contain"
              style={{ width: 90, height: 90, filter: 'drop-shadow(0 6px 18px rgba(108,99,255,0.35))' }} />
          </div>

          {/* Explanation */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: t.text }}>Álbum de Monas 🎴</h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.3)' }}>
                {unlocked}/{ALL_MONAS.length} coleccionadas
              </span>
              <button onClick={() => setShowMonasGuide(true)}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-85 flex items-center gap-1.5"
                style={{ background: 'rgba(127,231,196,0.15)', color: '#7FE7C4', border: '1px solid rgba(127,231,196,0.35)' }}>
                🗺️ ¿Cómo se ganan?
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: t.textSub, lineHeight: 1.7, marginBottom: '12px' }}>
              Las <strong style={{ color: '#6C63FF' }}>Monas</strong> son personajes coleccionables únicos que desbloqueas participando activamente en la comunidad ECI. Cada una tiene una <strong style={{ color: '#7FE7C4' }}>misión específica</strong> que debes completar y otorga <strong style={{ color: '#FFB347' }}>XP</strong> al conseguirla.
            </p>

            {/* XP earned + progress */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,179,71,0.12)', border: '1px solid rgba(255,179,71,0.25)' }}>
                <span style={{ fontSize: '0.85rem' }}>⚡</span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#FFB347' }}>{xpEarned.toLocaleString()} XP ganados</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(127,231,196,0.1)', border: '1px solid rgba(127,231,196,0.25)' }}>
                <span style={{ fontSize: '0.85rem' }}>🔒</span>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#7FE7C4' }}>{ALL_MONAS.length - unlocked} por desbloquear</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rarity guide */}
        <div className="border-t px-6 py-4" style={{ borderColor: 'rgba(108,99,255,0.15)', background: t.darkMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.4)' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Sistema de rarezas — ¿cómo se ganan?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {RARITY_INFO.map(r => (
              <div key={r.rarity} className="rounded-2xl px-3 py-2.5 border"
                style={{ background: `${r.color}10`, borderColor: `${r.color}30` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: r.color }}>{r.rarity}</span>
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(255,179,71,0.15)', color: '#FFB347' }}>
                    +{r.xp} XP
                  </span>
                </div>
                <p style={{ fontSize: '0.68rem', color: t.textMuted, lineHeight: 1.5 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontSize: '0.75rem', color: t.textMuted }}>Progreso del álbum</p>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6C63FF' }}>{Math.round((unlocked/ALL_MONAS.length)*100)}%</p>
      </div>
      <div className="h-2 rounded-full mb-6 overflow-hidden" style={{ background: t.divider }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${(unlocked/ALL_MONAS.length)*100}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6C63FF, #7FE7C4)' }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
        {ALL_MONAS.map(mona => (
          <motion.div key={mona.id}
            whileHover={mona.unlocked ? { scale: 1.04, y: -5 } : { scale: 1.01 }}
            className="rounded-2xl border flex flex-col items-center text-center cursor-pointer relative overflow-hidden"
            style={{
              background: mona.unlocked ? t.cardBg : (t.darkMode ? 'rgba(20,18,35,0.85)' : '#F0EEFF'),
              borderColor: mona.unlocked ? rarityBorder[mona.rarity] : t.cardBorder,
              padding: '20px 14px',
              boxShadow: mona.unlocked ? `0 4px 20px ${mona.color}18` : 'none',
            }}>
            {mona.rarity === 'Legendaria' && mona.unlocked && (
              <div className="absolute inset-0 opacity-8" style={{ background: `radial-gradient(circle at 50% 30%, ${mona.color}, transparent 70%)` }} />
            )}
            {/* Real dog image */}
            <div className={`relative z-10 ${mona.unlocked ? '' : 'opacity-25 grayscale'}`}
              style={{ width: 100, height: 100 }}>
              <ImageWithFallback src={mona.img} alt={mona.name}
                className="w-full h-full object-contain"
                style={{ filter: mona.unlocked ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'none' }} />
            </div>
            {!mona.unlocked && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
                <div className="px-3 py-2 rounded-2xl" style={{ background: t.darkMode ? 'rgba(15,14,26,0.85)' : 'rgba(244,242,255,0.9)' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔒</span>
                </div>
              </div>
            )}
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: mona.unlocked ? mona.color : t.textMuted, marginTop: '10px', position: 'relative', zIndex: 10 }}>
              {mona.name}
            </p>
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '0.62rem', color: rarityColor[mona.rarity], background: `${rarityColor[mona.rarity]}18`, marginTop: '4px', position: 'relative', zIndex: 10 }}>
              {mona.rarity}
            </span>
            <p style={{ fontSize: '0.62rem', color: mona.unlocked ? '#7FE7C4' : t.textMuted, marginTop: '4px', lineHeight: 1.4, position: 'relative', zIndex: 10 }}>
              {mona.unlocked ? `+${mona.xp} XP` : mona.how}
            </p>
          </motion.div>
        ))}
      </div>

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
              {/* Header */}
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
              {/* Rarity legend */}
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
              {/* Monas list */}
              <div className="overflow-y-auto flex-1 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_MONAS.map(mona => (
                    <div key={mona.id} className="flex items-center gap-3 rounded-2xl p-3 border transition-all"
                      style={{ background: mona.unlocked ? `${mona.color}10` : (t.darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'), borderColor: mona.unlocked ? `${mona.color}35` : 'rgba(108,99,255,0.12)' }}>
                      <div className={`flex-shrink-0 ${mona.unlocked ? '' : 'grayscale opacity-40'}`}
                        style={{ width:52, height:52 }}>
                        <ImageWithFallback src={mona.img} alt={mona.name}
                          className="w-full h-full object-contain"
                          style={{ filter: mona.unlocked ? `drop-shadow(0 2px 8px ${mona.color}50)` : 'none' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ fontWeight:700, fontSize:'0.85rem', color: mona.unlocked ? mona.color : t.textMuted }}>{mona.name}</span>
                          {mona.unlocked && <span style={{ fontSize:'0.7rem' }}>✅</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="px-1.5 py-0.5 rounded-full"
                            style={{ fontSize:'0.58rem', color:rarityColor[mona.rarity], background:`${rarityColor[mona.rarity]}18`, fontWeight:600 }}>
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
                  ))}
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

          {/* Sobre PATRICI.A — al final */}
          <div className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: 'var(--p-divider)' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px', color: '#6C63FF' }}>Sobre PATRICI.A</p>
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

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('login');
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  const setLandingTarget = (target: 'login' | 'register') => {
    setAuthState(target === 'login' ? 'loginform' : 'register');
  };
  const [visionMode, setVisionMode] = useState<VisionMode>('normal');
  const [dyslexiaMode, setDyslexiaMode] = useState(false);
  const theme = getTheme(darkMode);

  // Welcome + demo toasts on login
  useEffect(() => {
    if (authState !== 'app') return;
    const t0 = setTimeout(() => addToast({ type: 'logro', title: '¡Bienvenido, Explorador! 🐒', message: '¡Qué bueno tenerte de vuelta en PATRICI.A!', duration: 5000 }), 600);
    const t1 = setTimeout(() => addToast({ type: 'match', title: '¡Nuevo Match!', message: 'Tú y Camila Rodríguez se gustaron 💜' }), 3000);
    const t2 = setTimeout(() => addToast({ type: 'xp', title: '+100 XP', message: 'Bonus de bienvenida desbloqueado ⚡' }), 5500);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [authState]);

  if (authState === 'login')
    return <LandingPage onLogin={() => setLandingTarget('login')} onRegister={() => setLandingTarget('register')} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (authState === 'loginform')
    return <LoginView onLogin={() => setAuthState('app')} onGoRegister={() => setAuthState('register')} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (authState === 'register')
    return <RegisterView onRegister={() => setAuthState('app')} onGoLogin={() => setAuthState('loginform')} darkMode={darkMode} setDarkMode={setDarkMode} />;

  const renderView = () => {
    switch (activeView) {
      case 'home':           return <HomeView onNavigate={setActiveView} />;
      case 'parches':        return <ParchesView />;
      case 'chats':          return <ChatsView onNavigate={setActiveView} />;
      case 'eventos':        return <EventosView />;
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
                  src={theme.darkMode ? logoBlancoImg : logoNegroImg}
                  alt="PATRICI.A"
                  className="object-contain"
                  style={{ height: 22, width: 'auto', maxWidth: 44 }} />
              </motion.button>
            ) : (
              /* Expanded: full logo + collapse button */
              <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-between w-full gap-2">
                <ImageWithFallback
                  src={theme.darkMode ? logoBlancoImg : logoNegroImg}
                  alt="PATRICI.A" className="object-contain"
                  style={{ height: 30, maxWidth: 130, filter: theme.darkMode ? 'none' : undefined }} />
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
                    TU
                  </div>
                  <div className="text-left overflow-hidden">
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.text }}>Tu Perfil</p>
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
              TU
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
