import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../store/ThemeContext';
import { useNotifications, type NotificationItem } from '../store/NotificationsContext';
import { matchingService } from '../services/matchingService';

const notifEmoji: Record<string, string> = {
  match: '💜',
  chat: '💬',
  evento: '🎉',
  reporte: '⚠️',
  xp: '⚡',
  logro: '🏆',
  info: 'ℹ️',
};

export function NotificationsPanel() {
  const t = useTheme();
  const navigate = useNavigate();
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification, setPendingMatchCount } = useNotifications();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    matchingService
      .solicitudesRecibidas()
      .then(ids => {
        if (cancelled) return;
        setPendingMatchCount(ids.length);
        ids.forEach(id => {
          addNotification({
            id: `match-${id}`,
            type: 'match',
            text: 'Tienes una nueva solicitud de match esperando tu respuesta.',
            payload: { matchUserId: id },
          });
        });
      })
      .catch(() => {
        if (!cancelled) setPendingMatchCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addNotification, setPendingMatchCount]);

  const handleClick = (n: NotificationItem) => {
    markAsRead(n.id);
    if (n.payload?.chatUserId) {
      navigate('/app/chats', { state: { initialUserId: n.payload.chatUserId } });
      return;
    }
    if (n.payload?.parcheId) {
      navigate('/app/parches', { state: { initialParcheId: n.payload.parcheId } });
      return;
    }
    if (n.payload?.matchUserId) {
      navigate('/app/matching');
      return;
    }
    if (n.payload?.eventId) {
      navigate('/app/eventos');
      return;
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: t.text }}>Notificaciones</h2>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm hover:opacity-70"
            style={{ color: '#6C63FF' }}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ fontSize: '0.85rem', color: t.textMuted, padding: '48px 0', textAlign: 'center' }}>
          Cargando notificaciones...
        </p>
      ) : notifications.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl border"
          style={{ background: t.cardBg, borderColor: t.cardBorder }}
        >
          <Bell size={32} style={{ color: t.textMuted, margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: t.text }}>No tienes notificaciones por ahora</p>
          <p style={{ fontSize: '0.82rem', color: t.textMuted, marginTop: '6px' }}>
            Te avisaremos aquí cuando pase algo nuevo
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              className="flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
              style={{
                background: n.read ? t.cardBg : 'var(--p-input)',
                borderColor: n.read ? t.cardBorder : 'rgba(108,99,255,0.3)',
              }}
              onClick={() => handleClick(n)}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(108,99,255,0.1)' }}
              >
                {notifEmoji[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: n.read ? t.textMuted : t.text,
                    fontWeight: n.read ? 400 : 500,
                    wordBreak: 'break-word',
                  }}
                >
                  {n.text}
                </p>
                <p style={{ fontSize: '0.72rem', color: t.textMuted, marginTop: '4px' }}>
                  Hace {n.time}
                </p>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  removeNotification(n.id);
                }}
                className="p-1 rounded-lg hover:opacity-70 flex-shrink-0"
                style={{ color: t.textMuted }}
              >
                <X size={14} />
              </button>
              {!n.read && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: '#6C63FF' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
