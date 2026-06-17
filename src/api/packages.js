function getAuthHeader() {
  const token = localStorage.getItem('eventmatrix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function initializePackages() {
  const response = await fetch('/api/packages/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Failed to initialize packages.');
  }
  return payload;
}

export async function fetchPackages(filters = {}) {
  const params = new URLSearchParams();
  if (filters.eventType) params.append('eventType', filters.eventType);
  if (filters.adminView) params.append('adminView', 'true');
  if (filters.seats) params.append('seats', String(filters.seats));

  const url = `/api/packages${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeader() });
  const payload = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to fetch packages.');
  }

  return Array.isArray(payload) ? payload : [];
}

export async function fetchPackageById(packageId, seats = null) {
  const url = seats
    ? `/api/packages/${packageId}?seats=${seats}`
    : `/api/packages/${packageId}`;
  const response = await fetch(url, { headers: getAuthHeader() });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to fetch package.');
  }

  return payload;
}

export async function createPackage(packageData) {
  const response = await fetch('/api/packages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(packageData),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to create package.');
  }

  return payload;
}

export async function updatePackage(packageId, packageData) {
  const response = await fetch(`/api/packages/${packageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(packageData),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to update package.');
  }

  return payload;
}

export async function deletePackage(packageId) {
  const response = await fetch(`/api/packages/${packageId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to delete package.');
  }

  return payload;
}

export function calculatePackageTotal(pkg, seats) {
  if (!pkg) return 0;
  const basePrice = Number(pkg.basePrice || 0);
  const pricePerSeat = Number(pkg.pricePerSeat || 0);
  return basePrice + pricePerSeat * Number(seats || 0);
}
