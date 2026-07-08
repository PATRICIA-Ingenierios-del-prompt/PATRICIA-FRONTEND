import { useState, useRef } from 'react';
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Interes {
  id: string;
  label: string;
  catId: string;
}

export interface Categoria {
  id: string;
  emoji: string;
  label: string;
  intereses: Interes[];
}

export const CATEGORIAS: Categoria[] = [
  {
    id: 'musica', emoji: '🎵', label: 'Música',
    intereses: [
      { id: 'Conciertos en vivo',  catId: 'musica', label: 'Conciertos en vivo' },
      { id: 'DJ & Electrónica',    catId: 'musica', label: 'DJ & Electrónica' },
      { id: 'Rock & Metal',        catId: 'musica', label: 'Rock & Metal' },
      { id: 'Reggaeton & Trap',    catId: 'musica', label: 'Reggaeton & Trap' },
      { id: 'Pop & Indie',         catId: 'musica', label: 'Pop & Indie' },
      { id: 'Clásica & Jazz',      catId: 'musica', label: 'Clásica & Jazz' },
    ],
  },
  {
    id: 'estudio', emoji: '📚', label: 'Estudio',
    intereses: [
      { id: 'Grupos de estudio',   catId: 'estudio', label: 'Grupos de estudio' },
      { id: 'Tutorías',            catId: 'estudio', label: 'Tutorías' },
      { id: 'Hackathones',         catId: 'estudio', label: 'Hackathones' },
      { id: 'Talleres técnicos',   catId: 'estudio', label: 'Talleres técnicos' },
      { id: 'Presentaciones',      catId: 'estudio', label: 'Presentaciones' },
      { id: 'Biblioteca nocturna', catId: 'estudio', label: 'Biblioteca nocturna' },
    ],
  },
  {
    id: 'deporte', emoji: '🏃', label: 'Deporte',
    intereses: [
      { id: 'Básquetbol',            catId: 'deporte', label: 'Básquetbol' },
      { id: 'Tenis / Tenis de mesa', catId: 'deporte', label: 'Tenis / Tenis de mesa' },
      { id: 'Gimnasio',              catId: 'deporte', label: 'Gimnasio' },
      { id: 'Fútbol & Deportes',     catId: 'deporte', label: 'Fútbol & Deportes' },
      { id: 'Yoga & Meditación',     catId: 'deporte', label: 'Yoga & Meditación' },
      { id: 'Ciclismo',              catId: 'deporte', label: 'Ciclismo' },
      { id: 'Parques & Naturaleza',  catId: 'deporte', label: 'Parques & Naturaleza' },
      { id: 'Actividades extremas',  catId: 'deporte', label: 'Actividades extremas' },
    ],
  },
  {
    id: 'gastro', emoji: '🍽️', label: 'Gastronomía',
    intereses: [
      { id: 'Comer en campus',        catId: 'gastro', label: 'Comer en campus' },
      { id: 'Food trucks',            catId: 'gastro', label: 'Food trucks' },
      { id: 'Cafeterías ocultas',     catId: 'gastro', label: 'Cafeterías ocultas' },
      { id: 'Comida internacional',   catId: 'gastro', label: 'Comida internacional' },
      { id: 'Picnics & Asados',       catId: 'gastro', label: 'Picnics & Asados' },
      { id: 'Intercambio de recetas', catId: 'gastro', label: 'Intercambio de recetas' },
    ],
  },
  {
    id: 'tech', emoji: '🎮', label: 'Tech & Gaming',
    intereses: [
      { id: 'Videojuegos competitivos', catId: 'tech', label: 'Videojuegos competitivos' },
      { id: 'Hackathones de código',    catId: 'tech', label: 'Hackathones de código' },
      { id: 'Desarrollo web/app',       catId: 'tech', label: 'Desarrollo web/app' },
      { id: 'IA & Machine Learning',    catId: 'tech', label: 'IA & Machine Learning' },
      { id: 'Streaming & Content',      catId: 'tech', label: 'Streaming & Content' },
      { id: 'Robótica',                 catId: 'tech', label: 'Robótica' },
    ],
  },
  {
    id: 'arte', emoji: '🎨', label: 'Arte & Cultura',
    intereses: [
      { id: 'Exposiciones',       catId: 'arte', label: 'Exposiciones' },
      { id: 'Cine & Películas',   catId: 'arte', label: 'Cine & Películas' },
      { id: 'Teatro & Danza',     catId: 'arte', label: 'Teatro & Danza' },
      { id: 'Fotografía',         catId: 'arte', label: 'Fotografía' },
      { id: 'Murales & Street art',catId: 'arte', label: 'Murales & Street art' },
      { id: 'Literatura & Poesía', catId: 'arte', label: 'Literatura & Poesía' },
    ],
  },
  {
    id: 'competencias', emoji: '🏆', label: 'Competencias',
    intereses: [
      { id: 'Competencias deportivas',        catId: 'competencias', label: 'Competencias deportivas' },
      { id: 'Concursos académicos',           catId: 'competencias', label: 'Concursos académicos' },
      { id: 'Torneos de juegos',              catId: 'competencias', label: 'Torneos de juegos' },
      { id: 'Desafíos de innovación',         catId: 'competencias', label: 'Desafíos de innovación' },
      { id: 'Maratones de programación',      catId: 'competencias', label: 'Maratones de programación' },
      { id: 'Competencias de emprendimiento', catId: 'competencias', label: 'Competencias de emprendimiento' },
    ],
  },
  {
    id: 'profesional', emoji: '💼', label: 'Profesional',
    intereses: [
      { id: 'Charlas de empresas',  catId: 'profesional', label: 'Charlas de empresas' },
      { id: 'Ferias de empleo',     catId: 'profesional', label: 'Ferias de empleo' },
      { id: 'Mentorías',            catId: 'profesional', label: 'Mentorías' },
      { id: 'Grupos profesionales', catId: 'profesional', label: 'Grupos profesionales' },
      { id: 'Conferencias',         catId: 'profesional', label: 'Conferencias' },
      { id: 'Networking events',    catId: 'profesional', label: 'Networking events' },
    ],
  },
  {
    id: 'sostenibilidad', emoji: '♻️', label: 'Sostenibilidad',
    intereses: [
      { id: 'Reciclaje & Ecología',    catId: 'sostenibilidad', label: 'Reciclaje & Ecología' },
      { id: 'Voluntariado',            catId: 'sostenibilidad', label: 'Voluntariado' },
      { id: 'Proyectos sociales',      catId: 'sostenibilidad', label: 'Proyectos sociales' },
      { id: 'Derechos humanos',        catId: 'sostenibilidad', label: 'Derechos humanos' },
      { id: 'Comunidad LGBTQ+',        catId: 'sostenibilidad', label: 'Comunidad LGBTQ+' },
      { id: 'Iniciativas campesinas',  catId: 'sostenibilidad', label: 'Iniciativas campesinas' },
    ],
  },
  {
    id: 'viajes', emoji: '🌍', label: 'Viajes',
    intereses: [
      { id: 'Road trips',              catId: 'viajes', label: 'Road trips' },
      { id: 'Viajes internacionales',  catId: 'viajes', label: 'Viajes internacionales' },
      { id: 'Intercambios académicos', catId: 'viajes', label: 'Intercambios académicos' },
      { id: 'Backpacking',             catId: 'viajes', label: 'Backpacking' },
      { id: 'Viajes a pueblos',        catId: 'viajes', label: 'Viajes a pueblos' },
      { id: 'Experiencias rurales',    catId: 'viajes', label: 'Experiencias rurales' },
    ],
  },
  {
    id: 'bienestar', emoji: '💚', label: 'Bienestar',
    intereses: [
      { id: 'Meditación',              catId: 'bienestar', label: 'Meditación' },
      { id: 'Terapia & Apoyo',         catId: 'bienestar', label: 'Terapia & Apoyo' },
      { id: 'Nutrición',               catId: 'bienestar', label: 'Nutrición' },
      { id: 'Sueño & Descanso',        catId: 'bienestar', label: 'Sueño & Descanso' },
      { id: 'Mindfulness',             catId: 'bienestar', label: 'Mindfulness' },
      { id: 'Comunidad de bienestar',  catId: 'bienestar', label: 'Comunidad de bienestar' },
    ],
  },
];

