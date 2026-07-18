import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { useAuth } from '../store/AuthContext';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { friendlyError } from '../lib/errorMessages';
import { useTranslation } from 'react-i18next';

interface Props {
  onSuccess: (fromRegister: boolean) => void;
  onError: () => void;
  darkMode: boolean;
}

/**
 * Handles the Microsoft OAuth2 redirect: /auth/callback?code=...
 * Sends the code to the Gateway → Auth Backend and stores the JWT tokens.
 */
export function MicrosoftCallback({ onSuccess, onError, darkMode }: Props) {
  const { t: tr } = useTranslation();
  const { login } = useAuth();
  const [status, setStatus]   = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params      = new URLSearchParams(window.location.search);
    const code        = params.get('code');
    const msError     = params.get('error');

    if (msError || !code) {
      setErrorMsg(tr('microsoft_callback.ms_error'));
      setStatus('error');
      return;
    }

    const redirectUri = window.location.origin + '/auth/callback';

    authService
      .loginMicrosoft(code, redirectUri)
      .then(tokens => {
        login(tokens.accessToken, tokens.refreshToken);
        window.history.replaceState({}, '', '/');
        onSuccess();
      })
      .catch(err => {
        setErrorMsg(friendlyError(err, tr('microsoft_callback.login_error')));
        setStatus('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardBg  = darkMode ? '#1A1A2E' : '#FFFFFF';
  const textCol = darkMode ? '#E0E0FF' : '#1A1829';
  const mutedCol = darkMode ? '#999'   : '#6B6490';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground light={!darkMode} />
      <div className="rounded-[20px] p-8 relative z-10 w-full max-w-sm text-center"
        style={{ background: cardBg, border: '1px solid rgba(108,99,255,0.25)', boxShadow: darkMode ? '0 24px 64px rgba(0,0,0,0.4)' : '0 8px 40px rgba(108,99,255,0.12)' }}>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), transparent)' }} />

        {status === 'loading' ? (
          <>
            <div className="w-16 h-16 rounded-full border-4 animate-spin mx-auto mb-6"
              style={{ borderColor: 'rgba(108,99,255,0.2)', borderTopColor: '#6C63FF' }} />
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: textCol, marginBottom: '8px' }}>
              {tr('microsoft_callback.verifying')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: mutedCol, lineHeight: 1.6 }}>
              {tr('microsoft_callback.validating')}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)' }}>
              <span style={{ fontSize: '2rem' }}>⚠️</span>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#FF4757', marginBottom: '8px' }}>
              {tr('microsoft_callback.auth_error')}
            </h2>
            <p style={{ fontSize: '0.83rem', color: mutedCol, lineHeight: 1.6, marginBottom: '24px' }}>
              {errorMsg}
            </p>
            <button onClick={onError}
              className="w-full py-3 rounded-2xl font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #5250d0)', color: 'white', border: 'none', cursor: 'pointer' }}>
              {tr('microsoft_callback.back_to_login')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
