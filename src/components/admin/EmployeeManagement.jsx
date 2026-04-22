import { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { fetchEmployees } from '../../api/employees';

const roleLimits = {
  waiter: 8,
  chef: 5,
  manager: 1,
  team_lead: 1,
};

const formatRole = (value) => value.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const formatPKR = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

export function EmployeeManagementPanel() {
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({ totalEmployees: 0, byRole: {}, totalPayroll: 0 });
  const [message, setMessage] = useState('');

  const loadEmployees = async () => {
    try {
      const result = await fetchEmployees();
      setEmployees(result.employees || []);
      setSummary(result.summary || { totalEmployees: 0, byRole: {}, totalPayroll: 0 });
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadEmployees();
    const timer = window.setInterval(loadEmployees, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const roleRows = useMemo(() => (
    Object.keys(roleLimits).map((role) => {
      const used = Number(summary.byRole?.[role] || 0);
      const limit = roleLimits[role];
      return {
        role: formatRole(role),
        used,
        limit,
      };
    })
  ), [summary.byRole]);

  return (
    <article className="dashboard-card admin-animate-card">
      <div className="dashboard-card-header">
        <Users size={18} />
        <h3>Employee Management</h3>
      </div>
      <p className="dashboard-copy">Realtime workforce status synced from database.</p>
      <div className="policy-grid">
        {roleRows.map((item) => (
          <div className="policy-item" key={item.role}>
            <strong>{item.role}</strong>
            <span>Filled: {item.used} / {item.limit}</span>
            <span>Remaining: {Math.max(item.limit - item.used, 0)}</span>
          </div>
        ))}
      </div>
      <p className="dashboard-copy">Total Employees: {summary.totalEmployees} / 15 | Payroll: {formatPKR(summary.totalPayroll)}</p>
      {employees.length ? (
        <ul className="dashboard-list">
          {employees.slice(0, 5).map((employee) => (
            <li key={employee._id}>{employee.name} | {formatRole(employee.employeeRole || 'unassigned')} | {formatPKR(employee.salary || 0)}</li>
          ))}
        </ul>
      ) : (
        <p className="dashboard-copy">No employee records available yet.</p>
      )}
      {message ? <p className="dashboard-copy">{message}</p> : null}
    </article>
  );
}
