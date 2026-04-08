import { BadgeDollarSign, Bell, CalendarClock, CheckSquare, ClipboardCheck, Star, UserCheck } from 'lucide-react';

const overview = [
  { label: 'Assigned Events', value: '6' },
  { label: 'Attendance History', value: '96%' },
  { label: 'Performance Rating', value: '4.6 / 5' },
  { label: 'Bonus & Overtime', value: 'PKR 320.00' },
  { label: 'Monthly Salary', value: 'PKR 1,900.00' },
];

const tasks = [
  'View event schedules',
  'Mark attendance',
  'Check assigned roles',
  'Follow event preparation checklists',
];

const timeline = [
  '10:00 AM - Venue setup for wedding',
  '01:00 PM - Lighting check and decoration review',
  '03:00 PM - Staff briefing and checklist confirmation',
  '07:00 PM - Event execution support',
];

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
  return (
    <section className="dashboard-shell" aria-label="Employee dashboard">
      <div className="dashboard-header">
        <h1>Employee Panel</h1>
        <p>Welcome {user?.name || 'Employee'}. Track tasks, attendance, schedule, and salary details.</p>
      </div>

      <section className="overview-grid" aria-label="Employee overview">
        {overview.map((item) => (
          <article className="overview-card" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <FeatureCard icon={<ClipboardCheck size={18} />} title="Event Tasks" items={tasks} />
        <FeatureCard icon={<CalendarClock size={18} />} title="Today Timeline" items={timeline} />
      </section>

      <article className="dashboard-card dashboard-card--wide">
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
