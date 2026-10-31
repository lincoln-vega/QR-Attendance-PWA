import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMembers, getGroups } from '../storage';

// ============================================
// Members — Lista de integrantes
// ============================================

export default function Members() {
  const [search, setSearch] = useState('');
  const [clubFilter, setClubFilter] = useState('all');
  const [ramaFilter, setRamaFilter] = useState('all');
  const members = useMemo(() => getMembers(true), []); // Include inactive
  const groups = useMemo(() => getGroups(), []);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchClub = clubFilter === 'all' || m.clubId === clubFilter;
      const matchRama = ramaFilter === 'all' || m.ramaId === ramaFilter;
      return matchSearch && matchClub && matchRama;
    });
  }, [members, search, clubFilter, ramaFilter]);

  const groupCounts = useMemo(() => {
    const counts = {};
    groups.forEach(g => counts[g.id] = 0);
    members.filter(m => m.active).forEach(m => {
      if (counts[m.clubId] !== undefined) counts[m.clubId]++;
    });
    return counts;
  }, [members, groups]);

  const getGroupInfo = (groupId) => groups.find(g => g.id === groupId);

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>👥 Integrantes</h1>
      </div>

      {/* Group summary */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        {groups.map(group => (
          <div key={group.id} className="neu-card-flat stat-card" style={{ padding: 'var(--space-md)' }}>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{groupCounts[group.id] || 0}</div>
            <div className="stat-label">
              <span className={`badge`} style={{ background: group.color, color: 'var(--text-primary)' }}>
                {group.name}
              </span>
            </div>
          </div>
        ))}
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

      {/* Club filter */}
      <div className="chip-group" style={{ marginBottom: 'var(--space-md)' }}>
        <button
          className={`chip ${clubFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setClubFilter('all'); setRamaFilter('all'); }}
        >
          Todos ({members.length})
        </button>
        {groups.map(group => (
          <button
            key={group.id}
            className={`chip ${clubFilter === group.id ? 'active' : ''}`}
            onClick={() => { setClubFilter(group.id); setRamaFilter('all'); }}
          >
            {group.name} ({groupCounts[group.id] || 0})
          </button>
        ))}
      </div>

      {/* Rama filter */}
      {clubFilter !== 'all' && getGroupInfo(clubFilter)?.ramas && (
        <div className="chip-group" style={{ marginBottom: 'var(--space-lg)', paddingLeft: 'var(--space-md)' }}>
          <button
            className={`chip ${ramaFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRamaFilter('all')}
            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
          >
            Todas las ramas
          </button>
          {getGroupInfo(clubFilter).ramas.map(r => (
            <button
              key={r.id}
              className={`chip ${ramaFilter === r.id ? 'active' : ''}`}
              onClick={() => setRamaFilter(r.id)}
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Members list */}
      <div className="neu-card" style={{ padding: 'var(--space-sm)' }}>
        <div className="list-container">
          {filteredMembers.map((member, index) => {
            const gi = getGroupInfo(member.clubId);
            return (
              <Link
                key={member.id}
                to={`/profile/${member.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className={`member-item group-${member.clubId} stagger-item`}
                  style={{
                    animationDelay: `${index * 0.03}s`,
                    ...(gi ? { borderLeftColor: gi.color } : {})
                  }}
                >
                  <span
                    className={`badge`}
                    style={gi ? { background: gi.color, color: 'var(--text-primary)' } : {}}
                  >
                    {gi ? gi.name : member.clubId} {member.ramaId && member.ramaId !== 'general' ? `- ${member.ramaId}` : ''}
                  </span>
                <span className={`member-name ${!member.active ? 'inactive' : ''}`}>
                  {member.name}
                </span>
                {!member.active && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Inactivo
                  </span>
                )}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>›</span>
              </div>
            </Link>
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
    </div>
  );
}
