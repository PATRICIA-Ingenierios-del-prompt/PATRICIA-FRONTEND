import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import monoImg       from '../assets/monoULink.png';
import monoMusica    from '../assets/monoMusicaN.png';
import monoEstudio   from '../assets/monoEstudiosoN.png';
import monoAireLibre from '../assets/monoAireLibreN.png';
import monoComida    from '../assets/monoFoodieN.png';
import monoJuegos    from '../assets/monoGamerN.png';
import monoArte      from '../assets/monoArteN.png';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';

type ViewId = 'home' | 'matching' | 'parches' | 'campus' | 'eventos' | 'bienestar' | 'album' | 'notificaciones' | 'ranking' | 'ajustes' | 'perfil';
interface HomeViewProps { onNavigate: (v: ViewId) => void; }

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12)  return { text: 'Buenos días',   emoji: '🌅' };
  if (h >= 12 && h < 18) return { text: 'Buenas tardes', emoji: '☀️' };
  return                         { text: 'Buenas noches', emoji: '🌙' };
}

const VIBRAS = [
  { id: 'musica',      label: 'Música',      emoji: '🎵', color: '#FF6B9D', monoImg: monoMusica,    desc: 'Comparte ritmos, playlists y encuentra tu banda perfecta', eventos: 8  },
  { id: 'estudio',     label: 'Estudio',     emoji: '📚', color: '#6C63FF', monoImg: monoEstudio,   desc: 'Grupos de estudio, tutorías y parches académicos ECI',     eventos: 23 },
  { id: 'aire-libre',  label: 'Aire Libre',  emoji: '🌿', color: '#7FE7C4', monoImg: monoAireLibre, desc: 'Senderismo, parques, deporte y naturaleza cerca del campus', eventos: 6  },
  { id: 'gastronomia', label: 'Gastronomía', emoji: '🍕', color: '#FFB347', monoImg: monoComida,    desc: 'Descubre sabores, recetas y los mejores spots de Bogotá',    eventos: 12 },
  { id: 'videojuegos', label: 'Videojuegos', emoji: '🎮', color: '#5BC8FF', monoImg: monoJuegos,    desc: 'Gaming competitivo, torneos y esports universitarios',         eventos: 15 },
  { id: 'arte',        label: 'Arte',        emoji: '🎨', color: '#A78BFA', monoImg: monoArte,      desc: 'Creación, diseño gráfico, fotografía y expresión libre',      eventos: 9  },
];

const PARCHES_GRID = [
  { id:1, name:'Cálculo III Survivors', members:23, desc:'El grupo de estudio más activo para Cálculo', color:'#6C63FF', emoji:'📐', bg:'linear-gradient(135deg,#6C63FF40,#6C63FF10)' },
  { id:2, name:'Machine Learning ECI',  members:31, desc:'Aprende ML con casos reales de la industria', color:'#7FE7C4', emoji:'🤖', bg:'linear-gradient(135deg,#7FE7C440,#7FE7C410)' },
  { id:3, name:'Fútbol Martes ECI',     members:18, desc:'Partidos amistosos cada martes a las 5pm',   color:'#FFB347', emoji:'⚽', bg:'linear-gradient(135deg,#FFB34740,#FFB34710)' },
  { id:4, name:'Club Fotografía',       members:17, desc:'Salidas fotográficas y workshops semanales',  color:'#FF6B9D', emoji:'📷', bg:'linear-gradient(135deg,#FF6B9D40,#FF6B9D10)' },
  { id:5, name:'IEEE Student Branch',   members:45, desc:'Eventos de robótica, IA y networking',        color:'#5BC8FF', emoji:'⚡', bg:'linear-gradient(135deg,#5BC8FF40,#5BC8FF10)' },
  { id:6, name:'Gaming Night 🎮',       members:11, desc:'Torneos de Valorant, LoL y más cada viernes',color:'#A78BFA', emoji:'🎮', bg:'linear-gradient(135deg,#A78BFA40,#A78BFA10)' },
];

