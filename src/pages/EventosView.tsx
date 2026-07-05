import { useState } from 'react';
import { MapPin, Calendar, Clock, Users, Plus, Lock, Globe, Bookmark, Filter, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { addToast } from '../components/ToastSystem';

const EVENTOS = [
  {
    id: 1,
    title: 'Hackathon ECI 2026',
    description: 'El hackathon más grande de la Escuela. 24 horas de innovación con premios de hasta $5M COP. Temas: IA, sostenibilidad, smart cities.',
    date: '2026-06-20', time: '8:00 AM', location: 'Auditorio Alberto Montañés Peña', address: 'Edificio A (A-105)',
    lat: 4.782705154072511, lng: -74.04267259189925,
    capacity: 200, enrolled: 156, type: 'public', category: 'Académico',
    organizer: 'IEEE Student Branch', color: '#6C63FF', emoji: '💻',
    saved: false, enrolled_me: false,
    tags: ['IA', 'Innovación', 'Premios'],
  },
  {
    id: 2,
    title: 'Noche de Juegos ECI',
    description: 'Torneo de videojuegos entre programas. PS5, Switch, y PC Gaming disponibles. Habrá snacks y sorpresas.',
    date: '2026-06-14', time: '6:00 PM', location: 'Sala de Bienestar', address: 'Edificio C, Piso 2',
    lat: 4.782407546936256, lng: -74.04236350245391,
    capacity: 50, enrolled: 48, type: 'public', category: 'Social',
    organizer: 'Bienestar ECI', color: '#FF6B9D', emoji: '🎮',
    saved: true, enrolled_me: true,
    tags: ['Gaming', 'Competencia', 'Social'],
  },
  {
    id: 3,
    title: 'Defensa Proyecto Grado - Sistemas',
    description: 'Evento privado de defensa de proyectos de grado. Solo para invitados del programa de Ingeniería de Sistemas.',
    date: '2026-06-18', time: '2:00 PM', location: 'Sala de Juntas', address: 'Edificio F. Umaña de Brigard, Piso 3',
    lat: 4.783564251042439, lng: -74.04316295491611,
    capacity: 30, enrolled: 22, type: 'private', category: 'Académico',
    organizer: 'Depto. Sistemas', color: '#7FE7C4', emoji: '🎓',
    saved: false, enrolled_me: false,
    tags: ['Grado', 'Sistemas', 'Invitados'],
  },
  {
    id: 4,
    title: 'Taller Bienestar: Mindfulness',
    description: 'Taller de meditación y manejo del estrés académico con el equipo de bienestar universitario.',
    date: '2026-06-16', time: '12:00 PM', location: 'Jardín Central', address: 'Campus ECI',
    lat: 4.783134761857515, lng: -74.04348439747417,
    capacity: 40, enrolled: 17, type: 'public', category: 'Bienestar',
    organizer: 'Bienestar ECI', color: '#FFB347', emoji: '🧘',
    saved: false, enrolled_me: false,
    tags: ['Mindfulness', 'Bienestar', 'Estrés'],
  },
  {
    id: 5,
    title: 'Charla: Oportunidades Laborales Tech 2026',
    description: 'Líderes de empresas como Google, Rappi y Bancolombia comparten oportunidades para recién egresados.',
    date: '2026-06-25', time: '5:00 PM', location: 'Aula Máxima', address: 'Edificio B',
    lat: 4.782243528483891, lng: -74.0426821888458,
    capacity: 300, enrolled: 201, type: 'public', category: 'Académico',
    organizer: 'Carrera ECI', color: '#5BC8FF', emoji: '💼',
    saved: true, enrolled_me: false,
    tags: ['Empleo', 'Tech', 'Networking'],
  },
];

const CATEGORIES = ['Todos', 'Académico', 'Social', 'Bienestar', 'Deportivo', 'Cultural'];

const categoryColor: Record<string, string> = {
  Académico: '#6C63FF',
  Social: '#FF6B9D',
  Bienestar: '#7FE7C4',
  Deportivo: '#FFB347',
  Cultural: '#5BC8FF',
};

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string ?? '';
const ECI_CENTER = { lat: 4.7830, lng: -74.0441 };

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
];

