import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, CircleDollarSign, Package, Plus, RefreshCw, TriangleAlert, Wrench } from 'lucide-react';
import { fetchEquipment, fetchCategories, createEquipment, updateEquipment, updateEquipmentMaintenance, adjustEquipmentStock, deleteEquipment, initializeEquipmentDatabase } from '../../api/equipment';
import { fetchAllInventory, createInventoryItem, updateInventoryItem, markItemAsUsed, restockItem, deleteInventoryItem } from '../../api/inventory';

// ============================================================================
// CONSTANTS
// ============================================================================

const RENTAL_CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories', emoji: '' },
  { value: 'decoration', label: 'Decoration', emoji: '🎨' },
  { value: 'lighting', label: 'Lighting', emoji: '💡' },
  { value: 'catering-equipment', label: 'Catering Equipment', emoji: '🍽️' },
  { value: 'furniture', label: 'Furniture', emoji: '🪑' },
  { value: 'sound-audio', label: 'Sound & Audio', emoji: '🔊' },
  { value: 'media-production', label: 'Media & Production', emoji: '🎥' },
  { value: 'general-supplies', label: 'General Supplies', emoji: '📦' },
];

const STOCK_CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'catering', label: 'Catering' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EquipmentInventoryDashboard() {
  const [activeTab, setActiveTab] = useState('rental');

  return (
    <section className="equipment-inventory-dashboard admin-target-section" aria-label="Equipment and inventory management">
      {/* HEADER */}
      <div className="section-header">
        <h2>🎪 Equipment &amp; Inventory</h2>
        <p>Manage rental equipment and operational stock separately</p>
      </div>

      {/* TAB SWITCHER */}
      <div className="inv-tab-bar">
        <button
          className={`inv-tab-btn ${activeTab === 'rental' ? 'inv-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('rental')}
        >
          🛠️ Rental Equipment
        </button>
        <button
          className={`inv-tab-btn ${activeTab === 'stock' ? 'inv-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          📦 Stock Inventory
        </button>
      </div>

      {activeTab === 'rental' ? <RentalEquipmentPanel /> : <StockInventoryPanel />}
    </section>
  );
}

// ============================================================================
// PANEL 1: RENTAL EQUIPMENT
// ============================================================================

function RentalEquipmentPanel() {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await initializeEquipmentDatabase();
        await loadData();
      } catch {
        await loadData();
      }
    };
    initDatabase();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

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

  const stats = useMemo(() => ({
    total: equipment.length,
    totalValue: equipment.reduce((sum, item) => sum + (item.totalQuantity * item.pricePerDay), 0),
    available: equipment.filter((item) => (item.availableQuantity ?? 0) > 0).length,
    maintenance: equipment.filter((item) => item.condition === 'under-maintenance').length,
    damaged: equipment.filter((item) => item.condition === 'damaged').length,
  }), [equipment]);

  const handleDelete = async (itemId) => {
    if (window.confirm('Delete this rental equipment item?')) {
      try {
        await deleteEquipment(itemId);
        setEquipment(equipment.filter((item) => item.id !== itemId));
      } catch (err) { setError(err.message); }
    }
  };

  const handleMaintenance = async (item, condition) => {
    try {
      const notes = prompt('Add maintenance notes:');
      if (notes !== null) {
        await updateEquipmentMaintenance(item.id, { condition, maintenanceNotes: notes });
        await loadData();
      }
    } catch (err) { setError(err.message); }
  };

  const handleStockAdjust = async (item, operation) => {
    const label = operation === 'add' ? 'add' : 'subtract';
    const value = window.prompt(`Enter quantity to ${label} for ${item.name}:`);
    if (value === null) return;
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity <= 0) { setError('Please enter a valid positive number.'); return; }
    try {
      await adjustEquipmentStock(item.id, { operation, quantity });
      await loadData();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="inv-panel">
      {/* STATS BAR */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <span className="inv-stat-label"><Package size={13} /> Total Items</span>
          <strong className="inv-stat-value">{stats.total}</strong>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label"><CircleDollarSign size={13} /> Daily Value</span>
          <strong className="inv-stat-value inv-stat-value--teal">₨{Number(stats.totalValue || 0).toLocaleString('en-PK')}</strong>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label"><CheckCircle2 size={13} /> Available</span>
          <strong className="inv-stat-value inv-stat-value--green">{stats.available}</strong>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label"><Wrench size={13} /> Maintenance</span>
          <strong className="inv-stat-value inv-stat-value--amber">{stats.maintenance}</strong>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label"><TriangleAlert size={13} /> Damaged</span>
          <strong className="inv-stat-value inv-stat-value--red">{stats.damaged}</strong>
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
      <div className="inv-toolbar">
        <CategoryDropdown value={selectedCategory} onChange={setSelectedCategory} options={RENTAL_CATEGORY_OPTIONS} />
        <ConditionDropdown value={filterCondition} onChange={setFilterCondition} />
        <button className="inv-refresh-btn" onClick={loadData} title="Refresh">
          <RefreshCw size={14} />
        </button>
        <button className="inv-add-btn" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Equipment
        </button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <EquipmentFormModal
          item={selectedItem}
          categories={categories}
          onClose={() => { setShowForm(false); setSelectedItem(null); }}
          onSubmit={async () => { await loadData(); setShowForm(false); setSelectedItem(null); }}
        />
      )}

      {loading && <div className="equipment-loading">Loading rental equipment...</div>}

      {/* TABLE */}
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
                  <td className="equipment-name"><strong>{item.name}</strong></td>
                  <td className="equipment-category"><span>{item.category?.icon} {item.category?.name}</span></td>
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
                    <button className="action-btn edit-btn" onClick={() => { setSelectedItem(item); setShowForm(true); }}>Edit</button>
                    {item.condition !== 'under-maintenance' && (
                      <button className="action-btn maintenance-btn" onClick={() => handleMaintenance(item, 'under-maintenance')}>Maintain</button>
                    )}
                    {item.condition === 'under-maintenance' && (
                      <button className="action-btn restore-btn" onClick={() => handleMaintenance(item, 'good')}>Restore</button>
                    )}
                    <button className="action-btn stock-in-btn" onClick={() => handleStockAdjust(item, 'add')}>+ Stock</button>
                    <button className="action-btn stock-out-btn" onClick={() => handleStockAdjust(item, 'subtract')}>- Stock</button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <div className="equipment-empty">📭 No rental equipment. Add items to get started.</div>
      )}
    </div>
  );
}

