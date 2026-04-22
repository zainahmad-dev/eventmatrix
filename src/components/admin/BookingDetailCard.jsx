import React from 'react';
export function BookingDetailCard({ booking, onApprove, onReject, formatPKR }) {
  return (
    <article className="booking-detail-card">
      {/* Header: Event Type and Status Badge */}
      <div className="booking-detail-header">
        <div className="booking-type-badge">
          <span className="event-icon">📅</span>
          <span className="event-type">{(booking?.eventType || 'Event').toUpperCase()}</span>
        </div>
        <span className={`booking-status booking-status--${booking?.status || 'pending'}`}>
          {booking?.status || 'pending'}
        </span>
      </div>

      {/* Quick Info: Customer, Date, Venue, Seats */}
      <div className="booking-detail-quick-info">
        <div className="info-item">
          <span className="info-label">Customer:</span>
          <span className="info-value">{booking?.customerName || 'Unknown'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Date:</span>
          <span className="info-value">{booking?.eventDate || 'TBD'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Venue:</span>
          <span className="info-value">{booking?.venue || 'TBD'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Seats:</span>
          <span className="info-value">
            {booking?.seats || 0} ({(booking?.seatCategory || 'standard').charAt(0).toUpperCase()})
          </span>
        </div>
      </div>

      {/* Pricing: Total, Advance, Due */}
      <div className="booking-detail-pricing">
        <div className="price-item">
          <span className="price-label">Total</span>
          <span className="price-amount">{formatPKR(booking?.total)}</span>
        </div>
        <div className="price-item">
          <span className="price-label">Advance</span>
          <span className="price-amount advance">{formatPKR(booking?.advance)}</span>
        </div>
        <div className="price-item">
          <span className="price-label">Due</span>
          <span className="price-amount due">{formatPKR(booking?.remaining)}</span>
        </div>
      </div>

      {/* Add-ons Indicators */}
      <div className="booking-detail-addons">
        {booking?.decoration && <span className="addon-mini">🎨</span>}
        {booking?.lighting && <span className="addon-mini">💡</span>}
        {booking?.cateringSupport && <span className="addon-mini">🍽️</span>}
      </div>

      {/* Action Buttons: Approve & Reject */}
      <div className="booking-detail-actions">
        <button
          type="button"
          className="btn-action btn-approve-sm"
          onClick={() => onApprove(booking.id)}
          title="Approve this booking"
        >
          ✓
        </button>
        <button
          type="button"
          className="btn-action btn-reject-sm"
          onClick={() => onReject(booking.id)}
          title="Reject this booking"
        >
          ✕
        </button>
      </div>
    </article>
  );
}
