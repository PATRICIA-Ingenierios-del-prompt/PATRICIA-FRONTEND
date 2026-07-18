import { useState, useRef } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { AnimatedBackground } from '../components/AnimatedBackground';
import logoNuevoOscuroImg from '../assets/logoNuevoOscuro.png';
import logoNuevoClaroImg from '../assets/logoNuevoClaro.png';
import monoImg from '../assets/monoULink.png';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../services/authService';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from 'react-i18next';
import { LegalModals, type LegalModalType } from '../components/LegalContent';
import { friendlyError } from '../lib/errorMessages';

type LoginStep = 'main' | 'email' | 'otp' | 'jurado';

interface LoginViewProps {
  /** `jurado: true` cuando el login fue por el flujo de jurado externo — App
   *  usa el flag para mandar al onboarding reducido en vez del de estudiante. */
  onLogin: (opts?: { jurado?: boolean }) => void;
  onGoRegister: () => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

function MicrosoftLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0"  y="0"  width="10" height="10" fill="#F25022" />
      <rect x="11" y="0"  width="10" height="10" fill="#7FBA00" />
      <rect x="0"  y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

const VALID_DOMAINS = ['@mail.escuelaing.edu.co', '@escuelaing.edu.co'];

const MICROSOFT_CLIENT_ID  = 'd378f378-5c84-4dc8-8ce6-85bf56b42a45';
const MICROSOFT_TENANT     = 'common';
const MICROSOFT_REDIRECT   = window.location.origin + '/auth/callback';

export function LoginView({ onLogin, onGoRegister, darkMode = true, setDarkMode }: LoginViewProps) {
  const { login } = useAuth();
  const { t } = useTranslation();

  const [step, setStep]       = useState<LoginStep>('main');
  const [loading, setLoading] = useState(false);
  const [email, setEmail]     = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [error, setError]     = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0); // seconds remaining
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [juradoEmail, setJuradoEmail] = useState('');
  const [juradoPassword, setJuradoPassword] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cardBg   = darkMode ? '#1A1A2E' : '#FFFFFF';
  const textCol  = darkMode ? '#E0E0FF' : '#1A1829';
  const mutedCol = darkMode ? '#999'    : '#6B6490';
  const inputBg  = darkMode ? '#0F0F1E' : '#F5F3FF';

