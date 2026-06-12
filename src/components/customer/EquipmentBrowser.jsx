import { useEffect, useState, useMemo } from 'react';
import { Search, Filter, ShoppingCart, X } from 'lucide-react';
import { fetchEquipment, fetchCategories } from '../../api/equipment';
import './EquipmentBrowser.css';

export function EquipmentBrowser({ eventDate, onAddToCart }) {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (eventDate) {
        filters.startDate = eventDate;
        filters.endDate = eventDate;
      }

      const [equipRes, catRes] = await Promise.all([
        fetchEquipment(filters),
        fetchCategories(),
      ]);

      // Filter out damaged/maintenance items for customers
      const availableEquip = (Array.isArray(equipRes) ? equipRes : []).filter(
        (item) => item.condition === 'good' && item.availableQuantity > 0
      );

      setEquipment(availableEquip);
      setCategories(Array.isArray(catRes) ? catRes : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventDate]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      if (selectedCategory !== 'all' && item.category?.id !== selectedCategory) return false;
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [equipment, selectedCategory, searchTerm]);

  const handleAddToCart = (item) => {
    if (!onAddToCart) return;

    if (quantity > item.availableQuantity) {
      setError(`Only ${item.availableQuantity} units available`);
      return;
    }

    onAddToCart({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity,
      pricePerDay: item.pricePerDay,
      totalPrice: item.pricePerDay * quantity,
    });

    setSelectedItem(null);
    setQuantity(1);
  };

  return (
    <section className="equipment-browser">
      {/* Header */}
      <div className="equipment-browser-header">
        <h2>📦 Browse Equipment & Rentals</h2>
        {eventDate && <p>Available items for: {new Date(eventDate).toLocaleDateString()}</p>}
      </div>

      {/* Search & Filter */}
      <div className="equipment-browser-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filter">
          <Filter size={18} />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading equipment...</div>
      ) : filteredEquipment.length === 0 ? (
        <div className="empty-state">
          <p>No equipment available for your search. Try different filters.</p>
        </div>
      ) : (
        <div className="equipment-grid">
          {filteredEquipment.map((item) => (
            <div
              key={item.id}
              className="equipment-card"
              onClick={() => {
                setSelectedItem(item);
                setQuantity(1);
              }}
            >
              <div className="equipment-image">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} />
                ) : (
                  <div className="placeholder">{item.category?.icon || '📦'}</div>
                )}
              </div>

              <div className="equipment-info">
                <div className="equipment-category">{item.category?.icon} {item.category?.name}</div>
                <h3>{item.name}</h3>
                <p className="description">{item.description}</p>

                <div className="equipment-stats">
                  <span className="price">PKR {item.pricePerDay.toLocaleString('en-PK')}/day</span>
                  <span className={`availability ${item.availableQuantity > 0 ? 'available' : 'unavailable'}`}>
                    {item.availableQuantity} available
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedItem(null)}>
              <X size={20} />
            </button>

            <div className="modal-body">
              <div className="modal-image">
                {selectedItem.images?.[0] ? (
                  <img src={selectedItem.images[0]} alt={selectedItem.name} />
                ) : (
                  <div className="placeholder">{selectedItem.category?.icon || '📦'}</div>
                )}
              </div>

              <div className="modal-details">
                <div className="category-badge">
                  {selectedItem.category?.icon} {selectedItem.category?.name}
                </div>
                <h2>{selectedItem.name}</h2>
                <p className="description">{selectedItem.description}</p>

                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Price</strong>
                    <p>PKR {selectedItem.pricePerDay.toLocaleString('en-PK')}/day</p>
                  </div>
                  <div className="detail-item">
                    <strong>Available</strong>
                    <p>{selectedItem.availableQuantity} units</p>
                  </div>
                  <div className="detail-item">
                    <strong>Condition</strong>
                    <p className="condition-badge good">{selectedItem.condition}</p>
                  </div>
                </div>

                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="quantity-input">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <input
                      type="number"
                      min="1"
                      max={selectedItem.availableQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(selectedItem.availableQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    />
                    <button onClick={() => setQuantity(Math.min(selectedItem.availableQuantity, quantity + 1))}>+</button>
                  </div>
                </div>

                <div className="total-price">
                  <p>Total: <strong>PKR {(selectedItem.pricePerDay * quantity).toLocaleString('en-PK')}</strong></p>
                </div>

                <button
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(selectedItem)}
                  disabled={quantity > selectedItem.availableQuantity}
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
