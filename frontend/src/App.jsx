import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './pages/PublicLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import FindCare from './pages/FindCare';
import Network from './pages/Network';
import Articles from './pages/Articles';
import ArticlePage from './pages/ArticlePage';
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';
import Contact from './pages/Contact';
import Navbar from './components/Navbar';
import StaffPortal from './views/StaffPortal';
import SmartRouting from './views/SmartRouting';
import ReferralHub from './views/ReferralHub';
import GovDashboard from './views/GovDashboard';
import AdminPortal from './views/AdminPortal';
import DoctorPanel from './views/DoctorPanel';
import PatientProfile from './views/PatientProfile';
import PharmacyPortal from './views/PharmacyPortal';
import VoiceModal from './components/VoiceModal';
import QRCodeModal from './components/QRCodeModal';
import SOSModal from './components/SOSModal';
import AuthModal from './components/AuthModal';
import NearbyHospitals from './components/NearbyHospitals';
import BloodFinderModal from './components/BloodFinderModal';
import { api } from './utils/api';
import { getOfflineQueue, clearOfflineQueue } from './utils/offlineStorage';
import {
  MapPin, X, Navigation, ShieldCheck, HeartPulse, Droplet,
  Search, Crosshair, ArrowRight, ArrowUpRight, Phone, Clock,
  Building2, Users, FileText, Activity, Stethoscope, Globe,
  AlertTriangle, Syringe, BookOpen, Lock, Plus, Minus, Menu
} from 'lucide-react';
import { ROLE_NAV_ITEMS, getRoleDefaultTab, isTabAllowedForRole } from './utils/navigationConfig';

/* ============================================================
   NEWSPRINT DESIGN SYSTEM
   "All the News That's Fit to Print" — applied to rural healthcare
   ============================================================ */