const EVENTO_DESTACADO = {
  title: 'Hackathon ECI 2026',
  emoji: '💻',
  desc: '24 horas de innovación con premios de $5M COP. Temas: IA, sostenibilidad y smart cities. ¡Arma tu equipo!',
  date: 'Sáb 20 Jun', time: '8:00 AM', location: 'Auditorio Principal',
  color: '#6C63FF', participants: 156, capacity: 200,
};

const HERO_STATS = [
  { label: 'XP Total',  value: '2.3K+' },
  { label: 'Parches',   value: '7' },
  { label: 'Monas',     value: '4/12' },
];

const STORIES = [
  { avatar: 'CR', name: 'Camila',  gradient: 'linear-gradient(135deg,#6C63FF,#FF6B9D)', active: true  },
  { avatar: 'FA', name: 'Felipe',  gradient: 'linear-gradient(135deg,#7FE7C4,#6C63FF)', active: true  },
  { avatar: 'AT', name: 'Andrés',  gradient: 'linear-gradient(135deg,#A78BFA,#5BC8FF)', active: true  },
  { avatar: 'LG', name: 'Laura',   gradient: 'linear-gradient(135deg,#5BC8FF,#7FE7C4)', active: false },
  { avatar: 'SM', name: 'Sofía',   gradient: 'linear-gradient(135deg,#FFB347,#FF6B9D)', active: false },
  { avatar: 'DT', name: 'David',   gradient: 'linear-gradient(135deg,#FFB347,#5BC8FF)', active: false },
  { avatar: 'JP', name: 'Juan P.', gradient: 'linear-gradient(135deg,#FF6B9D,#6C63FF)', active: true  },
];

const FEED = [
  {
    user: 'Camila R.', avatar: 'CR', gradient: 'linear-gradient(135deg,#6C63FF,#FF6B9D)',
    action: 'se inscribió al', target: 'Hackathon ECI 2026', emoji: '💻',
    time: '5 min', likes: 12, liked: false, color: '#6C63FF',
  },
  {
    user: 'Andrés T.', avatar: 'AT', gradient: 'linear-gradient(135deg,#A78BFA,#5BC8FF)',
    action: 'se unió al parche', target: 'IEEE Student Branch', emoji: '⚡',
    time: '18 min', likes: 7, liked: false, color: '#5BC8FF',
  },
  {
    user: 'Sofía M.', avatar: 'SM', gradient: 'linear-gradient(135deg,#FFB347,#FF6B9D)',
    action: 'compartió', target: 'Taller Bienestar: Mindfulness 🧘', emoji: '🌿',
    time: '34 min', likes: 23, liked: false, color: '#7FE7C4',
  },
  {
    user: 'Felipe A.', avatar: 'FA', gradient: 'linear-gradient(135deg,#7FE7C4,#6C63FF)',
    action: 'alcanzó el', target: 'Nivel 12 en la ECI ⭐', emoji: '🏆',
    time: '1h', likes: 41, liked: false, color: '#FFB347',
  },
];


