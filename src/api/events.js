function getAuthHeader() {
  const token = localStorage.getItem('eventmatrix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchEvents() {
  try {
    const response = await fetch('/api/events', {
      headers: getAuthHeader(),
    });
    let payload = [];

    try {
      payload = await response.json();
    } catch (parseError) {
      console.error('Failed to parse events response:', parseError);
      payload = [];
    }

    if (!response.ok) {
      const errorMsg = (payload && payload.error) || 'Unable to fetch events.';
      throw new Error(errorMsg);
    }

    // Ensure payload is always an array
    if (!Array.isArray(payload)) {
      console.warn('Events API returned non-array response:', payload);
      return [];
    }

    return payload;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

export async function createEventBooking(bookingPayload) {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
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
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to update event status.');
  }

  return payload;
}