  // ── Shared button styles ──────────────────────────────────────────────────
  const primaryBtn: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '14px', borderRadius: '14px', fontWeight: 600, fontSize: '1rem',
    background: 'linear-gradient(135deg, #6C63FF, #5250d0)', color: 'white',
    boxShadow: '0 4px 20px rgba(108,99,255,0.25)', border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.65 : 1,
    transition: 'opacity 0.2s',
  };

  const outlinedBtn: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '13px', borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem',
    background: 'transparent', color: darkMode ? '#A09AE0' : '#6C63FF',
    border: `1.5px solid ${darkMode ? 'rgba(108,99,255,0.35)' : 'rgba(108,99,255,0.3)'}`,
    cursor: 'pointer', transition: 'background 0.2s',
  };

  // ── Microsoft OAuth redirect ──────────────────────────────────────────────
  const handleMicrosoft = () => {
    const params = new URLSearchParams({
      client_id:     MICROSOFT_CLIENT_ID,
      response_type: 'code',
      redirect_uri:  MICROSOFT_REDIRECT,
      response_mode: 'query',
      scope:         'openid profile email offline_access',
      // Evita que Microsoft intente reusar en silencio la cookie ESTSAUTH
      // (sesión vieja/atascada). Fuerza siempre el selector de cuenta.
      prompt:        'select_account',
    });
    window.location.href =
      'https://login.microsoftonline.com/' + MICROSOFT_TENANT + '/oauth2/v2.0/authorize?' + params;
  };

  // ── Start cooldown timer ──────────────────────────────────────────────────
  const startCooldown = (seconds = 60) => {
    setOtpCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── OTP step 1: request code ──────────────────────────────────────────────
  const handleRequestOtp = async () => {
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError(t('login.email_required')); return; }
    if (!VALID_DOMAINS.some(d => trimmed.endsWith(d))) {
      setError(t('login.domain_error'));
      return;
    }
    setLoading(true);
    try {
      await authService.requestOtp(trimmed);
      setStep('otp');
      startCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) setError(t('login.domain_not_allowed'));
      else if (status === 429) setError(t('login.too_many_attempts'));
      else if (status === 404) setError(t('login.account_not_found'));
      else setError(friendlyError(e, t('login.code_send_error')));
    } finally {
      setLoading(false);
    }
  };

  // ── OTP step 2: verify code ───────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError(t('login.otp_required')); return; }
    setLoading(true);
    setError('');
    try {
      const tokens = await authService.verifyOtp(email.trim().toLowerCase(), code);
      login(tokens.accessToken, tokens.refreshToken);
      onLogin();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) setError(t('login.otp_invalid'));
      else setError(friendlyError(e, t('login.otp_verify_error')));
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } finally {
      setLoading(false);
    }
  };

  // ── Jurado: login con correo + contraseña, sin dominio institucional ──────
  const handleJuradoLogin = async () => {
    const trimmedEmail = juradoEmail.trim();
    if (!trimmedEmail || !juradoPassword) { setError(t('login.jurado_required')); return; }
    setLoading(true);
    setError('');
    try {
      const tokens = await authService.loginJurado(trimmedEmail, juradoPassword);
      login(tokens.accessToken, tokens.refreshToken);
      onLogin({ jurado: true });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) setError(t('login.jurado_invalid'));
      else setError(friendlyError(e, t('login.jurado_error')));
    } finally {
      setLoading(false);
    }
  };

  // ── OTP digit helpers ─────────────────────────────────────────────────────
  const handleOtpChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp]; next[i] = value.slice(-1); setOtp(next);
    if (value && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === 'Enter') handleVerifyOtp();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    digits.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const goBack = () => {
    setError('');
    setStep(prev => (prev === 'otp' ? 'email' : 'main'));
    if (step === 'otp') setOtp(['', '', '', '', '', '']);
    if (step === 'jurado') { setJuradoEmail(''); setJuradoPassword(''); }
  };

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1***$2');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-20 relative overflow-x-hidden">
      <AnimatedBackground light={!darkMode} />

      {/* Theme toggle */}
      {setDarkMode && (
        <button onClick={() => setDarkMode(!darkMode)}
          className="absolute top-5 right-5 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all hover:opacity-80"
          style={{ background: darkMode ? 'rgba(26,26,46,0.85)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderColor: 'rgba(108,99,255,0.3)', color: darkMode ? '#FFB347' : '#6C63FF' }}>
          {darkMode
            ? <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0l.7.71a1 1 0 01-1.41 1.41l-.71-.7a1 1 0 010-1.42zm13.72 13.72a1 1 0 011.42 0 1 1 0 010 1.42l-.71.7a1 1 0 01-1.41-1.41l.7-.71zM2 12a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm17 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM6.34 17.66a1 1 0 010 1.41l-.71.71a1 1 0 01-1.41-1.41l.7-.71a1 1 0 011.42 0zm11.32-11.32a1 1 0 010 1.41l-.71.71a1 1 0 01-1.41-1.41l.7-.71a1 1 0 011.42 0zM12 7a5 5 0 110 10A5 5 0 0112 7z" /></svg>
            : <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>}
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{darkMode ? t('login.light_mode') : t('login.dark_mode')}</span>
        </button>
      )}

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] relative z-10">
        <div className="rounded-[20px] p-6 sm:p-9 relative overflow-hidden"
          style={{ background: cardBg, border: '1px solid rgba(108,99,255,0.25)', boxShadow: darkMode ? '0 0 60px rgba(0,217,255,0.06), 0 24px 64px rgba(0,0,0,0.4)' : '0 8px 40px rgba(108,99,255,0.12)' }}>

          {/* Top accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), transparent)' }} />

          {/* Back button */}
          <AnimatePresence>
            {step !== 'main' && (
              <motion.button key="back" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                onClick={goBack}
                className="flex items-center gap-1.5 mb-4 hover:opacity-70 transition-opacity"
                style={{ color: mutedCol, fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <ArrowLeft size={15} /> {t('login.back')}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Logo */}
          <div className="flex flex-col items-center gap-1 mb-4">
            <ImageWithFallback src={darkMode ? logoNuevoOscuroImg : logoNuevoClaroImg} alt="U•link"
              className="object-contain" style={{ height: 80, width: 'auto' }} />
          </div>

          {/* Mascot — only on main step */}
          <AnimatePresence>
            {step === 'main' && (
              <motion.div key="mono" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="flex justify-center mb-4 overflow-hidden">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <ImageWithFallback src={monoImg} alt="Mascota"
                    className="object-contain" style={{ width: 72, height: 72, filter: 'drop-shadow(0 8px 20px rgba(108,99,255,0.3))' }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step content */}
          <AnimatePresence mode="wait">

            {/* ── MAIN ── */}
            {step === 'main' && (
              <motion.div key="main" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div className="text-center mb-6">
                  <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: textCol, marginBottom: '6px' }}>{t('login.title')}</h1>
                  <p style={{ fontSize: '0.85rem', color: mutedCol, lineHeight: 1.6 }}>{t('login.subtitle')}</p>
                </div>

                {/* Microsoft button */}
                <motion.button onClick={handleMicrosoft} disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }} whileTap={{ scale: 0.98 }}
                  style={primaryBtn}>
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><MicrosoftLogo size={20} />{t('login.continue_microsoft')}</>}
                </motion.button>
                <p className="text-center mt-2" style={{ fontSize: '0.75rem', color: mutedCol }}>
                  {t('login.use_account')} <span style={{ color: darkMode ? '#7FE7C4' : '#0D9D74', fontWeight: 600 }}>@mail.escuelaing.edu.co</span>
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.15)' }} />
                  <span style={{ fontSize: '0.75rem', color: mutedCol }}>{t('login.or')}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.15)' }} />
                </div>

                {/* OTP email button */}
                <motion.button onClick={() => { setError(''); setStep('email'); }}
                  whileHover={{ background: darkMode ? 'rgba(108,99,255,0.08)' : 'rgba(108,99,255,0.06)' }}
                  whileTap={{ scale: 0.98 }} style={outlinedBtn}>
                  <Mail size={18} />
                  {t('login.email_code')}
                </motion.button>

                {/* Acceso discreto para jurados externos — no institucional */}
                <p className="text-center mt-4" style={{ fontSize: '0.75rem', color: mutedCol }}>
                  {t('login.are_you_juror')}{' '}
                  <button onClick={() => { setError(''); setStep('jurado'); }}
                    style={{ color: darkMode ? '#7FE7C4' : '#6C63FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    className="hover:underline">
                    {t('login.login_here')}
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── EMAIL ── */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div className="text-center mb-6">
                  <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: textCol, marginBottom: '6px' }}>{t('login.email_step_title')}</h1>
                  <p style={{ fontSize: '0.83rem', color: mutedCol, lineHeight: 1.6 }}>{t('login.email_step_subtitle')}</p>
                </div>
                <div className="mb-4">
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#C0BAE0' : '#3D3660', display: 'block', marginBottom: '6px' }}>
                    {t('login.institutional_email')}
                  </label>
                  <input type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                    onKeyDown={e => e.key === 'Enter' && handleRequestOtp()}
                    placeholder="tu.nombre@mail.escuelaing.edu.co"
                    autoFocus
                    style={{ width: '100%', padding: '13px 15px', borderRadius: '12px', border: `1.5px solid ${error ? '#FF4757' : emailFocused ? '#00D9FF' : 'rgba(108,99,255,0.3)'}`, background: inputBg, color: textCol, fontSize: '0.88rem', outline: 'none', boxShadow: emailFocused ? '0 0 0 3px rgba(0,217,255,0.1)' : 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
                </div>
                {error && <p style={{ fontSize: '0.78rem', color: '#FF4757', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}
                <motion.button onClick={handleRequestOtp} disabled={loading}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={primaryBtn}>
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : t('login.send_code')}
                </motion.button>
              </motion.div>
            )}

            {/* ── OTP ── */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div className="text-center mb-6">
                  <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: textCol, marginBottom: '6px' }}>{t('login.otp_title')}</h1>
                  <p style={{ fontSize: '0.83rem', color: mutedCol, lineHeight: 1.6 }}>
                    {t('login.otp_subtitle')}{' '}
                    <span style={{ color: darkMode ? '#7FE7C4' : '#0D9D74', fontWeight: 600 }}>{maskedEmail}</span>
                  </p>
                </div>

                {/* Digit boxes */}
                <div className="flex justify-center gap-2 sm:gap-3 mb-5">
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      style={{ width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, borderRadius: '12px', border: `1.5px solid ${error ? '#FF4757' : digit ? '#6C63FF' : 'rgba(108,99,255,0.3)'}`, background: inputBg, color: textCol, outline: 'none', boxShadow: digit ? '0 0 0 3px rgba(108,99,255,0.15)' : 'none', transition: 'border-color 0.15s', caretColor: '#6C63FF' }} />
                  ))}
                </div>

                {error && <p style={{ fontSize: '0.78rem', color: '#FF4757', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}

                <motion.button onClick={handleVerifyOtp} disabled={loading || otp.join('').length < 6}
                  whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: 0.98 }} style={primaryBtn}>
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : t('login.verify_code')}
                </motion.button>

                {/* Resend with cooldown */}
                <p className="text-center mt-4" style={{ fontSize: '0.78rem', color: mutedCol }}>
                  {t('login.no_code')}{' '}
                  {otpCooldown > 0 ? (
                    <span style={{ color: mutedCol }}>{t('login.resend_in', { count: otpCooldown })}</span>
                  ) : (
                    <button onClick={() => { setError(''); handleRequestOtp(); }} disabled={loading}
                      style={{ color: darkMode ? '#7FE7C4' : '#6C63FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      className="hover:underline">
                      {t('login.resend')}
                    </button>
                  )}
                </p>
              </motion.div>
            )}

            {/* ── JURADO — correo + contraseña, sin dominio institucional ── */}
            {step === 'jurado' && (
              <motion.div key="jurado" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div className="text-center mb-6">
                  <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: textCol, marginBottom: '6px' }}>{t('login.juror_title')}</h1>
                  <p style={{ fontSize: '0.83rem', color: mutedCol, lineHeight: 1.6 }}>{t('login.juror_subtitle')}</p>
                </div>
                <div className="mb-3">
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#C0BAE0' : '#3D3660', display: 'block', marginBottom: '6px' }}>
                    {t('login.email_label')}
                  </label>
                  <input type="email" value={juradoEmail}
                    onChange={e => { setJuradoEmail(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleJuradoLogin()}
                    placeholder="jurado@ejemplo.com"
                    autoFocus
                    style={{ width: '100%', padding: '13px 15px', borderRadius: '12px', border: `1.5px solid ${error ? '#FF4757' : 'rgba(108,99,255,0.3)'}`, background: inputBg, color: textCol, fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }} />
                </div>
                <div className="mb-4">
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#C0BAE0' : '#3D3660', display: 'block', marginBottom: '6px' }}>
                    {t('login.password_label')}
                  </label>
                  <input type="password" value={juradoPassword}
                    onChange={e => { setJuradoPassword(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleJuradoLogin()}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '13px 15px', borderRadius: '12px', border: `1.5px solid ${error ? '#FF4757' : 'rgba(108,99,255,0.3)'}`, background: inputBg, color: textCol, fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }} />
                </div>
                {error && <p style={{ fontSize: '0.78rem', color: '#FF4757', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}
                <motion.button onClick={handleJuradoLogin} disabled={loading}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={primaryBtn}>
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : t('login.sign_in')}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          {step !== 'jurado' && (
            <div className="mt-6 pt-5 border-t" style={{ borderColor: 'rgba(108,99,255,0.12)' }}>
              <p className="text-center" style={{ fontSize: '0.85rem', color: mutedCol }}>
                {t('login.no_account')}{' '}
                <button onClick={onGoRegister}
                  style={{ color: darkMode ? '#7FE7C4' : '#6C63FF', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                  className="hover:underline">
                  {t('login.register')}
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
      <LegalModals open={legalModal} darkMode={darkMode} onClose={() => setLegalModal(null)} />
    </div>
  );
}
