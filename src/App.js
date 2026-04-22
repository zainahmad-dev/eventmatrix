import { useMemo, useState } from 'react';
import './App.css';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LoginPage } from './components/pages/LoginPage';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { CustomerDashboard } from './components/pages/CustomerDashboard';
import { EmployeeDashboard } from './components/pages/EmployeeDashboard';

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem('eventmatrix_user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser);

  const rolePage = useMemo(() => {
    if (!currentUser?.role) {
      return <LoginPage onLoginSuccess={setCurrentUser} />;
    }

    if (currentUser.role === 'admin') {
      return <AdminDashboard user={currentUser} />;
    }

    if (currentUser.role === 'employee') {
      return <EmployeeDashboard user={currentUser} />;
    }

    return <CustomerDashboard user={currentUser} />;
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('eventmatrix_token');
    localStorage.removeItem('eventmatrix_user');
    setCurrentUser(null);
  };

  return (
    <div className="app-shell">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      <main className="app-main">
        {rolePage}
      </main>
      <Footer />
    </div>
  );
}

export default App;
