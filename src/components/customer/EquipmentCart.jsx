import { Trash2, ShoppingCart } from 'lucide-react';
import './EquipmentCart.css';

export function EquipmentCart({ items = [], onRemove, onUpdateQuantity }) {
  const totalPrice = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="equipment-cart empty">
        <ShoppingCart size={24} />
        <p>No equipment selected yet</p>
      </div>
    );
  }

  return (
    <div className="equipment-cart">
      <h3>📦 Equipment Cart ({totalItems})</h3>

      <div className="cart-items">
        {items.map((item, index) => (
          <div key={index} className="cart-item">
            <div className="item-info">
              <div className="item-header">
                <strong>{item.name}</strong>
                <span className="category-badge">{item.category?.icon} {item.category?.name}</span>
              </div>
              <p className="price">PKR {item.pricePerDay?.toLocaleString('en-PK')}/day</p>
            </div>

            <div className="item-controls">
              <div className="quantity-control">
                <button onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => onUpdateQuantity(index, item.quantity + 1)}>+</button>
              </div>

              <div className="item-total">
                <strong>PKR {item.totalPrice?.toLocaleString('en-PK')}</strong>
              </div>

              <button className="remove-btn" onClick={() => onRemove(index)} title="Remove item">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <strong>PKR {totalPrice.toLocaleString('en-PK')}</strong>
        </div>
      </div>
    </div>
  );
}
