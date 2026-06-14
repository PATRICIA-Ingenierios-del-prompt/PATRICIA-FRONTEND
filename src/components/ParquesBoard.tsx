import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const P_COLORS = ['#6C63FF', '#00D9FF', '#7FE7C4', '#FF6B9D'] as const;
const P_NAMES  = ['Tú', 'Felipe', 'Sofía', 'Andrés'] as const;

type CellType = 'corner' | 'home' | 'path' | 'safe' | 'center' | 'arrow' | 'empty';
interface Cell { type: CellType; color?: string }

function buildBoard(): Cell[][] {
  const N = 15;
  const b: Cell[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => ({ type: 'empty' as CellType }))
  );

  // Corner home zones (6×6)
  const zones: [number, number, number][] = [[0,0,0],[0,9,1],[9,0,2],[9,9,3]];
  zones.forEach(([r,c,pi]) => {
    for (let dr=0;dr<6;dr++) for (let dc=0;dc<6;dc++) b[r+dr][c+dc]={type:'corner',color:P_COLORS[pi]};
    // 2×2 piece home inside
    for (let dr=2;dr<4;dr++) for (let dc=2;dc<4;dc++) b[r+dr][c+dc]={type:'home',color:P_COLORS[pi]};
  });

  // White path cells
  for (let r=0;r<=5;r++) for (let c=6;c<=8;c++) b[r][c]={type:'path'};
  for (let r=9;r<=14;r++) for (let c=6;c<=8;c++) b[r][c]={type:'path'};
  for (let r=6;r<=8;r++) for (let c=0;c<=5;c++) b[r][c]={type:'path'};
  for (let r=6;r<=8;r++) for (let c=9;c<=14;c++) b[r][c]={type:'path'};

  // Safe squares
  [[2,6,0],[6,2,2],[12,8,2],[8,12,3],[2,8,1],[6,12,1],[12,6,3],[8,2,0]].forEach(([r,c,pi])=>{
    b[r][c]={type:'safe',color:P_COLORS[pi]};
  });

  // Home columns (colored arrow path to center)
  for (let r=1;r<=5;r++) b[r][7]={type:'arrow',color:P_COLORS[0]};
  for (let c=9;c<=13;c++) b[7][c]={type:'arrow',color:P_COLORS[1]};
  for (let c=1;c<=5;c++) b[7][c]={type:'arrow',color:P_COLORS[2]};
  for (let r=9;r<=13;r++) b[r][7]={type:'arrow',color:P_COLORS[3]};

  // Center 3×3
  for (let r=6;r<=8;r++) for (let c=6;c<=8;c++) b[r][c]={type:'center'};

  return b;
}

const BOARD = buildBoard();

// 52-cell clockwise track
const TRACK: [number,number][] = [
  [6,0],[5,0],[4,0],[3,0],[2,0],[1,0],[0,0],
  [0,1],[0,2],[0,3],[0,4],[0,5],
  [0,6],[0,7],[0,8],
  [0,9],[0,10],[0,11],[0,12],[0,13],[0,14],
  [1,14],[2,14],[3,14],[4,14],[5,14],
  [6,14],[7,14],[8,14],
  [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],
  [14,13],[14,12],[14,11],[14,10],[14,9],
  [14,8],[14,7],[14,6],
  [14,5],[14,4],[14,3],[14,2],[14,1],[14,0],
  [13,0],[12,0],[11,0],[10,0],[9,0],
  [8,0],[7,0],
];

// Starting home positions for each player's 4 pieces
const HOME_CELLS: [number,number][][] = [
  [[1,1],[1,4],[4,1],[4,4]],
  [[1,10],[1,13],[4,10],[4,13]],
  [[10,1],[10,4],[13,1],[13,4]],
  [[10,10],[10,13],[13,10],[13,13]],
];

// Start squares on the track per player
const START_POS = [0, 13, 26, 39];

// Dice faces
const DOTS: Record<number,[number,number][]> = {
  1:[[50,50]],
  2:[[25,25],[75,75]],
  3:[[25,25],[50,50],[75,75]],
  4:[[25,25],[75,25],[25,75],[75,75]],
  5:[[25,25],[75,25],[50,50],[25,75],[75,75]],
  6:[[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]],
};

function DiceFace({v,rolling,color}:{v:number;rolling:boolean;color:string}) {
  return (
    <motion.div
      animate={rolling?{rotate:[0,120,240,360],scale:[1,1.15,0.9,1]}:{}}
      transition={{duration:0.45,repeat:rolling?Infinity:0}}
      className="rounded-xl border-2 flex items-center justify-center"
      style={{width:50,height:50,background:'#FAFAFA',borderColor:color,boxShadow:`0 2px 12px ${color}50`}}>
      <svg width="38" height="38" viewBox="0 0 100 100">
        {(DOTS[v]||[]).map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={9} fill={color}/>)}
      </svg>
    </motion.div>
  );
}

interface Piece {id:number;player:number;trackPos:number} // -1=home, 0-51=track, 100=done

