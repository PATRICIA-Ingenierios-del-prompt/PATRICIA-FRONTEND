import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Users, Lock, Globe, Mic, MicOff, Send, Smile,
  Settings, Search, Crown, Shield, X, MessageCircle, FileText,
  Layers, Gamepad2, Volume2, VolumeX, MoreHorizontal,
  Phone, PhoneOff, Download, Video, VideoOff, Monitor, MonitorOff, ArrowLeft, ChevronRight, ChevronLeft,
  KeyRound, LogOut, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ParquesBoard } from '../components/ParquesBoard';
import monoCoderImg    from '../assets/monoCoderN.png';
import monoDJImg       from '../assets/monoDJN.png';
import monoArteImg     from '../assets/monoArteN.png';
import monoCientImg    from '../assets/monoCientificoN.png';
import monoCultImg     from '../assets/monoCulturaN.png';
import monoPatriciaImg from '../assets/monoFondoU.png';
import { useBoard } from '../hooks/useBoard';
import { Stroke, Point } from '../types/board';
import { addToast } from '../components/ToastSystem';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useReports, type ReportCategory } from '../store/ReportsContext';
import { friendlyError } from '../lib/errorMessages';
import { parcheService } from '../services/parcheService';
import { CATEGORY_META, ALL_CATEGORIES } from '../lib/maps';
import type { ParcheSummaryResponse, EventCategory } from '../types/patricia';
import { ComunicacionSocket, type ChatMessage, type VoiceEvent, type VoiceSignalPayload } from '../services/comunicacionSocket';
import { apiClient } from '../services/apiClient';

/** Render-ready parche derived from the backend summary. */
interface UiParche {
  id: string; name: string; emoji: string; color: string; pictureUrl?: string;
  type: 'public' | 'private'; category: string;
  live: number; unread: number; memberCount: number; maxCapacity: number;
}
const EMPTY_PARCHE: UiParche = { id: '', name: '', emoji: '✨', color: '#6C63FF', type: 'public', category: 'VARIETY', live: 0, unread: 0, memberCount: 0, maxCapacity: 0 };
function toUiParche(p: ParcheSummaryResponse): UiParche {
  const meta = CATEGORY_META[p.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.VARIETY;
  return { id: p.parcheId, name: p.name, emoji: meta.emoji, color: meta.color, pictureUrl: p.pictureUrl || undefined, type: p.visibility === 'PRIVATE' ? 'private' : 'public', category: p.category, live: 0, unread: 0, memberCount: p.memberCount, maxCapacity: p.maxCapacity };
}

/** Profile picture when set, category emoji otherwise — same slot either way. */
function ParcheAvatar({ parche, size, rounded = 'full', textSize }: { parche: UiParche; size: number; rounded?: 'full' | '2xl'; textSize: string }) {
  const radius = rounded === 'full' ? '9999px' : '1rem';
  if (parche.pictureUrl) {
    return (
      <img src={parche.pictureUrl} alt={parche.name} referrerPolicy="no-referrer"
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }} />
    );
  }
  return (
    <div className="flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, borderRadius: radius, fontSize: textSize, background: `${parche.color}20` }}>
      {parche.emoji}
    </div>
  );
}

type InteriorTab = 'chat' | 'archivos' | 'lienzo' | 'juegos' | 'voz';
type GameId = null | 'parques';

const PARCHE_CATEGORIES = [
  { id:'estudio',    label:'Estudio',    emoji:'📚', color:'#6C63FF',
    subcategories:[
      'Programación','Cálculos','Estructuras','Física','Química','Cultura',
      'Ingeniería Civil','Ingeniería Eléctrica','Ingeniería de Sistemas',
      'Ingeniería Industrial','Ingeniería Electrónica','Economía',
      'Administración de Empresas','Matemáticas','Ingeniería Mecánica',
      'Ingeniería Biomédica','Ingeniería Ambiental','Ingeniería Estadística',
      'Ingeniería de Inteligencia Artificial','Ingeniería de Ciberseguridad',
      'Ingeniería en Biotecnología',
    ] },
  { id:'musica',     label:'Música',     emoji:'🎵', color:'#FF6B9D', subcategories:[] },
  { id:'recreacion', label:'Recreación', emoji:'🌿', color:'#7FE7C4', subcategories:[] },
  { id:'relajacion', label:'Relajación', emoji:'🧘', color:'#A78BFA', subcategories:[] },
  { id:'juegos',     label:'Juegos',     emoji:'🎮', color:'#5BC8FF', subcategories:[] },
  { id:'arte',       label:'Arte',       emoji:'🎨', color:'#FF9BAE', subcategories:[] },
  { id:'comida',     label:'Comida',     emoji:'🍕', color:'#FFB347', subcategories:[] },
  { id:'deporte',    label:'Deporte',    emoji:'⚽', color:'#4ADE80', subcategories:[] },
];

const INIT_MESSAGES = [
  { id:1, userId:'VT', user:'Valentina T.',  text:'¿Alguien tiene los apuntes del tema 5 de integrales dobles?',    time:'10:23', reactions:[{emoji:'👍',count:3},{emoji:'❤️',count:1}], type:'text' },
  { id:2, userId:'SM', user:'Santiago M.',   text:'¡Yo los tengo! Los subo en un momento 📄',                       time:'10:25', reactions:[], type:'text' },
  { id:3, userId:'ME', user:'Tú',            text:'También tengo los ejercicios del parcial anterior si los necesitan', time:'10:26', reactions:[{emoji:'🙏',count:4}], type:'text' },
  { id:4, userId:'SM', user:'Santiago M.',   text:'https://drive.google.com/file/apuntes-t5',                      time:'10:28', reactions:[], type:'link' },
  { id:5, userId:'IR', user:'Isabela R.',    text:'¡Gracias Santiago! Justo lo que necesitaba 🙏',                  time:'10:30', reactions:[{emoji:'❤️',count:2}], type:'text' },
  { id:6, userId:'ME', user:'Tú',            text:'¿Hacemos parche de estudio el miércoles en la biblio?',          time:'10:32', reactions:[{emoji:'✅',count:3},{emoji:'🔥',count:2}], type:'text' },
  { id:7, userId:'VT', user:'Valentina T.',  text:'👍 Yo puedo a las 3pm',                                          time:'10:33', reactions:[], type:'text' },
  { id:8, userId:'SM', user:'Santiago M.',   text:'¡Yo llego a las 4! Nos vemos ahí 🎯',                           time:'10:35', reactions:[], type:'text' },
];

const LINKS_DATA = [
  { name:'Apuntes Tema 5 — Integrales Dobles', url:'https://drive.google.com/file/apuntes-t5', sharedBy:'Santiago M.', date:'Hoy 10:28',    icon:'📄', color:'#FF4D6A' },
  { name:'Ejercicios Parcial 1',               url:'https://docs.google.com/ejercicios-p1',   sharedBy:'Valentina T.', date:'Ayer',          icon:'📋', color:'#FFB347' },
  { name:'Tabla de Integrales (imagen)',        url:'https://drive.google.com/file/tabla-int', sharedBy:'Isabel R.',    date:'Hace 3 días',   icon:'🖼️', color:'#6C63FF' },
  { name:'Temario Cálculo III',                url:'https://docs.google.com/temario-calc3',   sharedBy:'Tú',           date:'Hace 1 semana', icon:'📝', color:'#7FE7C4' },
  { name:'Ejercicios Extra Cap. 4',            url:'https://drive.google.com/file/ej-extra',  sharedBy:'Andrés C.',    date:'Hace 1 semana', icon:'📄', color:'#A78BFA' },
  { name:'Video clase — Transformada Laplace', url:'https://youtube.com/watch?v=laplace-eci', sharedBy:'Prof. García', date:'Hace 2 semanas',icon:'🎬', color:'#FF6B9D' },
];

const MEMBERS_DATA = [
  { name:'Valentina Torres', avatar:'VT', role:'admin',  status:'online',  gradient:'linear-gradient(135deg,#6C63FF,#FF6B9D)', mono: monoCoderImg },
  { name:'Santiago Méndez',  avatar:'SM', role:'mod',    status:'online',  gradient:'linear-gradient(135deg,#7FE7C4,#6C63FF)', mono: monoDJImg },
  { name:'Isabela Ramos',    avatar:'IR', role:'member', status:'away',    gradient:'linear-gradient(135deg,#FFB347,#FF6B9D)', mono: monoArteImg },
  { name:'Carlos Ruiz',      avatar:'CR', role:'member', status:'offline', gradient:'linear-gradient(135deg,#A78BFA,#5BC8FF)', mono: monoCientImg },
  { name:'María González',   avatar:'MG', role:'member', status:'online',  gradient:'linear-gradient(135deg,#FF6B9D,#FFB347)', mono: monoCultImg },
  { name:'Tú',               avatar:'ME', role:'member', status:'online',  gradient:'linear-gradient(135deg,#6C63FF,#7FE7C4)', mono: monoPatriciaImg },
];

const STATUS_COLOR: Record<string, string> = { online:'#7FE7C4', away:'#FFB347', offline:'#4A4468' };
const QUICK_REACTIONS = ['👍','❤️','😂','🔥','🙏','✅','👏','😮'];

