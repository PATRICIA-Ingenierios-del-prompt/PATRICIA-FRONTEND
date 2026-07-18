import { useState, useRef, useCallback } from 'react';
import { Check, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { InteresesPicker } from '../components/InteresesPicker';
import logoNuevoOscuroImg from '../assets/logoNuevoOscuro.png';
import logoNuevoClaroImg from '../assets/logoNuevoClaro.png';
import { motion, AnimatePresence } from 'motion/react';
import { userService, type OnboardingPayload } from '../services/userService';
import { useAuth } from '../store/AuthContext';
import { friendlyError } from '../lib/errorMessages';
import { useTranslation } from 'react-i18next';

// ── Types ──────────────────────────────────────────────────────────────────
interface OnboardingViewProps {
  onComplete: () => void;
  darkMode: boolean;
}

interface FormData {
  nombre: string;
  apellidos: string;
  carrera: string;
  segundaCarrera: string;
  semestre: string;
  fechaNacimiento: string;
  genero: string;
  foto: string;
  intereses: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────
const ECI_CARRERAS = [
  'Ingeniería Civil', 'Ingeniería Eléctrica', 'Ingeniería de Sistemas',
  'Ingeniería Industrial', 'Ingeniería Electrónica', 'Economía',
  'Administración de Empresas', 'Matemáticas', 'Ingeniería Mecánica',
  'Ingeniería Biomédica', 'Ingeniería Ambiental', 'Ingeniería Estadística',
  'Ingeniería de Inteligencia Artificial', 'Ingeniería de Ciberseguridad',
  'Ingeniería en Biotecnología', 'Postgrado',
];
const SEMESTRES = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°'];
const getGeneros = (tr: any) => [
  { id: 'masculino', label: tr('onboarding.gender_male') },
  { id: 'femenino',  label: tr('onboarding.gender_female') },
  { id: 'otro',      label: tr('onboarding.gender_other') },
  { id: 'nd',        label: tr('onboarding.gender_prefer_not_to_say') },
];
const getStepMeta = (tr: any) => [
  { title: tr('onboarding.step1_title'),    sub: tr('onboarding.step1_sub') },
  { title: tr('onboarding.step2_title'), sub: tr('onboarding.step2_sub') },
  { title: tr('onboarding.step3_title'),        sub: tr('onboarding.step3_sub') },
];

// ── Shared styles helper ────────────────────────────────────────────────────
const inputStyle = (focused: boolean, dark: boolean, error?: boolean): React.CSSProperties => ({
  background: dark ? '#0F0F1E' : '#F5F3FF',
  border: `1.5px solid ${error ? '#FF4757' : focused ? '#00D9FF' : 'rgba(108,99,255,0.3)'}`,
  color: dark ? '#E0E0FF' : '#1A1829',
  borderRadius: '12px',
  padding: '14px 16px',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(255,71,87,0.12)' : 'rgba(0,217,255,0.1)'}` : 'none',
});
const labelStyle = (dark: boolean): React.CSSProperties => ({
  fontSize: '0.82rem', fontWeight: 600,
  color: dark ? '#C0BAE0' : '#3D3660',
  display: 'block', marginBottom: '7px',
});

// ── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ step, total, dark }: { step: number; total: number; dark: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map((s, i) => (
        <div key={s} className="flex items-center">
          <motion.div
            animate={step >= s ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
            style={{
              background: step > s ? '#6C63FF' : step === s ? (dark ? '#0F0F1E' : '#EDE9FF') : 'transparent',
              borderColor: step >= s ? '#6C63FF' : 'rgba(108,99,255,0.25)',
            }}>
            {step > s
              ? <Check size={14} color="white" />
              : <span style={{ fontSize: '0.78rem', fontWeight: 700, color: step === s ? '#6C63FF' : dark ? '#444' : '#8B85B0' }}>{s}</span>
            }
            {step === s && (
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2" style={{ borderColor: '#6C63FF' }} />
            )}
          </motion.div>
          {i < total - 1 && (
            <div className="w-8 h-0.5 relative overflow-hidden" style={{ background: 'rgba(108,99,255,0.15)' }}>
              <motion.div animate={{ width: step > s ? '100%' : '0%' }} transition={{ duration: 0.5 }}
                className="absolute inset-y-0 left-0" style={{ background: '#6C63FF' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const MIN_AGE = 15;
const MAX_AGE = 90;

function computeAge(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null;
  const birth = new Date(fechaNacimiento);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// ── Step 1: Datos Básicos ──────────────────────────────────────────────────
function StepDatosBasicos({ data, setData, onNext, dark }: {
  data: FormData; setData: (fn: (d: FormData) => FormData) => void;
  onNext: () => void; dark: boolean;
}) {
  const { t: tr } = useTranslation();
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const set = (k: keyof FormData, v: string) => setData(d => ({ ...d, [k]: v }));

  const handleNext = () => {
    const errs: Record<string, string> = {};
    if (!data.nombre.trim())    errs.nombre    = tr('onboarding.name_required');
    if (!data.apellidos.trim()) errs.apellidos = tr('onboarding.lastname_required');
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  };

  const muted = dark ? '#999' : '#6B6490';
  const canContinue = !!data.nombre.trim() && !!data.apellidos.trim();

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }} className="space-y-5">
      <div>
        <label style={labelStyle(dark)}>{tr('onboarding.name_label')}</label>
        <input value={data.nombre} onChange={e => set('nombre', e.target.value)}
          onFocus={() => setFocused('nombre')} onBlur={() => setFocused(null)}
          placeholder={tr('onboarding.name_placeholder')}
          style={inputStyle(focused === 'nombre', dark, !!errors.nombre)} />
        {errors.nombre && <p style={{ fontSize: '0.72rem', color: '#FF4757', marginTop: '4px' }}>{errors.nombre}</p>}
      </div>
      <div>
        <label style={labelStyle(dark)}>{tr('onboarding.lastname_label')}</label>
        <input value={data.apellidos} onChange={e => set('apellidos', e.target.value)}
          onFocus={() => setFocused('apellidos')} onBlur={() => setFocused(null)}
          placeholder={tr('onboarding.lastname_placeholder')}
          style={inputStyle(focused === 'apellidos', dark, !!errors.apellidos)} />
        {errors.apellidos && <p style={{ fontSize: '0.72rem', color: '#FF4757', marginTop: '4px' }}>{errors.apellidos}</p>}
      </div>
      <motion.button onClick={handleNext} disabled={!canContinue}
        whileHover={canContinue ? { scale: 1.02 } : {}} whileTap={canContinue ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all disabled:opacity-40"
        style={{ background: canContinue ? 'linear-gradient(135deg,#6C63FF,#5250d0)' : 'rgba(108,99,255,0.3)', color: 'white' }}>
        {tr('onboarding.continue')} <ChevronRight size={18} />
      </motion.button>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: muted }}>{tr('onboarding.step_1_of_3')}</p>
    </motion.div>
  );
}

// ── Step 2: Perfil Académico + Género + Foto ───────────────────────────────
function StepPerfil({ data, setData, onNext, onBack, dark, userId }: {
  data: FormData; setData: (fn: (d: FormData) => FormData) => void;
  onNext: () => void; onBack: () => void; dark: boolean; userId: string | null;
}) {
  const { t: tr } = useTranslation();
  const [focused, setFocused] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [verifyingPhoto, setVerifyingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof FormData, v: string) => setData(d => ({ ...d, [k]: v }));

  const handleFile = useCallback(async (file: File) => {
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;

      // Si tenemos userId validamos con el backend (detecta persona)
      if (userId) {
        setVerifyingPhoto(true);
        try {
          const result = await userService.subirFotoPerfil(userId, dataUrl);
          if (result.tienePersonaEnFoto === false) {
            setPhotoError(tr('onboarding.invalid_photo'));
            return;
          }
          // Guardamos la URL ya subida al backend (o el dataUrl como fallback)
          set('foto', result.foto ?? dataUrl);
        } catch {
          // Si falla la validación, guardamos el dataUrl igualmente para no bloquear
          set('foto', dataUrl);
        } finally {
          setVerifyingPhoto(false);
        }
      } else {
        // Sin userId (raro) guardamos directamente
        set('foto', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }, [userId]);

  const muted   = dark ? '#999' : '#6B6490';
  const text    = dark ? '#E0E0FF' : '#1A1829';
  const idleBg  = dark ? 'rgba(108,99,255,0.05)' : '#F5F3FF';
  const idleBd  = dark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.25)';
  const selBg   = dark ? 'rgba(108,99,255,0.18)' : 'rgba(108,99,255,0.1)';
  const age = computeAge(data.fechaNacimiento);
  const ageInRange = age === null || (age >= MIN_AGE && age <= MAX_AGE);
  const canContinue = !!data.carrera && !!data.semestre && !!data.fechaNacimiento && ageInRange;

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }} className="space-y-5">

      {/* ── Datos académicos ── */}
      <div className="rounded-2xl p-4 border" style={{ borderColor: 'rgba(108,99,255,0.2)', background: idleBg }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: text, marginBottom: '14px' }}>{tr('onboarding.academic_data')}</p>
        <div className="mb-4">
          <label style={labelStyle(dark)}>{tr('onboarding.career_label')}</label>
          <div className="relative">
            <select value={data.carrera} onChange={e => set('carrera', e.target.value)}
              onFocus={() => setFocused('carrera')} onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focused === 'carrera', dark), appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', paddingRight: '36px' }}>
              <option value="" disabled style={{ background: dark ? '#1A1A2E' : '#fff' }}>{tr('onboarding.select_career')}</option>
              {ECI_CARRERAS.map(c => <option key={c} value={c} style={{ background: dark ? '#1A1A2E' : '#fff', color: dark ? '#E0E0FF' : '#1A1829' }}>{c}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke={focused === 'carrera' ? '#00D9FF' : '#8B85B0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label style={labelStyle(dark)}>{tr('onboarding.second_career_label')} <span style={{ color: muted, fontWeight: 400, fontSize: '0.75rem' }}>{tr('onboarding.optional')}</span></label>
          <div className="relative">
            <select value={data.segundaCarrera} onChange={e => set('segundaCarrera', e.target.value)}
              onFocus={() => setFocused('segunda')} onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focused === 'segunda', dark), appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', paddingRight: '36px' }}>
              <option value="" style={{ background: dark ? '#1A1A2E' : '#fff' }}>{tr('onboarding.none')}</option>
              {ECI_CARRERAS.filter(c => c !== data.carrera).map(c => <option key={c} value={c} style={{ background: dark ? '#1A1A2E' : '#fff' }}>{c}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#8B85B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
        <div>
          <label style={labelStyle(dark)}>{tr('onboarding.semester_label')}</label>
          <div className="grid grid-cols-5 gap-2">
            {SEMESTRES.map((s, i) => {
              const val = String(i + 1);
              const active = data.semestre === val;
              return (
                <motion.button key={s} onClick={() => set('semestre', val)}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: active ? '#6C63FF' : idleBg, border: `1.5px solid ${active ? '#6C63FF' : idleBd}`, color: active ? 'white' : muted, boxShadow: active ? '0 4px 14px rgba(108,99,255,0.35)' : 'none' }}>
                  {s}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Fecha nacimiento ── */}
      <div>
        <label style={labelStyle(dark)}>{tr('onboarding.birthdate_label')}</label>
        <input type="date" value={data.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)}
          onFocus={() => setFocused('fecha')} onBlur={() => setFocused(null)}
          max={new Date().toISOString().slice(0, 10)}
          style={inputStyle(focused === 'fecha', dark, !ageInRange)}
          className={dark ? '[color-scheme:dark]' : '[color-scheme:light]'} />
        {!ageInRange && (
          <p style={{ fontSize: '0.75rem', color: '#FF4757', marginTop: '6px', lineHeight: 1.4 }}>
            {tr('onboarding.age_range_error', { min: MIN_AGE, max: MAX_AGE })}
          </p>
        )}
      </div>

      {/* ── Género ── */}
      <div>
        <label style={labelStyle(dark)}>{tr('onboarding.gender_label')}</label>
        <div className="grid grid-cols-2 gap-2">
          {getGeneros(tr).map(g => (
            <button key={g.id} onClick={() => set('genero', g.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
              style={{ background: data.genero === g.id ? selBg : idleBg, border: `1.5px solid ${data.genero === g.id ? '#6C63FF' : idleBd}`, color: data.genero === g.id ? text : muted }}>
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: data.genero === g.id ? '#6C63FF' : (dark ? '#444' : '#bbb') }}>
                {data.genero === g.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}
                    className="w-2 h-2 rounded-full" style={{ background: '#6C63FF' }} />
                )}
              </div>
              <span style={{ fontWeight: data.genero === g.id ? 600 : 400 }}>{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Foto de perfil ── */}
      <div>
        <label style={labelStyle(dark)}>{tr('onboarding.profile_photo_label')} <span style={{ color: muted, fontWeight: 400 }}>{tr('onboarding.optional')}</span></label>
        <div onClick={() => !verifyingPhoto && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && !verifyingPhoto) handleFile(f); }}
          className="relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden"
          style={{
            borderColor: photoError ? '#FF4757' : dragOver ? '#00D9FF' : 'rgba(108,99,255,0.25)',
            background: dragOver ? 'rgba(0,217,255,0.05)' : idleBg,
            height: data.foto ? 120 : 90,
            cursor: verifyingPhoto ? 'default' : 'pointer',
          }}>
          {verifyingPhoto ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={20} style={{ color: '#6C63FF' }} className="animate-spin" />
              <p style={{ fontSize: '0.8rem', color: dark ? '#C0BAE0' : '#6B6490', fontWeight: 500 }}>{tr('onboarding.verifying_photo')}</p>
            </div>
          ) : data.foto ? (
            <>
              <img src={data.foto} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span style={{ fontSize: '0.82rem', color: 'white', fontWeight: 600 }}>{tr('onboarding.change_photo')}</span>
              </div>
            </>
          ) : (
            <>
              <Upload size={20} style={{ color: '#6C63FF', marginBottom: '5px' }} />
              <p style={{ fontSize: '0.8rem', color: dark ? '#C0BAE0' : '#6B6490', fontWeight: 500 }}>{tr('onboarding.drag_or_click')}</p>
              <p style={{ fontSize: '0.68rem', color: muted, marginTop: '2px' }}>{tr('onboarding.photo_limits')}</p>
            </>
          )}
        </div>
        {photoError && (
          <p style={{ fontSize: '0.75rem', color: '#FF4757', marginTop: '6px', lineHeight: 1.4 }}>{photoError}</p>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>

      <motion.button onClick={onNext} disabled={!canContinue || verifyingPhoto}
        whileHover={canContinue && !verifyingPhoto ? { scale: 1.02 } : {}} whileTap={canContinue && !verifyingPhoto ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all disabled:opacity-40"
        style={{ background: canContinue ? 'linear-gradient(135deg,#6C63FF,#5250d0)' : 'rgba(108,99,255,0.3)', color: 'white' }}>
        {verifyingPhoto
          ? <><Loader2 size={16} className="animate-spin" /> {tr('onboarding.verifying_photo')}</>
          : <>{tr('onboarding.continue')} <ChevronRight size={18} /></>
        }
      </motion.button>
      <button onClick={onBack} style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem', color: muted, background: 'none', border: 'none', cursor: 'pointer' }}>
        {tr('onboarding.back')}
      </button>
    </motion.div>
  );
}

// ── Step 3: Intereses ──────────────────────────────────────────────────────
function StepIntereses({ data, setData, onFinish, onBack, loading, dark }: {
  data: FormData; setData: (fn: (d: FormData) => FormData) => void;
  onFinish: () => void; onBack: () => void; loading: boolean; dark: boolean;
}) {
  const { t: tr } = useTranslation();
  const selected = data.intereses;
  const valid = selected.length >= 3 && selected.length <= 12;
  const muted = dark ? '#999' : '#6B6490';

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }} className="space-y-5">
      <div className="text-center">
        <p style={{ fontSize: '0.88rem', color: muted }}>{tr('onboarding.choose_interests')}</p>
        <p style={{ fontSize: '0.78rem', color: muted, marginTop: '2px' }}>{tr('onboarding.interests_limits')}</p>
      </div>
      <InteresesPicker
        selected={selected}
        onChange={ids => setData(d => ({ ...d, intereses: ids }))}
        darkMode={dark}
      />
      <motion.button onClick={onFinish} disabled={!valid || loading}
        whileHover={valid ? { scale: 1.02, boxShadow: '0 8px 32px rgba(108,99,255,0.45)' } : {}}
        whileTap={valid ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all disabled:opacity-40"
        style={{ background: valid ? '#7FE7C4' : 'rgba(85,85,85,0.4)', color: valid ? '#0F0E1A' : '#888' }}>
        {loading
          ? <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          : <>{tr('onboarding.complete_registration')} <ChevronRight size={18} /></>
        }
      </motion.button>
      <button onClick={onBack} style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem', color: muted, background: 'none', border: 'none', cursor: 'pointer' }}>
        {tr('onboarding.back')}
      </button>
    </motion.div>
  );
}

// ── Main OnboardingView ────────────────────────────────────────────────────
export function OnboardingView({ onComplete, darkMode }: OnboardingViewProps) {
  const { t: tr } = useTranslation();
  const { userId, userEmail, setUserName } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    nombre: '', apellidos: '', carrera: '', segundaCarrera: '',
    semestre: '', fechaNacimiento: '', genero: '', foto: '', intereses: [],
  });

  const dark = darkMode;
  const cardBg = dark ? '#1A1A2E' : '#FFFFFF';
  const textCol = dark ? '#E0E0FF' : '#1A1829';
  const mutedCol = dark ? '#999' : '#6B6490';

  const handleFinish = async () => {
    if (!userId) { setError(tr('onboarding.missing_id')); return; }
    setLoading(true);
    setError('');
    try {
      const payload: OnboardingPayload = {
        nombre:           formData.nombre.trim(),
        apellidos:        formData.apellidos.trim(),
        carrera:          formData.carrera,
        ...(formData.segundaCarrera ? { segundaCarrera: formData.segundaCarrera } : {}),
        semestre:         parseInt(formData.semestre, 10),
        fechaNacimiento:  formData.fechaNacimiento,
        ...(formData.genero ? { genero: formData.genero } : {}),
        // La foto ya fue subida y validada en StepPerfil vía subirFotoPerfil.
        // Solo la reenviamos si es un dataUrl crudo (sin userId durante la subida).
        ...(formData.foto && formData.foto.startsWith('data:') ? { foto: formData.foto } : {}),
        intereses:        formData.intereses,
      };
      await userService.completarOnboarding(userId, payload);
      // Actualizar el nombre en el contexto de auth para que el saludo sea inmediato
      setUserName(`${payload.nombre} ${payload.apellidos}`);
      onComplete();
    } catch (err: any) {
      setError(friendlyError(err, tr('onboarding.save_error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground light={!dark} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-[480px] relative z-10">
        <div className="rounded-[20px] p-6 sm:p-9 relative overflow-hidden"
          style={{ background: cardBg, border: '1px solid rgba(108,99,255,0.25)', boxShadow: dark ? '0 0 60px rgba(0,217,255,0.06), 0 24px 64px rgba(0,0,0,0.4)' : '0 8px 40px rgba(108,99,255,0.12)' }}>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), transparent)' }} />

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <ImageWithFallback src={dark ? logoNuevoOscuroImg : logoNuevoClaroImg} alt="U•link"
              className="object-contain" style={{ height: 56, width: 'auto' }} />
          </div>

          <ProgressBar step={step} total={3} dark={dark} />

          {/* Step title */}
          <div className="text-center mb-6">
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: textCol, marginBottom: '4px' }}>
              {getStepMeta(tr)[step - 1].title}
            </h1>
            <p style={{ fontSize: '0.85rem', color: mutedCol }}>{getStepMeta(tr)[step - 1].sub}</p>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepDatosBasicos key="step1" data={formData} setData={setFormData}
                onNext={() => setStep(2)} dark={dark} />
            )}
            {step === 2 && (
              <StepPerfil key="step2" data={formData} setData={setFormData}
                onNext={() => setStep(3)} onBack={() => setStep(1)} dark={dark} userId={userId} />
            )}
            {step === 3 && (
              <StepIntereses key="step3" data={formData} setData={setFormData}
                onFinish={handleFinish} onBack={() => setStep(2)} loading={loading} dark={dark} />
            )}
          </AnimatePresence>

          {/* Error global */}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center mt-4" style={{ fontSize: '0.78rem', color: '#FF4757' }}>
              {error}
            </motion.p>
          )}

          {/* Footer */}
          <p className="text-center mt-5" style={{ fontSize: '0.72rem', color: mutedCol }}>
            {userEmail && <>{tr('onboarding.registered_as')} <span style={{ color: dark ? '#7FE7C4' : '#0D9D74', fontWeight: 600 }}>{userEmail}</span></>}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
