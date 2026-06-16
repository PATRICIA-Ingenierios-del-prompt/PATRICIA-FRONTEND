import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../store/ThemeContext';

import monoEstudio   from '../assets/monoESTUDIO.png';
import monoJuegos    from '../assets/monoJUEGOS.png';
import monoAireLibre from '../assets/monoAIRELIBRE.png';
import monoMusica    from '../assets/monoMUSICA.png';

const P_COLORS = ['#6C63FF', '#00D9FF', '#7FE7C4', '#FF6B9D'] as const;
const P_NAMES  = ['Tú', 'Felipe', 'Sofía', 'Andrés'] as const;
const P_MONKEYS = [monoEstudio, monoJuegos, monoAireLibre, monoMusica];


type CellType = 'corner' | 'home' | 'path' | 'safe' | 'center' | 'arrow' | 'empty';
interface Cell { type: CellType; color?: string }

// Starting home positions for each player's 4 pieces
const HOME_CELLS: [number,number][][] = [
  [[1,1],[1,4],[4,1],[4,4]],
  [[1,10],[1,13],[4,10],[4,13]],
  [[10,1],[10,4],[13,1],[13,4]],
  [[10,10],[10,13],[13,10],[13,13]],
];

const getHomeSlotPlayer = (r: number, c: number): number => {
  for (let pi = 0; pi < 4; pi++) {
    if (HOME_CELLS[pi].some(([hr, hc]) => hr === r && hc === c)) {
      return pi;
    }
  }
  return -1;
};

function buildBoard(): Cell[][] {
  const N = 15;
  const b: Cell[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => ({ type: 'empty' as CellType }))
  );

  // White path cells of the cross
  for (let r=0;r<=5;r++) for (let c=6;c<=8;c++) b[r][c]={type:'path'};
  for (let r=9;r<=14;r++) for (let c=6;c<=8;c++) b[r][c]={type:'path'};
  for (let r=6;r<=8;r++) for (let c=0;c<=5;c++) b[r][c]={type:'path'};
  for (let r=6;r<=8;r++) for (let c=9;c<=14;c++) b[r][c]={type:'path'};

  // Home columns (colored arrow path to center)
  for (let r=1;r<=5;r++) b[r][7]={type:'arrow',color:P_COLORS[0]};
  for (let c=9;c<=13;c++) b[7][c]={type:'arrow',color:P_COLORS[1]};
  for (let c=1;c<=5;c++) b[7][c]={type:'arrow',color:P_COLORS[2]};
  for (let r=9;r<=13;r++) b[r][7]={type:'arrow',color:P_COLORS[3]};

  // Center 3×3
  for (let r=6;r<=8;r++) for (let c=6;c<=8;c++) b[r][c]={type:'center'};

  // Safe squares (including starting cells, neutral safes, and arrow path entries)
  const SAFES: [number, number, number | null][] = [
    [3, 6, 0],   // Red start
    [6, 12, 1],  // Blue start
    [8, 2, 2],   // Green start
    [11, 8, 3],  // Pink start
    [1, 8, null],  // Neutral top-right
    [8, 10, null], // Neutral bottom-right
    [13, 6, null], // Neutral bottom-left
    [6, 1, null],  // Neutral top-left
    [0, 7, null],  // Neutral entry top
    [7, 14, null], // Neutral entry right
    [14, 7, null], // Neutral entry bottom
    [7, 0, null],  // Neutral entry left
  ];
  SAFES.forEach(([r,c,pi])=>{
    b[r][c]={type:'safe',color: pi !== null ? P_COLORS[pi] : undefined};
  });

  // Keep home slots at HOME_CELLS registered as 'safe' but we style them transparent in renderCell
  HOME_CELLS.forEach((playerCells, pi) => {
    playerCells.forEach(([r, c]) => {
      b[r][c] = { type: 'safe', color: P_COLORS[pi] };
    });
  });

  return b;
}

const BOARD = buildBoard();

// 52-cell clockwise track (cross perimeter)
const TRACK: [number,number][] = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0]
];

// Start indices in the TRACK array for each player
const START_POS = [8, 21, 47, 34];

