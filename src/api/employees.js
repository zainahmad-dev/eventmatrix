export async function fetchEmployees() {
  const response = await fetch('/api/employees');
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to fetch employee records.');
  }

  return payload;
}
