import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Dashboard.css';

/* ─── helpers ─────────────────────────────────────────────────── */
const getInitials = (firstName = '', lastName = '', email = '') => {
  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  return email.charAt(0).toUpperCase();
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const providerMeta = {
  google: { label: 'Google', color: '#4285F4', icon: '🔵' },
  github: { label: 'GitHub', color: '#24292e', icon: '⚫' },
  email: { label: 'Email / Password', color: '#673ab7', icon: '✉️' },
};

/* ─── Skeleton shimmer ────────────────────────────────────────── */
const Skeleton = ({ className }) => (
  <div className={`skeleton ${className ?? ''}`} />
);

/* ─── Main component ─────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { setLoggedOut } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('accounts/me/')
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load profile. Please refresh.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post('accounts/logout/');
      setLoggedOut();                        // clear AuthContext immediately
      navigate('/login', { replace: true }); // replace so Back can't return to dashboard
    } catch {
      setError('Failed to log out. Please try again.');
      setLoggingOut(false);
    }
  };

  const provider = providerMeta[user?.auth_provider] ?? providerMeta.email;
  const showPhoto = user?.profile_picture && !imgError;

  return (
    <div className="dashboard-root">
      {/* ── animated background blobs ── */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="dashboard-center">
        {/* ── header ── */}
        <header className="dashboard-header">
          <div className="header-brand">
            <span className="brand-icon">⚡</span>
            <span className="brand-name">RefineX</span>
          </div>
          <button
            id="logout-btn"
            className="logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <span className="spinner" />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Log out
              </>
            )}
          </button>
        </header>

        {/* ── error banner ── */}
        {error && (
          <div className="error-banner" role="alert">
            ⚠️ {error}
          </div>
        )}

        {/* ── profile card ── */}
        <div className="profile-card" role="main">
          {/* card glow border */}
          <div className="card-glow" />

          {/* ── avatar section ── */}
          <div className="avatar-section">
            {loading ? (
              <Skeleton className="avatar-skeleton" />
            ) : showPhoto ? (
              <img
                id="profile-avatar-img"
                src={user.profile_picture}
                alt={`${user.first_name} ${user.last_name}`}
                className="avatar-img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                id="profile-avatar-initials"
                className="avatar-initials"
                aria-label="User initials avatar"
              >
                {user ? getInitials(user.first_name, user.last_name, user.email) : '?'}
              </div>
            )}

            {/* online indicator */}
            {!loading && <span className="online-dot" title="Active" />}
          </div>

          {/* ── user name / email ── */}
          <div className="user-identity">
            {loading ? (
              <>
                <Skeleton className="skel-name" />
                <Skeleton className="skel-email" />
              </>
            ) : (
              <>
                <h1 id="profile-name" className="user-name">
                  {user?.first_name || user?.last_name
                    ? `${user.first_name} ${user.last_name}`.trim()
                    : 'User'}
                </h1>
                <p id="profile-email" className="user-email">
                  {user?.email}
                </p>
              </>
            )}
          </div>

          {/* ── provider badge ── */}
          {!loading && (
            <div
              id="provider-badge"
              className="provider-badge"
              style={{ '--badge-color': provider.color }}
            >
              <span>{provider.icon}</span>
              <span>{provider.label}</span>
            </div>
          )}

          {/* ── divider ── */}
          <div className="card-divider" />

          {/* ── detail grid ── */}
          <div className="detail-grid">
            <DetailRow
              loading={loading}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              }
              label="First Name"
              id="detail-first-name"
              value={user?.first_name || '—'}
            />
            <DetailRow
              loading={loading}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              }
              label="Last Name"
              id="detail-last-name"
              value={user?.last_name || '—'}
            />
            <DetailRow
              loading={loading}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              }
              label="Email"
              id="detail-email"
              value={user?.email}
              full
            />
            <DetailRow
              loading={loading}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              }
              label="Email Verified"
              id="detail-email-verified"
              value={
                user?.is_email_verified ? (
                  <span className="badge badge-green">✓ Verified</span>
                ) : (
                  <span className="badge badge-amber">⚠ Not verified</span>
                )
              }
            />
            <DetailRow
              loading={loading}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              }
              label="Member Since"
              id="detail-date-joined"
              value={formatDate(user?.date_joined)}
            />
            <DetailRow
              loading={loading}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              }
              label="Auth Provider"
              id="detail-auth-provider"
              value={provider.label}
            />
          </div>
        </div>

        {/* ── footer ── */}
        <p className="dashboard-footer">
          RefineX © {new Date().getFullYear()} — Your AI-powered data refinement platform
        </p>
      </div>
    </div>
  );
};

/* ─── DetailRow sub-component ────────────────────────────────── */
const DetailRow = ({ loading, icon, label, value, id, full }) => (
  <div className={`detail-row ${full ? 'detail-row-full' : ''}`}>
    <div className="detail-icon">{icon}</div>
    <div className="detail-content">
      <span className="detail-label">{label}</span>
      {loading ? (
        <Skeleton className="skel-value" />
      ) : (
        <span id={id} className="detail-value">
          {value ?? '—'}
        </span>
      )}
    </div>
  </div>
);

export default Dashboard;