// Dice faces
const DOTS: Record<number,[number,number][]> = {
  1:[[50,50]],
  2:[[25,25],[75,75]],
  3:[[25,25],[50,50],[75,75]],
  4:[[25,25],[75,25],[25,75],[75,75]],
  5:[[25,25],[75,25],[50,50],[25,75],[75,75]],
  6:[[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]],
};

function DiceFace({v,rolling,color,isDark}:{v:number;rolling:boolean;color:string;isDark:boolean}) {
  return (
    <motion.div
      animate={rolling?{rotate:[0,120,240,360],scale:[1,1.15,0.9,1]}:{}}
      transition={{duration:0.45,repeat:rolling?Infinity:0}}
      className="rounded-xl border-2 flex items-center justify-center"
      style={{
        width:50,
        height:50,
        background: isDark ? 'rgba(30, 28, 48, 0.95)' : '#FAFAFA',
        borderColor:color,
        boxShadow: isDark ? `0 0 12px ${color}60` : `0 2px 12px ${color}35`
      }}>
      <svg width="38" height="38" viewBox="0 0 100 100">
        {(DOTS[v]||[]).map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={9} fill={color}/>)}
      </svg>
    </motion.div>
  );
}


interface Piece {id:number;player:number;trackPos:number} // -1=home, 0-51=track, 100=done

