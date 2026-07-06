import { useState, useRef, useCallback } from 'react';
import { Check, X, Upload, ChevronRight, Sun, Moon } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { InteresesPicker } from '../components/InteresesPicker';
import logoNuevoOscuroImg from '../assets/logoNuevoOscuro.png';
import logoNuevoClaroImg from '../assets/logoNuevoClaro.png';
import monoImg from '../assets/monoULink.png';
import { motion, AnimatePresence } from 'motion/react';
interface RegisterViewProps {
  onRegister: () => void;
  onGoLogin: () => void;
}

function MicrosoftLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <rect x="0"  y="0"  width="10" height="10" fill="#F25022" />
      <rect x="11" y="0"  width="10" height="10" fill="#7FBA00" />
      <rect x="0"  y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function ProgressBar({ step, darkMode }: { step: number; darkMode: boolean }) {
  const inactBg = darkMode ? 'transparent' : '#F0EEFF';
  const inactText = darkMode ? '#444' : '#8B85B0';
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {[1, 2, 3, 4].map((s, i) => (
        <div key={s} className="flex items-center">
          <motion.div
            animate={step >= s ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
            style={{
              background: step > s ? '#6C63FF' : step === s ? (darkMode ? '#0F0F1E' : '#EDE9FF') : inactBg,
              borderColor: step >= s ? '#6C63FF' : 'rgba(108,99,255,0.25)',
              zIndex: 1,
            }}>
            {step > s ? (
              <Check size={14} color="white" />
            ) : (
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: step === s ? '#6C63FF' : inactText }}>
                {s}
              </span>
            )}
            {/* Active ring pulse */}
            {step === s && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: '#6C63FF' }}
              />
            )}
          </motion.div>
          {i < 3 && (
            <div className="w-8 h-0.5 relative overflow-hidden" style={{ background: 'rgba(108,99,255,0.15)' }}>
              <motion.div
                animate={{ width: step > s ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0"
                style={{ background: '#6C63FF' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const STEP_META = [
  { title: 'Verificar Correo', sub: 'Ingresa el código enviado a tu email' },
  { title: 'Datos Básicos',    sub: 'Cuéntanos quién eres' },
  { title: 'Tu Perfil',        sub: 'Carrera, semestre y datos personales' },
  { title: 'Intereses',        sub: 'Elige tus categorías favoritas' },
];

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
  fontSize: '0.8rem',
  fontWeight: 600,
  color: dark ? '#C0BAE0' : '#3D3660',
  display: 'block',
  marginBottom: '7px',
});

const INTERESTS = [
  { id: 'musica',      label: 'Música',      emoji: '🎵' },
  { id: 'estudio',     label: 'Estudio',     emoji: '📚' },
  { id: 'aire-libre',  label: 'Aire Libre',  emoji: '🌿' },
  { id: 'gastronomia', label: 'Gastronomía', emoji: '🍕' },
  { id: 'videojuegos', label: 'Videojuegos', emoji: '🎮' },
  { id: 'arte',        label: 'Arte',        emoji: '🎨' },
];

function Step1({
  data, setData, errors, onNext, darkMode,
}: {
  data: any; setData: (d: any) => void; errors: any; onNext: () => void; darkMode: boolean;
}) {
  const [focused, setFocused] = useState<string | null>(null);
  const set = (k: string, v: string) => setData((d: any) => ({ ...d, [k]: v }));
  const canContinue = !!data.nombre.trim() && !!data.apellidos.trim();

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }} className="space-y-5">

      <div>
        <label style={labelStyle(darkMode)}>Nombre</label>
        <input value={data.nombre} onChange={e => set('nombre', e.target.value)}
          placeholder="Tu nombre"
          onFocus={() => setFocused('nombre')} onBlur={() => setFocused(null)}
          style={inputStyle(focused === 'nombre', darkMode, !!errors.nombre)} />
        {errors.nombre && <p style={{ fontSize: '0.72rem', color: '#FF4757', marginTop: '4px' }}>{errors.nombre}</p>}
      </div>

      <div>
        <label style={labelStyle(darkMode)}>Apellidos</label>
        <input value={data.apellidos} onChange={e => set('apellidos', e.target.value)}
          placeholder="Tus apellidos"
          onFocus={() => setFocused('apellidos')} onBlur={() => setFocused(null)}
          style={inputStyle(focused === 'apellidos', darkMode, !!errors.apellidos)} />
        {errors.apellidos && <p style={{ fontSize: '0.72rem', color: '#FF4757', marginTop: '4px' }}>{errors.apellidos}</p>}
      </div>

      <div>
        <label style={labelStyle(darkMode)}>Correo institucional</label>
        <div className="relative">
          <input value={data.email} readOnly
            style={{ ...inputStyle(false, darkMode), opacity: 0.7, cursor: 'not-allowed', background: 'rgba(108,99,255,0.06)', paddingRight: '40px' }} />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <Check size={16} style={{ color: '#7FE7C4' }} />
            </motion.div>
          </div>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#666', marginTop: '5px' }}>
          Solo correos <span style={{ color: '#7FE7C4' }}>@mail.escuelaing.edu.co</span> tienen acceso
        </p>
      </div>

      <motion.button onClick={onNext}
        disabled={!canContinue}
        whileHover={canContinue ? { scale: 1.02 } : {}}
        whileTap={canContinue ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold mt-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: canContinue ? 'linear-gradient(135deg,#6C63FF,#5250d0)' : 'rgba(108,99,255,0.3)', color: 'white', boxShadow: canContinue ? '0 4px 20px rgba(108,99,255,0.3)' : 'none' }}>
        Continuar <ChevronRight size={18} />
      </motion.button>
    </motion.div>
  );
}

