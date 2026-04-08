import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Bell,
  CalendarCheck2,
  Gauge,
  TrendingUp,
} from 'lucide-react';
import { getBookings, updateBookingStatus } from '../../lib/bookings';
import { InventoryPanel } from './Inventory';
import { EmployeeManagementPanel } from './EmployeeManagement';
import { QuotationInvoicesPanel } from './quotation/QuotationInvoicesPanel';
import { AdminSectionNavbar } from './navbar/AdminSectionNavbar';

const formatPKR = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const analyticsHighlights = [
  {
    title: 'Monthly Revenue',
    sentence: 'Revenue analytics will appear after transaction data is connected.',
    meta: 'Status: waiting for live data',
  },
  {
    title: 'Seasonal Demand',
    sentence: 'Seasonal demand insights will be generated from booking history.',
    meta: 'Status: waiting for live data',
  },
  {
    title: 'Cost Per Seat',
    sentence: 'Cost-per-seat metrics will be calculated from package and expense data.',
    meta: 'Status: waiting for live data',
  },
  {
    title: 'Profit vs Expense',
    sentence: 'Profit-versus-expense comparison will be shown after accounting sync.',
    meta: 'Status: waiting for live data',
  },
  {
    title: 'Booking Trends',
    sentence: 'Booking trends will be available after sufficient booking records exist.',
    meta: 'Status: waiting for live data',
  },
];

const eventManagement = [
  'Bookings submitted by customers now appear in the request queue below.',
  'Admins can approve or reject each request directly from this dashboard.',
];

const notifications = [
  'No data connected yet.',
];

