import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';
import { useParquesGame, FrontendPiece } from '../hooks/useParquesGame';

import monoJuegos     from '../assets/monoGamerN.png';
import monoArte       from '../assets/monoArteN.png';
import monoCientifico from '../assets/monoCientificoN.png';
import monoDj         from '../assets/monoDJN.png';

const P_COLORS = ['#7c6cff', '#f25fb0', '#2bd4bd', '#f4b13e'] as const;
const P_MONKEYS = [monoJuegos, monoArte, monoCientifico, monoDj];

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
};

const inArm = (r: number, c: number) => {
  if (c >= 8 && c <= 10 && r <= 7) return 'top';
  if (c >= 8 && c <= 10 && r >= 11) return 'bottom';
  if (r >= 8 && r <= 10 && c <= 7) return 'left';
  if (r >= 8 && r <= 10 && c >= 11) return 'right';
  return null;
};

const starts: Record<string, string> = {
  '1,8': '#7c6cff',
  '8,17': '#f25fb0',
  '17,8': '#f4b13e',
  '10,1': '#2bd4bd'
};

const safes = new Set(['5,8', '3,10', '8,13', '10,15', '13,10', '15,8', '10,5', '8,3']);

const arrowDir: Record<string, 'down' | 'up' | 'right' | 'left'> = {
  '7,9': 'down',
  '11,9': 'up',
  '9,7': 'right',
  '9,11': 'left'
};

// 68-cell clockwise track (19x19 cross perimeter)
const TRACK: [number, number][] = [
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7],
  [7, 8], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 9],
  [0, 10], [1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10],
  [8, 11], [8, 12], [8, 13], [8, 14], [8, 15], [8, 16], [8, 17], [8, 18],
  [9, 18],
  [10, 18], [10, 17], [10, 16], [10, 15], [10, 14], [10, 13], [10, 12], [10, 11],
  [11, 10], [12, 10], [13, 10], [14, 10], [15, 10], [16, 10], [17, 10], [18, 10],
  [18, 9],
  [18, 8], [17, 8], [16, 8], [15, 8], [14, 8], [13, 8], [12, 8], [11, 8],
  [10, 7], [10, 6], [10, 5], [10, 4], [10, 3], [10, 2], [10, 1], [10, 0],
  [9, 0]
];

// Start indices in the TRACK array for each player
const START_POS = [14, 31, 65, 52] as const;

// Dice faces
const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function DiceFace({ v, rolling, color, isDark }: { v: number; rolling: boolean; color: string; isDark: boolean }) {
  return (
    <motion.div
      animate={rolling ? { rotate: [0, 120, 240, 360], scale: [1, 1.15, 0.9, 1] } : {}}
      transition={{ duration: 0.45, repeat: rolling ? Infinity : 0 }}
      className="rounded-xl border-2 flex items-center justify-center"
      style={{
        width: 50,
        height: 50,
        background: isDark ? 'rgba(30, 28, 48, 0.95)' : '#FAFAFA',
        borderColor: color,
        boxShadow: isDark ? `0 0 12px ${color}60` : `0 2px 12px ${color}35`
      }}>
      <svg width="38" height="38" viewBox="0 0 100 100">
        {(DOTS[v] || []).map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={9} fill={color} />)}
      </svg>
    </motion.div>
  );
}