// ── useBoard error surfacing in CollabCanvas ──
function CollabCanvas({ parcheId }: { parcheId: number }) {
  const { boardId, strokes, remoteCursors, isConnected, error: boardError, sendStroke, sendCursor, clearBoard } = useBoard(parcheId, 'ME');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6C63FF');
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const currentPoints = useRef<Point[]>([]);
  const lastCursorSend = useRef<number>(0);
  
  const COLORS = ['#6C63FF', '#7FE7C4', '#FF6B9D', '#FFB347', '#5BC8FF', '#E0E0FF', '#FF4D6A', '#A78BFA'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(s => {
      if (s.points.length === 0) return;
      ctx.beginPath();
      if (s.color === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = s.width;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      if (s.points.length === 1) {
        ctx.lineTo(s.points[0].x, s.points[0].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    });
  }, [strokes]);

  // Scale from CSS coords to canvas internal coords
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    if ('touches' in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
    }
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };

  const drawSegment = (from: Point, to: Point, isEraser: boolean, pColor: string, pSize: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = pSize * 5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = pColor;
      ctx.lineWidth = pSize;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) e.preventDefault();
    const pos = getPos(e);
    setIsDrawing(true);
    lastPos.current = pos;
    currentPoints.current = [pos];
    drawSegment(pos, pos, tool === 'eraser', color, size);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) e.preventDefault();
    const pos = getPos(e);
    
    const now = Date.now();
    if (now - lastCursorSend.current > 33) {
      sendCursor({ userId: 'ME', x: pos.x, y: pos.y });
      lastCursorSend.current = now;
    }

    if (!isDrawing || !lastPos.current) return;
    drawSegment(lastPos.current, pos, tool === 'eraser', color, size);
    lastPos.current = pos;
    currentPoints.current.push(pos);
  };

  const stopDraw = () => {
    if (isDrawing && currentPoints.current.length > 0) {
      const newStroke: Stroke = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        color: tool === 'eraser' ? 'eraser' : color,
        width: tool === 'eraser' ? size * 5 : size,
        points: [...currentPoints.current]
      };
      sendStroke(newStroke);
    }
    setIsDrawing(false); 
    lastPos.current = null; 
    currentPoints.current = [];
  };

  const clear = () => {
    clearBoard();
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center gap-3 p-3 border-b flex-wrap flex-shrink-0"
        style={{ background: 'var(--p-card)', borderColor: 'var(--p-divider)' }}>
        {/* Color palette */}
        <div className="flex gap-1.5 flex-wrap">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool('pen'); }}
              className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
              style={{ background: c, borderColor: color === c && tool === 'pen' ? 'white' : 'rgba(255,255,255,0.15)', boxShadow: color === c && tool === 'pen' ? `0 0 0 2px ${c}` : 'none' }} />
          ))}
        </div>
        <div className="w-px h-5 flex-shrink-0" style={{ background: 'rgba(108,99,255,0.2)' }} />
        {/* Tool toggle */}
        <button onClick={() => setTool(t => t === 'eraser' ? 'pen' : 'eraser')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0"
          style={{ background: tool === 'eraser' ? 'rgba(108,99,255,0.28)' : 'rgba(108,99,255,0.1)', color: tool === 'eraser' ? '#A89BFF' : 'var(--p-muted)' }}>
          {tool === 'eraser' ? '⬜ Borrador' : '✏️ Pluma'}
        </button>
        {/* Size slider */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="rounded-full bg-current flex-shrink-0" style={{ width: Math.max(4, size), height: Math.max(4, size), background: tool === 'eraser' ? 'var(--p-muted)' : color }} />
          <input type="range" min={2} max={24} value={size} onChange={e => setSize(+e.target.value)}
            className="w-20 h-1.5" style={{ accentColor: '#6C63FF' }} />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(127,231,196,0.1)' }}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'animate-pulse' : ''}`} style={{ background: isConnected ? '#7FE7C4' : '#FF4D6A' }} />
            <span style={{ fontSize: '0.7rem', color: isConnected ? '#7FE7C4' : '#FF4D6A' }}>
              {isConnected ? `${Object.keys(remoteCursors).length + 1} colaborando` : 'Desconectado'}
            </span>
          </div>
          <button onClick={clear} className="px-3 py-1.5 rounded-lg text-xs hover:opacity-80"
            style={{ background: 'rgba(255,77,106,0.1)', color: '#FF4D6A' }}>
            Limpiar
          </button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--p-card)' }}>
        {boardError && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg"
            style={{ background: 'rgba(255,77,106,0.12)', borderColor: 'rgba(255,77,106,0.35)', maxWidth: '90%' }}>
            <span style={{ fontSize: '0.9rem' }}>⚠️</span>
            <p style={{ fontSize: '0.78rem', color: '#FF4D6A' }}>Error de conexión con el lienzo: {boardError}</p>
          </div>
        )}
        {Object.values(remoteCursors).map(cursor => (
          <div key={cursor.userId}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
              pointerEvents: 'none',
              zIndex: 10,
              transition: 'transform 0.05s linear'
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.65376 21.5034L3 3L21.8496 11.2335L13.1254 13.9234L5.65376 21.5034Z" fill="#FFB347" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <div style={{ background: '#FFB347', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '8px', position: 'absolute', top: 20, left: 10, whiteSpace: 'nowrap' }}>
              {cursor.userId}
            </div>
          </div>
        ))}
        <canvas
          ref={canvasRef}
          width={1400}
          height={700}
          className="w-full h-full"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none', display: 'block' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
    </div>
  );
}



