function getAuthHeader() {
  const token = localStorage.getItem('eventmatrix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function generateQuotationsFromBookings(bookings) {
  const response = await fetch('/api/quotations/generate-from-bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ bookings }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to generate quotation records.');
  }

  return payload;
}

export async function getQuotationOverview() {
  const response = await fetch('/api/quotations/overview', {
    headers: getAuthHeader(),
  });
  const payload = await response.json().catch(() => ([]));

  if (!response.ok) {
    throw new Error('Unable to fetch quotation records.');
  }

  return payload;
}

export async function addInvoicePayment(paymentId, amount, method = 'manual') {
  const response = await fetch(`/api/quotations/payments/${paymentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ amount, method }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to record payment.');
  }

  return payload;
}

export async function downloadInvoiceText(quotationId, fallbackName = 'invoice') {
  const response = await fetch(`/api/quotations/download/${quotationId}`, {
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Unable to download invoice.');
  }

  const content = await response.text();
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fallbackName}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
