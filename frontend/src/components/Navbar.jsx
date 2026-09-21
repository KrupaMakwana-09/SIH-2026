import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  LogOut,
  Lock,
  Menu,
  Stethoscope,
  User,
  AlertTriangle,
  X as XIcon,
  ChevronRight,
  Droplet
} from 'lucide-react';
import { getOfflineQueue } from '../utils/offlineStorage';
import { ROLE_NAV_ITEMS, getRoleDefaultTab } from '../utils/navigationConfig';
import { api } from '../utils/api';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenSOS,
  onOpenBlood,
  onOpenAuth,
  currentUser,
  onLogout
}) {
  const [pendingRemindersCount, setPendingRemindersCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'doctor') {
      const fetchReminders = async () => {
        try {
          const res = await api.getDoctorReminders();
          if (res?.success && res.reminders) {
            setPendingRemindersCount(res.reminders.filter(r => r.status === 'PENDING').length);
          }
        } catch {}
      };
      fetchReminders();
      const interval = setInterval(fetchReminders, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeTab]);

  const navItems = (() => {
    if (!currentUser) return ROLE_NAV_ITEMS['asha'] || [];
    const role = currentUser.role;
    return ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS['citizen'] || [];
  })();

  const handleBrandClick = () => {
    if (currentUser) {
      setActiveTab(getRoleDefaultTab(currentUser.role));
    } else {
      setActiveTab('staff');
    }
  };

  const handleProfileClick = () => {
    if (currentUser?.role === 'doctor') {
      setActiveTab('profile');
      setMobileMenuOpen(false);
    } else if (currentUser?.role === 'patient' || currentUser?.role === 'citizen') {
      setActiveTab('patientProfile');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="border-b-thick" style={{ position: 'sticky', top: 0, zIndex: 50, background: '#ffffff', borderBottom: '2px solid var(--border)' }}>
      {/* ── Main Top Bar ── */}
      <div className="container flex items-center justify-between" style={{ minHeight: '72px' }}>
        {/* Brand */}
        <div
          className="flex items-center gap-4 border-r-thin py-4"
          style={{ cursor: 'pointer', flexShrink: 0, paddingRight: '1.5rem' }}
          onClick={handleBrandClick}
          title="GraminArogya Home"
        >
          <img src="/images/logo.png" alt="GraminArogya Logo" style={{ height: '44px', objectFit: 'contain' }} />
          <div className="brand-text-hide">
            <div className="flex items-center gap-2">
              <span className="badge badge-hide">NRHM</span>
            </div>
            <div className="font-mono text-muted uppercase mt-2" style={{ fontSize: '0.65rem' }}>
              Rural Health Access & Care
            </div>
          </div>
        </div>

        {/* ── Desktop Navigation Tabs ── */}
        {currentUser?.role !== 'doctor' && (
          <nav className="desktop-nav flex items-center h-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 h-full px-4 border-r-thin font-mono uppercase text-sm ${isActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                  style={{ minHeight: '72px', transition: 'none', border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* ── Right Actions ── */}
        <div className="flex items-center h-full flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center h-full border-l-thin">
              {(() => {
                const isProfileActive = (currentUser?.role === 'doctor' && activeTab === 'profile') ||
                                        (['patient', 'citizen'].includes(currentUser?.role) && (activeTab === 'patientProfile' || activeTab === 'PatientProfile'));
                return (
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    title="Click to open My Profile page"
                    className={`flex items-center gap-2 h-full px-4 font-mono uppercase text-sm border-r-thin ${isProfileActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                    style={{ minHeight: '72px', transition: 'none', borderTop: 'none', borderBottom: 'none', cursor: 'pointer' }}
                  >
                    <User size={16} strokeWidth={1.5} />
                    <span className="user-name-label">{currentUser?.name ? currentUser.name.split(' ')[0] : (currentUser?.username || 'User')}</span>
                    <span className="badge" style={{ borderColor: isProfileActive ? 'var(--background)' : 'var(--foreground)', color: isProfileActive ? 'var(--background)' : 'var(--foreground)' }}>
                      {currentUser?.role || ''}
                    </span>
                  </button>
                );
              })()}

              <button
                onClick={onLogout}
                title="Sign Out"
                className="flex items-center justify-center h-full px-4 border-r-thin bg-white hover:bg-black hover:text-white"
                style={{ minHeight: '72px', transition: 'none', borderTop: 'none', borderBottom: 'none', cursor: 'pointer' }}
              >
                <LogOut size={16} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 h-full px-6 font-mono uppercase text-sm border-l-thin border-r-thin bg-white hover:bg-black hover:text-white"
              style={{ minHeight: '72px', transition: 'none', cursor: 'pointer' }}
            >
              <Lock size={16} strokeWidth={1.5} />
              <span>Login</span>
            </button>
          )}

          {/* Blood Help Button */}
          <button
            onClick={onOpenBlood}
            className="flex items-center gap-2 h-full px-6 font-mono uppercase text-sm border-r-thin"
            style={{ minHeight: '72px', backgroundColor: 'var(--background)', color: 'var(--foreground)', transition: 'none', cursor: 'pointer' }}
            title="Emergency Blood Donors & NGO Finder"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--foreground)'; e.currentTarget.style.color = 'var(--background)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--background)'; e.currentTarget.style.color = 'var(--foreground)'; }}
          >
            <Droplet size={16} strokeWidth={1.5} />
            <span className="blood-label">Blood Donors</span>
          </button>

          {/* SOS Button */}
          <button
            onClick={onOpenSOS}
            className="btn-emergency-monochrome"
            style={{ minHeight: '72px', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: 'none' }}
          >
            <AlertTriangle size={16} strokeWidth={1.5} />
            <span className="sos-label">108 SOS</span>
          </button>

          {/* Mobile Hamburger */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '1rem',
              cursor: 'pointer',
              display: 'none', /* handled by media query */
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              borderLeft: '1px solid var(--border)'
            }}
          >
            {mobileMenuOpen ? <XIcon size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Full Drawer Menu ── */}
      {mobileMenuOpen && (
        <div className="mobile-nav bg-white border-b-thick" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          {currentUser?.role === 'doctor' && (
            <div
              onClick={handleProfileClick}
              className="flex items-center justify-between p-4 border-b-thin hover:bg-black hover:text-white"
              style={{ cursor: 'pointer', transition: 'none' }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center border-thin w-10 h-10">
                  <Stethoscope size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-display text-lg font-bold">
                    {currentUser.name || 'Doctor Portal'}
                  </div>
                  <div className="font-mono text-xs uppercase mt-1">
                    My Profile & Settings →
                  </div>
                </div>
              </div>
              <span className="badge">DOCTOR</span>
            </div>
          )}

          {['patient', 'citizen'].includes(currentUser?.role) && (
            <div
              onClick={handleProfileClick}
              className="flex items-center justify-between p-4 border-b-thin hover:bg-black hover:text-white"
              style={{ cursor: 'pointer', transition: 'none' }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center border-thin w-10 h-10">
                  <User size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-display text-lg font-bold">
                    {currentUser.name || 'Patient Portal'}
                  </div>
                  <div className="font-mono text-xs uppercase mt-1">
                    My Health Profile →
                  </div>
                </div>
              </div>
              <span className="badge">PATIENT</span>
            </div>
          )}

          <div className="flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badgeCount = (item.badgeKey === 'reminders' && pendingRemindersCount > 0) ? pendingRemindersCount : null;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-between w-full p-4 border-b-thin font-mono uppercase text-sm ${isActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                  style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', transition: 'none' }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 border-thin ${isActive ? 'bg-white text-black' : 'bg-black text-white'}`}>
                      <Icon size={16} strokeWidth={1.5} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div className="font-bold">
                        {item.label}
                      </div>
                      {item.description && (
                        <div className="text-xs mt-1" style={{ opacity: 0.7 }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {badgeCount && (
                      <span className="badge">
                        {badgeCount}
                      </span>
                    )}
                    <ChevronRight size={16} strokeWidth={1.5} />
                  </div>
                </button>
              );
            })}
            
            {currentUser && (
              <button
                onClick={onLogout}
                className="flex items-center justify-between w-full p-4 border-b-thin font-mono uppercase text-sm bg-white text-black hover:bg-black hover:text-white"
                style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', transition: 'none' }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 border-thin bg-black text-white">
                    <LogOut size={16} strokeWidth={1.5} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div className="font-bold text-red-600">Sign Out</div>
                    <div className="text-xs mt-1" style={{ opacity: 0.7 }}>Log out of your account</div>
                  </div>
                </div>
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

