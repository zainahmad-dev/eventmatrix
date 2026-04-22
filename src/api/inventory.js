/**
 * Inventory API Functions
 * Handles all API calls for inventory management
 */

function getAuthHeader() {
  const token = localStorage.getItem('eventmatrix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchAllInventory(category = null) {
  try {
    const url = category ? `/api/inventory?category=${category}` : '/api/inventory';
    const response = await fetch(url, {
      headers: getAuthHeader(),
    });
    const payload = await response.json().catch(() => ([]));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to fetch inventory.');
    }

    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
}

export async function fetchInventoryStats() {
  try {
    const response = await fetch('/api/inventory/stats', {
      headers: getAuthHeader(),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to fetch inventory stats.');
    }

    return payload;
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    throw error;
  }
}

export async function fetchInventoryItem(itemId) {
  try {
    const response = await fetch(`/api/inventory/${itemId}`, {
      headers: getAuthHeader(),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to fetch inventory item.');
    }

    return payload;
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    throw error;
  }
}

export async function createInventoryItem(itemData) {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(itemData),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to create inventory item.');
    }

    return payload;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
}

export async function updateInventoryItem(itemId, itemData) {
  try {
    const response = await fetch(`/api/inventory/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(itemData),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to update inventory item.');
    }

    return payload;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
}

export async function markItemAsUsed(itemId, quantity) {
  try {
    const response = await fetch(`/api/inventory/${itemId}/use`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ quantity }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to update item usage.');
    }

    return payload;
  } catch (error) {
    console.error('Error marking item as used:', error);
    throw error;
  }
}

export async function restockItem(itemId, quantity) {
  try {
    const response = await fetch(`/api/inventory/${itemId}/restock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ quantity }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to restock item.');
    }

    return payload;
  } catch (error) {
    console.error('Error restocking item:', error);
    throw error;
  }
}

export async function deleteInventoryItem(itemId) {
  try {
    const response = await fetch(`/api/inventory/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to delete inventory item.');
    }

    return payload;
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
}
