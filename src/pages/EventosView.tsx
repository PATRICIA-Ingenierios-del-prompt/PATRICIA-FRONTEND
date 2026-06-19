import { useState } from 'react';
import { MapPin, Calendar, Clock, Users, Plus, Lock, Globe, Bookmark, Filter, ChevronRight, Star, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

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

// ── Google Maps helpers ────────────────────────────────────────
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
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36' viewBox='0 0 28 36'><path fill='${c}' stroke='white' stroke-width='2' d='M14 1C7.4 1 2 6.4 2 14c0 9 12 21 12 21S26 23 26 14C26 6.4 20.6 1 14 1z'/><circle cx='14' cy='14' r='5.5' fill='white' opacity='0.85'/></svg>`;
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
            <div key={ev.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ background: `${ev.color}15`, color: ev.color, border: `1px solid ${ev.color}30` }}>
              {ev.emoji} {ev.location}
            </div>
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
        <Marker key={ev.id} position={{ lat: ev.lat, lng: ev.lng }} icon={pinSvg(ev.color)} onClick={() => onSelect?.(ev.id)} />
      ))}
      {selectedEvent && (
        <InfoWindow
          position={{ lat: selectedEvent.lat, lng: selectedEvent.lng }}
          onCloseClick={() => onSelect?.(null)}
          options={{ pixelOffset: new (window as any).google.maps.Size(0, -32) } as any}
        >
          <div style={{ fontFamily: 'Inter,sans-serif', padding: '2px 4px', maxWidth: 190 }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{selectedEvent.emoji} {selectedEvent.title}</p>
            <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: 1 }}>{selectedEvent.location}</p>
            <p style={{ fontSize: '0.7rem', color: '#888' }}>{selectedEvent.address}</p>
          </div>
        </InfoWindow>
      )}
      {pickMode && pickedPos && (
        <Marker position={pickedPos} />
      )}
    </GoogleMap>
  );
}

