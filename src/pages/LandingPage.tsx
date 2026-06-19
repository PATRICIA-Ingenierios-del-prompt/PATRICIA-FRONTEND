import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sun, Moon, Check, Users, Heart, Calendar, Smile, Zap, Shield } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { AnimatedBackground } from '../components/AnimatedBackground';
import logoBlancoImg from '../assets/logoBLANCO.png';
import logoNegroImg from '../assets/logoNEGRO.png';
import monoPatriciaImg from '../assets/monoPATRICIA.png';
import lp1 from '../assets/landingpage1.jpg';
import lp2 from '../assets/landingpage2.png';
import lp3 from '../assets/landingpage3.jpg';
import lp4 from '../assets/landingpage4.jpg';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

const SLIDES = [
  { img: lp1, tag: 'Comunidad', headline: 'Conecta con estudiantes que comparten tu vibra', sub: 'Parches de estudio, deporte, gaming y mucho más' },
  { img: lp2, tag: 'Campus ECI', headline: 'Tu universidad, ahora en digital', sub: 'Eventos, mapas, cafeterías y todo el campus en un solo lugar' },
  { img: lp3, tag: 'Innovación', headline: 'Hackathones, proyectos y tecnología', sub: 'Encuentra tu equipo ideal para la próxima gran idea' },
  { img: lp4, tag: 'Pertenencia', headline: 'Somos la Escuela Colombiana de Ingeniería', sub: 'Orgullosos de nuestra comunidad desde 1972' },
];

const FEATURES = [
  { emoji: '🎪', icon: Users, color: '#6C63FF', title: 'Parches Virtuales', desc: 'Grupos por intereses con chat, voz, lienzo colaborativo y juegos como Parqués integrados.' },
  { emoji: '💜', icon: Heart, color: '#FF6B9D', title: 'Matching Inteligente', desc: 'Encuentra estudiantes con tu misma vibra académica. Algoritmo basado en intereses y carrera.' },
  { emoji: '🎉', icon: Calendar, color: '#7FE7C4', title: 'Eventos del Campus', desc: 'Hackathones, charlas empresariales, torneos y actividades con geolocalización en tiempo real.' },
  { emoji: '🧘', icon: Smile, color: '#FFB347', title: 'Bienestar 24/7', desc: 'Chatbot de apoyo, diario emocional con IA, respiración guiada y sonidos de relajación.' },
  { emoji: '🎴', icon: Zap, color: '#A78BFA', title: 'Álbum de Monas', desc: '12 personajes coleccionables con 4 rarezas. Gana XP participando y sube en el ranking.' },
  { emoji: '⚡', icon: Shield, color: '#00D9FF', title: 'Solo para la ECI', desc: 'Verificación con correo institucional. Tu comunidad privada y segura.' },
];

const STEPS = [
  { n: '01', color: '#6C63FF', icon: '✉️', title: 'Regístrate con tu correo ECI', desc: 'Solo @mail.escuelaing.edu.co. Verificación automática e instantánea.' },
  { n: '02', color: '#7FE7C4', icon: '🏷️', title: 'Elige tus intereses', desc: 'Selecciona de 11 categorías y más de 70 intereses para personalizar todo.' },
  { n: '03', color: '#FFB347', icon: '🎪', title: 'Únete a parches y eventos', desc: 'Conecta con compañeros afines, asiste a eventos y sube tu XP.' },
];

