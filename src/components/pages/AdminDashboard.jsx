import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Bell,
  CalendarCheck2,
  Gauge,
  TrendingUp,
} from 'lucide-react';
import { fetchEvents, updateEventStatus } from '../../api/events';
import { InventoryPanel } from '../admin/Inventory';
import { EmployeeManagementPanel } from '../admin/EmployeeManagement';
import { QuotationInvoicesPanel } from '../admin/QuotationInvoicesPanel';
import { AdminNavbar } from '../common/AdminNavbar';
import { EventCategoriesSection } from '../admin/EventCategoriesSection';
import { BookingDetailsSection } from '../admin/BookingDetailsSection';
import { StocksSection } from '../admin/StocksSection';
import { EquipmentInventoryDashboard } from '../admin/EquipmentInventoryDashboard';
import { useBookingMetrics, useOverviewCards, useEventManagementSummary } from '../admin/AdminMetricsHooks';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency to PKR format
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

/**
 * Feature Card Component
 * Reusable card for displaying lists of features
 */
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

// ============================================================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================================

/**
 * AdminDashboard Component
 * Main admin interface showing:
 * - Event categories overview
 * - Booking details with filtering
 * - Business metrics and KPIs
 * - Employee management
 * - Inventory status
 * - Quotations and invoices
 *
 * @param {Object} user - Current admin user object
 * @returns {JSX.Element} - Complete admin dashboard
 */
