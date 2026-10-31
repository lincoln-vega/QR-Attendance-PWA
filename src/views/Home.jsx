import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMembers, getAttendance, getMeetings, getMonthlyAlerts } from '../storage';
import { today, formatDateFull, getWeekRange, getWeekDates, getDayName } from '../utils/dates';

// ============================================
// Home — Dashboard principal
// ============================================

export default function Home() {
  const [stats, setStats] = useState({ todayCount: 0, totalMembers: 0, weekData: [], alerts: [] });

  useEffect(() => {
    const todayStr = today();
    const members = getMembers();
    const todayAttendance = getAttendance(todayStr);
    const now = new Date();

    // Week bar chart
    const { start } = getWeekRange(todayStr);
    const weekDates = getWeekDates(start);
    const meetings = getMeetings();
    const meetingDates = new Set(meetings.map(m => m.date));

    const weekData = weekDates.map(date => {
      const att = getAttendance(date);
      return {
        date,
        day: getDayName(date),
        count: att.length,
        hasMeeting: meetingDates.has(date),
        isToday: date === todayStr,
      };
    });

    // Monthly alerts
    const alerts = getMonthlyAlerts(now.getFullYear(), now.getMonth() + 1);

    setStats({
      todayCount: todayAttendance.length,
      totalMembers: members.length,
      weekData,
      alerts: alerts.slice(0, 5), // Show top 5
    });
  }, []);

  const todayStr = today();
  const maxCount = Math.max(...stats.weekData.map(d => d.count), 1);

  return (
    <div className="main-content">
      {/* Header */}
      <div className="page-header">
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-out)',
          background: 'var(--surface)',
          flexShrink: 0
        }}>
          <img src="/mascot.png" alt="Angelito" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <h1>Asistencia</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {formatDateFull(todayStr)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="neu-card-flat stat-card">
          <div className="stat-value">{stats.todayCount}</div>
          <div className="stat-label">Hoy</div>
        </div>
        <div className="neu-card-flat stat-card">
          <div className="stat-value">{stats.totalMembers}</div>
          <div className="stat-label">Integrantes</div>
        </div>
        <div className="neu-card-flat stat-card">
          <div className="stat-value">
            {stats.totalMembers > 0 ? Math.round((stats.todayCount / stats.totalMembers) * 100) : 0}%
          </div>
          <div className="stat-label">Asistencia</div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="neu-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 className="section-title">📅 Esta semana</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', marginTop: 'var(--space-md)' }}>
          {stats.weekData.map(day => (
            <div
              key={day.date}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: day.count > 0 ? 'var(--accent-primary-dark)' : 'var(--text-muted)',
              }}>
                {day.count > 0 ? day.count : ''}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: day.count > 0 ? `${(day.count / maxCount) * 80}%` : '4px',
                  borderRadius: '8px 8px 4px 4px',
                  background: day.isToday
                    ? 'linear-gradient(180deg, var(--accent-secondary), var(--accent-secondary-dark))'
                    : day.count > 0
                      ? 'linear-gradient(180deg, var(--accent-primary-light), var(--accent-primary))'
                      : 'var(--surface-inset)',
                  boxShadow: day.count > 0
                    ? '2px 2px 6px rgba(126,200,227,0.3)'
                    : 'var(--shadow-inset-light)',
                  transition: 'height 0.5s ease',
                  minHeight: '4px',
                }}
              />
              <span style={{
                fontSize: '0.68rem',
                fontWeight: day.isToday ? 700 : 500,
                color: day.isToday ? 'var(--accent-primary-dark)' : 'var(--text-muted)',
              }}>
                {day.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <Link to="/attendance" style={{ flex: 1, textDecoration: 'none' }}>
          <button className="neu-button primary" style={{ width: '100%' }}>
            ✅ Marcar Asistencia
          </button>
        </Link>
        <Link to="/reports" style={{ flex: 1, textDecoration: 'none' }}>
          <button className="neu-button secondary" style={{ width: '100%' }}>
            📊 Ver Reportes
          </button>
        </Link>
      </div>

      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <div className="neu-card">
          <h3 className="section-title">⚠️ Alertas del mes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {stats.alerts.map((alert, i) => (
              <Link
                key={i}
                to={`/profile/${alert.member.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="toggle-item"
                  style={{ padding: 'var(--space-sm) var(--space-md)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flex: 1 }}>
                    <span className={`badge badge-group-${alert.member.clubId}`}>
                      {alert.member.clubId}
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                      {alert.member.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span className={`alert-badge alert-${alert.alertLevel}`}>
                      {alert.alertLevel === 'red' && '🔴'}
                      {alert.alertLevel === 'yellow' && '🟡'}
                      {alert.alertLevel === 'green' && '🟢'}
                      {' '}{alert.total}
                    </span>
                    {alert.trend === 'down' && <span className="trend-down">📉</span>}
                    {alert.trend === 'up' && <span className="trend-up">📈</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