function FeatureCard({ icon, title, items }) {
  return (
    <article className="dashboard-card admin-animate-card">
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

export function AdminDashboard({ user }) {
  const sectionRef = useRef(null);
  const [bookings, setBookings] = useState(() => getBookings());
  const sectionItems = [
    { id: 'admin-overview', label: 'Overview' },
    { id: 'admin-insights', label: 'Business Intelligence' },
    { id: 'admin-event-management', label: 'Event Management' },
    { id: 'admin-employee', label: 'Employee Management' },
    { id: 'admin-inventory', label: 'Inventory' },
    { id: 'admin-notifications', label: 'Notifications' },
    { id: 'admin-performance', label: 'Performance' },
    { id: 'admin-booking-requests', label: 'Booking Requests' },
    { id: 'admin-quotation-invoices', label: 'Quotation & Invoices' },
  ];

  const metrics = useMemo(() => {
    const activeBookings = bookings.filter((booking) => booking.status !== 'rejected');
    const totalRevenue = activeBookings.reduce((sum, booking) => sum + (booking.total || 0), 0);
    const approvedCount = activeBookings.filter((booking) => booking.status === 'approved').length;
    const pendingCount = activeBookings.filter((booking) => booking.status === 'pending').length;
    const totalSeats = activeBookings.reduce((sum, booking) => sum + (booking.seats || 0), 0);
    const utilization = Math.min(100, (totalSeats / 420) * 100);
    return {
      hasActiveBookings: activeBookings.length > 0,
      totalRevenue,
      netProfit: totalRevenue * 0.28,
      approvedCount,
      pendingCount,
      totalBookings: activeBookings.length,
      seatUtilization: utilization,
      inventoryStatus: utilization > 80 ? 'Low Buffer' : 'Stable',
    };
  }, [bookings]);

  const overview = useMemo(() => ([
    {
      label: 'Total Revenue',
      value: metrics.hasActiveBookings ? formatPKR(metrics.totalRevenue) : '--',
      context: metrics.hasActiveBookings ? 'Calculated from submitted booking totals.' : 'Will appear after bookings are submitted.',
    },
    {
      label: 'Net Profit',
      value: metrics.hasActiveBookings ? formatPKR(metrics.netProfit) : '--',
      context: metrics.hasActiveBookings ? 'Estimated at 28% margin for preview.' : 'Will be calculated from income and expense entries.',
    },
    {
      label: 'Upcoming Events',
      value: metrics.hasActiveBookings ? String(metrics.totalBookings) : '--',
      context: metrics.hasActiveBookings
        ? `${metrics.pendingCount} pending, ${metrics.approvedCount} approved`
        : 'No active events. Rejected requests are excluded.',
    },
    {
      label: 'Total Employees',
      value: '--',
      context: 'Will be loaded from employee records.',
    },
    {
      label: 'Inventory Status',
      value: metrics.hasActiveBookings ? metrics.inventoryStatus : '--',
      context: metrics.hasActiveBookings ? 'Derived from booked seat capacity usage.' : 'Will reflect current stock availability.',
    },
    {
      label: 'Seat Utilization',
      value: metrics.hasActiveBookings ? `${metrics.seatUtilization.toFixed(1)}%` : '--',
      context: metrics.hasActiveBookings ? 'Based on 420-seat working capacity.' : 'Will be computed from booking seat usage.',
    },
  ]), [metrics]);

  const handleStatusChange = (bookingId, status) => {
    const next = updateBookingStatus(bookingId, status);
    setBookings(next);
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.admin-animate-hero', {
        y: 22,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
      });

      gsap.from('.admin-animate-kpi', {
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.08,
        ease: 'power2.out',
      });

      gsap.from('.admin-animate-card', {
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.09,
        delay: 0.18,
        ease: 'power2.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="dashboard-shell admin-dashboard-shell" aria-label="Admin dashboard" ref={sectionRef}>
      <div className="dashboard-header admin-hero admin-animate-hero">
        <div>
          <p className="admin-hero-tag">Event Operations Hub</p>
          <h1>Admin Dashboard</h1>
          <p>Welcome {user?.name || 'Admin'}.</p>
        </div>
      </div>

      <AdminSectionNavbar items={sectionItems} />

      <section id="admin-overview" className="overview-grid admin-overview-grid admin-target-section" aria-label="Admin overview">
        {overview.map((item) => (
          <article className="overview-card admin-animate-kpi" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.context}</span>
          </article>
        ))}
      </section>

      <article id="admin-insights" className="dashboard-card dashboard-card--wide admin-insights admin-animate-card admin-target-section">
        <div className="dashboard-card-header">
          <TrendingUp size={18} />
          <h3>Business Intelligence Panel</h3>
        </div>
        <p className="dashboard-copy">
          This panel is ready for analytics integration. Connect booking, payment, and inventory APIs to populate these insights.
        </p>
        <div className="insight-grid">
          {analyticsHighlights.map((insight) => (
            <article className="insight-item" key={insight.title}>
              <h4>{insight.title}</h4>
              <p>{insight.sentence}</p>
              <span>{insight.meta}</span>
            </article>
          ))}
        </div>
      </article>

      <section className="dashboard-grid admin-dashboard-grid">
        <div id="admin-event-management" className="admin-target-section admin-grid-slot admin-grid-slot--event">
          <FeatureCard icon={<CalendarCheck2 size={18} />} title="Event Management" items={eventManagement} />
        </div>
        <div id="admin-employee" className="admin-target-section admin-grid-slot admin-grid-slot--employee">
          <EmployeeManagementPanel />
        </div>
        <div id="admin-inventory" className="admin-target-section admin-grid-slot admin-grid-slot--inventory">
          <InventoryPanel bookings={bookings} />
        </div>
        <div id="admin-notifications" className="admin-target-section admin-grid-slot admin-grid-slot--notifications">
          <FeatureCard icon={<Bell size={18} />} title="Notifications" items={notifications} />
        </div>
        <article id="admin-performance" className="dashboard-card admin-animate-card admin-target-section admin-grid-slot admin-grid-slot--performance">
          <div className="dashboard-card-header">
            <Gauge size={18} />
            <h3>Performance Snapshot</h3>
          </div>
          <p className="dashboard-copy">
            Live operational status will appear here after analytics integration.
          </p>
          <div className="status-strip">
            <span>Revenue: Pending Data</span>
            <span>Expenses: Pending Data</span>
            <span>Staffing: Pending Data</span>
          </div>
        </article>
      </section>

      <article id="admin-booking-requests" className="dashboard-card dashboard-card--wide admin-animate-card admin-target-section">
        <div className="dashboard-card-header">
          <CalendarCheck2 size={18} />
          <h3>Booking Requests</h3>
        </div>

        {bookings.length ? (
          <div className="booking-admin-list">
            {bookings.map((booking) => (
              <div className="booking-admin-row" key={booking.id}>
                <div>
                  <strong>{booking.eventType.toUpperCase()}</strong>
                  <p>{booking.customerName} | {booking.eventDate} | {booking.venue}</p>
                  <p>{booking.seatCategory.toUpperCase()} | Seats: {booking.seats} | Total: {formatPKR(booking.total)}</p>
                </div>
                <div className="booking-admin-actions">
                  <span className={`booking-status booking-status--${booking.status}`}>{booking.status}</span>
                  <button type="button" onClick={() => handleStatusChange(booking.id, 'approved')}>Approve</button>
                  <button type="button" onClick={() => handleStatusChange(booking.id, 'rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard-copy">No customer booking request has been submitted yet.</p>
        )}
      </article>

      <div id="admin-quotation-invoices" className="admin-target-section">
        <QuotationInvoicesPanel bookings={bookings} />
      </div>

    </section>
  );
}