export function AdminDashboard({ user }) {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const sectionRef = useRef(null);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [eventSectionMessage, setEventSectionMessage] = useState('');

  // ========================================================================
  // FILTERED DATA
  // ========================================================================

  const filteredBookings = bookings.filter((booking) => {
    if (bookingFilter === 'all') return true;
    return booking?.status === bookingFilter;
  });

  // ========================================================================
  // DASHBOARD SECTIONS (using custom hooks)
  // ========================================================================

  const metrics = useBookingMetrics(bookings);
  const overview = useOverviewCards(metrics, formatPKR);
  const eventManagement = useEventManagementSummary(bookings);

  // ========================================================================
  // NAVIGATION ITEMS
  // ========================================================================

  const sectionItems = [
    { id: 'admin-overview', label: 'Overview' },
    { id: 'admin-insights', label: 'Business Intelligence' },
    { id: 'admin-event-management', label: 'Event Management' },
    { id: 'admin-employee', label: 'Employee Management' },
    { id: 'admin-inventory', label: 'Inventory' },
    { id: 'admin-stocks', label: 'Stocks' },
    { id: 'admin-equipment', label: 'Equipment Rental' },
    { id: 'admin-notifications', label: 'Notifications' },
    { id: 'admin-performance', label: 'Performance' },
    { id: 'admin-booking-requests', label: 'Booking Requests' },
    { id: 'admin-quotation-invoices', label: 'Quotation & Invoices' },
  ];

  // ========================================================================
  // DATA FETCHING & UPDATES
  // ========================================================================

  /**
   * Load all bookings from API
   */
  const loadBookings = async () => {
    try {
      const data = await fetchEvents();

      if (!Array.isArray(data)) {
        console.warn('Expected array from fetchEvents, got:', typeof data, data);
        setBookings([]);
        setEventSectionMessage('Error: Invalid response format from server.');
        return;
      }

      setBookings(data);
      setEventSectionMessage('');
    } catch (error) {
      console.error('Error loading bookings:', error);
      setEventSectionMessage(`Error: ${error.message}`);
      setBookings([]);
    }
  };

  /**
   * Update booking status (approve/reject)
   * @param {string} bookingId - ID of booking to update
   * @param {string} status - New status (approved/rejected/etc)
   */
  const handleStatusChange = async (bookingId, status) => {
    try {
      await updateEventStatus(bookingId, status);
      await loadBookings();
    } catch (error) {
      setEventSectionMessage(error.message);
    }
  };

  // ========================================================================
  // ANIMATIONS (GSAP)
  // ========================================================================

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

  // ========================================================================
  // LOAD DATA ON MOUNT
  // ========================================================================

  useEffect(() => {
    loadBookings();
    const timer = window.setInterval(loadBookings, 5000);
    return () => window.clearInterval(timer);
  }, []);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <section className="dashboard-shell admin-dashboard-shell" aria-label="Admin dashboard" ref={sectionRef}>
      {/* HEADER */}
      <div className="dashboard-header admin-hero admin-animate-hero">
        <div>
          <p className="admin-hero-tag">Event Operations Hub</p>
          <h1>Admin Dashboard</h1>
          <p>Welcome {user?.name || 'Admin'}.</p>
        </div>
      </div>

      {/* NAVIGATION */}
      <AdminNavbar items={sectionItems} />

      {/* SECTION 1: EVENT CATEGORIES */}
      <EventCategoriesSection bookings={bookings} />

      {/* SECTION 2: BOOKING DETAILS WITH FILTERING */}
      <BookingDetailsSection
        filteredBookings={filteredBookings}
        allBookings={bookings}
        activeFilter={bookingFilter}
        onFilterChange={setBookingFilter}
        onApproveBooking={(id) => handleStatusChange(id, 'approved')}
        onRejectBooking={(id) => handleStatusChange(id, 'rejected')}
        formatPKR={formatPKR}
        errorMessage={eventSectionMessage}
      />

      {/* SECTION 3: OVERVIEW METRICS */}
      <section id="admin-overview" className="overview-grid admin-overview-grid admin-target-section" aria-label="Admin overview">
        {overview.map((item) => (
          <article className="overview-card admin-animate-kpi" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.context}</span>
          </article>
        ))}
      </section>

      {/* SECTION 4: BUSINESS INTELLIGENCE */}
      <article id="admin-insights" className="dashboard-card dashboard-card--wide admin-insights admin-animate-card admin-target-section">
        <div className="dashboard-card-header">
          <TrendingUp size={18} />
          <h3>Business Intelligence Panel</h3>
        </div>
        <p className="dashboard-copy">
          This panel is ready for analytics integration. Connect booking, payment, and inventory APIs to populate these insights.
        </p>
        <div className="insight-grid">
          {[
            { title: 'Monthly Revenue', sentence: 'Revenue analytics will appear after transaction data is connected.', meta: 'Status: waiting for live data' },
            { title: 'Seasonal Demand', sentence: 'Seasonal demand insights will be generated from booking history.', meta: 'Status: waiting for live data' },
            { title: 'Cost Per Seat', sentence: 'Cost-per-seat metrics will be calculated from package and expense data.', meta: 'Status: waiting for live data' },
            { title: 'Profit vs Expense', sentence: 'Profit-versus-expense comparison will be shown after accounting sync.', meta: 'Status: waiting for live data' },
            { title: 'Booking Trends', sentence: 'Booking trends will be available after sufficient booking records exist.', meta: 'Status: waiting for live data' },
          ].map((insight) => (
            <article className="insight-item" key={insight.title}>
              <h4>{insight.title}</h4>
              <p>{insight.sentence}</p>
              <span>{insight.meta}</span>
            </article>
          ))}
        </div>
      </article>

      {/* SECTION 5: DASHBOARD GRID (Event Management, Employee, Inventory, etc) */}
      <section className="dashboard-grid admin-dashboard-grid">
        <div id="admin-event-management" className="admin-target-section admin-grid-slot admin-grid-slot--event">
          <FeatureCard
            icon={<CalendarCheck2 size={18} />}
            title="Event Management"
            items={eventManagement}
          />
        </div>

        <div id="admin-employee" className="admin-target-section admin-grid-slot admin-grid-slot--employee">
          <EmployeeManagementPanel />
        </div>

        <div id="admin-inventory" className="admin-target-section admin-grid-slot admin-grid-slot--inventory">
          <InventoryPanel bookings={bookings} />
        </div>

        <div id="admin-notifications" className="admin-target-section admin-grid-slot admin-grid-slot--notifications">
          <FeatureCard
            icon={<Bell size={18} />}
            title="Notifications"
            items={['No data connected yet.']}
          />
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

      {/* SECTION 6: QUOTATIONS & INVOICES */}
      <div id="admin-quotation-invoices" className="admin-target-section">
        <QuotationInvoicesPanel bookings={bookings} />
      </div>

      {/* SECTION 7: STOCKS & INVENTORY MANAGEMENT */}
      <div id="admin-stocks" className="admin-target-section">
        <StocksSection />
      </div>
    </section>
  );
}
