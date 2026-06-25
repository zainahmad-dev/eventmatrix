import { useState } from 'react';
import { X } from 'lucide-react';
import { createEmployee } from '../../api/employees';

const EMPLOYEE_ROLES = {
  waiter: 'Waiter',
  chef: 'Chef',
  manager: 'Manager',
  team_lead: 'Team Lead',
};

export function AddEmployeeForm({ onEmployeeAdded, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    employeeRole: 'waiter',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: 'employee',
        employeeRole: formData.employeeRole,
      };

      if (!payload.name || !payload.email || !payload.password) {
        throw new Error('Name, email, and password are required.');
      }

      const result = await createEmployee(payload);
      setSuccess(`Employee "${result.name}" added successfully!`);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        employeeRole: 'waiter',
      });
      if (onEmployeeAdded) onEmployeeAdded();
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message || 'Failed to add employee.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Employee</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Employee full name"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="employee@example.com"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Secure password"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+92 300 1234567"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Employee Role *</label>
            <select
              name="employeeRole"
              value={formData.employeeRole}
              onChange={handleChange}
              disabled={loading}
              required
            >
              {Object.entries(EMPLOYEE_ROLES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
