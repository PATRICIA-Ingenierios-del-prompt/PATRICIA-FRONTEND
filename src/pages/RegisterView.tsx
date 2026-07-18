/**
 * RegisterView — pantalla de registro de U•link
 *
 * Muestra el botón de Microsoft OAuth y la opción de OTP por correo.
 * Al volver del redirect OAuth, MicrosoftCallback → handleLoginSuccess → OnboardingView.
 * Con OTP, verifyOtp devuelve tokens → login() → onRegister() → OnboardingView.
 */
import { useState, useRef } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { AnimatedBackground } from '../components/AnimatedBackground';
import logoNuevoOscuroImg from '../assets/logoNuevoOscuro.png';
import logoNuevoClaroImg  from '../assets/logoNuevoClaro.png';
import monoImg            from '../assets/monoULink.png';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../services/authService';
import { useAuth } from '../store/AuthContext';
import { friendlyError } from '../lib/errorMessages';
import { useTranslation } from 'react-i18next';
import { LegalModals, RegisterConsentModal, type LegalModalType } from '../components/LegalContent';

const MS_CLIENT_ID = 'd378f378-5c84-4dc8-8ce6-85bf56b42a45';
const MS_TENANT    = 'common';
const MS_REDIRECT  = window.location.origin + '/auth/callback';

const VALID_DOMAINS = ['@mail.escuelaing.edu.co', '@escuelaing.edu.co'];

type RegisterStep = 'main' | 'email' | 'otp';

interface RegisterViewProps {
  onRegister: () => void;
  onGoLogin:  () => void;
  onDecline:  () => void;  // "No acepto" en el consentimiento — vuelve al landing
  darkMode?:  boolean;
  setDarkMode?: (v: boolean) => void;
}

function MicrosoftLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <rect x="0"  y="0"  width="10" height="10" fill="#F25022" />
      <rect x="11" y="0"  width="10" height="10" fill="#7FBA00" />
      <rect x="0"  y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

