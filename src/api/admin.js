export async function runAdminAction(actionType, performedBy) {
  const response = await fetch(`/api/admin/actions/${actionType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  const response = await fetch('/api/admin/actions');
  const payload = await response.json().catch(() => ([]));

  if (!response.ok) {
    throw new Error('Unable to fetch action logs.');
  }

  return payload;
}