function pinSvg(color: string) {
  const c = color.replace('#', '%23');
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='38' viewBox='0 0 30 38'><path d='M15 2C7.8 2 2 7.8 2 15c0 9.5 13 20 13 20s13-10.5 13-20C28 7.8 22.2 2 15 2z' fill='rgba(13,11,30,0.55)' transform='translate(1,1)'/><path fill='${c}' stroke='%230D0B1E' stroke-width='2.5' d='M15 1C7.8 1 2 6.8 2 14c0 9 13 21 13 21s13-12 13-21C28 6.8 22.2 1 15 1z'/><path stroke='white' stroke-width='1.5' fill='none' d='M15 1C7.8 1 2 6.8 2 14c0 9 13 21 13 21s13-12 13-21C28 6.8 22.2 1 15 1z'/><circle cx='15' cy='14' r='6' fill='white'/></svg>`;
}

function pinSvgSelected(color: string) {
  const c = color.replace('#', '%23');
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='38' height='48' viewBox='0 0 30 38'><path fill='${c}' stroke='%230D0B1E' stroke-width='3' d='M15 1C7.8 1 2 6.8 2 14c0 9 13 21 13 21s13-12 13-21C28 6.8 22.2 1 15 1z'/><path stroke='white' stroke-width='2' fill='none' d='M15 1C7.8 1 2 6.8 2 14c0 9 13 21 13 21s13-12 13-21C28 6.8 22.2 1 15 1z'/><circle cx='15' cy='14' r='6.5' fill='white'/></svg>`;
}

type EventCoord = { id: number; lat: number; lng: number; color: string; title: string; location: string; address: string; emoji: string };

