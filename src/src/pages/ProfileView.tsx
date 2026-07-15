import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Camera, X, Loader2, GraduationCap, BookOpen, MapPin, Mail, User } from 'lucide-react';
import { InteresesPicker, CATEGORIAS } from '../components/InteresesPicker';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { userService, type PerfilResponse } from '../services/userService';
import { addToast } from '../components/ToastSystem';
import { friendlyError } from '../lib/errorMessages';

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS  = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const SLOTS = [
  { start: '7:00 AM',  end: '8:30 AM'  },
  { start: '9:00 AM',  end: '10:30 AM' },
  { start: '10:30 AM', end: '12:00 PM' },
  { start: '12:00 PM', end: '1:30 PM'  },
  { start: '1:30 PM',  end: '3:00 PM'  },
  { start: '3:00 PM',  end: '4:30 PM'  },
  { start: '4:30 PM',  end: '6:00 PM'  },
  { start: '6:00 PM',  end: '7:30 PM'  },
];
const CARRERAS = [
  'Ingeniería Civil', 'Ingeniería Eléctrica', 'Ingeniería de Sistemas',
  'Ingeniería Industrial', 'Ingeniería Electrónica', 'Economía',
  'Administración de Empresas', 'Matemáticas', 'Ingeniería Mecánica',
  'Ingeniería Biomédica', 'Ingeniería Ambiental', 'Ingeniería Estadística',
  'Ingeniería de Inteligencia Artificial', 'Ingeniería de Ciberseguridad',
  'Ingeniería en Biotecnología', 'Postgrado',
];
const SEMESTRES = ['1','2','3','4','5','6','7','8','9','10'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(nombre?: string, apellidos?: string, email?: string): string {
  const full = [nombre, apellidos].filter(Boolean).join(' ') || email || '?';
  return full.split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('');
}

function getSemestreLabel(s?: number | string): string {
  if (!s) return '';
  return `${s}mo semestre`;
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
interface EditModalProps {
  perfil: PerfilResponse;
  onClose: () => void;
  onSaved: (updated: PerfilResponse) => void;
  userId: string;
}

function EditModal({ perfil, onClose, onSaved, userId }: EditModalProps) {
  const t = useTheme();
  const { setUserName } = useAuth();
  const [tab, setTab] = useState<'datos' | 'intereses'>('datos');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre:        perfil.nombre    ?? '',
    apellidos:     perfil.apellidos ?? '',
    bio:           perfil.bio       ?? '',
    carrera:       perfil.carrera   ?? '',
    segundaCarrera:(perfil as any).segundaCarrera ?? '',
    semestre:      String(perfil.semestre ?? ''),
    genero:        perfil.genero    ?? '',
  });
  const [intereses, setIntereses] = useState<string[]>(perfil.intereses ?? []);

  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setError(null); };

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre no puede estar vacío.'); return; }
    setSaving(true);
    setError(null);
    try {
      const updated = await userService.updatePerfil(userId, {
        bio:      form.bio.trim() || undefined,
        carrera:  form.carrera  || undefined,
        semestre: form.semestre ? parseInt(form.semestre) : undefined,
        intereses,
      });
      // Guardar nombre+apellidos si cambiaron (endpoint separado o campo extra)
      const fullName = [form.nombre.trim(), form.apellidos.trim()].filter(Boolean).join(' ');
      setUserName(fullName);
      onSaved({ ...perfil, ...updated, nombre: form.nombre.trim(), apellidos: form.apellidos.trim(), intereses });
      addToast({ type: 'info', title: 'Perfil actualizado', message: 'Tus cambios fueron guardados.' });
      onClose();
    } catch (e: any) {
      setError(friendlyError(e, 'No se pudieron guardar los cambios.'));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '10px', fontSize: '0.88rem', outline: 'none',
    background: t.darkMode ? '#0F0F1E' : '#F5F3FF',
    border: `1.5px solid ${t.darkMode ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.2)'}`,
    color: t.text,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 600, color: t.darkMode ? '#C0BAE0' : '#3D3660',
    display: 'block', marginBottom: '6px',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        className="rounded-3xl border w-full max-w-lg max-h-[88vh] overflow-y-auto flex flex-col"
        style={{ background: t.darkMode ? '#1A1829' : '#FFFFFF', borderColor: 'rgba(108,99,255,0.3)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: t.divider }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: t.text }}>Editar Perfil</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: 'rgba(108,99,255,0.1)' }}>
            <X size={15} style={{ color: t.textMuted }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 mx-6 mt-4 rounded-xl flex-shrink-0" style={{ background: t.inputBg }}>
          {(['datos', 'intereses'] as const).map(k => (
            <button key={k} onClick={() => setTab(k)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: tab === k ? '#6C63FF' : 'transparent', color: tab === k ? 'white' : t.textMuted }}>
              {k === 'datos' ? 'Datos' : 'Intereses'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {tab === 'datos' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <input value={form.nombre} onChange={e => set('nombre', e.target.value)} style={inputStyle} placeholder="Tu nombre" />
                </div>
                <div>
                  <label style={labelStyle}>Apellidos</label>
                  <input value={form.apellidos} onChange={e => set('apellidos', e.target.value)} style={inputStyle} placeholder="Tus apellidos" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Biografía</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                  rows={3} placeholder="Cuéntanos sobre ti…"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={labelStyle}>Carrera</label>
                <select value={form.carrera} onChange={e => set('carrera', e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                  <option value="">Selecciona…</option>
                  {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Semestre</label>
                <div className="grid grid-cols-5 gap-2">
                  {SEMESTRES.map(s => (
                    <button key={s} onClick={() => set('semestre', s)}
                      className="py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: form.semestre === s ? '#6C63FF' : t.inputBg,
                        border: `1.5px solid ${form.semestre === s ? '#6C63FF' : 'rgba(108,99,255,0.2)'}`,
                        color: form.semestre === s ? 'white' : t.textMuted,
                      }}>
                      {s}°
                    </button>
                  ))}
                </div>
              </div>
              {error && <p style={{ fontSize: '0.8rem', color: '#FF4757', textAlign: 'center' }}>{error}</p>}
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#5250d0)', color: 'white' }}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando…</> : 'Guardar cambios'}
              </button>
            </>
          )}
          {tab === 'intereses' && (
            <>
              <InteresesPicker selected={intereses} onChange={setIntereses} minSelect={1} maxSelect={12} darkMode={t.darkMode} />
              <button onClick={handleSave} disabled={saving || intereses.length < 1}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#7FE7C4', color: '#0F0E1A' }}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando…</> : 'Guardar intereses'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ProfileView ──────────────────────────────────────────────────────────
export function ProfileView() {
  const t = useTheme();
  const { userId, userEmail } = useAuth();
  const [perfil, setPerfil] = useState<PerfilResponse | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [schedule, setSchedule] = useState<Set<string>>(new Set());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoadingPerfil(true);
    userService.getPerfil(userId)
      .then(data => setPerfil(data))
      .catch(() => setPerfil({}))
      .finally(() => setLoadingPerfil(false));
  }, [userId]);

  const toggleSlot = (key: string) =>
    setSchedule(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !userId) return;
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'reporte', title: 'Archivo inválido', message: 'El archivo debe ser una imagen (JPG, PNG, etc.)' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast({ type: 'reporte', title: 'Imagen muy grande', message: 'El máximo es 10 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploadingPhoto(true);
      try {
        const updated = await userService.updatePerfil(userId, { foto: dataUrl });
        setPerfil(prev => ({ ...prev, ...updated, foto: updated.foto ?? dataUrl }));
        addToast({ type: 'info', title: 'Foto actualizada', message: 'Tu foto de perfil fue guardada.' });
      } catch (err) {
        addToast({ type: 'reporte', title: 'No se pudo subir la foto', message: friendlyError(err, 'Intenta de nuevo.') });
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const initials    = getInitials(perfil?.nombre, perfil?.apellidos, userEmail ?? undefined);
  const fullName    = [perfil?.nombre, perfil?.apellidos].filter(Boolean).join(' ') || userEmail || 'Usuario';
  const carrera     = perfil?.carrera ?? '';
  const semestre    = perfil?.semestre ? getSemestreLabel(perfil.semestre) : '';
  const bio         = perfil?.bio ?? '';
  const interesIds  = perfil?.intereses ?? [];

  if (loadingPerfil) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 animate-spin"
            style={{ borderColor: 'rgba(108,99,255,0.2)', borderTopColor: '#6C63FF' }} />
          <p style={{ fontSize: '0.85rem', color: t.textMuted }}>Cargando perfil…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-10">
      {showEdit && userId && perfil && createPortal(
        <AnimatePresence>
          <EditModal
            perfil={perfil}
            userId={userId}
            onClose={() => setShowEdit(false)}
            onSaved={updated => setPerfil(updated)}
          />
        </AnimatePresence>,
        document.body
      )}

      {/* ── HERO ── */}
      <div className="rounded-3xl border mb-8 overflow-hidden"
        style={{ background: t.darkMode ? 'linear-gradient(160deg,#1A1829,#221E38)' : t.cardBg, borderColor: t.cardBorder }}>

        {/* Banner */}
        <div className="h-36 relative" style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#A78BFA 55%,#7FE7C4 100%)' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.35) 100%)' }} />
        </div>

        <div className="px-8 pb-8">
          {/* Avatar + edit button */}
          <div className="flex items-end justify-between -mt-14 mb-6">
            <div className="relative">
              {perfil?.foto ? (
                <img src={perfil.foto} alt={fullName}
                  className="w-28 h-28 rounded-full object-cover border-4"
                  style={{ borderColor: t.darkMode ? '#1A1829' : '#fff' }} />
              ) : (
                <div className="w-28 h-28 rounded-full flex items-center justify-center border-4"
                  style={{ background: 'linear-gradient(135deg,#6C63FF,#7FE7C4)', borderColor: t.darkMode ? '#1A1829' : '#fff', fontSize: '2.2rem', fontWeight: 900, color: 'white' }}>
                  {initials}
                </div>
              )}
              <input type="file" accept="image/*" id="profile-photo-input" className="hidden" onChange={handlePhotoChange} disabled={uploadingPhoto} />
              <label htmlFor="profile-photo-input" title="Cambiar foto de perfil"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: '#6C63FF', boxShadow: '0 2px 8px rgba(108,99,255,0.5)' }}>
                {uploadingPhoto ? <Loader2 size={13} color="white" className="animate-spin" /> : <Camera size={13} color="white" />}
              </label>
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full border-2"
                style={{ background: '#7FE7C4', borderColor: t.darkMode ? '#1A1829' : '#fff' }} />
            </div>
            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-90 mb-1"
              style={{ background: 'rgba(108,99,255,0.12)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.25)' }}>
              <Edit2 size={14} /> Editar perfil
            </button>
          </div>

          {/* Name + program */}
          <h2 style={{ fontWeight: 900, fontSize: '1.6rem', color: t.text, marginBottom: '4px', lineHeight: 1.1 }}>
            {fullName}
          </h2>
          <p style={{ fontSize: '0.9rem', color: t.textMuted, marginBottom: '14px' }}>
            {[carrera, semestre, 'ECI'].filter(Boolean).join(' · ')}
          </p>

          {/* Bio */}
          {bio ? (
            <p style={{ fontSize: '0.92rem', color: t.textSub, lineHeight: 1.75, marginBottom: '24px', maxWidth: '560px' }}>
              {bio}
            </p>
          ) : (
            <button onClick={() => setShowEdit(true)}
              style={{ fontSize: '0.88rem', color: t.textMuted, marginBottom: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              + Añadir una biografía
            </button>
          )}

          {/* Stats */}
          <div className="flex gap-7">
            {[
              { label: 'Conexiones', value: '—',              color: '#6C63FF' },
              { label: 'Parches',    value: '—',              color: '#7FE7C4' },
              { label: 'Disponible', value: `${schedule.size}h`, color: '#FFB347' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.72rem', color: t.textMuted, marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT — 2-col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — info + intereses */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sobre mí */}
          <div className="rounded-2xl border p-6" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: t.text, marginBottom: '16px' }}>Sobre mí</h3>
            <div className="space-y-3">
              {carrera   && <div className="flex items-center gap-3"><GraduationCap size={15} style={{ color: t.textMuted }} /><span style={{ fontSize: '0.87rem', color: t.textSub }}>{carrera}</span></div>}
              {semestre  && <div className="flex items-center gap-3"><BookOpen size={15} style={{ color: t.textMuted }} /><span style={{ fontSize: '0.87rem', color: t.textSub }}>{semestre}</span></div>}
              <div className="flex items-center gap-3"><MapPin size={15} style={{ color: t.textMuted }} /><span style={{ fontSize: '0.87rem', color: t.textSub }}>Escuela Colombiana de Ingeniería</span></div>
              {userEmail && <div className="flex items-center gap-3"><Mail size={15} style={{ color: t.textMuted }} /><span style={{ fontSize: '0.87rem', color: t.textSub }}>{userEmail}</span></div>}
              {perfil?.genero && perfil.genero !== 'nd' && (
                <div className="flex items-center gap-3"><User size={15} style={{ color: t.textMuted }} /><span style={{ fontSize: '0.87rem', color: t.textSub, textTransform: 'capitalize' }}>{perfil.genero}</span></div>
              )}
            </div>
          </div>

          {/* Intereses */}
          <div className="rounded-2xl border p-6" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: t.text }}>Intereses</h3>
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:opacity-80 transition-all"
                style={{ background: t.inputBg, color: '#6C63FF', border: '1px solid rgba(108,99,255,0.2)' }}>
                <Edit2 size={12} /> Editar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {interesIds.map(id => {
                  let label = id; let emoji = '🏷️';
                  for (const cat of CATEGORIAS) {
                    const int = cat.intereses.find(i => i.id === id);
                    if (int) { label = int.label; emoji = cat.emoji; break; }
                  }
                  return (
                    <motion.span key={id}
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer hover:opacity-80"
                      onClick={() => setShowEdit(true)}
                      style={{ background: 'rgba(108,99,255,0.1)', color: '#8B7FFF', border: '1px solid rgba(108,99,255,0.2)' }}>
                      <span style={{ fontSize: '0.78rem' }}>{emoji}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{label}</span>
                    </motion.span>
                  );
                })}
              </AnimatePresence>
              {interesIds.length === 0 && (
                <button onClick={() => setShowEdit(true)}
                  className="px-4 py-2 rounded-xl text-sm border-dashed border-2 hover:opacity-70"
                  style={{ color: t.textMuted, borderColor: 'rgba(108,99,255,0.3)' }}>
                  + Añadir intereses
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right — schedule */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border overflow-hidden" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: t.divider }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: t.text }}>Disponibilidad semanal</h3>
                <p style={{ fontSize: '0.72rem', color: t.textMuted, marginTop: '2px' }}>Toca una franja para marcarla como disponible</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(127,231,196,0.12)', color: '#7FE7C4', border: '1px solid rgba(127,231,196,0.25)' }}>
                {schedule.size} franjas
              </span>
            </div>
            <div className="p-4">
              <div className="grid mb-1" style={{ gridTemplateColumns: '64px repeat(6, 1fr)', gap: '4px' }}>
                <div />
                {DAYS.map(d => (
                  <div key={d} className="text-center py-2">
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: t.textMuted, letterSpacing: '0.06em' }}>{d}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {SLOTS.map((slot, si) => (
                  <div key={si} className="grid items-center" style={{ gridTemplateColumns: '64px repeat(6, 1fr)', gap: '4px' }}>
                    <div className="pr-2 text-right">
                      <p style={{ fontSize: '0.6rem', color: t.textMuted, lineHeight: 1.3 }}>{slot.start}</p>
                      <p style={{ fontSize: '0.6rem', color: t.textMuted, lineHeight: 1.3, opacity: 0.6 }}>{slot.end}</p>
                    </div>
                    {DAYS.map((_, di) => {
                      const key = `${di}-${si}`;
                      const active = schedule.has(key);
                      return (
                        <motion.button key={di} onClick={() => toggleSlot(key)}
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          className="w-full rounded-xl flex items-center justify-center transition-all"
                          style={{ height: 44, background: active ? 'linear-gradient(135deg,#6C63FF,#A78BFA)' : t.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: active ? '1.5px solid rgba(108,99,255,0.5)' : `1.5px solid ${t.darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`, boxShadow: active ? '0 4px 14px rgba(108,99,255,0.3)' : 'none', cursor: 'pointer' }}>
                          {active && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-white" style={{ opacity: 0.9 }} />}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: t.divider }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg,#6C63FF,#A78BFA)' }} />
                  <span style={{ fontSize: '0.72rem', color: t.textMuted }}>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border" style={{ background: t.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: t.divider }} />
                  <span style={{ fontSize: '0.72rem', color: t.textMuted }}>No disponible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
