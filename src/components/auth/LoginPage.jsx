import { useState } from 'react';
import {
  ArrowRight,
  Clock3,
  LoaderCircle,
  Sparkles,
} from 'lucide-react';
import { loginUser, signupUser } from '../../api/auth';

const loginRoles = ['customer', 'employee', 'admin'];
const employeeRoles = [
  { value: 'waiter', label: 'Waiter' },
  { value: 'chef', label: 'Chef' },
  { value: 'manager', label: 'Manager' },
  { value: 'team_lead', label: 'Team Lead' },
];

export function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [loginRole, setLoginRole] = useState('customer');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', role: 'customer', employeeRole: 'waiter' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await loginUser(formData);
        if (response.user.role !== loginRole) {
          setError(`This account is ${response.user.role}. Please select ${response.user.role} and try again.`);
          return;
        }
        localStorage.setItem('eventmatrix_token', response.token);
        localStorage.setItem('eventmatrix_user', JSON.stringify(response.user));
        setSuccessMessage(`Signed in successfully as ${response.user.role}. Selected role: ${loginRole}.`);
        if (onLoginSuccess) {
          onLoginSuccess(response.user);
        }
        return;
      }

      const response = await signupUser(signupData);
      setSuccessMessage(`Account created for ${response.email}. You can now sign in.`);
      setMode('login');
      setFormData({ email: signupData.email, password: '' });
      setLoginRole(signupData.role);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-grid login-grid--compact" aria-label="EventMatrix login">
      <section className="auth-panel auth-panel--compact">
        <div className="auth-header">
          <span className="eyebrow">
            <Sparkles size={14} />
            {mode === 'login' ? 'Secure sign in' : 'Create account'}
          </span>
          <h2>{mode === 'login' ? 'Sign in to EventMatrix' : 'Create your EventMatrix account'}</h2>
          <p>
            {mode === 'login'
              ? 'Use your registered email and password to access your dashboard.'
              : 'Register once and choose admin, employee, or customer during signup.'}
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === 'login' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMessage('');
            }}
          >
            Login
          </button>
          <button
            className={mode === 'signup' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccessMessage('');
            }}
          >
            Create account
          </button>
        </div>

        {mode === 'login' ? (
          <div className="field-group">
            <label className="field-label">Login as</label>
            <div className="role-picker" role="radiogroup" aria-label="Login role">
              {loginRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={loginRole === role ? 'role-chip role-chip--active' : 'role-chip'}
                  onClick={() => setLoginRole(role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
            <p className="role-help">Choose whether you want to sign in as a customer, employee, or admin.</p>
          </div>
        ) : null}

        {error ? <div className="error-banner" role="alert">{error}</div> : null}
        {successMessage ? <div className="success-banner" role="status">{successMessage}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <div className="field-group">
              <label className="field-label" htmlFor="name">Full name</label>
              <input
                className="field-input"
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={signupData.name}
                onChange={handleSignupChange}
                required
              />
            </div>
          ) : null}

          {mode === 'signup' ? (
            <div className="field-group">
              <label className="field-label">Create account as</label>
              <div className="role-picker" role="radiogroup" aria-label="Signup role">
                {loginRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={signupData.role === role ? 'role-chip role-chip--active' : 'role-chip'}
                    onClick={() => setSignupData((current) => ({ ...current, role }))}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mode === 'signup' && signupData.role === 'employee' ? (
            <div className="field-group">
              <label className="field-label">Employee position</label>
              <div className="role-picker" role="radiogroup" aria-label="Employee position">
                {employeeRoles.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={signupData.employeeRole === item.value ? 'role-chip role-chip--active' : 'role-chip'}
                    onClick={() => setSignupData((current) => ({ ...current, employeeRole: item.value }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="role-help">Allowed staffing: 8 Waiters, 5 Chefs, 1 Manager, 1 Team Lead.</p>
            </div>
          ) : null}

          <div className="field-group">
            <label className="field-label" htmlFor={mode === 'login' ? 'email' : 'signup-email'}>Email address</label>
            <input
              className="field-input"
              id={mode === 'login' ? 'email' : 'signup-email'}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={mode === 'login' ? formData.email : signupData.email}
              onChange={mode === 'login' ? handleLoginChange : handleSignupChange}
              required
            />
          </div>

          <div className="field-group">
            <div className="field-row">
              <label className="field-label" htmlFor={mode === 'login' ? 'password' : 'signup-password'}>Password</label>
              {mode === 'signup' ? <span className="field-note">Minimize password reuse</span> : null}
            </div>
            <input
              className="field-input"
              id={mode === 'login' ? 'password' : 'signup-password'}
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
              value={mode === 'login' ? formData.password : signupData.password}
              onChange={mode === 'login' ? handleLoginChange : handleSignupChange}
              required
            />
          </div>

          <button className="primary-action" type="submit" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle size={18} className="spin-icon" />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {mode === 'login' ? `Continue as ${loginRole.charAt(0).toUpperCase() + loginRole.slice(1)}` : 'Create account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {mode === 'signup' ? (
            <button
              className="secondary-action"
              type="button"
              disabled={loading}
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMessage('');
              }}
            >
              <Clock3 size={16} />
              I already have an account
            </button>
          ) : null}
        </form>
      </section>
    </section>
  );
}