const ECI_CARRERAS = [
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería de Sistemas',
  'Ingeniería Industrial',
  'Ingeniería Electrónica',
  'Economía',
  'Administración de Empresas',
  'Matemáticas',
  'Ingeniería Mecánica',
  'Ingeniería Biomédica',
  'Ingeniería Ambiental',
  'Ingeniería Estadística',
  'Ingeniería de Inteligencia Artificial',
  'Ingeniería de Ciberseguridad',
  'Ingeniería en Biotecnología',
  'Postgrado',
];

const SEMESTRES = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°'];

const MIN_AGE = 15;
const MAX_AGE = 100;

function calcAge(dateStr: string): number | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function isoDateYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function Step2({
  data, setData, onNext, darkMode,
}: {
  data: any; setData: (d: any) => void; onNext: () => void; darkMode: boolean;
}) {
  const [focused, setFocused] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));

  const text   = darkMode ? '#E0E0FF' : '#1A1829';
  const muted  = darkMode ? '#999'    : '#6B6490';
  const selBg  = darkMode ? 'rgba(108,99,255,0.18)' : 'rgba(108,99,255,0.1)';
  const idleBg = darkMode ? 'rgba(108,99,255,0.05)' : '#F5F3FF';
  const selBd  = '#6C63FF';
  const idleBd = darkMode ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.25)';
  const inputBg = darkMode ? '#0F0F1E' : '#F5F3FF';

  const GENEROS = [
    { id: 'masculino', label: 'Masculino' },
    { id: 'femenino',  label: 'Femenino' },
    { id: 'otro',      label: 'Otro' },
    { id: 'nd',        label: 'Prefiero no decirlo' },
  ];

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => set('foto', e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const age = calcAge(data.fechaNac);
  const fechaError = data.fechaNac && (age === null || age < MIN_AGE || age > MAX_AGE)
    ? `Debes tener entre ${MIN_AGE} y ${MAX_AGE} años.`
    : '';

  const canContinue = !!data.carrera && !!data.semestre && !!data.fechaNac && !fechaError;

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }} className="space-y-6">

      {/* ── Datos Académicos ── */}
      <div className="rounded-2xl p-4 border"
        style={{ borderColor: 'rgba(108,99,255,0.2)', background: darkMode ? 'rgba(108,99,255,0.05)' : '#F5F3FF' }}>
        <div className="flex items-center gap-2 mb-4">
          <span style={{ fontSize: '1rem' }}>🎓</span>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: text }}>Datos académicos</p>
        </div>

        {/* Carrera — dropdown */}
        <div className="mb-4">
          <label style={{ ...labelStyle(darkMode), marginBottom: '8px', display: 'block' }}>Carrera *</label>
          <div className="relative">
            <select
              value={data.carrera || ''}
              onChange={e => set('carrera', e.target.value)}
              onFocus={() => setFocused('carrera')}
              onBlur={() => setFocused(null)}
              style={{
                ...inputStyle(focused === 'carrera', darkMode),
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
                paddingRight: '36px',
              }}>
              <option value="" disabled style={{ background: darkMode ? '#1A1A2E' : '#fff' }}>
                Selecciona tu carrera...
              </option>
              {ECI_CARRERAS.map(c => (
                <option key={c} value={c} style={{ background: darkMode ? '#1A1A2E' : '#fff', color: darkMode ? '#E0E0FF' : '#1A1829' }}>
                  {c}
                </option>
              ))}
            </select>
            {/* Chevron icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke={focused === 'carrera' ? '#00D9FF' : '#8B85B0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          {/* Show selected clearly */}
          {data.carrera && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl w-fit"
              style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)' }}>
              <span style={{ fontSize: '0.72rem', color: '#6C63FF', fontWeight: 600 }}>✓ {data.carrera}</span>
            </motion.div>
          )}
        </div>

        {/* Segunda carrera — optional */}
        <div>
          <label style={{ ...labelStyle(darkMode), marginBottom: '8px', display: 'block' }}>
            Segunda carrera <span style={{ color: muted, fontWeight: 400, fontSize: '0.75rem' }}>(opcional)</span>
          </label>
          <div className="relative">
            <select
              value={data.segundaCarrera || ''}
              onChange={e => set('segundaCarrera', e.target.value)}
              onFocus={() => setFocused('segunda')}
              onBlur={() => setFocused(null)}
              style={{
                ...inputStyle(focused === 'segunda', darkMode),
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
                paddingRight: '36px',
              }}>
              <option value="" style={{ background: darkMode ? '#1A1A2E' : '#fff' }}>
                Ninguna
              </option>
              {ECI_CARRERAS.filter(c => c !== data.carrera).map(c => (
                <option key={c} value={c} style={{ background: darkMode ? '#1A1A2E' : '#fff', color: darkMode ? '#E0E0FF' : '#1A1829' }}>
                  {c}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke={focused === 'segunda' ? '#00D9FF' : '#8B85B0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          {data.segundaCarrera && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl w-fit"
              style={{ background: 'rgba(127,231,196,0.1)', border: '1px solid rgba(127,231,196,0.3)' }}>
              <span style={{ fontSize: '0.72rem', color: '#7FE7C4', fontWeight: 600 }}>✓ {data.segundaCarrera}</span>
              <button onClick={() => set('segundaCarrera', '')}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:opacity-70"
                style={{ background: 'rgba(127,231,196,0.2)' }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 6M7 1L1 7" stroke="#7FE7C4" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </motion.div>
          )}
        </div>

        {/* Semestre — pill grid */}
        <div>
          <label style={{ ...labelStyle(darkMode), marginBottom: '10px', display: 'block' }}>Semestre *</label>
          <div className="grid grid-cols-5 gap-2">
            {SEMESTRES.map((s, i) => {
              const val = String(i + 1);
              const active = data.semestre === val;
              return (
                <motion.button key={s}
                  onClick={() => set('semestre', val)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: active ? '#6C63FF' : idleBg,
                    border: `1.5px solid ${active ? '#6C63FF' : idleBd}`,
                    color: active ? 'white' : muted,
                    boxShadow: active ? '0 4px 14px rgba(108,99,255,0.35)' : 'none',
                  }}>
                  {s}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fecha nacimiento */}
      <div>
        <label style={labelStyle(darkMode)}>Fecha de nacimiento</label>
        <input type="date" value={data.fechaNac} onChange={e => set('fechaNac', e.target.value)}
          onFocus={() => setFocused('fecha')} onBlur={() => setFocused(null)}
          min={isoDateYearsAgo(MAX_AGE)} max={isoDateYearsAgo(MIN_AGE)}
          style={inputStyle(focused === 'fecha', darkMode, !!fechaError)}
          className={darkMode ? '[color-scheme:dark]' : '[color-scheme:light]'} />
        {fechaError && <p style={{ fontSize: '0.72rem', color: '#FF4757', marginTop: '4px' }}>{fechaError}</p>}
      </div>

      {/* Género */}
      <div>
        <label style={labelStyle(darkMode)}>Género</label>
        <div className="grid grid-cols-2 gap-2">
          {GENEROS.map(g => (
            <button key={g.id} onClick={() => set('genero', g.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
              style={{
                background: data.genero === g.id ? selBg : idleBg,
                border: `1.5px solid ${data.genero === g.id ? selBd : idleBd}`,
                color: data.genero === g.id ? text : muted,
              }}>
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{ borderColor: data.genero === g.id ? '#6C63FF' : (darkMode ? '#444' : '#bbb') }}>
                {data.genero === g.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}
                    className="w-2 h-2 rounded-full" style={{ background: '#6C63FF' }} />
                )}
              </div>
              <span style={{ fontWeight: data.genero === g.id ? 600 : 400, fontSize: '0.85rem' }}>{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Foto perfil */}
      <div>
        <label style={labelStyle(darkMode)}>Foto de perfil <span style={{ color: muted, fontWeight: 400 }}>(opcional)</span></label>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
          style={{
            borderColor: dragOver ? '#00D9FF' : 'rgba(108,99,255,0.25)',
            background: dragOver ? 'rgba(0,217,255,0.05)' : idleBg,
            height: data.foto ? 120 : 90,
            boxShadow: dragOver ? '0 0 20px rgba(0,217,255,0.1)' : 'none',
          }}>
          {data.foto ? (
            <>
              <img src={data.foto} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span style={{ fontSize: '0.82rem', color: 'white', fontWeight: 600 }}>Cambiar foto</span>
              </div>
            </>
          ) : (
            <>
              <Upload size={20} style={{ color: '#6C63FF', marginBottom: '5px' }} />
              <p style={{ fontSize: '0.8rem', color: darkMode ? '#C0BAE0' : '#6B6490', fontWeight: 500 }}>Arrastra o click para subir</p>
              <p style={{ fontSize: '0.68rem', color: muted, marginTop: '2px' }}>JPG, PNG hasta 5MB</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      <motion.button
        onClick={onNext}
        disabled={!canContinue}
        whileHover={canContinue ? { scale: 1.02 } : {}}
        whileTap={canContinue ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canContinue ? 'linear-gradient(135deg,#6C63FF,#5250d0)' : 'rgba(108,99,255,0.3)',
          color: 'white',
          boxShadow: canContinue ? '0 4px 20px rgba(108,99,255,0.3)' : 'none',
        }}>
        Continuar <ChevronRight size={18} />
      </motion.button>
    </motion.div>
  );
}

function Step3({ email, onNext, darkMode }: { email: string; onNext: () => void; darkMode: boolean }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Must be fixed-count refs at top level — no hooks in loops
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const ref4 = useRef<HTMLInputElement>(null);
  const ref5 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3, ref4, ref5];

  const handleDigit = (i: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError('');
    if (clean && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...digits];
    text.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    if (text.length > 0) refs[Math.min(text.length, 5)].current?.focus();
  };

  const resend = async () => {
    setResent(false);
    await new Promise(r => setTimeout(r, 800));
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  const verify = async () => {
    if (digits.some(d => !d)) { setError('Ingresa todos los 6 dígitos'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onNext();
  };

  const allFilled = digits.every(d => d !== '');

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }} className="space-y-6">

      <div className="text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)' }}>
          <span style={{ fontSize: '1.8rem' }}>📧</span>
        </div>
        <p style={{ fontSize: '0.88rem', color: '#999', lineHeight: 1.6 }}>
          Enviamos un código a<br />
          <span style={{ color: '#7FE7C4', fontWeight: 600 }}>{email}</span>
        </p>
      </div>

      {/* 6-digit OTP inputs */}
      <div className="flex gap-3 justify-center" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <motion.input
            key={i}
            ref={refs[i]}
            value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            maxLength={1}
            inputMode="numeric"
            className="text-center font-mono font-bold transition-all"
            style={{
              width: '52px',
              height: '60px',
              background: d ? (darkMode ? 'rgba(108,99,255,0.18)' : 'rgba(108,99,255,0.14)') : (darkMode ? '#0F0F1E' : '#F5F3FF'),
              border: `2px solid ${error ? '#FF4757' : d ? '#6C63FF' : 'rgba(108,99,255,0.25)'}`,
              borderRadius: '14px',
              color: darkMode ? '#E0E0FF' : '#1A1829',
              fontSize: '1.4rem',
              outline: 'none',
              boxShadow: d ? '0 0 12px rgba(108,99,255,0.2)' : 'none',
            }}
            whileFocus={{ borderColor: '#00D9FF', boxShadow: '0 0 16px rgba(0,217,255,0.2)' } as any}
          />
        ))}
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center" style={{ fontSize: '0.78rem', color: '#FF4757' }}>
          {error}
        </motion.p>
      )}

      {/* Resend */}
      <div className="text-center">
        {resent ? (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '0.82rem', color: '#7FE7C4' }}>
            ✓ Código reenviado
          </motion.p>
        ) : (
          <p style={{ fontSize: '0.82rem', color: '#666' }}>
            ¿No recibiste el código?{' '}
            <button onClick={resend} style={{ color: '#7FE7C4', fontWeight: 600 }} className="hover:underline">
              Reenviar
            </button>
          </p>
        )}
      </div>

      <motion.button
        onClick={verify}
        disabled={loading || !allFilled}
        whileHover={allFilled ? { scale: 1.02, boxShadow: '0 8px 32px rgba(108,99,255,0.4)' } : {}}
        whileTap={allFilled ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg,#6C63FF,#5250d0)', color: 'white', boxShadow: '0 4px 20px rgba(108,99,255,0.25)' }}>
        {loading
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <>Continuar <ChevronRight size={18} /></>
        }
      </motion.button>
    </motion.div>
  );
}

