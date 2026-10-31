import { NavLink } from 'react-router-dom';

// ============================================
// Navbar — Bottom navigation (mobile), side (desktop)
// ============================================

const navItems = [
  { to: '/', icon: '🏠', label: 'Inicio' },
  { to: '/attendance', icon: '✅', label: 'Asistencia' },
  { to: '/members', icon: '👥', label: 'Integrantes' },
  { to: '/reports', icon: '📊', label: 'Reportes' },
  { to: '/admin', icon: '⚙️', label: 'Admin' },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