function CampusMap({
  events, height = 200, selectedId = null, onSelect, pickMode = false, pickedPos, onPick,
}: {
  events: EventCoord[];
  height?: number;
  selectedId?: number | null;
  onSelect?: (id: number | null) => void;
  pickMode?: boolean;
  pickedPos?: { lat: number; lng: number } | null;
  onPick?: (pos: { lat: number; lng: number }) => void;
}) {
  const { darkMode } = useTheme();
  const { isLoaded } = useJsApiLoader({ id: 'patricia-gmaps', googleMapsApiKey: GOOGLE_MAPS_KEY });
  const selectedEvent = selectedId != null ? events.find(e => e.id === selectedId) ?? null : null;

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ height }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(108,99,255,0.1)' }}>
          <MapPin size={24} style={{ color: '#6C63FF' }} />
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--p-text)', marginBottom: 4 }}>Mapa del Campus ECI</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--p-muted)', lineHeight: 1.6 }}>
            Agrega <code style={{ background: 'rgba(108,99,255,0.12)', padding: '1px 5px', borderRadius: 4, fontSize: '0.7rem' }}>VITE_GOOGLE_MAPS_API_KEY</code> a <code style={{ background: 'rgba(108,99,255,0.12)', padding: '1px 5px', borderRadius: 4, fontSize: '0.7rem' }}>.env.local</code> para activar el mapa
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-1">
          {events.map(ev => (
            <button
              key={ev.id}
              onClick={() => onSelect?.(ev.id === selectedId ? null : ev.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all hover:opacity-80"
              style={{
                background: selectedId === ev.id ? ev.color : `${ev.color}15`,
                color: selectedId === ev.id ? 'white' : ev.color,
                border: `1px solid ${ev.color}30`,
              }}>
              {ev.emoji} {ev.location}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center gap-2" style={{ height }}>
        <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#6C63FF', borderTopColor: 'transparent' }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--p-muted)' }}>Cargando mapa…</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height }}
      center={selectedEvent ? { lat: selectedEvent.lat, lng: selectedEvent.lng } : ECI_CENTER}
      zoom={selectedEvent ? 19 : 18}
      options={{ disableDefaultUI: true, zoomControl: true, styles: darkMode ? DARK_MAP_STYLES : [], clickableIcons: false } as any}
      onClick={pickMode && onPick ? (e: any) => { if (e.latLng) onPick({ lat: e.latLng.lat(), lng: e.latLng.lng() }); } : undefined}
    >
      {events.map(ev => (
        <Marker
          key={ev.id}
          position={{ lat: ev.lat, lng: ev.lng }}
          icon={selectedId === ev.id ? pinSvgSelected('#FF2D2D') : pinSvg('#FF2D2D')}
          zIndex={selectedId === ev.id ? 10 : 1}
          onClick={() => onSelect?.(ev.id === selectedId ? null : ev.id)}
        />
      ))}
      {pickMode && pickedPos && <Marker position={pickedPos} />}
    </GoogleMap>
  );
}

function EventSummaryCard({ event, onMore, onEnroll, onClose }: {
  event: typeof EVENTOS[0];
  onMore: () => void;
  onEnroll: (id: number) => void;
  onClose: () => void;
}) {
  const pct = Math.round((event.enrolled / event.capacity) * 100);
  const full = pct >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border"
      style={{ background: 'var(--p-card)', borderColor: `${event.color}35`, overflow: 'hidden' }}
    >
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${event.color}, ${event.color}40)` }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${event.color}18` }}>
              {event.emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--p-text)' }}>{event.title}</p>
                {event.type === 'private'
                  ? <Lock size={11} style={{ color: 'var(--p-muted)' }} />
                  : <Globe size={11} style={{ color: '#7FE7C4' }} />}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: `${categoryColor[event.category] || '#6C63FF'}20`, color: categoryColor[event.category] || '#6C63FF' }}>
                  {event.category}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--p-muted)' }}>por {event.organizer}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="hover:opacity-60 transition-all ml-2 flex-shrink-0">
            <X size={16} style={{ color: 'var(--p-muted)' }} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} style={{ color: event.color }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--p-sub)' }}>
              {new Date(event.date).toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.time}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={12} style={{ color: event.color }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--p-sub)' }}>{event.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={12} style={{ color: full ? '#FF4D6A' : event.color }} />
            <span style={{ fontSize: '0.78rem', color: full ? '#FF4D6A' : 'var(--p-sub)' }}>
              {full ? 'Sin cupos' : `${event.capacity - event.enrolled} cupos disponibles`}
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 mb-4 flex-wrap">
          {event.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full"
              style={{ background: `${event.color}12`, color: event.color, fontSize: '0.7rem', border: `1px solid ${event.color}25` }}>
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onMore}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
            style={{ borderColor: `${event.color}40`, color: event.color, background: `${event.color}08` }}>
            Ver más <ChevronRight size={14} />
          </button>
          <button
            onClick={() => onEnroll(event.id)}
            disabled={full && !event.enrolled_me}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: event.enrolled_me
                ? 'rgba(127,231,196,0.15)'
                : full ? 'rgba(255,77,106,0.1)' : `linear-gradient(135deg, ${event.color}, ${event.color}CC)`,
              color: event.enrolled_me ? '#7FE7C4' : full ? '#FF4D6A' : 'white',
              border: event.enrolled_me ? '1px solid rgba(127,231,196,0.3)' : 'none',
            }}>
            {event.enrolled_me ? '✓ Inscrito — Cancelar' : full ? 'Sin cupos' : '+ Inscribirse'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EventDetailModal({ event, onClose, onEnroll, onSave }: {
  event: typeof EVENTOS[0];
  onClose: () => void;
  onEnroll: (id: number) => void;
  onSave: (id: number) => void;
}) {
  const t = useTheme();
  const pct = Math.round((event.enrolled / event.capacity) * 100);
  const full = pct >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="rounded-2xl border overflow-hidden w-full max-w-lg"
        style={{ background: t.cardBg, borderColor: `${event.color}35`, maxHeight: '88vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${event.color}, ${event.color}60)` }} />

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${event.color}18` }}>
                {event.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: t.text }}>{event.title}</span>
                  {event.type === 'private'
                    ? <Lock size={13} style={{ color: t.textMuted }} />
                    : <Globe size={13} style={{ color: '#7FE7C4' }} />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs"
                    style={{ background: `${categoryColor[event.category] || '#6C63FF'}20`, color: categoryColor[event.category] || '#6C63FF' }}>
                    {event.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: t.textMuted }}>por {event.organizer}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => onSave(event.id)} className="hover:scale-110 transition-all">
                <Bookmark size={18} fill={event.saved ? '#7FE7C4' : 'none'}
                  style={{ color: event.saved ? '#7FE7C4' : t.textMuted }} />
              </button>
              <button onClick={onClose} className="hover:opacity-60 transition-all">
                <X size={18} style={{ color: t.textMuted }} />
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.87rem', color: t.textSub, lineHeight: 1.65, marginBottom: '20px' }}>
            {event.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: t.inputBg }}>
              <Calendar size={15} style={{ color: event.color }} />
              <div>
                <p style={{ fontSize: '0.65rem', color: t.textMuted, marginBottom: '1px' }}>Fecha</p>
                <p style={{ fontSize: '0.82rem', color: t.text, fontWeight: 600 }}>
                  {new Date(event.date).toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: t.inputBg }}>
              <Clock size={15} style={{ color: event.color }} />
              <div>
                <p style={{ fontSize: '0.65rem', color: t.textMuted, marginBottom: '1px' }}>Hora</p>
                <p style={{ fontSize: '0.82rem', color: t.text, fontWeight: 600 }}>{event.time}</p>
              </div>
            </div>
            <div className="col-span-2 flex items-start gap-2.5 p-3 rounded-xl" style={{ background: t.inputBg }}>
              <MapPin size={15} style={{ color: event.color, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: '0.65rem', color: t.textMuted, marginBottom: '1px' }}>Ubicación</p>
                <p style={{ fontSize: '0.82rem', color: t.text, fontWeight: 600 }}>{event.location}</p>
                <p style={{ fontSize: '0.72rem', color: t.textMuted }}>{event.address}</p>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: event.color }} />
                <span style={{ fontSize: '0.82rem', color: t.text, fontWeight: 600 }}>Cupos</span>
              </div>
              <span style={{ fontSize: '0.82rem', color: full ? '#FF4D6A' : event.color, fontWeight: 700 }}>
                {full ? 'Lleno' : `${event.capacity - event.enrolled} disponibles`}
              </span>
            </div>
            <div className="flex justify-between mb-1.5">
              <span style={{ fontSize: '0.7rem', color: t.textMuted }}>{event.enrolled} inscritos</span>
              <span style={{ fontSize: '0.7rem', color: t.textMuted }}>{event.capacity} total</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: t.inputBg }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, background: full ? '#FF4D6A' : `linear-gradient(90deg, ${event.color}, ${event.color}80)` }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {event.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full"
                style={{ background: `${event.color}12`, color: event.color, fontSize: '0.78rem', border: `1px solid ${event.color}25` }}>
                #{tag}
              </span>
            ))}
          </div>

          <button
            onClick={() => onEnroll(event.id)}
            disabled={full && !event.enrolled_me}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: event.enrolled_me
                ? 'rgba(127,231,196,0.15)'
                : full ? 'rgba(255,77,106,0.1)' : `linear-gradient(135deg, ${event.color}, ${event.color}CC)`,
              color: event.enrolled_me ? '#7FE7C4' : full ? '#FF4D6A' : 'white',
              border: event.enrolled_me ? '1px solid rgba(127,231,196,0.3)' : 'none',
            }}>
            {event.enrolled_me ? '✓ Inscrito — Cancelar inscripción' : full ? 'Sin cupos disponibles' : '+ Inscribirse al evento'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const MY_PARCHES = [
  { id: 1, name: 'Cálculo III Survivors', emoji: '📐', color: '#6C63FF' },
  { id: 2, name: 'Proyecto IA — Grupo 4', emoji: '🤖', color: '#7FE7C4' },
  { id: 3, name: 'Fútbol Martes ECI',     emoji: '⚽', color: '#FFB347' },
  { id: 4, name: 'Gaming Night 🎮',       emoji: '🎮', color: '#FF6B9D' },
  { id: 5, name: 'Tesis & Proyectos',     emoji: '🎓', color: '#5BC8FF' },
  { id: 6, name: 'Club Fotografía',       emoji: '📷', color: '#A78BFA' },
];

export function EventosView({ onLinkEvent }: {
  onLinkEvent?: (parcheId: number, ev: { eventTitle: string; eventEmoji: string; eventDate: string }) => void;
}) {
  const t = useTheme();
  const [category, setCategory] = useState('Todos');
  const [eventos, setEventos] = useState(EVENTOS);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [detailEventId, setDetailEventId] = useState<number | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [linkedParcheIds, setLinkedParcheIds] = useState<number[]>([]);
  const [createTitle, setCreateTitle] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [createEventError, setCreateEventError] = useState<string | null>(null);
  const toggleEnroll = (id: number) => {
    const ev = eventos.find(e => e.id === id);
    if (!ev) return;
    const isFull = ev.enrolled >= ev.capacity && !ev.enrolled_me;
    if (isFull) {
      addToast({ type: 'reporte', title: 'Sin cupos', message: 'Este evento ya no tiene cupos disponibles.' });
      return;
    }
    setEventos(prev => prev.map(e => e.id === id ? { ...e, enrolled_me: !e.enrolled_me, enrolled: e.enrolled_me ? e.enrolled - 1 : e.enrolled + 1 } : e));
    if (!ev.enrolled_me) {
      addToast({ type: 'evento', title: '¡Inscripción confirmada!', message: `Te inscribiste a "${ev.title}"` });
    } else {
      addToast({ type: 'info', title: 'Inscripción cancelada', message: `Saliste de "${ev.title}"` });
    }
  };

  const toggleSave = (id: number) => {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, saved: !e.saved } : e));
  };

  const filtered = category === 'Todos' ? eventos : eventos.filter(e => e.category === category);
  const selectedEvent = selectedEventId != null ? filtered.find(e => e.id === selectedEventId) ?? null : null;
  const detailEvent = detailEventId != null ? eventos.find(e => e.id === detailEventId) ?? null : null;

  return (
    <div className="h-full overflow-y-auto pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--p-text)' }}>Eventos ECI</h2>
          <p style={{ fontSize: '0.85rem', color: t.textMuted }}>Descubre y únete a lo que pasa en tu campus</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{ background: '#6C63FF', color: 'white' }}>
          <Plus size={16} /> Crear evento
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={15} style={{ color: 'var(--p-muted)', flexShrink: 0 }} />
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setSelectedEventId(null); }}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm transition-all"
              style={{
                background: category === cat ? '#6C63FF' : 'var(--p-hover)',
                color: category === cat ? 'white' : t.textMuted,
                border: category === cat ? 'none' : '1px solid rgba(108,99,255,0.2)',
              }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map - main content */}
      <div className="rounded-2xl overflow-hidden border mb-4"
        style={{ borderColor: 'rgba(108,99,255,0.2)', boxShadow: '0 4px 24px rgba(108,99,255,0.08)' }}>
        <CampusMap
          events={filtered}
          height={480}
          selectedId={selectedEventId}
          onSelect={(id) => { setSelectedEventId(id); setDetailEventId(null); }}
        />
      </div>

      {/* Hint / summary card */}
      <AnimatePresence mode="wait">
        {!selectedEvent && (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3"
            style={{ color: 'var(--p-muted)', fontSize: '0.82rem' }}>
            <MapPin size={13} />
            <span>{filtered.length} evento{filtered.length !== 1 ? 's' : ''} en el mapa · toca un pin para ver el detalle</span>
          </motion.div>
        )}

        {selectedEvent && (
          <EventSummaryCard
            key={`summary-${selectedEvent.id}`}
            event={selectedEvent}
            onMore={() => setDetailEventId(selectedEvent.id)}
            onEnroll={toggleEnroll}
            onClose={() => setSelectedEventId(null)}
          />
        )}
      </AnimatePresence>

      {/* Event detail modal */}
      <AnimatePresence>
        {detailEvent && (
          <EventDetailModal
            event={detailEvent}
            onClose={() => setDetailEventId(null)}
            onEnroll={toggleEnroll}
            onSave={toggleSave}
          />
        )}
      </AnimatePresence>

      {/* Create event modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowCreate(false)}>
          <div className="rounded-2xl p-6 w-[480px] border max-h-[80vh] overflow-y-auto"
            style={{ background: t.cardBg, borderColor: 'rgba(108,99,255,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px', color: t.text }}>Crear Evento</h3>
            <div className="space-y-4">
              <input value={createTitle} onChange={e => { setCreateTitle(e.target.value); setCreateEventError(null); }} placeholder="Título del evento..." className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: t.inputBg, border: `1px solid ${createEventError && !createTitle.trim() ? '#FF4D6A' : 'rgba(108,99,255,0.2)'}`, color: t.text }} />
              <textarea placeholder="Descripción..." rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={createDate} onChange={e => { setCreateDate(e.target.value); setCreateEventError(null); }} className="rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: t.inputBg, border: `1px solid ${createEventError && !createDate ? '#FF4D6A' : 'rgba(108,99,255,0.2)'}`, color: t.text }} />
                <input type="time" className="rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
              </div>
              <input placeholder="Nombre del lugar (ej: Auditorio Principal)..." className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>
                  📍 Toca el mapa para ubicar el evento
                </p>
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(108,99,255,0.2)' }}>
                  <CampusMap
                    events={pickedLocation ? [{ id: 0, lat: pickedLocation.lat, lng: pickedLocation.lng, color: '#6C63FF', title: 'Nuevo evento', location: '', address: '', emoji: '📍' }] : []}
                    height={180}
                    pickMode
                    pickedPos={pickedLocation}
                    onPick={setPickedLocation}
                  />
                </div>
                {pickedLocation && (
                  <p style={{ fontSize: '0.7rem', color: '#6C63FF', marginTop: 4 }}>
                    ✓ Ubicación seleccionada
                    <button onClick={() => setPickedLocation(null)} className="ml-2 hover:opacity-70" style={{ color: '#FF6B9D' }}>✕ Quitar</button>
                  </p>
                )}
              </div>
              <input type="number" placeholder="Cupos máximos..." className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
              <div className="flex gap-3">
                <button className="flex-1 py-2 rounded-xl text-sm font-medium border"
                  style={{ background: 'var(--p-divider)', borderColor: '#6C63FF', color: '#6C63FF' }}>
                  🌍 Público
                </button>
                <button className="flex-1 py-2 rounded-xl text-sm font-medium border"
                  style={{ background: 'transparent', borderColor: 'var(--p-border)', color: 'var(--p-muted)' }}>
                  🔒 Privado
                </button>
              </div>

              {/* Vincular con parche */}
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 8, fontWeight: 600 }}>
                  🔗 Vincular evento con:
                </p>
                <div className="flex flex-wrap gap-2">
                  {MY_PARCHES.map(p => (
                    <button key={p.id}
                      onClick={() => setLinkedParcheIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: linkedParcheIds.includes(p.id) ? `${p.color}22` : 'var(--p-input)',
                        border: `1px solid ${linkedParcheIds.includes(p.id) ? p.color : 'rgba(108,99,255,0.2)'}`,
                        color: linkedParcheIds.includes(p.id) ? p.color : 'var(--p-muted)',
                      }}>
                      {p.emoji} {p.name}
                      {linkedParcheIds.includes(p.id) && <span style={{ marginLeft: 2 }}>✓</span>}
                    </button>
                  ))}
                </div>
                {linkedParcheIds.length > 0 && (
                  <p style={{ fontSize: '0.7rem', color: '#6C63FF', marginTop: 6 }}>
                    {linkedParcheIds.length} parche{linkedParcheIds.length > 1 ? 's' : ''} seleccionado{linkedParcheIds.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowCreate(false); setLinkedParcheIds([]); setCreateTitle(''); setCreateDate(''); setCreateEventError(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--p-muted)' }}>Cancelar</button>
                <button onClick={() => {
                    if (!createTitle.trim()) { setCreateEventError('El título del evento es obligatorio.'); return; }
                    if (!createDate) { setCreateEventError('La fecha del evento es obligatoria.'); return; }
                    if (onLinkEvent && linkedParcheIds.length > 0) {
                      const ev = { eventTitle: createTitle.trim(), eventEmoji: '📅', eventDate: createDate };
                      linkedParcheIds.forEach(parcheId => onLinkEvent(parcheId, ev));
                    }
                    addToast({ type: 'evento', title: '¡Evento publicado!', message: `"${createTitle.trim()}" ya está visible.` });
                    setShowCreate(false);
                    setLinkedParcheIds([]);
                    setCreateTitle('');
                    setCreateDate('');
                    setCreateEventError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: '#6C63FF', color: 'white' }}>Publicar Evento</button>
              </div>
              <AnimatePresence>
                {createEventError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl mt-1"
                    style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)' }}>
                    <span style={{ fontSize: '0.85rem' }}>⚠️</span>
                    <p style={{ fontSize: '0.78rem', color: '#FF4D6A' }}>{createEventError}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
