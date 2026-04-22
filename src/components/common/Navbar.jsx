import { ShieldCheck } from 'lucide-react';

export function Navbar({ currentUser, onLogout }) {
  const roleLabel = currentUser?.role
    ? `${currentUser.role.charAt(0).toUpperCase()}${currentUser.role.slice(1).toLowerCase()}`
    : '';

  return (
    <header className="site-nav">
      <div className="brand-lockup">
        <div className="brand-mark">
          <span className="brand-mark-text">EM</span>
        </div>
        <div>
          <p className="brand-title">EventMatrix</p>
          <p className="brand-subtitle">Secure event operations hub</p>
        </div>
      </div>

      {currentUser ? (
        <div className="nav-actions">
          <div className="nav-pill">
            <ShieldCheck size={16} />
            <span>{roleLabel}</span>
          </div>
          <button className="nav-logout" type="button" onClick={onLogout}>Logout</button>
        </div>
      ) : (
        <div className="nav-pill">
          <ShieldCheck size={16} />
          <span>EventMatrix</span>
        </div>
      )}
    </header>
  );
}