export function ParquesBoard() {
  const themeColors = useTheme();
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState<[number,number]>([1,1]);
  const [rolling, setRolling] = useState(false);
  const [hasDiced, setHasDiced] = useState(false);
  const [winner, setWinner] = useState<number|null>(null);
  const [log, setLog] = useState<string[]>([`Turno de ${P_NAMES[0]} — tira los dados`]);
  const [pieces, setPieces] = useState<Piece[]>(
    Array.from({length:16},(_,i)=>({id:i,player:Math.floor(i/4),trackPos:-1}))
  );

  const diceSum = dice[0]+dice[1];
  const isDouble = dice[0]===dice[1];

  const addLog=(m:string)=>setLog(p=>[...p.slice(-12),m]);

  const rollDice = async () => {
    if (rolling||hasDiced||winner!==null) return;
    setRolling(true);
    for (let i=0;i<7;i++) {
      await new Promise(r=>setTimeout(r,60));
      setDice([Math.ceil(Math.random()*6) as any,Math.ceil(Math.random()*6) as any]);
    }
    const d1=(Math.ceil(Math.random()*6)) as any;
    const d2=(Math.ceil(Math.random()*6)) as any;
    setDice([d1,d2]);
    setRolling(false);
    setHasDiced(true);
    addLog(`${P_NAMES[currentPlayer]} sacó ${d1}+${d2}=${d1+d2}${d1===d2?' 🎯 ¡Doble!':''}`);
  };

  const movePiece = useCallback((piece:Piece)=>{
    if (!hasDiced||winner!==null||piece.player!==currentPlayer) return;
    let newPieces=[...pieces];

    if (piece.trackPos===-1) {
      if (diceSum===5||isDouble) {
        newPieces=newPieces.map(p=>p.id===piece.id?{...p,trackPos:0}:p);
        addLog(`${P_NAMES[currentPlayer]} saca ficha al inicio`);
      } else { addLog('Necesitas 5 o dobles para salir de casa'); return; }
    } else {
      const newPos=piece.trackPos+diceSum;
      if (newPos>=52) {
        newPieces=newPieces.map(p=>p.id===piece.id?{...p,trackPos:100}:p);
        addLog(`🏠 Ficha de ${P_NAMES[currentPlayer]} llega a meta!`);
        if (newPieces.filter(p=>p.player===currentPlayer&&p.trackPos===100).length===4) {
          setWinner(currentPlayer);
          setPieces(newPieces);
          addLog(`🏆 ${P_NAMES[currentPlayer]} GANÓ!`);
          return;
        }
      } else {
        newPieces=newPieces.map(p=>p.id===piece.id?{...p,trackPos:newPos}:p);
        addLog(`${P_NAMES[currentPlayer]} avanza ${diceSum}`);
      }
    }

    setPieces(newPieces);
    if (!isDouble) {
      const next=(currentPlayer+1)%4;
      setCurrentPlayer(next);
      addLog(`Turno de ${P_NAMES[next]}`);
    } else addLog('¡Doble! Tira de nuevo');
    setHasDiced(false);
  },[hasDiced,winner,currentPlayer,pieces,diceSum,isDouble]);

  const skipTurn=()=>{
    if (!hasDiced) return;
    const next=(currentPlayer+1)%4;
    setCurrentPlayer(next);
    addLog(`${P_NAMES[currentPlayer]} pasa | Turno de ${P_NAMES[next]}`);
    setHasDiced(false);
  };

  const reset=()=>{
    setPieces(Array.from({length:16},(_,i)=>({id:i,player:Math.floor(i/4),trackPos:-1})));
    setCurrentPlayer(0); setDice([1,1]); setHasDiced(false); setWinner(null);
    setLog([`Turno de ${P_NAMES[0]}`]);
  };

  // Get board position of a piece
  const getBoardPos=(piece:Piece):[number,number]|null=>{
    if (piece.trackPos===100) return null;
    if (piece.trackPos===-1) {
      const homeList=pieces.filter(p=>p.player===piece.player&&p.trackPos===-1);
      const idx=homeList.findIndex(p=>p.id===piece.id);
      return HOME_CELLS[piece.player][Math.min(idx,3)];
    }
    return TRACK[(START_POS[piece.player] + piece.trackPos) % 52];
  };

  const CELL=33;
  const isDark = themeColors.darkMode;

  const renderCell=(cell:Cell,r:number,c:number)=>{
    if (cell.type==='empty') return null;

    const cellPieces=pieces.filter(p=>{
      const pos=getBoardPos(p);
      return pos&&pos[0]===r&&pos[1]===c;
    });

    const homeSlotPlayer = getHomeSlotPlayer(r, c);

    let bg = isDark ? '#1C192E' : '#FFFFFF';
    let border = isDark ? 'rgba(108, 99, 255, 0.15)' : 'rgba(108, 99, 255, 0.22)';

    if (cell.type==='corner') { 
      bg = isDark ? 'rgba(15, 14, 26, 0.45)' : 'rgba(108, 99, 255, 0.05)'; 
      border = isDark ? 'rgba(108, 99, 255, 0.08)' : 'rgba(108, 99, 255, 0.12)'; 
    }
    if (cell.type==='home') { 
      // Transparent because the monkey avatar container overlays it
      bg = 'transparent'; 
      border = 'transparent'; 
    }
    if (cell.type==='safe') { 
      if (cell.color) {
        bg = isDark ? cell.color + '22' : cell.color + '18'; 
        border = cell.color; 
      } else {
        bg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
        border = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)';
      }
    }
    if (cell.type==='arrow') { 
      bg = isDark ? cell.color! + '1A' : cell.color! + '15'; 
      border = cell.color! + '50'; 
    }
    if (cell.type==='center') {
      const centerColors=['#6C63FF','#00D9FF','#7FE7C4','#FF6B9D'];
      const ci=r===6&&c===6?0:r===6&&c===8?1:r===8&&c===6?2:r===8&&c===8?3:4;
      bg = ci<4 ? centerColors[ci] + (isDark ? '15' : '10') : (isDark ? 'rgba(26, 24, 41, 0.9)' : 'rgba(240, 238, 255, 0.8)');
      border = ci<4 ? centerColors[ci] + '40' : 'rgba(108, 99, 255, 0.2)';
    }

    if (homeSlotPlayer !== -1) {
      bg = 'transparent';
      border = 'transparent';
    }

    const isMovable=(p:Piece)=>p.player===currentPlayer&&hasDiced&&winner===null;

    return (
      <div key={`${r}-${c}`} className="relative flex items-center justify-center transition-all duration-200"
        style={{
          gridRow: r + 1,
          gridColumn: c + 1,
          background: bg,
          border: cell.type === 'home' || homeSlotPlayer !== -1 ? 'none' : `1px solid ${border}`,
          width:'100%',
          height:'100%',
          borderRadius: cell.type === 'corner' || cell.type === 'home' || homeSlotPlayer !== -1 ? 0 : 5,
        }}>
        {/* Glowing/Dashed starting slot circular outline */}
        {homeSlotPlayer !== -1 && (
          <div className="absolute rounded-full transition-all"
            style={{
              width: '80%',
              height: '80%',
              border: `1.5px dashed ${P_COLORS[homeSlotPlayer]}A0`,
              background: `${P_COLORS[homeSlotPlayer]}0A`,
              boxShadow: isDark ? `0 0 6px ${P_COLORS[homeSlotPlayer]}20` : 'none',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {cell.type==='safe'&&<span style={{position:'absolute',top:1,right:1,fontSize:'0.5rem',opacity:0.9}}>⭐</span>}
        {cell.type==='center'&&r===7&&c===7&&<span style={{fontSize:'1.1rem', filter: 'drop-shadow(0 0 4px rgba(108,99,255,0.4))'}}>🏠</span>}
        {cell.type==='arrow'&&<div className="w-1.5 h-1.5 rounded-full opacity-60" style={{background:cell.color, boxShadow: `0 0 4px ${cell.color}`}}/>}
        
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 flex-wrap p-0.5" style={{ zIndex: 10 }}>
          {cellPieces.slice(0,4).map(piece=>{
            const sz = cellPieces.length>2 ? 10 : 15;
            const dotSz = Math.max(3, Math.round(sz * 0.28));
            const movable = isMovable(piece);
            return (
              <motion.div key={piece.id}
                whileHover={movable?{scale:1.4, y:-2}:{}}
                whileTap={movable?{scale:0.85}:{}}
                animate={movable ? { boxShadow: [`0 0 0 0px ${P_COLORS[piece.player]}80`, `0 0 8px 3px ${P_COLORS[piece.player]}A0`, `0 0 0 0px ${P_COLORS[piece.player]}80`] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                onClick={()=>movable&&movePiece(piece)}
                className="rounded-full relative flex items-center justify-center"
                style={{
                  width:sz, height:sz,
                  background:`radial-gradient(circle at 35% 30%, #FFF 0%, ${P_COLORS[piece.player]} 35%, rgba(0,0,0,0.85) 100%)`,
                  border:`1.5px solid ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.95)'}`,
                  cursor:movable?'pointer':'default',
                  boxShadow: movable
                    ? `0 2px 10px ${P_COLORS[piece.player]}CC, 0 0 16px ${P_COLORS[piece.player]}80`
                    : `0 2px 5px rgba(0,0,0,0.45)`,
                  transition:'box-shadow 0.25s, transform 0.2s',
                }}>
                {/* Inner highlight dot */}
                <div style={{
                  width:dotSz, height:dotSz,
                  borderRadius:'50%',
                  background:'rgba(255,255,255,0.7)',
                  position:'absolute',
                  top:'20%', left:'20%',
                  pointerEvents:'none',
                }} />
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-5 h-full overflow-auto p-4 justify-center items-center">
      {/* Board */}
      <div className="flex-shrink-0 flex flex-col items-center gap-3">
        {/* Player tabs */}
        <div className="flex gap-2 flex-wrap justify-center">
          {P_NAMES.map((name,i)=>{
            const done=pieces.filter(p=>p.player===i&&p.trackPos===100).length;
            return (
              <div key={name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all"
                style={{background:currentPlayer===i?`${P_COLORS[i]}18`:'transparent',borderColor:currentPlayer===i?P_COLORS[i]:'var(--p-divider)'}}>
                <div className="w-3 h-3 rounded-full" style={{background:P_COLORS[i]}}/>
                <span style={{fontSize:'0.7rem',color:currentPlayer===i?P_COLORS[i]:'var(--p-muted)',fontWeight:currentPlayer===i?700:400}}>
                  {name}{i===0?' (Tú)':''}
                </span>
                {done>0&&<span style={{fontSize:'0.6rem',color:P_COLORS[i]}}>{done}/4✓</span>}
              </div>
            );
          })}
        </div>

        {/* Grid Container */}
        <div style={{
          position: 'relative',
          display:'grid',
          gridTemplateColumns:`repeat(15,${CELL}px)`,
          gridTemplateRows:`repeat(15,${CELL}px)`,
          gap:1,
          background: isDark ? 'var(--p-card)' : '#FFFFFF',
          padding:3,
          borderRadius:16,
          border: isDark ? '2px solid rgba(108,99,255,0.35)' : '2px solid rgba(108,99,255,0.22)',
          boxShadow: isDark ? '0 12px 40px rgba(108,99,255,0.18)' : '0 8px 32px rgba(108,99,255,0.08)',
        }}>
          {/* Solid base quadrants behind the slots */}
          {[
            { pi: 0, rStart: 1, rEnd: 7, cStart: 1, cEnd: 7 }, // Top-Left
            { pi: 1, rStart: 1, rEnd: 7, cStart: 10, cEnd: 16 }, // Top-Right
            { pi: 2, rStart: 10, rEnd: 16, cStart: 1, cEnd: 7 }, // Bottom-Left
            { pi: 3, rStart: 10, rEnd: 16, cStart: 10, cEnd: 16 }, // Bottom-Right
          ].map(({ pi, rStart, rEnd, cStart, cEnd }) => (
            <div
              key={`base-${pi}`}
              style={{
                gridRow: `${rStart} / ${rEnd}`,
                gridColumn: `${cStart} / ${cEnd}`,
                background: isDark ? `${P_COLORS[pi]}0E` : `${P_COLORS[pi]}08`,
                border: `1.5px solid ${P_COLORS[pi]}22`,
                borderRadius: 12,
                boxShadow: isDark 
                  ? `inset 0 0 24px ${P_COLORS[pi]}0A, 0 4px 12px rgba(0, 0, 0, 0.25)` 
                  : `inset 0 0 16px ${P_COLORS[pi]}05, 0 2px 8px rgba(108, 99, 255, 0.05)`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          ))}

          {BOARD.map((row,r)=>row.map((cell,c)=>renderCell(cell,r,c)))}

          {/* Player Bases Monkey Mascot Overlays */}
          {[
            { pi: 0, rStart: 3, rEnd: 5, cStart: 3, cEnd: 5 }, // Top-Left
            { pi: 1, rStart: 3, rEnd: 5, cStart: 12, cEnd: 14 }, // Top-Right
            { pi: 2, rStart: 12, rEnd: 14, cStart: 3, cEnd: 5 }, // Bottom-Left
            { pi: 3, rStart: 12, rEnd: 14, cStart: 12, cEnd: 14 }, // Bottom-Right
          ].map(({ pi, rStart, rEnd, cStart, cEnd }) => (
            <motion.div
              key={pi}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: pi * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.08 }}
              style={{
                gridRow: `${rStart} / ${rEnd}`,
                gridColumn: `${cStart} / ${cEnd}`,
                zIndex: 5,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
              }}
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: pi * 0.5 }}
                className="w-full h-full rounded-full flex items-center justify-center p-1.5 transition-all duration-300"
                style={{
                  background: isDark ? 'rgba(26, 24, 41, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                  border: `2px solid ${P_COLORS[pi]}`,
                  boxShadow: isDark 
                    ? `0 0 16px ${P_COLORS[pi]}40, inset 0 0 10px ${P_COLORS[pi]}15` 
                    : `0 4px 12px ${P_COLORS[pi]}25`,
                }}
              >
                <img 
                  src={P_MONKEYS[pi]} 
                  alt={P_NAMES[pi]} 
                  className="w-full h-full object-contain"
                  style={{
                    filter: `drop-shadow(0 4px 6px ${P_COLORS[pi]}30)`
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Status */}
        <div className="px-4 py-1.5 rounded-full text-center"
          style={{background:`${P_COLORS[currentPlayer]}15`,border:`1px solid ${P_COLORS[currentPlayer]}40`}}>
          <span style={{fontSize:'0.75rem',color:P_COLORS[currentPlayer],fontWeight:600}}>
            {winner!==null?`🏆 ${P_NAMES[winner]} ganó`:hasDiced?`Click en ficha para mover ${diceSum}`:`Turno de ${P_NAMES[currentPlayer]} — tira`}
          </span>
        </div>
      </div>

      {/* Side panel */}
      <div className="flex flex-col gap-3 w-48">
        {/* Dice */}
        <div className="rounded-2xl p-4 border" style={{background:'var(--p-card)',borderColor: isDark ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.18)'}}>
          <div className="flex gap-2 justify-center mb-3">
            <DiceFace v={dice[0]} rolling={rolling} color={P_COLORS[currentPlayer]} isDark={isDark}/>
            <DiceFace v={dice[1]} rolling={rolling} color={P_COLORS[currentPlayer]} isDark={isDark}/>
          </div>
          {isDouble&&hasDiced&&<p className="text-center mb-2" style={{fontSize:'0.7rem',color:'#FFB347',fontWeight:700}}>🎯 ¡Doble! +1 turno</p>}
          <motion.button onClick={rollDice}
            disabled={rolling||hasDiced||winner!==null}
            whileHover={!rolling&&!hasDiced?{scale:1.03}:{}}
            whileTap={!rolling&&!hasDiced?{scale:0.97}:{}}
            className="w-full py-2.5 rounded-xl text-sm font-semibold mb-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{
              background:!hasDiced&&winner===null 
                ? `linear-gradient(135deg,${P_COLORS[currentPlayer]},${P_COLORS[currentPlayer]}CC)` 
                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), 
              color:!hasDiced && winner===null ? 'white' : 'var(--p-muted)',
              border: !hasDiced && winner===null ? 'none' : '1px solid var(--p-divider)'
            }}>
            {rolling?'🎲 Tirando…':hasDiced?'✓ Tirado':'🎲 Tirar dados'}
          </motion.button>
          {hasDiced&&winner===null&&(
            <button onClick={skipTurn} className="w-full py-1.5 rounded-xl text-xs transition-all hover:opacity-95"
              style={{background:'rgba(255,179,71,0.12)',color:'#FFB347',border:'1px solid rgba(255,179,71,0.25)'}}>
              Pasar turno →
            </button>
          )}
        </div>


        {/* Log */}
        <div className="rounded-2xl p-3 border flex-1 overflow-hidden" style={{background:'var(--p-card)',borderColor:'var(--p-divider)'}}>
          <p style={{fontWeight:600,fontSize:'0.75rem',marginBottom:'6px',color:'var(--p-muted)'}}>Historial</p>
          <div className="overflow-y-auto space-y-1" style={{maxHeight:180}}>
            {log.map((m,i)=>(
              <p key={i} style={{fontSize:'0.65rem',color:m.includes('Turno')?'#7FE7C4':m.includes('🏆')?'#FFB347':'var(--p-sub)',
                padding:'3px 6px',borderRadius:6,background:'rgba(108,99,255,0.05)',lineHeight:1.4}}>
                {m}
              </p>
            ))}
          </div>
        </div>

        <button onClick={reset} className="py-2 rounded-xl text-sm font-medium"
          style={{background:winner!==null?'#7FE7C4':'rgba(108,99,255,0.1)',color:winner!==null?'#0F0E1A':'var(--p-muted)'}}>
          {winner!==null?'🎮 Nueva partida':'🔄 Reiniciar'}
        </button>

        {/* Legend */}
        <div className="rounded-xl p-2.5 border" style={{background:'var(--p-card)',borderColor:'rgba(108,99,255,0.1)'}}>
          {['Tira los dados','Click en ficha para mover','5 o dobles = salir de casa','⭐ = casilla segura'].map(t=>(
            <p key={t} style={{fontSize:'0.6rem',color:'var(--p-muted)',marginBottom:2}}>• {t}</p>
          ))}
        </div>
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {winner!==null&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="absolute inset-0 flex items-center justify-center"
            style={{background:'rgba(0,0,0,0.6)',zIndex:50,borderRadius:16}}>
            <motion.div initial={{scale:0.5}} animate={{scale:1}} transition={{type:'spring',stiffness:300}}
              className="text-center p-8 rounded-3xl border"
              style={{background:'rgba(26,24,41,0.98)',borderColor:P_COLORS[winner],boxShadow:`0 0 60px ${P_COLORS[winner]}40`}}>
              <div className="text-5xl mb-3">🏆</div>
              <h2 style={{fontWeight:800,fontSize:'1.6rem',color:P_COLORS[winner],marginBottom:6}}>¡{P_NAMES[winner]} ganó!</h2>
              <p style={{color:'var(--p-muted)',marginBottom:16,fontSize:'0.85rem'}}>Todas las fichas llegaron a la meta</p>
              <button onClick={reset} className="px-8 py-3 rounded-2xl font-semibold"
                style={{background:P_COLORS[winner],color:'white'}}>
                🎮 Nueva partida
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
