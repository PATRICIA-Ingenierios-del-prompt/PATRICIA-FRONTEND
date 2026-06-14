import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Zap, Heart, Users, Camera, Check, X, MessageCircle, HelpCircle } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { InteresesPicker, CATEGORIAS } from '../components/InteresesPicker';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import monoCoder    from '../assets/monoCODER.png';
import monoDJ       from '../assets/monoDJ.png';
import monoCientifico from '../assets/monoCIENTIFICO.png';
import monoEstudio  from '../assets/monoESTUDIO.png';
import monoAireLibre from '../assets/monoAIRELIBRE.png';
import monoArte     from '../assets/monoARTE.png';
import monoMusica   from '../assets/monoMUSICA.png';
import monoJuegos   from '../assets/monoJUEGOS.png';

const MONAS_ALL = [
  { id: 1, name: 'Mona Coder',      rarity: 'Épica',      color: '#6C63FF', img: monoCoder,     unlocked: true  },
  { id: 2, name: 'Mona DJ',         rarity: 'Épica',      color: '#5BC8FF', img: monoDJ,        unlocked: true  },
  { id: 3, name: 'Mona Estudiosa',  rarity: 'Común',      color: '#FFB347', img: monoEstudio,   unlocked: true  },
  { id: 4, name: 'Mona Científica', rarity: 'Rara',       color: '#A78BFA', img: monoCientifico,unlocked: true  },
  { id: 5, name: 'Mona Música',     rarity: 'Rara',       color: '#FF6B9D', img: monoMusica,    unlocked: false },
  { id: 6, name: 'Mona Aire Libre', rarity: 'Legendaria', color: '#7FE7C4', img: monoAireLibre, unlocked: false },
  { id: 7, name: 'Mona Artista',    rarity: 'Épica',      color: '#FF9BAE', img: monoArte,      unlocked: false },
  { id: 8, name: 'Mona Gamer',      rarity: 'Legendaria', color: '#FFB347', img: monoJuegos,    unlocked: false },
];
const rarityBorder: Record<string, string> = { 'Común': '#8B85B050', 'Rara': '#7FE7C450', 'Épica': '#6C63FF60', 'Legendaria': '#FFB34770' };
const rarityBg: Record<string, string>     = { 'Común': '#8B85B012', 'Rara': '#7FE7C418', 'Épica': '#6C63FF18', 'Legendaria': '#FFB34720' };
// rarityColor is computed inside the component where t is available

const LOS_ROALES = [
  { name: 'Cálculo III Survivors', emoji: '📐', members: 23, color: '#6C63FF', avatars: ['VT','SM','IR','CR','MG'] },
  { name: 'Proyecto IA — Grupo 4', emoji: '🤖', members: 6,  color: '#7FE7C4', avatars: ['SG','AP','JL'] },
  { name: 'Fútbol Martes ECI',     emoji: '⚽', members: 18, color: '#FFB347', avatars: ['CR2','FE','AL','PV'] },
];

const BADGES = [
  { label: 'CUMPLEAÑOS',     emoji: '🎂', color: '#FF6B9D',  bg: 'rgba(255,107,157,0.15)' },
  { label: '12K+ MONAS',    emoji: '🎴', color: '#7FE7C4',  bg: 'rgba(127,231,196,0.15)' },
  { label: 'TOP 5 FACULTAD',emoji: '🏆', color: '#FFB347',  bg: 'rgba(255,179,71,0.15)'  },
];

// Default interests as IDs from the InteresesPicker catalog
const DEFAULT_INTEREST_IDS = ['ia', 'webdev', 'grupos-estudio', 'videojuegos', 'foto', 'cine', 'tutorias', 'hackathones'];

const WEEK_MOODS = [4, 3, 2, 5, 3, 4, 3];

const CARRERAS = [
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería de Sistemas',
  'Ingeniería Industrial',
  'Ingeniería Electrónica',
  'Economía',
  'Administración de Empresas',
  'Matemáticas',
  'Ingeniería Mecánica',
  'Ingeniería Biomédica',
  'Ingeniería Ambiental',
  'Ingeniería Estadística',
  'Ingeniería de Inteligencia Artificial',
  'Ingeniería de Ciberseguridad',
  'Ingeniería en Biotecnología',
];
const SEMESTRES = ['1','2','3','4','5','6','7','8','9','10'];

