import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { initializeStorage } from './storage';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Home from './views/Home';
import Attendance from './views/Attendance';
import Members from './views/Members';
import Profile from './views/Profile';
import Reports from './views/Reports';
import Admin from './views/Admin';
import './index.css';

// ============================================
// App — Root component with router
// ============================================

export default function App() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <HashRouter>
      <ToastProvider>
        <div className="app-layout">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/members" element={<Members />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Navbar />
        </div>
      </ToastProvider>
    </HashRouter>
  );
}
