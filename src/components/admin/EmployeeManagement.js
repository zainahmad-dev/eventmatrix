import { Users } from 'lucide-react';

const workforcePlan = [
  { role: 'Waiter', limit: 8, salary: 'PKR 20,000' },
  { role: 'Chef', limit: 5, salary: 'PKR 35,000' },
  { role: 'Manager', limit: 1, salary: 'PKR 50,000' },
  { role: 'Team Lead', limit: 1, salary: 'PKR 40,000' },
];

export function EmployeeManagementPanel() {
  return (
    <article className="dashboard-card admin-animate-card">
      <div className="dashboard-card-header">
        <Users size={18} />
        <h3>Employee Management</h3>
      </div>
      <p className="dashboard-copy">Workforce policy is active: maximum 15 employees can be registered with role-specific limits and fixed salary bands.</p>
      <div className="policy-grid">
        {workforcePlan.map((item) => (
          <div className="policy-item" key={item.role}>
            <strong>{item.role}</strong>
            <span>Slots: {item.limit}</span>
            <span>Salary: {item.salary}</span>
          </div>
        ))}
      </div>
      <p className="dashboard-copy">Employee signup now requires one of these positions, and capacity is enforced by backend validation.</p>
    </article>
  );
}