export function ParquesBoard() {
  const themeColors = useTheme();
  const isDark = themeColors.darkMode;
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const {
    pieces,
    currentPlayer,
    myPlayerIndex,
    dice,
    rolling,
    hasDiced,
    isDouble,
    diceSum,
    winner,
    log,
    error,
    isMyTurn,
    playerNames,
    gameStatus,
    rollDice,
    movePiece,
    skipTurn,
    resetGame,
  } = useParquesGame();

  const [showRules, setShowRules] = useState(false);

  // Get board position of a piece — only renders pieces on the common 68-cell track
  const getBoardPos = (piece: FrontendPiece): [number, number] | null => {
    if (piece.trackPos === 100 || piece.trackPos === -1 || piece.trackPos === -2) return null;
    return TRACK[(START_POS[piece.player] + piece.trackPos) % 68];
  };

  // A piece is interactable only when it belongs to the human player on their turn
  const isMovable = useCallback(
    (p: FrontendPiece) =>
      p.player === myPlayerIndex && isMyTurn && hasDiced && winner === null,
    [myPlayerIndex, isMyTurn, hasDiced, winner]
  );

  const cornerThemesMeta = [
    { key: 'violet', emoji: '🎮', dur: 4.2, origin: '12% 12%', mascot: { top: '7%', left: '1%' }, label: { top: '6%', right: '6%' }, turn: { bottom: '6%', right: '6%' }, slots: { bottom: '8%', left: '7%' } },
    { key: 'pink',   emoji: '🎨', dur: 4.8, origin: '88% 12%', mascot: { top: '7%', right: '1%' }, label: { top: '6%', left: '6%' }, turn: { bottom: '6%', left: '6%' }, slots: { bottom: '8%', right: '7%' } },
    { key: 'teal',   emoji: '🔬', dur: 4.5, origin: '12% 88%', mascot: { bottom: '7%', left: '1%' }, label: { bottom: '6%', right: '6%' }, turn: { top: '6%', right: '6%' }, slots: { top: '8%', left: '7%' } },
    { key: 'gold',   emoji: '🎧', dur: 5.1, origin: '88% 88%', mascot: { bottom: '7%', right: '1%' }, label: { bottom: '6%', left: '6%' }, turn: { top: '6%', left: '6%' }, slots: { top: '8%', right: '7%' } },
  ];

  // Render slots for jailed pieces inside corner bases
  const renderSlotPiece = (piece: FrontendPiece) => {
    const movable = isMovable(piece);
    return (
      <motion.div
        key={piece.id}
        whileHover={movable ? { scale: 1.2, y: -2 } : {}}
        whileTap={movable ? { scale: 0.85 } : {}}
        animate={movable ? { boxShadow: [`0 0 0 0px ${P_COLORS[piece.player]}80`, `0 0 8px 3px ${P_COLORS[piece.player]}A0`, `0 0 0 0px ${P_COLORS[piece.player]}80`] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
        onClick={() => movable && movePiece(piece)}
        className="rounded-full relative flex items-center justify-center"
        style={{
          width: '65%',
          height: '65%',
          background: `radial-gradient(circle at 35% 30%, #FFF 0%, ${P_COLORS[piece.player]} 35%, rgba(0,0,0,0.85) 100%)`,
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.95)'}`,
          cursor: movable ? 'pointer' : 'default',
          boxShadow: movable
            ? `0 2px 10px ${P_COLORS[piece.player]}CC, 0 0 16px ${P_COLORS[piece.player]}80`
            : `0 2px 5px rgba(0,0,0,0.45)`,
          transition: 'box-shadow 0.25s, transform 0.2s',
          zIndex: 10
        }}
      >
        <div
          style={{
            width: '28%',
            height: '28%',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.7)',
            position: 'absolute',
            top: '20%',
            left: '20%',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    );
  };

  const renderEmptySlot = (col: string) => (
    <div
      style={{
        width: '65%',
        height: '65%',
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.28)',
        boxShadow: `inset 0 0 0 2px ${hexA(col, 0.5)}, 0 0 10px ${hexA(col, 0.22)}`
      }}
    />
  );

  const renderCorner = (pi: number) => {
    const meta = cornerThemesMeta[pi];
    const col = P_COLORS[pi];
    const name = playerNames[pi] ?? `Jugador ${pi + 1}`;
    const img = P_MONKEYS[pi];
    const isActive = currentPlayer === pi;
    const playerJailedPieces = pieces.filter(p => p.player === pi && p.trackPos === -1);

    const slots = [];
    for (let i = 0; i < 4; i++) {
      const piece = playerJailedPieces[i];
      slots.push(
        <div key={i} style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {piece ? renderSlotPiece(piece) : renderEmptySlot(col)}
        </div>
      );
    }

    const gridAreas = [
      { r: '1 / 9', c: '1 / 9', rad: '14px 0 0 0' },
      { r: '1 / 9', c: '12 / 20', rad: '0 14px 0 0' },
      { r: '12 / 20', c: '1 / 9', rad: '0 0 0 14px' },
      { r: '12 / 20', c: '12 / 20', rad: '0 0 14px 0' }
    ];
    const area = gridAreas[pi];

    return (
      <div key={meta.key} style={{
        gridRow: area.r, gridColumn: area.c, position: 'relative', overflow: 'hidden',
        background: `radial-gradient(125% 125% at ${meta.origin}, ${hexA(col, isDark ? 0.30 : 0.20)} 0%, ${hexA(col, isDark ? 0.07 : 0.04)} 52%, ${isDark ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.005)'} 100%)`,
        borderRadius: area.rad
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: `inset 0 0 60px ${hexA(col, isActive ? 0.4 : 0.18)}`,
          animation: isActive ? 'cornerGlow 2s ease-in-out infinite' : 'none',
          pointerEvents: 'none'
        }} />

        <motion.img
          src={img} alt={name}
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: meta.dur, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', width: '60%', ...meta.mascot,
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
            pointerEvents: 'none'
          }}
        />

        <div style={{
          position: 'absolute', ...meta.label,
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '999px',
          background: hexA(col, 0.16), border: `1px solid ${hexA(col, 0.5)}`,
          backdropFilter: 'blur(4px)', whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '15px' }}>{meta.emoji}</span>
          <span style={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: '14px', color: '#fff' }}>{name}</span>
        </div>

        {isActive && (
          <div style={{
            position: 'absolute', ...meta.turn,
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '999px',
            background: col, boxShadow: `0 0 16px ${hexA(col, 0.7)}`,
            zIndex: 5
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff', animation: 'pulseDot 1.3s infinite' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.5px', color: '#fff' }}>SU TURNO</span>
          </div>
        )}

        <div style={{
          position: 'absolute', ...meta.slots, width: '36%',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8%'
        }}>
          {slots}
        </div>
      </div>
    );
  };

  const renderPathCell = (r: number, c: number, arm: string) => {
    const key = `${r},${c}`;
    const trackBg = 'transparent';
    const safeBg = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';
    const homeColor = { top: '#7c6cff', bottom: '#f4b13e', left: '#2bd4bd', right: '#f25fb0' };

    let bg = trackBg;
    let glow = null;
    let kids = null;

    const isHome = (arm === 'top' && c === 9) || (arm === 'bottom' && c === 9) || (arm === 'left' && r === 9) || (arm === 'right' && r === 9);

    if (isHome) {
      const col = homeColor[arm as keyof typeof homeColor];
      bg = `linear-gradient(${hexA(col, 0.30)}, ${hexA(col, 0.16)})`;
      glow = 'inset 0 0 10px ' + hexA(col, 0.45);
      if (arrowDir[key]) {
        const d = arrowDir[key];
        const s = '34%';
        const tri = {
          down: `polygon(0 0, 100% 0, 50% 100%)`,
          up: `polygon(50% 0, 0 100%, 100% 100%)`,
          right: `polygon(0 0, 0 100%, 100% 50%)`,
          left: `polygon(100% 0, 100% 100%, 0 50%)`
        }[d];
        kids = <div style={{ width: s, height: s, clipPath: tri, background: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)' }} />;
      }
    } else if (starts[key]) {
      const col = starts[key];
      bg = `radial-gradient(circle at 50% 40%, ${hexA(col, 0.95)}, ${hexA(col, 0.7)})`;
      glow = '0 0 14px ' + hexA(col, 0.75) + ', inset 0 0 0 2px rgba(255,255,255,0.45)';
      kids = <div style={{ width: '30%', height: '30%', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', boxShadow: '0 0 6px rgba(255,255,255,0.7)' }} />;
    } else if (safes.has(key)) {
      bg = safeBg;
      glow = 'inset 0 0 0 1px rgba(255,255,255,0.18)';
      kids = (
        <div style={{
          width: '26%', height: '26%',
          clipPath: 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          background: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'
        }} />
      );
    }

    const cellPieces = pieces.filter(p => {
      const pos = getBoardPos(p);
      return pos && pos[0] === r && pos[1] === c;
    });

    const style: React.CSSProperties = {
      boxSizing: 'border-box',
      gridRow: String(r + 1),
      gridColumn: String(c + 1),
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    };
    if (glow) style.boxShadow = glow;

    return (
      <div key={key} style={style}>
        {kids}
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 flex-wrap p-0.5" style={{ zIndex: 10 }}>
          {cellPieces.slice(0, 4).map(piece => {
            const sz = cellPieces.length > 2 ? 8 : 13;
            const dotSz = Math.max(2.5, Math.round(sz * 0.28));
            const movable = isMovable(piece);
            return (
              <motion.div key={piece.id}
                whileHover={movable ? { scale: 1.4, y: -2 } : {}}
                whileTap={movable ? { scale: 0.85 } : {}}
                animate={movable ? { boxShadow: [`0 0 0 0px ${P_COLORS[piece.player]}80`, `0 0 8px 3px ${P_COLORS[piece.player]}A0`, `0 0 0 0px ${P_COLORS[piece.player]}80`] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                onClick={() => movable && movePiece(piece)}
                className="rounded-full relative flex items-center justify-center"
                style={{
                  width: sz, height: sz,
                  background: `radial-gradient(circle at 35% 30%, #FFF 0%, ${P_COLORS[piece.player]} 35%, rgba(0,0,0,0.85) 100%)`,
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.95)'}`,
                  cursor: movable ? 'pointer' : 'default',
                  boxShadow: movable
                    ? `0 2px 10px ${P_COLORS[piece.player]}CC, 0 0 16px ${P_COLORS[piece.player]}80`
                    : `0 2px 5px rgba(0,0,0,0.45)`,
                  transition: 'box-shadow 0.25s, transform 0.2s',
                }}>
                <div style={{
                  width: dotSz, height: dotSz,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.7)',
                  position: 'absolute',
                  top: '20%', left: '20%',
                  pointerEvents: 'none',
                }} />
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCenterPyramid = () => {
    const tri = (clip: string, col: string) => (
      <div key={clip} style={{ position: 'absolute', inset: 0, clipPath: clip, background: col, boxShadow: 'inset 0 0 16px ' + hexA(col, 0.6) }} />
    );
    return (
      <div key="center" style={{ gridRow: '9 / 12', gridColumn: '9 / 12', position: 'relative', filter: 'drop-shadow(0 0 12px rgba(124,108,255,0.45))' }}>
        {tri('polygon(0 0, 100% 0, 50% 50%)', '#7c6cff')}
        {tri('polygon(100% 0, 100% 100%, 50% 50%)', '#f25fb0')}
        {tri('polygon(100% 100%, 0 100%, 50% 50%)', '#f4b13e')}
        {tri('polygon(0 100%, 0 0, 50% 50%)', '#2bd4bd')}
      </div>
    );
  };

  const renderMedallion = () => (
    <div key="med" style={{ gridRow: '9 / 12', gridColumn: '9 / 12', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6, pointerEvents: 'none' }}>
      <div style={{ width: '52%', aspectRatio: '1/1', borderRadius: '50%', background: 'linear-gradient(145deg,#8a7bff,#5b46e0)', border: '3px solid rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'medPulse 2.8s ease-in-out infinite' }}>
        <span style={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: '30px', color: '#fff', lineHeight: 1 }}>P</span>
      </div>
    </div>
  );

  const renderBoardGrid = () => {
    const pathCells = [];
    for (let r = 0; r < 19; r++) {
      for (let c = 0; c < 19; c++) {
        const arm = inArm(r, c);
        if (arm) pathCells.push(renderPathCell(r, c, arm));
      }
    }
    return (
      <div style={{
        width: '100%', height: '100%', aspectRatio: '1 / 1',
        display: 'grid', gridTemplateColumns: `repeat(19, 1fr)`, gridTemplateRows: `repeat(19, 1fr)`,
        borderRadius: '18px', overflow: 'hidden', padding: '0',
        background: isDark ? 'radial-gradient(130% 130% at 50% 50%, #211c46 0%, #0f0c24 70%)' : 'radial-gradient(130% 130% at 50% 50%, #f7f6ff 0%, #e8e6f8 70%)',
        boxShadow: isDark ? '0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 1px rgba(124,108,255,0.15)' : '0 40px 90px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.04)',
        position: 'relative'
      }}>
        {pathCells}
        {[0, 1, 2, 3].map(pi => renderCorner(pi))}
        {renderCenterPyramid()}
        {renderMedallion()}
      </div>
    );
  };

  // Status bar text
  const statusText = (() => {
    if (gameStatus === 'WAITING_FOR_PLAYERS') return '⏳ Preparando la partida…';
    if (winner !== null) return `🏆 ${playerNames[winner]} ganó`;
    if (!isMyTurn) return `Turno de ${playerNames[currentPlayer] ?? '?'}…`;
    if (hasDiced) return `Click en ficha para mover ${diceSum}`;
    return 'Tú — tira los dados';
  })();

  // ── Shared side-panel content (dice + buttons + optional log) ──────────
  const renderSidePanel = (mobile = false) => (
    <>
      {/* Dice card */}
      <div className={`rounded-2xl p-4 border ${mobile ? 'flex-1' : ''}`}
        style={{ background: 'var(--p-card)', borderColor: isDark ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.18)', minWidth: mobile ? 150 : 'auto' }}>
        <div className="flex gap-2 justify-center mb-3">
          <DiceFace v={dice[0]} rolling={rolling} color={P_COLORS[currentPlayer]} isDark={isDark} />
          <DiceFace v={dice[1]} rolling={rolling} color={P_COLORS[currentPlayer]} isDark={isDark} />
        </div>
        {isDouble && hasDiced && <p className="text-center mb-2" style={{ fontSize: '0.7rem', color: '#FFB347', fontWeight: 700 }}>🎯 ¡Doble! +1 turno</p>}
        <motion.button onClick={rollDice}
          disabled={rolling || !isMyTurn || hasDiced || winner !== null || gameStatus !== 'IN_PROGRESS'}
          whileHover={!rolling && isMyTurn && !hasDiced ? { scale: 1.03 } : {}}
          whileTap={!rolling && isMyTurn && !hasDiced ? { scale: 0.97 } : {}}
          className="w-full py-2.5 rounded-xl text-sm font-semibold mb-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{
            background: isMyTurn && !hasDiced && winner === null && gameStatus === 'IN_PROGRESS'
              ? `linear-gradient(135deg,${P_COLORS[currentPlayer]},${P_COLORS[currentPlayer]}CC)`
              : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
            color: isMyTurn && !hasDiced && winner === null && gameStatus === 'IN_PROGRESS' ? 'white' : 'var(--p-muted)',
            border: isMyTurn && !hasDiced && winner === null && gameStatus === 'IN_PROGRESS' ? 'none' : '1px solid var(--p-divider)',
          }}>
          {rolling ? '🎲 Tirando…' : hasDiced && isMyTurn ? '✓ Tirado' : '🎲 Tirar dados'}
        </motion.button>
        {isMyTurn && hasDiced && winner === null && (
          <button onClick={skipTurn} className="w-full py-1.5 rounded-xl text-xs transition-all hover:opacity-95"
            style={{ background: 'rgba(255,179,71,0.12)', color: '#FFB347', border: '1px solid rgba(255,179,71,0.25)' }}>
            Pasar turno →
          </button>
        )}
      </div>

      {/* Log — desktop only */}
      {!mobile && (
        <div className="rounded-2xl p-3 border overflow-hidden flex flex-col" style={{ background: 'var(--p-card)', borderColor: 'var(--p-divider)' }}>
          <p style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: '6px', color: 'var(--p-muted)' }}>Historial</p>
          <div className="overflow-y-auto space-y-1" style={{ maxHeight: 180 }}>
            {log.map((m, i) => (
              <p key={i} style={{
                fontSize: '0.65rem',
                color: m.includes('Turno') ? '#7FE7C4' : m.includes('🏆') ? '#FFB347' : 'var(--p-sub)',
                padding: '3px 6px', borderRadius: 6, background: 'rgba(108,99,255,0.05)', lineHeight: 1.4,
              }}>{m}</p>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <button onClick={resetGame} className={`py-2 rounded-xl text-sm font-medium ${mobile ? 'flex-1' : 'w-full'}`}
        style={{ background: winner !== null ? '#7FE7C4' : 'rgba(108,99,255,0.1)', color: winner !== null ? '#0F0E1A' : 'var(--p-muted)', minWidth: mobile ? 100 : 'auto' }}>
        {winner !== null ? '🎮 Nueva' : '🔄 Nueva'}
      </button>

      <button onClick={() => setShowRules(true)} className={`py-2 rounded-xl text-sm font-medium ${mobile ? 'flex-1' : 'w-full'}`}
        style={{ background: 'rgba(127,231,196,0.12)', color: '#7FE7C4', border: '1px solid rgba(127,231,196,0.25)', minWidth: mobile ? 100 : 'auto' }}>
        📖 Reglas
      </button>
    </>
  );

  return (
    <div className="h-full overflow-auto relative" style={{ background: 'var(--p-bg)' }}>
      <style>{`
        @keyframes cornerGlow {
          0%, 100% { opacity: .5; }
          50% { opacity: 1; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .4; transform: scale(.8); }
        }
        @keyframes medPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,108,255,.5), 0 10px 30px rgba(0,0,0,.5); }
          50% { box-shadow: 0 0 0 12px rgba(124,108,255,0), 0 10px 30px rgba(0,0,0,.5); }
        }
      `}</style>

      {/* ── Desktop layout: row, board 494px + side panel 192px ── */}
      <div style={{ display: isMobile ? 'none' : 'flex' }} className="gap-5 p-4 justify-center items-start min-h-full">

        {/* Board column */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          {/* Player tabs */}
          <div className="flex gap-2 flex-wrap justify-center">
            {playerNames.map((name, i) => {
              const done = pieces.filter(p => p.player === i && p.trackPos === 100).length;
              return (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all"
                  style={{ background: currentPlayer === i ? `${P_COLORS[i]}18` : 'transparent', borderColor: currentPlayer === i ? P_COLORS[i] : 'var(--p-divider)' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: P_COLORS[i] }} />
                  <span style={{ fontSize: '0.7rem', color: currentPlayer === i ? P_COLORS[i] : 'var(--p-muted)', fontWeight: currentPlayer === i ? 700 : 400 }}>
                    {name}{i === myPlayerIndex ? ' (Tú)' : ''}
                  </span>
                  {done > 0 && <span style={{ fontSize: '0.6rem', color: P_COLORS[i] }}>{done}/4✓</span>}
                </div>
              );
            })}
          </div>
          {/* Fixed 494×494 board */}
          <div style={{ width: 494, height: 494, position: 'relative', flexShrink: 0 }}>
            {renderBoardGrid()}
          </div>
          {/* Status */}
          <div className="px-4 py-1.5 rounded-full text-center"
            style={{ background: `${P_COLORS[currentPlayer]}15`, border: `1px solid ${P_COLORS[currentPlayer]}40` }}>
            <span style={{ fontSize: '0.75rem', color: P_COLORS[currentPlayer], fontWeight: 600 }}>{statusText}</span>
          </div>
          {error && (
            <div className="px-4 py-1.5 rounded-full text-center"
              style={{ background: 'rgba(255,77,106,0.12)', border: '1px solid rgba(255,77,106,0.3)' }}>
              <span style={{ fontSize: '0.7rem', color: '#FF4D6A' }}>⚠️ {error}</span>
            </div>
          )}
        </div>

        {/* Side panel — desktop */}
        <div className="flex flex-col gap-3 w-48 flex-shrink-0 pt-8">
          {renderSidePanel()}
        </div>
      </div>

      {/* ── Mobile layout: column, board fills width ── */}
      <div style={{ display: isMobile ? 'flex' : 'none' }} className="flex-col gap-4 p-3">
        {/* Player tabs */}
        <div className="flex gap-2 flex-wrap justify-center">
          {playerNames.map((name, i) => {
            const done = pieces.filter(p => p.player === i && p.trackPos === 100).length;
            return (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all"
                style={{ background: currentPlayer === i ? `${P_COLORS[i]}18` : 'transparent', borderColor: currentPlayer === i ? P_COLORS[i] : 'var(--p-divider)' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: P_COLORS[i] }} />
                <span style={{ fontSize: '0.65rem', color: currentPlayer === i ? P_COLORS[i] : 'var(--p-muted)', fontWeight: currentPlayer === i ? 700 : 400 }}>
                  {name}{i === myPlayerIndex ? ' (Tú)' : ''}
                </span>
                {done > 0 && <span style={{ fontSize: '0.6rem', color: P_COLORS[i] }}>{done}/4✓</span>}
              </div>
            );
          })}
        </div>

        {/* Board — fills container width, square aspect ratio */}
        <div style={{ width: '100%', aspectRatio: '1 / 1', position: 'relative' }}>
          {renderBoardGrid()}
        </div>

        {/* Status */}
        <div className="px-3 py-1.5 rounded-full text-center self-center"
          style={{ background: `${P_COLORS[currentPlayer]}15`, border: `1px solid ${P_COLORS[currentPlayer]}40` }}>
          <span style={{ fontSize: '0.72rem', color: P_COLORS[currentPlayer], fontWeight: 600 }}>{statusText}</span>
        </div>
        {error && (
          <div className="px-3 py-1.5 rounded-full text-center self-center"
            style={{ background: 'rgba(255,77,106,0.12)', border: '1px solid rgba(255,77,106,0.3)' }}>
            <span style={{ fontSize: '0.68rem', color: '#FF4D6A' }}>⚠️ {error}</span>
          </div>
        )}

        {/* Side panel — mobile (dice + controls row, log hidden) */}
        <div className="flex flex-row gap-3 flex-wrap">
          {renderSidePanel(true)}
        </div>
      </div>

      {/* Rules overlay */}
      <AnimatePresence>
        {showRules && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.72)', zIndex: 200 }}
            onClick={() => setShowRules(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              className="rounded-3xl border overflow-y-auto"
              style={{ background: isDark ? 'rgba(20,18,38,0.98)' : '#fff', borderColor: 'rgba(108,99,255,0.35)', width: 340, maxHeight: '80%', padding: '24px' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#F0EEFF' : '#1A1829' }}>📖 Reglas del Parqués</h3>
                <button onClick={() => setShowRules(false)} style={{ color: isDark ? '#8B85B0' : '#9490B5', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
              </div>
              {[
                { emoji: '🏠', title: 'Salir de casa (cárcel)', body: 'Necesitas sacar 5 exactos o dobles (igual número en ambos dados) para sacar una de tus fichas de casa al tablero.' },
                { emoji: '🎲', title: 'Dobles = turno extra', body: 'Si ambos dados muestran el mismo número, mueves tu ficha y tiras de nuevo. ¡Pero si sacas 3 dobles seguidos tu ficha vuelve a casa!' },
                { emoji: '🔄', title: 'Movimiento', body: 'Las fichas avanzan en sentido de las manecillas del reloj por el borde exterior, luego suben por el camino de tu color hacia el centro.' },
                { emoji: '⭐', title: 'Casillas seguras', body: 'Las casillas con estrella son seguras. Tu ficha no puede ser comida estando en ellas. También los puntos de salida de cada jugador son seguros.' },
                { emoji: '🍽️', title: 'Comer una ficha', body: 'Si caes en una casilla ocupada por una ficha rival (y NO es casilla segura), la comes: esa ficha vuelve a casa del rival. Ganas 20 pasos de premio.' },
                { emoji: '🏆', title: 'Ganar el juego', body: 'El primero en llevar sus 4 fichas hasta el centro del tablero (cruzando todo el recorrido) gana la partida.' },
                { emoji: '🔢', title: 'Cómo mover', body: 'Haz click en "Tirar dados" y luego click sobre la ficha que quieras mover. Si no puedes mover ninguna, usa "Pasar turno".' },
              ].map(rule => (
                <div key={rule.title} className="mb-4 flex gap-3">
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{rule.emoji}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: isDark ? '#C0BAE0' : '#2A2448', marginBottom: '3px' }}>{rule.title}</p>
                    <p style={{ fontSize: '0.78rem', color: isDark ? '#8B85B0' : '#6B6490', lineHeight: 1.6 }}>{rule.body}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowRules(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#8B7FFF)', color: 'white' }}>
                ¡Entendido, a jugar!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win overlay */}
      <AnimatePresence>
        {winner !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', zIndex: 200 }}>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
              className="text-center p-8 rounded-3xl border"
              style={{ background: 'rgba(26,24,41,0.98)', borderColor: P_COLORS[winner], boxShadow: `0 0 60px ${P_COLORS[winner]}40` }}>
              <div className="text-5xl mb-3">🏆</div>
              <h2 style={{ fontWeight: 800, fontSize: '1.6rem', color: P_COLORS[winner], marginBottom: 6 }}>
                ¡{playerNames[winner]} ganó!
              </h2>
              <p style={{ color: 'var(--p-muted)', marginBottom: 16, fontSize: '0.85rem' }}>Todas las fichas llegaron a la meta</p>
              <button onClick={resetGame} className="px-8 py-3 rounded-2xl font-semibold"
                style={{ background: P_COLORS[winner], color: 'white' }}>
                🎮 Nueva partida
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
