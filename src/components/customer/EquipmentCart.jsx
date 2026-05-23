import { formatPKR } from "./formatPKR";

export function EquipmentCart({ items, onRemove, onUpdateQuantity }) {
  const grandTotal = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h3>Equipment Cart</h3>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No equipment selected yet.</p>
        </div>
      ) : (
        <>
          <div className="dashboard-list">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="overview-card">
                <p>{item.name}</p>
                <strong>{formatPKR(item.totalPrice)}</strong>
                <p>{formatPKR(item.pricePerDay)} × {item.quantity}</p>
                <div className="quick-actions">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => {
                      const quantity = Number.parseInt(event.target.value, 10);
                      onUpdateQuantity(index, Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
                    }}
                    aria-label={`${item.name} quantity`}
                  />
                  <button type="button" onClick={() => onRemove(index)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p>
            Total Equipment Cost: <strong>{formatPKR(grandTotal)}</strong>
          </p>
        </>
      )}
    </div>
  );
}