export function ParquesBoard() {
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
        newPieces=newPieces.map(p=>p.id===piece.id?{...p,trackPos:START_POS[piece.player]}:p);
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
    return TRACK[piece.trackPos%52];
  };

  const CELL=33;
  const renderCell=(cell:Cell,r:number,c:number)=>{
    if (cell.type==='empty') return <div key={`${r}-${c}`}/>;

    const cellPieces=pieces.filter(p=>{
      const pos=getBoardPos(p);
      return pos&&pos[0]===r&&pos[1]===c;
    });

    let bg='#FFFFFF';
    let border='#D0CFFF';
    if (cell.type==='corner') { bg=cell.color!+'20'; border=cell.color!+'50'; }
    if (cell.type==='home')   { bg=cell.color!; border=cell.color!; }
    if (cell.type==='safe')   { bg=cell.color!+'40'; border=cell.color!; }
    if (cell.type==='arrow')  { bg=cell.color!+'30'; border=cell.color!+'70'; }
    if (cell.type==='center') {
      const centerColors=['#6C63FF','#00D9FF','#7FE7C4','#FF6B9D'];
      const ci=r===6&&c===6?0:r===6&&c===8?1:r===8&&c===6?2:r===8&&c===8?3:4;
      bg = ci<4 ? centerColors[ci]+'60' : 'linear-gradient(135deg,#6C63FF40,#7FE7C440)';
    }

    const isMovable=(p:Piece)=>p.player===currentPlayer&&hasDiced&&winner===null;

    return (
      <div key={`${r}-${c}`} className="relative flex items-center justify-center"
        style={{background:bg,border:`1px solid ${border}`,width:'100%',height:'100%',borderRadius:2}}>
        {cell.type==='safe'&&<span style={{position:'absolute',top:1,right:1,fontSize:'0.5rem',opacity:0.9}}>⭐</span>}
        {cell.type==='center'&&r===7&&c===7&&<span style={{fontSize:'0.9rem'}}>🏠</span>}
        {cell.type==='arrow'&&<div className="w-1.5 h-1.5 rounded-full opacity-60" style={{background:cell.color}}/>}
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 flex-wrap p-0.5">
          {cellPieces.slice(0,4).map(piece=>{
            const sz = cellPieces.length>2 ? 9 : 13;
            const dotSz = Math.max(2, Math.round(sz * 0.28));
            const movable = isMovable(piece);
            return (
              <motion.div key={piece.id}
                whileHover={movable?{scale:1.5, y:-1}:{}}
                whileTap={movable?{scale:0.88}:{}}
                onClick={()=>movable&&movePiece(piece)}
                className="rounded-full relative flex items-center justify-center"
                style={{
                  width:sz, height:sz,
                  background:`radial-gradient(circle at 35% 30%, ${P_COLORS[piece.player]}FF, ${P_COLORS[piece.player]}99)`,
                  border:`${sz > 10 ? 2 : 1.5}px solid rgba(255,255,255,0.85)`,
                  cursor:movable?'pointer':'default',
                  boxShadow: movable
                    ? `0 2px 8px ${P_COLORS[piece.player]}CC, 0 0 12px ${P_COLORS[piece.player]}66`
                    : `0 1px 4px rgba(0,0,0,0.5)`,
                  zIndex:10,
                  transition:'box-shadow 0.2s',
                }}>
                {/* Inner highlight dot */}
                <div style={{
                  width:dotSz, height:dotSz,
                  borderRadius:'50%',
                  background:'rgba(255,255,255,0.55)',
                  position:'absolute',
                  top:'22%', left:'22%',
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
    <div className="flex gap-5 h-full overflow-auto p-4">
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

        {/* Grid */}
        <div style={{
          display:'grid',
          gridTemplateColumns:`repeat(15,${CELL}px)`,
          gridTemplateRows:`repeat(15,${CELL}px)`,
          gap:1,
          background:'var(--p-card)',
          padding:3,
          borderRadius:12,
          border:'2px solid rgba(108,99,255,0.4)',
          boxShadow:'0 8px 32px rgba(108,99,255,0.2)',
        }}>
          {BOARD.map((row,r)=>row.map((cell,c)=>renderCell(cell,r,c)))}
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
        <div className="rounded-2xl p-4 border" style={{background:'var(--p-card)',borderColor:'rgba(108,99,255,0.2)'}}>
          <div className="flex gap-2 justify-center mb-3">
            <DiceFace v={dice[0]} rolling={rolling} color={P_COLORS[currentPlayer]}/>
            <DiceFace v={dice[1]} rolling={rolling} color={P_COLORS[currentPlayer]}/>
          </div>
          {isDouble&&hasDiced&&<p className="text-center mb-2" style={{fontSize:'0.7rem',color:'#FFB347',fontWeight:700}}>🎯 ¡Doble! +1 turno</p>}
          <motion.button onClick={rollDice}
            disabled={rolling||hasDiced||winner!==null}
            whileHover={!rolling&&!hasDiced?{scale:1.03}:{}}
            whileTap={!rolling&&!hasDiced?{scale:0.97}:{}}
            className="w-full py-2.5 rounded-xl text-sm font-semibold mb-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{background:!hasDiced&&winner===null?`linear-gradient(135deg,${P_COLORS[currentPlayer]},${P_COLORS[currentPlayer]}90)`:'var(--p-divider)',color:!hasDiced?'white':'var(--p-muted)'}}>
            {rolling?'🎲 Tirando…':hasDiced?'✓ Tirado':'🎲 Tirar dados'}
          </motion.button>
          {hasDiced&&winner===null&&(
            <button onClick={skipTurn} className="w-full py-1.5 rounded-xl text-xs"
              style={{background:'rgba(255,179,71,0.1)',color:'#FFB347',border:'1px solid rgba(255,179,71,0.2)'}}>
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
