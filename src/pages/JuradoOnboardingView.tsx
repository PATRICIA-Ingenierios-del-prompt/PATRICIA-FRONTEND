import { useEffect, useState } from 'react';
import { Check, ChevronRight, Loader2, ScrollText } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { LegalModals, type LegalModalType } from '../components/LegalContent';
import logoNuevoOscuroImg from '../assets/logoNuevoOscuro.png';
import logoNuevoClaroImg from '../assets/logoNuevoClaro.png';
import { motion, AnimatePresence } from 'motion/react';
import { userService } from '../services/userService';
import { useAuth } from '../store/AuthContext';
import { friendlyError } from '../lib/errorMessages';
import { useTranslation } from 'react-i18next';
import { CATEGORIAS } from '../components/InteresesPicker';

/**
 * Onboarding reducido para jurados externos (login con contraseña, sin cuenta
 * institucional): Términos y Condiciones (gate de UI, no se persiste) → nombre
 * y apellidos → intereses (mínimo 1, catálogo público) → un solo
 * PUT /perfil con onboardingCompleto.
 *
 * carrera/semestre son obligatorios en el backend aunque no aplican a un
 * jurado — se envían fijos ("Jurado Externo" / 1) sin mostrarse en la UI.
 */
const JURADO_CARRERA = 'Jurado Externo';
const JURADO_SEMESTRE = 1;

interface JuradoOnboardingViewProps {
  onComplete: () => void;
  /** Rechazó los T&C → cerrar sesión y volver al login. */
  onDecline: () => void;
  darkMode: boolean;
}