function EditModal({ onClose, intereses, onSaveIntereses }: { onClose: () => void; intereses: string[]; onSaveIntereses: (ids: string[]) => void }) {
  const t = useTheme();
  const [form, setForm] = useState({ nombre:'Tu Nombre Aquí', bio:'Estudiante de Ing. de Sistemas apasionado por la IA y el desarrollo de software.', carrera:'Ingeniería de Sistemas', segundaCarrera:'', semestre:'7', genero:'N/D', privacidad:'publico' });
  const [localIntereses, setLocalIntereses] = useState<string[]>(intereses);
  const [tab, setTab] = useState<'datos'|'intereses'>('datos');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
        className="rounded-3xl border w-full max-w-lg max-h-[88vh] overflow-y-auto"
        style={{ background: t.darkMode ? '#1A1829' : '#FFFFFF', borderColor: 'rgba(108,99,255,0.3)' }}
        onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b" style={{ borderColor: t.divider }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: t.text }}>Editar Perfil</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
              style={{ background: 'rgba(108,99,255,0.1)' }}>
              <X size={15} style={{ color: t.textMuted }} />
            </button>
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
            {(['datos', 'intereses'] as const).map(tabKey => (
              <button key={tabKey} onClick={() => setTab(tabKey)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: tab === tabKey ? '#6C63FF' : 'transparent', color: tab === tabKey ? 'white' : t.textMuted }}>
                {tabKey === 'datos' ? '👤 Datos' : '🏷️ Intereses'}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Avatar — only shown on datos tab */}
          {tab === 'datos' && <>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#7FE7C4)', fontSize:'1.1rem', fontWeight:800, color:'white' }}>TU</div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background:'#6C63FF' }}>
                <Camera size={10} color="white" />
              </button>
            </div>
            <div>
              <p style={{ fontWeight:600, fontSize:'0.88rem', color: t.text }}>Foto de perfil</p>
              <p style={{ fontSize:'0.72rem', color: t.textMuted }}>JPG, PNG hasta 5MB</p>
            </div>
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:600, color: t.text, display:'block', marginBottom:'6px' }}>Nombre completo</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none text-sm"
              style={{ background: t.inputBg, border:`1.5px solid ${t.cardBorder}`, color: t.text }} />
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:600, color: t.text, display:'block', marginBottom:'6px' }}>Bio</label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3}
              className="w-full px-4 py-3 rounded-xl outline-none resize-none text-sm"
              style={{ background: t.inputBg, border:`1.5px solid ${t.cardBorder}`, color: t.text }} />
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:600, color: t.text, display:'block', marginBottom:'8px' }}>Género</label>
            <div className="grid grid-cols-4 gap-2">
              {['Masculino','Femenino','Otro','N/D'].map(g => (
                <button key={g} onClick={() => set('genero', g)}
                  className="py-2 rounded-xl text-sm transition-all"
                  style={{ background: form.genero===g ? 'rgba(108,99,255,0.25)' : t.inputBg, border:`1.5px solid ${form.genero===g ? '#6C63FF' : t.cardBorder}`, color: form.genero===g ? '#6C63FF' : t.text, fontWeight: form.genero===g ? 600 : 400 }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize:'0.78rem', fontWeight:600, color: t.text, display:'block', marginBottom:'6px' }}>Carrera principal</label>
              <select value={form.carrera} onChange={e => set('carrera', e.target.value)}
                className="w-full px-3 py-3 rounded-xl outline-none text-sm"
                style={{ background: t.inputBg, border:`1.5px solid ${t.cardBorder}`, color: t.text }}>
                {CARRERAS.map(c => <option key={c} value={c} style={{ background: t.darkMode ? '#1A1829' : '#fff' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'0.78rem', fontWeight:600, color: t.text, display:'block', marginBottom:'6px' }}>Semestre</label>
              <select value={form.semestre} onChange={e => set('semestre', e.target.value)}
                className="w-full px-3 py-3 rounded-xl outline-none text-sm"
                style={{ background: t.inputBg, border:`1.5px solid ${t.cardBorder}`, color: t.text }}>
                {SEMESTRES.map(s => <option key={s} value={s} style={{ background: t.darkMode ? '#1A1829' : '#fff' }}>{s}°</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:600, color: t.text, display:'block', marginBottom:'6px' }}>
              Segunda carrera <span style={{ color: t.textMuted, fontWeight: 400 }}>(opcional)</span>
            </label>
            <select value={form.segundaCarrera} onChange={e => set('segundaCarrera', e.target.value)}
              className="w-full px-3 py-3 rounded-xl outline-none text-sm"
              style={{ background: t.inputBg, border:`1.5px solid ${t.cardBorder}`, color: form.segundaCarrera ? t.text : t.textMuted }}>
              <option value="" style={{ background: t.darkMode ? '#1A1829' : '#fff' }}>Ninguna</option>
              {CARRERAS.filter(c => c !== form.carrera).map(c => (
                <option key={c} value={c} style={{ background: t.darkMode ? '#1A1829' : '#fff' }}>{c}</option>
              ))}
            </select>
            {form.segundaCarrera && (
              <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl w-fit"
                style={{ background: 'rgba(127,231,196,0.1)', border: '1px solid rgba(127,231,196,0.3)' }}>
                <span style={{ fontSize: '0.72rem', color: '#7FE7C4', fontWeight: 600 }}>✓ {form.segundaCarrera}</span>
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:600, color: t.text, display:'block', marginBottom:'8px' }}>Privacidad</label>
            <div className="flex gap-3">
              {[{val:'publico',label:'🌍 Público'},{val:'privado',label:'🔒 Privado'}].map(opt => (
                <button key={opt.val} onClick={() => set('privacidad', opt.val)}
                  className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                  style={{ background: form.privacidad===opt.val ? t.activeBg : 'transparent', border:`1.5px solid ${form.privacidad===opt.val ? '#6C63FF' : t.cardBorder}`, color: form.privacidad===opt.val ? '#6C63FF' : t.text, fontWeight: form.privacidad===opt.val ? 600 : 400 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* datos tab save */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm" style={{ background: t.inputBg, color: t.textMuted }}>Cancelar</button>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background:'linear-gradient(135deg,#6C63FF,#8B7FFF)', color:'white' }}>
              Guardar cambios
            </button>
          </div>
          </>}

          {/* Intereses tab */}
          {tab === 'intereses' && (
            <div className="space-y-5">
              <InteresesPicker
                selected={localIntereses}
                onChange={setLocalIntereses}
                minSelect={1}
                maxSelect={12}
                darkMode={t.darkMode}
              />
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm" style={{ background: t.inputBg, color: t.textMuted }}>Cancelar</button>
                <button
                  onClick={() => { onSaveIntereses(localIntereses); onClose(); }}
                  disabled={localIntereses.length < 1}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#6C63FF', color: 'white' }}>
                  Guardar intereses ✓
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProfileView() {
  const t = useTheme();
  const [showEdit, setShowEdit] = useState(false);
  const [selectedMona, setSelectedMona] = useState(MONAS_ALL[0]);
  const [interesIds, setInteresIds] = useState<string[]>(DEFAULT_INTEREST_IDS);
  const unlocked = MONAS_ALL.filter(m => m.unlocked);

  // Rarity colors — computed here so we can use t.textMuted
  const rarityColor: Record<string, string> = {
    'Común':      t.textMuted,
    'Rara':       '#7FE7C4',
    'Épica':      '#6C63FF',
    'Legendaria': '#FFB347',
  };

  return (
    <div className="h-full overflow-y-auto pb-8">
      {/* Portal renders outside transform ancestor so position:fixed works correctly */}
      {showEdit && createPortal(
        <AnimatePresence><EditModal onClose={() => setShowEdit(false)} intereses={interesIds} onSaveIntereses={setInteresIds} /></AnimatePresence>,
        document.body
      )}

      {/* ── HERO PROFILE CARD (ref. imagen 8) ────────────────────────────────── */}
      <div className="rounded-3xl border mb-6 overflow-hidden relative"
        style={{ background: t.darkMode ? 'linear-gradient(135deg, #1A1829, #251F3D)' : t.cardBg, borderColor: t.cardBorder }}>
        {/* Glow bg */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-8 pointer-events-none"
          style={{ background: '#6C63FF', transform: 'translate(20%,-20%)', filter: 'blur(64px)' }} />

        {/* Banner */}
        <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #6C63FF30, #7FE7C415)' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(108,99,255,0.2) 0%, transparent 60%)' }} />
          <button className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
            style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
            <Camera size={11} /> Editar banner
          </button>
        </div>

        <div className="px-7 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-14 mb-5">
            {/* Big circle avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full flex items-center justify-center border-4"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#7FE7C4)', borderColor: t.cardBg, fontSize:'2.2rem', fontWeight:900, color:'white' }}>
                JL
              </div>
              <button onClick={() => setShowEdit(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background:'#6C63FF' }}>
                <Camera size={13} color="white" />
              </button>
              {/* Online dot */}
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full border-2"
                style={{ background:'#7FE7C4', borderColor: t.cardBg }} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-14">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
                style={{ background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.2)' }}>
                <MessageCircle size={15} style={{ color:'#6C63FF' }} />
              </button>
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background:'#7FE7C4', color:'#0F0E1A' }}>
                <Edit2 size={14} /> Editar perfil
              </button>
              <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
                style={{ background:'rgba(127,231,196,0.1)', border:'1px solid rgba(127,231,196,0.2)' }}>
                <HelpCircle size={15} style={{ color:'#7FE7C4' }} />
              </button>
            </div>
          </div>

          {/* Name + info */}
          <div className="mb-4">
            <h2 style={{ fontWeight:900, fontSize:'1.5rem', color:t.text, marginBottom:'4px' }}>Juan Carlos Leal Cruz</h2>
            <p style={{ fontSize:'0.88rem', color:t.textMuted, marginBottom:'12px' }}>
              Ing. de Sistemas · 7mo semestre · ECI
            </p>

            {/* Badges ref. imagen 8 */}
            <div className="flex gap-2 mb-4">
              {BADGES.map(b => (
                <div key={b.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: b.bg, border:`1px solid ${b.color}40` }}>
                  <span style={{ fontSize:'0.85rem' }}>{b.emoji}</span>
                  <span style={{ fontSize:'0.68rem', fontWeight:700, color:b.color, letterSpacing:'0.06em' }}>{b.label}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize:'0.88rem', color:t.textSub, lineHeight:1.7, marginBottom:'20px', maxWidth:'600px' }}>
              Apasionado por la IA y el desarrollo de software 🤖 Busco parches de estudio y amigos para explorar Bogotá. Miembro activo del IEEE Student Branch.
            </p>

            {/* XP bar */}
            <div className="mb-5 max-w-md">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Zap size={14} style={{ color:'#FFB347' }} />
                  <span style={{ fontWeight:700, fontSize:'0.88rem' }}>Nivel 12 — Explorador</span>
                </div>
                <span style={{ fontSize:'0.72rem', color: t.textMuted }}>2,340 / 3,000 XP</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: t.divider }}>
                <motion.div initial={{ width:0 }} animate={{ width:'78%' }} transition={{ duration:1.5, ease:'easeOut' }}
                  className="h-full rounded-full" style={{ background:'linear-gradient(90deg,#6C63FF,#7FE7C4)' }} />
              </div>
            </div>

            {/* Stat boxes ref. imagen 8 */}
            <div className="flex gap-3">
              {[
                { label:'XP Total',     value:'48K+', color:'#6C63FF' },
                { label:'Parches',      value:'12K+', color:'#7FE7C4' },
                { label:'Monas',        value:'58K+', color:'#FFB347' },
              ].map(s => (
                <div key={s.label} className="px-5 py-3 rounded-2xl border text-center"
                  style={{ background:`${s.color}12`, borderColor:`${s.color}35` }}>
                  <p style={{ fontWeight:900, fontSize:'1.2rem', color:s.color }}>{s.value}</p>
                  <p style={{ fontSize:'0.68rem', color:t.textMuted }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT GRID ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">
        {/* Left 2 cols */}
        <div className="col-span-2 space-y-5">

          {/* Los Roales — ref. imagen 8 */}
          <div className="rounded-2xl p-5 border" style={{ background:t.cardBg, borderColor:t.cardBorder }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight:700, fontSize:'1rem' }}>Los Roales 🎪</h3>
              <span style={{ fontSize:'0.78rem', color:t.textMuted }}>7 parches activos</span>
            </div>
            <div className="space-y-3">
              {LOS_ROALES.map(p => (
                <div key={p.name} className="flex items-center gap-4 p-3 rounded-xl border transition-all hover:border-primary/30"
                  style={{ background:`${p.color}06`, borderColor:`${p.color}20` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:`${p.color}18` }}>
                    {p.emoji}
                  </div>
                  <div className="flex-1">
                    <p style={{ fontWeight:600, fontSize:'0.88rem' }}>{p.name}</p>
                    {/* Stacked avatars ref. imagen 8 */}
                    <div className="flex mt-1">
                      {p.avatars.slice(0,4).map((av, i) => (
                        <div key={av} className="w-5 h-5 rounded-full flex items-center justify-center border"
                          style={{ background:'linear-gradient(135deg,#6C63FF,#7FE7C4)', fontSize:'0.45rem', fontWeight:700, color:'white', marginLeft: i > 0 ? '-6px' : 0, borderColor: t.cardBg, zIndex: 4-i}}>
                          {av.slice(0,2)}
                        </div>
                      ))}
                      {p.avatars.length > 4 && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center border ml-[-6px]"
                          style={{ background:'rgba(108,99,255,0.3)', fontSize:'0.45rem', color:'#6C63FF', borderColor: t.cardBg }}>
                          +{p.avatars.length-4}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize:'0.72rem', color: t.textMuted }}>{p.members} miembros</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mis Monas — ref. imagen 8 */}
          <div className="rounded-2xl p-5 border" style={{ background:t.cardBg, borderColor:t.cardBorder }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight:700, fontSize:'1rem' }}>Mis Monas 🎴</h3>
              <div className="flex items-center gap-2">
                <span style={{ fontSize:'0.78rem', color:t.textMuted }}>{unlocked.length}/{MONAS_ALL.length} coleccionadas</span>
                <span className="px-2 py-0.5 rounded-full text-xs" style={{ background:'rgba(127,231,196,0.1)', color:'#7FE7C4' }}>
                  Activa: {selectedMona.name}
                </span>
              </div>
            </div>
            {/* Progress */}
            <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background:'rgba(108,99,255,0.1)' }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${(unlocked.length/MONAS_ALL.length)*100}%` }} transition={{ duration:1.5, ease:'easeOut' }}
                className="h-full rounded-full" style={{ background:'linear-gradient(90deg,#6C63FF,#7FE7C4)' }} />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {MONAS_ALL.map(mona => (
                <motion.div key={mona.id}
                  whileHover={mona.unlocked ? { scale:1.06, y:-5 } : { scale:1.02 }}
                  onClick={() => mona.unlocked && setSelectedMona(mona)}
                  className="rounded-2xl border flex flex-col items-center text-center p-3 relative cursor-pointer overflow-hidden"
                  style={{
                    background: mona.unlocked ? rarityBg[mona.rarity] : '#1E1C30',
                    borderColor: selectedMona.id === mona.id ? mona.color : (mona.unlocked ? rarityBorder[mona.rarity] : t.inputBorder),
                    borderWidth: selectedMona.id === mona.id ? 2 : 1,
                    boxShadow: selectedMona.id === mona.id ? `0 0 20px ${mona.color}40` : 'none',
                  }}>
                  {/* Rarity glow for Legendaria */}
                  {mona.rarity === 'Legendaria' && mona.unlocked && (
                    <div className="absolute inset-0 opacity-10 rounded-2xl" style={{ background:`radial-gradient(circle at 50% 30%, ${mona.color}, transparent)` }} />
                  )}
                  <div className={mona.unlocked ? '' : 'opacity-25 grayscale'}>
                    <ImageWithFallback src={mona.img} alt={mona.name} className="object-contain"
                      style={{ width: 56, height: 56 }} />
                  </div>
                  {!mona.unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
                      <span style={{ fontSize:'1.5rem' }}>🔒</span>
                    </div>
                  )}
                  <p style={{ fontSize:'0.65rem', fontWeight:700, color: mona.unlocked ? rarityColor[mona.rarity] : t.textMuted, marginTop:'6px' }}>
                    {mona.name.replace('Mona ','')}
                  </p>
                  <span style={{ fontSize:'0.55rem', color: rarityColor[mona.rarity], marginTop:'2px' }}>{mona.rarity}</span>
                  {mona.unlocked && (
                    <button className="mt-2 px-2.5 py-1 rounded-lg text-xs w-full transition-all hover:opacity-80"
                      style={{ background:`${mona.color}20`, color: mona.color }}>
                      {selectedMona.id === mona.id ? '✓ Activa' : 'ver'}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="rounded-2xl p-5 border" style={{ background:t.cardBg, borderColor:t.cardBorder }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 style={{ fontWeight:700, fontSize:'1rem' }}>Mis intereses</h3>
                <p style={{ fontSize:'0.72rem', color:t.textMuted, marginTop:'2px' }}>{interesIds.length}/12 seleccionados</p>
              </div>
              <button onClick={() => setShowEdit(true)} className="px-3 py-1.5 rounded-xl text-xs font-medium hover:opacity-80 transition-all"
                style={{ background: t.inputBg, color:'#6C63FF', border:'1px solid rgba(108,99,255,0.2)' }}>
                ✏️ Editar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {interesIds.map(id => {
                  // find emoji and label from CATEGORIAS
                  let label = id; let emoji = '🏷️';
                  for (const cat of CATEGORIAS) {
                    const int = cat.intereses.find(i => i.id === id);
                    if (int) { label = int.label; emoji = cat.emoji; break; }
                  }
                  return (
                    <motion.span key={id}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer"
                      onClick={() => setShowEdit(true)}
                      style={{ background:'#6C63FF', color:'white', border:'1px solid rgba(108,99,255,0.5)' }}
                      title="Click para editar intereses">
                      <span style={{ fontSize:'0.78rem' }}>{emoji}</span>
                      <span style={{ fontSize:'0.8rem', fontWeight: 500 }}>{label}</span>
                    </motion.span>
                  );
                })}
              </AnimatePresence>
              {interesIds.length === 0 && (
                <button onClick={() => setShowEdit(true)}
                  className="px-4 py-2 rounded-xl text-sm border-dashed border-2 hover:opacity-70 transition-all"
                  style={{ color: t.textMuted, borderColor:'rgba(108,99,255,0.3)' }}>
                  + Añadir intereses
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">

          {/* Bienestar weekly */}
          <div className="rounded-2xl p-5 border"
            style={{ background:'linear-gradient(135deg,rgba(127,231,196,0.08),rgba(108,99,255,0.04))', borderColor:'rgba(127,231,196,0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} style={{ color:'#7FE7C4' }} />
              <span style={{ fontWeight:700, fontSize:'0.9rem' }}>Bienestar 24/7</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs" style={{ background:'rgba(127,231,196,0.15)', color:'#7FE7C4' }}>
                🔥 7 días
              </span>
            </div>
            <div className="space-y-1.5 mb-3">
              {WEEK_MOODS.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ fontSize:'0.62rem', color: t.textMuted, width:'22px' }}>{['L','M','X','J','V','S','D'][i]}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(127,231,196,0.1)' }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${val*20}%` }} transition={{ duration:1, delay:i*0.1 }}
                      className="h-full rounded-full" style={{ background:'#7FE7C4' }} />
                  </div>
                  <span style={{ fontSize:'0.78rem' }}>
                    {['😰','😔','😐','🙂','😊'][val-1]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Soporte CTA */}
          <div className="rounded-2xl p-4 cursor-pointer transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background:'linear-gradient(135deg,#6C63FF,#7FE7C4)' }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize:'1.8rem' }}>🫶</span>
              <div>
                <p style={{ fontSize:'0.9rem', fontWeight:700, color:'white' }}>Soporte 24/7</p>
                <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.8)' }}>Estamos aquí para ti siempre</p>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl p-5 border" style={{ background:t.cardBg, borderColor:t.cardBorder }}>
            <h3 style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'12px' }}>Actividad reciente</h3>
            <div className="space-y-3">
              {[
                { text:'Nuevo parche "Cálculo III"', emoji:'🎪', time:'2d' },
                { text:'Conseguiste Mona Coder',      emoji:'✨', time:'3d' },
                { text:'Inscrito al Hackathon ECI',   emoji:'💻', time:'5d' },
                { text:'Nivel 12 — Explorador',       emoji:'⚡', time:'1sem' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background:'rgba(108,99,255,0.1)' }}>{a.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize:'0.78rem', color: t.text }} className="truncate">{a.text}</p>
                    <p style={{ fontSize:'0.65rem', color: t.textMuted }}>Hace {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
