import { useState } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useReports, type UserReport } from '../store/ReportsContext';
import { useSupport } from '../store/SupportContext';
import { isAdminEmail } from '../lib/admin';
import { CARRERA_BREAKDOWN, TOTAL_USERS_REGISTERED, TOTAL_PARCHES, RECENT_SIGNUPS } from '../lib/mockAdminData';

type AdminTab = 'resumen' | 'reportes' | 'soporte';

const BAR_HUE = '#6C63FF'; // single series — same hue throughout, per dataviz guidance
const STATUS_COLOR: Record<UserReport['status'], string> = { pendiente: '#FFB347', resuelto: '#7FE7C4' };

function StatTile({ label, value }: { label: string; value: string | number }) {
  const t = useTheme();
  return (
    <div className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
      <p style={{ fontSize: '0.78rem', color: t.textMuted }}>{label}</p>
      <p style={{ fontWeight: 700, fontSize: '1.9rem', color: t.text, marginTop: 6 }}>{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function AdminView() {
  const t = useTheme();
  const { userEmail } = useAuth();
  const { reports, resolveReport } = useReports();
  const { messages, resolveMessage } = useSupport();
  const [tab, setTab] = useState<AdminTab>('resumen');

  if (!isAdminEmail(userEmail)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert size={32} style={{ color: '#FF4D6A', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 700, color: t.text }}>Acceso restringido</p>
          <p style={{ fontSize: '0.85rem', color: t.textMuted, marginTop: 4 }}>Esta sección es solo para administradores.</p>
        </div>
      </div>
    );
  }

  const pendingCount = reports.filter(r => r.status === 'pendiente').length;
  const pendingSupportCount = messages.filter(m => m.status === 'pendiente').length;
  const maxCarreraCount = Math.max(...CARRERA_BREAKDOWN.map(c => c.count));
  const sortedReports = [...reports].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pendiente' ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  const sortedMessages = [...messages].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pendiente' ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="h-full overflow-y-auto pb-10">
      <div className="mb-5">
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: t.text }}>Panel de Administrador</h2>
        <p style={{ fontSize: '0.85rem', color: t.textMuted, marginTop: 2 }}>Reportes de la comunidad y estadísticas generales de U•link</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-2xl border w-fit" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
        {([
          { id: 'resumen' as AdminTab, label: 'Resumen' },
          { id: 'reportes' as AdminTab, label: `Reportes${pendingCount ? ` (${pendingCount})` : ''}` },
          { id: 'soporte' as AdminTab, label: `Soporte${pendingSupportCount ? ` (${pendingSupportCount})` : ''}` },
        ]).map(s => (
          <button key={s.id} onClick={() => setTab(s.id)}
            className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: tab === s.id ? 'rgba(108,99,255,0.15)' : 'transparent', color: tab === s.id ? '#6C63FF' : t.textMuted }}>
            {s.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile label="Usuarios registrados" value={TOTAL_USERS_REGISTERED.toLocaleString('es-CO')} />
            <StatTile label="Parches activos" value={TOTAL_PARCHES.toLocaleString('es-CO')} />
            <StatTile label="Reportes pendientes" value={pendingCount} />
          </div>

          <div className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: t.text, marginBottom: 4 }}>Usuarios por carrera</p>
            <p style={{ fontSize: '0.78rem', color: t.textMuted, marginBottom: 18 }}>Distribución de los {TOTAL_USERS_REGISTERED.toLocaleString('es-CO')} usuarios registrados</p>
            <div className="space-y-3">
              {CARRERA_BREAKDOWN.map(c => (
                <div key={c.carrera} title={`${c.carrera}: ${c.count} usuarios`}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span style={{ fontSize: '0.78rem', color: t.textSub }}>{c.carrera}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: t.text }}>{c.count}</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 8, background: 'var(--p-input)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.count / maxCarreraCount) * 100}%`, background: BAR_HUE, minWidth: 4 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: t.text, marginBottom: 12 }}>Altas recientes</p>
            <div className="space-y-2">
              {RECENT_SIGNUPS.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--p-divider)' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, color: t.text }}>{s.name}</p>
                    <p style={{ fontSize: '0.72rem', color: t.textMuted }}>{s.carrera}</p>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: t.textMuted }}>{formatDate(s.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'reportes' && (
        <div className="space-y-3">
          {sortedReports.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: t.textMuted }}>No hay reportes registrados.</p>
          )}
          {sortedReports.map(r => (
            <div key={r.id} className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', color: t.text }}>{r.reportedUserName}</p>
                  <p style={{ fontSize: '0.75rem', color: t.textMuted }}>Parche: {r.parcheName} · {formatDate(r.date)}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: `${STATUS_COLOR[r.status]}22`, color: STATUS_COLOR[r.status] }}>
                  {r.status === 'pendiente' ? 'Pendiente' : 'Resuelto'}
                </span>
              </div>
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-2"
                style={{ background: 'rgba(255,77,106,0.12)', color: '#FF4D6A' }}>
                {r.category}
              </span>
              <p style={{ fontSize: '0.85rem', color: t.textSub, lineHeight: 1.5 }}>{r.description}</p>
              {r.status === 'pendiente' && (
                <button onClick={() => resolveReport(r.id)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: 'rgba(127,231,196,0.15)', color: '#0D9D74' }}>
                  <CheckCircle2 size={13} /> Marcar como resuelto
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'soporte' && (
        <div className="space-y-3">
          {sortedMessages.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: t.textMuted }}>No hay mensajes de soporte.</p>
          )}
          {sortedMessages.map(m => (
            <div key={m.id} className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', color: t.text }}>{m.name}</p>
                  <p style={{ fontSize: '0.75rem', color: t.textMuted }}>{m.email || 'Sin correo'} · {formatDate(m.date)}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: `${STATUS_COLOR[m.status]}22`, color: STATUS_COLOR[m.status] }}>
                  {m.status === 'pendiente' ? 'Pendiente' : 'Resuelto'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: t.textSub, lineHeight: 1.5 }}>{m.message}</p>
              {m.status === 'pendiente' && (
                <button onClick={() => resolveMessage(m.id)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: 'rgba(127,231,196,0.15)', color: '#0D9D74' }}>
                  <CheckCircle2 size={13} /> Marcar como resuelto
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
