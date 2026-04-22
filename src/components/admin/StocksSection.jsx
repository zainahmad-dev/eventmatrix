import { useEffect, useState, useMemo } from 'react';
import { fetchAllInventory, fetchInventoryStats, markItemAsUsed, restockItem, deleteInventoryItem } from '../../api/inventory';

export function StocksSection() {
  // ========================================================================
  // STATE
  // ========================================================================

  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItem, setExpandedItem] = useState(null);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const category = selectedCategory === 'all' ? null : selectedCategory;
      const data = await fetchAllInventory(category);
      setInventory(data);
    } catch (err) {
      setError(err.message);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchInventoryStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // ========================================================================
  // LIFECYCLE
  // ========================================================================

  useEffect(() => {
    loadInventory();
    loadStats();
    const timer = setInterval(() => {
      loadInventory();
      loadStats();
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(timer);
  }, [selectedCategory]);

  // ========================================================================
  // FILTERED DATA
  // ========================================================================

  const filteredByStatus = useMemo(() => {
    return {
      inStock: inventory.filter((item) => item.status === 'in-stock').length,
      lowStock: inventory.filter((item) => item.status === 'low-stock').length,
      outOfStock: inventory.filter((item) => item.status === 'out-of-stock').length,
    };
  }, [inventory]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleMarkAsUsed = async (itemId, currentUsed, total) => {
    const maxCanUse = total - currentUsed;
    if (maxCanUse <= 0) {
      setError('No units available to mark as used.');
      return;
    }

    try {
      await markItemAsUsed(itemId, 1);
      await loadInventory();
      await loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRestock = async (itemId) => {
    const quantity = prompt('How many units to add?');
    if (quantity && Number(quantity) > 0) {
      try {
        await restockItem(itemId, Number(quantity));
        await loadInventory();
        await loadStats();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <section className="stocks-section admin-target-section" aria-label="Inventory and stocks management">
      {/* HEADER */}
      <div className="section-header">
        <h2>📦 Stocks & Inventory</h2>
        <p>Manage all inventory items, quantities, and usage tracking</p>
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="stocks-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Items</div>
            <div className="stat-value">{stats.totalItems}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Stock</div>
            <div className="stat-value in-stock">{filteredByStatus.inStock}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Low Stock</div>
            <div className="stat-value low-stock">{filteredByStatus.lowStock}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Out of Stock</div>
            <div className="stat-value out-of-stock">{filteredByStatus.outOfStock}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Value</div>
            <div className="stat-value">{`PKR ${Number(stats.totalValue || 0).toLocaleString('en-PK')}`}</div>
          </div>
        </div>
      )}

      {/* CATEGORY FILTER */}
      <div className="stocks-filter">
        <button
          className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Items
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'decoration' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('decoration')}
        >
          🎨 Decoration
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'lighting' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('lighting')}
        >
          💡 Lighting
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'catering' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('catering')}
        >
          🍽️ Catering
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'furniture' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('furniture')}
        >
          🪑 Furniture
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'supplies' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('supplies')}
        >
          📦 Supplies
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="stocks-error">
          <p>{error}</p>
        </div>
      )}

      {/* INVENTORY TABLE */}
      {loading ? (
        <div className="stocks-loading">Loading inventory...</div>
      ) : inventory.length > 0 ? (
        <div className="stocks-table-wrapper">
          <table className="stocks-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Total</th>
                <th>Used</th>
                <th>Remaining</th>
                <th>Unit</th>
                <th>Cost/Unit</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Last Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className={`stock-row stock-row--${item.status}`}>
                  <td className="item-name">
                    <strong>{item.itemName}</strong>
                  </td>
                  <td className="category">{item.category}</td>
                  <td className="quantity">{item.totalQuantity}</td>
                  <td className="quantity used">{item.usedQuantity}</td>
                  <td className="quantity remaining">
                    <strong>{item.remainingQuantity}</strong>
                  </td>
                  <td className="unit">{item.unit}</td>
                  <td className="cost">PKR {Number(item.costPerUnit).toLocaleString('en-PK')}</td>
                  <td className="total-cost">PKR {Number(item.totalCost).toLocaleString('en-PK')}</td>
                  <td className="status">
                    <span className={`status-badge status-${item.status}`}>
                      {item.status === 'in-stock' && '✓ In Stock'}
                      {item.status === 'low-stock' && '⚠ Low Stock'}
                      {item.status === 'out-of-stock' && '✕ Out of Stock'}
                    </span>
                  </td>
                  <td className="last-used">
                    {item.lastUsed
                      ? new Date(item.lastUsed).toLocaleDateString('en-PK')
                      : 'Never'}
                  </td>
                  <td className="actions">
                    <button
                      className="action-btn use-btn"
                      onClick={() => handleMarkAsUsed(item.id, item.usedQuantity, item.totalQuantity)}
                      title="Mark 1 unit as used"
                      disabled={item.remainingQuantity === 0}
                    >
                      Use
                    </button>
                    <button
                      className="action-btn restock-btn"
                      onClick={() => handleRestock(item.id)}
                      title="Add units"
                    >
                      +Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="stocks-empty">
          <p>📭 No inventory items. Add items to get started.</p>
        </div>
      )}

      {/* LOW STOCK ALERTS */}
      {stats && stats.lowStockItems && stats.lowStockItems.length > 0 && (
        <div className="stocks-alerts">
          <h3>⚠️ Low Stock Alerts</h3>
          <div className="alert-list">
            {stats.lowStockItems.map((item) => (
              <div key={item.id} className="alert-item">
                <span>{item.itemName}</span>
                <span>{item.remaining} remaining (min: {item.minThreshold})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OUT OF STOCK ALERTS */}
      {stats && stats.outOfStockItems && stats.outOfStockItems.length > 0 && (
        <div className="stocks-alerts critical">
          <h3>✕ Out of Stock</h3>
          <div className="alert-list">
            {stats.outOfStockItems.map((item) => (
              <div key={item.id} className="alert-item">
                {item.itemName}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
