import { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMemberById,
  getAttendanceByMember,
  getStreak,
  getMeetings,
  getGroupById,
  getProfilePhoto,
  setProfilePhoto,
  hasProfilePassword,
  setProfilePassword,
  verifyProfilePassword,
  getMaxStreak,
} from '../storage';
import {
  getDaysInMonth,
  getMonthName,
  formatDateShort,
  getDayOfWeek,
  isWeekend,
} from '../utils/dates';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

// ============================================
// Profile — Hero photo + flame streak + calendar + historial
// ============================================

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const member = useMemo(() => getMemberById(id), [id]);
  const allAttendance = useMemo(() => (member ? getAttendanceByMember(id) : []), [id, member]);
  const streak = useMemo(() => (member ? getStreak(id) : 0), [id, member]);
  const maxStreak = useMemo(() => (member ? getMaxStreak(id) : 0), [id, member]);
  // Exclude weekends from meetings for profile stats
  const meetings = useMemo(() => getMeetings().filter(m => !isWeekend(m.date)), []);
  const group = useMemo(() => (member ? getGroupById(member.group) : null), [member]);

  const [photo, setPhoto] = useState(() => getProfilePhoto(id));
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Mascot sparkles & message state
  const [sparkles, setSparkles] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  
  const handleMascotClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newSparkle = { id: Date.now(), x, y };
    setSparkles(prev => [...prev, newSparkle]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
    }, 600);
    
    // Toggle message bubble for a few seconds
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 4000);
  };

  if (!member) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="empty-icon">😢</div>
          <p>Integrante no encontrado</p>
          <button className="neu-button primary" onClick={() => navigate('/members')} style={{ marginTop: 'var(--space-lg)' }}>
            Ver integrantes
          </button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const attendedDates = new Set(allAttendance.map(a => a.date));
  const meetingDates = new Set(meetings.map(m => m.date));

  // Current month stats
  const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  const monthAttendance = allAttendance.filter(a => a.date >= monthStart && a.date <= monthEnd);
  const monthMeetings = meetings.filter(m => m.date >= monthStart && m.date <= monthEnd);
  const monthPercentage = monthMeetings.length > 0 ? Math.round((monthAttendance.length / monthMeetings.length) * 100) : 0;

  // Alert level
  let alertLevel = 'green';
  let alertEmoji = '🟢';
  if (monthAttendance.length < 4) { alertLevel = 'red'; alertEmoji = '🔴'; }
  else if (monthAttendance.length < 8) { alertLevel = 'yellow'; alertEmoji = '🟡'; }

  // Calendar grid
  const firstDayOfMonth = getDayOfWeek(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);
  const calendarOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const calendarDays = [];
  for (let i = 0; i < calendarOffset; i++) {
    calendarDays.push({ day: null, type: 'empty' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let type = 'future';
    if (dateStr <= todayStr) {
      if (attendedDates.has(dateStr)) {
        type = 'present';
      } else if (meetingDates.has(dateStr)) {
        type = 'absent';
      } else {
        type = 'no-meeting';
      }
    }
    calendarDays.push({ day: d, date: dateStr, type, isToday: dateStr === todayStr });
  }

  // Get initials for placeholder
  const initials = member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // ---------- Photo handlers ----------
  const handlePhotoClick = () => {
    if (hasProfilePassword(id)) {
      // Need password to change
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError('');
    } else {
      // First time: set a password
      setShowSetPasswordModal(true);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.error('La imagen debe pesar menos de 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setProfilePhoto(id, base64);
      setPhoto(base64);
      toast.success('Foto actualizada');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePasswordVerify = () => {
    if (verifyProfilePassword(id, passwordInput)) {
      setShowPasswordModal(false);
      fileInputRef.current?.click();
    } else {
      setPasswordError('Contraseña incorrecta');
    }
  };

  const handleSetPassword = () => {
    if (!newPassword) {
      setPasswordError('Ingresa una contraseña');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 3) {
      setPasswordError('Mínimo 3 caracteres');
      return;
    }
    setProfilePassword(id, newPassword);
    setShowSetPasswordModal(false);
    toast.success('Contraseña de perfil establecida');
    // Now open file picker
    fileInputRef.current?.click();
  };

  return (
    <div className="main-content">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      {/* Back button */}
      <div style={{ marginBottom: 'var(--space-sm)' }}>
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
      </div>

      {/* ========== HERO SECTION ========== */}
      <div className="neu-card profile-hero" style={{ marginBottom: 'var(--space-lg)' }}>
        {/* Photo */}
        <div className="profile-photo-wrapper">
          <div className="profile-photo-ring" onClick={handlePhotoClick}>
            {photo ? (
              <img src={photo} alt={member.name} />
            ) : (
              <div className="profile-photo-placeholder">
                {initials}
              </div>
            )}
          </div>
          <button className="profile-photo-edit-btn" onClick={handlePhotoClick} title="Cambiar foto">
            📷
          </button>
        </div>

        {/* Info */}
        <div className="profile-hero-info">
          <div className="profile-name-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            <h1>{member.name}</h1>
            {streak > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="flame-badge" title={`${streak} días continuos`}>
                  <span className="flame-icon">🔥</span>
                  <span className="flame-number">{streak}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '120px', lineHeight: 1.2 }}>
                  días que mantuve viva mi fe
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <span
              className={`badge badge-group-${member.group}`}
              style={group ? { background: group.color, color: 'var(--text-primary)' } : {}}
            >
              {group ? group.name : `Grupo ${member.group}`}
            </span>
            {!member.active && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• Inactivo</span>
            )}
            {streak === 0 && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Fe por reavivar (0 días)</span>
            )}
          </div>
        </div>
      </div>

      {/* The floating interactive mascot was moved down next to the streak card */}

      {/* ========== STATS ========== */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="neu-card-flat stat-card">
          <div className="stat-value">{monthAttendance.length}</div>
          <div className="stat-label">Este mes</div>
        </div>
        <div className="neu-card-flat stat-card">
          <div className="stat-value">{monthPercentage}%</div>
          <div className="stat-label">Asistencia</div>
        </div>
        <div className="neu-card-flat stat-card">
          <div className="stat-value">{allAttendance.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="neu-card-flat stat-card">
          <span className={`alert-badge alert-${alertLevel}`}>
            {alertEmoji} {alertLevel === 'green' ? 'Bien' : alertLevel === 'yellow' ? 'Alerta' : 'Crítico'}
          </span>
          <div className="stat-label">Estado</div>
        </div>
      </div>

      {/* ========== BODY GRID (desktop: side by side) ========== */}
      <div className="profile-body-grid">
        {/* Calendar */}
        <div className="neu-card profile-calendar-card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 className="section-title">📅 {getMonthName(currentMonth)} {currentYear}</h3>
          <div className="calendar-grid" style={{ marginTop: 'var(--space-md)' }}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="calendar-day-header">{d}</div>
            ))}
            {calendarDays.map((cell, i) => (
              <div
                key={i}
                className={`calendar-day ${cell.type} ${cell.isToday ? 'today' : ''}`}
                title={cell.date || ''}
              >
                {cell.day}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', marginTop: 'var(--space-md)', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>🟦 Asistió</span>
            <span>⬜ Faltó</span>
            <span>⬛ Sin reunión</span>
          </div>
        </div>

        {/* Streak detail card */}
        <div className="neu-card profile-streak-card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 className="section-title">🔥 Días que mantuve viva mi fe</h3>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 'var(--space-md) 0', flexWrap: 'wrap', gap: 'var(--space-lg)', flex: 1 }}>
            {/* Left side: Streak info */}
            <div style={{ flex: '1 1 200px' }}>
              {streak > 0 ? (
                <>
                  <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-sm)', lineHeight: 1 }}>
                    <span className="flame-icon" style={{ fontSize: '3rem' }}>🔥</span>
                  </div>
                  <div style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: '#FF6B35',
                    lineHeight: 1,
                  }}>
                    {streak}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
                    {streak === 1 ? 'día continuo' : 'días continuos'}
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: 'var(--space-sm)' }}>🔥</div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Asiste a la próxima reunión para iniciar tu constancia.
                  </p>
                </>
              )}

              <div style={{ marginTop: 'var(--space-lg)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  🏆 Tu récord fue <strong>{maxStreak} {maxStreak === 1 ? 'día' : 'días'}</strong>.
                </span>
              </div>
            </div>

            {/* Right side: Mascot */}
            <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', margin: '0 auto', alignSelf: 'flex-end', marginTop: 'auto' }}>
              <div className="interactive-mascot" onClick={handleMascotClick}>
                {showMessage && (
                  <div className="speech-bubble">
                    {streak > 0
                      ? "¡Ánimo, sea la sonrisa de la madre!, hoy también esfuércese."
                      : "No te rindas. El Padre y La Madre siempre están con nosotros."}
                  </div>
                )}
                <img src={streak > 0 ? '/happy_angel.png' : '/sad_angel.png'} alt="Mascota Angelito" />
                {sparkles.map(s => (
                  <div key={s.id} className="sparkle" style={{ left: s.x, top: s.y }} />
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* History — spans full width on desktop */}
        <div className="neu-card profile-history">
          <h3 className="section-title">📋 Historial completo</h3>
          {allAttendance.length > 0 ? (
            <div className="list-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {allAttendance.map((record, i) => (
                <div
                  key={i}
                  className="toggle-item"
                  style={{ padding: 'var(--space-sm) var(--space-md)' }}
                >
                  <span style={{ fontSize: '0.88rem' }}>{formatDateShort(record.date)}</span>
                  <span className={`badge-method ${record.method}`}>
                    {record.method === 'qr' ? '📱 QR' : '✋ Manual'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
              <p>Sin asistencias registradas</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== PASSWORD VERIFY MODAL ========== */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="🔒 Cambiar foto"
        actions={
          <>
            <button className="neu-button" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
            <button className="neu-button primary" onClick={handlePasswordVerify}>Verificar</button>
          </>
        }
      >
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Ingresa tu contraseña de perfil para cambiar la foto.
        </p>
        <div className="form-group">
          <label>Contraseña</label>
          <input
            className="neu-input"
            type="password"
            value={passwordInput}
            onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
            placeholder="Tu contraseña"
            onKeyDown={e => e.key === 'Enter' && handlePasswordVerify()}
          />
        </div>
        {passwordError && (
          <p style={{ color: 'var(--alert-red)', fontSize: '0.82rem' }}>{passwordError}</p>
        )}
      </Modal>

      {/* ========== SET PASSWORD MODAL ========== */}
      <Modal
        isOpen={showSetPasswordModal}
        onClose={() => setShowSetPasswordModal(false)}
        title="🔑 Crear contraseña de perfil"
        actions={
          <>
            <button className="neu-button" onClick={() => setShowSetPasswordModal(false)}>Cancelar</button>
            <button className="neu-button primary" onClick={handleSetPassword}>Crear y continuar</button>
          </>
        }
      >
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Crea una contraseña para proteger tu foto. Solo tú podrás cambiarla después.
        </p>
        <div className="form-group">
          <label>Nueva contraseña</label>
          <input
            className="neu-input"
            type="password"
            value={newPassword}
            onChange={e => { setNewPassword(e.target.value); setPasswordError(''); }}
            placeholder="Mínimo 3 caracteres"
          />
        </div>
        <div className="form-group">
          <label>Confirmar contraseña</label>
          <input
            className="neu-input"
            type="password"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
            placeholder="Repite la contraseña"
            onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
          />
        </div>
        {passwordError && (
          <p style={{ color: 'var(--alert-red)', fontSize: '0.82rem' }}>{passwordError}</p>
        )}
      </Modal>
    </div>
  );
}
