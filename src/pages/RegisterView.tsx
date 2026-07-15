/**
 * RegisterView — pantalla de registro de U•link
 *
 * Solo muestra el botón de Microsoft OAuth.
 * Al volver del redirect, MicrosoftCallback → handleLoginSuccess → OnboardingView.
 * El OTP es exclusivo del LoginView (inicio de sesión).
 */
import { useState } from 'react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { AnimatedBackground } from '../components/AnimatedBackground';
import logoNuevoOscuroImg from '../assets/logoNuevoOscuro.png';
import logoNuevoClaroImg  from '../assets/logoNuevoClaro.png';
import monoImg            from '../assets/monoULink.png';
import { motion } from 'motion/react';
import { LegalModals, type LegalModalType } from '../components/LegalContent';

const MS_CLIENT_ID = 'd378f378-5c84-4dc8-8ce6-85bf56b42a45';
const MS_TENANT    = 'common';
const MS_REDIRECT  = window.location.origin + '/auth/callback';

interface RegisterViewProps {
  onRegister: () => void;  // no usado directamente — el OAuth maneja el flujo
  onGoLogin:  () => void;
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

export function RegisterView({ onGoLogin, darkMode = true, setDarkMode }: RegisterViewProps) {
  const [loading, setLoading] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  const cardBg   = darkMode ? '#1A1A2E' : '#FFFFFF';
  const textCol  = darkMode ? '#E0E0FF' : '#1A1829';
  const mutedCol = darkMode ? '#999'    : '#6B6490';

  const handleMicrosoft = () => {
    setLoading(true);
    // Marcar que este OAuth viene del flujo de registro
    sessionStorage.setItem('ulink_oauth_origin', 'register');
    const params = new URLSearchParams({
      client_id:     MS_CLIENT_ID,
      response_type: 'code',
      redirect_uri:  MS_REDIRECT,
      response_mode: 'query',
      scope:         'openid profile email offline_access',
    });
    window.location.href =
      `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize?${params}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground light={!darkMode} />

      {/* Theme toggle */}
      {setDarkMode && (
        <button onClick={() => setDarkMode(!darkMode)}
          className="absolute top-5 right-5 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all hover:opacity-80"
          style={{ background: darkMode ? 'rgba(26,26,46,0.85)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderColor: 'rgba(108,99,255,0.3)', color: darkMode ? '#FFB347' : '#6C63FF' }}>
          {darkMode
            ? <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0l.7.71a1 1 0 01-1.41 1.41l-.71-.7a1 1 0 010-1.42zm13.72 13.72a1 1 0 011.42 0 1 1 0 010 1.42l-.71.7a1 1 0 01-1.41-1.41l.7-.71zM2 12a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm17 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM6.34 17.66a1 1 0 010 1.41l-.71.71a1 1 0 01-1.41-1.41l.7-.71a1 1 0 011.42 0zm11.32-11.32a1 1 0 010 1.41l-.71.71a1 1 0 01-1.41-1.41l.7-.71a1 1 0 011.42 0zM12 7a5 5 0 110 10A5 5 0 0112 7z" /></svg>
            : <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>}
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
      )}

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] relative z-10">
        <div className="rounded-[20px] p-8 sm:p-10 relative overflow-hidden"
          style={{ background: cardBg, border: '1px solid rgba(108,99,255,0.25)', boxShadow: darkMode ? '0 0 60px rgba(0,217,255,0.06), 0 24px 64px rgba(0,0,0,0.4)' : '0 8px 40px rgba(108,99,255,0.12)' }}>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), transparent)' }} />

          {/* Logo */}
          <div className="flex justify-center mb-5">
            <ImageWithFallback src={darkMode ? logoNuevoOscuroImg : logoNuevoClaroImg} alt="U•link"
              className="object-contain" style={{ height: 88, width: 'auto' }} />
          </div>

          {/* Mascot */}
          <div className="flex justify-center mb-6">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <ImageWithFallback src={monoImg} alt="Mascota"
                className="object-contain"
                style={{ width: 80, height: 80, filter: 'drop-shadow(0 8px 20px rgba(108,99,255,0.3))' }} />
            </motion.div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 style={{ fontWeight: 800, fontSize: '1.6rem', color: textCol, marginBottom: '8px' }}>
              Crear cuenta
            </h1>
            <p style={{ fontSize: '0.88rem', color: mutedCol, lineHeight: 1.6 }}>
              Regístrate con tu cuenta institucional ECI
            </p>
          </div>

          {/* Microsoft button */}
          <motion.button
            onClick={handleMicrosoft}
            disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(108,99,255,0.45)' }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #5250d0)', color: 'white', fontSize: '1rem', boxShadow: '0 4px 20px rgba(108,99,255,0.3)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><MicrosoftLogo size={20} /> Continuar con Microsoft</>
            }
          </motion.button>

          <p className="text-center mt-3" style={{ fontSize: '0.75rem', color: mutedCol }}>
            Solo cuentas <span style={{ color: darkMode ? '#7FE7C4' : '#0D9D74', fontWeight: 600 }}>@mail.escuelaing.edu.co</span>
          </p>

          {/* Divider + login link */}
          <div className="flex items-center gap-3 mt-7 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.12)' }} />
            <span style={{ fontSize: '0.72rem', color: mutedCol }}>¿Ya tienes cuenta?</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(108,99,255,0.12)' }} />
          </div>

          <button onClick={onGoLogin}
            className="w-full py-3 rounded-2xl font-semibold transition-all hover:opacity-80"
            style={{ background: 'transparent', border: `1.5px solid ${darkMode ? 'rgba(108,99,255,0.35)' : 'rgba(108,99,255,0.3)'}`, color: darkMode ? '#A09AE0' : '#6C63FF', fontSize: '0.95rem', cursor: 'pointer' }}>
            Iniciar sesión
          </button>

          {/* Legal footer */}
          <p className="text-center mt-6" style={{ fontSize: '0.7rem', color: '#555', lineHeight: 1.5 }}>
            Al continuar aceptas nuestros{' '}
            <button onClick={() => setLegalModal('terminos')} style={{ color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:underline">Términos de uso</button>
            {' '}y{' '}
            <button onClick={() => setLegalModal('privacidad')} style={{ color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:underline">Política de privacidad</button>
          </p>
        </div>
      </motion.div>
      <LegalModals open={legalModal} darkMode={darkMode} onClose={() => setLegalModal(null)} />
    </div>
  );
}
