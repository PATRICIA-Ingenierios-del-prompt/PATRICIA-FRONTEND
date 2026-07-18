import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Calendar, Clock, Users, Plus, Globe, Filter, ChevronRight, X, RefreshCw, Navigation, LogOut, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useTheme } from '../store/ThemeContext';
import { addToast } from '../components/ToastSystem';
import { eventService } from '../services/eventService';
import { parcheService } from '../services/parcheService';
import { friendlyError } from '../lib/errorMessages';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from 'react-i18next';
import type { EventCategory, EventMapResponse, EventResponse, ParcheSummaryResponse, UUID } from '../types/patricia';
import {
  ALL_CATEGORIES, CATEGORY_META, DARK_MAP_STYLES, ECI_CENTER, GMAPS_LOADER_ID, GOOGLE_MAPS_KEY, pinSvg,
} from '../lib/maps';

/** Enrolled event lifted to App so the Location view can offer it for tracking. */
export interface EnrolledEvent { eventId: UUID; name: string; category: EventCategory; }

interface UiEvent {
  id: UUID; title: string; description: string; date: string; time: string;
  address: string; lat: number; lng: number; capacity: number; enrolled: number;
  category: EventCategory; color: string; emoji: string; catLabel: string;
}

function adapt(e: EventMapResponse): UiEvent | null {
  const d = e.destination;
  if (!d || d.latitude == null || d.longitude == null) return null; // no marker without coords
  const meta = CATEGORY_META[e.category] ?? CATEGORY_META.VARIETY;
  return {
    id: e.eventId, title: e.name, description: e.description, date: e.eventDate, time: e.startTime,
    address: d.address ?? '', lat: d.latitude, lng: d.longitude,
    capacity: e.maxCapacity, enrolled: e.maxCapacity - e.spotsLeft,
    category: e.category, color: meta.color, emoji: meta.emoji, catLabel: meta.label,
  };
}

/* ─────────────── map ─────────────── */
function CampusMap({ events, height = 480, selectedId, onSelect, pickMode, pickedPos, onPick }: {
  events: UiEvent[]; height?: number | string; selectedId?: UUID | null;
  onSelect?: (id: UUID | null) => void; pickMode?: boolean;
  pickedPos?: { lat: number; lng: number } | null; onPick?: (p: { lat: number; lng: number }) => void;
}) {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { isLoaded } = useJsApiLoader({ id: GMAPS_LOADER_ID, googleMapsApiKey: GOOGLE_MAPS_KEY });
  const selected = selectedId != null ? events.find(e => e.id === selectedId) ?? null : null;

  if (!GOOGLE_MAPS_KEY) return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ height }}>
      <MapPin size={24} style={{ color: '#6C63FF' }} />
      <p style={{ fontSize: '0.75rem', color: 'var(--p-muted)' }}>Agrega <code>VITE_GOOGLE_MAPS_API_KEY</code> a <code>.env</code></p>
    </div>
  );
  if (!isLoaded) return (
    <div className="flex items-center justify-center gap-2" style={{ height }}>
      <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#6C63FF', borderTopColor: 'transparent' }} />
      <span style={{ fontSize: '0.8rem', color: 'var(--p-muted)' }}>Cargando mapa…</span>
    </div>
  );
  return (
    <GoogleMap mapContainerStyle={{ width: '100%', height }}
      center={selected ? { lat: selected.lat, lng: selected.lng } : (pickedPos ?? ECI_CENTER)}
      zoom={selected ? 19 : 17}
      options={{ disableDefaultUI: true, zoomControl: true, styles: darkMode ? DARK_MAP_STYLES : [], clickableIcons: false } as any}
      onClick={pickMode && onPick ? (e: any) => { if (e.latLng) onPick({ lat: e.latLng.lat(), lng: e.latLng.lng() }); } : undefined}>
      {events.map(ev => (
        <Marker key={ev.id} position={{ lat: ev.lat, lng: ev.lng }} icon={pinSvg(ev.color, selectedId === ev.id)}
          zIndex={selectedId === ev.id ? 10 : 1} options={{ optimized: false }} title={ev.title}
          onClick={() => onSelect?.(ev.id === selectedId ? null : ev.id)} />
      ))}
      {pickMode && pickedPos && <Marker position={pickedPos} icon={pinSvg('#6C63FF', true)} />}
    </GoogleMap>
  );
}

