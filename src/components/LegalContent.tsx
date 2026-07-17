import { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../store/AuthContext';
import { useSupport } from '../store/SupportContext';
import { addToast } from './ToastSystem';

export type LegalModalType = 'terminos' | 'privacidad' | 'ayuda' | 'contacto' | null;

const CONTACT_EMAILS = ['juan.lcruz@mail.escuelaing.edu.co', 'mariana.malagon-t@mail.escuelaing.edu.co'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{title}</p>
      <p>{children}</p>
    </div>
  );
}

function TerminosContent() {
  return (
    <div>
      <Section title="Una comunidad, no una app cualquiera">
        U•link es exclusivamente para la comunidad de la Escuela Colombiana de Ingeniería — por eso pedimos tu correo institucional para registrarte.
      </Section>
      <Section title="Respeto, siempre">
        En los parches, chats, eventos y en cualquier rincón de U•link esperamos el mismo respeto que tendrías cara a cara con un compañero. Eso significa cero tolerancia a comportamiento inapropiado, acoso o bullying, discurso de odio, spam o publicidad no solicitada, y contenido ofensivo.
      </Section>
      <Section title="Si algo no está bien, repórtalo">
        Cualquier miembro puede reportar a otro usuario desde un parche, indicando la categoría y explicando qué pasó. Los reportes llegan de forma anónima a nuestro equipo de administración, que los revisa y decide qué hacer.
      </Section>
      <Section title="Consecuencias">
        Violaciones repetidas o graves a estas normas pueden llevar a la suspensión temporal o definitiva de la cuenta.
      </Section>
      <Section title="Tu contenido">
        Lo que compartes (mensajes, publicaciones, archivos) sigue siendo tuyo — solo pedimos que respete estas normas mientras esté en U•link.
      </Section>
      <Section title="Ubicación en vivo">
        Al usar la función de ubicación en vivo durante un evento, aceptas que tu ubicación se transmita y almacene de forma cifrada, únicamente para efectos de seguridad durante ese evento. De acuerdo con la Ley de Habeas Data (Ley 1581 de 2012), tus datos de ubicación se eliminan automáticamente después de <strong>12 horas</strong>, salvo que se haya reportado un incidente durante ese periodo — en ese caso, se conservan como evidencia asociada al reporte.
      </Section>
    </div>
  );
}

function PrivacidadContent() {
  return (
    <div>
      <Section title="Qué recopilamos">
        Tu perfil (nombre, carrera, semestre, intereses), tu actividad dentro de la app (parches, chats y eventos a los que te unes) y, solo mientras la actives, tu ubicación en vivo durante un evento.
      </Section>
      <Section title="Para qué la usamos">
        Para que la app funcione: hacer match con otros estudiantes, mostrarte parches y eventos relevantes, y — cuando compartes tu ubicación — ayudar a la seguridad durante los eventos.
      </Section>
      <Section title="Ubicación: cifrada y de corta duración">
        Tu ubicación en vivo se transmite y guarda cifrada, y se borra automáticamente a las <strong>12 horas</strong> de haberse registrado, conforme a la Ley de Habeas Data (Ley 1581 de 2012). La única excepción es si hubo un incidente reportado durante ese lapso, caso en el que se conserva como evidencia.
      </Section>
      <Section title="Quién ve los reportes">
        Solo nuestro equipo de administración revisa los reportes y mensajes de soporte que envías. No se comparten con otros usuarios.
      </Section>
      <Section title="No vendemos tus datos">
        Tu información nunca se vende ni se comparte con terceros fuera de U•link.
      </Section>
      <Section title="¿Dudas?">
        Escríbenos a cualquiera de los correos en la sección de Contacto.
      </Section>
    </div>
  );
}

function ContactoContent() {
  return (
    <div>
      <p style={{ marginBottom: 14 }}>¿Tienes alguna duda, sugerencia o algo que contarnos? Escríbenos directamente:</p>
      <div className="space-y-2">
        {CONTACT_EMAILS.map(email => (
          <a key={email} href={`mailto:${email}`}
            className="block px-4 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(108,99,255,0.1)', color: '#6C63FF' }}>
            {email}
          </a>
        ))}
      </div>
    </div>
  );
}

function AyudaContent({ onClose }: { onClose: () => void }) {
  const { userName, userEmail } = useAuth();
  const { addMessage } = useSupport();
  const [name, setName] = useState(userName ?? '');
  const [email, setEmail] = useState(userEmail ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = message.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await addMessage({ name: name.trim() || 'Anónimo', email: email.trim(), message: message.trim() });
      addToast({ type: 'info', title: 'Mensaje enviado', message: 'Nuestro equipo te responderá pronto.' });
      onClose();
    } catch {
      addToast({ type: 'reporte', title: 'No se pudo enviar', message: 'Intenta de nuevo más tarde.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: '0.85rem',
    background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.18)', color: 'inherit', outline: 'none',
  };

  return (
    <div>
      <p style={{ marginBottom: 14 }}>Cuéntanos qué necesitas y le llegará directo a nuestro equipo.</p>
      <div className="space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre (opcional)" style={inputStyle} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Tu correo (opcional)" style={inputStyle} />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="¿En qué te podemos ayudar?" rows={4}
          className="resize-none" style={inputStyle} />
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: '#6C63FF', color: 'white', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
          Enviar mensaje
        </button>
      </div>
    </div>
  );
}

const TITLES: Record<Exclude<LegalModalType, null>, string> = {
  terminos: 'Términos de uso',
  privacidad: 'Política de privacidad',
  ayuda: 'Centro de ayuda',
  contacto: 'Contacto',
};

export function LegalModals({ open, darkMode, onClose }: { open: LegalModalType; darkMode: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Modal title={TITLES[open]} darkMode={darkMode} onClose={onClose}>
      {open === 'terminos' && <TerminosContent />}
      {open === 'privacidad' && <PrivacidadContent />}
      {open === 'contacto' && <ContactoContent />}
      {open === 'ayuda' && <AyudaContent onClose={onClose} />}
    </Modal>
  );
}

// ── Consentimiento en el registro — se muestra el contenido real, no un resumen.
// "No acepto" saca al usuario del registro (lo manda de vuelta al landing).
export function RegisterConsentModal({ darkMode, onAccept, onDecline }: { darkMode: boolean; onAccept: () => void; onDecline: () => void }) {
  const [tab, setTab] = useState<'terminos' | 'privacidad'>('terminos');
  const mutedCol = darkMode ? '#9A93C9' : '#6B6490';

  return (
    <Modal title="Términos y Condiciones" darkMode={darkMode} onClose={onDecline}
      footer={
        <div className="flex gap-3">
          <button onClick={onDecline}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(108,99,255,0.1)', color: mutedCol }}>
            No acepto
          </button>
          <button onClick={onAccept}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#5250d0)', color: 'white' }}>
            Acepto
          </button>
        </div>
      }>
      <p style={{ marginBottom: 16, fontWeight: 600, color: darkMode ? '#E0DAFF' : '#1A1829' }}>
        Para crear tu cuenta en U•link, primero lee y acepta lo siguiente:
      </p>
      <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'rgba(108,99,255,0.08)' }}>
        {([['terminos', 'Términos de uso'], ['privacidad', 'Privacidad']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: tab === id ? '#6C63FF' : 'transparent', color: tab === id ? 'white' : mutedCol }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'terminos' ? <TerminosContent /> : <PrivacidadContent />}
    </Modal>
  );
}
