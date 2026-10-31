import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getMembers,
  markAttendance,
  removeAttendance,
  getAttendance,
  getAttendanceRecord,
  getGroups,
} from '../storage';
import { today, isBeforeQRCutoff, formatDateFull } from '../utils/dates';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

// ============================================
// Attendance — Marcar asistencia (manual + QR)
// ============================================

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const isQR = searchParams.get('qr') === 'asistencia';
  const qrAllowed = isBeforeQRCutoff();

  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [confirmRemove, setConfirmRemove] = useState(null);
  const toast = useToast();

  const todayStr = today();

  const refreshData = () => {
    setMembers(getMembers());
    setAttendance(getAttendance(todayStr));
    setGroups(getGroups());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const attendedIds = useMemo(() => new Set(attendance.map(a => a.memberId)), [attendance]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchGroup = groupFilter === 'all' || m.group === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [members, search, groupFilter]);

  const getGroupInfo = (groupId) => groups.find(g => g.id === groupId);

  const handleToggle = (memberId, memberName) => {
    if (attendedIds.has(memberId)) {
      setConfirmRemove({ id: memberId, name: memberName });
    } else {
      const method = isQR && qrAllowed ? 'qr' : 'manual';
      markAttendance(memberId, todayStr, method);
      toast.success(`✓ ${memberName} — ${method === 'qr' ? 'QR' : 'Manual'}`);
      refreshData();
    }
  };

  const confirmToggleOff = () => {
    if (!confirmRemove) return;
    removeAttendance(confirmRemove.id, todayStr);
    toast.info(`Asistencia removida: ${confirmRemove.name}`);
    setConfirmRemove(null);
    refreshData();
  };

  const presentCount = attendance.length;
  const totalCount = members.length;

  return (
    <div className="main-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Asistencia</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {formatDateFull(todayStr)}
          </p>
        </div>
      </div>

      {/* QR Notice */}
      {isQR && (
        <div
          className={`neu-card-flat ${qrAllowed ? '' : ''}`}
          style={{
            marginBottom: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: qrAllowed ? 'var(--alert-green-bg)' : 'var(--alert-yellow-bg)',
            borderLeft: `4px solid ${qrAllowed ? 'var(--alert-green)' : 'var(--alert-yellow)'}`,
          }}
        >
          {qrAllowed ? (
            <p style={{ fontSize: '0.88rem', color: '#2E7D32' }}>
              📱 Modo QR activo — La asistencia se registrará como QR
            </p>
          ) : (
            <p style={{ fontSize: '0.88rem', color: '#E6A800' }}>
              ⏰ El horario QR terminó (9:00 AM). La asistencia se registrará como manual.
            </p>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div
        className="neu-card-inset"
        style={{
          marginBottom: 'var(--space-md)',
          padding: 'var(--space-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
          Presentes: <strong style={{ color: 'var(--accent-primary-dark)' }}>{presentCount}</strong> / {totalCount}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%
        </span>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <input
          className="neu-input"
          type="text"
          placeholder="🔍 Buscar integrante..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Group filter chips */}
      <div className="chip-group" style={{ marginBottom: 'var(--space-lg)' }}>
        <button
          className={`chip ${groupFilter === 'all' ? 'active' : ''}`}
          onClick={() => setGroupFilter('all')}
        >
          Todos
        </button>
        {groups.map(group => (
          <button
            key={group.id}
            className={`chip ${groupFilter === group.id ? 'active' : ''}`}
            onClick={() => setGroupFilter(group.id)}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* Members list */}
      <div className="neu-card" style={{ padding: 'var(--space-sm)' }}>
        <div className="list-container">
          {filteredMembers.map((member, index) => {
            const isPresent = attendedIds.has(member.id);
            const record = isPresent ? getAttendanceRecord(member.id, todayStr) : null;
            const gi = getGroupInfo(member.group);

            return (
              <div
                key={member.id}
                className={`toggle-item stagger-item group-${member.group}`}
                style={{
                  animationDelay: `${index * 0.03}s`,
                  ...(gi ? { borderLeftColor: gi.color } : {})
                }}
                onClick={() => handleToggle(member.id, member.name)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0 }}>
                  <span
                    className={`badge`}
                    style={gi ? { background: gi.color, color: 'var(--text-primary)' } : {}}
                  >
                    {gi ? gi.name : member.group}
                  </span>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: isPresent ? 600 : 400,
                    color: isPresent ? 'var(--text-primary)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {member.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexShrink: 0 }}>
                  {isPresent && record && (
                    <span className={`badge-method ${record.method}`}>
                      {record.method === 'qr' ? '📱 QR' : '✋ Manual'}
                    </span>
                  )}
                  <div className={`toggle-check ${isPresent ? 'checked' : ''}`}>
                    {isPresent ? '✓' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No se encontraron integrantes</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="¿Quitar asistencia?"
        actions={
          <>
            <button className="neu-button" onClick={() => setConfirmRemove(null)}>Cancelar</button>
            <button className="neu-button danger" onClick={confirmToggleOff}>Quitar</button>
          </>
        }
      >
        <p style={{ fontSize: '0.9rem' }}>
          ¿Estás seguro que deseas quitar la asistencia de <strong>{confirmRemove?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}