export function RegisterView({ onRegister, onGoLogin, onDecline, darkMode = true, setDarkMode }: RegisterViewProps) {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [step, setStep]       = useState<RegisterStep>('main');
  const [loading, setLoading] = useState(false);
  const [email, setEmail]     = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [error, setError]     = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<'microsoft' | 'otp' | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cardBg   = darkMode ? '#1A1A2E' : '#FFFFFF';
  const textCol  = darkMode ? '#E0E0FF' : '#1A1829';
  const mutedCol = darkMode ? '#999'    : '#6B6490';
  const inputBg  = darkMode ? '#0F0F1E' : '#F5F3FF';

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

  const handleMicrosoft = () => {
    setLoading(true);
    sessionStorage.setItem('ulink_oauth_origin', 'register');
    const params = new URLSearchParams({
      client_id:     MS_CLIENT_ID,
      response_type: 'code',
      redirect_uri:  MS_REDIRECT,
      response_mode: 'query',
      scope:         'openid profile email offline_access',
      prompt:        'select_account',
    });
    window.location.href =
      `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize?${params}`;
  };

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

  const handleRequestOtp = async () => {
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError(t('register.email_required')); return; }
    if (!VALID_DOMAINS.some(d => trimmed.endsWith(d))) {
      setError(t('register.domain_error'));
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
      if (status === 403) setError(t('register.domain_not_allowed'));
      else if (status === 429) setError(t('register.too_many_attempts'));
      else setError(friendlyError(e, t('register.code_send_error')));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError(t('register.otp_required')); return; }
    setLoading(true);
    setError('');
    try {
      const tokens = await authService.verifyOtp(email.trim().toLowerCase(), code);
      login(tokens.accessToken, tokens.refreshToken);
      onRegister();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) setError(t('register.otp_invalid'));
      else setError(friendlyError(e, t('register.otp_verify_error')));
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } finally {
      setLoading(false);
    }
  };

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
  };

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1***$2');

  const handleConsentAccept = () => {
    setShowConsent(false);
    if (pendingMethod === 'microsoft') handleMicrosoft();
    else if (pendingMethod === 'otp') setStep('email');
    setPendingMethod(null);
  };
  const handleConsentDecline = () => {
    setShowConsent(false);
    setPendingMethod(null);
    onDecline();
  };

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
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{darkMode ? t('register.light_mode') : t('register.dark_mode')}</span>
        </button>
      )}

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] relative z-10">
        <div className="rounded-[20px] p-8 sm:p-10 relative overflow-hidden"
          style={{ background: cardBg, border: '1px solid rgba(108,99,255,0.25)', boxShadow: darkMode ? '0 0 60px rgba(0,217,255,0.06), 0 24px 64px rgba(0,0,0,0.4)' : '0 8px 40px rgba(108,99,255,0.12)' }}>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), transparent)' }} />

          {/* Back button */}
          <AnimatePresence>
            {step !== 'main' && (
              <motion.button key="back" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                onClick={goBack}
                className="flex items-center gap-1.5 mb-4 hover:opacity-70 transition-opacity"
                style={{ color: mutedCol, fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <ArrowLeft size={15} /> {t('register.back')}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Logo */}
          <div className="flex justify-center mb-5">
            <ImageWithFallback src={darkMode ? logoNuevoOscuroImg : logoNuevoClaroImg} alt="U•link"
              className="object-contain" style={{ height: 88, width: 'auto' }} />
          </div>

          {/* Mascot — only on main step */}
          <AnimatePresence>
            {step === 'main' && (
              <motion.div key="mono" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="flex justify-center mb-6 overflow-hidden">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <ImageWithFallback src={monoImg} alt="Mascota"
                    className="object-contain"
                    style={{ width: 80, height: 80, filter: 'drop-shadow(0 8px 20px rgba(108,99,255,0.3))' }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step content */}
          <AnimatePresence mode="wait">

            {/* ── MAIN ── */}
            {step === 'main' && (
              <motion.div key="main" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div className="text-center mb-8">
                  <h1 style={{ fontWeight: 800, fontSize: '1.6rem', color: textCol, marginBottom: '8px' }}>{t('register.title')}</h1>
                  <p style={{ fontSize: '0.88rem', color: mutedCol, lineHeight: 1.6 }}>{t('register.subtitle')}</p>
                </div>

                <motion.button
                  onClick={() => { setPendingMethod('microsoft'); setShowConsent(true); }}
                  disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(108,99,255,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #5250d0)', color: 'white', fontSize: '1rem', boxShadow: '0 4px 20px rgba(108,99,255,0.3)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><MicrosoftLogo size={20} /> Continuar con Microsoft</>}
                </motion.button>

                <p className="text-center mt-3" style={{ fontSize: '0.75rem', color: mutedCol }}>
                  {t('register.only_domains')} <span style={{ color: darkMode ? '#7FE7C4' : '#0D9D74', fontWeight: 600 }}>@mail.escuelaing.edu.co</span>
                </p>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.15)' }} />
                  <span style={{ fontSize: '0.75rem', color: mutedCol }}>{t('register.or')}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.15)' }} />
                </div>

                <motion.button
                  onClick={() => { setPendingMethod('otp'); setShowConsent(true); }}
                  whileHover={{ background: darkMode ? 'rgba(108,99,255,0.08)' : 'rgba(108,99,255,0.06)' }}
                  whileTap={{ scale: 0.98 }}
                  style={outlinedBtn}>
                  <Mail size={18} />
                  {t('register.email_code')}
                </motion.button>

                <div className="flex items-center gap-3 mt-7 mb-5">
                  <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.12)' }} />
                  <span style={{ fontSize: '0.72rem', color: mutedCol }}>{t('register.already_have_account')}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.12)' }} />
                </div>

                <button onClick={onGoLogin}
                  className="w-full py-3 rounded-2xl font-semibold transition-all hover:opacity-80"
                  style={{ background: 'transparent', border: `1.5px solid ${darkMode ? 'rgba(108,99,255,0.35)' : 'rgba(108,99,255,0.3)'}`, color: darkMode ? '#A09AE0' : '#6C63FF', fontSize: '0.95rem', cursor: 'pointer' }}>
                  {t('register.login')}
                </button>
              </motion.div>
            )}

            {/* ── EMAIL ── */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div className="text-center mb-6">
                  <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: textCol, marginBottom: '6px' }}>{t('register.email_title')}</h1>
                  <p style={{ fontSize: '0.83rem', color: mutedCol, lineHeight: 1.6 }}>
                    {t('register.email_subtitle')}
                  </p>
                </div>
                <div className="mb-4">
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#C0BAE0' : '#3D3660', display: 'block', marginBottom: '6px' }}>
                    {t('register.email_label')}
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
                    : t('register.send_code')}
                </motion.button>
              </motion.div>
            )}

            {/* ── OTP ── */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div className="text-center mb-6">
                  <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: textCol, marginBottom: '6px' }}>{t('register.verify_title')}</h1>
                  <p style={{ fontSize: '0.83rem', color: mutedCol, lineHeight: 1.6 }}>
                    {t('register.verify_subtitle')}{' '}
                    <span style={{ color: darkMode ? '#7FE7C4' : '#0D9D74', fontWeight: 600 }}>{maskedEmail}</span>
                  </p>
                </div>

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
                    : t('register.verify_code')}
                </motion.button>

                <p className="text-center mt-4" style={{ fontSize: '0.78rem', color: mutedCol }}>
                  {t('register.no_code')}{' '}
                  {otpCooldown > 0 ? (
                    <span style={{ color: mutedCol }}>{t('register.resend_in', { count: otpCooldown })}</span>
                  ) : (
                    <button onClick={() => { setError(''); handleRequestOtp(); }} disabled={loading}
                      style={{ color: darkMode ? '#7FE7C4' : '#6C63FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      className="hover:underline">
                      {t('register.resend')}
                    </button>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
      <LegalModals open={legalModal} darkMode={darkMode} onClose={() => setLegalModal(null)} />
      {showConsent && (
        <RegisterConsentModal darkMode={darkMode}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline} />
      )}
    </div>
  );
}
