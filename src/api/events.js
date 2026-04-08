export async function fetchEvents() {
  const response = await fetch('/api/events');
  const payload = await response.json().catch(() => ([]));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to fetch events.');
  }

  return payload;
}

export async function createEventBooking(bookingPayload) {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingPayload),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to submit booking request.');
  }

  return payload;
}

export async function updateEventStatus(eventId, status) {
  const response = await fetch(`/api/events/${eventId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to update event status.');
  }

  return payload;
}
