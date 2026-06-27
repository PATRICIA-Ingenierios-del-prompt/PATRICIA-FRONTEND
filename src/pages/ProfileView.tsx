import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Camera, X } from 'lucide-react';
import { InteresesPicker, CATEGORIAS } from '../components/InteresesPicker';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';

const DEFAULT_INTEREST_IDS = ['ia', 'webdev', 'grupos-estudio', 'videojuegos', 'foto', 'cine', 'tutorias', 'hackathones'];

const DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const SLOTS = [
  { start: '7:00 AM',  end: '8:30 AM'  },
  { start: '9:00 AM',  end: '10:30 AM' },
  { start: '10:30 AM', end: '12:00 PM' },
  { start: '12:00 PM', end: '1:30 PM'  },
  { start: '1:30 PM',  end: '3:00 PM'  },
  { start: '3:00 PM',  end: '4:30 PM'  },
  { start: '4:30 PM',  end: '6:00 PM'  },
  { start: '6:00 PM',  end: '7:30 PM'  },
];

// Default pre-selected slots  (key = "dayIndex-slotIndex")
const DEFAULT_SCHEDULE = new Set(['0-0', '0-1', '2-2', '2-3', '4-1', '4-2']);

const CARRERAS = [
  'Ingeniería Civil', 'Ingeniería Eléctrica', 'Ingeniería de Sistemas',
  'Ingeniería Industrial', 'Ingeniería Electrónica', 'Economía',
  'Administración de Empresas', 'Matemáticas', 'Ingeniería Mecánica',
  'Ingeniería Biomédica', 'Ingeniería Ambiental', 'Ingeniería Estadística',
  'Ingeniería de Inteligencia Artificial', 'Ingeniería de Ciberseguridad', 'Ingeniería en Biotecnología',
];
const SEMESTRES = ['1','2','3','4','5','6','7','8','9','10'];

