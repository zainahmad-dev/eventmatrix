import React from 'react';
export function BookingFilterTabs({ bookings, activeFilter, onFilterChange }) {
  // Count bookings by status
  const getStatusCount = (status) => {
    if (status === 'all') return bookings.length;
    return bookings.filter((b) => b?.status === status).length;
  };

  const filters = [
    { id: 'all', label: 'All Bookings', count: getStatusCount('all') },
    { id: 'pending', label: 'Pending', count: getStatusCount('pending') },
    { id: 'approved', label: 'Approved', count: getStatusCount('approved') },
    { id: 'rejected', label: 'Rejected', count: getStatusCount('rejected') },
    { id: 'completed', label: 'Completed', count: getStatusCount('completed') },
  ];

  return (
    <div className="booking-filter-tabs">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  );
}