function ReportModal({ memberName, parcheName, onClose }: { memberName:string; parcheName:string; onClose:()=>void }) {
  const { addReport } = useReports();
  const [reason, setReason] = useState<ReportCategory | ''>('');
  const [description, setDescription] = useState('');
  const canSubmit = !!reason && description.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addReport({ reportedUserName: memberName, parcheName, category: reason as ReportCategory, description: description.trim() });
    addToast({ type: 'reporte', title: 'Reporte enviado', message: 'Gracias, nuestro equipo lo revisará pronto.' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 w-96 border" style={{ background:'var(--p-card)', borderColor:'rgba(255,77,106,0.3)' }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontWeight:700, marginBottom:'4px' }}>Denunciar a {memberName}</h3>
        <p style={{ fontSize:'0.8rem', color:'var(--p-muted)', marginBottom:'16px' }}>Tu reporte es anónimo</p>
        <div className="space-y-2 mb-4">
          {(['Comportamiento inapropiado','Spam o publicidad','Contenido ofensivo','Acoso o bullying','Otro'] as ReportCategory[]).map(r=>(
            <button key={r} onClick={()=>setReason(r)}
              className="w-full text-left px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: reason===r ? 'rgba(255,77,106,0.15)' : 'rgba(108,99,255,0.06)', color: reason===r ? '#FF4D6A' : 'var(--p-sub)', border:`1px solid ${reason===r ? 'rgba(255,77,106,0.3)' : 'rgba(108,99,255,0.1)'}` }}>
              {r}
            </button>
          ))}
        </div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Cuéntanos qué pasó..."
          rows={3}
          className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none mb-4"
          style={{ background:'var(--p-input)', color:'var(--p-text)', border:'1px solid rgba(108,99,255,0.15)' }}
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background:'var(--p-input)', color:'var(--p-muted)' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background:'#FF4D6A', color:'white', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

const M_DAYS  = ['LUN','MAR','MIÉ','JUE','VIE','SÁB'];
const M_SLOTS = ['8-10','10-12','12-14','14-16','16-18','18-20'];
function memberSched(name: string): Set<string> {
  const seed = name.charCodeAt(0) % 3;
  const patterns = [
    ['0-1','0-2','1-0','2-1','3-0','4-2'],
    ['0-0','1-2','2-0','3-1','4-0','4-2'],
    ['1-1','2-2','3-0','3-2','4-1','4-3'],
  ];
  const s = new Set<string>();
  patterns[seed].forEach(k => s.add(k));
  return s;
}

export function ParchesView({ linkedEvents = [] }: {
  linkedEvents?: Array<{ parcheId: number; eventTitle: string; eventEmoji: string; eventDate: string }>;
}) {
  const t = useTheme();
  const { userId: meId } = useAuth();
  // Real data: public parches (browse) + my memberships (from /api/parches/me).
  const [publicos, setPublicos] = useState<UiParche[]>([]);
  const [mine, setMine] = useState<UiParche[]>([]);
  const [scope, setScope] = useState<'public' | 'private'>('public');
  const [joinCode, setJoinCode] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'ALL' | EventCategory>('ALL');
  const [openOnly, setOpenOnly] = useState(false);
  const [parcheEventCount, setParcheEventCount] = useState(0);
  const [selectedParche, setSelectedParche] = useState<UiParche>(EMPTY_PARCHE);
  const [activeTab, setActiveTab] = useState<InteriorTab>('chat');
  const [showMembers, setShowMembers] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [reportMember, setReportMember] = useState<string|null>(null);
  const [viewMemberProfile, setViewMemberProfile] = useState<typeof MEMBERS_DATA[0] | null>(null);
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [msgInput, setMsgInput] = useState('');
  const [hoveredMsg, setHoveredMsg] = useState<number|null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<number|null>(null);
  const [game, setGame] = useState<GameId>(null);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [chatId, setChatId]                     = useState<string | null>(null);
  const [rtMessages, setRtMessages]             = useState<ChatMessage[]>([]);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceEvent[]>([]);
  const socketRef  = useRef<ComunicacionSocket | null>(null);
  const unsubRef   = useRef<(() => void) | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const peers      = useRef<Map<string, RTCPeerConnection>>(new Map());
  const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  const voiceConnectedRef = useRef(false);
  const [voiceCamOn, setVoiceCamOn] = useState(true);
  const [voiceScreenShare, setVoiceScreenShare] = useState(false);
  const [memberMenuOpen, setMemberMenuOpen] = useState<string|null>(null);
  const [inviteModal, setInviteModal] = useState<{ token: string; expiresInSeconds: number } | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [createType, setCreateType] = useState<'public'|'private'>('public');
  const [createCategory, setCreateCategory] = useState<EventCategory>('TECHNOLOGY');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCapacity, setCreateCapacity] = useState('');
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [categoryCanScrollRight, setCategoryCanScrollRight] = useState(false);
  const [categoryCanScrollLeft, setCategoryCanScrollLeft] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const updateScrollState = () => {
      setCategoryCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
      setCategoryCanScrollLeft(el.scrollLeft > 8);
    };
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => { el.removeEventListener('scroll', updateScrollState); window.removeEventListener('resize', updateScrollState); };
  }, []);

  const scrollCategories = (dir: 1 | -1) => {
    categoryScrollRef.current?.scrollBy({ left: 120 * dir, behavior: 'smooth' });
  };

  /* ── real data: público browse (via filter endpoints) + my memberships ── */
  const loadPublicos = useCallback(async () => {
    const s = search.trim();
    try {
      // Route to the most specific filter endpoint, then compose the rest client-side
      // and keep only PUBLIC (parche filter endpoints are NOT visibility-scoped).
      const res = s ? await parcheService.byName(s) : openOnly ? await parcheService.openSpots() : catFilter !== 'ALL' ? await parcheService.byCategory(catFilter) : await parcheService.byVisibility('PUBLIC');
      let items = res.content.map(toUiParche).filter(p => p.type === 'public');
      if (catFilter !== 'ALL') items = items.filter(p => p.category === catFilter);
      if (openOnly) items = items.filter(p => p.memberCount < p.maxCapacity);
      if (s) items = items.filter(p => p.name.toLowerCase().includes(s.toLowerCase()));
      setPublicos(items);
    } catch { setPublicos([]); }
  }, [search, openOnly, catFilter]);
  const loadMine = useCallback(async () => {
    try { setMine((await parcheService.mine()).content.map(toUiParche)); } catch { /* ignore */ }
  }, []);
  useEffect(() => { void loadMine(); }, [loadMine]);
  useEffect(() => {
    setLoadingList(true);
    const timer = setTimeout(() => { void loadPublicos().finally(() => setLoadingList(false)); }, 250);
    return () => clearTimeout(timer);
  }, [loadPublicos]);

  const membershipIds = new Set(mine.map(p => p.id));
  const isMember = (p: UiParche) => !!p.id && membershipIds.has(p.id);
  const privateSearch = search.trim().toLowerCase();
  const list = scope === 'public' ? publicos : mine.filter(p => p.type === 'private' && (!privateSearch || p.name.toLowerCase().includes(privateSearch)));

  const joinPublic = async (p: UiParche) => {
    try { await parcheService.join(p.id); addToast({ type: 'logro', title: '¡Te uniste!', message: p.name }); await loadMine(); }
    catch (e: any) { addToast({ type: 'reporte', title: 'No se pudo unir', message: friendlyError(e, 'No te pudimos unir al parche. Intenta de nuevo.') }); }
  };
  const joinByCode = async () => {
    const code = joinCode.trim();
    if (!code) return;
    try { await parcheService.acceptInvite(code); addToast({ type: 'logro', title: '¡Te uniste al parche privado!', message: 'Código aceptado.' }); setJoinCode(''); await loadMine(); setScope('private'); }
    catch (e: any) { addToast({ type: 'reporte', title: 'Código inválido', message: friendlyError(e, 'Ese código no es válido. Verifícalo e intenta de nuevo.') }); }
  };
  const leaveParche = async (p: UiParche) => {
    if (!meId) return;
    try { await parcheService.removeMember(p.id, meId); addToast({ type: 'info', title: 'Saliste del parche', message: p.name }); setSelectedParche(EMPTY_PARCHE); await Promise.all([loadMine(), loadPublicos()]); }
    catch (e: any) { addToast({ type: 'reporte', title: 'No se pudo salir', message: friendlyError(e, 'No te pudimos sacar del parche. Intenta de nuevo.') }); }
  };
  const generateInvite = async (p: UiParche) => {
    setInviteLoading(true);
    try { const r = await parcheService.createInvite({ parcheId: p.id }); setInviteCopied(false); setInviteModal({ token: r.token, expiresInSeconds: r.expiresInSeconds }); }
    catch (e: any) { addToast({ type: 'reporte', title: 'No se pudo generar', message: friendlyError(e, 'No se pudo generar el código. Intenta de nuevo.') }); }
    finally { setInviteLoading(false); }
  };
  const copyInviteCode = async () => {
    if (!inviteModal) return;
    try { await navigator.clipboard.writeText(inviteModal.token); setInviteCopied(true); }
    catch {
      // Clipboard API can fail (permissions/insecure context) — fallback selection
      const ta = document.createElement('textarea'); ta.value = inviteModal.token; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); setInviteCopied(true); } finally { document.body.removeChild(ta); }
    }
  };
  const deleteParcheHandler = async (p: UiParche) => {
    try { await parcheService.remove(p.id); addToast({ type: 'info', title: 'Parche eliminado', message: p.name }); setSelectedParche(EMPTY_PARCHE); await Promise.all([loadMine(), loadPublicos()]); }
    catch (e: any) { addToast({ type: 'reporte', title: 'No se pudo eliminar', message: friendlyError(e, 'No se pudo eliminar el parche. Intenta de nuevo.') }); }
  };
  const createParcheHandler = async () => {
    if (!createName.trim()) { setCreateError('Ponle un nombre al parche.'); return; }
    setCreateSaving(true); setCreateError(null);
    try {
      let pictureUrl: string | undefined;
      if (createFile) {
        try {
          const { uploadToPresignedPost } = await import('../services/uploads');
          const pre = await parcheService.requestPictureUpload({ contentType: createFile.type, fileSize: createFile.size });
          pictureUrl = await uploadToPresignedPost(pre, createFile);
        } catch { addToast({ type: 'info', title: 'Imagen omitida', message: 'No se pudo subir la imagen; se creó sin foto.' }); }
      }
      const created = await parcheService.create({ name: createName.trim(), description: createDesc.trim(), category: createCategory, maxCapacity: Number(createCapacity) || 10, visibility: createType === 'private' ? 'PRIVATE' : 'PUBLIC', pictureUrl });
      addToast({ type: 'logro', title: '¡Parche creado!', message: created.name });
      setShowCreate(false); setCreateName(''); setCreateDesc(''); setCreateCapacity(''); setCreateFile(null);
      await Promise.all([loadMine(), loadPublicos()]);
    } catch (e: any) { setCreateError(friendlyError(e, 'No se pudo crear el parche. Intenta de nuevo.')); }
    finally { setCreateSaving(false); }
  };

  // Socket init
useEffect(() => {
  const socket = new ComunicacionSocket({
    onConnect: () => console.log('[comms] conectado'),
    onVoiceSignal: handleVoiceSignal,
  });
  socket.activate();
  socketRef.current = socket;
  return () => { socket.deactivate(); };
}, []);

// Cargar chatId y suscribirse cuando cambia el parche
useEffect(() => {
  if (!selectedParche.id) return;
  unsubRef.current?.();
  setRtMessages([]);
  setVoiceParticipants([]);
  setChatId(null);

  let alive = true;
  parcheService.get(selectedParche.id).then(detail => {
    if (!alive) return;
    const cid = (detail as any).communication?.chatId;
    if (!cid) return;
    setChatId(cid);

    // Historial
    apiClient.get(`/api/chat/${cid}/messages?page=0&size=50`)
      .then(r => { if (alive) setRtMessages([...(r.data.content ?? [])].reverse()); })
      .catch(() => {});

    // STOMP
    const unsub = socketRef.current?.subscribeToParche(cid, {
      onMessage: msg => setRtMessages(prev => [...prev, msg]),
      onVoiceEvent: evt => {
        if (evt.signalType === 'JOIN') {
          setVoiceParticipants(prev =>
            prev.find(p => p.senderUserId === evt.senderUserId) ? prev : [...prev, evt]
          );
          if (voiceConnectedRef.current && evt.senderUserId !== meId) initiateOffer(evt.senderUserId, cid);
        } else {
          setVoiceParticipants(prev => prev.filter(p => p.senderUserId !== evt.senderUserId));
          closePeer(evt.senderUserId);
        }
      },
    });
    if (unsub) unsubRef.current = unsub;
  }).catch(() => {});

  return () => { alive = false; unsubRef.current?.(); };
}, [selectedParche.id]);

  // Full detail + linked events for the entered (member) parche.
  useEffect(() => {
    if (!selectedParche.id || !isMember(selectedParche)) { setParcheEventCount(0); return; }
    let alive = true;
    parcheService.get(selectedParche.id).then(d => { if (alive) setSelectedParche(prev => prev.id === selectedParche.id ? { ...prev, memberCount: d.memberCount, maxCapacity: d.maxCapacity } : prev); }).catch(() => {});
    parcheService.getEvents(selectedParche.id).then(ids => { if (alive) setParcheEventCount(ids.length); }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParche.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // ── WebRTC ──
function createPeer(remoteId: string, cid: string): RTCPeerConnection {
  const pc = new RTCPeerConnection(ICE_SERVERS);
  peers.current.set(remoteId, pc);
  localStream.current?.getTracks().forEach(t => pc.addTrack(t, localStream.current!));
  pc.ontrack = evt => {
    let a = document.getElementById(`va-${remoteId}`) as HTMLAudioElement;
    if (!a) { a = Object.assign(document.createElement('audio'), { id: `va-${remoteId}`, autoplay: true }); document.body.appendChild(a); }
    a.srcObject = evt.streams[0];
  };
  pc.onicecandidate = evt => {
    if (evt.candidate) socketRef.current?.sendVoiceSignal(cid, { signalType: 'ICE_CANDIDATE', targetUserId: remoteId, signalData: JSON.stringify(evt.candidate) });
  };
  return pc;
}

async function initiateOffer(remoteId: string, cid: string) {
  const pc = createPeer(remoteId, cid);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socketRef.current?.sendVoiceSignal(cid, { signalType: 'OFFER', targetUserId: remoteId, signalData: JSON.stringify(offer) });
}

async function handleVoiceSignal(signal: VoiceSignalPayload) {
  if (!signal.senderUserId || signal.senderUserId === meId || !chatId) return;
  if (signal.signalType === 'OFFER') {
    const pc = createPeer(signal.senderUserId, chatId);
    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.signalData!)));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current?.sendVoiceSignal(chatId, { signalType: 'ANSWER', targetUserId: signal.senderUserId, signalData: JSON.stringify(answer) });
  } else if (signal.signalType === 'ANSWER') {
    const pc = peers.current.get(signal.senderUserId);
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.signalData!)));
  } else if (signal.signalType === 'ICE_CANDIDATE') {
    const pc = peers.current.get(signal.senderUserId);
    if (pc) await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(signal.signalData!)));
  }
}