function VibraCard({ vibra, onNavigate, expanded, onToggle, supportsHover }: {
  vibra: typeof VIBRAS[0];
  onNavigate: (v: ViewId) => void;
  expanded: boolean;
  onToggle: () => void;
  supportsHover: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isOpen = supportsHover ? hovered : expanded;
  return (
    <motion.div
      onClick={supportsHover ? undefined : onToggle}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={isOpen ? { scale: 1.04 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="rounded-2xl border cursor-pointer relative"
      style={{
        background: isOpen ? `linear-gradient(135deg, ${vibra.color}22, ${vibra.color}08)` : 'var(--p-card)',
        borderColor: isOpen ? `${vibra.color}50` : 'var(--p-divider)',
        boxShadow: isOpen ? `0 12px 40px ${vibra.color}35` : 'none',
        minHeight: isOpen ? 220 : 130,
        zIndex: isOpen ? 20 : 1,
        transition: 'min-height 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease, z-index 0s',
        overflow: 'visible',
      }}>
      {/* Mono temático por vibra — más grande y visible */}
      <div className="absolute -right-2 -bottom-2 pointer-events-none select-none"
        style={{
          opacity: isOpen ? 1 : 0.32,
          transform: isOpen ? 'scale(1.1) translate(4px, 4px)' : 'scale(1)',
          transition: 'opacity 0.3s ease, transform 0.35s ease',
          width: 130, height: 130,
        }}>
        <ImageWithFallback
          src={vibra.monoImg}
          alt={`Mono ${vibra.label}`}
          style={{ width: '100%', height: '100%', objectFit: 'contain',
            filter: isOpen ? 'drop-shadow(0 6px 20px rgba(0,0,0,0.2))' : 'none' }}
        />
      </div>

      {/* clip-path keeps rounded corners while card overflow is visible */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ overflow: 'hidden', zIndex: -1,
        background: isOpen ? `linear-gradient(135deg, ${vibra.color}22, ${vibra.color}08)` : 'transparent' }} />
      <div className="p-5 h-full flex flex-col" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center gap-2 mb-2">
          {/* Solo el nombre, sin emoji */}
          <p style={{ fontWeight: 700, fontSize: '1.05rem', color: isOpen ? vibra.color : 'var(--p-text)' }}>{vibra.label}</p>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }} className="flex-1 flex flex-col justify-between">
              <p style={{ fontSize: '0.82rem', color: 'var(--p-sub)', lineHeight: 1.6, marginBottom: '12px' }}>
                {vibra.desc}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: `${vibra.color}18` }}>
                  <span style={{ fontSize: '0.72rem', color: vibra.color, fontWeight: 600 }}>
                    {vibra.eventos} eventos disponibles
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onNavigate('eventos'); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: '#7FE7C4', color: '#0F0E1A' }}>
                  Explorar <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <p style={{ fontSize: '0.75rem', color: 'var(--p-muted)' }}>{vibra.eventos} disponibles</p>
        )}
      </div>
    </motion.div>
  );
}