// ============================================================================
// PANEL 2: STOCK INVENTORY
// ============================================================================

function StockInventoryPanel() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllInventory();
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    if (filterCategory === 'all') return inventory;
    return inventory.filter((item) => item.category === filterCategory);
  }, [inventory, filterCategory]);

  const stats = useMemo(() => ({
    total: inventory.length,
    totalCost: inventory.reduce((sum, item) => sum + (item.totalCost || 0), 0),
    inStock: inventory.filter((item) => item.status === 'in-stock').length,
    lowStock: inventory.filter((item) => item.status === 'low-stock').length,
    outOfStock: inventory.filter((item) => item.status === 'out-of-stock').length,
  }), [inventory]);

  const handleUse = async (item) => {
    const value = window.prompt(`Mark used quantity for "${item.itemName}":`);
    if (value === null) return;
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty <= 0) { setError('Enter a valid positive number.'); return; }
    try { await markItemAsUsed(item._id, qty); await loadData(); }
    catch (err) { setError(err.message); }
  };

  const handleRestock = async (item) => {
    const value = window.prompt(`Restock quantity for "${item.itemName}":`);
    if (value === null) return;
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty <= 0) { setError('Enter a valid positive number.'); return; }
    try { await restockItem(item._id, qty); await loadData(); }
    catch (err) { setError(err.message); }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Delete "${item.itemName}" from stock inventory?`)) {
      try { await deleteInventoryItem(item._id); await loadData(); }
      catch (err) { setError(err.message); }
    }
  };

  const statusBadgeClass = (status) => {
    if (status === 'in-stock') return 'condition-badge condition-good';
    if (status === 'low-stock') return 'condition-badge condition-under-maintenance';
    return 'condition-badge condition-damaged';
  };

  const statusLabel = (status) => {
    if (status === 'in-stock') return '✓ In Stock';
    if (status === 'low-stock') return '⚠ Low Stock';
    return '✕ Out of Stock';
  };

  return (
    <div className="inv-panel">
      {/* STATS BAR */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <span className="inv-stat-label"><Package size={13} /> Total Items</span>
          <strong className="inv-stat-value">{stats.total}</strong>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label"><CircleDollarSign size={13} /> Total Cost</span>
          <strong className="inv-stat-value inv-stat-value--teal">₨{Number(stats.totalCost || 0).toLocaleString('en-PK')}</strong>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label"><CheckCircle2 size={13} /> In Stock</span>
          <strong className="inv-stat-value inv-stat-value--green">{stats.inStock}</strong>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label"><Wrench size={13} /> Low Stock</span>
          <strong className="inv-stat-value inv-stat-value--amber">{stats.lowStock}</strong>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label"><TriangleAlert size={13} /> Out of Stock</span>
          <strong className="inv-stat-value inv-stat-value--red">{stats.outOfStock}</strong>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="equipment-error">
          <p>{error}</p>
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="inv-toolbar">
        <CategoryDropdown value={filterCategory} onChange={setFilterCategory} options={STOCK_CATEGORY_OPTIONS} />
        <button className="inv-refresh-btn" onClick={loadData} title="Refresh">
          <RefreshCw size={14} />
        </button>
        <button className="inv-add-btn" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Stock Item
        </button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <StockFormModal
          item={selectedItem}
          onClose={() => { setShowForm(false); setSelectedItem(null); }}
          onSubmit={async () => { await loadData(); setShowForm(false); setSelectedItem(null); }}
        />
      )}

      {loading && <div className="equipment-loading">Loading stock inventory...</div>}

      {/* TABLE */}
      {!loading && filtered.length > 0 ? (
        <div className="equipment-table-wrapper">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Total</th>
                <th>Used</th>
                <th>Remaining</th>
                <th>Unit</th>
                <th>Cost/Unit</th>
                <th>Status</th>
                <th>Supplier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id} className={`equipment-row ${item.status === 'out-of-stock' ? 'equipment-row--damaged' : item.status === 'low-stock' ? 'equipment-row--under-maintenance' : 'equipment-row--good'}`}>
                  <td className="equipment-name"><strong>{item.itemName}</strong></td>
                  <td className="equipment-category"><span style={{ textTransform: 'capitalize' }}>{item.category}</span></td>
                  <td className="equipment-qty">{item.totalQuantity}</td>
                  <td>{item.usedQuantity}</td>
                  <td className="equipment-available">{item.remainingQuantity}</td>
                  <td>{item.unit}</td>
                  <td className="equipment-price">₨{Number(item.costPerUnit || 0).toLocaleString('en-PK')}</td>
                  <td className="equipment-condition">
                    <span className={statusBadgeClass(item.status)}>{statusLabel(item.status)}</span>
                  </td>
                  <td>{item.supplier?.name || '--'}</td>
                  <td className="equipment-actions">
                    <button className="action-btn edit-btn" onClick={() => { setSelectedItem(item); setShowForm(true); }}>Edit</button>
                    <button className="action-btn stock-out-btn" onClick={() => handleUse(item)}>Mark Used</button>
                    <button className="action-btn stock-in-btn" onClick={() => handleRestock(item)}>Restock</button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(item)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <div className="equipment-empty">📭 No stock items found. Add items to track your operational inventory.</div>
      )}
    </div>
  );
}

// ============================================================================
// SHARED DROPDOWN COMPONENTS
// ============================================================================

function CategoryDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false);
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
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${value === option.value ? 'bg-teal-50 font-medium text-teal-700' : 'text-gray-700'}`}
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              {option.emoji ? <span>{option.emoji}</span> : null}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConditionDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = CONDITION_OPTIONS.find((o) => o.value === value) || CONDITION_OPTIONS[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false);
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
          {CONDITION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${value === option.value ? `${option.selectedBgClass || 'bg-gray-50'} font-medium` : ''} ${option.textClass}`}
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              {option.dotClass ? <span className={`h-2 w-2 rounded-full ${option.dotClass}`} /> : null}
              {option.icon ? <span>{option.icon}</span> : null}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RENTAL EQUIPMENT FORM MODAL
// ============================================================================

function EquipmentFormModal({ item, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState(
    item || { name: '', category: categories[0]?.id || '', description: '', totalQuantity: 0, pricePerDay: 0, condition: 'good', images: [] }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'totalQuantity' || name === 'pricePerDay' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!formData.name || !formData.category) throw new Error('Name and category are required');
      const dataToSend = { ...formData, category: formData.category?.id || formData.category };
      if (item) { await updateEquipment(item.id, dataToSend); } else { await createEquipment(dataToSend); }
      await onSubmit();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item ? 'Edit Rental Equipment' : 'Add Rental Equipment'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="equipment-form">
          <div className="form-group">
            <label>Equipment Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Chair - Plastic (White)" required />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Detailed description" rows="3" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Total Quantity *</label>
              <input type="number" name="totalQuantity" value={formData.totalQuantity} onChange={handleChange} min="0" required />
            </div>
            <div className="form-group">
              <label>Price Per Day (₨) *</label>
              <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} min="0" step="100" required />
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
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : item ? 'Update' : 'Add Equipment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// STOCK INVENTORY FORM MODAL
// ============================================================================

function StockFormModal({ item, onClose, onSubmit }) {
  const [formData, setFormData] = useState(
    item
      ? { itemName: item.itemName, category: item.category, description: item.description || '', totalQuantity: item.totalQuantity, costPerUnit: item.costPerUnit || 0, unit: item.unit || 'pieces', minThreshold: item.minThreshold || 5, supplierName: item.supplier?.name || '', supplierPhone: item.supplier?.phone || '', notes: item.notes || '' }
      : { itemName: '', category: 'supplies', description: '', totalQuantity: 0, costPerUnit: 0, unit: 'pieces', minThreshold: 5, supplierName: '', supplierPhone: '', notes: '' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['totalQuantity', 'costPerUnit', 'minThreshold'];
    setFormData((prev) => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!formData.itemName || !formData.category) throw new Error('Item name and category are required');
      const payload = {
        itemName: formData.itemName,
        category: formData.category,
        description: formData.description,
        totalQuantity: formData.totalQuantity,
        costPerUnit: formData.costPerUnit,
        unit: formData.unit,
        minThreshold: formData.minThreshold,
        notes: formData.notes,
        supplier: { name: formData.supplierName, phone: formData.supplierPhone },
      };
      if (item) { await updateInventoryItem(item._id, payload); } else { await createInventoryItem(payload); }
      await onSubmit();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item ? 'Edit Stock Item' : 'Add Stock Item'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="equipment-form">
          <div className="form-group">
            <label>Item Name *</label>
            <input type="text" name="itemName" value={formData.itemName} onChange={handleChange} placeholder="e.g., White Linen Tablecloth" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="decoration">Decoration</option>
                <option value="lighting">Lighting</option>
                <option value="catering">Catering</option>
                <option value="furniture">Furniture</option>
                <option value="supplies">Supplies</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange}>
                <option value="pieces">Pieces</option>
                <option value="sets">Sets</option>
                <option value="rolls">Rolls</option>
                <option value="meters">Meters</option>
                <option value="kg">Kg</option>
                <option value="liters">Liters</option>
                <option value="boxes">Boxes</option>
                <option value="packs">Packs</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Total Quantity *</label>
              <input type="number" name="totalQuantity" value={formData.totalQuantity} onChange={handleChange} min="0" required />
            </div>
            <div className="form-group">
              <label>Cost Per Unit (₨)</label>
              <input type="number" name="costPerUnit" value={formData.costPerUnit} onChange={handleChange} min="0" step="10" />
            </div>
            <div className="form-group">
              <label>Low Stock Alert (min)</label>
              <input type="number" name="minThreshold" value={formData.minThreshold} onChange={handleChange} min="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Supplier Name</label>
              <input type="text" name="supplierName" value={formData.supplierName} onChange={handleChange} placeholder="Supplier company name" />
            </div>
            <div className="form-group">
              <label>Supplier Phone</label>
              <input type="text" name="supplierPhone" value={formData.supplierPhone} onChange={handleChange} placeholder="+92 300 0000000" />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Storage location, notes..." rows="2" />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : item ? 'Update Item' : 'Add Stock Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
