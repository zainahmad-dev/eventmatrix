import { useCallback, useEffect, useState, useMemo } from 'react';
import { fetchEquipment, fetchCategories, createEquipment, updateEquipment, updateEquipmentMaintenance, deleteEquipment, initializeEquipmentDatabase } from '../../api/equipment';


export function EquipmentInventoryDashboard() {
  // State
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Load equipment and categories
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [equipRes, catRes] = await Promise.all([
        fetchEquipment({ adminView: true }),
        fetchCategories(),
      ]);
      setEquipment(Array.isArray(equipRes) ? equipRes : []);
      setCategories(Array.isArray(catRes) ? catRes : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize database on first load
  const initDatabase = useCallback(async () => {
    try {
      await initializeEquipmentDatabase();
      await loadData();
    } catch (err) {
      console.error('Database initialization skipped (already exists)');
      await loadData();
    }
  }, [loadData]);

  useEffect(() => {
    initDatabase();
    const timer = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(timer);
  }, [initDatabase, loadData]);

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      if (selectedCategory !== 'all' && item.category?.id !== selectedCategory) return false;
      if (filterCondition !== 'all' && item.condition !== filterCondition) return false;
      return true;
    });
  }, [equipment, selectedCategory, filterCondition]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: equipment.length,
      totalValue: equipment.reduce((sum, item) => sum + (item.totalQuantity * item.pricePerDay), 0),
      good: equipment.filter((item) => item.condition === 'good').length,
      damaged: equipment.filter((item) => item.condition === 'damaged').length,
      maintenance: equipment.filter((item) => item.condition === 'under-maintenance').length,
    };
  }, [equipment]);

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await deleteEquipment(itemId);
        setEquipment(equipment.filter((item) => item.id !== itemId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleMaintenance = async (item, condition) => {
    try {
      const notes = prompt('Add maintenance notes:');
      if (notes !== null) {
        await updateEquipmentMaintenance(item.id, { condition, maintenanceNotes: notes });
        await loadData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleFormSubmit = async () => {
    await loadData();
    handleFormClose();
  };

  return (
    <section className="equipment-inventory-dashboard admin-target-section" aria-label="Equipment inventory management">
      {/* HEADER */}
      <div className="section-header">
        <h2>🎪 Equipment Inventory</h2>
        <p>Manage rental equipment, pricing, and availability</p>
      </div>

      {/* STATS */}
      <div className="equipment-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Items</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Value</div>
          <div className="stat-value">₨{Number(stats.totalValue || 0).toLocaleString('en-PK')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Good</div>
          <div className="stat-value good">{stats.good}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Under Maintenance</div>
          <div className="stat-value maintenance">{stats.maintenance}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Damaged</div>
          <div className="stat-value damaged">{stats.damaged}</div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="equipment-error">
          <p>{error}</p>
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* FILTERS & ACTIONS */}
      <div className="equipment-controls">
        <div className="filters">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)}>
            <option value="all">All Conditions</option>
            <option value="good">✓ Good</option>
            <option value="under-maintenance">⚙ Maintenance</option>
            <option value="damaged">✕ Damaged</option>
          </select>
        </div>

        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add Equipment
        </button>
      </div>

      {/* EQUIPMENT FORM MODAL */}
      {showForm && (
        <EquipmentFormModal
          item={selectedItem}
          categories={categories}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* LOADING */}
      {loading && <div className="equipment-loading">Loading equipment...</div>}

      {/* EQUIPMENT TABLE */}
      {!loading && filteredEquipment.length > 0 ? (
        <div className="equipment-table-wrapper">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Total</th>
                <th>Available</th>
                <th>Price/Day</th>
                <th>Condition</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((item) => (
                <tr key={item.id} className={`equipment-row equipment-row--${item.condition}`}>
                  <td className="equipment-name">
                    <strong>{item.name}</strong>
                  </td>
                  <td className="equipment-category">
                    <span>{item.category?.icon} {item.category?.name}</span>
                  </td>
                  <td className="equipment-qty">{item.totalQuantity}</td>
                  <td className="equipment-available">{item.availableQuantity}</td>
                  <td className="equipment-price">₨{Number(item.pricePerDay).toLocaleString('en-PK')}</td>
                  <td className="equipment-condition">
                    <span className={`condition-badge condition-${item.condition}`}>
                      {item.condition === 'good' && '✓ Good'}
                      {item.condition === 'under-maintenance' && '⚙ Maintenance'}
                      {item.condition === 'damaged' && '✕ Damaged'}
                    </span>
                  </td>
                  <td className="equipment-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowForm(true);
                      }}
                      title="Edit equipment"
                    >
                      Edit
                    </button>
                    {item.condition !== 'under-maintenance' && (
                      <button
                        className="action-btn maintenance-btn"
                        onClick={() => handleMaintenance(item, 'under-maintenance')}
                        title="Mark for maintenance"
                      >
                        Maintain
                      </button>
                    )}
                    {item.condition === 'under-maintenance' && (
                      <button
                        className="action-btn restore-btn"
                        onClick={() => handleMaintenance(item, 'good')}
                        title="Restore to good condition"
                      >
                        Restore
                      </button>
                    )}
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(item.id)}
                      title="Delete equipment"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <div className="equipment-empty">📭 No equipment items. Add items to get started.</div>
      )}
    </section>
  );
}

/**
 * EquipmentFormModal - Add/Edit equipment form
 */
function EquipmentFormModal({ item, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState(
    item || {
      name: '',
      category: categories[0]?.id || '',
      description: '',
      totalQuantity: 0,
      pricePerDay: 0,
      condition: 'good',
      images: [],
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalQuantity' || name === 'pricePerDay' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name || !formData.category) {
        throw new Error('Name and category are required');
      }

      // Extract category ID if it's an object
      const dataToSend = {
        ...formData,
        category: formData.category?.id || formData.category,
      };

      if (item) {
        // Edit existing item
        await updateEquipment(item.id, dataToSend);
      } else {
        // Create new item
        await createEquipment(dataToSend);
      }

      await onSubmit();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item ? 'Edit Equipment' : 'Add New Equipment'}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="equipment-form">
          <div className="form-group">
            <label>Equipment Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Chair - Plastic (White)"
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the equipment"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Quantity *</label>
              <input
                type="number"
                name="totalQuantity"
                value={formData.totalQuantity}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Price Per Day (₨) *</label>
              <input
                type="number"
                name="pricePerDay"
                value={formData.pricePerDay}
                onChange={handleChange}
                min="0"
                step="100"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Condition</label>
            <select name="condition" value={formData.condition} onChange={handleChange}>
              <option value="good">✓ Good</option>
              <option value="under-maintenance">⚙ Under Maintenance</option>
              <option value="damaged">✕ Damaged</option>
            </select>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : item ? 'Update Equipment' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
