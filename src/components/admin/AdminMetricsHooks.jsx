import { useMemo } from 'react';


export function useBookingMetrics(bookings) {
  return useMemo(() => {
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
}

/**
 * useOverviewCards Hook
 * Generates overview metric cards for the dashboard
 * Shows: Revenue, Profit, Events, Employees, Inventory, Utilization
 *
 * @param {Object} metrics - Metrics from useBookingMetrics
 * @param {Function} formatPKR - Currency formatter
 * @returns {Array} - Array of overview card objects
 */
export function useOverviewCards(metrics, formatPKR) {
  return useMemo(() => ([
    {
      label: 'Total Revenue',
      value: metrics.hasActiveBookings ? formatPKR(metrics.totalRevenue) : '--',
      context: metrics.hasActiveBookings
        ? 'Calculated from submitted booking totals.'
        : 'Will appear after bookings are submitted.',
    },
    {
      label: 'Net Profit',
      value: metrics.hasActiveBookings ? formatPKR(metrics.netProfit) : '--',
      context: metrics.hasActiveBookings
        ? 'Estimated at 28% margin for preview.'
        : 'Will be calculated from income and expense entries.',
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
      context: metrics.hasActiveBookings
        ? 'Derived from booked seat capacity usage.'
        : 'Will reflect current stock availability.',
    },
    {
      label: 'Seat Utilization',
      value: metrics.hasActiveBookings ? `${metrics.seatUtilization.toFixed(1)}%` : '--',
      context: metrics.hasActiveBookings
        ? 'Based on 420-seat working capacity.'
        : 'Will be computed from booking seat usage.',
    },
  ]), [metrics, formatPKR]);
}

/**
 * useEventManagementSummary Hook
 * Generates summary text for event management section
 * Shows: Total stored, pending count, approved count, rejected count
 *
 * @param {Array} bookings - Array of all bookings
 * @returns {Array} - Array of summary strings
 */
export function useEventManagementSummary(bookings) {
  return useMemo(() => {
    if (!bookings.length) {
      return ['No bookings stored yet in database.', 'Customer submissions will appear here in real time.'];
    }

    const approved = bookings.filter((booking) => booking.status === 'approved').length;
    const pending = bookings.filter((booking) => booking.status === 'pending').length;
    const rejected = bookings.filter((booking) => booking.status === 'rejected').length;

    return [
      `Total bookings stored: ${bookings.length}`,
      `Pending: ${pending}, Approved: ${approved}, Rejected: ${rejected}`,
    ];
  }, [bookings]);
}