function Step4({ data, setData, onFinish, loading, darkMode }: {
  data: any; setData: (d: any) => void; onFinish: () => void; loading: boolean; darkMode: boolean;
}) {
  const selected: string[] = data.intereses || [];
  const valid = selected.length >= 3 && selected.length <= 12;
  const text = darkMode ? '#E0E0FF' : '#1A1829';
  const muted = darkMode ? '#999' : '#6B6490';

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }} className="space-y-5">

      <div className="text-center">
        <p style={{ fontSize: '0.88rem', color: muted }}>
          Elige tus Intereses
        </p>
        <p style={{ fontSize: '0.78rem', color: muted, marginTop: '2px' }}>
          Selecciona mínimo 3 y máximo 12
        </p>
      </div>

      <InteresesPicker
        selected={selected}
        onChange={ids => setData((d: any) => ({ ...d, intereses: ids }))}
        darkMode={darkMode}
      />

      <motion.button
        onClick={onFinish}
        disabled={!valid || loading}
        whileHover={valid ? { scale: 1.02, boxShadow: '0 8px 32px rgba(108,99,255,0.45)' } : {}}
        whileTap={valid ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: valid ? '#7FE7C4' : 'rgba(85,85,85,0.4)',
          color: valid ? '#0F0E1A' : '#888',
          boxShadow: valid ? '0 4px 20px rgba(127,231,196,0.35)' : 'none',
        }}>
        {loading
          ? <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          : <>Completar Registro <ChevronRight size={18} /></>
        }
      </motion.button>
    </motion.div>
  );
}