export const EMOJI_MAP: Record<string, string> = Object.fromEntries(
  CATEGORIAS.flatMap(c => c.intereses.map(i => [i.id, c.emoji]))
);

const MIN = 3;
const MAX = 12;

interface InteresesPickerProps {
  selected: string[];          // array of interes IDs
  onChange: (ids: string[]) => void;
  minSelect?: number;
  maxSelect?: number;
  darkMode?: boolean;
  compact?: boolean;           // compact mode for profile modal
}

export function InteresesPicker({
  selected, onChange,
  minSelect = MIN, maxSelect = MAX,
  darkMode = true, compact = false,
}: InteresesPickerProps) {
  const [activeTab, setActiveTab] = useState(CATEGORIAS[0].id);
  const [shakeCount, setShakeCount] = useState(0);

  const activeCat = CATEGORIAS.find(c => c.id === activeTab)!;
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (dir: 'left' | 'right') => {
    if (tabsRef.current) tabsRef.current.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  };;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id));
    } else {
      if (selected.length >= maxSelect) {
        // Shake: trigger animation by incrementing counter
        setShakeCount(s => s + 1);
        return;
      }
      onChange([...selected, id]);
    }
  };

  const remove = (id: string) => onChange(selected.filter(x => x !== id));

  const pct = Math.min((selected.length / maxSelect) * 100, 100);
  const valid = selected.length >= minSelect && selected.length <= maxSelect;
  const atMax = selected.length >= maxSelect;

  // Find label for a selected interest id
  const findLabel = (id: string) => {
    for (const cat of CATEGORIAS) {
      const int = cat.intereses.find(i => i.id === id);
      if (int) return { label: int.label, emoji: cat.emoji };
    }
    return { label: id, emoji: '🏷️' };
  };

  const bg    = darkMode ? 'rgba(26,24,41,0.95)' : '#FFFFFF';
  const text  = darkMode ? '#F0EEFF' : '#1A1829';
  const muted = darkMode ? '#8B85B0' : '#6B6490';
  const tabBg = darkMode ? 'rgba(37,31,61,0.8)' : '#F5F3FF';
  const checkBg = darkMode ? 'rgba(108,99,255,0.08)' : '#F5F3FF';

  return (
    <div className="flex flex-col gap-4">
      {/* Counter bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            key={selected.length}
            initial={{ scale: 1.3, color: '#7FE7C4' }}
            animate={{ scale: 1, color: text }}
            style={{ fontWeight: 800, fontSize: '1.1rem' }}>
            {selected.length}
          </motion.span>
          <span style={{ color: muted, fontSize: '0.88rem' }}>/ {maxSelect} seleccionados</span>
          {selected.length < minSelect && (
            <span style={{ fontSize: '0.75rem', color: '#FF4D6A' }}>
              (mínimo {minSelect})
            </span>
          )}
          {atMax && (
            <motion.span
              key={shakeCount}
              animate={shakeCount > 0 ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.35 }}
              style={{ fontSize: '0.75rem', color: '#FFB347' }}>
              ✋ máximo alcanzado
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: muted }}>
          <span>{minSelect} mín · {maxSelect} máx</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: darkMode ? 'rgba(108,99,255,0.15)' : '#E0DAFF' }}>
        <motion.div animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 200 }}
          className="h-full rounded-full"
          style={{ background: valid ? 'linear-gradient(90deg,#6C63FF,#7FE7C4)' : selected.length < minSelect ? '#FF4D6A' : '#FFB347' }} />
      </div>

      {/* Category tabs — horizontal scroll with arrow navigation */}
      <div className="relative">
        {/* Left arrow */}
        <button onClick={() => scrollTabs('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
          style={{ background: '#6C63FF', color: 'white' }}>
          <ChevronLeft size={14} />
        </button>
        <div ref={tabsRef} className="flex gap-1.5 overflow-x-auto pb-1 px-9" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIAS.map(cat => {
          const catSelected = cat.intereses.filter(i => selected.includes(i.id)).length;
          return (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={{
                background: activeTab === cat.id ? '#6C63FF' : tabBg,
                color: activeTab === cat.id ? 'white' : muted,
                fontWeight: activeTab === cat.id ? 600 : 400,
                border: `1.5px solid ${activeTab === cat.id ? '#6C63FF' : 'transparent'}`,
              }}>
              <span>{cat.emoji}</span>
              <span style={{ fontSize: '0.78rem' }}>{cat.label}</span>
              {catSelected > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: activeTab === cat.id ? 'rgba(255,255,255,0.3)' : '#6C63FF', fontSize: '0.6rem', fontWeight: 700, color: 'white' }}>
                  {catSelected}
                </span>
              )}
            </button>
          );
        })}
        </div>{/* end tabs scroll */}
        {/* Right arrow */}
        <button onClick={() => scrollTabs('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
          style={{ background: '#6C63FF', color: 'white' }}>
          <ChevronRight size={14} />
        </button>
      </div>{/* end relative */}

      {/* Interests checkboxes */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-2 gap-2">
          {activeCat.intereses.map(int => {
            const isSel = selected.includes(int.id);
            const isDisabled = !isSel && atMax;
            return (
              <motion.button key={int.id}
                onClick={() => toggle(int.id)}
                whileHover={!isDisabled ? { scale: 1.02 } : {}}
                whileTap={!isDisabled ? { scale: 0.97 } : {}}
                disabled={isDisabled}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background: isSel ? 'rgba(108,99,255,0.15)' : checkBg,
                  border: `1.5px solid ${isSel ? '#6C63FF' : darkMode ? 'rgba(108,99,255,0.15)' : '#E0DAFF'}`,
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}>
                {/* Checkbox */}
                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ borderColor: isSel ? '#6C63FF' : darkMode ? 'rgba(108,99,255,0.4)' : '#C0B8F0', background: isSel ? '#6C63FF' : 'transparent' }}>
                  <AnimatePresence>
                    {isSel && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400 }}>
                        <Check size={11} color="white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span style={{ fontSize: '0.82rem', color: isSel ? (darkMode ? '#E0E0FF' : '#1A1829') : muted, fontWeight: isSel ? 600 : 400 }}>
                  {int.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div>
          <p style={{ fontSize: '0.75rem', color: muted, marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tus intereses seleccionados
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selected.map(id => {
                const { label, emoji } = findLabel(id);
                return (
                  <motion.div key={id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full"
                    style={{ background: '#6C63FF', border: '1px solid rgba(108,99,255,0.5)' }}>
                    <span style={{ fontSize: '0.72rem' }}>{emoji}</span>
                    <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>{label}</span>
                    <button onClick={() => remove(id)}
                      className="w-4 h-4 rounded-full flex items-center justify-center transition-all hover:bg-white/20 ml-0.5">
                      <X size={9} color="white" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
