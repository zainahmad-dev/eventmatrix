import React from 'react';
import { Trash2 } from 'lucide-react';

export function BookingDetailCard({ booking, onApprove, onReject, onDelete, formatPKR, equipmentList }) {
  const warnings = React.useMemo(() => {
    if (!booking || booking.status !== 'pending' || !booking.packageSnapshot?.equipmentItems || !Array.isArray(equipmentList)) {
      return [];
    }

    const shortItems = [];
    for (const reqItem of booking.packageSnapshot.equipmentItems) {
      const eq = equipmentList.find(
        (e) => e.name.toLowerCase().trim() === reqItem.name.toLowerCase().trim()
      );
      if (eq) {
        if (eq.availableQuantity < reqItem.quantity) {
          shortItems.push({
            name: reqItem.name,
            required: reqItem.quantity,
            available: eq.availableQuantity,
          });
        }
      } else {
        shortItems.push({
          name: reqItem.name,
          required: reqItem.quantity,
          available: 0,
        });
      }
    }
    return shortItems;
  }, [booking, equipmentList]);

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

      {/* Stock Warning Banner */}
      {warnings.length > 0 && (
        <div className="stock-warning-banner">
          <span className="warning-icon">⚠️</span>
          <div className="warning-content">
            <strong>Stock Alert: Insufficient Items</strong>
            <ul>
              {warnings.map((w, idx) => (
                <li key={idx}>
                  {w.name} (Need {w.required}, Has {w.available})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}


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
          <span className="info-label">Package:</span>
          <span className="info-value">{booking?.packageName || 'Custom'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Guests:</span>
          <span className="info-value">
            {booking?.seats || 0} ({(booking?.seatCategory || 'standard').toUpperCase()})
          </span>
        </div>
      </div>

      {booking?.costBreakdown ? (
        <div className="booking-detail-profit">
          <span>Profit: {formatPKR(booking.costBreakdown.profit)}</span>
          <span>Staff cost: {formatPKR(booking.costBreakdown.staffCost)}</span>
        </div>
      ) : null}

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

      {/* Action Buttons: Approve, Reject, Delete */}
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
        <button
          type="button"
          className="btn-action btn-delete-sm"
          onClick={() => onDelete(booking.id)}
          title="Delete this booking request"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}
