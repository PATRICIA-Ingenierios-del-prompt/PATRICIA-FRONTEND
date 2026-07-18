import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useReports, type UserReport } from '../store/ReportsContext';
import { useSupport } from '../store/SupportContext';
import { isAdmin } from '../lib/admin';
import { adminService } from '../services/adminService';
import { useTranslation } from 'react-i18next';
import type { AdminDashboardResponse, AdminParcheStatsResponse } from '../types/patricia';

type AdminTab = 'resumen' | 'reportes' | 'soporte';

const BAR_HUE = '#6C63FF';
const STATUS_COLOR: Record<UserReport['status'], string> = { pendiente: '#FFB347', resuelto: '#7FE7C4' };

function StatTile({ label, value, loading }: { label: string; value: string | number; loading?: boolean }) {
  const t = useTheme();
  return (
    <div className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
      <p style={{ fontSize: '0.78rem', color: t.textMuted }}>{label}</p>
      <p style={{ fontWeight: 700, fontSize: '1.9rem', color: t.text, marginTop: 6 }}>
        {loading ? '…' : value}
      </p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function AdminView() {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const { roles } = useAuth();
  const { reports, resolveReport } = useReports();
  const { messages, resolveMessage } = useSupport();
  const [tab, setTab] = useState<AdminTab>('resumen');
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [parcheStats, setParcheStats] = useState<AdminParcheStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([adminService.getDashboard(), adminService.getParcheStats()])
      .then(([dash, stats]) => {
        if (!cancelled) {
          setDashboard(dash);
          setParcheStats(stats);
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          setError(e?.response?.data?.message || e?.message || tr('admin.load_error'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (!isAdmin(roles)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert size={32} style={{ color: '#FF4D6A', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 700, color: t.text }}>{tr('admin.restricted')}</p>
          <p style={{ fontSize: '0.85rem', color: t.textMuted, marginTop: 4 }}>{tr('admin.restricted_desc')}</p>
        </div>
      </div>
    );
  }

  const pendingCount = reports.filter(r => r.status === 'pendiente').length;
  const pendingSupportCount = messages.filter(m => m.status === 'pendiente').length;
  const carreraBreakdown = dashboard?.carreraBreakdown ?? [];
  const maxCarreraCount = carreraBreakdown.length ? Math.max(...carreraBreakdown.map(c => c.count)) : 0;
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
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: t.text }}>{tr('admin.title')}</h2>
        <p style={{ fontSize: '0.85rem', color: t.textMuted, marginTop: 2 }}>{tr('admin.subtitle')}</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-2xl border w-fit" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
        {([
          { id: 'resumen' as AdminTab, label: tr('admin.tab_summary') },
          { id: 'reportes' as AdminTab, label: `${tr('admin.tab_reports')}${pendingCount ? ` (${pendingCount})` : ''}` },
          { id: 'soporte' as AdminTab, label: `${tr('admin.tab_support')}${pendingSupportCount ? ` (${pendingSupportCount})` : ''}` },
        ]).map(s => (
          <button key={s.id} onClick={() => setTab(s.id)}
            className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: tab === s.id ? 'rgba(108,99,255,0.15)' : 'transparent', color: tab === s.id ? '#6C63FF' : t.textMuted }}>
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl border" style={{ background: 'rgba(255,77,106,0.08)', borderColor: '#FF4D6A', color: '#FF4D6A' }}>
          {error}
        </div>
      )}

      {tab === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile label={tr('admin.stat_users')} value={(dashboard?.totalUsuarios ?? 0).toLocaleString()} loading={loading} />
            <StatTile label={tr('admin.stat_parches')} value={(parcheStats?.totalParches ?? 0).toLocaleString()} loading={loading} />
            <StatTile label={tr('admin.stat_reports')} value={pendingCount} loading={false} />
          </div>

          <div className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: t.text, marginBottom: 4 }}>{tr('admin.users_by_career')}</p>
            <p style={{ fontSize: '0.78rem', color: t.textMuted, marginBottom: 18 }}>{tr('admin.users_distribution', { count: (dashboard?.totalUsuarios ?? 0).toLocaleString() })}</p>
            <div className="space-y-3">
              {carreraBreakdown.map(c => (
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
              {carreraBreakdown.length === 0 && !loading && (
                <p style={{ fontSize: '0.85rem', color: t.textMuted }}>{tr('admin.no_career_data')}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: t.text, marginBottom: 12 }}>{tr('admin.recent_signups')}</p>
            <div className="space-y-2">
              {(dashboard?.recentSignups ?? []).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--p-divider)' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, color: t.text }}>{s.name}</p>
                    <p style={{ fontSize: '0.72rem', color: t.textMuted }}>{s.carrera}</p>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: t.textMuted }}>{formatDate(s.date)}</span>
                </div>
              ))}
              {(dashboard?.recentSignups ?? []).length === 0 && !loading && (
                <p style={{ fontSize: '0.85rem', color: t.textMuted }}>{tr('admin.no_recent_signups')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'reportes' && (
        <div className="space-y-3">
          {sortedReports.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: t.textMuted }}>{tr('admin.no_reports')}</p>
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
                  {r.status === 'pendiente' ? tr('admin.pending') : tr('admin.resolved')}
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
                  <CheckCircle2 size={13} /> {tr('admin.mark_resolved')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'soporte' && (
        <div className="space-y-3">
          {sortedMessages.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: t.textMuted }}>{tr('admin.no_support_msgs')}</p>
          )}
          {sortedMessages.map(m => (
            <div key={m.id} className="rounded-2xl p-5 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', color: t.text }}>{m.name}</p>
                  <p style={{ fontSize: '0.75rem', color: t.textMuted }}>{m.email || tr('admin.no_email')} · {formatDate(m.date)}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: `${STATUS_COLOR[m.status]}22`, color: STATUS_COLOR[m.status] }}>
                  {m.status === 'pendiente' ? tr('admin.pending') : tr('admin.resolved')}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: t.textSub, lineHeight: 1.5 }}>{m.message}</p>
              {m.status === 'pendiente' && (
                <button onClick={() => resolveMessage(m.id)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: 'rgba(127,231,196,0.15)', color: '#0D9D74' }}>
                  <CheckCircle2 size={13} /> {tr('admin.mark_resolved')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
