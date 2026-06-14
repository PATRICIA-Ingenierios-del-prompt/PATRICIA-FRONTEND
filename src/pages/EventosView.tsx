import { useState } from 'react';
import { MapPin, Calendar, Clock, Users, Plus, Lock, Globe, Bookmark, Filter, ChevronRight, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../store/ThemeContext';

const EVENTOS = [
  {
    id: 1,
    title: 'Hackathon ECI 2026',
    description: 'El hackathon más grande de la Escuela. 24 horas de innovación con premios de hasta $5M COP. Temas: IA, sostenibilidad, smart cities.',
    date: '2026-06-20', time: '8:00 AM', location: 'Auditorio Principal', address: 'Bloque A, Piso 1',
    capacity: 200, enrolled: 156, type: 'public', category: 'Académico',
    organizer: 'IEEE Student Branch', color: '#6C63FF', emoji: '💻',
    saved: false, enrolled_me: false,
    tags: ['IA', 'Innovación', 'Premios'],
  },
  {
    id: 2,
    title: 'Noche de Juegos ECI',
    description: 'Torneo de videojuegos entre programas. PS5, Switch, y PC Gaming disponibles. Habrá snacks y sorpresas.',
    date: '2026-06-14', time: '6:00 PM', location: 'Sala de Bienestar', address: 'Bloque C, Piso 2',
    capacity: 50, enrolled: 48, type: 'public', category: 'Social',
    organizer: 'Bienestar ECI', color: '#FF6B9D', emoji: '🎮',
    saved: true, enrolled_me: true,
    tags: ['Gaming', 'Competencia', 'Social'],
  },
  {
    id: 3,
    title: 'Defensa Proyecto Grado - Sistemas',
    description: 'Evento privado de defensa de proyectos de grado. Solo para invitados del programa de Ingeniería de Sistemas.',
    date: '2026-06-18', time: '2:00 PM', location: 'Sala de Juntas', address: 'Bloque E, Piso 3',
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
    capacity: 40, enrolled: 17, type: 'public', category: 'Bienestar',
    organizer: 'Bienestar ECI', color: '#FFB347', emoji: '🧘',
    saved: false, enrolled_me: false,
    tags: ['Mindfulness', 'Bienestar', 'Estrés'],
  },
  {
    id: 5,
    title: 'Charla: Oportunidades Laborales Tech 2026',
    description: 'Líderes de empresas como Google, Rappi y Bancolombia comparten oportunidades para recién egresados.',
    date: '2026-06-25', time: '5:00 PM', location: 'Auditorio Mario Laserna', address: 'Bloque B',
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

function EventCard({ event, onEnroll, onSave }: { event: typeof EVENTOS[0], onEnroll: (id: number) => void, onSave: (id: number) => void }) {
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
          <div className="flex items-center gap-2">
            <MapPin size={13} style={{ color: event.color }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--p-sub)' }}>{event.location}</span>
          </div>
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

      {/* Map placeholder */}
      <div className="rounded-2xl border mb-6 overflow-hidden relative"
        style={{ background: 'var(--p-card)', borderColor: t.cardBorder, height: '180px' }}>
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--p-divider)' }}>
            <MapPin size={28} style={{ color: '#6C63FF' }} />
          </div>
          <div className="text-center">
            <p style={{ fontWeight: 600 }}>Mapa del Campus ECI</p>
            <p style={{ fontSize: '0.8rem', color: t.textMuted }}>5 eventos activos cerca de ti</p>
          </div>
          {/* Fake map pins */}
          {[{ x: '30%', y: '40%', color: '#6C63FF' }, { x: '55%', y: '30%', color: '#FF6B9D' }, { x: '70%', y: '60%', color: '#7FE7C4' }, { x: '25%', y: '65%', color: '#FFB347' }, { x: '80%', y: '40%', color: '#5BC8FF' }].map((pin, i) => (
            <div key={i} className="absolute w-6 h-6 rounded-full border-2 flex items-center justify-center"
              style={{ left: pin.x, top: pin.y, background: `${pin.color}30`, borderColor: pin.color }}>
              <div className="w-2 h-2 rounded-full" style={{ background: pin.color }} />
            </div>
          ))}
        </div>
      </div>

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
          <EventCard key={evento.id} event={evento} onEnroll={toggleEnroll} onSave={toggleSave} />
        ))}
      </div>

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
              <input placeholder="Ubicación..." className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
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
