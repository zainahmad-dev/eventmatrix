import { useEffect, useMemo, useState } from 'react';
import { BadgeDollarSign, Bell, CalendarClock, CheckSquare, ClipboardCheck, Star, UserCheck } from 'lucide-react';
import { fetchEvents } from '../../api/events';
import { EmployeeNavbar } from '../common/EmployeeNavbar';

const formatPKR = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

function FeatureCard({ icon, title, items }) {
  return (
    <article className="dashboard-card">
      <div className="dashboard-card-header">
        {icon}
        <h3>{title}</h3>
      </div>
      <ul className="dashboard-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export function EmployeeDashboard({ user }) {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const sectionItems = [
    { id: 'employee-overview', label: 'Overview' },
    { id: 'employee-event-tasks', label: 'Event Tasks' },
    { id: 'employee-timeline', label: 'Timeline' },
    { id: 'employee-tools', label: 'Tools' },
  ];

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadEvents();
    const timer = window.setInterval(loadEvents, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const approvedEvents = useMemo(() => events.filter((event) => event.status === 'approved'), [events]);
  const pendingEvents = useMemo(() => events.filter((event) => event.status === 'pending'), [events]);
  const completedEvents = useMemo(() => events.filter((event) => event.status === 'completed'), [events]);

  const tasks = useMemo(() => {
    if (!approvedEvents.length) {
      return ['No approved event assigned yet. Waiting for admin approvals.', 'Check back after booking approvals are made.'];
    }

    return approvedEvents.slice(0, 4).map((event) => (
      `${event.eventType.toUpperCase()} | ${event.eventDate} | ${event.venue}`
    ));
  }, [approvedEvents]);

  const timeline = useMemo(() => {
    if (!events.length) {
      return ['No event timeline available yet.'];
    }

    return events.slice(0, 4).map((event) => `${event.eventDate || 'TBD'} - ${event.eventType} (${event.status})`);
  }, [events]);

  const overview = useMemo(() => ([
    { label: 'Approved Events', value: String(approvedEvents.length) },
    { label: 'Pending Events', value: String(pendingEvents.length) },
    { label: 'Completed Events', value: String(completedEvents.length) },
    { label: 'Role', value: user?.employeeRole ? user.employeeRole.replace('_', ' ').toUpperCase() : 'EMPLOYEE' },
    { label: 'Monthly Salary', value: formatPKR(user?.salary || 0) },
  ]), [approvedEvents.length, pendingEvents.length, completedEvents.length, user?.employeeRole, user?.salary]);

  return (
    <section className="dashboard-shell" aria-label="Employee dashboard">
      <div className="dashboard-header">
        <h1>Employee Panel</h1>
        <p>Welcome {user?.name || 'Employee'}. Event tasks and status are synced with admin updates in realtime.</p>
      </div>

      <EmployeeNavbar items={sectionItems} />

      <section id="employee-overview" className="overview-grid employee-target-section" aria-label="Employee overview">
        {overview.map((item) => (
          <article className="overview-card" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <div id="employee-event-tasks" className="employee-target-section">
          <FeatureCard icon={<ClipboardCheck size={18} />} title="Event Tasks" items={tasks} />
        </div>
        <div id="employee-timeline" className="employee-target-section">
          <FeatureCard icon={<CalendarClock size={18} />} title="Today Timeline" items={timeline} />
        </div>
      </section>

      {message ? <p className="dashboard-copy">{message}</p> : null}

      <article id="employee-tools" className="dashboard-card dashboard-card--wide employee-target-section">
        <div className="dashboard-card-header">
          <UserCheck size={18} />
          <h3>Employee Tools</h3>
        </div>
        <div className="quick-actions">
          <button type="button"><CheckSquare size={15} /> Mark Attendance</button>
          <button type="button"><Star size={15} /> View Performance</button>
          <button type="button"><BadgeDollarSign size={15} /> Check Salary Slip</button>
          <button type="button"><Bell size={15} /> View Notifications</button>
        </div>
      </article>
    </section>
  );
}
