import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Plus, Download } from 'lucide-react';
import { fetchEmployees, fetchAttendance, downloadPayslip } from '../../api/employees';
import { AddEmployeeForm } from './AddEmployeeForm';

const roleLimits = {
  waiter: 8,
  chef: 5,
  manager: 1,
  team_lead: 1,
};

const formatRole = (value) => value.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const formatPKR = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

export function EmployeeManagementPanel({ onEmployeesUpdate }) {
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [summary, setSummary] = useState({ totalEmployees: 0, byRole: {}, totalPayroll: 0 });
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      const result = await fetchEmployees();
      setEmployees(result.employees || []);
      const newSummary = result.summary || { totalEmployees: 0, byRole: {}, totalPayroll: 0 };
      setSummary(newSummary);
      if (onEmployeesUpdate) {
        onEmployeesUpdate(newSummary);
      }

      try {
        const attendanceData = await fetchAttendance();
        if (Array.isArray(attendanceData)) {
          const map = {};
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          attendanceData.forEach((rec) => {
            if (rec.user?._id) {
              const count = (rec.attendance || []).filter((entry) => {
                const d = new Date(entry.date);
                return (
                  d.getMonth() === currentMonth &&
                  d.getFullYear() === currentYear &&
                  entry.status === 'present'
                );
              }).length;
              map[rec.user._id] = count;
            }
          });
          setAttendanceMap(map);
        }
      } catch (attErr) {
        console.error('Error fetching attendance in admin:', attErr);
      }

      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  }, [onEmployeesUpdate]);

  useEffect(() => {
    loadEmployees();
    const timer = window.setInterval(loadEmployees, 5000);
    return () => window.clearInterval(timer);
  }, [loadEmployees]);

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
    <>
      <article className="dashboard-card admin-animate-card">
        <div className="dashboard-card-header">
          <Users size={18} />
          <h3>Employee Management</h3>
          <button
            className="btn-icon-small"
            onClick={() => setShowAddForm(true)}
            title="Add new employee"
          >
            <Plus size={16} />
          </button>
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
            {employees.map((employee) => (
              <li key={employee._id} className="employee-row-item">
                <div className="employee-info-main">
                  <strong>{employee.name}</strong>
                  <span>{formatRole(employee.employeeRole || 'unassigned')}</span>
                </div>
                <div className="employee-info-stats">
                  <span>Salary: {formatPKR(employee.salary || 0)}</span>
                  <span>Present: {attendanceMap[employee._id] || 0} days</span>
                </div>
                <button
                  onClick={() => downloadPayslip(employee._id, employee.name)}
                  className="btn-action btn-download-sm"
                  title="Download payslip"
                >
                  <Download size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-copy">No employee records available yet.</p>
        )}
        {message ? <p className="dashboard-copy">{message}</p> : null}
      </article>

      {showAddForm && (
        <AddEmployeeForm
          onEmployeeAdded={loadEmployees}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </>
  );
}
