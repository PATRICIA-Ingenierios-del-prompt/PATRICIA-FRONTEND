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
  const canSubmit = message.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addMessage({ name: name.trim() || 'Anónimo', email: email.trim(), message: message.trim() });
    addToast({ type: 'info', title: 'Mensaje enviado', message: 'Nuestro equipo te responderá pronto.' });
    onClose();
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
