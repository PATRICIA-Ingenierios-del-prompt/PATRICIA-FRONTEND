import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { X, Heart, MessageCircle, Check, Send, ArrowLeft, RotateCcw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { addToast } from '../components/ToastSystem';
import { friendlyError } from '../lib/errorMessages';
import { matchingService } from '../services/matchingService';
import { userService, type PerfilResponse, type FranjaHoraria } from '../services/userService';
import type { MatchResponse } from '../types/patricia';
import { useTranslation } from 'react-i18next';

/**
 * Matching feed conectado a matching-service + Users.
 *
 * matching-service (GET /matching/sugerencias, /matching/matches,
 * /matching/solicitudes-recibidas) SOLO devuelve IDs + scores — nunca
 * nombre/foto/bio. Por eso cada candidato se "hidrata" con una llamada a
 * userService.getPerfil(id) contra Users antes de mostrarlo.
 */

// ── Visual-only helpers (el backend no manda color/avatar) ──────────────────
const GRADIENTS = [
  'linear-gradient(160deg, #6C63FF 0%, #FF6B9D 60%, #251F3D 100%)',
  'linear-gradient(160deg, #7FE7C4 0%, #6C63FF 60%, #1A1829 100%)',
  'linear-gradient(160deg, #FFB347 0%, #FF6B9D 60%, #1A1829 100%)',
  'linear-gradient(160deg, #A78BFA 0%, #5BC8FF 60%, #1A1829 100%)',
];
function gradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}
function getInitials(nombre?: string, apellidos?: string): string {
  const full = [nombre, apellidos].filter(Boolean).join(' ');
  const parts = full.split(' ').filter(Boolean).slice(0, 2);
  return parts.length ? parts.map(w => w[0]!.toUpperCase()).join('') : '?';
}
function computeAge(fechaNacimiento?: string): number | undefined {
  if (!fechaNacimiento) return undefined;
  const birth = new Date(fechaNacimiento);
  if (isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// ── Display model — merge de datos de Matching (score) + Users (perfil) ─────
interface DisplayCandidate {
  id: string;
  nombre: string;
  apellidos: string;
  edad?: number;
  carrera: string;
  semestre?: number | string;
  bio: string;
  intereses: string[];
  disponibilidad?: string;
  foto?: string;
  scorePct?: number; // 0-100, solo disponible en feed "discover" y "matches"
  avatar: string;
  gradient: string;
  hasPendingRequest?: boolean; // true si este usuario ya le dio LIKE al actual
}

function toDisplayCandidate(id: string, perfil: PerfilResponse | undefined, scoreTotal?: number): DisplayCandidate {
  return {
    id,
    nombre: perfil?.nombre || 'Usuario',
    apellidos: perfil?.apellidos || '',
    edad: computeAge(perfil?.fechaNacimiento),
    carrera: perfil?.carrera || 'Programa no especificado',
    semestre: perfil?.semestre,
    bio: perfil?.bio || 'Este usuario aún no ha escrito una bio.',
    intereses: perfil?.intereses ?? [],
    disponibilidad: (perfil as any)?.disponibilidad,
    foto: perfil?.foto,
    scorePct: scoreTotal != null ? Math.round(scoreTotal * 100) : undefined,
    avatar: getInitials(perfil?.nombre, perfil?.apellidos),
    gradient: gradientFor(id),
  };
}

/** Trae los perfiles de Users para una lista de IDs y arma DisplayCandidate[], preservando el orden. */
async function hydrate(
  entries: { id: string; scoreTotal?: number }[],
): Promise<DisplayCandidate[]> {
  const perfiles = await userService.getPerfiles(entries.map(e => e.id));
  return entries.map(e => toDisplayCandidate(e.id, perfiles[e.id], e.scoreTotal));
}

type TabId = 'discover' | 'requests' | 'matches';
type ChatMsg = { id: number; from: 'me' | 'them'; text: string; time: string };

const DISPONIBILIDAD_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  OCUPADO: 'Ocupado',
  NO_MOLESTAR: 'No molestar',
};

// ── Horario semanal (solo lectura) — mismo formato que ProfileView.tsx ──────
const SCHED_DAYS  = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const SCHED_SLOTS = [
  { start: '7:00 AM',  end: '8:30 AM',  horaInicio: '07:00', horaFin: '08:30' },
  { start: '9:00 AM',  end: '10:30 AM', horaInicio: '09:00', horaFin: '10:30' },
  { start: '10:30 AM', end: '12:00 PM', horaInicio: '10:30', horaFin: '12:00' },
  { start: '12:00 PM', end: '1:30 PM',  horaInicio: '12:00', horaFin: '13:30' },
  { start: '1:30 PM',  end: '3:00 PM',  horaInicio: '13:30', horaFin: '15:00' },
  { start: '3:00 PM',  end: '4:30 PM',  horaInicio: '15:00', horaFin: '16:30' },
  { start: '4:30 PM',  end: '6:00 PM',  horaInicio: '16:30', horaFin: '18:00' },
  { start: '6:00 PM',  end: '7:30 PM',  horaInicio: '18:00', horaFin: '19:30' },
];
const SCHED_DAY_ENUM: FranjaHoraria['diaSemana'][] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
];

