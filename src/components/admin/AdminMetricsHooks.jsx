import { useMemo } from 'react';


export function useBookingMetrics(bookings) {
  return useMemo(() => {
    const activeBookings = bookings.filter((booking) => booking.status !== 'rejected');
    const totalRevenue = activeBookings.reduce((sum, booking) => sum + (booking.total || 0), 0);
    const totalInternalCost = activeBookings.reduce(
      (sum, booking) => sum + (booking.costBreakdown?.totalInternalCost || 0),
      0,
    );
    const totalProfit = activeBookings.reduce(
      (sum, booking) => sum + (booking.costBreakdown?.profit ?? (booking.total || 0) * 0.28),
      0,
    );
    const approvedCount = activeBookings.filter((booking) => booking.status === 'approved').length;
    const pendingCount = activeBookings.filter((booking) => booking.status === 'pending').length;
    const totalSeats = activeBookings.reduce((sum, booking) => sum + (booking.seats || 0), 0);
    const utilization = Math.min(100, (totalSeats / 420) * 100);

    return {
      hasActiveBookings: activeBookings.length > 0,
      totalRevenue,
      totalInternalCost,
      netProfit: totalProfit,
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
 * @param {number|null} totalEmployees - Total employee count from EmployeeManagementPanel
 * @param {Array} equipmentList - Array of equipment objects from the database
 * @returns {Array} - Array of overview card objects
 */
export function useOverviewCards(metrics, formatPKR, totalEmployees, equipmentList = []) {
  return useMemo(() => {
    // Compute live inventory status from equipment records
    let inventoryStatusValue = '--';
    let inventoryStatusContext = 'Will reflect current stock availability.';

    if (equipmentList.length > 0) {
      const outOfStock = equipmentList.filter((item) => (item.availableQuantity ?? item.quantity ?? 1) === 0).length;
      const lowBuffer = equipmentList.filter((item) => {
        const available = item.availableQuantity ?? item.quantity ?? 1;
        const total = item.totalQuantity ?? item.quantity ?? 1;
        return available > 0 && available <= total * 0.2;
      }).length;

      if (outOfStock > 0) {
        inventoryStatusValue = `${outOfStock} Out of Stock`;
      } else if (lowBuffer > 0) {
        inventoryStatusValue = `${lowBuffer} Low Buffer`;
      } else {
        inventoryStatusValue = 'Stable';
      }
      inventoryStatusContext = 'Realtime count of low-stock and out-of-stock items.';
    }

    return [
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
          ? 'From package bookings: revenue minus equipment, food & staff costs.'
          : 'Will be calculated from package cost breakdowns.',
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
        value: typeof totalEmployees === 'number' ? String(totalEmployees) : '--',
        context: typeof totalEmployees === 'number'
          ? 'Fetched from employee management.'
          : 'Will be loaded from employee records.',
      },
      {
        label: 'Inventory Status',
        value: inventoryStatusValue,
        context: inventoryStatusContext,
      },
      {
        label: 'Seat Utilization',
        value: metrics.hasActiveBookings ? `${metrics.seatUtilization.toFixed(1)}%` : '--',
        context: metrics.hasActiveBookings
          ? 'Based on 420-seat working capacity.'
          : 'Will be computed from booking seat usage.',
      },
    ];
  }, [metrics, formatPKR, totalEmployees, equipmentList]);
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

/**
 * useBusinessIntelligence Hook
 * Generates dynamic analytics metrics for the Business Intelligence Panel
 *
 * @param {Array} bookings - Array of all bookings
 * @param {number} totalPayroll - Current total workforce payroll
 * @returns {Array} - Array of insight objects
 */
export function useBusinessIntelligence(bookings, totalPayroll) {
  return useMemo(() => {
    const activeBookings = bookings.filter((booking) => booking.status !== 'rejected');
    const totalRevenue = activeBookings.reduce((sum, booking) => sum + (booking.total || 0), 0);
    const totalSeats = activeBookings.reduce((sum, booking) => sum + (booking.seats || 0), 0);

    // 1. Monthly Revenue & top-performing month
    const revenueByMonth = {};
    activeBookings.forEach((booking) => {
      if (!booking.eventDate) return;
      const date = new Date(booking.eventDate);
      if (isNaN(date.getTime())) return;
      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + (booking.total || 0);
    });
    const months = Object.keys(revenueByMonth);
    let highestMonthStr = '';
    if (months.length > 0) {
      const highestMonth = months.reduce((maxMonth, currentMonth) =>
        revenueByMonth[currentMonth] > revenueByMonth[maxMonth] ? currentMonth : maxMonth
      , months[0]);
      highestMonthStr = ` ${highestMonth} was the top-performing month, generating PKR ${revenueByMonth[highestMonth].toLocaleString('en-PK')}.`;
    }
    const monthlyRevenueSentence = activeBookings.length > 0
      ? `Total operational revenue is PKR ${totalRevenue.toLocaleString('en-PK')}.${highestMonthStr}`
      : 'Revenue analytics will appear after transaction data is connected.';
    const monthlyRevenueMeta = activeBookings.length > 0
      ? 'Status: Live - Synced with booking records'
      : 'Status: waiting for live data';

    // 2. Seasonal Demand
    const demandByMonth = {};
    activeBookings.forEach((booking) => {
      if (!booking.eventDate) return;
      const date = new Date(booking.eventDate);
      if (isNaN(date.getTime())) return;
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      demandByMonth[monthName] = (demandByMonth[monthName] || 0) + 1;
    });
    const demandMonths = Object.keys(demandByMonth);
    let seasonalDemandSentence = 'Seasonal demand insights will be generated from booking history.';
    if (demandMonths.length > 0) {
      const peakMonth = demandMonths.reduce((maxMonth, currentMonth) =>
        demandByMonth[currentMonth] > demandByMonth[maxMonth] ? currentMonth : maxMonth
      , demandMonths[0]);
      seasonalDemandSentence = `Peak operational demand is in ${peakMonth} with ${demandByMonth[peakMonth]} scheduled event(s).`;
    }
    const seasonalDemandMeta = activeBookings.length > 0
      ? 'Status: Live - Calculated from seasonal booking counts'
      : 'Status: waiting for live data';

    // 3. Cost Per Seat
    let costPerSeatSentence = 'Cost-per-seat metrics will be calculated from package and expense data.';
    if (totalSeats > 0) {
      const avgCostPerSeat = totalRevenue / totalSeats;
      costPerSeatSentence = `Average client cost per seat is PKR ${avgCostPerSeat.toLocaleString('en-PK', { maximumFractionDigits: 0 })}. Rates depend on tier selection (VIP: PKR 1,500, Premium: PKR 1,200, Standard: PKR 800).`;
    }
    const costPerSeatMeta = totalSeats > 0
      ? 'Status: Live - Derived from seat and package rates'
      : 'Status: waiting for live data';

    // 4. Profit vs Expense
    const payrollExpense = Number(totalPayroll || 0);
    const packageCosts = activeBookings.reduce(
      (sum, booking) => sum + (booking.costBreakdown?.totalInternalCost || 0),
      0,
    );
    const packageProfit = activeBookings.reduce(
      (sum, booking) => sum + (booking.costBreakdown?.profit || 0),
      0,
    );
    const operationalProfit = packageProfit > 0 ? packageProfit : totalRevenue - payrollExpense;
    const profitMargin = totalRevenue > 0 ? (operationalProfit / totalRevenue) * 100 : 0;
    const profitVsExpenseSentence = (totalRevenue > 0 || payrollExpense > 0 || packageCosts > 0)
      ? `Revenue: PKR ${totalRevenue.toLocaleString('en-PK')} | Package costs (equipment + food + event staff): PKR ${packageCosts.toLocaleString('en-PK')} | Monthly payroll: PKR ${payrollExpense.toLocaleString('en-PK')}. Net package profit: PKR ${packageProfit.toLocaleString('en-PK')} (${profitMargin.toFixed(1)}% margin).`
      : 'Profit-versus-expense comparison will be shown after package bookings are submitted.';
    const profitVsExpenseMeta = (totalRevenue > 0 || payrollExpense > 0)
      ? 'Status: Live - Integrated with payroll records'
      : 'Status: waiting for live data';

    // 5. Booking Trends
    const pendingEvents = activeBookings.filter((b) => b.status === 'pending').length;
    const approvedEvents = activeBookings.filter((b) => b.status === 'approved').length;
    const completedEvents = activeBookings.filter((b) => b.status === 'completed').length;
    let bookingTrendsSentence = 'Booking trends will be available after sufficient booking records exist.';
    if (activeBookings.length > 0) {
      const avgSeats = totalSeats / activeBookings.length;
      bookingTrendsSentence = `Currently managing ${activeBookings.length} active events (${approvedEvents} approved, ${pendingEvents} pending, ${completedEvents} completed). Average event size is ${avgSeats.toFixed(0)} seats.`;
    }
    const bookingTrendsMeta = activeBookings.length > 0
      ? 'Status: Live - Monitored from operational pipelines'
      : 'Status: waiting for live data';

    return [
      { title: 'Monthly Revenue', sentence: monthlyRevenueSentence, meta: monthlyRevenueMeta },
      { title: 'Seasonal Demand', sentence: seasonalDemandSentence, meta: seasonalDemandMeta },
      { title: 'Cost Per Seat', sentence: costPerSeatSentence, meta: costPerSeatMeta },
      { title: 'Profit vs Expense', sentence: profitVsExpenseSentence, meta: profitVsExpenseMeta },
      { title: 'Booking Trends', sentence: bookingTrendsSentence, meta: bookingTrendsMeta },
    ];
  }, [bookings, totalPayroll]);
}
