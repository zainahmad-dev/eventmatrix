/**
 * Equipment API Client Functions
 * Handles all API calls for equipment rental management
 */

function getAuthHeader() {
  const token = localStorage.getItem('eventmatrix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeEquipmentDatabase() {
  try {
    const response = await fetch('/api/equipment/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to initialize database.');
    }

    return payload;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// ============================================================================
// GET ENDPOINTS - Equipment Items
// ============================================================================

export async function fetchEquipment(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.adminView) params.append('adminView', 'true');

    const url = `/api/equipment${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeader(),
    });

    const payload = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to fetch equipment.');
    }

    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
}

export async function fetchEquipmentById(itemId, dateRange = null) {
  try {
    let url = `/api/equipment/${itemId}`;

    if (dateRange?.startDate && dateRange?.endDate) {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: getAuthHeader(),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to fetch equipment item.');
    }

    return payload;
  } catch (error) {
    console.error('Error fetching equipment item:', error);
    throw error;
  }
}

export async function fetchEquipmentByCategory(categoryId) {
  try {
    const response = await fetch(`/api/equipment/category/${categoryId}`, {
      headers: getAuthHeader(),
    });

    const payload = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to fetch equipment by category.');
    }

    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.error('Error fetching equipment by category:', error);
    throw error;
  }
}

export async function fetchCategories() {
  try {
    const response = await fetch('/api/equipment/list/categories', {
      headers: getAuthHeader(),
    });

    const payload = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to fetch categories.');
    }

    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function checkAvailability(itemId, startDate, endDate) {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    const response = await fetch(`/api/equipment/${itemId}/availability?${params.toString()}`, {
      headers: getAuthHeader(),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to check availability.');
    }

    return payload;
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
}

// ============================================================================
// POST ENDPOINTS - Create Equipment & Categories
// ============================================================================

export async function createEquipment(itemData) {
  try {
    const response = await fetch('/api/equipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(itemData),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to create equipment item.');
    }

    return payload;
  } catch (error) {
    console.error('Error creating equipment:', error);
    throw error;
  }
}

export async function createCategory(categoryData) {
  try {
    const response = await fetch('/api/equipment/category', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(categoryData),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to create category.');
    }

    return payload;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// ============================================================================
// PUT ENDPOINTS - Update Equipment & Maintenance
// ============================================================================

export async function updateEquipment(itemId, itemData) {
  try {
    const response = await fetch(`/api/equipment/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(itemData),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to update equipment item.');
    }

    return payload;
  } catch (error) {
    console.error('Error updating equipment:', error);
    throw error;
  }
}

export async function updateEquipmentMaintenance(itemId, { condition, maintenanceNotes }) {
  try {
    const response = await fetch(`/api/equipment/${itemId}/maintenance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        condition,
        maintenanceNotes,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to update maintenance status.');
    }

    return payload;
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    throw error;
  }
}

// ============================================================================
// DELETE ENDPOINTS
// ============================================================================

export async function deleteEquipment(itemId) {
  try {
    const response = await fetch(`/api/equipment/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to delete equipment item.');
    }

    return payload;
  } catch (error) {
    console.error('Error deleting equipment:', error);
    throw error;
  }
}
