import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Users, Lock, Globe, Mic, MicOff, Paperclip, Send, Smile,
  Settings, Search, Crown, Shield, X, MessageCircle, FileText,
  Layers, Gamepad2, Volume2, VolumeX, MoreHorizontal,
  Phone, PhoneOff, Download, Video, VideoOff, Monitor, MonitorOff, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ParquesBoard } from '../components/ParquesBoard';
import monoCoderImg    from '../assets/monoCoderN.png';
import monoDJImg       from '../assets/monoDJN.png';
import monoArteImg     from '../assets/monoArteN.png';
import monoCientImg    from '../assets/monoCientificoN.png';
import monoCultImg     from '../assets/monoCulturaN.png';
import monoPatriciaImg from '../assets/monoFondoU.png';

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

const PARCHES_LIST = [
  { id:1, name:'Cálculo III Survivors', emoji:'📐', color:'#6C63FF', type:'public',  live:7,  unread:3,  desc:'Grupo de estudio para Cálculo',    category:'estudio',    subcategory:'Cálculos'      },
  { id:2, name:'Proyecto IA — Grupo 4', emoji:'🤖', color:'#7FE7C4', type:'private', live:3,  unread:0,  desc:'Equipo de proyecto final',          category:'estudio',    subcategory:'Programación'  },
  { id:3, name:'Fútbol Martes ECI',     emoji:'⚽', color:'#FFB347', type:'public',  live:12, unread:7,  desc:'Partidos semanales en campus',      category:'deporte',    subcategory:''              },
  { id:4, name:'Gaming Night 🎮',       emoji:'🎮', color:'#FF6B9D', type:'private', live:5,  unread:0,  desc:'Torneos y diversión',               category:'juegos',     subcategory:''              },
  { id:5, name:'Tesis & Proyectos',     emoji:'🎓', color:'#5BC8FF', type:'public',  live:9,  unread:1,  desc:'Apoyo para proyectos de grado',     category:'estudio',    subcategory:'Ing. Sistemas' },
  { id:6, name:'Club Fotografía',       emoji:'📷', color:'#A78BFA', type:'public',  live:4,  unread:0,  desc:'Salidas fotográficas semanales',    category:'arte',       subcategory:''              },
];

const INIT_MESSAGES = [
  { id:1, userId:'VT', user:'Valentina T.',  text:'¿Alguien tiene los apuntes del tema 5 de integrales dobles?',    time:'10:23', reactions:[{emoji:'👍',count:3},{emoji:'❤️',count:1}], type:'text' },
  { id:2, userId:'SM', user:'Santiago M.',   text:'¡Yo los tengo! Los subo en un momento 📄',                       time:'10:25', reactions:[], type:'text' },
  { id:3, userId:'ME', user:'Tú',            text:'También tengo los ejercicios del parcial anterior si los necesitan', time:'10:26', reactions:[{emoji:'🙏',count:4}], type:'text' },
  { id:4, userId:'SM', user:'Santiago M.',   text:'apuntes_calculo3_tema5.pdf',                                      time:'10:28', reactions:[], type:'file' },
  { id:5, userId:'IR', user:'Isabela R.',    text:'¡Gracias Santiago! Justo lo que necesitaba 🙏',                  time:'10:30', reactions:[{emoji:'❤️',count:2}], type:'text' },
  { id:6, userId:'ME', user:'Tú',            text:'¿Hacemos parche de estudio el miércoles en la biblio?',          time:'10:32', reactions:[{emoji:'✅',count:3},{emoji:'🔥',count:2}], type:'text' },
  { id:7, userId:'VT', user:'Valentina T.',  text:'👍 Yo puedo a las 3pm',                                          time:'10:33', reactions:[], type:'text' },
  { id:8, userId:'SM', user:'Santiago M.',   text:'¡Yo llego a las 4! Nos vemos ahí 🎯',                           time:'10:35', reactions:[], type:'text' },
];

