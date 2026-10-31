import { useState, useMemo, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  verifyAdmin,
  getAllMembers,
  addMember,
  updateMember,
  updateMembers,
  toggleMemberActive,
  deleteMember,
  exportData,
  importData,
  getGroups,
  getGroupById,
  addGroup,
  updateGroup,
  deleteGroup,
  addRama,
  updateRama,
  deleteRama,
  getAttendance,
  markAttendance,
  removeAttendance,
} from '../storage';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

// ============================================
// Admin — Login + CRUD integrantes + Grupos + QR
// ============================================

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('admin_auth') === 'true'
  );
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const toast = useToast();

  // CRUD state — Members
  const [members, setMembers] = useState(() => getAllMembers());
  const [newName, setNewName] = useState('');
  const [newClub, setNewClub] = useState('');
  const [newRama, setNewRama] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [editClub, setEditClub] = useState('');
  const [editRama, setEditRama] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [search, setSearch] = useState('');

  // Bulk Edit state
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [bulkClub, setBulkClub] = useState('');
  const [bulkRama, setBulkRama] = useState('');

  // Past Attendance state
  const [pastDate, setPastDate] = useState('');
  const [pastAttendance, setPastAttendance] = useState([]);

  useEffect(() => {
    if (pastDate) {
      setPastAttendance(getAttendance(pastDate));
    }
  }, [pastDate]);

  // Groups state
  const [groups, setGroups] = useState(() => getGroups());
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupId, setNewGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#B3E0F2');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupColor, setEditGroupColor] = useState('');
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(null);
  const [newRamaName, setNewRamaName] = useState('');

  const refreshMembers = useCallback(() => {
    setMembers(getAllMembers());
  }, []);

  const refreshGroups = useCallback(() => {
    setGroups(getGroups());
  }, []);

  // Initialize default group/rama selection
  useMemo(() => {
    if (groups.length > 0) {
      if (!newClub) setNewClub(groups[0].id);
      if (!newRama && groups[0].ramas && groups[0].ramas.length > 0) {
        setNewRama(groups[0].ramas[0].id);
      }
      if (!bulkClub) setBulkClub(groups[0].id);
      if (!bulkRama && groups[0].ramas && groups[0].ramas.length > 0) {
        setBulkRama(groups[0].ramas[0].id);
      }
    }
  }, [groups, newClub, newRama, bulkClub, bulkRama]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (verifyAdmin(loginUser, loginPass)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setLoginError('');
      toast.success('Sesión admin iniciada');
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    toast.info('Sesión cerrada');
  };

  // ---------- Member CRUD ----------
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newClub || !newRama) {
      toast.error('Completa nombre, club y rama');
      return;
    }
    addMember(newName, newClub, newRama);
    setNewName('');
    refreshMembers();
    toast.success(`Integrante agregado: ${newName.trim()}`);
  };

  const handleEditOpen = (member) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditClub(member.clubId);
    setEditRama(member.ramaId);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    if (!editingMember || !editName.trim() || !editClub || !editRama) return;
    updateMember(editingMember.id, { name: editName.trim(), clubId: editClub, ramaId: editRama });
    setShowEditModal(false);
    setEditingMember(null);
    refreshMembers();
    toast.success('Integrante actualizado');
  };

  const handleToggleActive = (member) => {
    toggleMemberActive(member.id);
    refreshMembers();
    toast.info(`${member.name}: ${member.active ? 'desactivado' : 'activado'}`);
  };

  const handleDelete = (member) => {
    deleteMember(member.id);
    setShowDeleteConfirm(null);
    refreshMembers();
    toast.success(`${member.name} eliminado`);
  };

  // ---------- Bulk Update ----------
  const toggleMemberSelection = (id) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id));
    }
  };

  const handleBulkMove = () => {
    if (selectedMembers.length === 0) return;
    updateMembers(selectedMembers, { clubId: bulkClub, ramaId: bulkRama });
    setSelectedMembers([]);
    refreshMembers();
    toast.success(`${selectedMembers.length} integrantes actualizados con éxito`);
  };

  // ---------- Past Attendance ----------
  const handlePastToggle = (memberId, memberName) => {
    if (!pastDate) return;
    const isPresent = pastAttendance.some(a => a.memberId === memberId);
    if (isPresent) {
      removeAttendance(memberId, pastDate);
      toast.info(`Asistencia removida: ${memberName} (${pastDate})`);
    } else {
      markAttendance(memberId, pastDate, 'manual');
      toast.success(`Asistencia marcada: ${memberName} (${pastDate})`);
    }
    setPastAttendance(getAttendance(pastDate));
  };

  // ---------- Group CRUD ----------
  const handleAddGroup = () => {
    if (!newGroupName.trim()) {
      toast.error('Completa el nombre del club');
      return;
    }
    
    const name = newGroupName.trim();
    const generatedId = name.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    const result = addGroup(generatedId, name, newGroupColor);
    if (!result) {
      toast.error(`Hubo un error al crear el club`);
      return;
    }
    setShowAddGroupModal(false);
    setNewGroupId('');
    setNewGroupName('');
    setNewGroupColor('#B3E0F2');
    refreshGroups();
    toast.success(`Club "${name}" creado`);
  };

  const handleEditGroupOpen = (group) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupColor(group.color);
    setShowEditGroupModal(true);
  };

  const handleEditGroupSave = () => {
    if (!editingGroup || !editGroupName.trim()) return;
    updateGroup(editingGroup.id, { name: editGroupName.trim(), color: editGroupColor });
    setShowEditGroupModal(false);
    setEditingGroup(null);
    refreshGroups();
    toast.success('Club actualizado');
  };

  const handleAddRamaBtn = () => {
    if (!editingGroup || !newRamaName.trim()) return;
    const rId = newRamaName.trim().toLowerCase().replace(/\s+/g, '-');
    const res = addRama(editingGroup.id, rId, newRamaName.trim());
    if (!res) {
      toast.error('La rama ya existe o hubo un error');
      return;
    }
    setNewRamaName('');
    refreshGroups();
    setEditingGroup(getGroupById(editingGroup.id)); // refresh local state
    toast.success(`Rama "${newRamaName}" agregada`);
  };

  const handleRemoveRamaBtn = (ramaId) => {
    if (!editingGroup) return;
    const inUse = members.some(m => m.clubId === editingGroup.id && m.ramaId === ramaId);
    if (inUse) {
      toast.error('No se puede eliminar: Hay integrantes en esta rama');
      return;
    }
    deleteRama(editingGroup.id, ramaId);
    refreshGroups();
    setEditingGroup(getGroupById(editingGroup.id));
    toast.success('Rama eliminada');
  };

  const handleDeleteGroup = (group) => {
    // Check if any members belong to this group
    const membersInGroup = members.filter(m => m.clubId === group.id);
    if (membersInGroup.length > 0) {
      toast.error(`No se puede eliminar: ${membersInGroup.length} integrante(s) pertenecen a este grupo`);
      setShowDeleteGroupConfirm(null);
      return;
    }
    deleteGroup(group.id);
    setShowDeleteGroupConfirm(null);
    refreshGroups();
    toast.success(`Grupo "${group.name}" eliminado`);
  };

  // ---------- Data ----------
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importData(data);
        refreshMembers();
        refreshGroups();
        toast.success('Datos importados correctamente');
      } catch {
        toast.error('Error al importar: archivo inválido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [members, search]);

  // QR URL
  const qrUrl = `${window.location.origin}${window.location.pathname}?qr=asistencia#/attendance`;

  // Group lookup helper
  const getGroupInfo = (groupId) => groups.find(g => g.id === groupId);

  // ---------- LOGIN SCREEN ----------
  if (!isAuthenticated) {
    return (
      <div className="main-content">
        <div style={{ maxWidth: '380px', margin: '0 auto', paddingTop: 'var(--space-2xl)' }}>
          <div className="neu-card" style={{ textAlign: 'center' }}>
            <div className="mascot-placeholder" style={{ margin: '0 auto var(--space-lg)', fontSize: '2.5rem' }}>
              🔐
            </div>
            <h2 style={{ marginBottom: 'var(--space-lg)' }}>Panel Admin</h2>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Usuario</label>
                <input
                  className="neu-input"
                  type="text"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  placeholder="Usuario"
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input
                  className="neu-input"
                  type="password"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                />
              </div>

              {loginError && (
                <p style={{ color: 'var(--alert-red)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
                  {loginError}
                </p>
              )}

              <button type="submit" className="neu-button primary" style={{ width: '100%' }}>
                Iniciar Sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ADMIN PANEL ----------
  return (
    <div className="main-content">
      <div className="page-header">
        <h1>⚙️ Admin</h1>
        <button className="neu-button sm" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      {/* ========== GROUP MANAGEMENT ========== */}
      <div className="neu-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>🏷️ Clubes y Ramas ({groups.length})</h3>
          <button className="neu-button sm primary" onClick={() => setShowAddGroupModal(true)}>
            + Nuevo
          </button>
        </div>

        <div className="list-container">
          {groups.map((group) => {
            const count = members.filter(m => m.clubId === group.id).length;
            return (
              <div key={group.id} className="group-item">
                <div className="group-swatch" style={{ background: group.color }} />
                <span className="group-name">{group.name}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {count} {count === 1 ? 'integrante' : 'integrantes'}
                </span>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button className="neu-button sm" onClick={() => handleEditGroupOpen(group)} title="Editar">
                    ✏️
                  </button>
                  <button
                    className="neu-button sm danger"
                    onClick={() => setShowDeleteGroupConfirm(group)}
                    title="Eliminar"
                    style={{ padding: '8px 12px' }}
                    disabled={count > 0}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== ADD MEMBER ========== */}
      <div className="neu-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 className="section-title">➕ Agregar integrante</h3>
        <form onSubmit={handleAddMember}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              className="neu-input"
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nombre del integrante"
            />
          </div>
          <div className="form-group">
            <label>Club</label>
            <select
              className="neu-select"
              value={newClub}
              onChange={e => {
                setNewClub(e.target.value);
                const club = groups.find(g => g.id === e.target.value);
                if (club && club.ramas && club.ramas.length > 0) {
                  setNewRama(club.ramas[0].id);
                } else {
                  setNewRama('');
                }
              }}
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Rama</label>
            <select
              className="neu-select"
              value={newRama}
              onChange={e => setNewRama(e.target.value)}
            >
              {(groups.find(g => g.id === newClub)?.ramas || []).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="neu-button primary" disabled={!newName.trim()}>
            Agregar
          </button>
        </form>
      </div>

      {/* ========== QR SECTION ========== */}
      <div className="neu-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 className="section-title">📱 Código QR</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          QR fijo para marcar asistencia. Funciona hasta las 9:00 AM.
        </p>
        <button className="neu-button" onClick={() => setShowQR(!showQR)}>
          {showQR ? 'Ocultar QR' : 'Mostrar QR'}
        </button>

        {showQR && (
          <div className="qr-container" style={{ marginTop: 'var(--space-lg)' }}>
            <QRCodeSVG
              value={qrUrl}
              size={220}
              bgColor="#F4FAFF"
              fgColor="#3A4A5E"
              level="M"
              includeMargin={true}
              style={{ borderRadius: '16px' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', wordBreak: 'break-all' }}>
              {qrUrl}
            </p>
          </div>
        )}
      </div>

      {/* ========== MANUAL PAST ATTENDANCE ========== */}
      <div className="neu-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 className="section-title">📅 Asistencia manual (días pasados)</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Selecciona una fecha para registrar o quitar asistencias de manera manual para días anteriores.
        </p>

        <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
          <input
            type="date"
            className="neu-input"
            value={pastDate}
            onChange={(e) => setPastDate(e.target.value)}
          />
        </div>

        {pastDate && (
          <div className="list-container" style={{ marginTop: 'var(--space-md)', maxHeight: '350px', overflowY: 'auto' }}>
            {members.map(member => {
              const isPresent = pastAttendance.some(a => a.memberId === member.id);
              const gi = getGroupInfo(member.clubId);
              
              return (
                <div
                  key={member.id}
                  className={`toggle-item group-${member.clubId}`}
                  style={gi ? { borderLeftColor: gi.color } : {}}
                  onClick={() => handlePastToggle(member.id, member.name)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0 }}>
                    <span
                      className={`badge`}
                      style={gi ? { background: gi.color, color: 'var(--text-primary)' } : {}}
                    >
                      {gi ? gi.name : member.clubId}
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: isPresent ? 600 : 400,
                      color: isPresent ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      {member.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexShrink: 0 }}>
                    <div className={`toggle-check ${isPresent ? 'checked' : ''}`}>
                      {isPresent ? '✓' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== MEMBERS MANAGEMENT ========== */}
      <div className="neu-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 className="section-title">👥 Gestionar integrantes ({members.length})</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <input
            className="neu-input"
            type="text"
            placeholder="🔍 Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="neu-button" onClick={handleSelectAll}>
            {selectedMembers.length === filteredMembers.length && filteredMembers.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
        </div>

        {selectedMembers.length > 0 && (
          <div className="neu-card" style={{ marginBottom: 'var(--space-md)', background: 'var(--bg-secondary)', padding: 'var(--space-md)' }}>
            <h4 style={{ margin: '0 0 var(--space-sm)' }}>Mover {selectedMembers.length} integrantes seleccionados a:</h4>
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">Club</label>
                <select
                  className="neu-input"
                  value={bulkClub}
                  onChange={e => {
                    setBulkClub(e.target.value);
                    const group = groups.find(g => g.id === e.target.value);
                    if (group && group.ramas && group.ramas.length > 0) {
                      setBulkRama(group.ramas[0].id);
                    } else {
                      setBulkRama('general');
                    }
                  }}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">Rama</label>
                <select
                  className="neu-input"
                  value={bulkRama}
                  onChange={e => setBulkRama(e.target.value)}
                >
                  {(() => {
                    const group = groups.find(g => g.id === bulkClub);
                    if (!group || !group.ramas) return <option value="general">Rama General</option>;
                    return group.ramas.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ));
                  })()}
                </select>
              </div>
              <button className="neu-button primary" onClick={handleBulkMove}>
                Aplicar cambios
              </button>
            </div>
          </div>
        )}

        <div className="list-container">
          {filteredMembers.map((member) => {
            const gi = getGroupInfo(member.clubId);
            return (
              <div key={member.id} className={`member-item group-${member.clubId}`}
                style={gi ? { borderLeftColor: gi.color } : {}}
              >
                <div 
                  className={`toggle-check ${selectedMembers.includes(member.id) ? 'checked' : ''}`}
                  onClick={() => toggleMemberSelection(member.id)}
                  style={{ cursor: 'pointer', marginRight: '8px' }}
                >
                  {selectedMembers.includes(member.id) ? '✓' : ''}
                </div>
                <span
                  className={`badge`}
                  style={gi ? { background: gi.color, color: 'var(--text-primary)' } : {}}
                >
                  {member.clubId} {member.ramaId && member.ramaId !== 'general' ? `- ${member.ramaId}` : ''}
                </span>
                <span className={`member-name ${!member.active ? 'inactive' : ''}`} style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleMemberSelection(member.id)}>
                  {member.name}
                </span>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button className="neu-button sm" onClick={() => handleEditOpen(member)} title="Editar">
                    ✏️
                  </button>
                  <button
                    className="neu-button sm"
                    onClick={() => handleToggleActive(member)}
                    title={member.active ? 'Desactivar' : 'Activar'}
                  >
                    {member.active ? '🚫' : '✅'}
                  </button>
                  <button
                    className="neu-button sm danger"
                    onClick={() => setShowDeleteConfirm(member)}
                    title="Eliminar"
                    style={{ padding: '8px 12px' }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== DATA ========== */}
      <div className="neu-card">
        <h3 className="section-title">💾 Datos</h3>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <button className="neu-button" onClick={handleExport}>
            📥 Exportar JSON
          </button>
          <label className="neu-button" style={{ cursor: 'pointer' }}>
            📤 Importar JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* ========== MODALS ========== */}

      {/* Edit Member Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar integrante"
        actions={
          <>
            <button className="neu-button" onClick={() => setShowEditModal(false)}>Cancelar</button>
            <button className="neu-button primary" onClick={handleEditSave}>Guardar</button>
          </>
        }
      >
        <div className="form-group">
          <label>Nombre</label>
          <input className="neu-input" type="text" value={editName} onChange={e => setEditName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Club</label>
          <select
            className="neu-select"
            value={editClub}
            onChange={e => {
              setEditClub(e.target.value);
              const club = groups.find(g => g.id === e.target.value);
              if (club && club.ramas && club.ramas.length > 0) {
                setEditRama(club.ramas[0].id);
              } else {
                setEditRama('');
              }
            }}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Rama</label>
          <select
            className="neu-select"
            value={editRama}
            onChange={e => setEditRama(e.target.value)}
          >
            {(groups.find(g => g.id === editClub)?.ramas || []).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Delete Member Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="¿Eliminar integrante?"
        actions={
          <>
            <button className="neu-button" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
            <button className="neu-button danger" onClick={() => handleDelete(showDeleteConfirm)}>Eliminar</button>
          </>
        }
      >
        <p style={{ fontSize: '0.9rem' }}>
          Se eliminará permanentemente a <strong>{showDeleteConfirm?.name}</strong> y todos sus registros de asistencia.
        </p>
      </Modal>

      {/* Add Group Modal */}
      <Modal
        isOpen={showAddGroupModal}
        onClose={() => setShowAddGroupModal(false)}
        title="🏷️ Nuevo club"
        actions={
          <>
            <button className="neu-button" onClick={() => setShowAddGroupModal(false)}>Cancelar</button>
            <button className="neu-button primary" onClick={handleAddGroup}>Crear</button>
          </>
        }
      >
        {/* ID autogenerado, no mostramos input */}
        <div className="form-group">
          <label>Nombre del grupo</label>
          <input
            className="neu-input"
            type="text"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="Ej: Grupo E"
          />
        </div>
        <div className="form-group">
          <label>Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <input
              type="color"
              className="color-picker-mini"
              value={newGroupColor}
              onChange={e => setNewGroupColor(e.target.value)}
            />
            <div className="group-swatch" style={{ background: newGroupColor }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{newGroupColor}</span>
          </div>
        </div>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        title="✏️ Editar club y ramas"
        actions={
          <>
            <button className="neu-button" onClick={() => setShowEditGroupModal(false)}>Cancelar</button>
            <button className="neu-button primary" onClick={handleEditGroupSave}>Guardar</button>
          </>
        }
      >
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--space-lg)',
          padding: 'var(--space-md)',
          background: editGroupColor + '33',
          borderRadius: 'var(--radius)',
        }}>
          <div className="group-swatch" style={{ background: editGroupColor, width: 48, height: 48, margin: '0 auto' }} />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
            ID: {editingGroup?.id}
          </p>
        </div>
        <div className="form-group">
          <label>Nombre del club</label>
          <input
            className="neu-input"
            type="text"
            value={editGroupName}
            onChange={e => setEditGroupName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <input
              type="color"
              className="color-picker-mini"
              value={editGroupColor}
              onChange={e => setEditGroupColor(e.target.value)}
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{editGroupColor}</span>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
          <label>Ramas</label>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-sm) 0' }}>
            {(editingGroup?.ramas || []).map(r => (
              <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--bg-secondary)', marginBottom: '4px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{r.name}</span>
                {r.id !== 'general' && (
                  <button type="button" className="neu-button sm danger" onClick={() => handleRemoveRamaBtn(r.id)} style={{ padding: '4px 8px' }}>🗑</button>
                )}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="neu-input" placeholder="Nombre de nueva rama" value={newRamaName} onChange={e => setNewRamaName(e.target.value)} style={{ flex: 1 }} />
            <button type="button" className="neu-button primary" onClick={handleAddRamaBtn} disabled={!newRamaName.trim()}>Agregar</button>
          </div>
        </div>
      </Modal>

      {/* Delete Group Modal */}
      <Modal
        isOpen={!!showDeleteGroupConfirm}
        onClose={() => setShowDeleteGroupConfirm(null)}
        title="¿Eliminar grupo?"
        actions={
          <>
            <button className="neu-button" onClick={() => setShowDeleteGroupConfirm(null)}>Cancelar</button>
            <button className="neu-button danger" onClick={() => handleDeleteGroup(showDeleteGroupConfirm)}>Eliminar</button>
          </>
        }
      >
        <p style={{ fontSize: '0.9rem' }}>
          Se eliminará el grupo <strong>{showDeleteGroupConfirm?.name}</strong>. Solo se puede eliminar si no tiene integrantes.
        </p>
      </Modal>
    </div>
  );
}