// Profile modal for viewing a user's profile before accepting/rejecting
function ProfileModal({ person, onClose, onAccept, onReject, showActions, isMatch }: {
  person: DisplayCandidate;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  showActions: boolean;
  isMatch: boolean;
}) {
  const { t: tr } = useTranslation();
  const t = useTheme();

  // Horario semanal real — solo se pide y se muestra para matches confirmados (amigos).
  const [friendSchedule, setFriendSchedule] = useState<Set<string> | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    if (!isMatch) { setFriendSchedule(null); return; }
    let cancelled = false;
    setLoadingSchedule(true);
    userService.getDisponibilidad(person.id)
      .then(franjas => {
        if (cancelled) return;
        const keys = new Set<string>();
        franjas.forEach(f => {
          const di = SCHED_DAY_ENUM.indexOf(f.diaSemana);
          const si = SCHED_SLOTS.findIndex(s => s.horaInicio === f.horaInicio && s.horaFin === f.horaFin);
          if (di !== -1 && si !== -1) keys.add(`${di}-${si}`);
        });
        setFriendSchedule(keys);
      })
      .catch(() => { if (!cancelled) setFriendSchedule(new Set()); })
      .finally(() => { if (!cancelled) setLoadingSchedule(false); });
    return () => { cancelled = true; };
  }, [isMatch, person.id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        className="rounded-3xl border w-full max-w-sm overflow-hidden"
        style={{ background: t.cardBg, borderColor: t.cardBorder }}
        onClick={e => e.stopPropagation()}>
        {/* Hero */}
        <div className="relative h-40 flex items-center justify-center" style={{ background: person.foto ? undefined : person.gradient }}>
          {person.foto && (
            <img src={person.foto} alt={person.nombre} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            <ArrowLeft size={16} color="white" />
          </button>
          {!person.foto && (
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white/30 text-2xl font-bold text-white">
              {person.avatar}
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full z-10" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>{person.carrera}</span>
          </div>
        </div>
        <div className="p-5">
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: t.text }}>
            {person.nombre}{person.edad ? `, ${person.edad}` : ''}
          </h3>
          <p style={{ fontSize: '0.8rem', color: t.textMuted, marginBottom: '10px' }}>
            {person.carrera}{person.semestre ? ` · ${person.semestre}º sem.` : ''}
          </p>
          <p style={{ fontSize: '0.85rem', color: t.textSub, lineHeight: 1.6, marginBottom: '12px' }}>{person.bio}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {person.intereses.map(i => (
              <span key={i} className="px-2.5 py-1 rounded-full text-sm"
                style={{ background: 'var(--p-divider)', color: '#6C63FF' }}>{i}</span>
            ))}
          </div>

          {/* Horario semanal — solo visible una vez hay match confirmado (amigos) */}
          {isMatch ? (
            <div className="mb-5">
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: t.text, marginBottom: 8 }}>{tr('matching.weekly_availability')}</p>
              {loadingSchedule ? (
                <p style={{ fontSize: '0.78rem', color: t.textMuted }}>Cargando horario…</p>
              ) : friendSchedule && friendSchedule.size > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(6,1fr)', gap: 2, minWidth: 260 }}>
                    <div />
                    {SCHED_DAYS.map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: '0.58rem', fontWeight: 700, color: t.textMuted, paddingBottom: 2 }}>{d}</div>
                    ))}
                    {SCHED_SLOTS.map((slot, si) => (
                      <>
                        <div key={`l${si}`} style={{ fontSize: '0.53rem', color: t.textMuted, display: 'flex', alignItems: 'center' }}>{slot.start}</div>
                        {SCHED_DAYS.map((_, di) => {
                          const active = friendSchedule.has(`${di}-${si}`);
                          return (
                            <div key={`${di}-${si}`} style={{
                              height: 17, borderRadius: 4,
                              background: active ? 'linear-gradient(135deg,#6C63FF,#A78BFA)' : 'var(--p-divider)',
                              border: active ? 'none' : `1px solid ${t.cardBorder}`,
                            }} />
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: t.textMuted }}>{tr('matching.no_availability')}</p>
              )}
            </div>
          ) : person.disponibilidad && (
            <div className="flex items-center gap-2 mb-5">
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: t.text }}>{tr('matching.availability')}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'var(--p-divider)', color: '#6C63FF' }}>
                {DISPONIBILIDAD_LABEL[person.disponibilidad] ?? person.disponibilidad}
              </span>
            </div>
          )}

          {showActions && onAccept && onReject && (
            <div className="flex gap-3">
              <button onClick={onReject}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                style={{ color: '#FF4757', borderColor: 'rgba(255,71,87,0.3)', background: 'rgba(255,71,87,0.05)' }}>
                <X size={14} className="inline mr-1" /> {tr('matching.reject')}
              </button>
              <button onClick={onAccept}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#7FE7C4', color: '#0F0E1A' }}>
                <Check size={14} className="inline mr-1" /> {tr('matching.its_a_match')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Chat modal for matched users — NOTA: el chat real vive en el microservicio
// de Comunicación (fuera del alcance de esta integración); esto sigue siendo
// de Comunicación (fuera del alcance de esta integración); esto sigue siendo
// una simulación local hasta que se conecte ese servicio.
function ChatModal({ person, onClose }: { person: { name: string; avatar: string; gradient: string; foto?: string }; onClose: () => void }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const send = () => {
    if (!input.trim()) return;
    setMsgs(p => [...p, { id: p.length + 1, from: 'me', text: input, time: 'ahora' }]);
    setInput('');
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
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm overflow-hidden"
            style={{ background: person.gradient }}>
            {person.foto ? <img src={person.foto} alt={person.name} className="w-full h-full object-cover" /> : person.avatar}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: t.text }}>{person.name}</p>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7FE7C4' }} /><span style={{ fontSize: '0.65rem', color: '#7FE7C4' }}>{tr('matching.online')}</span></div>
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
  const { t: tr } = useTranslation();
  const t = useTheme();
  const { userId } = useAuth();
  const navigate = useNavigate();

  // ── Photo gate ──────────────────────────────────────────────────────────
  // Verifica si el usuario ya tiene foto de perfil. Sin foto no puede acceder
  // al feed de matching.
  const [checkingPhoto, setCheckingPhoto] = useState(true);
  const [hasPhoto, setHasPhoto] = useState(false);
  // URL de la foto de perfil ya guardada (se usa para mostrar en el gate y en el feed)
  const [myPhotoUrl, setMyPhotoUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setCheckingPhoto(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const perfil = await userService.getPerfil(userId);
        if (!cancelled && perfil.foto) {
          setHasPhoto(true);
          setMyPhotoUrl(perfil.foto);
          setPhotoPreview(perfil.foto); // pre-carga la foto existente en la preview
        }
      } catch {
        // 404 u otro error de red → tratamos como "sin foto todavía"
      } finally {
        if (!cancelled) setCheckingPhoto(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

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
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!photoPreview || !userId) return;

    // Si la foto ya es la guardada en el backend, acceso directo sin resubir
    if (myPhotoUrl && photoPreview === myPhotoUrl) {
      setHasPhoto(true);
      return;
    }

    if (!navigator.onLine) {
      setVerifyError('Sin conexión a internet. Verifica tu red e inténtalo de nuevo.');
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const [updated] = await Promise.all([
        userService.subirFotoPerfil(userId, photoPreview),
        new Promise(r => setTimeout(r, 1200)),
      ]);
      const url = updated.foto ?? photoPreview;
      setMyPhotoUrl(url);
      setPhotoPreview(url);
      setHasPhoto(true);
    } catch (e) {
      setVerifyError(friendlyError(e, 'No pudimos guardar tu foto. Intenta de nuevo.'));
    } finally {
      setVerifying(false);
    }
  };

  // ── Discover feed ───────────────────────────────────────────────────────
  const [candidates, setCandidates] = useState<DisplayCandidate[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);

  const loadDiscover = useCallback(async () => {
    setLoadingDiscover(true);
    try {
      const [sugerencias, solicitudIds] = await Promise.all([
        matchingService.obtenerSugerencias(20),
        matchingService.solicitudesRecibidas(),
      ]);
      const solicitudSet = new Set(solicitudIds);
      const display = await hydrate(sugerencias.map(s => ({ id: s.candidatoId, scoreTotal: s.scoreTotal })));
      setCandidates(display.map(c => ({
        ...c,
        hasPendingRequest: solicitudSet.has(c.id),
      })));
    } catch (e) {
      addToast({ type: 'info', title: 'No se pudo cargar el feed', message: friendlyError(e, 'Intenta de nuevo más tarde.') });
    } finally {
      setLoadingDiscover(false);
    }
  }, []);

  // ── Buscar usuarios directamente (sin esperar a que aparezcan en el feed) ──
  // No hay endpoint de búsqueda por nombre en el backend todavía: ampliamos el
  // pool de sugerencias y filtramos en el cliente por nombre/carrera.
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPool, setSearchPool] = useState<DisplayCandidate[] | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchSentTo, setSearchSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!searchTerm.trim() || searchPool !== null || loadingSearch) return;
    setLoadingSearch(true);
    (async () => {
      try {
        const [sugerencias, solicitudIds, matchesRaw] = await Promise.all([
          matchingService.obtenerSugerencias(200),
          matchingService.solicitudesRecibidas(),
          matchingService.listarMatches(),
        ]);
        const solicitudSet = new Set(solicitudIds);
        const entries = new Map<string, { id: string; scoreTotal?: number }>();
        sugerencias.forEach(s => entries.set(s.candidatoId, { id: s.candidatoId, scoreTotal: s.scoreTotal }));
        solicitudIds.forEach(id => { if (!entries.has(id)) entries.set(id, { id }); });
        matchesRaw.forEach(m => { if (!entries.has(m.otroUsuarioId)) entries.set(m.otroUsuarioId, { id: m.otroUsuarioId, scoreTotal: m.scoreTotal }); });

        const display = await hydrate(Array.from(entries.values()));
        setSearchPool(display.map(c => ({
          ...c,
          hasPendingRequest: solicitudSet.has(c.id),
        })));
      } catch (e) {
        addToast({ type: 'info', title: 'No se pudo buscar', message: friendlyError(e, 'Intenta de nuevo más tarde.') });
      } finally {
        setLoadingSearch(false);
      }
    })();
  }, [searchTerm, searchPool, loadingSearch]);

  const searchResults = (searchPool ?? []).filter(c => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return false;
    return c.nombre.toLowerCase().includes(q) || c.apellidos.toLowerCase().includes(q) || c.carrera.toLowerCase().includes(q);
  });

  const sendSearchRequest = async (person: DisplayCandidate) => {
    try {
      const res = await matchingService.decidir(person.id, 'LIKE');
      setSearchSentTo(prev => new Set(prev).add(person.id));
      if (res.matchConfirmado) {
        addToast({ type: 'match', title: '¡Es un Match!', message: `Tú y ${person.nombre} ahora son matches`, duration: 5000 });
      } else if (person.hasPendingRequest) {
        addToast({ type: 'info', title: 'Solicitud aceptada ✓', message: `Aceptaste la solicitud de ${person.nombre}` });
        setRequests(prev => prev.filter(r => r.id !== person.id));
      } else {
        addToast({ type: 'info', title: 'Solicitud enviada ✓', message: `Le enviaste una solicitud a ${person.nombre}` });
      }
    } catch (e) {
      addToast({ type: 'info', title: 'No se pudo enviar la solicitud', message: friendlyError(e, 'Intenta de nuevo.') });
    }
  };

  // ── Requests (incoming likes) ───────────────────────────────────────────
  const [requests, setRequests] = useState<DisplayCandidate[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const ids = await matchingService.solicitudesRecibidas();
      const display = await hydrate(ids.map(id => ({ id })));
      setRequests(display);
    } catch (e) {
      addToast({ type: 'info', title: 'No se pudieron cargar las solicitudes', message: friendlyError(e, 'Intenta de nuevo más tarde.') });
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  // ── Matches ──────────────────────────────────────────────────────────────
  const [matches, setMatches] = useState<(DisplayCandidate & { matchId: string })[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const raw: MatchResponse[] = await matchingService.listarMatches();
      const display = await hydrate(raw.map(m => ({ id: m.otroUsuarioId, scoreTotal: m.scoreTotal })));
      setMatches(display.map((d, i) => ({ ...d, matchId: raw[i].matchId })));
    } catch (e) {
      addToast({ type: 'info', title: 'No se pudieron cargar tus matches', message: friendlyError(e, 'Intenta de nuevo más tarde.') });
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  const [tab, setTab] = useState<TabId>('discover');
  useEffect(() => {
    if (!hasPhoto) return;
    if (tab === 'discover') loadDiscover();
    if (tab === 'requests') loadRequests();
    if (tab === 'matches') loadMatches();
  }, [tab, hasPhoto, loadDiscover, loadRequests, loadMatches]);

  const [viewProfile, setViewProfile] = useState<DisplayCandidate | null>(null);
  const [viewProfileIsMatch, setViewProfileIsMatch] = useState(false);
  const [chatWith, setChatWith] = useState<{ name: string; avatar: string; gradient: string; foto?: string } | null>(null);
  // Navegación al chat privado real (ChatsView) con el match pre-seleccionado.

  const current = candidates[0];
  const next = candidates[1];

  const swipe = async (dir: 'left' | 'right') => {
    if (!current || swipeDir) return;
    setSwipeDir(dir);
    const decision = dir === 'right' ? 'LIKE' : 'DESCARTE';
    try {
      const res = await matchingService.decidir(current.id, decision);
      if (res.matchConfirmado) {
        addToast({ type: 'match', title: '¡Es un Match!', message: `Tú y ${current.nombre} ahora son matches`, duration: 5000 });
      } else if (current.hasPendingRequest) {
        if (dir === 'right') {
          addToast({ type: 'info', title: 'Solicitud aceptada ✓', message: `Aceptaste la solicitud de ${current.nombre}` });
        } else {
          addToast({ type: 'info', title: 'Solicitud rechazada', message: `Rechazaste la solicitud de ${current.nombre}` });
        }
        setRequests(prev => prev.filter(r => r.id !== current.id));
      } else if (dir === 'right') {
        addToast({ type: 'info', title: 'Solicitud enviada ✓', message: `Le enviaste una solicitud a ${current.nombre}` });
      }
      setTimeout(() => {
        setCandidates(prev => prev.slice(1));
        setSwipeDir(null);
      }, 380);
    } catch (e) {
      setSwipeDir(null);
      addToast({ type: 'info', title: 'No se pudo registrar tu decisión', message: friendlyError(e, 'Intenta de nuevo.') });
    }
  };

  const decideOnRequest = async (person: DisplayCandidate, decision: 'LIKE' | 'DESCARTE') => {
    try {
      const res = await matchingService.decidir(person.id, decision);
      setRequests(p => p.filter(r => r.id !== person.id));
      setViewProfile(null);
      if (res.matchConfirmado) {
        addToast({ type: 'match', title: '¡Es un Match!', message: `Tú y ${person.nombre} ahora son matches`, duration: 5000 });
      }
    } catch (e) {
      addToast({ type: 'info', title: 'No se pudo procesar la solicitud', message: friendlyError(e, 'Intenta de nuevo.') });
    }
  };

  const openChat = (person: { id: string; name: string; avatar: string; gradient: string; foto?: string }) => {
    navigate('/app/chats', { state: { initialUserId: person.id } });
  };

  // ── Photo gate UI ────────────────────────────────────────────────────────
  if (checkingPhoto) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: t.textMuted, fontSize: '0.85rem' }}>Cargando...</p>
      </div>
    );
  }

  if (!hasPhoto) {
    return (
      <div className="h-full overflow-y-auto pt-6 pb-6 flex justify-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border overflow-hidden self-start"
          style={{ background: t.cardBg, borderColor: t.cardBorder, boxShadow: '0 24px 64px rgba(108,99,255,0.18)' }}>

          <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
            style={{ background: 'linear-gradient(135deg,#3B2F8E 0%,#6C63FF 60%,#9B55D4 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize: '14px 14px' }} />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.3)' }}>
                📸
              </div>
              <h2 style={{ fontWeight: 900, fontSize: '1.4rem', color: 'white', letterSpacing: '-0.02em', marginBottom: 8 }}>
                {tr('matching.photo_mandatory')}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
                {tr('matching.photo_desc')}
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {[tr('matching.feature_private'), tr('matching.feature_ai'), tr('matching.feature_real')].map(text => (
                <div key={text} className="flex items-center px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6C63FF', fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>

            <input type="file" accept="image/*" className="hidden" id="matching-photo-input" onChange={handlePhotoSelect} />

            {photoPreview ? (
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative">
                  <img src={photoPreview} alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4"
                    style={{ borderColor: '#6C63FF', boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }} />
                  {/* Solo mostrar ✕ si es una foto nueva (no la guardada) */}
                  {photoPreview !== myPhotoUrl && (
                    <button onClick={() => { setPhotoPreview(myPhotoUrl); setVerifyError(null); }}
                      className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                      style={{ background: '#FF4D6A', color: 'white', border: '2px solid white' }}>
                      ✕
                    </button>
                  )}
                </div>
                <div className="text-center">
                  {myPhotoUrl && photoPreview === myPhotoUrl ? (
                    <>
                      <p style={{ fontSize: '0.85rem', color: t.text, fontWeight: 600, marginBottom: 4 }}>
                        {tr('matching.current_photo')}
                      </p>
                      <label htmlFor="matching-photo-input"
                        className="text-xs cursor-pointer hover:underline"
                        style={{ color: '#6C63FF' }}>
                        {tr('matching.change_photo')}
                      </label>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: t.textMuted }}>
                      {tr('matching.photo_selected')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <motion.label htmlFor="matching-photo-input" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl border-2 border-dashed py-8 flex flex-col items-center gap-3 mb-6 transition-all hover:opacity-80 cursor-pointer"
                style={{ borderColor: 'rgba(108,99,255,0.4)', background: 'rgba(108,99,255,0.05)' }}>
                <span style={{ fontSize: '2.5rem' }}>📷</span>
                <div className="text-center">
                  <p style={{ fontWeight: 700, color: '#6C63FF', marginBottom: 4 }}>{tr('matching.upload_photo')}</p>
                  <p style={{ fontSize: '0.75rem', color: t.textMuted }}>{tr('matching.upload_limits')}</p>
                </div>
              </motion.label>
            )}

            {verifyError && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-4"
                style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>❌</span>
                <div>
                  <p style={{ fontSize: '0.82rem', color: '#FF4D6A', fontWeight: 600, marginBottom: 2 }}>{tr('matching.verify_failed')}</p>
                  <p style={{ fontSize: '0.78rem', color: '#FF4D6A', lineHeight: 1.5 }}>{verifyError}</p>
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={photoPreview && !verifying ? { scale: 1.02 } : {}}
              whileTap={photoPreview && !verifying ? { scale: 0.98 } : {}}
              onClick={handleVerify}
              disabled={!photoPreview || verifying}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-40"
              style={{ background: verifying ? 'rgba(108,99,255,0.6)' : 'linear-gradient(135deg,#6C63FF,#8B7FFF)', color: 'white',
                boxShadow: photoPreview && !verifying ? '0 8px 28px rgba(108,99,255,0.4)' : 'none' }}>
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}>⟳</motion.span>
                  {tr('matching.verifying')}
                </span>
              ) : myPhotoUrl && photoPreview === myPhotoUrl
                ? tr('matching.access_matching')
                : tr('matching.verify_access')
              }
            </motion.button>

            <p className="text-center mt-4" style={{ fontSize: '0.72rem', color: t.textMuted, lineHeight: 1.5 }}>
              {tr('matching.photo_warning')}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Modals */}
      <AnimatePresence>
        {viewProfile && (
          <ProfileModal
            person={viewProfile}
            onClose={() => setViewProfile(null)}
            onAccept={() => decideOnRequest(viewProfile, 'LIKE')}
            onReject={() => decideOnRequest(viewProfile, 'DESCARTE')}
            showActions={!viewProfileIsMatch}
            isMatch={viewProfileIsMatch}
          />
        )}
        {chatWith && <ChatModal person={chatWith} onClose={() => setChatWith(null)} />}
      </AnimatePresence>

      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between mb-6">
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: t.text }}>
            {tab === 'discover' ? tr('matching.discover_title') : tab === 'requests' ? tr('matching.requests_title') : tr('matching.matches_title')}
          </h2>
          <p style={{ fontSize: '0.82rem', color: t.textMuted }}>{tr('matching.subtitle')}</p>
        </div>
        <div className="flex gap-1 p-1 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
          {([
            { id: 'discover', label: tr('matching.tab_discover') },
            { id: 'requests', label: tr('matching.tab_requests', { count: requests.length }) },
            { id: 'matches', label: tr('matching.tab_matches', { count: matches.length }) },
          ] as { id: TabId; label: string }[]).map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className="text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all"
              style={{ background: tab === tb.id ? '#6C63FF' : 'transparent', color: tab === tb.id ? 'white' : t.textMuted }}>
              {tb.id === 'discover' && tr('matching.tab_discover')}
              {tb.id === 'requests' && (<><span>{tr('matching.tab_requests', { count: '' }).replace('()', '').trim()}</span><span className="hidden sm:inline"> ({requests.length})</span></>)}
              {tb.id === 'matches' && (<><span>{tr('matching.tab_matches', { count: '' }).replace('()', '').trim()}</span><span className="hidden sm:inline"> ({matches.length})</span></>)}
            </button>
          ))}
        </div>
      </div>

      {/* ── DISCOVER ── */}
      {tab === 'discover' && (
        <div className="flex flex-col items-center pb-6">
          <div className="relative w-full max-w-sm mb-5">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder={tr('matching.search_placeholder')}
              className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
              style={{ background: t.inputBg, border: `1px solid ${t.cardBorder}`, color: t.text }} />
          </div>

          {searchTerm.trim() ? (
            loadingSearch ? (
              <p style={{ color: t.textMuted, fontSize: '0.85rem', padding: '48px 0' }}>{tr('matching.searching')}</p>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border w-full max-w-sm" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                <Search size={32} style={{ color: t.textMuted, margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, color: t.text }}>{tr('matching.no_results', { query: searchTerm })}</p>
                <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '6px' }}>{tr('matching.try_another')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                {searchResults.map(person => {
                  const sent = searchSentTo.has(person.id);
                  return (
                    <div key={person.id} className="relative rounded-2xl overflow-hidden cursor-pointer group"
                      style={{ aspectRatio: '3/4', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
                      onClick={() => { setViewProfile(person); setViewProfileIsMatch(false); }}>
                      <div className="absolute inset-0" style={{ background: person.foto ? undefined : person.gradient }}>
                        {person.foto && <img src={person.foto} alt={person.nombre} className="w-full h-full object-cover" />}
                      </div>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)' }} />
                      {!person.foto && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '32%' }}>
                          <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl border-2 border-white/25"
                            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                            {person.avatar}
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p style={{ fontWeight: 800, fontSize: '0.88rem', color: 'white', lineHeight: 1.2 }}>
                          {person.nombre}{person.edad ? `, ${person.edad}` : ''}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px', marginBottom: '8px' }}>
                          {person.carrera}
                        </p>
                        <button onClick={e => { e.stopPropagation(); if (!sent) sendSearchRequest(person); }}
                          disabled={sent}
                          className="w-full py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-105 disabled:opacity-60"
                          style={{ background: sent ? 'rgba(127,231,196,0.15)' : 'rgba(127,231,196,0.3)', border: '1px solid rgba(127,231,196,0.6)' }}>
                          <Heart size={12} fill="#7FE7C4" style={{ color: '#7FE7C4' }} />
                          <span style={{ fontSize: '0.7rem', color: '#7FE7C4', fontWeight: 600 }}>
                            {sent ? 'Enviada' : person.hasPendingRequest ? 'Aceptar solicitud' : 'Solicitud'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : loadingDiscover ? (
            <p style={{ color: t.textMuted, fontSize: '0.85rem', padding: '48px 0' }}>{tr('matching.loading_suggestions')}</p>
          ) : !current ? (
            <div className="text-center py-16 rounded-2xl border w-full max-w-sm" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <Heart size={40} style={{ color: t.textMuted, margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, color: t.text }}>{tr('matching.no_more_suggestions')}</p>
              <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '6px' }}>{tr('matching.come_back_later')}</p>
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-sm" style={{ height: 'clamp(560px, 72vh, 660px)' }}>
                {next && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden"
                    style={{ background: next.foto ? undefined : next.gradient, transform: 'scale(0.94) translateY(14px)', zIndex: 1, opacity: 0.3, filter: 'blur(2px)' }}>
                    {next.foto && <img src={next.foto} alt="" className="w-full h-full object-cover" />}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div key={current.id}
                    initial={{ scale: 0.93, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotate: swipeDir === 'left' ? -22 : swipeDir === 'right' ? 22 : 0, x: swipeDir === 'left' ? -500 : swipeDir === 'right' ? 500 : 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="absolute inset-0 rounded-3xl overflow-hidden"
                    style={{ zIndex: 3, boxShadow: '0 28px 64px rgba(0,0,0,0.4), 0 6px 20px rgba(108,99,255,0.2)' }}>

                    <div className="absolute inset-0" style={{ background: current.foto ? undefined : current.gradient }}>
                      {current.foto && <img src={current.foto} alt={current.nombre} className="w-full h-full object-cover" />}
                    </div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.1) 70%, transparent 100%)' }} />

                    {!current.foto && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '38%' }}>
                        <div className="w-32 h-32 rounded-full flex items-center justify-center font-black text-white border-4 border-white/20"
                          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', fontSize: '3.2rem', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
                          {current.avatar}
                        </div>
                      </div>
                    )}

                    {current.scorePct != null && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full z-10"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                        <span style={{ fontSize: '0.72rem', color: '#7FE7C4', fontWeight: 700 }}>{current.scorePct}% match</span>
                      </div>
                    )}

                    {current.hasPendingRequest && (
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full z-10"
                        style={{ background: 'rgba(255,107,157,0.85)', backdropFilter: 'blur(8px)' }}>
                        <Heart size={11} fill="white" style={{ color: 'white' }} />
                        <span style={{ fontSize: '0.72rem', color: 'white', fontWeight: 700 }}>Solicitud pendiente</span>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <div className="flex items-end gap-3 mb-1">
                        <h3 style={{ fontWeight: 900, fontSize: '2rem', color: 'white', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                          {current.nombre}
                        </h3>
                        {current.edad && (
                          <span style={{ fontWeight: 700, fontSize: '1.6rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>{current.edad}</span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', marginBottom: '10px', fontWeight: 500 }}>
                        {current.carrera}{current.semestre ? ` · ${current.semestre}º sem.` : ''}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, marginBottom: '12px' }}>
                        {current.bio}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {current.intereses.slice(0, 3).map(interest => (
                          <span key={interest} className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: 'rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence>
                      {swipeDir === 'right' && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-start pl-8 z-20"
                          style={{ background: 'rgba(127,231,196,0.15)' }}>
                          <div className="px-5 py-2.5 rounded-2xl border-4 -rotate-12"
                            style={{ borderColor: '#7FE7C4', color: '#7FE7C4', background: 'rgba(0,0,0,0.25)', fontSize: '1.5rem', fontWeight: 900, backdropFilter: 'blur(4px)' }}>
                            {tr('matching.swipe_like')}
                          </div>
                        </motion.div>
                      )}
                      {swipeDir === 'left' && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-end pr-8 z-20"
                          style={{ background: 'rgba(255,71,87,0.15)' }}>
                          <div className="px-5 py-2.5 rounded-2xl border-4 rotate-12"
                            style={{ borderColor: '#FF4757', color: '#FF4757', background: 'rgba(0,0,0,0.25)', fontSize: '1.5rem', fontWeight: 900, backdropFilter: 'blur(4px)' }}>
                            {tr('matching.swipe_nope')}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-center gap-5 mt-5">
                <motion.button disabled
                  className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all opacity-40 cursor-not-allowed"
                  style={{ background: 'rgba(255,179,71,0.1)', borderColor: 'rgba(255,179,71,0.45)' }}
                  title="Volver atrás no está disponible: cada decisión se registra de inmediato en el backend">
                  <RotateCcw size={20} style={{ color: '#FFB347' }} />
                </motion.button>

                <motion.button onClick={() => swipe('right')} disabled={!!swipeDir}
                  whileHover={!swipeDir ? { scale: 1.1, boxShadow: '0 12px 36px rgba(127,231,196,0.55)' } : {}}
                  whileTap={!swipeDir ? { scale: 0.93 } : {}}
                  className="rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ width: 68, height: 68, background: 'linear-gradient(135deg, #7FE7C4, #5BC8FF)', boxShadow: '0 8px 28px rgba(127,231,196,0.45)' }}>
                  <Check size={30} color="white" strokeWidth={3} />
                </motion.button>

                <motion.button onClick={() => swipe('left')} disabled={!!swipeDir}
                  whileHover={!swipeDir ? { scale: 1.1, boxShadow: '0 8px 28px rgba(255,71,87,0.35)' } : {}}
                  whileTap={!swipeDir ? { scale: 0.92 } : {}}
                  className="rounded-full flex items-center justify-center border-2 transition-all disabled:opacity-50"
                  style={{ width: 68, height: 68, background: 'rgba(255,71,87,0.1)', borderColor: 'rgba(255,71,87,0.45)', boxShadow: '0 6px 20px rgba(255,71,87,0.18)' }}>
                  <X size={30} style={{ color: '#FF4757' }} />
                </motion.button>
              </div>

              <p style={{ fontSize: '0.7rem', color: t.textMuted, marginTop: '10px', textAlign: 'center' }}>
                {tr('matching.pass')} &nbsp;·&nbsp; {tr('matching.request')}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── REQUESTS (incoming) ── */}
      {tab === 'requests' && (
        <div className="max-w-2xl">
          {loadingRequests ? (
            <p style={{ color: t.textMuted, fontSize: '0.85rem', padding: '48px 0' }}>{tr('matching.loading_requests')}</p>
          ) : (
            <>
              {requests.length > 0 && (
                <div className="flex items-center gap-3 mb-5 px-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.15), rgba(108,99,255,0.15))', border: '1px solid rgba(255,107,157,0.3)' }}>
                    <Heart size={14} fill="#FF6B9D" style={{ color: '#FF6B9D' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FF6B9D' }}>
                      {requests.length === 1 ? tr('matching.people_requested', { count: 1 }) : tr('matching.people_requested_plural', { count: requests.length })}
                    </span>
                  </div>
                </div>
              )}

              {requests.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                  <Check size={40} style={{ color: '#7FE7C4', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, color: t.text }}>{tr('matching.all_requests_reviewed')}</p>
                  <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '6px' }}>{tr('matching.keep_exploring')}</p>
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

                      <div className="absolute inset-0" style={{ background: req.foto ? undefined : req.gradient }}>
                        {req.foto && <img src={req.foto} alt={req.nombre} className="w-full h-full object-cover" />}
                      </div>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)' }} />

                      {!req.foto && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '32%' }}>
                          <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl border-2 border-white/25"
                            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                            {req.avatar}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p style={{ fontWeight: 800, fontSize: '0.88rem', color: 'white', lineHeight: 1.2 }}>
                          {req.nombre}{req.edad ? `, ${req.edad}` : ''}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px', marginBottom: '8px' }}>
                          {req.carrera}
                        </p>

                        <div className="flex gap-2">
                          <button onClick={e => { e.stopPropagation(); decideOnRequest(req, 'DESCARTE'); }}
                            className="flex-1 py-1.5 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                            style={{ background: 'rgba(255,71,87,0.25)', border: '1px solid rgba(255,71,87,0.5)' }}>
                            <X size={14} style={{ color: '#FF6B6B' }} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); decideOnRequest(req, 'LIKE'); }}
                            className="flex-1 py-1.5 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                            style={{ background: 'rgba(127,231,196,0.3)', border: '1px solid rgba(127,231,196,0.6)' }}>
                            <Heart size={14} fill="#7FE7C4" style={{ color: '#7FE7C4' }} />
                          </button>
                        </div>
                      </div>

                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                        style={{ background: 'rgba(108,99,255,0.12)', border: '2px solid rgba(108,99,255,0.5)' }} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MATCHES ── */}
      {tab === 'matches' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
          {loadingMatches ? (
            <p style={{ color: t.textMuted, fontSize: '0.85rem', padding: '48px 0', gridColumn: '1 / -1' }}>{tr('matching.loading_matches')}</p>
          ) : matches.length === 0 ? (
            <div className="col-span-2 sm:col-span-3 text-center py-16 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <Heart size={48} style={{ color: t.textMuted, margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 600, color: t.text }}>{tr('matching.no_matches')}</p>
              <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '6px' }}>{tr('matching.start_sending_requests')}</p>
            </div>
          ) : matches.map(m => (
            <motion.div key={m.matchId} whileHover={{ y: -4 }}
              className="rounded-2xl border overflow-hidden"
              style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <div className="h-24 flex items-center justify-center overflow-hidden" style={{ background: m.foto ? undefined : m.gradient }}>
                {m.foto ? (
                  <img src={m.foto} alt={m.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {m.avatar}
                  </div>
                )}
              </div>
              <div className="p-4 text-center">
                <p style={{ fontWeight: 700, color: t.text }}>{m.nombre}</p>
                <p style={{ fontSize: '0.75rem', color: t.textMuted }}>
                  {m.carrera}{m.semestre ? ` · ${m.semestre}º sem.` : ''}
                </p>
                <button onClick={() => openChat({ id: m.id, name: m.nombre, avatar: m.avatar, gradient: m.gradient, foto: m.foto })}
                  className="mt-3 w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
                  style={{ background: '#6C63FF', color: 'white' }}>
                  <MessageCircle size={14} /> {tr('matching.send_message')}
                </button>
                <button onClick={() => { setViewProfile(m); setViewProfileIsMatch(true); }}
                  className="mt-2 w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-80 border"
                  style={{ color: t.text, borderColor: t.cardBorder, background: 'transparent' }}>
                  {tr('matching.view_profile')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
