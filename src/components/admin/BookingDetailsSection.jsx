import { BookingDetailCard } from './BookingDetailCard';
import { BookingFilterTabs } from './BookingFilterTabs';

export function BookingDetailsSection({
  filteredBookings,
  allBookings,
  activeFilter,
  onFilterChange,
  onApproveBooking,
  onRejectBooking,
  onDeleteBooking,
  formatPKR,
  errorMessage,
  equipmentList,
}) {
  return (
    <section id="admin-booking-details" className="admin-booking-details admin-target-section" aria-label="Detailed booking information">
      {/* Section Title */}
      <div className="section-header">
        <h2>📋 Booking Details Overview</h2>
        <p>Complete information for all customer bookings and event requests</p>
      </div>

      {/* Filter Tabs */}
      <BookingFilterTabs
        bookings={allBookings}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />

      {/* Booking Cards Grid or Empty State */}
      {filteredBookings.length ? (
        <div className="booking-details-grid">
          {filteredBookings.map((booking) => (
            <BookingDetailCard
              key={booking?.id}
              booking={booking}
              onApprove={onApproveBooking}
              onReject={onRejectBooking}
              onDelete={onDeleteBooking}
              formatPKR={formatPKR}
              equipmentList={equipmentList}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-message">📭 No bookings found. Try changing the filter or wait for customer submissions.</p>
        </div>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <div className="booking-status-message">
          <p><strong>Status:</strong> {errorMessage}</p>
        </div>
      )}
    </section>
  );
}
