const BOOKINGS_KEY = 'eventmatrix_bookings';

function readBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function writeBookings(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export function getBookings() {
  return readBookings();
}

export function addBooking(booking) {
  const current = readBookings();
  const next = [booking, ...current];
  writeBookings(next);
  return next;
}

export function updateBookingStatus(bookingId, status) {
  const current = readBookings();
  const next = current.map((booking) => (
    booking.id === bookingId
      ? { ...booking, status, updatedAt: new Date().toISOString() }
      : booking
  ));
  writeBookings(next);
  return next;
}