function EditModal({ onClose, intereses, onSaveIntereses }: { onClose: () => void; intereses: string[]; onSaveIntereses: (ids: string[]) => void }) {
  const t = useTheme();
  const [form, setForm] = useState({ nombre:'Juan Carlos Leal Cruz', bio:'Apasionado por la IA y el desarrollo de software 🤖 Busco parches de estudio y amigos para explorar Bogotá.', carrera:'Ingeniería de Sistemas', segundaCarrera:'', semestre:'7', genero:'N/D', privacidad:'publico' });
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
          {tab === 'datos' && <>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#6C63FF,#7FE7C4)', fontSize:'1.1rem', fontWeight:800, color:'white' }}>JL</div>
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
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm" style={{ background: t.inputBg, color: t.textMuted }}>Cancelar</button>
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background:'linear-gradient(135deg,#6C63FF,#8B7FFF)', color:'white' }}>
                Guardar cambios
              </button>
            </div>
          </>}
          {tab === 'intereses' && (
            <div className="space-y-5">
              <InteresesPicker selected={localIntereses} onChange={setLocalIntereses} minSelect={1} maxSelect={12} darkMode={t.darkMode} />
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm" style={{ background: t.inputBg, color: t.textMuted }}>Cancelar</button>
                <button onClick={() => { onSaveIntereses(localIntereses); onClose(); }}
                  disabled={localIntereses.length < 1}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#6C63FF', color: 'white' }}>
                  Guardar ✓
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
  const [interesIds, setInteresIds] = useState<string[]>(DEFAULT_INTEREST_IDS);
  const [schedule, setSchedule] = useState<Set<string>>(new Set(DEFAULT_SCHEDULE));

  const toggleSlot = (key: string) =>
    setSchedule(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  return (
    <div className="h-full overflow-y-auto pb-10">
      {showEdit && createPortal(
        <AnimatePresence><EditModal onClose={() => setShowEdit(false)} intereses={interesIds} onSaveIntereses={setInteresIds} /></AnimatePresence>,
        document.body
      )}

      {/* ── HERO ── */}
      <div className="rounded-3xl border mb-8 overflow-hidden"
        style={{ background: t.darkMode ? 'linear-gradient(160deg,#1A1829,#221E38)' : t.cardBg, borderColor: t.cardBorder }}>

        {/* Banner */}
        <div className="h-36 relative" style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#A78BFA 55%,#7FE7C4 100%)' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.35) 100%)' }} />
        </div>

        <div className="px-8 pb-8">
          {/* Avatar + edit */}
          <div className="flex items-end justify-between -mt-14 mb-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full flex items-center justify-center border-4"
                style={{ background:'linear-gradient(135deg,#6C63FF,#7FE7C4)', borderColor: t.darkMode ? '#1A1829' : '#fff', fontSize:'2.2rem', fontWeight:900, color:'white' }}>
                JL
              </div>
              <button onClick={() => setShowEdit(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background:'#6C63FF', boxShadow:'0 2px 8px rgba(108,99,255,0.5)' }}>
                <Camera size={13} color="white" />
              </button>
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full border-2"
                style={{ background:'#7FE7C4', borderColor: t.darkMode ? '#1A1829' : '#fff' }} />
            </div>

            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-90 mb-1"
              style={{ background:'rgba(108,99,255,0.12)', color:'#6C63FF', border:'1px solid rgba(108,99,255,0.25)' }}>
              <Edit2 size={14} /> Editar perfil
            </button>
          </div>

          {/* Name + program */}
          <h2 style={{ fontWeight:900, fontSize:'1.6rem', color:t.text, marginBottom:'4px', lineHeight:1.1 }}>
            Juan Carlos Leal Cruz
          </h2>
          <p style={{ fontSize:'0.9rem', color:t.textMuted, marginBottom:'14px' }}>
            Ing. de Sistemas · 7mo semestre · ECI
          </p>

          {/* Bio */}
          <p style={{ fontSize:'0.92rem', color:t.textSub, lineHeight:1.75, marginBottom:'24px', maxWidth:'560px' }}>
            Apasionado por la IA y el desarrollo de software 🤖. Busco parches de estudio y amigos para explorar Bogotá. Miembro activo del IEEE Student Branch.
          </p>

          {/* Stats */}
          <div className="flex gap-7">
            {[
              { label:'Conexiones', value:'234', color:'#6C63FF' },
              { label:'Seguidores', value:'189', color:'#FF6B9D' },
              { label:'Parches',    value:'7',   color:'#7FE7C4' },
              { label:'Disponible', value:`${schedule.size}h`, color:'#FFB347' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontWeight:900, fontSize:'1.3rem', color:s.color, lineHeight:1 }}>{s.value}</p>
                <p style={{ fontSize:'0.72rem', color:t.textMuted, marginTop:'4px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT — 2-col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — narrower sidebar */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sobre mí */}
          <div className="rounded-2xl border p-6" style={{ background:t.cardBg, borderColor:t.cardBorder }}>
            <h3 style={{ fontWeight:700, fontSize:'1rem', color:t.text, marginBottom:'16px' }}>Sobre mí</h3>
            <div className="space-y-3">
              {[
                { emoji:'🎓', label:'Ingeniería de Sistemas' },
                { emoji:'📚', label:'7mo semestre' },
                { emoji:'📍', label:'Escuela Colombiana de Ingeniería' },
                { emoji:'📅', label:'Miembro desde 2022' },
                { emoji:'🔗', label:'IEEE Student Branch ECI' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span style={{ fontSize:'1rem', lineHeight:1 }}>{item.emoji}</span>
                  <span style={{ fontSize:'0.87rem', color:t.textSub }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Intereses */}
          <div className="rounded-2xl border p-6" style={{ background:t.cardBg, borderColor:t.cardBorder }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight:700, fontSize:'1rem', color:t.text }}>Intereses</h3>
              <button onClick={() => setShowEdit(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium hover:opacity-80 transition-all"
                style={{ background:t.inputBg, color:'#6C63FF', border:'1px solid rgba(108,99,255,0.2)' }}>
                ✏️ Editar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {interesIds.map(id => {
                  let label = id; let emoji = '🏷️';
                  for (const cat of CATEGORIAS) {
                    const int = cat.intereses.find(i => i.id === id);
                    if (int) { label = int.label; emoji = cat.emoji; break; }
                  }
                  return (
                    <motion.span key={id}
                      initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.85 }}
                      transition={{ type:'spring', stiffness:300 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setShowEdit(true)}
                      style={{ background:'rgba(108,99,255,0.1)', color:'#8B7FFF', border:'1px solid rgba(108,99,255,0.2)' }}>
                      <span style={{ fontSize:'0.78rem' }}>{emoji}</span>
                      <span style={{ fontSize:'0.8rem', fontWeight:500 }}>{label}</span>
                    </motion.span>
                  );
                })}
              </AnimatePresence>
              {interesIds.length === 0 && (
                <button onClick={() => setShowEdit(true)}
                  className="px-4 py-2 rounded-xl text-sm border-dashed border-2 hover:opacity-70 transition-all"
                  style={{ color:t.textMuted, borderColor:'rgba(108,99,255,0.3)' }}>
                  + Añadir intereses
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right — schedule */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border overflow-hidden" style={{ background:t.cardBg, borderColor:t.cardBorder }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:t.divider }}>
              <div>
                <h3 style={{ fontWeight:700, fontSize:'1rem', color:t.text }}>Disponibilidad semanal</h3>
                <p style={{ fontSize:'0.72rem', color:t.textMuted, marginTop:'2px' }}>Toca una franja para marcarla como disponible</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background:'rgba(127,231,196,0.12)', color:'#7FE7C4', border:'1px solid rgba(127,231,196,0.25)' }}>
                {schedule.size} franjas
              </span>
            </div>

            <div className="p-4">
              {/* Day headers */}
              <div className="grid mb-1" style={{ gridTemplateColumns:'64px repeat(6, 1fr)', gap:'4px' }}>
                <div />
                {DAYS.map(d => (
                  <div key={d} className="text-center py-2">
                    <span style={{ fontSize:'0.72rem', fontWeight:700, color:t.textMuted, letterSpacing:'0.06em' }}>{d}</span>
                  </div>
                ))}
              </div>

              {/* Time rows */}
              <div className="space-y-1">
                {SLOTS.map((slot, si) => (
                  <div key={si} className="grid items-center" style={{ gridTemplateColumns:'64px repeat(6, 1fr)', gap:'4px' }}>
                    {/* Time label */}
                    <div className="pr-2 text-right">
                      <p style={{ fontSize:'0.6rem', color:t.textMuted, lineHeight:1.3 }}>{slot.start}</p>
                      <p style={{ fontSize:'0.6rem', color:t.textMuted, lineHeight:1.3, opacity:0.6 }}>{slot.end}</p>
                    </div>

                    {/* Day cells */}
                    {DAYS.map((_, di) => {
                      const key = `${di}-${si}`;
                      const active = schedule.has(key);
                      return (
                        <motion.button
                          key={di}
                          onClick={() => toggleSlot(key)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className="w-full rounded-xl flex items-center justify-center transition-all"
                          style={{
                            height: 44,
                            background: active
                              ? 'linear-gradient(135deg,#6C63FF,#A78BFA)'
                              : t.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                            border: active
                              ? '1.5px solid rgba(108,99,255,0.5)'
                              : `1.5px solid ${t.darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
                            boxShadow: active ? '0 4px 14px rgba(108,99,255,0.3)' : 'none',
                            cursor: 'pointer',
                          }}>
                          {active && (
                            <motion.div
                              initial={{ scale:0 }} animate={{ scale:1 }}
                              className="w-2 h-2 rounded-full bg-white"
                              style={{ opacity:0.9 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor:t.divider }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background:'linear-gradient(135deg,#6C63FF,#A78BFA)' }} />
                  <span style={{ fontSize:'0.72rem', color:t.textMuted }}>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border"
                    style={{ background: t.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: t.divider }} />
                  <span style={{ fontSize:'0.72rem', color:t.textMuted }}>No disponible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
