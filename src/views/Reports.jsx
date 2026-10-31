import { useState, useMemo, useEffect } from 'react';
import {
  getWeeklyReport,
  getMonthlyReport,
  getMeetings,
  getGroups,
  getMonthlyGoals,
  setMonthlyGoals,
} from '../storage';
import {
  today,
  getWeekRange,
  getWeekDates,
  getDayName,
  shiftWeek,
  shiftMonth,
  getMonthName,
  formatDateShort,
  isWeekend,
} from '../utils/dates';
import { Link } from 'react-router-dom';

// ============================================
// Reports — Semanal + Mensual con alertas
// ============================================

export default function Reports() {
  const [tab, setTab] = useState('weekly');
  const todayStr = today();
  const now = new Date();

  // Week navigation
  const [weekRef, setWeekRef] = useState(todayStr);
  const weekRange = useMemo(() => getWeekRange(weekRef), [weekRef]);
  const weekDates = useMemo(() => getWeekDates(weekRange.start), [weekRange.start]);
  const meetings = useMemo(() => getMeetings().filter(m => !isWeekend(m.date)), []);
  const meetingDatesSet = useMemo(() => new Set(meetings.map(m => m.date)), [meetings]);
  const groups = useMemo(() => getGroups(), []);
  const getGroupInfo = (groupId) => groups.find(g => g.id === groupId);

  // Month navigation
  const [monthYear, setMonthYear] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });

  // Filters
  const [clubFilter, setClubFilter] = useState('all');
  const [ramaFilter, setRamaFilter] = useState('all');

  // 1-4-8 Goals
  const [goals, setGoals] = useState(getMonthlyGoals(now.getFullYear(), now.getMonth() + 1));
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState(goals);

  useEffect(() => {
    const loaded = getMonthlyGoals(monthYear.year, monthYear.month);
    setGoals(loaded);
    setTempGoals(loaded);
  }, [monthYear]);

  const handleSaveGoals = () => {
    setMonthlyGoals(monthYear.year, monthYear.month, tempGoals);
    setGoals(tempGoals);
    setIsEditingGoals(false);
  };

  // Reports
  const weeklyReport = useMemo(
    () => getWeeklyReport(weekRange.start, weekRange.end),
    [weekRange]
  );

  const monthlyReport = useMemo(
    () => getMonthlyReport(monthYear.year, monthYear.month),
    [monthYear]
  );

  const filteredMonthlyReport = useMemo(() => {
    return monthlyReport.filter(r => {
      const matchClub = clubFilter === 'all' || r.member.clubId === clubFilter;
      const matchRama = ramaFilter === 'all' || r.member.ramaId === ramaFilter;
      return matchClub && matchRama;
    });
  }, [monthlyReport, clubFilter, ramaFilter]);

  const handleExportMonthly = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Club,Rama,Nombre,Asistencias,Nivel (1-4-8)\n";
    filteredMonthlyReport.forEach(r => {
      let level = r.total >= 8 ? '8' : (r.total >= 4 ? '4' : '1');
      csvContent += `${r.member.clubId},${r.member.ramaId || ''},${r.member.name},${r.total},${level}\n`;
    });
    
    // Add 1-4-8 Summary
    csvContent += "\n--- RESUMEN 1-4-8 ---\n";
    const count1 = filteredMonthlyReport.filter(r => r.total < 4).length;
    const count4 = filteredMonthlyReport.filter(r => r.total >= 4 && r.total < 8).length;
    const count8 = filteredMonthlyReport.filter(r => r.total >= 8).length;
    csvContent += `1 (Total: ${count1}, Diferencia: ${count1 - goals.g1})\n`;
    csvContent += `4 (Total: ${count4}, Diferencia: ${count4 - goals.g4})\n`;
    csvContent += `8 (Total: ${count8}, Diferencia: ${count8 - goals.g8})\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_148_${monthYear.year}_${monthYear.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>📊 Reportes</h1>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
        <button
          className={`tab ${tab === 'weekly' ? 'active' : ''}`}
          onClick={() => setTab('weekly')}
        >
          Semanal
        </button>
        <button
          className={`tab ${tab === 'monthly' ? 'active' : ''}`}
          onClick={() => setTab('monthly')}
        >
          Mensual
        </button>
      </div>

      {/* ----- WEEKLY TAB ----- */}
      {tab === 'weekly' && (
        <>
          <div className="nav-arrows">
            <button onClick={() => setWeekRef(shiftWeek(weekRef, -1))}>←</button>
            <span className="nav-label">
              {formatDateShort(weekRange.start)} — {formatDateShort(weekRange.end)}
            </span>
            <button onClick={() => setWeekRef(shiftWeek(weekRef, 1))}>→</button>
          </div>

          <div className="neu-card" style={{ overflowX: 'auto' }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '140px' }}>Integrante</th>
                  {weekDates.map(date => (
                    <th key={date} style={{ textAlign: 'center', minWidth: '44px' }}>
                      <div>{getDayName(date)}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                        {date.slice(8)}
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {weeklyReport.map((row) => {
                  const gi = getGroupInfo(row.member.group);
                  return (
                  <tr key={row.member.id}>
                    <td>
                      <Link
                        to={`/profile/${row.member.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            className={`badge`}
                            style={{
                              fontSize: '0.65rem',
                              padding: '2px 8px',
                              background: gi ? gi.color : 'transparent',
                              color: 'var(--text-primary)'
                            }}
                          >
                            {gi ? gi.name : row.member.group}
                          </span>
                          <span style={{ fontWeight: 500, fontSize: '0.84rem' }}>
                            {row.member.name.split(' ').slice(0, 2).join(' ')}
                          </span>
                        </div>
                      </Link>
                    </td>
                    {weekDates.map(date => {
                      const meetingData = row.meetings.find(m => m.date === date);
                      const hasMeeting = meetingDatesSet.has(date);
                      return (
                        <td key={date} style={{ textAlign: 'center' }}>
                          {hasMeeting ? (
                            <span className={`week-check ${meetingData?.attended ? 'present' : 'absent'}`}>
                              {meetingData?.attended ? '✓' : '✕'}
                            </span>
                          ) : (
                            <span className="week-check no-meeting">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center' }}>
                      {row.missed ? (
                        <span className="alert-badge alert-red" style={{ fontSize: '0.7rem' }}>
                          Faltó esta semana
                        </span>
                      ) : row.totalAttended > 0 ? (
                        <span style={{ fontWeight: 600, color: 'var(--alert-green)', fontSize: '0.8rem' }}>
                          {row.totalAttended}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>

            {weeklyReport.length === 0 && (
              <div className="empty-state">
                <p>Sin datos para esta semana</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ----- MONTHLY TAB ----- */}
      {tab === 'monthly' && (
        <>
          <div className="nav-arrows">
            <button onClick={() => setMonthYear(shiftMonth(monthYear.year, monthYear.month, -1))}>←</button>
            <span className="nav-label">
              {getMonthName(monthYear.month)} {monthYear.year}
            </span>
            <button onClick={() => setMonthYear(shiftMonth(monthYear.year, monthYear.month, 1))}>→</button>
          </div>

          {/* Summary */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="neu-card-flat stat-card" style={{ padding: 'var(--space-md)' }}>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--alert-red)' }}>
                {monthlyReport.filter(r => r.alertLevel === 'red').length}
              </div>
              <div className="stat-label">🔴 Críticos</div>
            </div>
            <div className="neu-card-flat stat-card" style={{ padding: 'var(--space-md)' }}>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--alert-yellow)' }}>
                {monthlyReport.filter(r => r.alertLevel === 'yellow').length}
              </div>
              <div className="stat-label">🟡 Alerta</div>
            </div>
            <div className="neu-card-flat stat-card" style={{ padding: 'var(--space-md)' }}>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--alert-green)' }}>
                {monthlyReport.filter(r => r.alertLevel === 'green').length}
              </div>
              <div className="stat-label">🟢 Bien</div>
            </div>
          </div>

          <div className="neu-card" style={{ overflowX: 'auto' }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Integrante</th>
                  <th style={{ textAlign: 'center' }}>Asistencias</th>
                  <th style={{ textAlign: 'center' }}>Reuniones</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonthlyReport
                  .sort((a, b) => a.total - b.total) // Worst first
                  .map((row) => {
                    const gi = getGroupInfo(row.member.clubId);
                    return (
                    <tr key={row.member.id}>
                      <td>
                        <Link
                          to={`/profile/${row.member.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              className={`badge`}
                              style={{
                                fontSize: '0.65rem',
                                padding: '2px 8px',
                                background: gi ? gi.color : 'transparent',
                                color: 'var(--text-primary)'
                              }}
                            >
                              {gi ? gi.name : row.member.clubId} {row.member.ramaId && row.member.ramaId !== 'general' ? `- ${row.member.ramaId}` : ''}
                            </span>
                            <span style={{ fontWeight: 500, fontSize: '0.84rem' }}>
                              {row.member.name.split(' ').slice(0, 2).join(' ')}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>
                        {row.total}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {row.meetingsCount}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`alert-badge alert-${row.alertLevel}`}>
                          {row.alertLevel === 'red' && '🔴 Crítico'}
                          {row.alertLevel === 'yellow' && '🟡 Alerta'}
                          {row.alertLevel === 'green' && '🟢 Bien'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                        {row.trend === 'down' && <span className="trend-down" title={`Mes anterior: ${row.prevTotal}`}>📉</span>}
                        {row.trend === 'up' && <span className="trend-up" title={`Mes anterior: ${row.prevTotal}`}>📈</span>}
                        {row.trend === 'stable' && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    </tr>
                    );
                  })}
                {filteredMonthlyReport.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay integrantes en este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ======================= */}
          {/* 1-4-8 REPORT SECTION */}
          {/* ======================= */}
          {filteredMonthlyReport.length > 0 && (
            <div className="neu-card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(240,248,255,0.5) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Sistema de 1 - 4 - 8
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="neu-button sm" onClick={handleExportMonthly} title="Exportar Reporte">
                  📥 Exportar CSV
                </button>
                <button className="btn-icon" onClick={() => setIsEditingGoals(!isEditingGoals)} title="Configurar Metas">
                  ⚙️
                </button>
              </div>
            </div>

            {isEditingGoals && (
              <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'flex-end', background: 'var(--bg-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Meta de 1</label>
                  <input type="number" min="0" value={tempGoals.g1} onChange={e => setTempGoals({...tempGoals, g1: parseInt(e.target.value) || 0})} className="glass-input" style={{ width: '80px', padding: '8px' }} />
                </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Meta de 4</label>
                    <input type="number" min="0" value={tempGoals.g4} onChange={e => setTempGoals({...tempGoals, g4: parseInt(e.target.value) || 0})} className="glass-input" style={{ width: '80px', padding: '8px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Meta de 8</label>
                    <input type="number" min="0" value={tempGoals.g8} onChange={e => setTempGoals({...tempGoals, g8: parseInt(e.target.value) || 0})} className="glass-input" style={{ width: '80px', padding: '8px' }} />
                  </div>
                  <button className="btn-primary" onClick={handleSaveGoals} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
                    Guardar
                  </button>
                </div>
              )}

              <div className="report-148-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
                
                {/* Section 1 */}
                <div className="neu-card-flat" style={{ borderTop: '4px solid var(--alert-red)' }}>
                  <h4 style={{ textAlign: 'center', margin: '0 0 var(--space-md)', fontSize: '1.2rem' }}>1</h4>
                  <div style={{ display: 'flex', justifyContent: 'center', borderTop: '2px solid rgba(0,0,0,0.05)', borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-sm) 0', borderRight: '2px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>R</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{filteredMonthlyReport.filter(r => r.total < 4).length}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-sm) 0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>D</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                        {(() => {
                           const d = filteredMonthlyReport.filter(r => r.total < 4).length - goals.g1;
                           return d > 0 ? `+${d}` : d;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 'var(--space-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', fontStyle: 'italic' }}>
                      (Miembros que no llegan a 4 reuniones)
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
                      {filteredMonthlyReport.filter(r => r.total < 4).map(r => (
                        <li key={r.member.id} style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: 500 }}>{r.member.name.split(' ').slice(0,2).join(' ')}</span>
                          <span style={{ color: 'var(--text-secondary)' }}> ({r.total})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section 4 */}
                <div className="neu-card-flat" style={{ borderTop: '4px solid var(--alert-yellow)' }}>
                  <h4 style={{ textAlign: 'center', margin: '0 0 var(--space-md)', fontSize: '1.2rem' }}>4</h4>
                  <div style={{ display: 'flex', justifyContent: 'center', borderTop: '2px solid rgba(0,0,0,0.05)', borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-sm) 0', borderRight: '2px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>R</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{filteredMonthlyReport.filter(r => r.total >= 4 && r.total < 8).length}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-sm) 0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>D</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                        {(() => {
                           const d = filteredMonthlyReport.filter(r => r.total >= 4 && r.total < 8).length - goals.g4;
                           return d > 0 ? `+${d}` : d;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 'var(--space-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', fontStyle: 'italic' }}>
                      (Miembros que no llegan a 8 reuniones)
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
                      {filteredMonthlyReport.filter(r => r.total >= 4 && r.total < 8).map(r => (
                        <li key={r.member.id} style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: 500 }}>{r.member.name.split(' ').slice(0,2).join(' ')}</span>
                          <span style={{ color: 'var(--text-secondary)' }}> ({r.total})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section 8 */}
                <div className="neu-card-flat" style={{ borderTop: '4px solid var(--alert-green)' }}>
                  <h4 style={{ textAlign: 'center', margin: '0 0 var(--space-md)', fontSize: '1.2rem' }}>8</h4>
                  <div style={{ display: 'flex', justifyContent: 'center', borderTop: '2px solid rgba(0,0,0,0.05)', borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-sm) 0', borderRight: '2px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>R</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{filteredMonthlyReport.filter(r => r.total >= 8).length}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-sm) 0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>D</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                        {(() => {
                           const d = filteredMonthlyReport.filter(r => r.total >= 8).length - goals.g8;
                           return d > 0 ? `+${d}` : d;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 'var(--space-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', fontStyle: 'italic' }}>
                      (Miembros que superaron más de 8 reuniones)
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
                      {filteredMonthlyReport.filter(r => r.total >= 8).map(r => (
                        <li key={r.member.id} style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: 500 }}>{r.member.name.split(' ').slice(0,2).join(' ')}</span>
                          <span style={{ color: 'var(--text-secondary)' }}> ({r.total})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
