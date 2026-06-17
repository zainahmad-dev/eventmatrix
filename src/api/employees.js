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

export async function createEmployee(employeeData) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to create employee.');
  }

  return payload;
}

export async function markAttendance() {
  const response = await fetch('/api/employees/attendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to mark attendance.');
  }

  return payload;
}

export async function fetchAttendance() {
  const response = await fetch('/api/employees/attendance', {
    headers: getAuthHeader(),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to fetch attendance record.');
  }

  return payload;
}

export async function downloadPayslip(employeeId = '', employeeName = 'Employee') {
  try {
    const url = employeeId
      ? `/api/employees/payslip/download/${employeeId}`
      : '/api/employees/payslip/download';

    const response = await fetch(url, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Unable to download payslip.');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;

    const date = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthStr = monthNames[date.getMonth()];

    link.download = `Payslip_${employeeName.replace(/\s+/g, '_')}_${monthStr}_${date.getFullYear()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading payslip:', error);
    throw error;
  }
}