export function LandingPage({ onLogin, onRegister, darkMode, setDarkMode }: LandingPageProps) {
  const [slide, setSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [hoveredF, setHoveredF] = useState<number | null>(null);

  const dark = darkMode;
  const card = dark ? 'rgba(26,24,41,0.90)' : 'rgba(255,255,255,0.95)';
  const bord = dark ? 'rgba(108,99,255,0.22)' : 'rgba(108,99,255,0.16)';
  const textH = dark ? '#F0EEFF' : '#1A1829';
  const textS = dark ? '#8B85B0' : '#6B6490';
  const textB = dark ? '#C0BAE0' : '#4A4468';
  const pageBg = dark ? 'transparent' : 'transparent';

  const next = useCallback(() => setSlide(s => (s + 1) % SLIDES.length), []);
  const prev = () => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length);
  useEffect(() => {
    if (!autoplay) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [autoplay, next]);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <AnimatedBackground light={!dark} />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3.5"
        style={{ background: dark ? 'rgba(13,11,30,0.88)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${bord}` }}>
        <ImageWithFallback src={dark ? logoBlancoImg : logoNegroImg} alt="PATRICI.A"
          className="object-contain" style={{ height: 28 }} />
        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: 'Funcionalidades', id: 'funcionalidades' },
            { label: '¿Cómo funciona?', id: 'como-funciona' },
            { label: 'Comunidad', id: 'comunidad' },
          ].map(({ label, id }) => (
            <button key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm transition-colors hover:opacity-80" style={{ color: textS }}>{label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!dark)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:opacity-80"
            style={{ background: 'transparent', borderColor: bord, color: dark ? '#FFB347' : '#6C63FF' }}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={onLogin}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
            style={{ borderColor: '#6C63FF', color: '#6C63FF', background: 'transparent' }}>
            Iniciar sesión
          </button>
          <button onClick={onRegister}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#8B7FFF)', color: 'white', boxShadow: '0 4px 14px rgba(108,99,255,0.35)' }}>
            Registrarse gratis <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      <div className="relative z-10 pt-16">

        {/* ══════════════════════════════════════
            HERO — Carousel + Split text
        ══════════════════════════════════════ */}
        <section className="relative" style={{ minHeight: '100vh' }}>
          {/* Full-screen carousel */}
          <div className="absolute inset-0 overflow-hidden"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}>
            <AnimatePresence mode="sync">
              <motion.div key={slide}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0">
                <ImageWithFallback src={SLIDES[slide].img} alt={SLIDES[slide].headline}
                  className="w-full h-full object-cover" />
                {/* Multi-layer overlay for readability */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(13,11,30,0.92) 0%, rgba(13,11,30,0.65) 45%, rgba(13,11,30,0.2) 100%)' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,11,30,0.9) 0%, rgba(13,11,30,0.2) 50%, transparent 100%)' }} />
              </motion.div>
            </AnimatePresence>

            {/* Carousel prev/next */}
            <button onClick={prev}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <ChevronLeft size={20} color="white" />
            </button>
            <button onClick={next}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <ChevronRight size={20} color="white" />
            </button>
          </div>

          {/* Hero content */}
          <div className="relative flex items-center min-h-screen px-4 sm:px-8 lg:px-20">
            <div className="max-w-2xl">
              {/* Slide tag */}
              <AnimatePresence mode="wait">
                <motion.div key={`tag-${slide}`}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                  style={{ background: 'rgba(108,99,255,0.25)', border: '1px solid rgba(108,99,255,0.4)', backdropFilter: 'blur(8px)' }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7FE7C4' }} />
                  <span style={{ fontSize: '0.75rem', color: '#7FE7C4', fontWeight: 700, letterSpacing: '0.06em' }}>
                    {SLIDES[slide].tag}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Main headline */}
              <h1 style={{ fontWeight: 900, fontSize: 'clamp(2.4rem,5.5vw,4rem)', lineHeight: 1.05, color: 'white', marginBottom: '20px' }}>
                La comunidad social<br />
                <span style={{ background: 'linear-gradient(135deg,#6C63FF,#7FE7C4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  de la ECI
                </span>
              </h1>

              {/* Slide sub */}
              <AnimatePresence mode="wait">
                <motion.p key={`sub-${slide}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '32px', maxWidth: 480 }}>
                  {SLIDES[slide].headline} — {SLIDES[slide].sub}
                </motion.p>
              </AnimatePresence>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <motion.button onClick={onRegister}
                  whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(108,99,255,0.6)' }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base"
                  style={{ background: 'linear-gradient(135deg,#6C63FF,#8B7FFF)', color: 'white', boxShadow: '0 4px 24px rgba(108,99,255,0.45)' }}>
                  Crear cuenta gratis <ArrowRight size={18} />
                </motion.button>
                <button onClick={onLogin}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:bg-white/10"
                  style={{ border: '2px solid rgba(255,255,255,0.3)', color: 'white', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
                  Ya tengo cuenta
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                🔒 Solo correos <span style={{ color: '#7FE7C4' }}>@mail.escuelaing.edu.co</span> · Gratis para siempre
              </p>
            </div>

          </div>

          {/* Slide dots */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className="transition-all rounded-full"
                style={{ width: i === slide ? 28 : 8, height: 8, background: i === slide ? '#6C63FF' : 'rgba(255,255,255,0.35)' }} />
            ))}
          </div>

        </section>

        {/* Feature highlights strip — animated, no fake data */}
        <div className="relative z-10 py-5 px-4 sm:px-8 border-y overflow-hidden"
          style={{ borderColor: bord, background: dark ? 'rgba(13,11,30,0.7)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)' }}>
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-3 sm:gap-4">
            {[
              { icon: '🔒', label: 'Solo correos @escuelaing.edu.co', color: '#6C63FF' },
              { icon: '⚡', label: 'Comunicación en tiempo real', color: '#7FE7C4' },
              { icon: '🤖', label: 'IA integrada en toda la plataforma', color: '#FFB347' },
              { icon: '🎮', label: 'Gamificación y coleccionables', color: '#FF6B9D' },
              { icon: '💜', label: 'Bienestar estudiantil 24/7', color: '#A78BFA' },
            ].map((item, i) => (
              <motion.div key={item.label}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: `${item.color}12`, border: `1px solid ${item.color}30` }}>
                <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: dark ? 'rgba(255,255,255,0.82)' : '#1A1829', whiteSpace: 'nowrap' }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            FEATURES — "Todo en un lugar"
        ══════════════════════════════════════ */}
        <section id="funcionalidades" className="py-16 sm:py-24 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-sm font-semibold"
                  style={{ background: 'rgba(108,99,255,0.1)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.25)' }}>
                  ✨ Funcionalidades
                </span>
                <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: textH, lineHeight: 1.15, marginBottom: '14px' }}>
                  Todo lo que necesitas,<br />
                  <span style={{ background: 'linear-gradient(135deg,#6C63FF,#7FE7C4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    en un solo lugar
                  </span>
                </h2>
                <p style={{ fontSize: '1.05rem', color: textB, maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
                  PATRICI.A no es otra red social — es la plataforma que la comunidad ECI siempre necesitó.
                </p>
              </motion.div>
            </div>

            {/* 3-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {FEATURES.map((f, i) => (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  onHoverStart={() => setHoveredF(i)} onHoverEnd={() => setHoveredF(null)}
                  whileHover={{ y: -10, boxShadow: `0 24px 56px ${f.color}25` }}
                  className="rounded-3xl border p-6 cursor-default relative overflow-hidden transition-all"
                  style={{ background: hoveredF === i ? `linear-gradient(135deg,${f.color}12,${f.color}04)` : card, borderColor: hoveredF === i ? `${f.color}55` : bord, backdropFilter: 'blur(12px)' }}>
                  {hoveredF === i && (
                    <div className="absolute top-0 right-0 w-28 h-28 opacity-10 pointer-events-none"
                      style={{ background: f.color, borderRadius: '0 24px 0 100%', filter: 'blur(24px)' }} />
                  )}
                  <div className="w-13 h-13 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `${f.color}16`, border: `1.5px solid ${f.color}35`, width: 52, height: 52 }}>
                    <span style={{ fontSize: '1.5rem' }}>{f.emoji}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: textH, marginBottom: '8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.84rem', color: textS, lineHeight: 1.7 }}>{f.desc}</p>
                  <div className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all"
                    style={{ width: hoveredF === i ? '100%' : '0%', background: `linear-gradient(90deg,${f.color},transparent)`, transitionDuration: '350ms' }} />
                </motion.div>
              ))}
            </div>

            {/* Full-width trust card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="rounded-3xl border overflow-hidden"
              style={{ background: card, borderColor: bord, backdropFilter: 'blur(12px)' }}>
              <div className="flex flex-col lg:flex-row">
                {/* Left text */}
                <div className="flex-1 p-10">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                    style={{ background: 'rgba(127,231,196,0.1)', color: '#7FE7C4', border: '1px solid rgba(127,231,196,0.25)' }}>
                    <Shield size={12} /> Exclusivo para la ECI
                  </span>
                  <h3 style={{ fontWeight: 800, fontSize: '1.4rem', color: textH, lineHeight: 1.3, marginBottom: '12px' }}>
                    Construido 100%<br />para la comunidad ECI
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: textB, lineHeight: 1.75, marginBottom: '20px', maxWidth: 420 }}>
                    Verificación institucional, datos protegidos con JWT, moderación activa, matching inteligente basado en tus intereses académicos y soporte de bienestar disponible 24/7.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['🔒 Verificación ECI', '⚡ Tiempo real', '🤖 IA integrada', '💜 Bienestar 24/7', '🎮 Gamificado'].map(tag => (
                      <span key={tag} className="px-3 py-1.5 rounded-full text-sm"
                        style={{ background: 'rgba(108,99,255,0.1)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.2)', fontWeight: 500 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Right steps */}
                <div className="flex-1 p-10 border-t lg:border-t-0 lg:border-l"
                  style={{ borderColor: bord, background: dark ? 'rgba(108,99,255,0.04)' : 'rgba(108,99,255,0.02)' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#6C63FF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
                    Empieza en 3 pasos
                  </p>
                  <div className="space-y-6">
                    {STEPS.map((step, i) => (
                      <motion.div key={step.n}
                        initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.1 * i }}
                        className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${step.color}15`, border: `1.5px solid ${step.color}30` }}>
                          <span style={{ fontSize: '1.2rem' }}>{step.icon}</span>
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: textH }}>{step.title}</p>
                          <p style={{ fontSize: '0.8rem', color: textS, lineHeight: 1.6, marginTop: '3px' }}>{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════ */}
        <section id="como-funciona" className="py-12 sm:py-16 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-semibold"
                style={{ background: 'rgba(127,231,196,0.1)', color: '#7FE7C4', border: '1px solid rgba(127,231,196,0.25)' }}>
                🚀 ¿Cómo funciona?
              </span>
              <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', color: textH }}>
                Únete en 3 simples pasos
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-start gap-8 sm:gap-0 relative">
              {/* connecting line */}
              <div className="hidden sm:block absolute top-8 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-0.5" style={{ background: 'linear-gradient(90deg, #6C63FF, #7FE7C4, #FFB347)' }} />
              {STEPS.map((step, i) => (
                <motion.div key={step.n}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="flex-1 flex flex-col items-center text-center px-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 relative z-10"
                    style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}88)`, boxShadow: `0 8px 24px ${step.color}40` }}>
                    <span style={{ fontSize: '1.8rem' }}>{step.icon}</span>
                  </div>
                  <span style={{ fontWeight: 900, fontSize: '0.75rem', color: step.color, letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }}>
                    PASO {step.n}
                  </span>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: textH, marginBottom: '8px' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: textS, lineHeight: 1.7 }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            COMUNIDAD
        ══════════════════════════════════════ */}
        <section id="comunidad" className="py-12 sm:py-16 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-sm font-semibold"
                  style={{ background: 'rgba(255,107,157,0.1)', color: '#FF6B9D', border: '1px solid rgba(255,107,157,0.25)' }}>
                  👥 Comunidad ECI
                </span>
                <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: textH, lineHeight: 1.15, marginBottom: '14px' }}>
                  Conecta con tu comunidad<br />
                  <span style={{ background: 'linear-gradient(135deg,#FF6B9D,#6C63FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    en la Escuela Colombiana de Ingeniería
                  </span>
                </h2>
                <p style={{ fontSize: '1.05rem', color: textB, maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
                  Parches de estudio, gaming, arte, ciencia y mucho más. La comunidad que siempre quisiste tener en tu universidad.
                </p>
              </motion.div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {[
                { emoji: '🎮', label: 'Gaming', color: '#6C63FF' },
                { emoji: '📚', label: 'Estudio', color: '#7FE7C4' },
                { emoji: '🎨', label: 'Arte y diseño', color: '#FF6B9D' },
                { emoji: '🔬', label: 'Ciencia & Tech', color: '#FFB347' },
              ].map((item, i) => (
                <motion.div key={item.label}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border p-5 text-center"
                  style={{ background: card, borderColor: `${item.color}30`, backdropFilter: 'blur(12px)' }}>
                  <div className="text-3xl mb-3">{item.emoji}</div>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: textH }}>{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            CTA FINAL
        ══════════════════════════════════════ */}
        <section className="py-16 sm:py-24 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-[32px] overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, #4A42C0 0%, #6C63FF 40%, #3B8A72 100%)' }}>
              {/* BG decoration */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-15"
                  style={{ background: '#7FE7C4', filter: 'blur(60px)' }} />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10"
                  style={{ background: '#FF6B9D', filter: 'blur(48px)' }} />
              </div>

              <div className="relative flex flex-col lg:flex-row items-center gap-10 p-12 lg:p-16">
                {/* Text */}
                <div className="flex-1 text-center lg:text-left">
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    ¡Únete gratis hoy!
                  </p>
                  <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.7rem,3.5vw,2.4rem)', color: 'white', lineHeight: 1.2, marginBottom: '14px' }}>
                    ¿Listo para ser parte de<br />la comunidad ECI?
                  </h2>
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '28px', maxWidth: 420 }}>
                    En menos de 2 minutos estás registrado y conectando con la comunidad de la Escuela Colombiana de Ingeniería.
                  </p>
                  {/* Checklist */}
                  <div className="flex flex-col gap-2 mb-8">
                    {['Totalmente gratuito para estudiantes ECI', 'Verificación segura con correo institucional', 'Soporte de bienestar disponible 24/7'].map(item => (
                      <div key={item} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(127,231,196,0.25)' }}>
                          <Check size={11} style={{ color: '#7FE7C4' }} strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <motion.button onClick={onRegister}
                    whileHover={{ scale: 1.05, boxShadow: '0 12px 36px rgba(127,231,196,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 px-9 py-4 rounded-2xl font-bold text-base"
                    style={{ background: '#7FE7C4', color: '#0F0E1A', boxShadow: '0 6px 24px rgba(127,231,196,0.4)' }}>
                    Crear mi cuenta gratis <ArrowRight size={18} />
                  </motion.button>
                </div>

                {/* Mono mascot */}
                <div className="flex-shrink-0 relative">
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                    <ImageWithFallback src={monoPatriciaImg} alt="Mascota PATRICI.A"
                      className="object-contain"
                      style={{ width: 180, height: 180, filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.3))' }} />
                  </motion.div>
                  {/* Floating badge */}
                  <motion.div
                    animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-4 -right-4 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: '#6C63FF', color: 'white', boxShadow: '0 4px 14px rgba(108,99,255,0.4)' }}>
                    🎪 ¡Únete!
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-4 sm:px-8 border-t text-center" style={{ borderColor: bord }}>
          <ImageWithFallback src={dark ? logoBlancoImg : logoNegroImg} alt="PATRICI.A"
            className="object-contain mx-auto mb-4"
            style={{ height: 24, filter: dark ? 'none' : undefined }} />
          <p style={{ fontSize: '0.8rem', color: textS }}>
            PATRICI.A © 2026 · Escuela Colombiana de Ingeniería · 🔒 Solo para la comunidad ECI
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            {['Términos de uso', 'Privacidad', 'Centro de ayuda', 'Contacto'].map(l => (
              <button key={l} className="text-xs hover:underline transition-all" style={{ color: textS }}>{l}</button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
