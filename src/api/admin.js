function getAuthHeader() {
  const token = localStorage.getItem('eventmatrix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function runAdminAction(actionType, performedBy) {
  const response = await fetch(`/api/admin/actions/${actionType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ performedBy }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to run admin action.');
  }

  return payload;
}

export async function getAdminActionLogs() {
  const response = await fetch('/api/admin/actions', {
    headers: getAuthHeader(),
  });
  const payload = await response.json().catch(() => ([]));

  if (!response.ok) {
    throw new Error('Unable to fetch action logs.');
  }

  return payload;
}