function EventCard({ event, onEnroll, onSave, onViewMap }: { event: typeof EVENTOS[0], onEnroll: (id: number) => void, onSave: (id: number) => void, onViewMap: (id: number) => void }) {
  const pct = Math.round((event.enrolled / event.capacity) * 100);
  const full = pct >= 100;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--p-card)', borderColor: `${event.color}25` }}
    >
      {/* Top accent */}
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${event.color}, ${event.color}60)` }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${event.color}18` }}>
              {event.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--p-text)' }}>{event.title}</span>
                {event.type === 'private'
                  ? <Lock size={12} style={{ color: 'var(--p-muted)' }} />
                  : <Globe size={12} style={{ color: '#7FE7C4' }} />}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: `${categoryColor[event.category] || '#6C63FF'}20`, color: categoryColor[event.category] || '#6C63FF' }}>
                  {event.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--p-muted)' }}>por {event.organizer}</span>
              </div>
            </div>
          </div>
          <button onClick={() => onSave(event.id)} className="transition-all hover:scale-110">
            <Bookmark size={18} fill={event.saved ? '#7FE7C4' : 'none'} style={{ color: event.saved ? '#7FE7C4' : 'var(--p-muted)' }} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--p-sub)', lineHeight: 1.6 }} className="mb-4">{event.description}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={13} style={{ color: event.color }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--p-sub)' }}>
              {new Date(event.date).toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={13} style={{ color: event.color }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--p-sub)' }}>{event.time}</span>
          </div>
          <button onClick={() => onViewMap(event.id)} className="flex items-center gap-2 hover:opacity-70 transition-all text-left">
            <MapPin size={13} style={{ color: event.color }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--p-sub)', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{event.location}</span>
          </button>
          <div className="flex items-center gap-2">
            <Users size={13} style={{ color: event.color }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--p-sub)' }}>{event.enrolled}/{event.capacity}</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span style={{ fontSize: '0.7rem', color: 'var(--p-muted)' }}>Cupos</span>
            <span style={{ fontSize: '0.7rem', color: full ? '#FF4D6A' : event.color, fontWeight: 600 }}>
              {full ? 'Lleno' : `${event.capacity - event.enrolled} disponibles`}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--p-divider)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(pct, 100)}%`, background: full ? '#FF4D6A' : `linear-gradient(90deg, ${event.color}, ${event.color}90)` }} />
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {event.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--p-muted)', fontSize: '0.7rem' }}>
              #{tag}
            </span>
          ))}
        </div>

        <button
          onClick={() => onEnroll(event.id)}
          disabled={full && !event.enrolled_me}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: event.enrolled_me
              ? 'rgba(127,231,196,0.15)'
              : full ? 'rgba(255,77,106,0.1)' : `linear-gradient(135deg, ${event.color}, ${event.color}CC)`,
            color: event.enrolled_me ? '#7FE7C4' : full ? '#FF4D6A' : 'white',
            border: event.enrolled_me ? '1px solid rgba(127,231,196,0.3)' : 'none',
          }}
        >
          {event.enrolled_me ? '✓ Inscrito — Cancelar' : full ? 'Sin cupos disponibles' : '+ Inscribirse'}
        </button>
      </div>
    </motion.div>
  );
}

export function EventosView() {
  const t = useTheme();
  const [category, setCategory] = useState('Todos');
  const [eventos, setEventos] = useState(EVENTOS);
  const [showCreate, setShowCreate] = useState(false);
  const [mapSelectedId, setMapSelectedId] = useState<number | null>(null);
  const [viewMapEvent, setViewMapEvent] = useState<number | null>(null);
  const [showCampusMap, setShowCampusMap] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const toggleEnroll = (id: number) => {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, enrolled_me: !e.enrolled_me, enrolled: e.enrolled_me ? e.enrolled - 1 : e.enrolled + 1 } : e));
  };

  const toggleSave = (id: number) => {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, saved: !e.saved } : e));
  };

  const filtered = category === 'Todos' ? eventos : eventos.filter(e => e.category === category);

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--p-text)' }}>Eventos ECI</h2>
          <p style={{ fontSize: '0.85rem', color: t.textMuted }}>Descubre y únete a lo que pasa en tu campus</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{ background: '#6C63FF', color: 'white' }}>
          <Plus size={16} />
          Crear evento
        </button>
      </div>

      {/* Ver mapa button */}
      <button onClick={() => setShowCampusMap(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 mb-6 w-full justify-center border"
        style={{ background: 'rgba(108,99,255,0.08)', borderColor: 'rgba(108,99,255,0.25)', color: '#6C63FF' }}>
        <MapPin size={15} />
        Ver mapa del campus · eventos cercanos a ti
      </button>

      {/* Campus map modal */}
      {showCampusMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => { setShowCampusMap(false); setMapSelectedId(null); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border overflow-hidden"
            style={{ background: t.cardBg, borderColor: 'rgba(108,99,255,0.3)', width: '96%', maxWidth: 750 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
              <div className="flex items-center gap-2">
                <MapPin size={15} style={{ color: '#6C63FF' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--p-text)' }}>Mapa del Campus ECI</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--p-muted)' }}>· toca un pin para ver el evento</span>
              </div>
              <button onClick={() => { setShowCampusMap(false); setMapSelectedId(null); }} className="hover:opacity-60 transition-all">
                <X size={18} style={{ color: 'var(--p-muted)' }} />
              </button>
            </div>
            <CampusMap events={eventos} height={520} selectedId={mapSelectedId} onSelect={setMapSelectedId} />
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <Filter size={15} style={{ color: 'var(--p-muted)' }} />
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
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

      {/* Events grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map(evento => (
          <EventCard key={evento.id} event={evento} onEnroll={toggleEnroll} onSave={toggleSave} onViewMap={setViewMapEvent} />
        ))}
      </div>

      {/* Event location modal */}
      {viewMapEvent !== null && (() => {
        const ev = eventos.find(e => e.id === viewMapEvent);
        if (!ev) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setViewMapEvent(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="rounded-2xl border overflow-hidden"
              style={{ background: t.cardBg, borderColor: `${ev.color}40`, width: '92%', maxWidth: 520 }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.1rem' }}>{ev.emoji}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--p-text)' }}>{ev.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--p-muted)' }}>{ev.location} · {ev.address}</p>
                  </div>
                </div>
                <button onClick={() => setViewMapEvent(null)} className="hover:opacity-60 transition-all">
                  <X size={18} style={{ color: 'var(--p-muted)' }} />
                </button>
              </div>
              <CampusMap events={[ev]} height={380} selectedId={ev.id} onSelect={() => {}} />
            </motion.div>
          </div>
        );
      })()}

      {/* Create event modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowCreate(false)}>
          <div className="rounded-2xl p-6 w-[480px] border max-h-[80vh] overflow-y-auto"
            style={{ background: t.cardBg, borderColor: 'rgba(108,99,255,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Crear Evento</h3>
            <div className="space-y-4">
              <input placeholder="Título del evento..." className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
              <textarea placeholder="Descripción..." rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className="rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
                <input type="time" className="rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
              </div>
              <input placeholder="Nombre del lugar (ej: Auditorio Principal)..." className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>
                  📍 Punto inicial en el campus — toca el mapa para ubicar el evento
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
                    ✓ Ubicación seleccionada — ({pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)})
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
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--p-muted)' }}>Cancelar</button>
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: '#6C63FF', color: 'white' }}>Publicar Evento</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
