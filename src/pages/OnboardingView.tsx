import { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
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
const GENEROS = [
  { id: 'masculino' },
  { id: 'femenino' },
  { id: 'otro' },
  { id: 'nd' },
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
  const { t } = useTranslation();
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const set = (k: keyof FormData, v: string) => setData(d => ({ ...d, [k]: v }));

  const handleNext = () => {
    const errs: Record<string, string> = {};
    if (!data.nombre.trim())    errs.nombre    = t('onboarding.name_required');
    if (!data.apellidos.trim()) errs.apellidos = t('onboarding.surname_required');
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  };

  const muted = dark ? '#999' : '#6B6490';
  const canContinue = !!data.nombre.trim() && !!data.apellidos.trim();

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }} className="space-y-5">
      <div>
        <label style={labelStyle(dark)}>{t('onboarding.name_label')}</label>
        <input value={data.nombre} onChange={e => set('nombre', e.target.value)}
          onFocus={() => setFocused('nombre')} onBlur={() => setFocused(null)}
          placeholder={t('onboarding.name_placeholder')}
          style={inputStyle(focused === 'nombre', dark, !!errors.nombre)} />
        {errors.nombre && <p style={{ fontSize: '0.72rem', color: '#FF4757', marginTop: '4px' }}>{errors.nombre}</p>}
      </div>
      <div>
        <label style={labelStyle(dark)}>{t('onboarding.surname_label')}</label>
        <input value={data.apellidos} onChange={e => set('apellidos', e.target.value)}
          onFocus={() => setFocused('apellidos')} onBlur={() => setFocused(null)}
          placeholder={t('onboarding.surname_placeholder')}
          style={inputStyle(focused === 'apellidos', dark, !!errors.apellidos)} />
        {errors.apellidos && <p style={{ fontSize: '0.72rem', color: '#FF4757', marginTop: '4px' }}>{errors.apellidos}</p>}
      </div>
      <motion.button onClick={handleNext} disabled={!canContinue}
        whileHover={canContinue ? { scale: 1.02 } : {}} whileTap={canContinue ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all disabled:opacity-40"
        style={{ background: canContinue ? 'linear-gradient(135deg,#6C63FF,#5250d0)' : 'rgba(108,99,255,0.3)', color: 'white' }}>
        Continuar <ChevronRight size={18} />
      </motion.button>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: muted }}>{t('onboarding.step_label', { step: 1, total: 3 })}</p>
    </motion.div>
  );
}

