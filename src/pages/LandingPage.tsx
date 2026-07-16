import { useState, useEffect } from 'react';
import { ArrowRight, Sun, Moon, Check, Users, Heart, Calendar, Smile, Zap, Shield } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { AnimatedBackground } from '../components/AnimatedBackground';
import logoNuevoOscuroImg from '../assets/logoNuevoOscuro.png';
import logoNuevoClaroImg from '../assets/logoNuevoClaro.png';
import monoPatriciaImg from '../assets/monoFondoU.png';
import lp1 from '../assets/landingpage1.jpg';
import lp2 from '../assets/landingpage2.png';
import lp3 from '../assets/landingpage3.jpg';
import lp4 from '../assets/landingpage4.jpg';
import concurso1Img from '../assets/concurso1.png';
import concurso2Img from '../assets/concurso2.jpg';
import monoSocialFImg    from '../assets/monoDJN.png';
import monoCulturaFImg   from '../assets/monoCulturaN.png';
import monoMusicaFImg    from '../assets/monoMusicaN.png';
import monoTranquiloFImg from '../assets/monoTranquiloN.png';
import monoCoderFImg     from '../assets/monoCoderN.png';
import monoEstudioFImg   from '../assets/monoEstudiosoN.png';
import monoCoderNewImg   from '../assets/monoCoderNew.png';
import { motion, AnimatePresence } from 'motion/react';
import { LegalModals, type LegalModalType } from '../components/LegalContent';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

const FEATURES = [
  { img: monoSocialFImg,    icon: Users,    color: '#6C63FF', title: 'Parches Virtuales',    desc: 'Grupos por intereses con chat, voz, lienzo colaborativo y juegos como Parqués integrados.' },
  { img: monoCulturaFImg,   icon: Heart,    color: '#FF6B9D', title: 'Matching Inteligente', desc: 'Encuentra estudiantes con tu misma vibra académica. Algoritmo basado en intereses y carrera.' },
  { img: monoMusicaFImg,    icon: Calendar, color: '#7FE7C4', title: 'Eventos del Campus',   desc: 'Hackathones, charlas empresariales, torneos y actividades con geolocalización en tiempo real.' },
  { img: monoTranquiloFImg, icon: Smile,    color: '#FFB347', title: 'Bienestar 24/7',       desc: 'Chatbot de apoyo, diario emocional con IA, respiración guiada y sonidos de relajación.' },
  { img: monoCoderFImg,     icon: Zap,      color: '#A78BFA', title: 'Álbum de Monas',       desc: '12 personajes coleccionables con 4 rarezas. Gana XP participando y sube en el ranking.' },
  { img: monoEstudioFImg,   icon: Shield,   color: '#00D9FF', title: 'Solo para la ECI',     desc: 'Verificación con correo institucional. Tu comunidad privada y segura.' },
];

const STEPS = [
  { color: '#6C63FF', icon: '✉️', title: 'Regístrate con tu correo ECI', desc: 'Solo @mail.escuelaing.edu.co. Verificación automática e instantánea.' },
  { color: '#7FE7C4', icon: '🏷️', title: 'Elige tus intereses',          desc: 'Selecciona de 11 categorías y más de 70 intereses para personalizar todo.' },
  { color: '#FFB347', icon: '🎪', title: 'Únete a parches y eventos',    desc: 'Conecta con compañeros afines, asiste a eventos y sube tu XP en la comunidad.' },
];

const GALLERY = [
  { img: lp1,         label: 'Comunidad',  desc: 'Parches y grupos de interés',   color: '#6C63FF', info: 'Encuentra tu gente: parches de estudio, deporte, arte y más, siempre activos en el campus.' },
  { img: lp3,         label: 'Innovación', desc: 'Hackathones y proyectos',        color: '#FFB347', info: 'Hackathones, retos de innovación y proyectos colaborativos entre distintas carreras de la ECI.' },
  { img: concurso1Img,label: 'Concursos',  desc: 'Talento y competencias ECI',    color: '#FF6B9D', info: 'Concursos y competencias donde la comunidad ECI muestra su talento académico y creativo.' },
  { img: lp2,         label: 'Campus',     desc: 'Tu ECI en digital',              color: '#7FE7C4', info: 'Toda la vida del campus, ahora también en digital: eventos, espacios y actividades al alcance de un clic.' },
  { img: lp4,         label: 'Identidad',  desc: 'Orgullosamente ECI',             color: '#A78BFA', info: 'Una comunidad orgullosa de su identidad, construida por y para estudiantes de la Escuela.' },
  { img: concurso2Img,label: 'Vida ECI',   desc: 'Eventos y vida universitaria',   color: '#5BC8FF', info: 'Eventos, celebraciones y momentos que hacen parte del día a día de la vida universitaria en la ECI.' },
];