function ParcheCard({ p, onJoin }: { p: typeof PARCHES_GRID[0]; onJoin: () => void }) {
  return (
    <motion.div whileHover={{ scale: 1.04, y: -6, boxShadow: `0 16px 40px ${p.color}30` }}
      transition={{ type: 'spring', stiffness: 280 }}
      className="rounded-2xl border overflow-hidden cursor-pointer group"
      style={{ background: 'var(--p-card)', borderColor: `${p.color}25` }}>
      {/* Image top */}
      <div className="relative h-36 flex items-center justify-center overflow-hidden"
        style={{ background: p.bg }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, rgba(26,24,41,0.9) 100%)` }} />
        <span style={{ fontSize: '3.5rem', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{p.emoji}</span>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{ background: `linear-gradient(135deg, ${p.color}30, transparent)` }} />
      </div>

      <div className="p-4">
        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--p-text)', marginBottom: '4px' }}>{p.name}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--p-muted)', marginBottom: '2px' }}>
          {p.members} miembros activos
        </p>
        <p className="line-clamp-1" style={{ fontSize: '0.75rem', color: 'var(--p-muted)', marginBottom: '12px' }}>{p.desc}</p>
        <button onClick={onJoin}
          className="w-full py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: '#7FE7C4', color: '#0F0E1A' }}>
          Unirse al parche
        </button>
      </div>
    </motion.div>
  );
}

function FeedSection() {
  const t = useTheme();

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <p style={{ fontSize: '0.75rem', color: '#FF6B9D', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            En vivo
          </p>
          <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: t.text }}>
            Lo que pasa ahora 🔥
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(255,77,106,0.1)' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF4D6A' }} />
          <span style={{ fontSize: '0.7rem', color: '#FF4D6A', fontWeight: 600 }}>Campus</span>
        </div>
      </div>
      <div className="space-y-3">
        {FEED.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="flex items-center gap-3 p-4 rounded-2xl border"
            style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{ background: item.gradient }}>
              {item.avatar}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '0.85rem', color: t.text, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>{item.user}</span>
                <span style={{ color: t.textMuted }}> {item.action} </span>
                <span style={{ fontWeight: 600, color: item.color }}>{item.target}</span>
              </p>
              <p style={{ fontSize: '0.68rem', color: t.textMuted, marginTop: '2px' }}>Hace {item.time}</p>
            </div>
            {/* Emoji badge */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: `${item.color}15` }}>
              {item.emoji}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const t = useTheme();
  const greeting = getGreeting();
  const { userName, userEmail } = useAuth();
  const firstName = (userName ?? userEmail ?? 'Explorador').split(' ')[0];
  const initials  = (userName ?? userEmail ?? '?')
    .split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
  const [joinedParches, setJoinedParches] = useState<number[]>([]);
  const [expandedVibra, setExpandedVibra] = useState<string | null>(null);
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setSupportsHover(mediaQuery.matches);
    update();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', update);
      return () => mediaQuery.removeEventListener('change', update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="max-w-5xl mx-auto pb-12 space-y-10 px-0">

        {/* ── 1. DASHBOARD HEADER ──────────────────────────────────────── */}
        <section className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Welcome card */}
          <div className="flex-1 rounded-2xl p-6 border relative overflow-hidden"
            style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5 pointer-events-none"
              style={{ background: '#6C63FF', transform: 'translate(25%,-25%)', filter: 'blur(40px)' }} />
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #7FE7C4)', borderColor: 'rgba(108,99,255,0.4)', fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full"
                  style={{ background: '#6C63FF', color: 'white', fontSize: '0.58rem', fontWeight: 700 }}>12</div>
              </div>
              <div>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: t.text, lineHeight: 1.2 }}>
                  {greeting.emoji} {greeting.text}, {firstName}
                </p>
                <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '4px' }}>
                  {userEmail ?? 'ECI'}
                </p>
              </div>
            </div>
            {/* Quick stats */}
            <div className="flex gap-3 mt-5">
              {HERO_STATS.map(s => (
                <div key={s.label} className="flex-1 px-3 py-2.5 rounded-xl border text-center"
                  style={{ background: 'rgba(108,99,255,0.08)', borderColor: 'rgba(108,99,255,0.2)' }}>
                  <p style={{ fontWeight: 800, fontSize: '1rem', color: '#6C63FF' }}>{s.value}</p>
                  <p style={{ fontSize: '0.65rem', color: t.textMuted }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => onNavigate('perfil')}
                className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                style={{ borderColor: '#6C63FF', color: '#6C63FF', background: 'transparent' }}>
                Ver perfil
              </button>
              <button onClick={() => onNavigate('parches')}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#7FE7C4', color: '#0F0E1A' }}>
                Ir a Parches →
              </button>
            </div>
          </div>

        </section>

        {/* ── 2. FEED ──────────────────────────────────────────────────── */}
        <FeedSection />

        {/* ── 4. EXPLORA VIBRAS ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6C63FF', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                Vibras
              </p>
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: t.text }}>
                Explora Tu Vibra
              </h2>
            </div>
          </div>
          {/* overflow:visible so expanded corner cards aren't clipped */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ overflow: 'visible' }}>
            {VIBRAS.map(v => (
              <VibraCard
                key={v.id}
                vibra={v}
                onNavigate={onNavigate}
                supportsHover={supportsHover}
                expanded={supportsHover ? false : expandedVibra === v.id}
                onToggle={() => setExpandedVibra(prev => prev === v.id ? null : v.id)}
              />
            ))}
          </div>
        </section>


      </div>
    </div>
  );
}