// ── Step 2: Perfil Académico + Género ─────────────────────────────────────
function StepPerfil({ data, setData, onNext, onBack, dark }: {
  data: FormData; setData: (fn: (d: FormData) => FormData) => void;
  onNext: () => void; onBack: () => void; dark: boolean;
}) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState<string | null>(null);
  const set = (k: keyof FormData, v: string) => setData(d => ({ ...d, [k]: v }));

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
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: text, marginBottom: '14px' }}>{t('onboarding.academic_title')}</p>
        <div className="mb-4">
          <label style={labelStyle(dark)}>{t('onboarding.career_label')}</label>
          <div className="relative">
            <select value={data.carrera} onChange={e => set('carrera', e.target.value)}
              onFocus={() => setFocused('carrera')} onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focused === 'carrera', dark), appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', paddingRight: '36px' }}>
              <option value="" disabled style={{ background: dark ? '#1A1A2E' : '#fff' }}>{t('onboarding.career_placeholder')}</option>
              {ECI_CARRERAS.map(c => <option key={c} value={c} style={{ background: dark ? '#1A1A2E' : '#fff', color: dark ? '#E0E0FF' : '#1A1829' }}>{c}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke={focused === 'carrera' ? '#00D9FF' : '#8B85B0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label style={labelStyle(dark)}>{t('onboarding.second_career_label')} <span style={{ color: muted, fontWeight: 400, fontSize: '0.75rem' }}>{t('onboarding.second_career_optional')}</span></label>
          <div className="relative">
            <select value={data.segundaCarrera} onChange={e => set('segundaCarrera', e.target.value)}
              onFocus={() => setFocused('segunda')} onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focused === 'segunda', dark), appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', paddingRight: '36px' }}>
              <option value="" style={{ background: dark ? '#1A1A2E' : '#fff' }}>{t('onboarding.second_career_placeholder')}</option>
              {ECI_CARRERAS.filter(c => c !== data.carrera).map(c => <option key={c} value={c} style={{ background: dark ? '#1A1A2E' : '#fff' }}>{c}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#8B85B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
        <div>
          <label style={labelStyle(dark)}>{t('onboarding.semester_label')}</label>
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
        <label style={labelStyle(dark)}>{t('onboarding.birthday_label')}</label>
        <input type="date" value={data.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)}
          onFocus={() => setFocused('fecha')} onBlur={() => setFocused(null)}
          max={new Date().toISOString().slice(0, 10)}
          style={inputStyle(focused === 'fecha', dark, !ageInRange)}
          className={dark ? '[color-scheme:dark]' : '[color-scheme:light]'} />
        {!ageInRange && (
          <p style={{ fontSize: '0.75rem', color: '#FF4757', marginTop: '6px', lineHeight: 1.4 }}>
            {t('onboarding.birthday_error', { min: MIN_AGE, max: MAX_AGE })}
          </p>
        )}
      </div>

      {/* ── Género ── */}
      <div>
        <label style={labelStyle(dark)}>{t('onboarding.gender_label')}</label>
        <div className="grid grid-cols-2 gap-2">
          {GENEROS.map(g => (
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
              <span style={{ fontWeight: data.genero === g.id ? 600 : 400 }}>{t(`onboarding.gender_${g.id}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.button onClick={onNext} disabled={!canContinue}
        whileHover={canContinue ? { scale: 1.02 } : {}} whileTap={canContinue ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all disabled:opacity-40"
        style={{ background: canContinue ? 'linear-gradient(135deg,#6C63FF,#5250d0)' : 'rgba(108,99,255,0.3)', color: 'white' }}>
        Continuar <ChevronRight size={18} />
      </motion.button>
      <button onClick={onBack} style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem', color: muted, background: 'none', border: 'none', cursor: 'pointer' }}>
        ← Volver al paso anterior
      </button>
    </motion.div>
  );
}

// ── Step 3: Intereses ──────────────────────────────────────────────────────
function StepIntereses({ data, setData, onFinish, onBack, loading, dark }: {
  data: FormData; setData: (fn: (d: FormData) => FormData) => void;
  onFinish: () => void; onBack: () => void; loading: boolean; dark: boolean;
}) {
  const { t } = useTranslation();
  const selected = data.intereses;
  const valid = selected.length >= 3 && selected.length <= 12;
  const muted = dark ? '#999' : '#6B6490';

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }} className="space-y-5">
      <div className="text-center">
        <p style={{ fontSize: '0.88rem', color: muted }}>{t('onboarding.interests_title')}</p>
        <p style={{ fontSize: '0.78rem', color: muted, marginTop: '2px' }}>{t('onboarding.interests_subtitle')}</p>
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
          : <>{t('onboarding.complete')} <ChevronRight size={18} /></>
        }
      </motion.button>
      <button onClick={onBack} style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem', color: muted, background: 'none', border: 'none', cursor: 'pointer' }}>
        ← Volver al paso anterior
      </button>
    </motion.div>
  );
}

// ── Main OnboardingView ────────────────────────────────────────────────────
export function OnboardingView({ onComplete, darkMode }: OnboardingViewProps) {
  const { userId, userEmail, setUserName } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    nombre: '', apellidos: '', carrera: '', segundaCarrera: '',
    semestre: '', fechaNacimiento: '', genero: '', intereses: [],
  });

  const dark = darkMode;
  const cardBg = dark ? '#1A1A2E' : '#FFFFFF';
  const stepMeta = [
    { title: t('onboarding.step1_title'), sub: t('onboarding.step1_subtitle') },
    { title: t('onboarding.step2_title'), sub: t('onboarding.step2_subtitle') },
    { title: t('onboarding.step3_title'), sub: t('onboarding.step3_subtitle') },
  ];
  const textCol = dark ? '#E0E0FF' : '#1A1829';
  const mutedCol = dark ? '#999' : '#6B6490';

  const handleFinish = async () => {
    if (!userId) { setError('No se encontró el ID de usuario. Recarga la página.'); return; }
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
        intereses:        formData.intereses,
      };
      await userService.completarOnboarding(userId, payload);
      // Actualizar el nombre en el contexto de auth para que el saludo sea inmediato
      setUserName(`${payload.nombre} ${payload.apellidos}`);
      onComplete();
    } catch (err: any) {
      setError(friendlyError(err, 'Error al guardar el perfil. Intenta de nuevo.'));
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
              {stepMeta[step - 1].title}
            </h1>
            <p style={{ fontSize: '0.85rem', color: mutedCol }}>{stepMeta[step - 1].sub}</p>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepDatosBasicos key="step1" data={formData} setData={setFormData}
                onNext={() => setStep(2)} dark={dark} />
            )}
            {step === 2 && (
              <StepPerfil key="step2" data={formData} setData={setFormData}
                onNext={() => setStep(3)} onBack={() => setStep(1)} dark={dark} />
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
            {userEmail && <>{t('onboarding.registered_as')} <span style={{ color: dark ? '#7FE7C4' : '#0D9D74', fontWeight: 600 }}>{userEmail}</span></>}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