import PublicFooter from './components/PublicFooter';

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const [activeTab, setActiveTab] = useState('staff');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Modals state
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);
  const [isBloodOpen, setIsBloodOpen] = useState(false);

  // Cross-view data sharing
  const [selectedPatientForRouting, setSelectedPatientForRouting] = useState(null);
  const [activeQRReferral, setActiveQRReferral] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Search UI-only state
  const [searchTab, setSearchTab] = useState('hospitals');
  
  // Mobile UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('gramin_arogya_token');
      const storedUser = localStorage.getItem('gramin_arogya_user');
      if (token && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);
          setActiveTab(getRoleDefaultTab(parsed.role));

          const meRes = await api.getMe();
          if (meRes.success) {
            setCurrentUser(meRes.user);
            setActiveTab(getRoleDefaultTab(meRes.user.role));
          }
          if (window.location.pathname !== '/' && window.location.pathname !== '/sign-in') {
            window.history.replaceState(null, '', '/');
          }
        } catch (e) {
          console.warn('Auth token refresh error');
        }
      }
      setAuthLoading(false);
    };
    checkAuth();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Strict role boundary enforcement
  useEffect(() => {
    if (currentUser) {
      if (!isTabAllowedForRole(activeTab, currentUser.role)) {
        setActiveTab(getRoleDefaultTab(currentUser.role));
      }
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('gramin_arogya_token');
    localStorage.removeItem('gramin_arogya_user');
    setCurrentUser(null);
    setActiveTab('staff');
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab(getRoleDefaultTab(user.role));
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
  };

  const handleSyncOffline = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;
    setSyncLoading(true);
    try {
      const res = await api.syncOfflineQueue(queue);
      if (res.success) {
        clearOfflineQueue();
        alert(`Synced ${res.syncedCount} queued records to central health database!`);
      }
    } catch (e) {
      alert('Could not sync records. Central server unreachable.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handlePatientSelected = (patient) => {
    setSelectedPatientForRouting(patient);
    setActiveTab('routing');
  };

  const handleReferralCreated = (referral) => {
    setActiveQRReferral(referral);
    setIsQROpen(true);
  };

  const handleOpenQR = (referral) => {
    setActiveQRReferral(referral);
    setIsQROpen(true);
  };

  /* ---------------------------------------------------------
     LOADING
     --------------------------------------------------------- */
  if (authLoading) {
    return (
      <>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--background)' }}>
          <div className="loading">
            <svg width="64px" height="48px">
                <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back"></polyline>
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front"></polyline>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginTop: '20px', letterSpacing: '0.05em' }}>
            CONNECTING...
          </div>
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------
     PUBLIC LANDING (not logged in)
     --------------------------------------------------------- */
  if (!currentUser) {
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });

    return (
      <>
        <Routes>
          <Route path="/" element={
            <PublicLayout 
              today={today} 
              isMobileMenuOpen={isMobileMenuOpen} 
              setIsMobileMenuOpen={setIsMobileMenuOpen} 
              setIsSOSOpen={setIsSOSOpen} 
              setIsAuthOpen={setIsAuthOpen} 
            />
          }>
            <Route index element={<Home setIsNearbyOpen={setIsNearbyOpen} setIsBloodOpen={setIsBloodOpen} />} />
            <Route path="services" element={<Services setIsNearbyOpen={setIsNearbyOpen} setIsBloodOpen={setIsBloodOpen} setIsSOSOpen={setIsSOSOpen} />} />
            <Route path="find-care" element={<FindCare setIsNearbyOpen={setIsNearbyOpen} setIsBloodOpen={setIsBloodOpen} setIsSOSOpen={setIsSOSOpen} />} />
            <Route path="network" element={<Network />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/:slug" element={<ArticlePage />} />
            <Route path="sign-in" element={<SignIn />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="contact" element={<Contact />} />
          </Route>
        </Routes>

        {/* ---------------- MODALS ---------------- */}
        <BloodFinderModal
          isOpen={isBloodOpen}
          onClose={() => setIsBloodOpen(false)}
        />
        {isNearbyOpen && (
          <div className="np-overlay">
            <div className="np-modal">
              <div className="np-modal-head">
                <div className="np-modal-head-left">
                  <div className="np-modal-head-icon">
                    <MapPin size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="np-modal-title">Nearby Healthcare Facilities</h2>
                    <div className="np-modal-sub">Verified hospitals · routes · contact details</div>
                  </div>
                </div>
                <button onClick={() => setIsNearbyOpen(false)} className="np-modal-close" aria-label="Close">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className="np-modal-body">
                <NearbyHospitals />
              </div>
            </div>
          </div>
        )}
        {/* Floating Emergency Cluster: Blood Requirement & 108 SOS */}
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => setIsBloodOpen(true)}
            className="np-btn"
            style={{
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              padding: '14px 18px',
              boxShadow: '0 4px 12px rgba(185, 28, 28, 0.25)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '0.85rem',
              letterSpacing: '0.02em',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(185, 28, 28, 0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(185, 28, 28, 0.25)'; }}
            aria-label="Blood Donors & Emergency Help"
            title="Blood Donors & Help"
          >
            <Droplet size={16} fill="#ffffff" strokeWidth={1.5} />
            <span>Blood Donors</span>
          </button>

          <button
            onClick={() => setIsSOSOpen(true)}
            className="np-btn np-btn-red"
            style={{ 
              padding: '14px 18px', 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)'; }}
            aria-label="Emergency SOS"
          >
            <Phone size={15} strokeWidth={1.5} />
            108 SOS
          </button>
        </div>
        <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
        <BloodFinderModal isOpen={isBloodOpen} onClose={() => setIsBloodOpen(false)} />
      </>
    );
  }

  /* ---------------------------------------------------------
     LOGGED-IN APP
     --------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-white">
      

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenBlood={() => setIsBloodOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOnline={isOnline}
        onSyncOffline={handleSyncOffline}
        syncLoading={syncLoading}
      />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        <div className="w-full h-full" key={activeTab}>
          {/* DOCTOR PANEL: strictly accessible ONLY to Doctor (and Admin oversight) */}
          {(activeTab === 'doctor' || ['history', 'reminders', 'leaveSchedule', 'prescriptions', 'profile', 'branding', 'phoneFetch'].includes(activeTab)) && (currentUser?.role === 'doctor' || currentUser?.role === 'admin') && (
            <DoctorPanel
              currentUser={currentUser}
              onAuthSuccess={handleAuthSuccess}
              activeSubTab={['history', 'reminders', 'leaveSchedule', 'prescriptions', 'profile', 'branding', 'phoneFetch'].includes(activeTab) ? activeTab : 'history'}
              setActiveSubTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* STAFF FIELD PORTAL: strictly accessible to Staff and Admin */}
          {activeTab === 'staff' && (currentUser?.role === 'staff' || currentUser?.role === 'admin') && (
            <StaffPortal
              onOpenVoiceModal={() => setIsVoiceOpen(true)}
              onSelectPatientForRouting={handlePatientSelected}
              isOnline={isOnline}
              currentUser={currentUser}
            />
          )}

          {/* SMART ROUTING: accessible to Staff, CMO, Citizen, Patient, Admin */}
          {activeTab === 'routing' && ['staff', 'asha', 'cmo', 'citizen', 'patient', 'admin'].includes(currentUser?.role) && (
            <SmartRouting
              selectedPatient={selectedPatientForRouting}
              onReferralCreated={handleReferralCreated}
            />
          )}

          {/* REFERRAL HUB: accessible to Staff, CMO, Citizen, Patient, Admin */}
          {activeTab === 'referrals' && ['staff', 'asha', 'cmo', 'citizen', 'patient', 'admin'].includes(currentUser?.role) && (
            <ReferralHub
              onOpenQRModal={handleOpenQR}
            />
          )}

          {/* GOV & ADMIN DASHBOARD */}
          {activeTab === 'gov' && ['cmo', 'admin'].includes(currentUser?.role) && (
            <GovDashboard />
          )}

          {/* ADMIN PORTAL: strictly Admin */}
          {activeTab === 'admin' && currentUser?.role === 'admin' && (
            <AdminPortal currentUser={currentUser} onLogout={handleLogout} />
          )}

          {/* CITIZEN / PATIENT PROFILE */}
          {(activeTab === 'patientProfile' || activeTab === 'PatientProfile') && ['patient', 'citizen', 'admin'].includes(currentUser?.role) && (
            <PatientProfile
              currentUser={currentUser}
              onProfileUpdated={(updatedUser) => {
                setCurrentUser(prev => ({ ...prev, ...updatedUser }));
              }}
            />
          )}

          {/* PHARMACIST PORTAL: strictly Pharmacist (and Admin oversight) */}
          {['pharmacy', 'pharmacyInventory', 'pharmacyStockIn', 'pharmacyTransactions', 'pharmacyUsage'].includes(activeTab) &&
            (currentUser?.role === 'pharmacist' || currentUser?.role === 'admin') && (
            <PharmacyPortal
              currentUser={currentUser}
              activeSubTab={
                activeTab === 'pharmacy' ? 'dispense'
                : activeTab === 'pharmacyInventory' ? 'inventory'
                : activeTab === 'pharmacyStockIn' ? 'stockIn'
                : activeTab === 'pharmacyTransactions' ? 'transactions'
                : activeTab === 'pharmacyUsage' ? 'usage'
                : 'dispense'
              }
            />
          )}
        </div>
      </main>

      <PublicFooter />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onOpenBlood={() => setIsBloodOpen(true)}
      />

      <BloodFinderModal
        isOpen={isBloodOpen}
        onClose={() => setIsBloodOpen(false)}
      />

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onTriageComplete={(result) => {
          console.log('Triage extracted:', result);
        }}
      />

      <QRCodeModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        referral={activeQRReferral}
      />

      {/* Floating Emergency Cluster: Blood Requirement & 108 SOS */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => setIsBloodOpen(true)}
          className="np-btn"
          style={{
            background: '#b91c1c',
            color: '#ffffff',
            border: 'none',
            padding: '14px 18px',
            boxShadow: '0 4px 12px rgba(185, 28, 28, 0.25)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            borderRadius: '8px',
            fontSize: '0.85rem',
            letterSpacing: '0.02em',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(185, 28, 28, 0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(185, 28, 28, 0.25)'; }}
          aria-label="Blood Donors & Emergency Help"
          title="Blood Donors & Help"
        >
          <Droplet size={16} fill="#ffffff" strokeWidth={1.5} />
          <span>Blood Donors</span>
        </button>

        <button
          onClick={() => setIsSOSOpen(true)}
          className="np-btn np-btn-red"
          style={{ 
            padding: '14px 18px', 
            borderRadius: '8px', 
            border: 'none', 
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)'; }}
          aria-label="Emergency SOS"
        >
          <Phone size={15} strokeWidth={1.5} />
          108 SOS
        </button>
      </div>

      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
      />
    </div>
  );
}