const FILES_DATA = [
  { name:'apuntes_calculo3_tema5.pdf',   size:'2.4 MB', date:'Hoy 10:28',    icon:'📄', color:'#FF4D6A', preview: false },
  { name:'ejercicios_parcial1.pdf',      size:'1.1 MB', date:'Ayer',          icon:'📋', color:'#FFB347', preview: false },
  { name:'tabla_integrales.png',         size:'340 KB', date:'Hace 3 días',   icon:'🖼️', color:'#6C63FF', preview: true  },
  { name:'temario_calculo3.docx',        size:'89 KB',  date:'Hace 1 semana', icon:'📝', color:'#7FE7C4', preview: false },
  { name:'ejercicios_extra.pdf',         size:'560 KB', date:'Hace 1 semana', icon:'📄', color:'#FF4D6A', preview: false },
  { name:'foto_pizarron_integrales.jpg', size:'1.8 MB', date:'Hace 2 semanas',icon:'🖼️', color:'#6C63FF', preview: true  },
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

function CollabCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6C63FF');
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const COLORS = ['#6C63FF', '#7FE7C4', '#FF6B9D', '#FFB347', '#5BC8FF', '#E0E0FF', '#FF4D6A', '#A78BFA'];

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

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size * 5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
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
    // Paint a dot on click/tap with no drag
    stroke(pos, pos);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawing || !lastPos.current) return;
    const pos = getPos(e);
    stroke(lastPos.current, pos);
    lastPos.current = pos;
  };

  const stopDraw = () => { setIsDrawing(false); lastPos.current = null; };

  const clear = () => {
    const c = canvasRef.current;
    if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
  };

  return (
    <div className="flex flex-col h-full">
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
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7FE7C4' }} />
            <span style={{ fontSize: '0.7rem', color: '#7FE7C4' }}>3 colaborando</span>
          </div>
          <button onClick={clear} className="px-3 py-1.5 rounded-lg text-xs hover:opacity-80"
            style={{ background: 'rgba(255,77,106,0.1)', color: '#FF4D6A' }}>
            Limpiar
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={1400}
        height={700}
        className="flex-1 w-full"
        style={{ background: 'var(--p-card)', cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none', display: 'block' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
}



function ReportModal({ memberName, onClose }: { memberName:string; onClose:()=>void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 w-96 border" style={{ background:'var(--p-card)', borderColor:'rgba(255,77,106,0.3)' }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontWeight:700, marginBottom:'4px' }}>Denunciar a {memberName}</h3>
        <p style={{ fontSize:'0.8rem', color:'var(--p-muted)', marginBottom:'16px' }}>Tu reporte es anónimo</p>
        <div className="space-y-2 mb-4">
          {['Comportamiento inapropiado','Spam o publicidad','Contenido ofensivo','Acoso o bullying','Otro'].map(r=>(
            <button key={r} onClick={()=>setReason(r)}
              className="w-full text-left px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: reason===r ? 'rgba(255,77,106,0.15)' : 'rgba(108,99,255,0.06)', color: reason===r ? '#FF4D6A' : 'var(--p-sub)', border:`1px solid ${reason===r ? 'rgba(255,77,106,0.3)' : 'rgba(108,99,255,0.1)'}` }}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background:'var(--p-input)', color:'var(--p-muted)' }}>Cancelar</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background:'#FF4D6A', color:'white' }}>Enviar</button>
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
  const [myParches, setMyParches] = useState(PARCHES_LIST);
  const [selectedParche, setSelectedParche] = useState(PARCHES_LIST[0]);
  const [activeTab, setActiveTab] = useState<InteriorTab>('chat');
  const [showMembers, setShowMembers] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState<'all'|'public'|'private'>('all');
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
  const [voiceCamOn, setVoiceCamOn] = useState(true);
  const [voiceScreenShare, setVoiceScreenShare] = useState(false);
  const [memberMenuOpen, setMemberMenuOpen] = useState<string|null>(null);
  const [createType, setCreateType] = useState<'public'|'private'>('public');
  const [createCategory, setCreateCategory] = useState('');
  const [createSubcategory, setCreateSubcategory] = useState('');
  const [sidebarCategory, setSidebarCategory] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const sendMsg = () => {
    if (!msgInput.trim()) return;
    setMessages(prev=>[...prev,{ id:prev.length+1, userId:'ME', user:'Tú', text:msgInput, time:new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}), reactions:[], type:'text' }]);
    setMsgInput('');
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
    <div className="h-full overflow-hidden flex" style={{ borderRadius:'16px', border:'1px solid rgba(108,99,255,0.15)', overflow:'hidden' }}>

      {/* ── Parches Sidebar (Discord style) ──────────────────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r"
        style={{ background:'var(--p-card)', backdropFilter:'blur(16px)', borderColor:'var(--p-divider)' }}>

        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor:'var(--p-divider)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <h3 style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--p-text)' }}>Mis Parches</h3>
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background:'var(--p-divider)', color:'#6C63FF' }}>
              {myParches.reduce((s,p)=>s+p.unread,0)} nuevos
            </span>
          </div>
          <div className="relative mb-2.5">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--p-muted)' }} />
            <input placeholder="Buscar parche..." className="w-full rounded-xl pl-8 pr-3 py-2 text-xs outline-none"
              style={{ background:'var(--p-input)', color:'var(--p-text)', border:'1px solid rgba(108,99,255,0.15)' }} />
          </div>
          {/* Public / Private filter */}
          <div className="flex gap-1 p-0.5 rounded-xl" style={{ background:'var(--p-input)' }}>
            {(['all','public','private'] as const).map(f => (
              <button key={f} onClick={()=>setSidebarFilter(f)}
                className="flex-1 py-1 rounded-lg text-center transition-all"
                style={{ background: sidebarFilter===f ? '#6C63FF' : 'transparent', color: sidebarFilter===f ? 'white' : 'var(--p-muted)', fontSize:'0.65rem', fontWeight: sidebarFilter===f ? 700 : 400 }}>
                {f==='all' ? 'Todos' : f==='public' ? '🌍 Públicos' : '🔒 Privados'}
              </button>
            ))}
          </div>
          {/* Category filter chips */}
          <div className="flex gap-1.5 overflow-x-auto mt-2 pb-0.5" style={{ scrollbarWidth:'none' }}>
            <button onClick={()=>setSidebarCategory('')}
              className="flex-shrink-0 px-2 py-0.5 rounded-full transition-all"
              style={{ background: sidebarCategory==='' ? '#6C63FF' : 'var(--p-input)', color: sidebarCategory==='' ? 'white' : 'var(--p-muted)', fontSize:'0.6rem', fontWeight: sidebarCategory==='' ? 700 : 400 }}>
              Todos
            </button>
            {PARCHE_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={()=>setSidebarCategory(sidebarCategory===cat.id ? '' : cat.id)}
                className="flex-shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full transition-all"
                style={{ background: sidebarCategory===cat.id ? cat.color : 'var(--p-input)', color: sidebarCategory===cat.id ? 'white' : 'var(--p-muted)', fontSize:'0.6rem', fontWeight: sidebarCategory===cat.id ? 700 : 400 }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {myParches.filter(p =>
            (sidebarFilter==='all' || p.type===sidebarFilter) &&
            (sidebarCategory==='' || p.category===sidebarCategory)
          ).map(parche=>(
            <motion.div key={parche.id} onClick={()=>setSelectedParche(parche)}
              whileHover={{ x:2 }}
              className="w-full px-3 py-2.5 flex items-center gap-3 text-left group relative transition-all cursor-pointer"
              style={{
                background: selectedParche.id===parche.id ? 'rgba(108,99,255,0.16)' : 'transparent',
                borderLeft:`3px solid ${selectedParche.id===parche.id ? '#6C63FF' : 'transparent'}`,
              }}>
              {/* Icon */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ background:`${parche.color}20`, border:`1.5px solid ${parche.color}40` }}>
                  {parche.emoji}
                </div>
                {/* Online pulse */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                  style={{ background:parche.live>0 ? '#7FE7C4' : '#4A4468', borderColor:'var(--p-card)' }} />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate" style={{ fontSize:'0.85rem', fontWeight:600, color: 'var(--p-text)' }}>
                    {parche.name}
                  </span>
                  {parche.type==='private' ? <Lock size={10} style={{ color:'var(--p-muted)', flexShrink:0 }} /> : <Globe size={10} style={{ color:'#7FE7C4', flexShrink:0 }} />}
                </div>
                <p style={{ fontSize:'0.68rem', color:'var(--p-muted)' }}>{parche.live} en vivo</p>
                {(() => {
                  const cat = PARCHE_CATEGORIES.find(c=>c.id===parche.category);
                  return cat ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full mt-0.5"
                      style={{ fontSize:'0.55rem', background:`${cat.color}22`, color:cat.color, fontWeight:600 }}>
                      {cat.emoji} {cat.label}{parche.subcategory ? ` · ${parche.subcategory}` : ''}
                    </span>
                  ) : null;
                })()}
              </div>
              {/* Badge */}
              {parche.unread>0 && (
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring' }}
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background:'#FF4D6A', fontSize:'0.6rem', fontWeight:700, color:'white' }}>
                  {parche.unread}
                </motion.div>
              )}
              {/* Hover + button */}
              <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {parche.unread===0 && (
                  <button className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background:'rgba(108,99,255,0.2)' }}>
                    <Plus size={10} style={{ color:'#6C63FF' }} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
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
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background:'rgba(13,11,30,0.7)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor:'var(--p-divider)', background:'var(--p-card)', backdropFilter:'blur(12px)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background:`${selectedParche.color}18` }}>
              {selectedParche.emoji}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--p-text)' }}>{selectedParche.name}</span>
                {selectedParche.type==='private' ? <Lock size={12} style={{ color:'var(--p-muted)' }} /> : <Globe size={12} style={{ color:'#7FE7C4' }} />}
                {/* Linked events badge */}
                {linkedEvents.filter(e => e.parcheId === selectedParche.id).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ fontSize:'0.6rem', background:'rgba(255,179,71,0.15)', color:'#FFB347', border:'1px solid rgba(255,179,71,0.3)', fontWeight:600 }}>
                    📅 {linkedEvents.filter(e => e.parcheId === selectedParche.id).length} evento{linkedEvents.filter(e => e.parcheId === selectedParche.id).length > 1 ? 's' : ''} vinculado{linkedEvents.filter(e => e.parcheId === selectedParche.id).length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <span style={{ fontSize:'0.68rem', color:'var(--p-muted)' }}>
                <span style={{ color:'#7FE7C4' }}>●</span> {selectedParche.live} en vivo
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
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
                    <button onClick={() => {
                        setMyParches(prev => prev.filter(p => p.id !== selectedParche.id));
                        const remaining = myParches.filter(p => p.id !== selectedParche.id);
                        if (remaining.length > 0) setSelectedParche(remaining[0]);
                        setSettingsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:opacity-80 transition-all"
                      style={{ color:'#FF4D6A' }}>
                      🚪 Salirse del parche
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
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
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
                  {messages.map((msg,i)=>{
                    const isMe = msg.userId==='ME';
                    const showAvatar = i===0 || messages[i-1].userId!==msg.userId;
                    return (
                      <motion.div key={msg.id}
                        initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                        onHoverStart={()=>setHoveredMsg(msg.id)}
                        onHoverEnd={()=>{setHoveredMsg(null); setShowReactionPicker(null);}}
                        className="flex items-start gap-3 group relative px-2 py-0.5 rounded-xl transition-all"
                        style={{ background: hoveredMsg===msg.id ? 'rgba(108,99,255,0.06)' : 'transparent', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                        {/* Avatar */}
                        {showAvatar && !isMe && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            style={{ background:'linear-gradient(135deg,#6C63FF,#7FE7C4)', fontSize:'0.6rem', fontWeight:700, color:'white' }}>
                            {msg.avatar}
                          </div>
                        )}
                        {!showAvatar && !isMe && <div className="w-8 flex-shrink-0" />}

                        <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {showAvatar && !isMe && (
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#6C63FF' }}>{msg.user}</span>
                              <span style={{ fontSize:'0.65rem', color:'var(--p-muted)' }}>{msg.time}</span>
                            </div>
                          )}
                          {/* Bubble — always use a fixed dark surface so text is readable in both themes */}
                          <div className="px-3.5 py-2 rounded-2xl"
                            style={{
                              background: isMe ? 'linear-gradient(135deg,#6C63FF,#8B7FFF)' : 'rgba(37,31,61,0.95)',
                              color: '#F0EEFF',
                              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              border: isMe ? 'none' : '1px solid rgba(108,99,255,0.2)',
                            }}>
                            {msg.type==='file' ? (
                              <div className="flex items-center gap-2">
                                <FileText size={14} style={{ color:'#FFB347' }} />
                                <span style={{ fontSize:'0.82rem' }}>{msg.text}</span>
                                <button className="hover:opacity-70"><Download size={12} style={{ color:'var(--p-muted)' }} /></button>
                              </div>
                            ) : (
                              <p style={{ fontSize:'0.85rem', lineHeight:1.55 }}>{msg.text}</p>
                            )}
                          </div>
                          {/* Reactions */}
                          {msg.reactions.length>0 && (
                            <div className={`flex gap-1 flex-wrap ${isMe ? 'justify-end' : ''}`}>
                              {msg.reactions.map(r=>(
                                <motion.button key={r.emoji}
                                  whileHover={{ scale:1.2 }} whileTap={{ scale:0.9 }}
                                  onClick={()=>addReaction(msg.id,r.emoji)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full transition-all"
                                  style={{ background:'var(--p-divider)', border:'1px solid rgba(108,99,255,0.2)', fontSize:'0.8rem' }}>
                                  {r.emoji}<span style={{ fontSize:'0.68rem', color:'var(--p-muted)' }}>{r.count}</span>
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Hover actions */}
                        <AnimatePresence>
                          {hoveredMsg===msg.id && (
                            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
                              className="absolute top-0 flex items-center gap-1 px-1.5 py-1 rounded-xl border shadow-lg"
                              style={{ [isMe?'left':'right']:0, background:'var(--p-card)', borderColor:'rgba(108,99,255,0.2)', zIndex:10 }}>
                              <button onClick={()=>setShowReactionPicker(showReactionPicker===msg.id?null:msg.id)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-70"
                                style={{ background:'rgba(108,99,255,0.1)' }}>
                                <Smile size={12} style={{ color:'var(--p-muted)' }} />
                              </button>
                              <button className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-70"
                                style={{ background:'rgba(108,99,255,0.1)' }}>
                                <MoreHorizontal size={12} style={{ color:'var(--p-muted)' }} />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Reaction picker */}
                        <AnimatePresence>
                          {showReactionPicker===msg.id && (
                            <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                              className="absolute top-8 flex gap-1 p-2 rounded-2xl border shadow-xl"
                              style={{ [isMe?'left':'right']:0, background:'var(--p-card)', borderColor:'rgba(108,99,255,0.3)', zIndex:20 }}>
                              {QUICK_REACTIONS.map(em=>(
                                <motion.button key={em} whileHover={{ scale:1.3 }} whileTap={{ scale:0.8 }}
                                  onClick={()=>addReaction(msg.id,em)}
                                  style={{ fontSize:'1.1rem' }}>
                                  {em}
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                    <button className="hover:opacity-70 flex-shrink-0"><Smile size={18} style={{ color:'var(--p-muted)' }} /></button>
                    <button className="hover:opacity-70 flex-shrink-0"><Paperclip size={18} style={{ color:'var(--p-muted)' }} /></button>
                    <input value={msgInput} onChange={e=>setMsgInput(e.target.value)}
                      onKeyDown={e=>e.key==='Enter' && sendMsg()}
                      placeholder={`Escribe algo en ${selectedParche.name}...`}
                      className="flex-1 bg-transparent outline-none"
                      style={{ fontSize:'0.87rem', color:'var(--p-text)' }} />
                    <button className="hover:opacity-70 flex-shrink-0"><Mic size={18} style={{ color:'var(--p-muted)' }} /></button>
                    <button onClick={sendMsg}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
                      style={{ background:'#6C63FF' }}>
                      <Send size={14} color="white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── ARCHIVOS ── */}
            {activeTab==='archivos' && (
              <div className="h-full overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-5">
                  <p style={{ fontWeight:600, fontSize:'0.95rem' }}>Archivos compartidos ({FILES_DATA.length})</p>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
                    style={{ background:'rgba(108,99,255,0.1)', color:'#6C63FF', border:'1px solid rgba(108,99,255,0.2)' }}>
                    <Plus size={14} /> Subir archivo
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {FILES_DATA.map((f,i)=>(
                    <motion.div key={i} whileHover={{ y:-3, boxShadow:'0 8px 24px rgba(108,99,255,0.15)' }}
                      className="rounded-2xl border overflow-hidden cursor-pointer group"
                      style={{ background:'var(--p-card)', borderColor:`${f.color}25` }}>
                      <div className="h-20 flex items-center justify-center relative"
                        style={{ background:`${f.color}12` }}>
                        <span style={{ fontSize:'2.5rem' }}>{f.icon}</span>
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Download size={18} color="white" />
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="truncate" style={{ fontSize:'0.78rem', fontWeight:600 }}>{f.name}</p>
                        <p style={{ fontSize:'0.68rem', color:'var(--p-muted)', marginTop:'2px' }}>{f.size} · {f.date}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── LIENZO ── */}
            {activeTab==='lienzo' && <CollabCanvas />}

            {/* ── JUEGOS ── */}
            {activeTab==='juegos' && (
              <>
                {game===null && (
                  <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
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
                      {[{g:'Parqués',result:'Victoria 🏆',with:'vs. Felipe A.',color:'#7FE7C4'},{g:'Parqués',result:'Derrota',with:'vs. Sofía M.',color:'#FF4D6A'}].map((h,i)=>(
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
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
                      style={{ borderColor:'var(--p-divider)', background:'var(--p-card)' }}>
                      <button onClick={()=>setGame(null)} className="hover:opacity-70" style={{ color:'var(--p-muted)', fontSize:'0.82rem' }}>← Volver</button>
                      <span style={{ fontSize:'0.85rem', fontWeight:600 }}>🎲 Parqués</span>
                    </div>
                    <ParquesBoard />
                  </div>
                )}
              </>
            )}

            {/* ── VOZ (Discord-style) ── */}
            {activeTab==='voz' && (
              <div className="h-full flex flex-col" style={{ background:'#0A0912' }}>
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
                    <button onClick={()=>setVoiceConnected(true)}
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
                      {MEMBERS_DATA.filter(m=>m.status==='online' && m.name!=='Tú').map((m,i) => (
                        <motion.div key={m.name}
                          animate={{ boxShadow: i===0 ? ['0 0 0 0px #7FE7C4','0 0 0 4px #7FE7C440','0 0 0 0px #7FE7C4'] : 'none' }}
                          transition={{ duration:1.8, repeat:Infinity, delay:i*0.4 }}
                          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2"
                          style={{ background:'rgba(13,11,30,0.85)', border: i===0 ? '2px solid #7FE7C4' : '1.5px solid rgba(108,99,255,0.3)', minHeight:120 }}>
                          {/* Gradient avatar (profile photo will go here) */}
                          <div className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ background: m.gradient, fontSize:'1.1rem', fontWeight:800, color:'white', boxShadow:'0 4px 16px rgba(0,0,0,0.45)' }}>
                            {m.avatar}
                          </div>
                          {/* Speaking indicator */}
                          {i===0 && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full"
                              style={{ background:'rgba(127,231,196,0.25)', border:'1px solid rgba(127,231,196,0.5)' }}>
                              {[1,2,3].map(b=>(
                                <motion.div key={b} animate={{ height:[3,10,3] }}
                                  transition={{ duration:0.6, repeat:Infinity, delay:b*0.15 }}
                                  style={{ width:2, background:'#7FE7C4', borderRadius:2 }} />
                              ))}
                            </div>
                          )}
                          <span className="absolute bottom-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background:'rgba(0,0,0,0.65)', color:'white' }}>
                            {m.name.split(' ')[0]}
                          </span>
                          <div className="absolute bottom-2 left-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background:'rgba(0,0,0,0.5)' }}>
                            <Mic size={10} color="white" />
                          </div>
                        </motion.div>
                      ))}

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
                      style={{ background:'#111019', borderColor:'var(--p-divider)' }}>
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
                      <button onClick={()=>{ setVoiceConnected(false); setVoiceScreenShare(false); setVoiceCamOn(true); setVoiceMuted(false); }}
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
                style={{ background:'#0D0B1E', borderColor:'rgba(108,99,255,0.2)' }}>
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
                              style={{ background:'#1A1829', borderColor:'rgba(108,99,255,0.3)' }}
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
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background:'rgba(0,0,0,0.75)' }}
            onClick={()=>setShowCreate(false)}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              className="rounded-3xl p-6 w-[420px] border"
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
                <input placeholder="Nombre del parche..." className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background:'var(--p-input)', border:'1px solid rgba(108,99,255,0.2)', color:'var(--p-text)' }} />
                <textarea placeholder="Descripción..." rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background:'var(--p-input)', border:'1px solid rgba(108,99,255,0.2)', color:'var(--p-text)' }} />
                {/* Category picker */}
                <div>
                  <p style={{ fontSize:'0.8rem', fontWeight:600, marginBottom:'8px', color:'var(--p-sub)' }}>
                    Tipo de parche <span style={{ color:'#FF4D6A' }}>*</span>
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {PARCHE_CATEGORIES.map(cat=>(
                      <button key={cat.id} onClick={()=>{setCreateCategory(cat.id);setCreateSubcategory('');}}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all"
                        style={{ background: createCategory===cat.id ? `${cat.color}20` : 'var(--p-input)', borderColor: createCategory===cat.id ? cat.color : 'rgba(108,99,255,0.15)', color: createCategory===cat.id ? cat.color : 'var(--p-muted)' }}>
                        <span style={{ fontSize:'1.1rem' }}>{cat.emoji}</span>
                        <span style={{ fontSize:'0.6rem', fontWeight: createCategory===cat.id ? 700 : 400 }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Subcategory — only for Estudio */}
                {createCategory==='estudio' && (
                  <div>
                    <p style={{ fontSize:'0.78rem', fontWeight:600, marginBottom:'6px', color:'var(--p-sub)' }}>Área de estudio</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PARCHE_CATEGORIES.find(c=>c.id==='estudio')!.subcategories.map(sub=>(
                        <button key={sub} onClick={()=>setCreateSubcategory(sub)}
                          className="px-2.5 py-1 rounded-lg text-xs transition-all border"
                          style={{ background: createSubcategory===sub ? 'rgba(108,99,255,0.2)' : 'var(--p-input)', borderColor: createSubcategory===sub ? '#6C63FF' : 'rgba(108,99,255,0.15)', color: createSubcategory===sub ? '#6C63FF' : 'var(--p-muted)', fontWeight: createSubcategory===sub ? 700 : 400 }}>
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  {[{val:'public',label:'🌍 Público'},{val:'private',label:'🔒 Privado'}].map(opt=>(
                    <button key={opt.val} onClick={()=>setCreateType(opt.val as 'public'|'private')}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                      style={{ background: createType===opt.val ? 'var(--p-divider)' : 'transparent', borderColor: createType===opt.val ? '#6C63FF' : 'rgba(108,99,255,0.2)', color: createType===opt.val ? '#6C63FF' : 'var(--p-muted)' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {createType==='private' && (
                  <input placeholder="Código de acceso (ej: CALC2026)..."
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none text-center font-mono tracking-widest"
                    style={{ background:'var(--p-input)', border:'1px solid rgba(108,99,255,0.2)', color:'#6C63FF' }} />
                )}
                <textarea placeholder="Reglas del parche (opcional)..." rows={2} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background:'var(--p-input)', border:'1px solid rgba(108,99,255,0.2)', color:'var(--p-text)' }} />
                <div className="flex gap-3">
                  <button onClick={()=>setShowCreate(false)} className="flex-1 py-3 rounded-xl text-sm"
                    style={{ background:'var(--p-input)', color:'var(--p-muted)' }}>Cancelar</button>
                  <button onClick={()=>setShowCreate(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background:'linear-gradient(135deg,#6C63FF,#8B7FFF)', color:'white' }}>
                    Crear Parche 🎪
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {reportMember && <ReportModal memberName={reportMember} onClose={()=>setReportMember(null)} />}

      {/* Member profile modal */}
      {viewMemberProfile && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.8)' }}
          onClick={() => setViewMemberProfile(null)}>
          <motion.div initial={{ scale:0.92, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.92 }}
            className="rounded-3xl w-full max-w-sm overflow-hidden"
            style={{ background:'#1A1829', border:'1px solid rgba(108,99,255,0.3)', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}
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