function closePeer(uid: string) {
  peers.current.get(uid)?.close(); peers.current.delete(uid);
  document.getElementById(`va-${uid}`)?.remove();
}

const realJoinVoice = async () => {
  if (!chatId) return;
  try {
    localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    setVoiceConnected(true);
    voiceConnectedRef.current = true;
    socketRef.current?.joinVoice(chatId);
  } catch { addToast({ type: 'info', title: 'Micrófono', message: 'Permite el acceso al micrófono' }); }
};

const realLeaveVoice = () => {
  if (chatId) socketRef.current?.leaveVoice(chatId);
  peers.current.forEach((pc, uid) => { pc.close(); document.getElementById(`va-${uid}`)?.remove(); });
  peers.current.clear();
  localStream.current?.getTracks().forEach(t => t.stop());
  localStream.current = null;
  setVoiceConnected(false);
  voiceConnectedRef.current = false;
  setVoiceMuted(false);
  setVoiceParticipants([]);
};

// ── sendMsg real ──

  const sendMsg = () => {
    if (!msgInput.trim()) { addToast({ type: 'info', title: 'Mensaje vacío', message: 'Escribe algo antes de enviar.' }); return; }
    if (chatId && socketRef.current?.connected) {
      socketRef.current.sendMessage(chatId, msgInput);
      setMsgInput('');
    } else {
      addToast({ type: 'info', title: 'Chat conectándose…', message: 'El canal del parche aún no está listo. Intenta en unos segundos.' });
    }
  };

  const addReaction = (msgId:number, emoji:string) => {
    setMessages(prev=>prev.map(m=>{
      if (m.id!==msgId) return m;
      const existing = m.reactions.find(r=>r.emoji===emoji);
      if (existing) return { ...m, reactions: m.reactions.map(r=>r.emoji===emoji ? {...r,count:r.count+1} : r) };
      return { ...m, reactions:[...m.reactions,{emoji,count:1}] };
    }));
    setShowReactionPicker(null);
  };

  const TABS: { id:InteriorTab; label:string; icon:React.ComponentType<any> }[] = [
    { id:'chat',     label: 'Chat',      icon:MessageCircle },
    { id:'archivos', label: 'Archivos',  icon:FileText },
    { id:'lienzo',   label: 'Lienzo',    icon:Layers },
    { id:'juegos',   label: 'Juegos',    icon:Gamepad2 },
    ...(selectedParche.type==='private' ? [{ id:'voz' as InteriorTab, label: 'Voz', icon:Volume2 }] : []),
  ];

  return (
    <div className="h-full overflow-hidden flex relative" style={{ borderRadius:'16px', border:'1px solid rgba(108,99,255,0.15)', overflow:'hidden' }}>

      {/* ── Mobile sidebar overlay backdrop ── */}
      {isMobile && showSidebar && (
        <div className="absolute inset-0 z-30" style={{ background:'rgba(0,0,0,0.5)' }}
          onClick={()=>setShowSidebar(false)} />
      )}

      {/* ── Parches Sidebar ──────────────────────────────────────────────── */}
      {/* Desktop: always in flow. Mobile: absolute overlay, toggle via showSidebar */}
      <div style={{
        width: 256,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--p-divider)',
        background: 'var(--p-card)',
        backdropFilter: 'blur(16px)',
        height: '100%',
        ...(isMobile ? {
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 50,
          transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        } : {
          position: 'relative',
          transform: 'none',
        }),
      }}>

        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor:'var(--p-divider)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <h3 style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--p-text)' }}>Parches</h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background:'var(--p-divider)', color:'#6C63FF' }}>
                {mine.length} unido{mine.length !== 1 ? 's' : ''}
              </span>
              {/* Close button — mobile only */}
              {isMobile && (
                <button onClick={()=>setShowSidebar(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70"
                  style={{ background:'rgba(108,99,255,0.1)' }}>
                  <X size={14} style={{ color:'var(--p-muted)' }} />
                </button>
              )}
            </div>
          </div>
          <div className="relative mb-2.5">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--p-muted)' }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar parche por nombre..." className="w-full rounded-xl pl-8 pr-3 py-2 text-xs outline-none"
              style={{ background:'var(--p-input)', color:'var(--p-text)', border:'1px solid rgba(108,99,255,0.15)' }} />
          </div>
          {/* Públicos / Privados toggle */}
          <div className="flex gap-1 p-0.5 rounded-xl" style={{ background:'var(--p-input)' }}>
            {([['public','Públicos'],['private','Privados']] as const).map(([val,label]) => (
              <button key={val} onClick={()=>setScope(val)}
                className="flex-1 py-1 rounded-lg text-center transition-all"
                style={{ background: scope===val ? '#6C63FF' : 'transparent', color: scope===val ? 'white' : 'var(--p-muted)', fontSize:'0.65rem', fontWeight: scope===val ? 700 : 400 }}>
                {label}
              </button>
            ))}
          </div>
          {/* Filters (Públicos only) — each hits a real filter endpoint */}
          {scope==='public' && (
          <div className="relative mt-2">
            <div ref={categoryScrollRef} className="flex gap-1.5 overflow-x-auto pb-0.5 px-6" style={{ scrollbarWidth:'none' }}>
              <button onClick={()=>setCatFilter('ALL')}
                className="flex-shrink-0 px-2 py-0.5 rounded-full transition-all"
                style={{ background: catFilter==='ALL' ? '#6C63FF' : 'var(--p-input)', color: catFilter==='ALL' ? 'white' : 'var(--p-muted)', fontSize:'0.6rem', fontWeight: catFilter==='ALL' ? 700 : 400 }}>
                Todas
              </button>
              {ALL_CATEGORIES.map(cat => { const m = CATEGORY_META[cat]; return (
                <button key={cat} onClick={()=>setCatFilter(catFilter===cat ? 'ALL' : cat)}
                  className="flex-shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full transition-all"
                  style={{ background: catFilter===cat ? m.color : 'var(--p-input)', color: catFilter===cat ? 'white' : 'var(--p-muted)', fontSize:'0.6rem', fontWeight: catFilter===cat ? 700 : 400 }}>
                  {m.emoji} {m.label}
                </button>
              ); })}
            </div>
            {categoryCanScrollLeft && (
              <>
                <div className="absolute top-0 bottom-0.5 left-6 w-6 pointer-events-none"
                  style={{ background: 'linear-gradient(to left, transparent, var(--p-card))' }} />
                <button onClick={()=>scrollCategories(-1)}
                  className="absolute top-1/2 -translate-y-1/2 left-0 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--p-card)', border: '1px solid rgba(108,99,255,0.3)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                  <ChevronLeft size={12} style={{ color: '#6C63FF' }} />
                </button>
              </>
            )}
            {categoryCanScrollRight && (
              <>
                <div className="absolute top-0 bottom-0.5 right-6 w-6 pointer-events-none"
                  style={{ background: 'linear-gradient(to right, transparent, var(--p-card))' }} />
                <button onClick={()=>scrollCategories(1)}
                  className="absolute top-1/2 -translate-y-1/2 right-0 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--p-card)', border: '1px solid rgba(108,99,255,0.3)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                  <ChevronRight size={12} style={{ color: '#6C63FF' }} />
                </button>
              </>
            )}
          </div>
          )}
          {scope==='public' && (
            <button onClick={()=>setOpenOnly(v=>!v)} className="mt-2 w-full py-1 rounded-lg text-center transition-all"
              style={{ background: openOnly ? 'rgba(127,231,196,0.16)' : 'var(--p-input)', color: openOnly ? '#7FE7C4' : 'var(--p-muted)', fontSize:'0.62rem', fontWeight: openOnly ? 700 : 400, border: `1px solid ${openOnly ? 'rgba(127,231,196,0.4)' : 'transparent'}` }}>
              {openOnly ? '✓ Solo con cupos' : 'Solo con cupos disponibles'}
            </button>
          )}
        </div>

        {/* Join a private parche by code (Privados only) */}
        {scope==='private' && (
          <div className="px-3 py-3 border-b" style={{ borderColor:'var(--p-divider)' }}>
            <p style={{ fontSize:'0.68rem', color:'var(--p-muted)', marginBottom:6, fontWeight:600 }}>Unirme con código</p>
            <div className="flex gap-1.5">
              <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX"
                onKeyDown={e=>{ if(e.key==='Enter') joinByCode(); }}
                className="flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                style={{ background:'var(--p-input)', color:'var(--p-text)', border:'1px solid rgba(108,99,255,0.2)', letterSpacing:'0.06em' }} />
              <button onClick={joinByCode} className="px-3 rounded-lg text-xs font-semibold" style={{ background:'#7FE7C4', color:'#0F0E1A' }}>Unirme</button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingList && <p className="px-4 py-3" style={{ fontSize:'0.72rem', color:'var(--p-muted)' }}>Cargando…</p>}
          {!loadingList && list.length===0 && (
            <p className="px-4 py-3" style={{ fontSize:'0.72rem', color:'var(--p-muted)', lineHeight:1.6 }}>
              {scope==='private' ? 'No estás en ningún parche privado. Únete con un código arriba.' : 'No hay parches públicos disponibles.'}
            </p>
          )}
          {list.map(parche=>{
            const member = isMember(parche);
            return (
            <motion.div key={parche.id} onClick={()=>{ setSelectedParche(parche); setShowSidebar(false); }}
              whileHover={{ x:2 }}
              className="w-full px-3 py-2.5 flex items-center gap-3 text-left group relative transition-all cursor-pointer"
              style={{
                background: selectedParche.id===parche.id ? 'rgba(108,99,255,0.16)' : 'transparent',
                borderLeft:`3px solid ${selectedParche.id===parche.id ? '#6C63FF' : 'transparent'}`,
              }}>
              {/* Icon */}
              <div className="relative flex-shrink-0" style={{ opacity: member ? 1 : 0.75 }}>
                <ParcheAvatar parche={parche} size={40} textSize="1.1rem" />
                {!member && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2"
                    style={{ background:'var(--p-card)', borderColor:'var(--p-card)' }}>
                    <Lock size={9} style={{ color:'var(--p-muted)' }} />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate" style={{ fontSize:'0.85rem', fontWeight:600, color: 'var(--p-text)' }}>
                    {parche.name}
                  </span>
                  {parche.type==='private' ? <Lock size={10} style={{ color:'var(--p-muted)', flexShrink:0 }} /> : <Globe size={10} style={{ color:'#7FE7C4', flexShrink:0 }} />}
                </div>
                <p style={{ fontSize:'0.68rem', color:'var(--p-muted)' }}>{parche.memberCount}/{parche.maxCapacity} miembros{member ? '' : ' · no unido'}</p>
              </div>
              {/* Join button for public non-member parches */}
              {!member && parche.type==='public' && (
                <button onClick={(e)=>{ e.stopPropagation(); joinPublic(parche); }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 hover:opacity-90"
                  style={{ background:'rgba(108,99,255,0.18)', color:'#6C63FF' }}>
                  Unirme
                </button>
              )}
            </motion.div>
          );})}
        </div>

        {/* Create button */}
        <div className="p-3 border-t" style={{ borderColor:'var(--p-divider)' }}>
          <button onClick={()=>setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background:'#7FE7C4', color:'#0F0E1A' }}>
            <Plus size={15} /> Crear Parche
          </button>
        </div>
      </div>

      {/* ── Interior Parche ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: t.bg }}>

        {/* Censor: pick-a-parche empty state, or locked until you join */}
        {!selectedParche.id ? (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 text-center px-10" style={{ background:'rgba(13,11,30,0.9)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background:'rgba(108,99,255,0.12)' }}>🧭</div>
            <p style={{ fontWeight:700, fontSize:'1rem', color:'var(--p-text)' }}>Explora los parches</p>
            <p style={{ fontSize:'0.82rem', color:'var(--p-muted)', maxWidth:360, lineHeight:1.6 }}>Elige un parche de la lista. Únete a los públicos con un toque, o entra a un privado con su código.</p>
          </div>
        ) : !isMember(selectedParche) && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 text-center px-10" style={{ background:'rgba(13,11,30,0.86)', backdropFilter:'blur(7px)' }}>
            <ParcheAvatar parche={selectedParche} size={64} textSize="1.9rem" rounded="2xl" />
            <div>
              <p style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--p-text)' }}>{selectedParche.name}</p>
              <p style={{ fontSize:'0.8rem', color:'var(--p-muted)', marginTop:4 }}>{selectedParche.memberCount}/{selectedParche.maxCapacity} miembros</p>
            </div>
            <div className="flex items-center gap-2" style={{ color:'var(--p-muted)', fontSize:'0.82rem' }}><Lock size={14} /> El chat y las herramientas están bloqueados hasta que te unas</div>
            {selectedParche.type==='public' ? (
              <button onClick={()=>joinPublic(selectedParche)} className="px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90" style={{ background:'linear-gradient(135deg,#6C63FF,#8B7FFF)', color:'white' }}>Unirme al parche</button>
            ) : (
              <p style={{ fontSize:'0.78rem', color:'var(--p-muted)', maxWidth:320 }}>Este es un parche privado. Únete con su código desde la pestaña Privados.</p>
            )}
          </div>
        )}

        {/* Header — position+zIndex above the "no parche selected" overlay so the mobile hamburger stays clickable */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor:'var(--p-divider)', background:'var(--p-card)', backdropFilter:'blur(12px)', position:'relative', zIndex:45 }}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            {isMobile && (
              <button onClick={()=>setShowSidebar(v=>!v)}
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background:'rgba(108,99,255,0.1)' }}>
                <div className="flex flex-col gap-1">
                  <div className="w-4 h-0.5 rounded-full" style={{ background:'#6C63FF' }} />
                  <div className="w-4 h-0.5 rounded-full" style={{ background:'#6C63FF' }} />
                  <div className="w-4 h-0.5 rounded-full" style={{ background:'#6C63FF' }} />
                </div>
              </button>
            )}
            <ParcheAvatar parche={selectedParche} size={36} textSize="1rem" rounded="2xl" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--p-text)' }}>{selectedParche.name}</span>
                {selectedParche.type==='private' ? <Lock size={12} style={{ color:'var(--p-muted)' }} /> : <Globe size={12} style={{ color:'#7FE7C4' }} />}
                {/* Linked events badge (GET /api/parches/{id}/events) */}
                {parcheEventCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ fontSize:'0.6rem', background:'rgba(255,179,71,0.15)', color:'#FFB347', border:'1px solid rgba(255,179,71,0.3)', fontWeight:600 }}>
                    {parcheEventCount} evento{parcheEventCount > 1 ? 's' : ''} vinculado{parcheEventCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <span style={{ fontSize:'0.68rem', color:'var(--p-muted)' }}>
                <span style={{ color:'#7FE7C4' }}>●</span> {selectedParche.memberCount}/{selectedParche.maxCapacity} miembros
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {selectedParche.type==='private' && isMember(selectedParche) && (
              <button onClick={()=>void generateInvite(selectedParche)} disabled={inviteLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background:'rgba(127,231,196,0.16)', color:'#7FE7C4', border:'1px solid rgba(127,231,196,0.35)' }}>
                <KeyRound size={14} /> {inviteLoading ? 'Generando…' : isMobile ? 'Invitar' : 'Invitar al parche'}
              </button>
            )}
            <button onClick={()=>setShowMembers(v=>!v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all"
              style={{ background: showMembers ? 'rgba(108,99,255,0.2)' : 'var(--p-input)', color:'var(--p-muted)' }}>
              <Users size={14} /> Miembros
            </button>
            {/* Settings dropdown */}
            <div className="relative">
              <button onClick={() => setSettingsMenuOpen(v => !v)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
                style={{ background: settingsMenuOpen ? 'rgba(108,99,255,0.2)' : 'var(--p-input)' }}>
                <Settings size={14} style={{ color:'var(--p-muted)' }} />
              </button>
              <AnimatePresence>
                {settingsMenuOpen && (
                  <motion.div
                    initial={{ opacity:0, scale:0.9, y:-4 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:-4 }}
                    transition={{ duration:0.12 }}
                    className="absolute right-0 top-10 rounded-xl border overflow-hidden z-50 min-w-[180px]"
                    style={{ background:'var(--p-card)', borderColor:'rgba(108,99,255,0.2)', boxShadow:'0 8px 32px rgba(0,0,0,0.35)' }}>
                    {selectedParche.type==='private' && (
                      <button onClick={() => { setSettingsMenuOpen(false); void generateInvite(selectedParche); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:opacity-80 transition-all border-b"
                        style={{ color:'var(--p-text)', borderColor:'var(--p-divider)' }}>
                        <KeyRound size={14} /> Generar código de invitación
                      </button>
                    )}
                    <button onClick={() => { setSettingsMenuOpen(false); void leaveParche(selectedParche); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:opacity-80 transition-all border-b"
                      style={{ color:'#FF4D6A', borderColor:'var(--p-divider)' }}>
                      <LogOut size={14} /> Salirse del parche
                    </button>
                    <button onClick={() => { setSettingsMenuOpen(false); void deleteParcheHandler(selectedParche); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:opacity-80 transition-all"
                      style={{ color:'#FF4D6A' }}>
                      <Trash2 size={14} /> Eliminar parche <span style={{ fontSize:'0.62rem', color:'var(--p-muted)' }}>(dueño)</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0"
          style={{ borderColor:'var(--p-divider)', background:'var(--p-card)' }}>
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>{ setActiveTab(tab.id); setGame(null); }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-all"
              style={{ borderColor: activeTab===tab.id ? '#6C63FF' : 'transparent', color: activeTab===tab.id ? '#6C63FF' : 'var(--p-muted)', background:'transparent' }}>
              <tab.icon size={13} />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tab content */}
          <div className="flex-1 overflow-hidden">

            {/* ── CHAT ── */}
            {activeTab==='chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-1" style={{ background: t.bg }}>
                  {/* Linked event system messages */}
                  {linkedEvents.filter(e => e.parcheId === selectedParche.id).map(ev => (
                    <div key={`ev-${ev.parcheId}-${ev.eventTitle}-${ev.eventDate}`} className="flex justify-center my-2">
                      <div className="px-4 py-2 rounded-2xl flex items-center gap-2"
                        style={{ background:'rgba(255,179,71,0.1)', border:'1px solid rgba(255,179,71,0.25)' }}>
                        <span style={{ fontSize:'0.8rem' }}>📅</span>
                        <span style={{ fontSize:'0.75rem', color:'#FFB347' }}>
                          Se vinculó el evento <strong>{ev.eventEmoji} {ev.eventTitle}</strong> con este parche
                        </span>
                      </div>
                    </div>
                  ))}
                  {rtMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                      <span style={{ fontSize:'1.6rem' }}>💬</span>
                      <p style={{ fontSize:'0.85rem', color:'var(--p-muted)' }}>{chatId ? 'Aún no hay mensajes. ¡Escribe el primero!' : 'Conectando el chat del parche…'}</p>
                    </div>
                  )}
                  {rtMessages.map((msg, i) => {
                    const isMe = msg.senderId === meId;
                    return (
                      <motion.div key={msg.id ?? i} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                        className="flex items-start gap-3 group relative px-2 py-0.5 rounded-xl"
                        style={{ flexDirection: isMe ? 'row-reverse' : 'row' }}>
                        <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#6C63FF' }}>{msg.senderUsername}</span>}
                          <div className="px-3.5 py-2 rounded-2xl" style={{ background: isMe ? 'linear-gradient(135deg,#6C63FF,#8B7FFF)' : 'rgba(37,31,61,0.95)', color:'#F0EEFF', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px' }}>
                            <p style={{ fontSize:'0.85rem', lineHeight:1.55 }}>{msg.content}</p>
                          </div>
                          <span style={{ fontSize:'0.6rem', color:'var(--p-muted)' }}>{new Date(msg.sentAt).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t flex-shrink-0"
                  style={{ borderColor:'var(--p-divider)', background:'var(--p-card)' }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border"
                    style={{ background:'var(--p-card)', borderColor:'rgba(108,99,255,0.2)' }}>
                    <input value={msgInput} onChange={e=>setMsgInput(e.target.value)}
                      onKeyDown={e=>e.key==='Enter' && sendMsg()}
                      placeholder={`Escribe algo en ${selectedParche.name}...`}
                      className="flex-1 bg-transparent outline-none"
                      style={{ fontSize:'0.87rem', color:'var(--p-text)' }} />
                    <button onClick={sendMsg}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
                      style={{ background:'#6C63FF' }}>
                      <Send size={14} color="white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── DOCUMENTOS (links) ── */}
            {activeTab==='archivos' && (
              <div className="h-full overflow-y-auto p-5" style={{ background: t.bg }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p style={{ fontWeight:700, fontSize:'0.95rem' }}>Links de documentos</p>
                    <p style={{ fontSize:'0.72rem', color:'var(--p-muted)', marginTop:2 }}>
                      {LINKS_DATA.length} documentos compartidos
                    </p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
                    style={{ background:'rgba(108,99,255,0.1)', color:'#6C63FF', border:'1px solid rgba(108,99,255,0.2)' }}>
                    <Plus size={14} /> Compartir link
                  </button>
                </div>
                <div className="space-y-3">
                  {LINKS_DATA.map((lnk,i)=>(
                    <motion.div key={i}
                      whileHover={{ x:4, boxShadow:`0 6px 24px ${lnk.color}20` }}
                      className="flex items-center gap-4 rounded-2xl border p-4 cursor-pointer group transition-all"
                      style={{ background:'var(--p-card)', borderColor:`${lnk.color}25` }}
                      onClick={() => window.open(lnk.url, '_blank', 'noopener')}>
                      {/* Ícono */}
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                        style={{ background:`${lnk.color}15`, border:`1.5px solid ${lnk.color}30` }}>
                        {lnk.icon}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontWeight:600, fontSize:'0.88rem', color:'var(--p-text)' }}>{lnk.name}</p>
                        <p style={{ fontSize:'0.7rem', color:'var(--p-muted)', marginTop:2 }}>
                          Compartido por <span style={{ color:lnk.color, fontWeight:600 }}>{lnk.sharedBy}</span> · {lnk.date}
                        </p>
                      </div>
                      {/* Abrir */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ background:`${lnk.color}15`, color:lnk.color }}>
                          Abrir →
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── LIENZO ── */}
            {activeTab==='lienzo' && <CollabCanvas parcheId={selectedParche.id} />}

            {/* ── JUEGOS ── */}
            {activeTab==='juegos' && (
              <>
                {game===null && (
                  <div className="h-full flex flex-col items-center justify-center gap-6 p-8" style={{ background: t.bg }}>
                    <h3 style={{ fontWeight:700, fontSize:'1.1rem' }}>Elige un juego</h3>
                    <div className="flex gap-5">
                      {/* Parqués */}
                      <motion.div whileHover={{ scale:1.05, y:-4 }} whileTap={{ scale:0.97 }}
                        onClick={()=>setGame('parques')}
                        className="flex flex-col items-center gap-4 p-6 rounded-3xl border w-56 cursor-pointer"
                        style={{ background:'var(--p-input)', borderColor:'rgba(108,99,255,0.25)' }}>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['#6C63FF','#00D9FF','#7FE7C4','#FF6B9D'].map(c=>(
                            <div key={c} className="w-7 h-7 rounded-full" style={{ background:c }} />
                          ))}
                        </div>
                        <div>
                          <p style={{ fontWeight:700, fontSize:'1.05rem' }}>Parqués</p>
                          <p style={{ fontSize:'0.75rem', color:'var(--p-muted)' }}>2-4 jugadores · Dados</p>
                        </div>
                        <div className="flex gap-1">
                          {(['#6C63FF','#00D9FF','#7FE7C4'] as const).map((c,i)=>(
                            <div key={c} className="w-5 h-5 rounded-full border"
                              style={{ background:c, borderColor:'rgba(108,99,255,0.3)', marginLeft:i>0?-4:0 }} />
                          ))}
                          <span style={{ fontSize:'0.68rem', color:'var(--p-muted)', marginLeft:'6px' }}>3 en sala</span>
                        </div>
                        <div className="w-full py-2 rounded-xl text-sm font-semibold text-center"
                          style={{ background:'#6C63FF', color:'white' }}>
                          Jugar Parqués
                        </div>
                      </motion.div>

                    </div>

                    {/* Historial */}
                    <div className="w-full max-w-xs rounded-2xl p-4 border"
                      style={{ background:'rgba(108,99,255,0.05)', borderColor:'var(--p-divider)' }}>
                      <p style={{ fontSize:'0.8rem', fontWeight:600, marginBottom:'8px', color:'var(--p-muted)' }}>Partidas recientes</p>
                      {[{g:'Parqués',result:'Victoria',with:'vs. Felipe A.',color:'#7FE7C4'},{g:'Parqués',result:'Derrota',with:'vs. Sofía M.',color:'#FF4D6A'}].map((h,i)=>(
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0"
                          style={{ borderColor:'var(--p-input)' }}>
                          <span style={{ fontSize:'0.78rem' }}>{h.g} {h.with}</span>
                          <span style={{ fontSize:'0.78rem', fontWeight:600, color:h.color }}>{h.result}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {game==='parques' && (
                  <div className="flex-1 flex flex-col overflow-hidden" style={{ background: t.bg }}>
                    <div className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
                      style={{ borderColor:'var(--p-divider)', background:'var(--p-card)' }}>
                      <button onClick={()=>setGame(null)} className="hover:opacity-70" style={{ color:'var(--p-muted)', fontSize:'0.82rem' }}>← Volver</button>
                      <span style={{ fontSize:'0.85rem', fontWeight:600 }}>🎲 Parqués</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ParquesBoard />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── VOZ (Discord-style) ── */}
            {activeTab==='voz' && (
              <div className="h-full flex flex-col" style={{ background: t.darkMode ? '#0A0912' : t.bg }}>
                {!voiceConnected ? (
                  /* Pre-join screen */
                  <div className="flex-1 flex flex-col items-center justify-center gap-5">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background:'var(--p-divider)', border:'2px dashed rgba(108,99,255,0.3)' }}>
                      <Volume2 size={34} style={{ color:'var(--p-muted)' }} />
                    </div>
                    <div className="text-center">
                      <p style={{ fontWeight:700, fontSize:'1.05rem' }}>Canal de Voz — {selectedParche.name}</p>
                      <p style={{ fontSize:'0.82rem', color:'var(--p-muted)', marginTop:'4px' }}>
                        {MEMBERS_DATA.filter(m=>m.status==='online').length} miembros disponibles
                      </p>
                    </div>
                    <button onClick={realJoinVoice}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold transition-all hover:scale-105"
                      style={{ background:'#7FE7C4', color:'#0F0E1A' }}>
                      <Phone size={18} /> Unirse a la llamada
                    </button>
                  </div>
                ) : (
                  /* Active call — Discord layout */
                  <>
                    {/* Video grid */}
                    <div className="flex-1 grid gap-2 p-3"
                      style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr' }}>
                      {/* Self tile — profile photo placeholder */}
                      <div className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2"
                        style={{ background:'rgba(108,99,255,0.15)', border:'2px solid #6C63FF', minHeight:120 }}>
                        {/* Gradient avatar (real profile photo will go here) */}
                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ background:'linear-gradient(135deg,#6C63FF,#7FE7C4)', fontSize:'1.2rem', fontWeight:800, color:'white', boxShadow:'0 4px 16px rgba(108,99,255,0.5)' }}>
                          ME
                        </div>
                        {/* "You" badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full"
                          style={{ background:'rgba(108,99,255,0.85)', border:'1px solid rgba(108,99,255,0.5)' }}>
                          <span style={{ fontSize:'0.6rem', fontWeight:700, color:'white' }}>TÚ</span>
                        </div>
                        {/* Status badges */}
                        <div className="absolute bottom-2 left-2 flex gap-1.5">
                          {voiceMuted && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background:'#FF4D6A' }}>
                              <MicOff size={10} color="white" />
                            </div>
                          )}
                          {!voiceCamOn && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background:'#FF4D6A' }}>
                              <VideoOff size={10} color="white" />
                            </div>
                          )}
                        </div>
                        <span className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background:'rgba(0,0,0,0.5)', color:'white' }}>Tú</span>
                      </div>

                      {/* Other participants — profile photo placeholders */}
                      {voiceParticipants.map((p, i) => (
                        <motion.div key={p.senderUserId}
                          animate={{ boxShadow: ['0 0 0 0px #7FE7C4','0 0 0 4px #7FE7C440','0 0 0 0px #7FE7C4'] }}
                          transition={{ duration:1.8, repeat:Infinity, delay:i*0.4 }}
                          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2"
                          style={{ background:'rgba(13,11,30,0.85)', border:'1.5px solid rgba(108,99,255,0.3)', minHeight:120 }}>
                          <div className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ background:'linear-gradient(135deg,#6C63FF,#FF6B9D)', fontSize:'1.1rem', fontWeight:800, color:'white' }}>
                            {p.senderUsername?.substring(0,2).toUpperCase()}
                          </div>
                          <span className="absolute bottom-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background:'rgba(0,0,0,0.65)', color:'white' }}>
                            {p.senderUsername?.split(' ')[0]}
                          </span>
                          <div className="absolute bottom-2 left-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background:'rgba(0,0,0,0.5)' }}>
                            <Mic size={10} color="white" />
                          </div>
                        </motion.div>
                      ))}
                      {voiceParticipants.length === 0 && (
                        <div className="rounded-2xl flex items-center justify-center"
                          style={{ background:'rgba(13,11,30,0.5)', border:'1.5px dashed rgba(108,99,255,0.2)', minHeight:120 }}>
                          <p style={{ fontSize:'0.75rem', color:'var(--p-muted)' }}>Esperando participantes...</p>
                        </div>
                      )}

                      {/* Screen share tile */}
                      {voiceScreenShare && (
                        <div className="rounded-2xl flex items-center justify-center col-span-2 row-span-2"
                          style={{ background:'var(--p-card)', border:'2px solid #7FE7C4', minHeight:120 }}>
                          <div className="flex flex-col items-center gap-2">
                            <Monitor size={32} style={{ color:'#7FE7C4' }} />
                            <p style={{ fontSize:'0.8rem', color:'#7FE7C4', fontWeight:600 }}>Compartiendo pantalla</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Discord-style call controls bar */}
                    <div className="flex items-center justify-center gap-3 px-6 py-4 border-t"
                      style={{ background: t.darkMode ? '#111019' : t.cardBg, borderColor:'var(--p-divider)' }}>
                      {/* Mic */}
                      <button onClick={()=>setVoiceMuted(m=>!m)}
                        className="flex flex-col items-center gap-1 w-14 h-14 rounded-2xl items-center justify-center transition-all hover:scale-105 flex"
                        style={{ background: voiceMuted ? '#FF4D6A' : 'var(--p-divider)', border:`1px solid ${voiceMuted ? '#FF4D6A' : 'rgba(108,99,255,0.3)'}` }}>
                        {voiceMuted ? <MicOff size={20} color="white" /> : <Mic size={20} style={{ color:'#7FE7C4' }} />}
                      </button>

                      {/* Camera */}
                      <button onClick={()=>setVoiceCamOn(v=>!v)}
                        className="flex flex-col items-center gap-1 w-14 h-14 rounded-2xl items-center justify-center transition-all hover:scale-105 flex"
                        style={{ background: !voiceCamOn ? '#FF4D6A' : 'var(--p-divider)', border:`1px solid ${!voiceCamOn ? '#FF4D6A' : 'rgba(108,99,255,0.3)'}` }}>
                        {voiceCamOn ? <Video size={20} style={{ color:'#7FE7C4' }} /> : <VideoOff size={20} color="white" />}
                      </button>

                      {/* Screen share */}
                      <button onClick={()=>setVoiceScreenShare(s=>!s)}
                        className="flex flex-col items-center gap-1 w-14 h-14 rounded-2xl items-center justify-center transition-all hover:scale-105 flex"
                        style={{ background: voiceScreenShare ? 'rgba(127,231,196,0.2)' : 'var(--p-divider)', border:`1px solid ${voiceScreenShare ? '#7FE7C4' : 'rgba(108,99,255,0.3)'}` }}>
                        {voiceScreenShare ? <Monitor size={20} style={{ color:'#7FE7C4' }} /> : <MonitorOff size={20} style={{ color:'var(--p-muted)' }} />}
                      </button>

                      {/* Spacer */}
                      <div className="w-px h-8 mx-1" style={{ background:'rgba(108,99,255,0.2)' }} />

                      {/* Hang up */}
                      <button onClick={() => { realLeaveVoice(); setVoiceScreenShare(false); setVoiceCamOn(true); }}
                        className="flex items-center gap-2 px-6 h-14 rounded-2xl font-semibold transition-all hover:scale-105"
                        style={{ background:'#FF4D6A', color:'white' }}>
                        <PhoneOff size={20} />
                        <span style={{ fontSize:'0.85rem' }}>Colgar</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Members Drawer — Parqués Home-Square Edition ── */}
          <AnimatePresence>
            {showMembers && (
              <motion.div initial={{ width:0, opacity:0 }} animate={{ width:250, opacity:1 }} exit={{ width:0, opacity:0 }}
                transition={{ type:'spring', stiffness:300, damping:30 }}
                className="border-l overflow-hidden flex-shrink-0"
                style={{ background: t.darkMode ? '#0D0B1E' : t.cardBg, borderColor:'rgba(108,99,255,0.2)' }}>
                <div className="p-3 overflow-y-auto h-full">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="flex-1 h-px" style={{ background:'rgba(108,99,255,0.25)' }} />
                    <p style={{ fontSize:'0.65rem', fontWeight:700, color:'rgba(108,99,255,0.7)', textTransform:'uppercase', letterSpacing:'0.12em', whiteSpace:'nowrap' }}>
                      🃏 {MEMBERS_DATA.length} miembros
                    </p>
                    <div className="flex-1 h-px" style={{ background:'rgba(108,99,255,0.25)' }} />
                  </div>

                  {/* Parqués home-square grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {MEMBERS_DATA.map(m => (
                      <div key={m.name} className="relative group cursor-pointer"
                        onClick={()=>setMemberMenuOpen(memberMenuOpen===m.name?null:m.name)}>
                        {/* Parqués corner-zone card */}
                        <div className="rounded-2xl overflow-hidden border-2 transition-all"
                          style={{
                            background: m.gradient,
                            borderColor: m.status==='offline' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                            opacity: m.status==='offline' ? 0.5 : 1,
                            boxShadow: m.status==='online' ? '0 4px 16px rgba(0,0,0,0.35)' : 'none',
                          }}>
                          {/* Inner radial glow (home area highlight) */}
                          <div className="absolute inset-0 pointer-events-none" style={{
                            background: 'radial-gradient(circle at 50% 65%, rgba(255,255,255,0.14) 0%, transparent 60%)'
                          }} />

                          {/* 4 corner dots (like the 4 home positions on Parqués board) */}
                          {[{t:'6px',l:'6px'},{t:'6px',r:'6px'},{b:'26px',l:'6px'},{b:'26px',r:'6px'}].map((pos,i)=>(
                            <div key={i} className="absolute w-2 h-2 rounded-full pointer-events-none"
                              style={{ top:(pos as any).t, bottom:(pos as any).b, left:(pos as any).l, right:(pos as any).r,
                                background:'rgba(255,255,255,0.4)', boxShadow:'0 0 4px rgba(255,255,255,0.3)' }} />
                          ))}

                          {/* Role badge */}
                          {m.role==='admin' && <Crown size={10} color="#FFB347" className="absolute top-2 left-2 z-10" style={{ filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />}
                          {m.role==='mod'   && <Shield size={10} color="white" className="absolute top-2 left-2 z-10" style={{ filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />}

                          {/* Status dot */}
                          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full z-10"
                            style={{ background:STATUS_COLOR[m.status], border:'1.5px solid rgba(0,0,0,0.3)', boxShadow:`0 0 6px ${STATUS_COLOR[m.status]}` }} />

                          {/* Mono image — clean, no bars */}
                          <div className="relative h-24 flex items-end justify-center overflow-hidden pt-3">
                            <img src={m.mono} alt={m.name}
                              className="h-[108%] w-full object-contain object-bottom relative z-10"
                              style={{
                                filter: m.status==='offline'
                                  ? 'grayscale(0.8) brightness(0.7)'
                                  : 'drop-shadow(0 -6px 14px rgba(0,0,0,0.4))',
                                marginBottom:'-1px',
                              }} />
                          </div>

                          {/* Name plate */}
                          <div className="px-2 py-1.5 text-center" style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }}>
                            <p style={{ fontSize:'0.7rem', fontWeight:700, color:'rgba(255,255,255,0.95)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {m.name.split(' ')[0]}
                            </p>
                            <p style={{ fontSize:'0.58rem', color: STATUS_COLOR[m.status], fontWeight:600 }}>
                              {m.status==='online'?'En línea':m.status==='away'?'Ausente':'Desconectado'}
                            </p>
                          </div>
                        </div>

                        {/* Context menu */}
                        <AnimatePresence>
                          {memberMenuOpen===m.name && (
                            <motion.div initial={{ opacity:0, scale:0.9, y:-4 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0 }}
                              className="absolute left-0 top-full mt-1 rounded-xl border shadow-xl z-20 py-1 w-36"
                              style={{ background: t.darkMode ? '#1A1829' : t.cardBg, borderColor:'rgba(108,99,255,0.3)' }}
                              onClick={e=>e.stopPropagation()}>
                              {[
                                {label:'Ver perfil', icon:'👤', danger:false},
                                {label:'Mensaje',    icon:'💬', danger:false},
                                {label:'Reportar',   icon:'🚩', danger:true},
                              ].map(opt=>(
                                <button key={opt.label}
                                  onClick={()=>{
                                    if(opt.label==='Ver perfil') setViewMemberProfile(m);
                                    if(opt.danger) setReportMember(m.name);
                                    setMemberMenuOpen(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/5 transition-all"
                                  style={{ color:opt.danger ? '#FF4D6A' : 'rgba(255,255,255,0.7)' }}>
                                  <span>{opt.icon}</span>{opt.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Create modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:'rgba(0,0,0,0.75)' }}
            onClick={()=>setShowCreate(false)}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              className="rounded-3xl p-5 sm:p-6 w-full max-w-[420px] max-h-[90vh] overflow-y-auto border"
              style={{ background:'var(--p-card)', borderColor:'rgba(108,99,255,0.3)' }}
              onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 style={{ fontWeight:700, fontSize:'1.1rem' }}>Crear Nuevo Parche</h3>
                <button onClick={()=>setShowCreate(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70"
                  style={{ background:'rgba(108,99,255,0.1)' }}>
                  <X size={14} style={{ color:'var(--p-muted)' }} />
                </button>
              </div>
              <div className="space-y-4">
                <input value={createName} onChange={e=>{setCreateName(e.target.value);setCreateError(null);}}
                  placeholder="Nombre del parche..." className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background:'var(--p-input)', border:`1px solid ${createError && !createName.trim() ? '#FF4D6A' : 'rgba(108,99,255,0.2)'}`, color:'var(--p-text)' }} />
                <textarea value={createDesc} onChange={e=>setCreateDesc(e.target.value)} placeholder="Descripción..." rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background:'var(--p-input)', border:'1px solid rgba(108,99,255,0.2)', color:'var(--p-text)' }} />
                {/* Category picker (real backend categories) */}
                <div>
                  <p style={{ fontSize:'0.8rem', fontWeight:600, marginBottom:'8px', color:'var(--p-sub)' }}>Categoría <span style={{ color:'#FF4D6A' }}>*</span></p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {ALL_CATEGORIES.map(cat=>{ const m = CATEGORY_META[cat]; const on = createCategory===cat; return (
                      <button key={cat} onClick={()=>setCreateCategory(cat)}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all"
                        style={{ background: on ? `${m.color}20` : 'var(--p-input)', borderColor: on ? m.color : 'rgba(108,99,255,0.15)', color: on ? m.color : 'var(--p-muted)' }}>
                        <span style={{ fontSize:'1.1rem' }}>{m.emoji}</span>
                        <span style={{ fontSize:'0.6rem', fontWeight: on ? 700 : 400 }}>{m.label}</span>
                      </button>
                    ); })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <input value={createCapacity} onChange={e=>setCreateCapacity(e.target.value)} type="number" min={1} placeholder="Cupos máx..." className="w-28 rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background:'var(--p-input)', border:'1px solid rgba(108,99,255,0.2)', color:'var(--p-text)' }} />
                  {[{val:'public',label:'Público'},{val:'private',label:'Privado'}].map(opt=>(
                    <button key={opt.val} onClick={()=>setCreateType(opt.val as 'public'|'private')}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                      style={{ background: createType===opt.val ? 'var(--p-divider)' : 'transparent', borderColor: createType===opt.val ? '#6C63FF' : 'rgba(108,99,255,0.2)', color: createType===opt.val ? '#6C63FF' : 'var(--p-muted)' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {createType==='private' && (
                  <p style={{ fontSize:'0.7rem', color:'var(--p-muted)', lineHeight:1.5 }}>Es privado: tras crearlo, genera un código de invitación desde el parche para que otros entren.</p>
                )}
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color:'var(--p-muted)' }}>
                  📎 {createFile ? createFile.name : 'Imagen (opcional)'}
                  <input type="file" accept="image/*" className="hidden" onChange={e=>setCreateFile(e.target.files?.[0] ?? null)} />
                </label>
                <div className="flex gap-3">
                  <button onClick={()=>{setShowCreate(false);setCreateName('');setCreateDesc('');setCreateCapacity('');setCreateFile(null);setCreateError(null);}}
                    className="flex-1 py-3 rounded-xl text-sm"
                    style={{ background:'var(--p-input)', color:'var(--p-muted)' }}>Cancelar</button>
                  <button onClick={createParcheHandler} disabled={createSaving}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background:'linear-gradient(135deg,#6C63FF,#8B7FFF)', color:'white' }}>
                    {createSaving ? 'Creando…' : 'Crear Parche'}
                  </button>
                </div>
                <AnimatePresence>
                  {createError && (
                    <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.3)' }}>
                      <span style={{ fontSize:'0.85rem' }}>⚠️</span>
                      <p style={{ fontSize:'0.78rem', color:'#FF4D6A' }}>{createError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Invite code modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {inviteModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background:'rgba(0,0,0,0.75)' }}
            onClick={()=>setInviteModal(null)}>
            <motion.div initial={{ scale:0.9, y:12 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:12 }}
              className="rounded-3xl p-6 w-full max-w-sm border text-center"
              style={{ background:'var(--p-card)', borderColor:'rgba(127,231,196,0.35)' }}
              onClick={e=>e.stopPropagation()}>
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                style={{ background:'rgba(127,231,196,0.14)' }}>
                <KeyRound size={22} style={{ color:'#7FE7C4' }} />
              </div>
              <h3 style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--p-text)' }}>Código de invitación</h3>
              <p style={{ fontSize:'0.75rem', color:'var(--p-muted)', marginTop:4, marginBottom:16 }}>
                Compártelo para que entren a <strong>{selectedParche.name}</strong> · válido {Math.max(1, Math.round(inviteModal.expiresInSeconds / 60))} min
              </p>
              <div className="rounded-2xl px-4 py-4 mb-4 select-all"
                style={{ background:'var(--p-input)', border:'1px dashed rgba(127,231,196,0.5)', fontSize:'1.35rem', fontWeight:800, letterSpacing:'0.14em', color:'#7FE7C4', wordBreak:'break-all', userSelect:'all' }}>
                {inviteModal.token}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setInviteModal(null)} className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background:'var(--p-input)', color:'var(--p-muted)' }}>Cerrar</button>
                <button onClick={()=>void copyInviteCode()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: inviteCopied ? 'rgba(127,231,196,0.2)' : '#7FE7C4', color: inviteCopied ? '#7FE7C4' : '#0F0E1A', border: inviteCopied ? '1px solid rgba(127,231,196,0.5)' : 'none' }}>
                  {inviteCopied ? '✓ Copiado' : 'Copiar código'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {reportMember && <ReportModal memberName={reportMember} parcheName={selectedParche.name} onClose={()=>setReportMember(null)} />}

      {/* Member profile modal */}
      {viewMemberProfile && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.8)' }}
          onClick={() => setViewMemberProfile(null)}>
          <motion.div initial={{ scale:0.92, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.92 }}
            className="rounded-3xl w-full max-w-sm overflow-hidden"
            style={{ background: t.darkMode ? '#1A1829' : t.cardBg, border:'1px solid rgba(108,99,255,0.3)', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}>

            {/* Hero with gradient + mono image */}
            <div className="relative h-44 flex items-end justify-center overflow-hidden"
              style={{ background: viewMemberProfile.gradient }}>
              <div className="absolute inset-0" style={{ background:'linear-gradient(to top, rgba(26,24,41,0.6) 0%, transparent 60%)' }} />
              <button onClick={() => setViewMemberProfile(null)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.2)' }}>
                <ArrowLeft size={16} color="white" />
              </button>
              {/* Mono image */}
              <img src={viewMemberProfile.mono} alt={viewMemberProfile.name}
                style={{ height:140, objectFit:'contain', position:'relative', zIndex:1, filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }} />
              {/* Role badge */}
              {viewMemberProfile.role !== 'member' && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background:'rgba(0,0,0,0.45)', border:'1px solid rgba(255,255,255,0.2)' }}>
                  {viewMemberProfile.role === 'admin'
                    ? <Crown size={11} style={{ color:'#FFB347' }} />
                    : <Shield size={11} style={{ color:'#7FE7C4' }} />}
                  <span style={{ fontSize:'0.62rem', color:'white', fontWeight:700 }}>
                    {viewMemberProfile.role === 'admin' ? 'Admin' : 'Moderador'}
                  </span>
                </div>
              )}
            </div>

            <div className="p-5">
              {/* Name + status */}
              <div className="flex items-center gap-2 mb-1">
                <h3 style={{ fontWeight:800, fontSize:'1.15rem', color:'white' }}>{viewMemberProfile.name}</h3>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: viewMemberProfile.status==='online' ? '#7FE7C4' : viewMemberProfile.status==='away' ? '#FFB347' : '#4A4468' }} />
              </div>
              <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', marginBottom:'16px' }}>
                {viewMemberProfile.status==='online' ? 'En línea' : viewMemberProfile.status==='away' ? 'Ausente' : 'Desconectado'} · Miembro del parche
              </p>

              {/* Schedule */}
              <p style={{ fontWeight:700, fontSize:'0.8rem', color:'white', marginBottom:'10px' }}>Disponibilidad semanal</p>
              <div style={{ overflowX:'auto' }}>
                <div style={{ display:'grid', gridTemplateColumns:'38px repeat(6,1fr)', gap:2, minWidth:260 }}>
                  <div />
                  {M_DAYS.map(d => (
                    <div key={d} style={{ textAlign:'center', fontSize:'0.58rem', fontWeight:700, color:'rgba(255,255,255,0.4)', paddingBottom:2 }}>{d}</div>
                  ))}
                  {M_SLOTS.map((slot, si) => {
                    const sched = memberSched(viewMemberProfile.name);
                    return (
                      <>
                        <div key={`l${si}`} style={{ fontSize:'0.53rem', color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center' }}>{slot}</div>
                        {M_DAYS.map((_,di) => {
                          const active = sched.has(`${di}-${si}`);
                          return (
                            <div key={`${di}-${si}`} style={{ height:17, borderRadius:4,
                              background: active ? 'linear-gradient(135deg,#6C63FF,#A78BFA)' : 'rgba(255,255,255,0.06)',
                              border:`1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.08)'}` }} />
                          );
                        })}
                      </>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-85"
                  style={{ background:'linear-gradient(135deg,#6C63FF,#8B7FFF)', color:'white' }}>
                  <MessageCircle size={14} /> Mensaje
                </button>
                <button onClick={() => setViewMemberProfile(null)}
                  className="w-11 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
                  style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}>
                  <X size={16} color="rgba(255,255,255,0.6)" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