export function JuradoOnboardingView({ onComplete, onDecline, darkMode }: JuradoOnboardingViewProps) {
  const { t: tr } = useTranslation();
  const { userId, setUserName } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accepted, setAccepted] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ nombre?: string; apellidos?: string }>({});
  const [catalogo, setCatalogo] = useState<{ categoria: string; intereses: string[] }[]>([]);
  const [intereses, setIntereses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  const dark = darkMode;
  const cardBg = dark ? '#1A1A2E' : '#FFFFFF';
  const textCol = dark ? '#E0E0FF' : '#1A1829';
  const mutedCol = dark ? '#999' : '#6B6490';
  const inputBg = dark ? '#0F0F1E' : '#F5F3FF';

  // Catálogo del backend — si falla, se cae al catálogo local del picker para
  // no bloquear al jurado (las etiquetas coinciden: son los mismos strings).
  useEffect(() => {
    const fallback = CATEGORIAS.map(c => ({ categoria: `${c.emoji} ${c.label}`, intereses: c.intereses.map(i => i.id) }));
    userService.getCatalogoIntereses()
      .then(grupos => setCatalogo(grupos.length > 0 ? grupos : fallback))
      .catch(() => setCatalogo(fallback));
  }, []);

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', padding: '13px 15px', borderRadius: '12px',
    border: `1.5px solid ${hasError ? '#FF4757' : 'rgba(108,99,255,0.3)'}`,
    background: inputBg, color: textCol, fontSize: '0.9rem', outline: 'none',
  });

  const primaryBtn = (enabled: boolean): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', padding: '14px', borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem',
    background: enabled ? 'linear-gradient(135deg, #6C63FF, #5250d0)' : 'rgba(108,99,255,0.3)',
    color: 'white', border: 'none', cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: loading ? 0.65 : 1, transition: 'opacity 0.2s',
  });

  const handleNameNext = () => {
    const errs: typeof fieldErrors = {};
    if (!nombre.trim()) errs.nombre = tr('jurado.name_required');
    if (!apellidos.trim()) errs.apellidos = tr('jurado.surname_required');
    setFieldErrors(errs);
    if (Object.keys(errs).length === 0) setStep(3);
  };

  const toggleInteres = (id: string) =>
    setIntereses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleFinish = async () => {
    if (!userId) { setError('No se encontró el ID de usuario. Recarga la página.'); return; }
    if (intereses.length < 1) { setError(tr('jurado.interests_min')); return; }
    setLoading(true);
    setError('');
    try {
      await userService.completarOnboarding(userId, {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        carrera: JURADO_CARRERA,
        semestre: JURADO_SEMESTRE,
        intereses,
      });
      setUserName(`${nombre.trim()} ${apellidos.trim()}`);
      onComplete();
    } catch (err: any) {
      setError(friendlyError(err, 'Error al guardar el perfil. Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const stepMeta = [
    { title: tr('jurado.terms_title'), sub: tr('jurado.terms_sub') },
    { title: tr('jurado.name_title'), sub: tr('jurado.name_sub') },
    { title: tr('jurado.interests_title'), sub: tr('jurado.interests_sub') },
  ][step - 1];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground light={!dark} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-[480px] relative z-10">
        <div className="rounded-[20px] p-6 sm:p-9 relative overflow-hidden max-h-[92vh] overflow-y-auto"
          style={{ background: cardBg, border: '1px solid rgba(108,99,255,0.25)', boxShadow: dark ? '0 0 60px rgba(0,217,255,0.06), 0 24px 64px rgba(0,0,0,0.4)' : '0 8px 40px rgba(108,99,255,0.12)' }}>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), transparent)' }} />

          <div className="flex justify-center mb-4">
            <ImageWithFallback src={dark ? logoNuevoOscuroImg : logoNuevoClaroImg} alt="U•link"
              className="object-contain" style={{ height: 56, width: 'auto' }} />
          </div>

          <div className="text-center mb-6">
            <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: textCol, marginBottom: 4 }}>{stepMeta.title}</h1>
            <p style={{ fontSize: '0.83rem', color: mutedCol }}>{stepMeta.sub}</p>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Paso 1: Términos y Condiciones (solo UI, no se persiste) ── */}
            {step === 1 && (
              <motion.div key="terms" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <div className="rounded-2xl p-4 mb-4 border" style={{ background: inputBg, borderColor: 'rgba(108,99,255,0.2)', maxHeight: 220, overflowY: 'auto' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ScrollText size={15} style={{ color: '#6C63FF', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: textCol }}>{tr('jurado.terms_title')}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: mutedCol, lineHeight: 1.7 }}>{tr('jurado.terms_body')}</p>
                  <button onClick={() => setLegalModal('terminos')}
                    className="mt-3 hover:underline" style={{ fontSize: '0.78rem', color: dark ? '#7FE7C4' : '#6C63FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {tr('jurado.terms_read_full')}
                  </button>
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none mb-5">
                  <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
                    className="w-4 h-4 rounded mt-0.5 flex-shrink-0" style={{ accentColor: '#6C63FF' }} />
                  <span style={{ fontSize: '0.83rem', color: textCol, lineHeight: 1.5 }}>{tr('jurado.terms_accept')}</span>
                </label>

                <motion.button onClick={() => accepted && setStep(2)} disabled={!accepted}
                  whileHover={accepted ? { scale: 1.02 } : {}} whileTap={accepted ? { scale: 0.98 } : {}}
                  style={primaryBtn(accepted)}>
                  {tr('jurado.terms_continue')} <ChevronRight size={17} />
                </motion.button>

                <button onClick={onDecline}
                  className="w-full mt-3 py-2.5 hover:opacity-70 transition-opacity"
                  style={{ fontSize: '0.8rem', color: mutedCol, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {tr('jurado.terms_decline')}
                </button>
              </motion.div>
            )}

            {/* ── Paso 2: Nombre y apellidos (el backend los exige separados) ── */}
            {step === 2 && (
              <motion.div key="name" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="space-y-4">
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: dark ? '#C0BAE0' : '#3D3660', display: 'block', marginBottom: 6 }}>{tr('jurado.name_label')}</label>
                  <input value={nombre} onChange={e => { setNombre(e.target.value); setFieldErrors(f => ({ ...f, nombre: undefined })); }}
                    autoFocus placeholder={tr('jurado.name_label')} style={inputStyle(!!fieldErrors.nombre)} />
                  {fieldErrors.nombre && <p style={{ fontSize: '0.72rem', color: '#FF4757', marginTop: 4 }}>{fieldErrors.nombre}</p>}
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: dark ? '#C0BAE0' : '#3D3660', display: 'block', marginBottom: 6 }}>{tr('jurado.surname_label')}</label>
                  <input value={apellidos} onChange={e => { setApellidos(e.target.value); setFieldErrors(f => ({ ...f, apellidos: undefined })); }}
                    onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                    placeholder={tr('jurado.surname_label')} style={inputStyle(!!fieldErrors.apellidos)} />
                  {fieldErrors.apellidos && <p style={{ fontSize: '0.72rem', color: '#FF4757', marginTop: 4 }}>{fieldErrors.apellidos}</p>}
                </div>
                <motion.button onClick={handleNameNext} disabled={!nombre.trim() || !apellidos.trim()}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={primaryBtn(!!nombre.trim() && !!apellidos.trim())}>
                  {tr('jurado.terms_continue')} <ChevronRight size={17} />
                </motion.button>
              </motion.div>
            )}

            {/* ── Paso 3: Intereses (mínimo 1, catálogo público) ── */}
            {step === 3 && (
              <motion.div key="intereses" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                {catalogo.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-10">
                    <Loader2 size={18} className="animate-spin" style={{ color: '#6C63FF' }} />
                    <span style={{ fontSize: '0.83rem', color: mutedCol }}>Cargando…</span>
                  </div>
                ) : (
                  <div className="mb-5 overflow-y-auto space-y-4" style={{ maxHeight: 320 }}>
                    {catalogo.map(grupo => (
                      <div key={grupo.categoria}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: dark ? '#C0BAE0' : '#3D3660', marginBottom: 8 }}>{grupo.categoria}</p>
                        <div className="flex flex-wrap gap-2">
                          {grupo.intereses.map(id => {
                            const on = intereses.includes(id);
                            return (
                              <button key={id} onClick={() => toggleInteres(id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                                style={{
                                  background: on ? 'rgba(108,99,255,0.18)' : inputBg,
                                  border: `1.5px solid ${on ? '#6C63FF' : 'rgba(108,99,255,0.2)'}`,
                                  color: on ? (dark ? '#C9C5FF' : '#6C63FF') : mutedCol,
                                  cursor: 'pointer',
                                }}>
                                {on && <Check size={12} />}{id}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error && <p style={{ fontSize: '0.78rem', color: '#FF4757', marginBottom: 12, textAlign: 'center' }}>{error}</p>}

                <motion.button onClick={handleFinish} disabled={loading || intereses.length < 1}
                  whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                  style={primaryBtn(intereses.length >= 1 && !loading)}>
                  {loading ? <>{tr('jurado.saving')}</> : <>{tr('jurado.finish')} <Check size={16} /></>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center mt-5" style={{ fontSize: '0.72rem', color: mutedCol }}>
            {tr('jurado.step_of', { current: step, total: 3 })}
          </p>
        </div>
      </motion.div>

      <LegalModals open={legalModal} darkMode={dark} onClose={() => setLegalModal(null)} />
    </div>
  );
}