export function RegisterView({ onRegister, onGoLogin, darkMode = true, setDarkMode }: RegisterViewProps) {
  const cardBg   = darkMode ? '#1A1A2E' : '#FFFFFF';
  const cardBorder = darkMode ? 'rgba(108,99,255,0.22)' : 'rgba(108,99,255,0.25)';
  const textColor  = darkMode ? '#E0E0FF' : '#1A1829';
  const mutedColor = darkMode ? '#999'    : '#6B6490';
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0); // 0 = microsoft, 1-4 = onboarding
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '', apellidos: '',
    email: 'usuario@mail.escuelaing.edu.co',
    carrera: '', segundaCarrera: '', semestre: '',
    fechaNac: '', genero: '', foto: '',
    intereses: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMicrosoft = async () => {
    setGlobalError(null);
    if (!navigator.onLine) {
      setGlobalError('Sin conexión a internet. Verifica tu red e inténtalo de nuevo.');
      return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1600));
      setLoading(false);
      setStep(1);
    } catch {
      setLoading(false);
      setGlobalError('No se pudo conectar con Microsoft. Inténtalo de nuevo.');
    }
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.nombre.trim()) errs.nombre = 'El nombre es requerido';
    if (!formData.apellidos.trim()) errs.apellidos = 'Los apellidos son requeridos';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextOTP = () => setStep(2); // OTP (step 1) → Datos Básicos (step 2)
  const handleNext1 = () => { if (validateStep1()) setStep(3); }; // Datos Básicos → Perfil
  const handleNext2 = () => setStep(4); // Perfil → Intereses

  const handleFinish = async () => {
    setGlobalError(null);
    if (!navigator.onLine) {
      setGlobalError('Sin conexión a internet. Verifica tu red e inténtalo de nuevo.');
      return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1400));
      setLoading(false);
      onRegister();
    } catch {
      setLoading(false);
      setGlobalError('Ocurrió un error al crear tu cuenta. Inténtalo de nuevo.');
    }
  };

  const meta = step >= 1 ? STEP_META[Math.min(step - 1, 3)] : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground light={!darkMode} />

      {/* Theme toggle */}
      {setDarkMode && (
        <button onClick={() => setDarkMode(!darkMode)}
          className="absolute top-5 right-5 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all hover:opacity-80"
          style={{ background: darkMode ? 'rgba(26,26,46,0.85)' : 'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', borderColor:'rgba(108,99,255,0.3)', color: darkMode ? '#FFB347' : '#6C63FF' }}>
          {darkMode
            ? <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0l.7.71a1 1 0 01-1.41 1.41l-.71-.7a1 1 0 010-1.42zm13.72 13.72a1 1 0 011.42 0 1 1 0 010 1.42l-.71.7a1 1 0 01-1.41-1.41l.7-.71zM2 12a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm17 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM6.34 17.66a1 1 0 010 1.41l-.71.71a1 1 0 01-1.41-1.41l.7-.71a1 1 0 011.42 0zm11.32-11.32a1 1 0 010 1.41l-.71.71a1 1 0 01-1.41-1.41l.7-.71a1 1 0 011.42 0zM12 7a5 5 0 110 10A5 5 0 0112 7z"/></svg>
            : <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>}
          <span style={{ fontSize:'0.78rem', fontWeight:600 }}>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
      )}

      <motion.div
        key={step}
        className="w-full relative z-10"
        style={{ maxWidth: step === 0 ? 440 : 500 }}>

        {/* Card */}
        <div className={`rounded-[20px] relative overflow-hidden ${step === 0 ? 'p-6 sm:p-10' : 'p-5 sm:p-9'}`}
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: darkMode ? '0 0 60px rgba(0,217,255,0.05), 0 32px 80px rgba(0,0,0,0.45)' : '0 8px 40px rgba(108,99,255,0.12)',
          }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), transparent)' }} />

          {/* Step 0 — Microsoft connect */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col items-center mb-6">
                <ImageWithFallback src={darkMode ? logoNuevoOscuroImg : logoNuevoClaroImg} alt="U•link" className="object-contain" style={{ height: 104, width: 'auto' }} />
              </div>
              <div className="flex justify-center mb-6">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                  <ImageWithFallback src={monoImg} alt="Mascota" className="object-contain"
                    style={{ width: 80, height: 80, filter: 'drop-shadow(0 6px 16px rgba(108,99,255,0.3))' }} />
                </motion.div>
              </div>
              <div className="text-center mb-8">
                <h1 style={{ fontWeight: 800, fontSize: '1.55rem', color: textColor, marginBottom: '6px' }}>Crea tu cuenta</h1>
                <p style={{ fontSize: '0.88rem', color: mutedColor }}>Comienza tu viaje en U•link</p>
              </div>

              <motion.button onClick={handleMicrosoft} disabled={loading}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#5250d0)', color: 'white', fontSize: '1rem', boxShadow: '0 4px 20px rgba(108,99,255,0.25)' }}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><MicrosoftLogo size={20} /> Continuar con Microsoft</>
                }
              </motion.button>

              <p className="text-center mt-3" style={{ fontSize: '0.75rem', color: '#555' }}>
                Usa tu cuenta <span style={{ color: '#7FE7C4' }}>@mail.escuelaing.edu.co</span>
              </p>

              {/* Error message */}
              <AnimatePresence>
                {globalError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl mt-3"
                    style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                    <p style={{ fontSize: '0.8rem', color: '#FF4D6A', lineHeight: 1.4 }}>{globalError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.12)' }} />
                <span style={{ fontSize: '0.72rem', color: '#444' }}>o</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.12)' }} />
              </div>

              <p className="text-center" style={{ fontSize: '0.88rem', color: '#999' }}>
                ¿Ya tienes cuenta?{' '}
                <button onClick={onGoLogin} style={{ color: '#7FE7C4', fontWeight: 600 }} className="hover:underline">
                  Iniciar sesión
                </button>
              </p>
            </motion.div>
          )}

          {/* Steps 1-4 — Onboarding */}
          {step >= 1 && (
            <>
              {/* Logo */}
              <div className="flex flex-col items-center mb-5">
                <ImageWithFallback src={darkMode ? logoNuevoOscuroImg : logoNuevoClaroImg} alt="U•link" className="object-contain" style={{ height: 72, width: 'auto' }} />
              </div>

              {/* Progress */}
              <ProgressBar step={step} darkMode={darkMode} />

              {/* Title */}
              <div className="text-center mb-6">
                <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: textColor, marginBottom: '4px' }}>
                  {meta?.title}
                </h2>
                <p style={{ fontSize: '0.82rem', color: mutedColor }}>{meta?.sub}</p>
              </div>

              {/* Step content with AnimatePresence */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <Step3 key="s3" email={formData.email} onNext={handleNextOTP} darkMode={darkMode} />
                )}
                {step === 2 && (
                  <Step1 key="s1" data={formData} setData={setFormData} errors={errors} onNext={handleNext1} darkMode={darkMode} />
                )}
                {step === 3 && (
                  <Step2 key="s2" data={formData} setData={setFormData} onNext={handleNext2} darkMode={darkMode} />
                )}
                {step === 4 && (
                  <Step4 key="s4" data={formData} setData={setFormData} onFinish={handleFinish} loading={loading} darkMode={darkMode} />
                )}
              </AnimatePresence>

              {/* Back link */}
              {step > 1 && (
                <button onClick={() => setStep(s => (s - 1) as any)}
                  className="w-full text-center mt-4 hover:opacity-70 transition-all"
                  style={{ fontSize: '0.8rem', color: '#555' }}>
                  ← Volver al paso anterior
                </button>
              )}

              {/* Global error for steps */}
              <AnimatePresence>
                {globalError && step >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl mt-3"
                    style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                    <p style={{ fontSize: '0.8rem', color: '#FF4D6A', lineHeight: 1.4 }}>{globalError}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

      </motion.div>
    </div>
  );
}
