import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, CircleDollarSign, Package, Plus, TriangleAlert, Wrench } from 'lucide-react';
import { fetchEquipment, fetchCategories, createEquipment, updateEquipment, updateEquipmentMaintenance, deleteEquipment, initializeEquipmentDatabase } from '../../api/equipment';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories', emoji: '' },
  { value: 'decoration', label: 'Decoration', emoji: '🎨' },
  { value: 'lighting', label: 'Lighting', emoji: '💡' },
  { value: 'catering-equipment', label: 'Catering Equipment', emoji: '🍽️' },
  { value: 'furniture', label: 'Furniture', emoji: '🪑' },
  { value: 'sound-audio', label: 'Sound & Audio', emoji: '🔊' },
  { value: 'media-production', label: 'Media & Production', emoji: '🎥' },
  { value: 'general-supplies', label: 'General Supplies', emoji: '📦' },
];

const CONDITION_OPTIONS = [
  { value: 'all', label: 'All Conditions', textClass: 'text-gray-500', dotClass: '' },
  { value: 'good', label: 'Good', icon: '✓', textClass: 'text-green-700', dotClass: 'bg-green-600', selectedBgClass: 'bg-green-50' },
  { value: 'under-maintenance', label: 'Maintenance', icon: '⚙', textClass: 'text-amber-600', dotClass: 'bg-amber-500', selectedBgClass: 'bg-amber-50' },
  { value: 'damaged', label: 'Damaged', icon: '✕', textClass: 'text-red-700', dotClass: 'bg-red-600', selectedBgClass: 'bg-red-50' },
];

const normalizeCategoryValue = (rawValue = '') => {
  const value = String(rawValue).trim().toLowerCase();
  if (!value) return '';
  if (value.includes('decoration')) return 'decoration';
  if (value.includes('lighting')) return 'lighting';
  if (value.includes('catering')) return 'catering-equipment';
  if (value.includes('furniture')) return 'furniture';
  if (value.includes('sound') || value.includes('audio')) return 'sound-audio';
  if (value.includes('media') || value.includes('production')) return 'media-production';
  if (value.includes('general') || value.includes('supplies')) return 'general-supplies';
  return value;
};


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
  const loadData = async () => {
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
  };

  // Initialize database on first load
  const initDatabase = async () => {
    try {
      await initializeEquipmentDatabase();
      await loadData();
    } catch (err) {
      console.error('Database initialization skipped (already exists)');
      await loadData();
    }
  };

  useEffect(() => {
    initDatabase();
    const timer = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(timer);
  }, []);

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      if (selectedCategory !== 'all') {
        const categoryName = normalizeCategoryValue(item.category?.name);
        const categoryId = normalizeCategoryValue(item.category?.id);
        if (categoryName !== selectedCategory && categoryId !== selectedCategory) return false;
      }
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
            <Package size={14} />
            <span>Total Items</span>
          </div>
          <div className="text-2xl font-semibold text-gray-800">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
            <CircleDollarSign size={14} />
            <span>Total Value</span>
          </div>
          <div className="text-2xl font-semibold text-teal-700">₨{Number(stats.totalValue || 0).toLocaleString('en-PK')}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
            <CheckCircle2 size={14} />
            <span>Good</span>
          </div>
          <div className="text-2xl font-semibold text-green-700">{stats.good}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
            <Wrench size={14} />
            <span>Under Maintenance</span>
          </div>
          <div className="text-2xl font-semibold text-amber-600">{stats.maintenance}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
            <TriangleAlert size={14} />
            <span>Damaged</span>
          </div>
          <div className="text-2xl font-semibold text-red-700">{stats.damaged}</div>
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
      <div className="mt-4 flex items-center gap-3">
        <CategoryDropdown value={selectedCategory} onChange={setSelectedCategory} />
        <ConditionDropdown value={filterCondition} onChange={setFilterCondition} />

        <button
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
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

function CategoryDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = CATEGORY_OPTIONS.find((option) => option.value === value) || CATEGORY_OPTIONS[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} className="relative min-w-48">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex items-center gap-2 text-gray-700">
          {selected.emoji ? <span>{selected.emoji}</span> : null}
          {selected.label}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-md">
          {CATEGORY_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  isSelected ? 'bg-teal-50 font-medium text-teal-700' : 'text-gray-700'
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.emoji ? <span>{option.emoji}</span> : null}
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConditionDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = CONDITION_OPTIONS.find((option) => option.value === value) || CONDITION_OPTIONS[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} className="relative min-w-48">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`flex items-center gap-2 ${selected.textClass}`}>
          {selected.dotClass ? <span className={`h-2 w-2 rounded-full ${selected.dotClass}`} /> : null}
          {selected.icon ? <span>{selected.icon}</span> : null}
          {selected.label}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-md">
          {CONDITION_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  isSelected ? `${option.selectedBgClass || 'bg-gray-50'} font-medium` : ''
                } ${option.textClass}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.dotClass ? <span className={`h-2 w-2 rounded-full ${option.dotClass}`} /> : null}
                {option.icon ? <span>{option.icon}</span> : null}
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
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