export function LandingPage({ onLogin, onRegister, darkMode, setDarkMode }: LandingPageProps) {
  const [featureIdx, setFeatureIdx] = useState(0);
  const [galleryOrder, setGalleryOrder] = useState([0, 1, 2, 3, 4, 5]);
  const [mobileExpandedIdx, setMobileExpandedIdx] = useState<number | null>(null);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  const swapWithHero = (pos: number) => {
    setGalleryOrder(prev => {
      const next = [...prev];
      [next[0], next[pos]] = [next[pos], next[0]];
      return next;
    });
  };

  useEffect(() => {
    const t = setInterval(() => setFeatureIdx(i => (i + 1) % FEATURES.length), 7000);
    return () => clearInterval(t);
  }, []);

  const dark = darkMode;
  const card  = dark ? 'rgba(26,24,41,0.90)' : 'rgba(255,255,255,0.95)';
  const bord  = dark ? 'rgba(108,99,255,0.22)' : 'rgba(108,99,255,0.16)';
  const textH = dark ? '#F0EEFF' : '#1A1829';
  const textS = dark ? '#8B85B0' : '#6B6490';
  const textB = dark ? '#C0BAE0' : '#4A4468';

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ fontFamily: "'Outfit','Inter',sans-serif" }}>
      <AnimatedBackground light={!dark} />

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3.5"
        style={{ background: dark ? 'rgba(13,11,30,0.92)' : 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${bord}` }}>
        <div className="flex items-center gap-2.5">
          <ImageWithFallback src={dark ? logoNuevoOscuroImg : logoNuevoClaroImg} alt="U•link" className="object-contain" style={{ height: 48 }} />
          <span style={{ fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#6C63FF,#7FE7C4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>U•link</span>
        </div>
        <div className="hidden md:flex items-center gap-7">
          {[{ label: 'Funcionalidades', id: 'funcionalidades' }, { label: '¿Cómo funciona?', id: 'como-funciona' }].map(({ label, id }) => (
            <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: textS, background: 'none', border: 'none' }}>
              {label}
            </button>
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
          <motion.button onClick={onRegister} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#8B7FFF)', color: 'white', boxShadow: '0 4px 14px rgba(108,99,255,0.35)' }}>
            Registrarse <ArrowRight size={14} />
          </motion.button>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO — Split layout + Floating cards
      ══════════════════════════════════════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Photo background */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${concurso1Img})`,
          backgroundSize:'cover', backgroundPosition:'center 25%',
        }} />
        <div style={{
          position:'absolute', inset:0,
          background: dark
            ? 'linear-gradient(135deg, rgba(13,11,30,0.90) 0%, rgba(18,16,42,0.82) 50%, rgba(15,22,40,0.88) 100%)'
            : 'linear-gradient(135deg, rgba(30,20,70,0.52) 0%, rgba(20,15,55,0.46) 50%, rgba(10,20,50,0.50) 100%)',
        }} />
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position:'absolute', top:'15%', left:'5%', width:500, height:500, borderRadius:'50%', background:'rgba(108,99,255,0.07)', filter:'blur(90px)' }} />
          <div style={{ position:'absolute', bottom:'10%', right:'8%', width:320, height:320, borderRadius:'50%', background:'rgba(127,231,196,0.06)', filter:'blur(70px)' }} />
          <div style={{ position:'absolute', top:'60%', left:'40%', width:250, height:250, borderRadius:'50%', background:'rgba(255,107,157,0.05)', filter:'blur(60px)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-24 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative">

          {/* LEFT — text + CTAs */}
          <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.8, ease:[0.4,0,0.2,1] }}>
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7"
              style={{ background:'rgba(108,99,255,0.14)', border:'1px solid rgba(108,99,255,0.32)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:'#7FE7C4' }} />
              <span style={{ fontSize:'0.72rem', color:'#7FE7C4', fontWeight:700, letterSpacing:'0.06em' }}>
                EXCLUSIVO · Escuela Colombiana de Ingeniería
              </span>
            </div>

            <div className="mb-3">
              <span style={{ fontWeight: 900, fontSize: 'clamp(2.8rem,5vw,4rem)', letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#A89BFF,#7FE7C4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block', lineHeight: 1.05, filter:'drop-shadow(0 2px 12px rgba(108,99,255,0.5))' }}>
                U•link
              </span>
            </div>
            <h1 style={{ fontWeight:900, fontSize:'clamp(1.9rem,3.5vw,3rem)', lineHeight:1.1, color:'white', marginBottom:'22px', textShadow:'0 2px 16px rgba(0,0,0,0.35)' }}>
              Conecta, aprende y<br />
              <span style={{ background:'linear-gradient(135deg,#A89BFF,#7FE7C4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                crece juntos
              </span>
            </h1>

            <p style={{ fontSize:'1.05rem', color:'rgba(255,255,255,0.82)', lineHeight:1.78, marginBottom:'36px', maxWidth:460, textShadow:'0 1px 8px rgba(0,0,0,0.4)' }}>
              La plataforma social construida 100% para estudiantes de la ECI. Parches, matching inteligente, eventos y bienestar, todo en un lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <motion.button onClick={onRegister}
                whileHover={{ scale:1.04, boxShadow:'0 14px 40px rgba(108,99,255,0.65)' }} whileTap={{ scale:0.97 }}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base"
                style={{ background:'linear-gradient(135deg,#6C63FF,#8B7FFF)', color:'white', boxShadow:'0 4px 24px rgba(108,99,255,0.48)' }}>
                Crear cuenta gratis <ArrowRight size={18} />
              </motion.button>
              <button onClick={onLogin}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all"
                style={{ border:'2px solid rgba(255,255,255,0.55)', color:'white', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)' }}>
                Ya tengo cuenta
              </button>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {['Matching IA','Parches virtuales','Eventos campus','Bienestar 24/7','Álbum de Monas'].map(tag => (
                <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background:'rgba(0,0,0,0.28)', color:'rgba(255,255,255,0.88)', border:'1px solid rgba(255,255,255,0.22)', backdropFilter:'blur(6px)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — Floating app preview cards, two aligned columns (stretched to equal height) */}
          <div className="hidden lg:flex" style={{ gap:20 }}>

            {/* Column 1 — Match, Bienestar, Active parche, XP */}
            <div className="flex flex-col items-start" style={{ width:222, gap:16 }}>

              {/* MATCH CARD */}
              <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35, duration:0.7 }}
                style={{ width:'100%', borderRadius:20, overflow:'hidden',
                  background: dark ? 'rgba(13,11,30,0.88)' : 'rgba(255,255,255,0.94)',
                  backdropFilter:'blur(24px)',
                  border: dark ? '1px solid rgba(108,99,255,0.38)' : '1px solid rgba(108,99,255,0.22)',
                  boxShadow: dark ? '0 28px 70px rgba(0,0,0,0.65)' : '0 20px 60px rgba(108,99,255,0.18)' }}>
                <motion.div animate={{ y:[0,-11,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}>
                  <div style={{ height:68, background:'linear-gradient(135deg,#6C63FF,#FF6B9D)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'white', fontSize:'0.92rem', border:'2px solid rgba(255,255,255,0.28)' }}>CR</div>
                  </div>
                  <div style={{ padding:'11px 15px 15px' }}>
                    <span style={{ fontSize:'0.58rem', fontWeight:800, color:'#FF6B9D', letterSpacing:'0.07em', textTransform:'uppercase' }}>¡Match!</span>
                    <p style={{ fontWeight:700, fontSize:'0.88rem', color: dark ? 'white' : '#1A1829', marginTop:4, marginBottom:2 }}>Camila Rodríguez</p>
                    <p style={{ fontSize:'0.72rem', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(26,24,41,0.52)', marginBottom:9 }}>Ing. de Sistemas · 7mo sem.</p>
                    <div style={{ background:'rgba(108,99,255,0.15)', borderRadius:8, padding:'4px 9px', display:'inline-flex', gap:4 }}>
                      <span style={{ fontSize:'0.64rem', color:'#6C63FF', fontWeight:700 }}>96% compatibilidad</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* BIENESTAR CARD */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:0.7 }}
                style={{ width:'100%', borderRadius:16,
                  background: dark ? 'rgba(13,11,30,0.88)' : 'rgba(255,255,255,0.94)',
                  backdropFilter:'blur(22px)',
                  border: dark ? '1px solid rgba(91,200,255,0.3)' : '1px solid rgba(91,200,255,0.45)',
                  boxShadow: dark ? '0 14px 40px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.12)',
                  padding:'12px 15px', display:'flex', alignItems:'center', gap:11 }}>
                <motion.div animate={{ y:[0,-7,0] }} transition={{ duration:4.5, repeat:Infinity, ease:'easeInOut', delay:0.3 }}
                  style={{ display:'flex', alignItems:'center', gap:11 }}>
                  <div style={{ width:38, height:38, borderRadius:11, background:'rgba(91,200,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>🧘</div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:'0.78rem', color: dark ? 'white' : '#1A1829', lineHeight:1.2 }}>Momento de pausa</p>
                    <p style={{ fontSize:'0.64rem', color:'#0A8FCC', fontWeight:600, marginTop:3 }}>Bienestar 24/7</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* ACTIVE PARCHE */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.65, duration:0.7 }}
                style={{ width:'100%', borderRadius:16,
                  background: dark ? 'rgba(13,11,30,0.88)' : 'rgba(255,255,255,0.94)',
                  backdropFilter:'blur(22px)',
                  border: dark ? '1px solid rgba(127,231,196,0.28)' : '1px solid rgba(127,231,196,0.45)',
                  boxShadow: dark ? '0 14px 40px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.12)',
                  padding:'10px 15px', display:'flex', alignItems:'center', gap:11 }}>
                <motion.div animate={{ y:[0,7,0] }} transition={{ duration:5, repeat:Infinity, ease:'easeInOut', delay:1.5 }}
                  style={{ display:'flex', alignItems:'center', gap:11 }}>
                  <div style={{ width:38, height:38, borderRadius:11, background:'rgba(108,99,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>📐</div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:'0.78rem', color: dark ? 'white' : '#1A1829', lineHeight:1.2 }}>Cálculo III Survivors</p>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#7FE7C4' }} />
                      <span style={{ fontSize:'0.64rem', color:'#0D9D74', fontWeight:600 }}>7 activos ahora</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* XP BADGE */}
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.85, duration:0.6 }}
                style={{ width:'100%', borderRadius:12, padding:'8px 12px', textAlign:'center',
                  background: dark ? 'rgba(255,179,71,0.15)' : 'rgba(255,179,71,0.18)',
                  border:'1px solid rgba(255,179,71,0.45)',
                  backdropFilter:'blur(12px)' }}>
                <motion.div animate={{ scale:[1,1.06,1] }} transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}>
                  <p style={{ fontSize:'0.7rem', fontWeight:800, color:'#C47D00', whiteSpace:'nowrap' }}>+120 XP ganados hoy</p>
                </motion.div>
              </motion.div>
            </div>

            {/* Column 2 — Live event, Message, Álbum de Monas (stretched to match column 1's height) */}
            <div className="flex flex-col items-start" style={{ width:200, gap:16 }}>

              {/* LIVE EVENT CARD */}
              <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4, duration:0.7 }}
                style={{ width:'100%', borderRadius:18,
                  background: dark ? 'rgba(13,11,30,0.88)' : 'rgba(255,255,255,0.94)',
                  backdropFilter:'blur(22px)',
                  border: dark ? '1px solid rgba(255,179,71,0.32)' : '1px solid rgba(255,179,71,0.4)',
                  boxShadow: dark ? '0 18px 52px rgba(0,0,0,0.55)' : '0 16px 48px rgba(0,0,0,0.12)',
                  padding:'14px 16px' }}>
                <motion.div animate={{ y:[0,9,0] }} transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut', delay:0.6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:'#FF4D6A', boxShadow:'0 0 8px #FF4D6A' }} />
                    <span style={{ fontSize:'0.58rem', fontWeight:800, color:'#FF4D6A', textTransform:'uppercase', letterSpacing:'0.09em' }}>En vivo</span>
                  </div>
                  <p style={{ fontWeight:700, fontSize:'0.86rem', color: dark ? 'white' : '#1A1829', marginBottom:3 }}>Hackathon ECI 2026</p>
                  <p style={{ fontSize:'0.7rem', color: dark ? 'rgba(255,255,255,0.47)' : 'rgba(26,24,41,0.5)', marginBottom:11 }}>Sáb 20 Jun · Auditorio Ppal.</p>
                  <div style={{ height:4, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius:2, overflow:'hidden', marginBottom:5 }}>
                    <div style={{ width:'78%', height:'100%', background:'linear-gradient(90deg,#FFB347,#FF6B9D)', borderRadius:2 }} />
                  </div>
                  <p style={{ fontSize:'0.64rem', color: dark ? 'rgba(255,255,255,0.38)' : 'rgba(26,24,41,0.42)' }}>156 / 200 inscritos</p>
                </motion.div>
              </motion.div>

              {/* ALBUM DE MONAS CARD — grows to exactly fill remaining column height (basis:0 so it never overshoots) */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.75, duration:0.7 }}
                style={{ width:'100%', flex:'1 1 0%', minHeight:0, overflow:'hidden', borderRadius:18,
                  background: dark ? 'rgba(13,11,30,0.88)' : 'rgba(255,255,255,0.94)',
                  backdropFilter:'blur(22px)',
                  border: dark ? '1px solid rgba(167,139,250,0.32)' : '1px solid rgba(167,139,250,0.4)',
                  boxShadow: dark ? '0 18px 52px rgba(0,0,0,0.55)' : '0 16px 48px rgba(0,0,0,0.12)',
                  padding:'14px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:6 }}>
                <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:3.2, repeat:Infinity, ease:'easeInOut', delay:0.4 }}
                  style={{ flex:'1 1 0%', minHeight:0, width:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ImageWithFallback src={monoCoderNewImg} alt="Mona coleccionable" style={{ maxWidth:'70%', maxHeight:'100%', objectFit:'contain' }} />
                </motion.div>
                <div style={{ flexShrink:0 }}>
                  <p style={{ fontWeight:700, fontSize:'0.8rem', color: dark ? 'white' : '#1A1829', lineHeight:1.25 }}>¡Nueva mona desbloqueada!</p>
                  <p style={{ fontSize:'0.65rem', color: dark ? 'rgba(255,255,255,0.47)' : 'rgba(26,24,41,0.5)', marginTop:3 }}>Álbum de Monas · Edición Coder</p>
                </div>
                <span style={{ flexShrink:0, background:'rgba(167,139,250,0.15)', color:'#A78BFA', padding:'3px 10px', borderRadius:20, fontSize:'0.62rem', fontWeight:700 }}>Legendario</span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y:[0,7,0] }} transition={{ duration:1.6, repeat:Infinity }}>
            <div style={{ width:24, height:40, borderRadius:12, border:'2px solid rgba(255,255,255,0.18)', display:'flex', justifyContent:'center', paddingTop:6 }}>
              <div style={{ width:3, height:10, borderRadius:2, background:'rgba(255,255,255,0.35)' }} />
            </div>
          </motion.div>
        </div>
      </section>


      {/* ══════════════════════════════════════
          GALLERY — Bento editorial layout
      ══════════════════════════════════════ */}
      <section style={{ padding:'60px 0 72px', background: dark ? '#0B0918' : '#F3F2FF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="text-center mb-10">
            <p style={{ fontSize:'0.72rem', fontWeight:800, color:'#6C63FF', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>
              Hecho para la ECI
            </p>
            <h2 style={{ fontWeight:900, fontSize:'clamp(1.6rem,3.2vw,2.4rem)', color:textH, marginBottom:16 }}>
              Momentos reales de la comunidad
            </h2>
            <a href="https://www.instagram.com/u_link_" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-85"
              style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.15), rgba(108,99,255,0.15))', border: '1px solid rgba(255,107,157,0.35)', color: '#FF6B9D' }}>
              📸 Síguenos en Instagram — sé el primero en enterarte de las novedades
            </a>
          </motion.div>

          {/* ── Desktop bento ── */}
          <div className="hidden md:flex flex-col gap-3">

            {/* Row 1: hero (2/3) + right stack (1/3) */}
            <div className="flex gap-3" style={{ height: 380 }}>

              {/* Hero card */}
              {(() => { const hero = GALLERY[galleryOrder[0]]; return (
              <motion.div
                key={hero.label}
                initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.4 }}
                whileHover={{ scale:1.012, transition:{ duration:0.22 } }}
                style={{ flex:2, borderRadius:24, overflow:'hidden', position:'relative', cursor:'default',
                  boxShadow: dark ? '0 20px 56px rgba(0,0,0,0.5)' : '0 14px 44px rgba(0,0,0,0.18)' }}>
                <ImageWithFallback src={hero.img} alt={hero.label}
                  style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }} />
                <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, ${hero.color}d0 0%, rgba(0,0,0,0.08) 50%, transparent 100%)` }} />
                <div style={{ position:'absolute', bottom:22, left:22, right:22 }}>
                  <span style={{ display:'inline-block', padding:'4px 13px', borderRadius:20, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.2)', fontSize:'0.65rem', fontWeight:800, color:'white', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:7 }}>
                    {hero.label}
                  </span>
                  <p style={{ fontWeight:700, fontSize:'1.05rem', color:'white', lineHeight:1.2, textShadow:'0 2px 8px rgba(0,0,0,0.4)', marginBottom:6 }}>{hero.desc}</p>
                  <p style={{ fontWeight:400, fontSize:'0.8rem', color:'rgba(255,255,255,0.88)', lineHeight:1.5, maxWidth:440, textShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>{hero.info}</p>
                </div>
              </motion.div>
              ); })()}

              {/* Right stack */}
              <div className="flex flex-col gap-3" style={{ flex:1 }}>
                {[1, 2].map((pos, i) => {
                  const item = GALLERY[galleryOrder[pos]];
                  return (
                  <motion.div key={item.label}
                    initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }} transition={{ delay: (i+1)*0.09, duration:0.35 }}
                    whileHover={{ scale:1.015, transition:{ duration:0.22 } }}
                    onClick={() => swapWithHero(pos)}
                    style={{ flex:1, borderRadius:20, overflow:'hidden', position:'relative', cursor:'pointer',
                      boxShadow: dark ? '0 12px 36px rgba(0,0,0,0.45)' : '0 10px 32px rgba(0,0,0,0.15)' }}>
                    <ImageWithFallback src={item.img} alt={item.label}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, ${item.color}cc 0%, transparent 60%)` }} />
                    <div style={{ position:'absolute', bottom:14, left:14 }}>
                      <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, background:'rgba(0,0,0,0.32)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', fontSize:'0.6rem', fontWeight:800, color:'white', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:4 }}>
                        {item.label}
                      </span>
                      <p style={{ fontWeight:600, fontSize:'0.78rem', color:'rgba(255,255,255,0.9)' }}>{item.desc}</p>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Row 2: 3 equal cards */}
            <div className="flex gap-3" style={{ height: 210 }}>
              {[3, 4, 5].map((pos, i) => {
                const item = GALLERY[galleryOrder[pos]];
                return (
                <motion.div key={item.label}
                  initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.09 + 0.18, duration:0.35 }}
                  whileHover={{ scale:1.015, transition:{ duration:0.22 } }}
                  onClick={() => swapWithHero(pos)}
                  style={{ flex:1, borderRadius:20, overflow:'hidden', position:'relative', cursor:'pointer',
                    boxShadow: dark ? '0 12px 36px rgba(0,0,0,0.45)' : '0 10px 32px rgba(0,0,0,0.15)' }}>
                  <ImageWithFallback src={item.img} alt={item.label}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, ${item.color}cc 0%, transparent 58%)` }} />
                  <div style={{ position:'absolute', bottom:14, left:14 }}>
                    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, background:'rgba(0,0,0,0.32)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', fontSize:'0.6rem', fontWeight:800, color:'white', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:4 }}>
                      {item.label}
                    </span>
                    <p style={{ fontWeight:600, fontSize:'0.78rem', color:'rgba(255,255,255,0.9)' }}>{item.desc}</p>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── Mobile 2-col — tap a tile to expand it and reveal more info ── */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            {GALLERY.map((item, i) => {
              const expanded = mobileExpandedIdx === i;
              return (
              <motion.div key={item.label} layout
                initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ delay: i*0.07, layout:{ duration:0.35, ease:[0.4,0,0.2,1] } }}
                onClick={() => setMobileExpandedIdx(expanded ? null : i)}
                style={{ gridColumn: expanded ? '1 / -1' : undefined, height: expanded ? 240 : 158,
                  borderRadius:16, overflow:'hidden', position:'relative', cursor:'pointer',
                  boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>
                <ImageWithFallback src={item.img} alt={item.label} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, ${item.color}${expanded ? 'e0' : 'cc'} 0%, transparent ${expanded ? '65%' : '55%'})` }} />
                <div style={{ position:'absolute', bottom:12, left:12, right:12 }}>
                  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, background:'rgba(0,0,0,0.32)', backdropFilter:'blur(8px)', fontSize:'0.58rem', fontWeight:800, color:'white', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>
                    {item.label}
                  </span>
                  <p style={{ fontWeight:700, fontSize:'0.78rem', color:'white', lineHeight:1.2 }}>{item.desc}</p>
                  {expanded && (
                    <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15 }}
                      style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.9)', lineHeight:1.5, marginTop:6 }}>
                      {item.info}
                    </motion.p>
                  )}
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════
          FEATURES — Spotlight carousel
      ══════════════════════════════════════ */}
      <section id="funcionalidades" className="py-14 sm:py-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-sm font-semibold"
              style={{ background:'rgba(108,99,255,0.1)', color:'#6C63FF', border:'1px solid rgba(108,99,255,0.25)' }}>
              Funcionalidades
            </span>
            <h2 style={{ fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:textH, lineHeight:1.15, marginBottom:14 }}>
              Todo lo que necesitas,<br />
              <span style={{ background:'linear-gradient(135deg,#6C63FF,#7FE7C4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                en un solo lugar
              </span>
            </h2>
            <p style={{ fontSize:'1.05rem', color:textB, maxWidth:520, margin:'0 auto', lineHeight:1.75 }}>
              U•link no es otra red social. Es la plataforma que la comunidad ECI siempre necesitó.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-5 mb-5">
            {/* Spotlight card */}
            <div className="flex-1 relative overflow-hidden rounded-3xl border min-h-[260px]"
              style={{ background:card, borderColor:`${FEATURES[featureIdx].color}50`, backdropFilter:'blur(12px)' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background:`radial-gradient(circle at 20% 50%, ${FEATURES[featureIdx].color}16, transparent 60%)` }} />
              <AnimatePresence mode="wait">
                <motion.div key={featureIdx}
                  initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-24 }}
                  transition={{ duration:0.4, ease:[0.4,0,0.2,1] }}
                  className="relative p-8 h-full flex flex-col justify-between items-center text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex flex-col items-center gap-4 mb-5">
                      <div className="w-28 h-28 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ background:`${FEATURES[featureIdx].color}18`, border:`2px solid ${FEATURES[featureIdx].color}35` }}>
                        <ImageWithFallback src={FEATURES[featureIdx].img} alt={FEATURES[featureIdx].title}
                          style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-1 block" style={{ color:FEATURES[featureIdx].color }}>
                          Funcionalidad
                        </span>
                        <h3 style={{ fontWeight:800, fontSize:'1.6rem', color:textH, lineHeight:1.2 }}>
                          {FEATURES[featureIdx].title}
                        </h3>
                      </div>
                    </div>
                    <p style={{ fontSize:'1.08rem', color:textB, lineHeight:1.8, maxWidth:520, margin:'0 auto' }}>
                      {FEATURES[featureIdx].desc}
                    </p>
                  </div>
                  <div className="mt-6 w-full">
                    <div className="h-0.5 rounded-full overflow-hidden" style={{ background:`${FEATURES[featureIdx].color}20` }}>
                      <motion.div key={featureIdx} className="h-full rounded-full"
                        style={{ background:FEATURES[featureIdx].color }}
                        initial={{ width:'0%' }} animate={{ width:'100%' }}
                        transition={{ duration:7, ease:'linear' }} />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnail grid */}
            <div className="grid grid-cols-3 lg:grid-cols-2 gap-3 lg:w-52 lg:flex-shrink-0">
              {FEATURES.map((f,i) => (
                <button key={f.title} onClick={() => setFeatureIdx(i)}
                  className="rounded-2xl border p-3 text-left transition-all hover:scale-105 relative overflow-hidden"
                  style={{ background:featureIdx===i ? `${f.color}15` : card, borderColor:featureIdx===i ? `${f.color}60` : bord,
                    backdropFilter:'blur(12px)', boxShadow:featureIdx===i ? `0 4px 20px ${f.color}20` : 'none' }}>
                  <div className="w-12 h-12 mb-2">
                    <ImageWithFallback src={f.img} alt={f.title} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                  </div>
                  <p style={{ fontSize:'0.72rem', fontWeight:700, color:featureIdx===i ? f.color : textS, lineHeight:1.3 }}>{f.title}</p>
                  {featureIdx===i && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:`linear-gradient(90deg,${f.color},transparent)` }} />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            {FEATURES.map((f,i) => (
              <button key={i} onClick={() => setFeatureIdx(i)} className="rounded-full transition-all"
                style={{ width:i===featureIdx ? 24 : 8, height:8, background:i===featureIdx ? FEATURES[i].color : `${FEATURES[i].color}40` }} />
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════
          CÓMO FUNCIONA — 3 steps visual
      ══════════════════════════════════════ */}
      <section id="como-funciona" className="py-14 sm:py-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-semibold"
              style={{ background:'rgba(127,231,196,0.1)', color:'#7FE7C4', border:'1px solid rgba(127,231,196,0.25)' }}>
              <Shield size={12} /> Exclusivo para la ECI
            </span>
            <h2 style={{ fontWeight:900, fontSize:'clamp(1.6rem,3.2vw,2.4rem)', color:textH }}>
              Empieza en 3 pasos
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line — desktop */}
            <div className="hidden lg:block absolute" style={{ top:40, left:'17%', right:'17%', height:2, background:'linear-gradient(90deg,#6C63FF,#7FE7C4,#FFB347)', borderRadius:1, opacity:0.4 }} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {STEPS.map((step,i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true }} transition={{ delay:i*0.14 }}
                  className="text-center relative">
                  <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-3xl relative z-10"
                    style={{ background:`${step.color}14`, border:`2px solid ${step.color}28`, boxShadow:`0 8px 28px ${step.color}20` }}>
                    {step.icon}
                    <div className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background:step.color, color:'white', boxShadow:`0 4px 12px ${step.color}55` }}>
                      {i+1}
                    </div>
                  </div>
                  <h3 style={{ fontWeight:800, fontSize:'1rem', color:textH, marginBottom:8 }}>{step.title}</h3>
                  <p style={{ fontSize:'0.85rem', color:textS, lineHeight:1.65 }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-14">
            {['Verificación ECI','Tiempo real','IA integrada','Bienestar 24/7','Gamificado'].map(tag => (
              <span key={tag} className="px-4 py-2 rounded-full text-sm"
                style={{ background:'rgba(108,99,255,0.08)', color:'#6C63FF', border:'1px solid rgba(108,99,255,0.16)', fontWeight:500 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity:0, scale:0.96 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}
            className="rounded-[32px] overflow-hidden relative"
            style={{ background:'linear-gradient(135deg,#4A42C0 0%,#6C63FF 40%,#3B8A72 100%)' }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div style={{ position:'absolute', top:'-80px', right:'-80px', width:320, height:320, borderRadius:'50%', background:'#7FE7C4', filter:'blur(70px)', opacity:0.13 }} />
              <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:260, height:260, borderRadius:'50%', background:'#FF6B9D', filter:'blur(55px)', opacity:0.1 }} />
            </div>
            <div className="relative flex flex-col lg:flex-row items-center gap-10 p-12 lg:p-16">
              <div className="flex-1 text-center lg:text-left">
                <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.58)', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>
                  ¡Únete gratis hoy!
                </p>
                <h2 style={{ fontWeight:900, fontSize:'clamp(1.7rem,3.5vw,2.4rem)', color:'white', lineHeight:1.2, marginBottom:14 }}>
                  ¿Listo para ser parte de<br />la comunidad ECI?
                </h2>
                <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.72)', lineHeight:1.72, marginBottom:28, maxWidth:420 }}>
                  En menos de 2 minutos estás registrado y conectando con la comunidad de la Escuela Colombiana de Ingeniería.
                </p>
                <div className="flex flex-col gap-2.5 mb-8">
                  {['Totalmente gratuito para estudiantes ECI','Verificación segura con correo institucional','Soporte de bienestar disponible 24/7'].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:'rgba(127,231,196,0.22)' }}>
                        <Check size={11} style={{ color:'#7FE7C4' }} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize:'0.87rem', color:'rgba(255,255,255,0.84)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <motion.button onClick={onRegister}
                  whileHover={{ scale:1.05, boxShadow:'0 14px 40px rgba(127,231,196,0.52)' }} whileTap={{ scale:0.97 }}
                  className="flex items-center gap-2.5 px-9 py-4 rounded-2xl font-bold text-base"
                  style={{ background:'#7FE7C4', color:'#0F0E1A', boxShadow:'0 6px 24px rgba(127,231,196,0.38)' }}>
                  Crear mi cuenta gratis <ArrowRight size={18} />
                </motion.button>
              </div>
              <div className="flex-shrink-0 relative">
                <motion.div animate={{ y:[0,-12,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}>
                  <ImageWithFallback src={monoPatriciaImg} alt="Mascota U•link" className="object-contain"
                    style={{ width:180, height:180, filter:'drop-shadow(0 18px 44px rgba(0,0,0,0.32))' }} />
                </motion.div>
                <motion.div animate={{ rotate:[-3,3,-3] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                  className="absolute -top-4 -right-4 px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background:'#6C63FF', color:'white', boxShadow:'0 4px 14px rgba(108,99,255,0.42)' }}>
                  ¡Únete!
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 sm:px-8 border-t text-center" style={{ borderColor:bord }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <ImageWithFallback src={dark ? logoNuevoOscuroImg : logoNuevoClaroImg} alt="U•link" className="object-contain" style={{ height:32 }} />
          <span style={{ fontWeight:900, fontSize:'1rem', background:'linear-gradient(135deg,#6C63FF,#7FE7C4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>U•link</span>
        </div>
        <p style={{ fontSize:'0.8rem', color:textS }}>
          U•link © 2026 · Escuela Colombiana de Ingeniería · Solo para la comunidad ECI
        </p>
        <div className="flex items-center justify-center gap-6 mt-4">
          {([
            { label: 'Términos de uso', type: 'terminos' as const },
            { label: 'Privacidad', type: 'privacidad' as const },
            { label: 'Centro de ayuda', type: 'ayuda' as const },
            { label: 'Contacto', type: 'contacto' as const },
          ]).map(l => (
            <button key={l.type} onClick={() => setLegalModal(l.type)} className="text-xs hover:underline transition-all" style={{ color:textS, background:'none', border:'none' }}>{l.label}</button>
          ))}
        </div>
      </footer>
      <LegalModals open={legalModal} darkMode={dark} onClose={() => setLegalModal(null)} />
    </div>
  );
}
