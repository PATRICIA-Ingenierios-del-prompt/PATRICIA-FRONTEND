import { useState } from 'react';
import { Eye, BookOpen, Type, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Follows the WCAG & British Dyslexia Association guidelines:
// - Lexend / Atkinson Hyperlegible fonts (loaded in fonts.css)
// - +2px body size, +0.06em letter-spacing, 1.7 line-height, left-align
// Applied by toggling .dyslexia-mode class on <html>

export type DyslexiaMode = false | true;

export function applyDyslexiaMode(enabled: boolean) {
  if (enabled) {
    document.documentElement.classList.add('dyslexia-mode');
  } else {
    document.documentElement.classList.remove('dyslexia-mode');
  }
}

const DYSLEXIA_TOKENS = [
  { label: 'Fuente',          standard: 'Outfit / Inter',          dyslexia: 'Lexend / Atkinson Hyperlegible' },
  { label: 'Tamaño cuerpo',   standard: '16px',                    dyslexia: '18px (+2px)' },
  { label: 'Letter spacing',  standard: 'normal',                  dyslexia: '+0.06em (~+1px)' },
  { label: 'Line height',     standard: '1.5',                     dyslexia: '1.7' },
  { label: 'Word spacing',    standard: 'normal',                  dyslexia: '+0.2em' },
  { label: 'Alineación',      standard: 'left / center',           dyslexia: 'left (siempre)' },
  { label: 'Peso',            standard: '400-700',                 dyslexia: '400-600 (no extremos)' },
];

// Based on the Brettel et al. (1997) and Viénot et al. (1999) models
export type VisionMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export const VISION_MODES: { id: VisionMode; label: string; desc: string; icon: string; matrix: string }[] = [
  {
    id: 'normal',
    label: 'Visión Normal',
    desc: 'Colores tal como fueron diseñados',
    icon: '👁️',
    matrix: '',
  },
  {
    id: 'protanopia',
    label: 'Protanopia',
    desc: 'Débil percepción del rojo (1% de hombres)',
    icon: '🔴',
    // feColorMatrix for protanopia simulation
    matrix: '0.567 0.433 0 0 0   0.558 0.442 0 0 0   0 0.242 0.758 0 0   0 0 0 1 0',
  },
  {
    id: 'deuteranopia',
    label: 'Deuteranopia',
    desc: 'Débil percepción del verde (5% de hombres)',
    icon: '🟢',
    matrix: '0.625 0.375 0 0 0   0.7 0.3 0 0 0   0 0.3 0.7 0 0   0 0 0 1 0',
  },
  {
    id: 'tritanopia',
    label: 'Tritanopia',
    desc: 'Débil percepción del azul (0.003% de población)',
    icon: '🔵',
    matrix: '0.95 0.05 0 0 0   0 0.433 0.567 0 0   0 0.475 0.525 0 0   0 0 0 1 0',
  },
];

// SVG filter definitions — injected into DOM once
export function ColorBlindFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
      <defs>
        {VISION_MODES.filter(m => m.id !== 'normal').map(mode => (
          <filter key={mode.id} id={`cb-${mode.id}`} colorInterpolationFilters="linearRGB">
            <feColorMatrix type="matrix" values={mode.matrix} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

// Hook to get the CSS filter string for the active mode
export function getVisionFilter(mode: VisionMode): string {
  if (mode === 'normal') return 'none';
  return `url(#cb-${mode})`;
}

interface VisionSelectorProps {
  mode: VisionMode;
  setMode: (m: VisionMode) => void;
  dyslexia: boolean;
  setDyslexia: (v: boolean) => void;
  collapsed?: boolean;
}

export function VisionSelector({ mode, setMode, dyslexia, setDyslexia, collapsed }: VisionSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = VISION_MODES.find(m => m.id === mode)!;
  const anyActive = mode !== 'normal' || dyslexia;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Configuración de accesibilidad"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:opacity-80"
        style={{
          background: anyActive ? 'rgba(127,231,196,0.15)' : 'rgba(108,99,255,0.08)',
          borderColor: anyActive ? 'rgba(127,231,196,0.4)' : 'rgba(108,99,255,0.2)',
          color: anyActive ? '#7FE7C4' : '#8B85B0',
        }}>
        <Eye size={15} style={{ flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {anyActive ? 'Accesible' : 'Accesibilidad'}
          </span>
        )}
        {anyActive && (
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#7FE7C4' }} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 rounded-2xl border overflow-hidden z-50"
            style={{ background: 'var(--p-card)', borderColor: 'rgba(108,99,255,0.3)', width: 280, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>

            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(108,99,255,0.15)' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--p-text)' }}>Ajustes de Accesibilidad</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--p-muted)', marginTop: '2px' }}>Daltonismo + Dislexia — independientes o combinados</p>
            </div>

            {/* Vision / Color section */}
            <div className="px-3 pt-3 pb-1">
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6C63FF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Daltonismo
              </p>
              {VISION_MODES.map(vm => (
                <button key={vm.id}
                  onClick={() => { setMode(vm.id); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all hover:bg-white/5 mb-0.5"
                  style={{ background: mode === vm.id ? 'rgba(108,99,255,0.15)' : 'transparent' }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{vm.icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: mode === vm.id ? 700 : 400, color: mode === vm.id ? '#6C63FF' : '#C0BAE0', flex: 1 }}>
                    {vm.label}
                  </span>
                  {mode === vm.id && <div className="w-2 h-2 rounded-full" style={{ background: '#6C63FF' }} />}
                </button>
              ))}
            </div>

            <div className="mx-3 h-px my-2" style={{ background: 'rgba(108,99,255,0.15)' }} />

            {/* Dyslexia section */}
            <div className="px-3 pb-3">
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7FE7C4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Dislexia
              </p>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                style={{ background: dyslexia ? 'rgba(127,231,196,0.08)' : 'rgba(108,99,255,0.04)', borderColor: dyslexia ? 'rgba(127,231,196,0.3)' : 'rgba(108,99,255,0.15)' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: dyslexia ? 700 : 400, color: dyslexia ? '#7FE7C4' : '#C0BAE0' }}>
                    Modo lectura fácil
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--p-muted)', marginTop: '1px' }}>
                    Lexend · +2px · spacing · alineación
                  </p>
                </div>
                <button onClick={() => { setDyslexia(!dyslexia); applyDyslexiaMode(!dyslexia); }}
                  className="w-11 h-6 rounded-full relative flex-shrink-0 transition-all"
                  style={{ background: dyslexia ? '#7FE7C4' : 'rgba(108,99,255,0.25)' }}>
                  <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm"
                    style={{ left: dyslexia ? '24px' : '4px' }} />
                </button>
              </div>
              {dyslexia && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontSize: '0.65rem', color: '#7FE7C4', marginTop: '6px', lineHeight: 1.5, paddingLeft: '4px' }}>
                  ✓ Fuente Lexend activa · Espaciado aumentado · Todo alineado a la izquierda
                </motion.p>
              )}
            </div>

            {/* Color preview */}
            <div className="px-4 pb-3 border-t" style={{ borderColor: 'rgba(108,99,255,0.1)' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--p-muted)', margin: '8px 0 5px' }}>Tokens de color (vista previa):</p>
              <div className="flex gap-1.5">
                {['#6C63FF','#7FE7C4','#FF4D6A','#FFB347','#5BC8FF','#FF6B9D'].map(col => (
                  <div key={col} className="w-6 h-6 rounded-md border border-white/10 flex-shrink-0"
                    style={{ background: col, filter: mode !== 'normal' ? `url(#cb-${mode})` : 'none' }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AccessibilityPanelProps {
  mode: VisionMode;
  setMode: (m: VisionMode) => void;
  dyslexia: boolean;
  setDyslexia: (v: boolean) => void;
}

export function AccessibilityPanel({ mode, setMode, dyslexia, setDyslexia }: AccessibilityPanelProps) {
  const handleDyslexia = (val: boolean) => {
    setDyslexia(val);
    applyDyslexiaMode(val);
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--p-card)', borderColor: 'var(--p-divider)' }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(108,99,255,0.1)', background: 'rgba(108,99,255,0.05)' }}>
        <Eye size={16} style={{ color: '#6C63FF' }} />
        <span style={{ fontWeight: 700, color: '#6C63FF', fontSize: '0.9rem' }}>Accesibilidad</span>
        <span className="ml-auto px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(127,231,196,0.1)', color: '#7FE7C4' }}>
          WCAG AA · BDA
        </span>
      </div>

      <div className="p-4 space-y-5">

        {/* ── SECCIÓN 1: DALTONISMO ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(108,99,255,0.15)' }}>
              <Eye size={12} style={{ color: '#6C63FF' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#6C63FF' }}>Visión del color</p>
            <span style={{ fontSize: '0.65rem', color: 'var(--p-muted)' }}>Brettel et al. 1997</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--p-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
            Simula cómo personas con daltonismo perciben la interfaz.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {VISION_MODES.map(vm => (
              <button key={vm.id}
                onClick={() => setMode(vm.id)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all border"
                style={{
                  background: mode === vm.id ? 'rgba(108,99,255,0.15)' : 'rgba(108,99,255,0.04)',
                  borderColor: mode === vm.id ? '#6C63FF' : 'rgba(108,99,255,0.15)',
                }}>
                <span style={{ fontSize: '1.1rem' }}>{vm.icon}</span>
                <div className="min-w-0">
                  <p style={{ fontSize: '0.78rem', fontWeight: mode === vm.id ? 700 : 500, color: mode === vm.id ? '#6C63FF' : 'var(--p-text)' }}>
                    {vm.label}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--p-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                    {vm.desc}
                  </p>
                </div>
                {mode === vm.id && <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#6C63FF' }} />}
              </button>
            ))}
          </div>

          {/* Color token preview */}
          <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(108,99,255,0.1)' }}>
            {[
              { label: 'Primario',    col: '#6C63FF' },
              { label: 'Secundario',  col: '#7FE7C4' },
              { label: 'Error',       col: '#FF4D6A' },
              { label: 'Advertencia', col: '#FFB347' },
              { label: 'Info',        col: '#5BC8FF' },
            ].map(token => (
              <div key={token.label} className="flex items-center px-3 py-2 border-b last:border-0"
                style={{ borderColor: 'rgba(108,99,255,0.08)' }}>
                <div className="w-5 h-5 rounded-md mr-3 flex-shrink-0 border border-white/10"
                  style={{ background: token.col, filter: mode !== 'normal' ? `url(#cb-${mode})` : 'none' }} />
                <span style={{ fontSize: '0.76rem', flex: 1 }}>{token.label}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--p-muted)', fontFamily: 'monospace' }}>{token.col}</span>
              </div>
            ))}
          </div>

          {mode !== 'normal' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-2 px-3 py-2 rounded-xl border"
              style={{ background: 'rgba(108,99,255,0.08)', borderColor: 'rgba(108,99,255,0.2)' }}>
              <p style={{ fontSize: '0.72rem', color: '#6C63FF', fontWeight: 600 }}>
                ✓ {VISION_MODES.find(m => m.id === mode)?.label} activa
              </p>
            </motion.div>
          )}
        </div>

        <div className="h-px" style={{ background: 'rgba(108,99,255,0.12)' }} />

        {/* ── SECCIÓN 2: DISLEXIA ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(127,231,196,0.15)' }}>
              <BookOpen size={12} style={{ color: '#7FE7C4' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#7FE7C4' }}>Dislexia</p>
            <span style={{ fontSize: '0.65rem', color: 'var(--p-muted)' }}>BDA Guidelines</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--p-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
            Adapta tipografía para facilitar la lectura: fuente Lexend, mayor espaciado entre letras y líneas, alineación izquierda.
          </p>

          {/* Toggle principal */}
          <div className="flex items-center justify-between p-3 rounded-xl border mb-3"
            style={{ background: dyslexia ? 'rgba(127,231,196,0.08)' : 'rgba(108,99,255,0.04)', borderColor: dyslexia ? 'rgba(127,231,196,0.3)' : 'rgba(108,99,255,0.15)' }}>
            <div className="flex items-center gap-2.5">
              <Type size={16} style={{ color: dyslexia ? '#7FE7C4' : '#8B85B0' }} />
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: dyslexia ? 700 : 500, color: dyslexia ? '#7FE7C4' : 'var(--p-text)' }}>
                  Modo lectura fácil
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--p-muted)', marginTop: '1px' }}>
                  {dyslexia ? 'Lexend · +2px · +0.06em · interlineado 1.7' : 'Outfit / Inter estándar'}
                </p>
              </div>
            </div>
            <button onClick={() => handleDyslexia(!dyslexia)}
              className="w-11 h-6 rounded-full relative flex-shrink-0 transition-all duration-300"
              style={{ background: dyslexia ? '#7FE7C4' : 'rgba(108,99,255,0.3)' }}>
              <motion.div
                animate={{ left: dyslexia ? '24px' : '4px' }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm"
                style={{ position: 'absolute' }}
              />
            </button>
          </div>

          {/* Token comparison table */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(108,99,255,0.1)' }}>
            <div className="grid grid-cols-3 px-3 py-2 border-b" style={{ borderColor: 'rgba(108,99,255,0.1)', background: 'rgba(108,99,255,0.06)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Propiedad</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estándar</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7FE7C4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dislexia</span>
            </div>
            {DYSLEXIA_TOKENS.map((tok, i) => (
              <div key={tok.label} className="grid grid-cols-3 px-3 py-2 border-b last:border-0 items-center"
                style={{ borderColor: 'rgba(108,99,255,0.08)', background: dyslexia && i % 2 === 0 ? 'rgba(127,231,196,0.03)' : 'transparent' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--p-sub)' }}>{tok.label}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--p-muted)' }}>{tok.standard}</span>
                <span style={{ fontSize: '0.68rem', color: dyslexia ? '#7FE7C4' : '#8B85B0', fontWeight: dyslexia ? 600 : 400 }}>
                  {tok.dyslexia}
                </span>
              </div>
            ))}
          </div>

          {/* Text preview */}
          <div className="mt-3 p-3 rounded-xl border" style={{ background: 'rgba(108,99,255,0.04)', borderColor: 'rgba(108,99,255,0.12)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft size={12} style={{ color: 'var(--p-muted)' }} />
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Vista previa de texto
              </p>
            </div>
            <p style={{
              fontSize: dyslexia ? '1.05rem' : '0.88rem',
              fontFamily: dyslexia ? "'Lexend', 'Atkinson Hyperlegible', Arial, sans-serif" : "'Outfit', sans-serif",
              letterSpacing: dyslexia ? '0.06em' : 'normal',
              lineHeight: dyslexia ? 1.7 : 1.5,
              wordSpacing: dyslexia ? '0.2em' : 'normal',
              color: 'var(--p-sub)',
              textAlign: 'left',
              transition: 'all 0.4s ease',
            }}>
              "La comunidad U • link conecta estudiantes de la ECI en parches de estudio, eventos y actividades."
            </p>
          </div>

          {dyslexia && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-2 px-3 py-2 rounded-xl border"
              style={{ background: 'rgba(127,231,196,0.06)', borderColor: 'rgba(127,231,196,0.2)' }}>
              <p style={{ fontSize: '0.72rem', color: '#7FE7C4', fontWeight: 600, marginBottom: '2px' }}>✓ Modo dislexia activo</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--p-muted)', lineHeight: 1.5 }}>
                Fuente Lexend · Tamaño +2px · Letter-spacing +0.06em · Interlineado 1.7 · Alineación izquierda
              </p>
            </motion.div>
          )}
        </div>

        {/* Combinado info */}
        {mode !== 'normal' && dyslexia && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-3 rounded-xl border"
            style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(127,231,196,0.06))', borderColor: 'rgba(108,99,255,0.25)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--p-text)', marginBottom: '3px' }}>
              Modos combinados activos
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--p-muted)', lineHeight: 1.5 }}>
              {VISION_MODES.find(m => m.id === mode)?.label} + Lectura fácil — ambos modos funcionan de forma independiente y simultánea.
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
}