/* ─────────────── summary card ─────────────── */
function EventSummaryCard({ event, enrolled, onMore, onEnroll, onTrack, onClose }: {
  event: UiEvent; enrolled: boolean; onMore: () => void; onEnroll: (id: UUID) => void; onTrack: (id: UUID) => void; onClose: () => void;
}) {
  const { t } = useTranslation();
  const left = event.capacity - event.enrolled;
  const full = left <= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border" style={{ background: 'var(--p-card)', borderColor: `${event.color}35`, overflow: 'hidden' }}>
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${event.color}, ${event.color}40)` }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${event.color}18` }}>{event.emoji}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                <p className="truncate" style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--p-text)' }}>{event.title}</p>
                <Globe size={11} style={{ color: '#7FE7C4' }} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${event.color}20`, color: event.color }}>{event.catLabel}</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:opacity-60 ml-2 flex-shrink-0"><X size={16} style={{ color: 'var(--p-muted)' }} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4">
          <div className="flex items-center gap-1.5"><Calendar size={12} style={{ color: event.color }} /><span style={{ fontSize: '0.78rem', color: 'var(--p-sub)' }}>{new Date(event.date + 'T00:00').toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.time}</span></div>
          {event.address && <div className="flex items-center gap-1.5"><MapPin size={12} style={{ color: event.color }} /><span style={{ fontSize: '0.78rem', color: 'var(--p-sub)' }}>{event.address}</span></div>}
          <div className="flex items-center gap-1.5"><Users size={12} style={{ color: full ? '#FF4D6A' : event.color }} /><span style={{ fontSize: '0.78rem', color: full ? '#FF4D6A' : 'var(--p-sub)' }}>{full ? t('events.full') : t('events.spots_left', { count: left })}</span></div>
        </div>
        <div className="flex gap-2">
          <button onClick={onMore} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border hover:opacity-80" style={{ borderColor: `${event.color}40`, color: event.color, background: `${event.color}08` }}>{t('events.see_more')} <ChevronRight size={14} /></button>
          {enrolled ? (
            <button onClick={() => onTrack(event.id)} className="flex-1 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg,#7FE7C4,#5BC8FF)', color: '#0a0a14' }}><Navigation size={14} /> {t('events.track')}</button>
          ) : (
            <button onClick={() => onEnroll(event.id)} disabled={full} className="flex-1 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: full ? 'rgba(255,77,106,0.1)' : `linear-gradient(135deg, ${event.color}, ${event.color}CC)`, color: full ? '#FF4D6A' : 'white' }}>{full ? t('events.full') : t('events.enroll')}</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── detail modal ─────────────── */
function EventDetailModal({ event, detail, loading, enrolled, onClose, onEnroll, onTrack, onLeave, onDelete }: {
  event: UiEvent; detail: EventResponse | null; loading: boolean; enrolled: boolean;
  onClose: () => void; onEnroll: (id: UUID) => void; onTrack: (id: UUID) => void;
  onLeave: (id: UUID) => void; onDelete: (id: UUID) => void;
}) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const capacity = detail?.maxCapacity ?? event.capacity;
  const enrolledCount = detail?.participantCount ?? event.enrolled;
  const left = capacity - enrolledCount;
  const full = left <= 0;
  const pct = capacity > 0 ? Math.round((enrolledCount / capacity) * 100) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="rounded-2xl border overflow-hidden w-full max-w-lg" style={{ background: t.cardBg, borderColor: `${event.color}35`, maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${event.color}, ${event.color}60)` }} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: `${event.color}18` }}>{event.emoji}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: t.text }}>{event.title}</span>
                  {detail?.started && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(127,231,196,0.18)', color: '#7FE7C4' }}>{tr('events.in_progress')}</span>}
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${event.color}20`, color: event.color }}>{event.catLabel}</span>
              </div>
            </div>
            <button onClick={onClose} className="hover:opacity-60"><X size={18} style={{ color: t.textMuted }} /></button>
          </div>
          <p style={{ fontSize: '0.87rem', color: t.textSub, lineHeight: 1.65, marginBottom: '20px' }}>{event.description}</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: t.inputBg }}><Calendar size={15} style={{ color: event.color }} /><div><p style={{ fontSize: '0.65rem', color: t.textMuted }}>{tr('events.date')}</p><p style={{ fontSize: '0.82rem', color: t.text, fontWeight: 600 }}>{new Date(event.date + 'T00:00').toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })}</p></div></div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: t.inputBg }}><Clock size={15} style={{ color: event.color }} /><div><p style={{ fontSize: '0.65rem', color: t.textMuted }}>{tr('events.time')}</p><p style={{ fontSize: '0.82rem', color: t.text, fontWeight: 600 }}>{event.time}{detail?.endTime ? ` – ${detail.endTime}` : ''}</p></div></div>
            {event.address && <div className="col-span-2 flex items-start gap-2.5 p-3 rounded-xl" style={{ background: t.inputBg }}><MapPin size={15} style={{ color: event.color, marginTop: 2 }} /><div><p style={{ fontSize: '0.65rem', color: t.textMuted }}>{tr('events.location')}</p><p style={{ fontSize: '0.82rem', color: t.text, fontWeight: 600 }}>{event.address}</p></div></div>}
          </div>
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Users size={14} style={{ color: event.color }} /><span style={{ fontSize: '0.82rem', color: t.text, fontWeight: 600 }}>{tr('events.spots')}</span></div><span style={{ fontSize: '0.82rem', color: full ? '#FF4D6A' : event.color, fontWeight: 700 }}>{loading ? '…' : full ? tr('events.full_available') : tr('events.available', { count: left })}</span></div>
            <div className="flex justify-between mb-1.5"><span style={{ fontSize: '0.7rem', color: t.textMuted }}>{tr('events.enrolled', { count: enrolledCount })}</span><span style={{ fontSize: '0.7rem', color: t.textMuted }}>{tr('events.total', { count: capacity })}</span></div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: t.inputBg }}><div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: full ? '#FF4D6A' : `linear-gradient(90deg, ${event.color}, ${event.color}80)` }} /></div>
          </div>
          {enrolled ? (
            <>
              <button onClick={() => onTrack(event.id)} className="w-full py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#7FE7C4,#5BC8FF)', color: '#0a0a14' }}><Navigation size={16} /> {tr('events.track')}</button>
              <button onClick={() => onLeave(event.id)} className="w-full mt-2.5 py-3 rounded-xl text-sm font-semibold hover:opacity-80 flex items-center justify-center gap-2 border" style={{ background: 'transparent', color: '#FF4D6A', borderColor: 'rgba(255,77,106,0.35)' }}><LogOut size={15} /> {tr('events.leave')}</button>
            </>
          ) : (
            <button onClick={() => onEnroll(event.id)} disabled={full} className="w-full py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: full ? 'rgba(255,77,106,0.1)' : `linear-gradient(135deg, ${event.color}, ${event.color}CC)`, color: full ? '#FF4D6A' : 'white' }}>{full ? tr('events.full') : tr('events.enroll_event')}</button>
          )}
          {/* El back valida quién es el dueño (403 si no lo es) — el contrato
              actual no expone ownerId, así que el botón se muestra siempre y
              el error 403 se traduce a un toast claro. */}
          <button onClick={() => onDelete(event.id)} className="w-full mt-2.5 py-2 rounded-xl text-xs hover:opacity-80 flex items-center justify-center gap-1.5" style={{ background: 'transparent', color: t.textMuted }}>
            <Trash2 size={12} /> {tr('events.delete')} <span style={{ fontSize: '0.6rem' }}>{tr('events.only_creator')}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────── create modal ─────────────── */
function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const [form, setForm] = useState({ name: '', description: '', date: '', start: '', end: '', place: '' });
  const [capacity, setCapacity] = useState('');
  const [category, setCategory] = useState<EventCategory>('TECHNOLOGY');
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [withMeeting, setWithMeeting] = useState(false);
  const [pickedMeeting, setPickedMeeting] = useState<{ lat: number; lng: number } | null>(null);
  const [meetingPlace, setMeetingPlace] = useState('');
  const [myParches, setMyParches] = useState<ParcheSummaryResponse[]>([]);
  const [parcheId, setParcheId] = useState<UUID | ''>('');
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const inputStyle: React.CSSProperties = { background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text };

  // My parches, to optionally link the event (POST /api/events/linked requires membership).
  useEffect(() => {
    parcheService.mine().then(p => setMyParches(p.content)).catch(() => setMyParches([]));
  }, []);

  const submit = async () => {
    // ── Validación de campos obligatorios ──────────────────────────────────
    if (!form.name.trim()) {
      addToast({ type: 'info', title: 'Falta el nombre', message: 'Escribe un nombre para el evento.' });
      return;
    }
    if (!form.date) {
      addToast({ type: 'info', title: 'Falta la fecha', message: 'Selecciona la fecha del evento.' });
      return;
    }
    if (!form.start || !form.end) {
      addToast({ type: 'info', title: 'Faltan las horas', message: 'Selecciona la hora de inicio y la hora de fin.' });
      return;
    }

    // ── Validación de fecha: no puede ser pasada ───────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(form.date + 'T00:00');
    if (chosenDate < today) {
      addToast({ type: 'info', title: 'Fecha inválida', message: `La fecha ${form.date} ya pasó. Elige una fecha a partir de hoy.` });
      return;
    }

    // ── Validación de anticipación mínima de 30 min ────────────────────────
    const startsAt = new Date(form.date + 'T' + form.start);
    const now = new Date();
    const diffMinutes = (startsAt.getTime() - now.getTime()) / 60000;
    if (diffMinutes < 30) {
      addToast({ type: 'info', title: 'Hora muy próxima', message: 'El evento debe crearse con al menos 30 minutos de anticipación. Elige una hora de inicio más tarde.' });
      return;
    }

    // ── Validación de hora inicio ≠ hora fin ───────────────────────────────
    if (form.start === form.end) {
      addToast({ type: 'info', title: 'Horas iguales', message: 'La hora de inicio y la hora de fin no pueden ser iguales.' });
      return;
    }

    // ── Validación de duración máxima de 24 h ─────────────────────────────
    const endsAt = form.end > form.start
      ? new Date(form.date + 'T' + form.end)
      : new Date(new Date(form.date + 'T' + form.end).getTime() + 86400000); // siguiente día
    const durationHours = (endsAt.getTime() - startsAt.getTime()) / 3600000;
    if (durationHours > 24) {
      addToast({ type: 'info', title: 'Duración excesiva', message: 'El evento no puede durar más de 24 horas.' });
      return;
    }

    if (!picked) { addToast({ type: 'info', title: 'Destino', message: 'Toca el mapa para marcar dónde será el evento.' }); return; }
    if (withMeeting && !pickedMeeting) { addToast({ type: 'info', title: 'Punto de encuentro', message: 'Marca el punto de encuentro en su mapa, o desactiva la casilla.' }); return; }
    setSaving(true);
    try {
      const destination = { latitude: picked.lat, longitude: picked.lng, address: form.place || null, placeId: null };
      const meetingPoint = withMeeting && pickedMeeting
        ? { latitude: pickedMeeting.lat, longitude: pickedMeeting.lng, address: meetingPlace || null, placeId: null }
        : null;
      const body = { name: form.name, description: form.description, category, maxCapacity: Number(capacity) || 1, eventDate: form.date, startTime: form.start, endTime: form.end, meetingPoint, destination };
      if (parcheId) await eventService.createLinked({ ...body, parcheId });
      else await eventService.create(body);
      addToast({ type: 'logro', title: '¡Evento creado!', message: parcheId ? `${form.name} · vinculado al parche` : form.name });
      onCreated(); onClose();
    } catch (e: any) {
      addToast({ type: 'reporte', title: 'No se pudo crear', message: friendlyError(e, 'No se pudo crear el evento. Intenta de nuevo.') });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-2xl p-5 sm:p-6 w-full max-w-[480px] border max-h-[88vh] overflow-y-auto" style={{ background: t.cardBg, borderColor: 'rgba(108,99,255,0.3)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 20, color: t.text }}>{tr('events.create_title')}</h3>
        <div className="space-y-4">
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.event_name')}</p>
            <input value={form.name} onChange={set('name')} placeholder="Título del evento..." className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.event_desc')}</p>
            <textarea value={form.description} onChange={set('description')} placeholder={tr('events.event_desc') + "..."} rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={inputStyle} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 8, fontWeight: 600 }}>{tr('events.category')}</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => { const m = CATEGORY_META[cat]; const on = category === cat; return (
                <button key={cat} onClick={() => setCategory(cat)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: on ? `${m.color}22` : 'var(--p-input)', border: `1px solid ${on ? m.color : 'rgba(108,99,255,0.2)'}`, color: on ? m.color : 'var(--p-muted)' }}>{m.emoji} {m.label}</button>
              ); })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.date')}</p>
              <input type="date" value={form.date} onChange={set('date')} className="w-full min-w-0 rounded-xl px-3 py-3 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.start_time')}</p>
              <input type="time" value={form.start} onChange={set('start')} className="w-full min-w-0 rounded-xl px-3 py-3 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.end_time')}</p>
              <input type="time" value={form.end} onChange={set('end')} className="w-full min-w-0 rounded-xl px-3 py-3 text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.place')}</p>
            <input value={form.place} onChange={set('place')} placeholder={tr('events.place') + "..."} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.destination')} <span style={{ color: '#FF4D6A' }}>*</span> — {tr('events.destination_hint')}</p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(108,99,255,0.2)' }}>
              <CampusMap events={[]} height={180} pickMode pickedPos={picked} onPick={setPicked} />
            </div>
            {picked && <p style={{ fontSize: '0.7rem', color: '#6C63FF', marginTop: 4 }}>✓ Destino: {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}</p>}
          </div>
          {/* Optional meeting point — where the group gathers before heading to the destination */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={withMeeting}
              onChange={e => { setWithMeeting(e.target.checked); if (!e.target.checked) { setPickedMeeting(null); setMeetingPlace(''); } }}
              className="w-4 h-4 rounded" style={{ accentColor: '#7FE7C4' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--p-muted)', fontWeight: 600 }}>{tr('events.meeting_point_check')}</span>
          </label>
          {withMeeting && (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.meeting_point_name')}</p>
              <input value={meetingPlace} onChange={e => setMeetingPlace(e.target.value)} placeholder={tr('events.meeting_point_name') + "..."} className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-2" style={inputStyle} />
              <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.meeting_point_hint')}</p>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(127,231,196,0.35)' }}>
                <CampusMap events={[]} height={180} pickMode pickedPos={pickedMeeting} onPick={setPickedMeeting} />
              </div>
              {pickedMeeting && <p style={{ fontSize: '0.7rem', color: '#7FE7C4', marginTop: 4 }}>✓ Encuentro: {pickedMeeting.lat.toFixed(5)}, {pickedMeeting.lng.toFixed(5)}</p>}
            </div>
          )}
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.max_capacity')}</p>
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder={tr('events.max_capacity') + "..."} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
          </div>
          {/* Optional parche link */}
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 6, fontWeight: 600 }}>{tr('events.link_parche')}</p>
            <select value={parcheId} onChange={e => setParcheId(e.target.value as UUID | '')}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none appearance-none"
              style={inputStyle}>
              <option value="">{tr('events.no_link')}</option>
              {myParches.map(p => (
                <option key={p.parcheId} value={p.parcheId}>{p.name}{p.visibility === 'PRIVATE' ? ' 🔒' : ''}</option>
              ))}
            </select>
            {parcheId && <p style={{ fontSize: '0.7rem', color: '#FFB347', marginTop: 4 }}>{tr('events.link_hint')}</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--p-muted)' }}>{tr('events.cancel')}</button>
            <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: '#6C63FF', color: 'white' }}>{saving ? tr('events.publishing') : tr('events.publish')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── main view ─────────────── */
export function EventosView({ onTrackEvent, enrolledIds, onEnroll, onLeave }: {
  onTrackEvent?: (eventId: UUID) => void;
  enrolledIds?: Set<UUID>;
  onEnroll?: (e: EnrolledEvent) => void;
  onLeave?: (eventId: UUID) => void;
}) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const { userId: meId } = useAuth();
  const [raw, setRaw] = useState<EventMapResponse[]>([]);
  const [detailCache, setDetailCache] = useState<Map<UUID, EventResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<'public' | 'mine'>('public');
  const [category, setCategory] = useState<'ALL' | EventCategory>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<UUID | null>(null);
  const [detailId, setDetailId] = useState<UUID | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const localEnrolled = enrolledIds ?? new Set<UUID>();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const page = scope === 'mine' ? await eventService.myParchesEvents({ page: 0, size: 200 }) : await eventService.publicMap({ page: 0, size: 200 });
      setRaw(page.content);
      // Enrich with `started` (EventMapResponse lacks it) so we can hide started
      // events from the discovery map. Detail is cached for the click-to-open panel.
      const details = await Promise.all(page.content.map(e => eventService.get(e.eventId).then(d => [e.eventId, d] as const).catch(() => null)));
      setDetailCache(new Map(details.filter((x): x is readonly [UUID, EventResponse] => x !== null)));
    } catch (e: any) {
      setError(e?.response?.status === 401 ? 'Inicia sesión para ver los eventos.' : friendlyError(e, 'No se pudieron cargar los eventos. Intenta de nuevo.'));
    } finally { setLoading(false); }
  }, [scope]);
  useEffect(() => { void load(); }, [load]);

  const allUiEvents = useMemo(() => raw.map(adapt).filter((e): e is UiEvent => e !== null), [raw]);

  const uiEvents = useMemo(() => {
    // Requirement #3: started events must not appear on the map.
    return allUiEvents.filter(e => detailCache.get(e.id)?.started !== true);
  }, [allUiEvents, detailCache]);

  // Started-but-joinable events: already kicked off (location tracking active),
  // hidden from the map, but still open — free spots or the user is already in.
  // The backend allows joining until `finished`, so we surface them here.
  const startedEvents = useMemo(() => {
    return allUiEvents.filter(e => {
      const d = detailCache.get(e.id);
      if (d?.started !== true) return false;
      const free = (d.maxCapacity - d.participantCount) > 0;
      return free || localEnrolled.has(e.id);
    });
  }, [allUiEvents, detailCache, localEnrolled]);

  const filtered = useMemo(() => uiEvents
    .filter(e => category === 'ALL' || e.category === category)
    .filter(e => !search.trim() || e.title.toLowerCase().includes(search.trim().toLowerCase())),
    [uiEvents, category, search]);

  const selected = selectedId ? filtered.find(e => e.id === selectedId) ?? null : null;
  const detailEvent = detailId ? allUiEvents.find(e => e.id === detailId) ?? null : null;
  const detail = detailId ? detailCache.get(detailId) ?? null : null;

  // Full info only on click — refetch fresh detail when the modal opens.
  useEffect(() => {
    if (!detailId) return;
    setDetailLoading(true);
    eventService.get(detailId).then(d => setDetailCache(prev => new Map(prev).set(detailId, d))).catch(() => {}).finally(() => setDetailLoading(false));
  }, [detailId]);

  const enroll = async (id: UUID) => {
    try {
      await eventService.join(id);
      const ev = raw.find(e => e.eventId === id);
      if (ev) onEnroll?.({ eventId: ev.eventId, name: ev.name, category: ev.category });
      setRaw(prev => prev.map(e => e.eventId === id ? { ...e, spotsLeft: Math.max(0, e.spotsLeft - 1) } : e));
      addToast({ type: 'logro', title: '¡Inscrito!', message: 'Ya eres parte del evento.' });
    } catch (e: any) {
      addToast({ type: 'reporte', title: 'No se pudo inscribir', message: friendlyError(e, 'No te pudimos inscribir. Intenta de nuevo.') });
      // 409 = se llenó o finalizó mientras el usuario miraba — refrescar para
      // que la tarjeta desaparezca de la lista/sección.
      if (e?.response?.status === 409) void load();
    }
  };
  const track = (id: UUID) => onTrackEvent ? onTrackEvent(id) : addToast({ type: 'info', title: 'Ubicación en vivo', message: 'Abre la vista de Ubicación.' });

  const leaveEvent = async (id: UUID) => {
    if (!meId) return;
    try {
      await eventService.removeParticipant(id, meId);
      onLeave?.(id);
      setRaw(prev => prev.map(e => e.eventId === id ? { ...e, spotsLeft: e.spotsLeft + 1 } : e));
      setDetailId(null);
      addToast({ type: 'info', title: 'Saliste del evento', message: 'Ya no estás inscrito.' });
    } catch (e: any) {
      addToast({ type: 'reporte', title: 'No se pudo salir', message: friendlyError(e, 'No te pudimos sacar del evento. Intenta de nuevo.') });
    }
  };

  const deleteEventHandler = async (id: UUID) => {
    try {
      await eventService.remove(id);
      setDetailId(null);
      addToast({ type: 'info', title: 'Evento eliminado', message: 'El evento fue eliminado.' });
      await load();
    } catch (e: any) {
      const status = e?.response?.status;
      addToast({
        type: 'reporte',
        title: status === 403 ? 'Solo el creador puede eliminar' : 'No se pudo eliminar',
        message: status === 403
          ? 'Este evento solo lo puede eliminar quien lo creó.'
          : friendlyError(e, 'No se pudo eliminar el evento. Intenta de nuevo.'),
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--p-text)' }}>{tr('events.title')}</h2>
          <p style={{ fontSize: '0.85rem', color: t.textMuted }}>{tr('events.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => void load()} title="Recargar" className="p-2.5 rounded-xl hover:opacity-80" style={{ background: 'var(--p-hover)', color: 'var(--p-muted)' }}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 whitespace-nowrap" style={{ background: '#6C63FF', color: 'white' }}><Plus size={16} /> {tr('events.create_event')}</button>
        </div>
      </div>

      {/* Scope: public map vs my-parches (incl. private) events */}
      <div className="inline-flex p-1 rounded-2xl mb-4" style={{ background: 'var(--p-hover)' }}>
        {([['public', tr('events.public'), Globe], ['mine', tr('events.mine'), Users]] as const).map(([val, label, Icon]) => {
          const on = scope === val;
          return <button key={val} onClick={() => { if (scope !== val) { setScope(val); setSelectedId(null); } }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: on ? '#6C63FF' : 'transparent', color: on ? 'white' : 'var(--p-muted)' }}><Icon size={15} /> {label}</button>;
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Filter size={15} style={{ color: 'var(--p-muted)', flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('events.search')} className="rounded-xl px-3 py-1.5 text-sm outline-none w-48 max-w-full flex-1 sm:flex-none" style={{ background: 'var(--p-input)', color: 'var(--p-text)', border: '1px solid rgba(108,99,255,0.2)' }} />
        <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto sm:flex-1 min-w-0" style={{ scrollbarWidth: 'none' }}>
          {(['ALL', ...ALL_CATEGORIES] as const).map(cat => {
            const on = category === cat; const label = cat === 'ALL' ? tr('events.all') : CATEGORY_META[cat].label;
            return <button key={cat} onClick={() => { setCategory(cat); setSelectedId(null); }} className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm" style={{ background: on ? '#6C63FF' : 'var(--p-hover)', color: on ? 'white' : t.textMuted, border: on ? 'none' : '1px solid rgba(108,99,255,0.2)' }}>{label}</button>;
          })}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border mb-4" style={{ borderColor: 'rgba(108,99,255,0.2)', boxShadow: '0 4px 24px rgba(108,99,255,0.08)' }}>
        <CampusMap events={filtered} height="clamp(300px, 52vh, 480px)" selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setDetailId(null); }} />
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 py-3" style={{ color: '#FF6B9D', fontSize: '0.82rem' }}><X size={13} /> <span>{error}</span></motion.div>
        ) : !selected ? (
          <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 py-3" style={{ color: 'var(--p-muted)', fontSize: '0.82rem' }}>
            <MapPin size={13} /><span>{loading ? tr('events.loading') : filtered.length === 0 ? (scope === 'mine' ? tr('events.empty_mine') : tr('events.empty_public')) : filtered.length === 1 ? tr('events.events_on_map_one', { count: filtered.length }) : tr('events.events_on_map_other', { count: filtered.length })}</span>
          </motion.div>
        ) : (
          <EventSummaryCard key={`s-${selected.id}`} event={selected} enrolled={localEnrolled.has(selected.id)} onMore={() => setDetailId(selected.id)} onEnroll={enroll} onTrack={track} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>

      {/* En curso — ya iniciaron pero siguen abiertos (cupos libres o ya inscrito) */}
      {startedEvents.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#7FE7C4' }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#7FE7C4' }} />
            </span>
            <h3 style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--p-text)' }}>{tr('events.started_section_title')}</h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--p-muted)', marginBottom: 12 }}>{tr('events.started_section_hint')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {startedEvents.map(ev => {
              const d = detailCache.get(ev.id);
              const capacity = d?.maxCapacity ?? ev.capacity;
              const count = d?.participantCount ?? ev.enrolled;
              const left = Math.max(0, capacity - count);
              const isIn = localEnrolled.has(ev.id);
              const isParche = d?.parcheId != null;
              return (
                <div key={ev.id} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--p-card)', borderColor: 'rgba(127,231,196,0.3)' }}>
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #7FE7C4, #5BC8FF)' }} />
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${ev.color}18` }}>{ev.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate" style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--p-text)' }}>{ev.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap" style={{ background: 'rgba(127,231,196,0.18)', color: '#7FE7C4' }}>{tr('events.in_progress')}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1" style={{ background: isParche ? 'rgba(255,179,71,0.15)' : 'rgba(91,200,255,0.15)', color: isParche ? '#FFB347' : '#5BC8FF' }}>
                            {isParche ? <Users size={10} /> : <Globe size={10} />}{isParche ? tr('events.started_parche_tag') : tr('events.started_public_tag')}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap" style={{ background: `${ev.color}20`, color: ev.color }}>{ev.catLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                      <div className="flex items-center gap-1.5 min-w-0"><Clock size={12} style={{ color: ev.color, flexShrink: 0 }} /><span className="truncate" style={{ fontSize: '0.75rem', color: 'var(--p-sub)' }}>{ev.time}{d?.endTime ? ` – ${d.endTime}` : ''}</span></div>
                      <div className="flex items-center gap-1.5"><Users size={12} style={{ color: isIn ? '#7FE7C4' : ev.color, flexShrink: 0 }} /><span style={{ fontSize: '0.75rem', color: isIn ? '#7FE7C4' : 'var(--p-sub)' }}>{isIn ? tr('events.youre_in') : tr('events.spots_left', { count: left })}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setDetailId(ev.id)} className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border hover:opacity-80" style={{ borderColor: `${ev.color}40`, color: ev.color, background: `${ev.color}08` }}>{tr('events.see_more')} <ChevronRight size={12} /></button>
                      {isIn ? (
                        <button onClick={() => track(ev.id)} className="flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg,#7FE7C4,#5BC8FF)', color: '#0a0a14' }}><Navigation size={12} /> {tr('events.track')}</button>
                      ) : (
                        <button onClick={() => void enroll(ev.id)} className="flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold hover:opacity-90" style={{ background: 'linear-gradient(135deg,#7FE7C4,#5BC8FF)', color: '#0a0a14' }}>{tr('events.enroll')}</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {detailEvent && <EventDetailModal event={detailEvent} detail={detail} loading={detailLoading} enrolled={localEnrolled.has(detailEvent.id)} onClose={() => setDetailId(null)} onEnroll={enroll} onTrack={track} onLeave={leaveEvent} onDelete={deleteEventHandler} />}
      </AnimatePresence>

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}
