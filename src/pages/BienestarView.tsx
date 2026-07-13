import { useState, useEffect, useRef } from 'react';
import { Send, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { addToast } from '../components/ToastSystem';
import { sendChatMessage } from '../services/llmApi';
import monoPatriciaImg  from '../assets/monoFondoU.png';
import monoULinkImg     from '../assets/monoULink.png';
import monoDiarioImg    from '../assets/monoDiario.png';
import monoRespiraImg   from '../assets/monoRespiraN.png';
import monoTranqImg     from '../assets/monoTranquiloN.png';
import monoMusicaImg    from '../assets/monoMusicaN.png';
import ruidoBlancoAudio from '../assets/audio/RuidoBlanco.mp3';
import ruidoMarronAudio from '../assets/audio/RuidoMarron.mp3';
import lluviaAudio      from '../assets/audio/lluvia.mp3';
import bosqueAudio      from '../assets/audio/bosque.mp3';
import olasAudio        from '../assets/audio/olas.mp3';

const INIT_MSGS = [
  { id: 1, from: 'bot', text: '¡Hola! Soy Mono, tu compañero de bienestar. ¿Cómo te sientes hoy?' },
];

const BOT_RESPONSES = [
  'Entiendo, los parciales pueden ser muy agotadores. Recuerda que el estrés es temporal. ¿Quieres practicar una respiración rápida?',
  'Te escucho. Es normal sentirse así. ¿Has dormido bien esta semana? El descanso es fundamental para el rendimiento académico.',
  'Gracias por compartirlo conmigo. ¿Sabes que 5 minutos de meditación pueden reducir el cortisol hasta un 30%? ¿Te gustaría intentarlo?',
  'Eso es totalmente válido. ¿Quieres que te recomiende alguna película relajante o música para desconectarte un rato?',
  '¡Eso suena increíble! Me alegra que estés bien. Sigue así. ¿Hay algo en lo que te pueda ayudar hoy?',
];

const SOUNDS = [
  { id: 1, name: 'Ruido Blanco',    emoji: '🤍', category: 'Relajación', freq: '432Hz',   audio: ruidoBlancoAudio },
  { id: 2, name: 'Ruido Marrón',    emoji: '🟫', category: 'Relajación', freq: '220Hz',   audio: ruidoMarronAudio },
  { id: 3, name: 'Lluvia Suave',    emoji: '🌧️', category: 'Naturaleza', freq: 'Natural', audio: lluviaAudio },
  { id: 4, name: 'Bosque Nocturno', emoji: '🌿', category: 'Naturaleza', freq: 'Natural', audio: bosqueAudio },
  { id: 5, name: 'Olas del Mar',    emoji: '🌊', category: 'Naturaleza', freq: 'Natural', audio: olasAudio },
];

const MEDIA_RECS = [
  { id: 1, title: 'Soul', type: 'Película', platform: 'Disney+', genre: 'Animación', mood: 'Inspiración', emoji: '🎭', color: '#6C63FF', desc: 'Perfecta para reflexionar sobre tus metas' },
  { id: 2, title: 'Ted Lasso', type: 'Serie', platform: 'Apple TV+', genre: 'Comedia', mood: 'Alegría', emoji: '⚽', color: '#7FE7C4', desc: 'El antidepresivo más efectivo de 2024' },
  { id: 3, title: 'The Queen\'s Gambit', type: 'Serie', platform: 'Netflix', genre: 'Drama', mood: 'Motivación', emoji: '♟️', color: '#FFB347', desc: 'Para cuando necesitas recordar tu potencial' },
  { id: 4, title: 'Coco', type: 'Película', platform: 'Disney+', genre: 'Animación', mood: 'Nostálgico', emoji: '🎸', color: '#FF6B9D', desc: 'Para conectar con tus raíces y familia' },
  { id: 5, title: 'Severance', type: 'Serie', platform: 'Apple TV+', genre: 'Thriller', mood: 'Evasión', emoji: '🚪', color: '#5BC8FF', desc: 'Te hará olvidar los problemas por 1h' },
  { id: 6, title: 'Everything Everywhere', type: 'Película', platform: 'Prime Video', genre: 'Ciencia Ficción', mood: 'Energía', emoji: '🌀', color: '#A78BFA', desc: 'Una explosión de creatividad y emoción' },
];

const SPORTS_RECS = [
  { name: 'Yoga 15 min', emoji: '🧘', duration: '15 min', cal: '60 kcal', level: 'Fácil', color: '#7FE7C4' },
  { name: 'Caminata campus', emoji: '🚶', duration: '20 min', cal: '80 kcal', level: 'Fácil', color: '#6C63FF' },
  { name: 'HIIT básico', emoji: '🏃', duration: '25 min', cal: '200 kcal', level: 'Medio', color: '#FFB347' },
  { name: 'Estiramientos', emoji: '🤸', duration: '10 min', cal: '30 kcal', level: 'Fácil', color: '#FF6B9D' },
];

const EMOCIONES = [
  { emoji: '😊', label: 'Genial', color: '#7FE7C4', value: 5 },
  { emoji: '🙂', label: 'Bien',   color: '#6C63FF', value: 4 },
  { emoji: '😐', label: 'Okei',   color: '#FFB347', value: 3 },
  { emoji: '😔', label: 'Mal',    color: '#FF6B9D', value: 2 },
  { emoji: '😰', label: 'Estres', color: '#FF4D6A', value: 1 },
];

interface DiaryEntry { isoDate: string; date: string; emotion: string; note: string; color: string }

const DIARIO_STORAGE_KEY = 'patricia_diario_entries';

function loadDiaryEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(DIARIO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDiaryEntries(entries: DiaryEntry[]) {
  try { localStorage.setItem(DIARIO_STORAGE_KEY, JSON.stringify(entries)); } catch { /* almacenamiento no disponible */ }
}

/** Racha de días consecutivos (incluyendo hoy) con una entrada de diario. */
function computeStreak(entries: DiaryEntry[]): number {
  const days = new Set(entries.map(e => e.isoDate));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Últimos 7 días (L→D de la semana actual) con el valor de emoción registrado, o null si no hay entrada. */
function computeWeekMoods(entries: DiaryEntry[]): (number | null)[] {
  const byDate = new Map(entries.map(e => [e.isoDate, EMOCIONES.find(em => em.emoji === e.emotion)?.value ?? null]));
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0 = lunes
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return byDate.get(d.toISOString().slice(0, 10)) ?? null;
  });
}

const BREATHING_MODES = [
  { id: '4-7-8',  name: 'Técnica 4-7-8',         desc: 'Reduce ansiedad y facilita el sueño',    phases: [{ label: 'Inhala', duration: 4000 }, { label: 'Mantén', duration: 7000 }, { label: 'Exhala', duration: 8000 }] },
  { id: 'box',    name: 'Respiración de Caja',    desc: 'Para concentración antes de un examen',  phases: [{ label: 'Inhala', duration: 4000 }, { label: 'Mantén', duration: 4000 }, { label: 'Exhala', duration: 4000 }, { label: 'Mantén', duration: 4000 }] },
  { id: 'diafrag',name: 'Respiración Diafragmática', desc: 'Relajación profunda y manejo del estrés', phases: [{ label: 'Inhala', duration: 5000 }, { label: 'Exhala', duration: 7000 }] },
];

const DIARY_PROMPTS = [
  '¿Qué fue lo mejor de tu día?',
  '¿Algo que te preocupa esta semana?',
  '¿Qué aprendiste hoy?',
  '¿Cómo te sientes con tus estudios?',
  '¿Algo por lo que estás agradecido/a?',
  '¿Qué quieres mejorar mañana?',
];

const AI_TIPS: Record<number, { title: string; tip: string; color: string }> = {
  5: { title: '¡Excelente estado!', tip: 'Sigue así. Es un buen momento para ayudar a otros o avanzar en proyectos importantes.', color: '#7FE7C4' },
  4: { title: 'Vas bien', tip: 'Un día tranquilo. Aprovecha para descansar y consolidar lo aprendido hoy.', color: '#6C63FF' },
  3: { title: 'Día regular', tip: 'Está bien no estar al 100%. Intenta una respiración rápida o escuchar tu playlist favorita.', color: '#FFB347' },
  2: { title: 'Ánimo', tip: 'Los días difíciles también pasan. Habla con alguien de confianza o prueba el chatbot de bienestar.', color: '#FF6B9D' },
  1: { title: 'Te escuchamos', tip: 'Reconocer el estrés es valiente. Considera hablar con el equipo de bienestar ECI hoy.', color: '#FF4D6A' },
};

const TAB_IDS = ['chat', 'diario', 'sonidos', 'respira'] as const;

export function BienestarView() {
  const t = useTheme();
  const [tab, setTab] = useState<typeof TAB_IDS[number]>('chat');
  const TABS = [
    { id: 'chat'    as const, label: 'Mono' },
    { id: 'diario'  as const, label: 'Diario' },
    { id: 'sonidos' as const, label: 'Sonidos' },
    { id: 'respira' as const, label: 'Respira' },
  ];
  const [msgs, setMsgs] = useState(INIT_MSGS);
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmocion, setSelectedEmocion] = useState<number | null>(null);
  const [playingSound, setPlayingSound] = useState<number | null>(null);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [diaryNote, setDiaryNote] = useState('');
  const [diaryEmotion, setDiaryEmotion] = useState<string | null>(null);
  const [breathMode, setBreathMode] = useState(BREATHING_MODES[0]);
  const [breathActive, setBreathActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathCycles, setBreathCycles] = useState(0);
  const [activePrompt, setActivePrompt] = useState(0);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(() => loadDiaryEntries());
  const todayIso = new Date().toISOString().slice(0, 10);
  const savedToday = diaryEntries.some(e => e.isoDate === todayIso);
  const [diaryError, setDiaryError] = useState<string | null>(null);
  const breathRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);

  const toggleSound = (id: number, src: string) => {
    if (playingSound === id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingSound(null);
    } else {
      audioRef.current?.pause();
      try {
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = muted ? 0 : volume / 100;
        audio.play().catch(() => {
          addToast({ type: 'reporte', title: 'Error de audio', message: 'No se pudo reproducir el sonido. Intenta de nuevo.' });
          setPlayingSound(null);
        });
        audioRef.current = audio;
        setPlayingSound(id);
      } catch {
        addToast({ type: 'reporte', title: 'Error de audio', message: 'No se pudo cargar el archivo de sonido.' });
      }
    }
  };

  const sendMsg = async () => {
    if (!msg.trim() || isLoading) return;
    const userText = msg.trim();
    const userMsg = { id: Date.now(), from: 'user', text: userText };
    setMsgs(p => [...p, userMsg]);
    setMsg('');
    setIsLoading(true);
    try {
      const response = await sendChatMessage(userText);
      const botMsg = { id: Date.now() + 1, from: 'bot', text: response };
      setMsgs(p => [...p, botMsg]);
    } catch {
      const errMsg = { id: Date.now() + 1, from: 'bot', text: 'No pude conectarme en este momento. Intenta de nuevo en unos segundos.' };
      setMsgs(p => [...p, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const startBreath = () => {
    setBreathActive(true);
    setBreathPhase(0);
    setBreathCycles(0);
    let phase = 0;
    let cycles = 0;
    const run = () => {
      const d = breathMode.phases[phase].duration;
      breathRef.current = setTimeout(() => {
        phase = (phase + 1) % breathMode.phases.length;
        if (phase === 0) { cycles++; setBreathCycles(c => c + 1); }
        setBreathPhase(phase);
        run();
      }, d);
    };
    run();
  };

  const stopBreath = () => {
    setBreathActive(false);
    if (breathRef.current) clearTimeout(breathRef.current);
  };

  useEffect(() => () => { if (breathRef.current) clearTimeout(breathRef.current); }, []);
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const phaseInfo = breathMode.phases[breathPhase];
  const expandedScale = phaseInfo?.label === 'Inhala' ? 1.45 : phaseInfo?.label === 'Exhala' ? 0.85 : 1.2;

  const selectedMoodVal = EMOCIONES.find(e => e.emoji === diaryEmotion)?.value || null;

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.3rem' }}>Bienestar 24/7</h2>
          <p style={{ fontSize: '0.85rem', color: t.textMuted }}>Tu espacio seguro en la ECI — siempre aquí para ti</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-3 py-1.5 rounded-xl text-sm transition-all"
              style={{
                background: tab === t.id ? 'rgba(108,99,255,0.2)' : 'transparent',
                color: tab === t.id ? '#6C63FF' : 'var(--p-muted)',
                border: `1px solid ${tab === t.id ? '#6C63FF' : 'var(--p-divider)'}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Check-in diario */}
      <div className="rounded-2xl p-4 border mb-5 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(127,231,196,0.04))', borderColor: 'var(--p-border)' }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>¿Cómo te sientes hoy?</p>
          <p style={{ fontSize: '0.75rem', color: t.textMuted }}>
            Check-in diario{computeStreak(diaryEntries) > 0 ? ` · Racha: ${computeStreak(diaryEntries)} día${computeStreak(diaryEntries) === 1 ? '' : 's'} 🔥` : ''}
          </p>
        </div>
        <div className="flex gap-4 ml-auto">
          {EMOCIONES.map(em => (
            <button key={em.value} onClick={() => setSelectedEmocion(em.value)}
              className="flex flex-col items-center gap-1 transition-all hover:scale-110"
              style={{ opacity: selectedEmocion !== null && selectedEmocion !== em.value ? 0.4 : 1 }}>
              <span style={{ fontSize: '1.6rem' }}>{em.emoji}</span>
              <span style={{ fontSize: '0.6rem', color: selectedEmocion === em.value ? em.color : 'var(--p-muted)', fontWeight: selectedEmocion === em.value ? 700 : 400 }}>{em.label}</span>
              {selectedEmocion === em.value && <div className="w-1.5 h-1.5 rounded-full" style={{ background: em.color }} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHAT ── */}
      {tab === 'chat' && (
        <div className="rounded-2xl border overflow-hidden flex flex-col" style={{ background: t.cardBg, borderColor: t.cardBorder, height: '520px' }}>
          <div className="px-5 py-3 border-b flex items-center gap-3"
            style={{ borderColor: 'var(--p-divider)', background: 'rgba(108,99,255,0.06)' }}>
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6C63FF, #7FE7C4)' }}>
              <ImageWithFallback src={monoULinkImg} alt="Mono" className="w-full h-full object-contain" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Mono — Bienestar ECI</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#7FE7C4' }} />
                <span style={{ fontSize: '0.7rem', color: '#7FE7C4' }}>En línea · Responde al instante</span>
              </div>
            </div>
            <div className="ml-auto">
              <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(127,231,196,0.1)', color: '#7FE7C4', border: '1px solid rgba(127,231,196,0.2)' }}>
                IA Empática
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {msgs.map(m => (
              <div key={m.id} className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.from === 'bot' && (
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6C63FF, #7FE7C4)' }}>
                    <ImageWithFallback src={monoULinkImg} alt="Mono" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="max-w-xs px-4 py-2.5 rounded-2xl"
                  style={{
                    background: m.from === 'user' ? 'linear-gradient(135deg, #6C63FF, #8B7FFF)' : 'var(--p-hover)',
                    color: 'var(--p-text)',
                    borderRadius: m.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{m.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #7FE7C4)' }}>
                  <ImageWithFallback src={monoULinkImg} alt="Mono" className="w-full h-full object-contain" />
                </div>
                <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                  style={{ background: 'var(--p-hover)', borderRadius: '18px 18px 18px 4px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full"
                      style={{
                        background: '#6C63FF',
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        opacity: 0.7,
                      }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t" style={{ borderColor: 'var(--p-divider)' }}>
            <div className="flex gap-2">
              <input value={msg} onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMsg()}
                placeholder="Escribe cómo te sientes..."
                className="flex-1 px-4 py-2.5 rounded-xl outline-none text-sm"
                style={{ background: t.inputBg, border: '1px solid rgba(108,99,255,0.2)', color: t.text }} />
              <button onClick={sendMsg} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#6C63FF' }}>
                <Send size={15} color="white" />
              </button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {['Estoy estresado por parciales','Me siento solo/a','Necesito motivación','Quiero hablar con alguien'].map(q => (
                <button key={q} onClick={() => setMsg(q)}
                  className="px-3 py-1 rounded-full text-xs transition-all hover:opacity-80"
                  style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--p-muted)', border: '1px solid rgba(108,99,255,0.15)' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'diario' && (
        <div className="flex gap-6 h-full overflow-hidden">

          <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1 pb-4">

            <div className="rounded-3xl overflow-hidden border relative"
              style={{
                background: t.darkMode
                  ? 'linear-gradient(135deg, #1A1829 0%, #251F3D 100%)'
                  : 'linear-gradient(135deg, #EDE9FF 0%, #F0FFF8 100%)',
                borderColor: t.darkMode ? 'rgba(108,99,255,0.22)' : 'rgba(108,99,255,0.2)',
              }}>
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(108,99,255,0.3), transparent 50%)' }} />
              <div className="hidden sm:flex absolute right-0 bottom-0 h-full items-end pointer-events-none">
                <ImageWithFallback src={monoDiarioImg} alt="Mono Diario"
                  className="object-contain object-bottom"
                  style={{ height: 190, filter: 'drop-shadow(0 4px 18px rgba(108,99,255,0.35))' }} />
              </div>
              <div className="relative p-6 pr-6 sm:pr-36">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.05rem', color: t.darkMode ? '#F0EEFF' : '#1A1829' }}>¿Cómo te sientes hoy?</p>
                    <p style={{ fontSize: '0.78rem', color: t.darkMode ? '#8B85B0' : '#6B6490', marginTop: '2px' }}>
                      {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  {computeStreak(diaryEntries) > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(255,179,71,0.15)', border: '1px solid rgba(255,179,71,0.3)' }}>
                      <span style={{ fontSize: '0.75rem' }}>🔥</span>
                      <span style={{ fontSize: '0.72rem', color: '#FFB347', fontWeight: 600 }}>
                        {computeStreak(diaryEntries)} día{computeStreak(diaryEntries) === 1 ? '' : 's'} seguidos
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  {EMOCIONES.map(em => {
                    const isSelected = diaryEmotion === em.emoji;
                    return (
                      <motion.button key={em.value}
                        onClick={() => { setDiaryEmotion(em.emoji); setDiaryError(null); }}
                        whileHover={{ scale: 1.15, y: -4 }}
                        whileTap={{ scale: 0.92 }}
                        className="flex flex-col items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl transition-all"
                        style={{
                          background: isSelected ? `${em.color}20` : t.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.06)',
                          border: `2px solid ${isSelected ? em.color : t.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.15)'}`,
                          boxShadow: isSelected ? `0 0 20px ${em.color}40` : 'none',
                          transform: isSelected ? 'translateY(-4px)' : undefined,
                        }}>
                        <span style={{ fontSize: '2rem', filter: !diaryEmotion || isSelected ? 'none' : 'grayscale(0.7) opacity(0.5)' }}>
                          {em.emoji}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: isSelected ? 700 : 400, color: isSelected ? em.color : t.darkMode ? '#8B85B0' : '#6B6490' }}>
                          {em.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selectedMoodVal && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: `${AI_TIPS[selectedMoodVal].color}12`, border: `1px solid ${AI_TIPS[selectedMoodVal].color}30` }}>
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🤖</span>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.82rem', color: AI_TIPS[selectedMoodVal].color }}>
                          {AI_TIPS[selectedMoodVal].title}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: '#C0BAE0', lineHeight: 1.6, marginTop: '2px' }}>
                          {AI_TIPS[selectedMoodVal].tip}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: t.text }}>Escribe en tu diario</p>
                <button onClick={() => { setActivePrompt(p => (p + 1) % DIARY_PROMPTS.length); setDiaryNote(''); }}
                  className="px-3 py-1 rounded-xl text-xs transition-all hover:opacity-80"
                  style={{ background: 'rgba(108,99,255,0.1)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.2)' }}>
                  Sugerir pregunta
                </button>
              </div>

              {/* Active prompt */}
              <AnimatePresence mode="wait">
                <motion.p key={activePrompt}
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-3 px-3 py-2 rounded-xl"
                  style={{ fontSize: '0.82rem', color: '#6C63FF', background: 'rgba(108,99,255,0.08)', fontStyle: 'italic' }}>
                  {DIARY_PROMPTS[activePrompt]}
                </motion.p>
              </AnimatePresence>

              <textarea value={diaryNote} onChange={e => { setDiaryNote(e.target.value); setDiaryError(null); }}
                placeholder="Escribe libremente... este espacio es solo tuyo"
                rows={5} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                style={{ background: t.inputBg, border: `1px solid ${diaryNote ? 'rgba(108,99,255,0.4)' : 'rgba(108,99,255,0.15)'}`, color: t.text, lineHeight: 1.7, transition: 'border-color 0.2s' }} />

              <div className="flex items-center justify-between mt-3">
                <p style={{ fontSize: '0.7rem', color: t.textMuted }}>
                  {diaryNote.length} caracteres
                </p>
                <motion.button
                  onClick={() => {
                    if (!diaryEmotion) { setDiaryError('Selecciona cómo te sientes antes de guardar.'); return; }
                    if (!diaryNote.trim()) { setDiaryError('Escribe algo en tu diario antes de guardar.'); return; }
                    setDiaryError(null);
                    const color = EMOCIONES.find(e => e.emoji === diaryEmotion)?.color ?? '#6C63FF';
                    const entry: DiaryEntry = {
                      isoDate: todayIso,
                      date: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
                      emotion: diaryEmotion,
                      note: diaryNote.trim(),
                      color,
                    };
                    setDiaryEntries(prev => {
                      const next = [entry, ...prev.filter(e => e.isoDate !== todayIso)];
                      saveDiaryEntries(next);
                      return next;
                    });
                    setDiaryNote('');
                    setDiaryEmotion(null);
                  }}
                  disabled={savedToday}
                  whileHover={!savedToday ? { scale: 1.03 } : {}}
                  whileTap={!savedToday ? { scale: 0.97 } : {}}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: savedToday ? 'rgba(127,231,196,0.3)' : '#6C63FF', color: 'white', boxShadow: savedToday ? 'none' : '0 4px 14px rgba(108,99,255,0.35)' }}>
                  {savedToday ? '✓ Guardado' : 'Guardar registro'}
                </motion.button>
              </div>

              <AnimatePresence>
                {diaryError && !savedToday && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-2 px-3 py-2.5 rounded-xl flex items-center gap-2"
                    style={{ background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.25)' }}>
                    <span style={{ fontSize: '0.85rem' }}>⚠️</span>
                    <p style={{ fontSize: '0.78rem', color: '#FF4D6A' }}>{diaryError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {savedToday && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-3 px-4 py-3 rounded-xl flex items-center gap-2"
                    style={{ background: 'rgba(127,231,196,0.1)', border: '1px solid rgba(127,231,196,0.25)' }}>
                    <span style={{ fontSize: '1rem' }}>✅</span>
                    <p style={{ fontSize: '0.78rem', color: '#7FE7C4' }}>¡Registro del día guardado! Tu constancia vale mucho.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right column — weekly chart + past entries */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pb-4">

            {/* Weekly mood chart */}
            <div className="rounded-2xl border p-4" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: t.text, marginBottom: '14px' }}>Tu semana emocional</p>
              <div className="flex items-end gap-2" style={{ height: 90 }}>
                {computeWeekMoods(diaryEntries).map((val, i) => {
                  const em = EMOCIONES.find(e => e.value === val);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <motion.div className="w-full rounded-t-xl"
                        initial={{ height: 0 }} animate={{ height: `${(val ?? 0) * 16}px` }}
                        transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                        style={{ background: val ? `linear-gradient(180deg, ${em?.color || '#6C63FF'}, ${em?.color || '#6C63FF'}40)` : 'var(--p-divider)', minHeight: 6 }} />
                      <span style={{ fontSize: '0.88rem' }}>{em?.emoji ?? '—'}</span>
                      <span style={{ fontSize: '0.58rem', color: t.textMuted }}>{['L','M','X','J','V','S','D'][i]}</span>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const vals = computeWeekMoods(diaryEntries).filter((v): v is number => v != null);
                if (vals.length === 0) return null;
                const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                const em = EMOCIONES.find(e => e.value === avg);
                return (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between"
                    style={{ borderColor: 'rgba(108,99,255,0.1)' }}>
                    <span style={{ fontSize: '0.72rem', color: t.textMuted }}>Promedio semanal</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7FE7C4' }}>
                      {em?.emoji} {em?.label}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Past entries */}
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: t.text, marginBottom: '10px' }}>Entradas anteriores</p>
              {diaryEntries.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: t.textMuted }}>Aún no tienes entradas. Escribe tu primer registro arriba.</p>
              ) : (
                <div className="space-y-2.5">
                  {diaryEntries.map((e, i) => (
                    <motion.div key={e.isoDate}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="rounded-2xl border overflow-hidden cursor-pointer hover:shadow-md transition-all"
                      style={{ background: t.cardBg, borderColor: `${e.color}25` }}>
                      <div className="h-1" style={{ background: `linear-gradient(90deg, ${e.color}, ${e.color}60)` }} />
                      <div className="flex items-start gap-3 p-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${e.color}15`, fontSize: '1.4rem' }}>
                          {e.emotion}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: '0.7rem', color: t.textMuted, marginBottom: '2px' }}>{e.date}</p>
                          <p className="line-clamp-2" style={{ fontSize: '0.78rem', color: t.textSub, lineHeight: 1.5 }}>{e.note}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SONIDOS ── */}
      {tab === 'sonidos' && (
        <div className="space-y-5">
          {/* Hero banner with Mono */}
          <div className="rounded-3xl overflow-hidden relative border"
            style={{
              background: t.darkMode
                ? 'linear-gradient(135deg, #1A1829, #251F3D)'
                : 'linear-gradient(135deg, #EDE9FF, #F0FFF8)',
              borderColor: t.darkMode ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.2)',
              minHeight: 160,
            }}>
            <div className="absolute right-0 bottom-0 h-full flex items-end">
              <ImageWithFallback src={playingSound ? monoMusicaImg : monoTranqImg} alt="Mono"
                className="object-contain object-bottom"
                style={{ height: 155, filter: 'drop-shadow(0 4px 16px rgba(108,99,255,0.3))' }} />
            </div>
            <div className="relative z-10 p-6 max-w-xs">
              {playingSound ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p style={{ fontSize: '0.75rem', color: '#7FE7C4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    ▶ Reproduciendo
                  </p>
                  <p style={{ fontWeight: 800, fontSize: '1.2rem', color: '#F0EEFF', marginBottom: '4px' }}>
                    {SOUNDS.find(s => s.id === playingSound)?.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 mb-4">
                    {[1,2,3,4,5,6,7,8].map(b => (
                      <motion.div key={b} animate={{ height: [5, 18, 7, 14, 5] }}
                        transition={{ duration: 1.0, repeat: Infinity, delay: b * 0.1, ease: 'easeInOut' }}
                        className="w-1 rounded-full" style={{ background: '#7FE7C4' }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => {
                        const newMuted = !muted;
                        setMuted(newMuted);
                        if (audioRef.current) audioRef.current.volume = newMuted ? 0 : volume / 100;
                      }}>
                      {muted ? <VolumeX size={16} style={{ color: '#8B85B0' }} /> : <Volume2 size={16} style={{ color: '#8B85B0' }} />}
                    </button>
                    <input type="range" min={0} max={100} value={muted ? 0 : volume}
                      onChange={e => {
                        const v = +e.target.value;
                        setVolume(v);
                        setMuted(false);
                        if (audioRef.current) audioRef.current.volume = v / 100;
                      }}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#7FE7C4', maxWidth: 120 }} />
                    <span style={{ fontSize: '0.7rem', color: '#8B85B0' }}>{muted ? 0 : volume}%</span>
                    <button onClick={() => {
                        audioRef.current?.pause();
                        audioRef.current = null;
                        setPlayingSound(null);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: 'rgba(255,77,106,0.15)', color: '#FF4D6A', border: '1px solid rgba(255,77,106,0.25)' }}>
                      Detener
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div>
                  <p style={{ fontWeight: 800, fontSize: '1.2rem', color: t.darkMode ? '#F0EEFF' : '#1A1829', marginBottom: '6px' }}>
                    Sonidos de bienestar
                  </p>
                  <p style={{ fontSize: '0.85rem', color: t.darkMode ? '#8B85B0' : '#6B6490', lineHeight: 1.6 }}>
                    Elige un sonido para relajarte, concentrarte o descansar mejor.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sound grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {SOUNDS.map(sound => {
              const isPlaying = playingSound === sound.id;
              return (
                <motion.button key={sound.id}
                  whileHover={{ scale: 1.05, y: -5, boxShadow: '0 12px 32px rgba(108,99,255,0.25)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleSound(sound.id, sound.audio)}
                  className="rounded-2xl border flex flex-col items-center text-center p-4 relative overflow-hidden transition-all"
                  style={{
                    background: isPlaying ? 'linear-gradient(135deg, rgba(108,99,255,0.25), rgba(127,231,196,0.12))' : t.cardBg,
                    borderColor: isPlaying ? '#6C63FF' : t.cardBorder,
                    boxShadow: isPlaying ? '0 0 20px rgba(108,99,255,0.2)' : 'none',
                  }}>
                  {/* Active glow */}
                  {isPlaying && <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 50% 30%, #6C63FF, transparent 70%)' }} />}
                  <span style={{ fontSize: '2.2rem', marginBottom: '8px', position: 'relative' }}>{sound.emoji}</span>
                  <p style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '3px', color: isPlaying ? '#F0EEFF' : t.text }}>{sound.name}</p>
                  <p style={{ fontSize: '0.62rem', color: isPlaying ? '#7FE7C4' : t.textMuted }}>{sound.category} · {sound.freq}</p>
                  {isPlaying && (
                    <div className="flex gap-0.5 mt-2">
                      {[1,2,3].map(b => (
                        <motion.div key={b} animate={{ height: [4, 12, 5] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: b * 0.2 }}
                          className="w-0.5 rounded-full" style={{ background: '#6C63FF' }} />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── RESPIRA ── */}
      {tab === 'respira' && (
        <div className="flex gap-8 h-full">
          {/* Left — interactive circle + controls */}
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            {/* Phase label + timer ring */}
            <div className="relative mb-6" style={{ width: 280, height: 280 }}>
              {/* Outer ring pulses */}
              <motion.div
                animate={breathActive ? { scale: expandedScale, opacity: [0.4, 0.15, 0.4] } : { scale: 1, opacity: 0.2 }}
                transition={{ duration: (phaseInfo?.duration || 4000) / 1000, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.25) 0%, transparent 70%)', border: '1.5px solid rgba(108,99,255,0.2)' }}
              />
              {/* Middle ring */}
              <motion.div
                animate={breathActive ? { scale: expandedScale * 0.82 } : { scale: 1 }}
                transition={{ duration: (phaseInfo?.duration || 4000) / 1000, ease: 'easeInOut', delay: 0.1 }}
                className="absolute inset-8 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(127,231,196,0.18) 0%, transparent 70%)', border: '1px solid rgba(127,231,196,0.2)' }}
              />
              {/* Center — Mono RESPIRA image */}
              <div className="absolute inset-14 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #7FE7C4)', boxShadow: '0 8px 32px rgba(108,99,255,0.35)' }}>
                <motion.div
                  animate={breathActive ? { scale: expandedScale > 1.1 ? 1.1 : 0.9 } : { scale: 1 }}
                  transition={{ duration: (phaseInfo?.duration || 4000) / 1000, ease: 'easeInOut' }}>
                  <ImageWithFallback src={monoRespiraImg} alt="Mono respirando"
                    className="w-full h-full object-contain"
                    style={{ width: 90, height: 90 }} />
                </motion.div>
              </div>
              {/* Phase label floating */}
              {breathActive && (
                <motion.div
                  key={phaseInfo?.label}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-10 left-0 right-0 text-center">
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6C63FF', letterSpacing: '0.04em' }}>
                    {phaseInfo?.label}...
                  </span>
                </motion.div>
              )}
            </div>

            {/* Cycles counter */}
            {breathActive && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-8 mt-4 mb-6 px-8 py-4 rounded-2xl border"
                style={{ background: 'rgba(108,99,255,0.08)', borderColor: 'rgba(108,99,255,0.2)' }}>
                <div className="text-center">
                  <p style={{ fontSize: '0.7rem', color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ciclos</p>
                  <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#6C63FF', lineHeight: 1 }}>{breathCycles}</p>
                </div>
                <div className="w-px h-10" style={{ background: 'rgba(108,99,255,0.2)' }} />
                <div className="text-center">
                  <p style={{ fontSize: '0.7rem', color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fase</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#7FE7C4' }}>{phaseInfo?.label}</p>
                </div>
                <div className="w-px h-10" style={{ background: 'rgba(108,99,255,0.2)' }} />
                <div className="text-center">
                  <p style={{ fontSize: '0.7rem', color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Duración</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#FFB347' }}>{(phaseInfo?.duration || 0) / 1000}s</p>
                </div>
              </motion.div>
            )}

            {!breathActive ? (
              <motion.button onClick={startBreath}
                whileHover={{ scale: 1.05, boxShadow: '0 12px 36px rgba(108,99,255,0.45)' }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 px-12 py-4 rounded-2xl font-bold text-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #7FE7C4)', color: 'white', boxShadow: '0 6px 24px rgba(108,99,255,0.35)' }}>
                Comenzar {breathMode.name}
              </motion.button>
            ) : (
              <button onClick={stopBreath} className="mt-8 px-8 py-3 rounded-2xl font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(255,77,106,0.1)', color: '#FF4D6A', border: '1.5px solid rgba(255,77,106,0.25)' }}>
                Detener sesión
              </button>
            )}
          </div>

          {/* Right — mode selector cards */}
          <div className="w-72 flex-shrink-0 space-y-3 py-6">
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: t.text, marginBottom: '4px' }}>Elige una técnica</p>
            {BREATHING_MODES.map(mode => (
              <motion.button key={mode.id}
                onClick={() => { setBreathMode(mode); stopBreath(); setBreathPhase(0); }}
                whileHover={{ x: 4 }}
                className="w-full px-4 py-4 rounded-2xl text-left transition-all border"
                style={{
                  background: breathMode.id === mode.id ? 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(127,231,196,0.08))' : t.cardBg,
                  borderColor: breathMode.id === mode.id ? '#6C63FF' : t.cardBorder,
                  boxShadow: breathMode.id === mode.id ? '0 4px 16px rgba(108,99,255,0.2)' : 'none',
                }}>
                <div className="flex items-center gap-2 mb-2">
                  {breathMode.id === mode.id && (
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7FE7C4', flexShrink: 0 }} />
                  )}
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: breathMode.id === mode.id ? '#F0EEFF' : t.text }}>
                    {mode.name}
                  </p>
                </div>
                <p style={{ fontSize: '0.75rem', color: t.textMuted, lineHeight: 1.5 }}>{mode.desc}</p>
                {/* Phase preview */}
                <div className="flex gap-2 mt-3">
                  {mode.phases.map((p, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-6 h-1.5 rounded-full" style={{ background: breathMode.id === mode.id ? '#6C63FF' : 'rgba(108,99,255,0.2)' }} />
                      <span style={{ fontSize: '0.55rem', color: t.textMuted }}>{p.label.slice(0,3)}</span>
                    </div>
                  ))}
                </div>
              </motion.button>
            ))}

            {/* Tip */}
            <div className="rounded-2xl p-4 border mt-4"
              style={{ background: 'rgba(127,231,196,0.06)', borderColor: 'rgba(127,231,196,0.2)' }}>
              <p style={{ fontSize: '0.75rem', color: '#7FE7C4', fontWeight: 600, marginBottom: '4px' }}>Consejo</p>
              <p style={{ fontSize: '0.75rem', color: t.textMuted, lineHeight: 1.6 }}>
                Practica al menos 3 ciclos para sentir los beneficios. Lo ideal es hacer esto antes de dormir o en momentos de estrés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DESCONEXIÓN ── */}
    </div>
  );
}
