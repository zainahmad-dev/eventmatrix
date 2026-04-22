function getAuthHeader() {
  const token = localStorage.getItem('eventmatrix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchEmployees() {
  const response = await fetch('/api/employees', {
    headers: getAuthHeader(),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to fetch employee records.');
  }

  return payload;
}
