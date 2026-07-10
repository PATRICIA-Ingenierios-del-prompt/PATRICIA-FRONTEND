import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Radio, Users, ChevronLeft, ShieldCheck, CalendarClock, AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { addToast } from '../components/ToastSystem';
import { eventService } from '../services/eventService';
import { locationService } from '../services/locationService';
import { LocationSocket } from '../services/locationSocket';
import type { EventCategory, EventResponse, GeoBroadcastMessage, ReportType, UUID } from '../types/patricia';
import { CATEGORY_META, DARK_MAP_STYLES, ECI_CENTER, GMAPS_LOADER_ID, GOOGLE_MAPS_KEY, colorForUser, userDotSvg } from '../lib/maps';
import { friendlyError } from '../lib/errorMessages';

export interface EnrolledEvent { eventId: UUID; name: string; category: EventCategory; }
type PositionMap = Map<UUID, GeoBroadcastMessage>;

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 5) return 'ahora';
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `hace ${m}m` : `hace ${Math.floor(m / 60)}h`;
}

/* ─────────── enrolled-event chooser (only STARTED are trackable) ─────────── */
interface EventCard extends EnrolledEvent { started: boolean | null; center: { lat: number; lng: number } | null; loading: boolean; }

function EnrolledList({ enrolled, onPick }: { enrolled: EnrolledEvent[]; onPick: (id: UUID, center: { lat: number; lng: number } | null, name: string) => void }) {
  const t = useTheme();
  const [cards, setCards] = useState<EventCard[]>(() => enrolled.map(e => ({ ...e, started: null, center: null, loading: true })));
  useEffect(() => {
    let alive = true;
    setCards(enrolled.map(e => ({ ...e, started: null, center: null, loading: true })));
    enrolled.forEach(async e => {
      try {
        const d = await eventService.get(e.eventId);
        const c = d.destination ?? d.meetingPoint;
        const center = c && c.latitude != null && c.longitude != null ? { lat: c.latitude, lng: c.longitude } : null;
        if (alive) setCards(prev => prev.map(x => x.eventId === e.eventId ? { ...x, started: d.started, center, loading: false } : x));
      } catch { if (alive) setCards(prev => prev.map(x => x.eventId === e.eventId ? { ...x, loading: false } : x)); }
    });
    return () => { alive = false; };
  }, [enrolled]);

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--p-text)' }}>Ubicación en vivo</h2>
        <p style={{ fontSize: '0.85rem', color: t.textMuted }}>Sigue en el mapa a los participantes de tus eventos en curso</p>
      </div>
      {enrolled.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 text-center py-16">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(108,99,255,0.1)' }}><MapPin size={24} style={{ color: '#6C63FF' }} /></div>
          <p style={{ fontSize: '0.9rem', color: 'var(--p-text)', fontWeight: 600 }}>Aún no sigues ningún evento</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', maxWidth: 340, lineHeight: 1.6 }}>Inscríbete a un evento en <b>Eventos</b> y, cuando empiece, verás aquí la ubicación en vivo de los participantes.</p>
        </div>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {cards.map(c => {
          const meta = CATEGORY_META[c.category] ?? CATEGORY_META.VARIETY;
          const canTrack = c.started === true;
          return (
            <button key={c.eventId} disabled={!canTrack} onClick={() => canTrack && onPick(c.eventId, c.center, c.name)}
              className="text-left rounded-2xl p-4 border disabled:opacity-60 disabled:cursor-not-allowed enabled:hover:-translate-y-0.5 transition-all" style={{ background: 'var(--p-card)', borderColor: `${meta.color}30` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${meta.color}18` }}>{meta.emoji}</div>
                {c.loading ? <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--p-hover)', color: 'var(--p-muted)' }}>…</span>
                  : canTrack ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(127,231,196,0.18)', color: '#7FE7C4' }}><Radio size={10} /> En curso</span>
                  : <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--p-hover)', color: 'var(--p-muted)' }}><CalendarClock size={10} /> Aún no empieza</span>}
              </div>
              <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--p-text)' }}>{c.name}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--p-muted)', marginTop: 4 }}>{canTrack ? 'Toca para ver el mapa en vivo' : 'Disponible cuando el evento comience'}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── live map ─────────── */
function LiveMap({ center, positions }: { center: { lat: number; lng: number }; positions: PositionMap }) {
  const { darkMode } = useTheme();
  const { isLoaded } = useJsApiLoader({ id: GMAPS_LOADER_ID, googleMapsApiKey: GOOGLE_MAPS_KEY });
  if (!GOOGLE_MAPS_KEY) return <div className="flex items-center justify-center" style={{ height: 460, color: 'var(--p-muted)', fontSize: '0.8rem' }}>Configura VITE_GOOGLE_MAPS_API_KEY</div>;
  if (!isLoaded) return <div className="flex items-center justify-center gap-2" style={{ height: 460 }}><div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#6C63FF', borderTopColor: 'transparent' }} /><span style={{ fontSize: '0.8rem', color: 'var(--p-muted)' }}>Cargando mapa…</span></div>;
  return (
    <GoogleMap mapContainerStyle={{ width: '100%', height: 460 }} center={center} zoom={18}
      options={{ disableDefaultUI: true, zoomControl: true, styles: darkMode ? DARK_MAP_STYLES : [], clickableIcons: false } as any}>
      {[...positions.values()].map(p => <Marker key={p.userId} position={{ lat: p.latitude, lng: p.longitude }} icon={userDotSvg(colorForUser(p.userId))} zIndex={5} />)}
    </GoogleMap>
  );
}

/* ─────────── incident report ─────────── */
const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'MEDICAL_EMERGENCY', label: 'Emergencia médica' }, { value: 'ACCIDENT', label: 'Accidente' },
  { value: 'AGGRESSION', label: 'Agresión' }, { value: 'HARASSMENT', label: 'Acoso' }, { value: 'THEFT', label: 'Robo' },
  { value: 'LOST_PERSON', label: 'Persona perdida' }, { value: 'BAD_BEHAVIOUR', label: 'Mal comportamiento' }, { value: 'OTHER', label: 'Otro' },
];
function ReportModal({ eventId, onClose }: { eventId: UUID; onClose: () => void }) {
  const t = useTheme();
  const [type, setType] = useState<ReportType>('MEDICAL_EMERGENCY');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await eventService.createReport(eventId, { reportType: type, description });
      addToast({ type: 'reporte', title: 'Reporte enviado', message: 'Se registró el incidente y se aseguró tu ubicación como evidencia.' });
      onClose();
    } catch (e: any) { addToast({ type: 'reporte', title: 'No se pudo reportar', message: friendlyError(e, 'No se pudo enviar el reporte. Intenta de nuevo.') }); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={onClose}>
      <div className="rounded-2xl border overflow-hidden w-full max-w-md" style={{ background: t.cardBg, borderColor: 'rgba(255,77,106,0.35)' }} onClick={e => e.stopPropagation()}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF4D6A,#FF6B9D)' }} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,77,106,0.14)' }}><AlertTriangle size={20} style={{ color: '#FF4D6A' }} /></div>
              <div><p style={{ fontWeight: 800, fontSize: '1.05rem', color: t.text }}>Reportar incidente</p><p style={{ fontSize: '0.76rem', color: t.textMuted }}>Tu ubicación actual quedará como evidencia</p></div></div>
            <button onClick={onClose} className="hover:opacity-60"><X size={18} style={{ color: t.textMuted }} /></button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)', marginBottom: 8, fontWeight: 600 }}>Tipo de incidente</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {REPORT_TYPES.map(r => { const on = type === r.value; return <button key={r.value} onClick={() => setType(r.value)} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: on ? 'rgba(255,77,106,0.15)' : 'var(--p-input)', border: `1px solid ${on ? '#FF4D6A' : 'rgba(108,99,255,0.2)'}`, color: on ? '#FF4D6A' : 'var(--p-muted)' }}>{r.label}</button>; })}
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe lo que está pasando..." className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-4" style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--p-muted)' }}>Cancelar</button>
            <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#FF4D6A,#FF6B9D)', color: 'white' }}>{saving ? 'Enviando…' : 'Enviar reporte'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── tracker (read-only) ─────────── */
function Tracker({ eventId, presetCenter, name, onBack }: { eventId: UUID; presetCenter: { lat: number; lng: number } | null; name: string; onBack: () => void }) {
  const [center, setCenter] = useState(presetCenter ?? ECI_CENTER);
  const [detail, setDetail] = useState<EventResponse | null>(null);
  const [positions, setPositions] = useState<PositionMap>(new Map());
  const [socketState, setSocketState] = useState<'down' | 'connecting' | 'up'>('down');
  const [showReport, setShowReport] = useState(false);
  const socketRef = useRef<LocationSocket | null>(null);
  const { userId: meId } = useAuth();

  const upsert = useCallback((p: GeoBroadcastMessage) => setPositions(prev => { const n = new Map(prev); n.set(p.userId, p); return n; }), []);

  useEffect(() => {
    let alive = true;
    eventService.get(eventId).then(d => { if (!alive) return; setDetail(d); const c = d.destination ?? d.meetingPoint; if (!presetCenter && c && c.latitude != null && c.longitude != null) setCenter({ lat: c.latitude, lng: c.longitude }); }).catch(() => {});
    return () => { alive = false; };
  }, [eventId, presetCenter]);

  useEffect(() => {
    let alive = true;
    locationService.liveSnapshot(eventId).then(rows => { if (!alive) return; rows.forEach(r => upsert({ userId: r.userId, latitude: r.latitude, longitude: r.longitude, recordedAt: r.recordedAt })); }).catch(() => {});
    setSocketState('connecting');
    const sock = new LocationSocket({
      onConnect: () => { setSocketState('up'); sock.subscribeToEvent(eventId, { onSnapshot: s => s.positions.forEach(upsert), onPosition: upsert }); },
      onDisconnect: () => setSocketState('down'),
      onStompError: f => addToast({ type: 'reporte', title: 'Ubicación', message: f.headers['message'] ?? f.body }),
    });
    socketRef.current = sock;
    sock.activate();
    return () => { alive = false; sock.deactivate(); socketRef.current = null; };
  }, [eventId, upsert]);

  const people = useMemo(() => [...positions.values()].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)), [positions]);
  const stateColor = socketState === 'up' ? '#7FE7C4' : socketState === 'connecting' ? '#FFB347' : '#FF6B9D';

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:opacity-80" style={{ background: 'var(--p-hover)', color: 'var(--p-text)' }}><ChevronLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--p-text)' }}>{detail?.name ?? name}</h2>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: `${stateColor}20`, color: stateColor }}><Radio size={10} /> {socketState === 'up' ? 'En vivo' : socketState === 'connecting' ? 'Conectando…' : 'Sin conexión'}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--p-muted)' }}>{people.length} participante{people.length !== 1 ? 's' : ''} en el mapa</p>
        </div>
        <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90" style={{ background: 'linear-gradient(135deg,#FF4D6A,#FF6B9D)', color: 'white' }}><AlertTriangle size={15} /> Reportar incidente</button>
      </div>
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ background: 'rgba(127,231,196,0.08)', border: '1px solid rgba(127,231,196,0.2)' }}>
        <ShieldCheck size={14} style={{ color: '#7FE7C4', flexShrink: 0 }} />
        <span style={{ fontSize: '0.74rem', color: 'var(--p-sub)' }}>Las ubicaciones son efímeras y cifradas. Solo se muestran como puntos en el mapa durante el evento; nadie ve coordenadas exactas.</span>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) 260px' }}>
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(108,99,255,0.2)', boxShadow: '0 4px 24px rgba(108,99,255,0.08)' }}><LiveMap center={center} positions={positions} /></div>
        <div className="rounded-2xl border p-4" style={{ background: 'var(--p-card)', borderColor: 'rgba(108,99,255,0.2)' }}>
          <div className="flex items-center gap-2 mb-3"><Users size={15} style={{ color: '#6C63FF' }} /><span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--p-text)' }}>Participantes</span></div>
          {people.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--p-muted)', lineHeight: 1.6 }}>Nadie está transmitiendo ubicación todavía. Aparecerán aquí en cuanto empiecen a moverse.</p>}
          <div className="space-y-2">
            {people.map(p => (
              <div key={p.userId} className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: 'var(--p-input)' }}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colorForUser(p.userId), boxShadow: `0 0 0 3px ${colorForUser(p.userId)}33` }} />
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: '0.78rem', color: 'var(--p-text)', fontWeight: 600 }}>{p.userId === meId ? 'Tú' : `Participante ${p.userId.slice(0, 4)}`}</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--p-muted)' }}>Activo · {timeAgo(p.recordedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showReport && <ReportModal eventId={eventId} onClose={() => setShowReport(false)} />}
    </div>
  );
}

/* ─────────── entry ─────────── */
export function LocationView({ eventId: presetEventId, enrolledEvents = [], onConsumePreset }: {
  eventId?: UUID | null; enrolledEvents?: EnrolledEvent[]; onConsumePreset?: () => void;
}) {
  const [active, setActive] = useState<{ id: UUID; center: { lat: number; lng: number } | null; name: string } | null>(
    presetEventId ? { id: presetEventId, center: null, name: enrolledEvents.find(e => e.eventId === presetEventId)?.name ?? 'Evento' } : null,
  );
  useEffect(() => {
    if (presetEventId) { setActive({ id: presetEventId, center: null, name: enrolledEvents.find(e => e.eventId === presetEventId)?.name ?? 'Evento' }); onConsumePreset?.(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetEventId]);
  if (active) return <Tracker eventId={active.id} presetCenter={active.center} name={active.name} onBack={() => setActive(null)} />;
  return <EnrolledList enrolled={enrolledEvents} onPick={(id, center, name) => setActive({ id, center, name })} />;
}
