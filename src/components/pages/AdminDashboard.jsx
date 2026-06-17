import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Bell,
  CalendarCheck2,
  Gauge,
  TrendingUp,
} from 'lucide-react';
import { fetchAllEventsAdmin, updateEventStatus, deleteEventBooking } from '../../api/events';
import { fetchEquipment } from '../../api/equipment';
import { EmployeeManagementPanel } from '../admin/EmployeeManagement';
import { QuotationInvoicesPanel } from '../admin/QuotationInvoicesPanel';
import { AdminNavbar } from '../common/AdminNavbar';
import { EventCategoriesSection } from '../admin/EventCategoriesSection';
import { BookingDetailsSection } from '../admin/BookingDetailsSection';
import { EquipmentInventoryDashboard } from '../admin/EquipmentInventoryDashboard';
import { PackageManagementPanel } from '../admin/PackageManagementPanel';
import { useBookingMetrics, useOverviewCards, useEventManagementSummary, useBusinessIntelligence } from '../admin/AdminMetricsHooks';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================


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
  const [totalEmployees, setTotalEmployees] = useState(null);
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [equipmentList, setEquipmentList] = useState([]);

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
  const overview = useOverviewCards(metrics, formatPKR, totalEmployees, equipmentList);
  const eventManagement = useEventManagementSummary(bookings);
  const insights = useBusinessIntelligence(bookings, totalPayroll);

  // Dynamic notifications derived from live data
  const notificationsList = useMemo(() => {
    const list = [];
    const pendingCount = bookings.filter((b) => b.status === 'pending').length;
    if (pendingCount > 0) list.push(`${pendingCount} booking request(s) awaiting approval.`);

    const underMaintenance = equipmentList.filter((e) => e.condition === 'maintenance').length;
    if (underMaintenance > 0) list.push(`${underMaintenance} equipment item(s) under maintenance.`);

    const damaged = equipmentList.filter((e) => e.condition === 'damaged').length;
    if (damaged > 0) list.push(`${damaged} equipment item(s) marked as damaged.`);

    const lowStock = equipmentList.filter((e) => {
      const available = e.availableQuantity ?? e.quantity ?? 1;
      const total = e.totalQuantity ?? e.quantity ?? 1;
      return available > 0 && available <= total * 0.2;
    }).length;
    if (lowStock > 0) list.push(`${lowStock} equipment item(s) running low on stock.`);

    return list.length > 0 ? list : ['All systems operational. No alerts at this time.'];
  }, [bookings, equipmentList]);

  // ========================================================================
  // NAVIGATION ITEMS
  // ========================================================================

  const sectionItems = [
    { id: 'admin-overview', label: 'Overview' },
    { id: 'admin-insights', label: 'Business Intelligence' },
    { id: 'admin-event-management', label: 'Event Management' },
    { id: 'admin-employee', label: 'Employee Management' },
    { id: 'admin-equipment', label: 'Equipment Rental' },
    { id: 'admin-packages', label: 'Event Packages' },
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
      const data = await fetchAllEventsAdmin();

      if (!Array.isArray(data)) {
        console.warn('Expected array from fetchAllEventsAdmin, got:', typeof data, data);
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

  /**
   * Delete a booking request
   * @param {string} bookingId - ID of booking to delete
   */
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to permanently delete this booking request? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteEventBooking(bookingId);
      await loadBookings();
    } catch (error) {
      setEventSectionMessage(`Error deleting booking: ${error.message}`);
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
    const bookingTimer = window.setInterval(loadBookings, 5000);
    return () => window.clearInterval(bookingTimer);
  }, []);

  /**
   * Load all equipment from API and poll every 15 seconds
   */
  const loadEquipment = async () => {
    try {
      const data = await fetchEquipment({ adminView: true });
      setEquipmentList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading equipment for dashboard:', error);
    }
  };

  useEffect(() => {
    loadEquipment();
    const equipmentTimer = window.setInterval(loadEquipment, 15000);
    return () => window.clearInterval(equipmentTimer);
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
        onDeleteBooking={handleDeleteBooking}
        formatPKR={formatPKR}
        errorMessage={eventSectionMessage}
        equipmentList={equipmentList}
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
          Realtime operations analytics and financial trends synced from database.
        </p>
        <div className="insight-grid">
          {insights.map((insight) => (
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
          <EmployeeManagementPanel onEmployeesUpdate={(summary) => {
            setTotalEmployees(summary?.totalEmployees);
            setTotalPayroll(summary?.totalPayroll || 0);
          }} />
        </div>

        <div id="admin-notifications" className="admin-target-section admin-grid-slot admin-grid-slot--notifications">
          <FeatureCard
            icon={<Bell size={18} />}
            title="Notifications"
            items={notificationsList}
          />
        </div>

        <article id="admin-performance" className="dashboard-card admin-animate-card admin-target-section admin-grid-slot admin-grid-slot--performance">
          <div className="dashboard-card-header">
            <Gauge size={18} />
            <h3>Performance Snapshot</h3>
          </div>
          <p className="dashboard-copy">
            Live operational status synced from booking and payroll records.
          </p>
          <div className="status-strip">
            <span>Revenue: {metrics.hasActiveBookings ? formatPKR(metrics.totalRevenue) : 'Pending Data'}</span>
            <span>Expenses: {metrics.totalInternalCost > 0 ? formatPKR(metrics.totalInternalCost) : totalPayroll > 0 ? formatPKR(totalPayroll) : 'Pending Data'}</span>
            <span>Package Profit: {metrics.hasActiveBookings ? formatPKR(metrics.netProfit) : 'Pending Data'}</span>
            <span>Staffing: {typeof totalEmployees === 'number' ? `${totalEmployees} / 15 Filled` : 'Pending Data'}</span>
          </div>
        </article>
      </section>

      {/* SECTION 6: QUOTATIONS & INVOICES */}
      <div id="admin-quotation-invoices" className="admin-target-section">
        <QuotationInvoicesPanel bookings={bookings} />
      </div>

      {/* SECTION 7: EVENT PACKAGES */}
      <div id="admin-packages" className="admin-target-section">
        <PackageManagementPanel />
      </div>

      {/* SECTION 8: EQUIPMENT RENTAL & INVENTORY */}
      <div id="admin-equipment" className="admin-target-section">
        <EquipmentInventoryDashboard />
      </div>
    </section>
  );
}
