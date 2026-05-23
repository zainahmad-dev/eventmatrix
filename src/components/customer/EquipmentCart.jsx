const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function EquipmentCart({ items, onRemove, onUpdateQuantity }) {
  const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return (
    <div className="dashboard-card" style={{ marginTop: "1rem" }}>
      <div className="dashboard-card-header">
        <h3>Equipment Cart</h3>
      </div>

      {items.length === 0 ? (
        <p>No equipment selected yet.</p>
      ) : (
        <>
          <ul className="dashboard-list">
            {items.map((item, index) => (
              <li key={`${item.id}-${index}`}>
                <strong>{item.name}</strong> — {formatPKR(item.pricePerDay)} / day
                <br />
                <small>Item total: {formatPKR(item.totalPrice)}</small>
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    className="field-input"
                    onChange={(event) =>
                      onUpdateQuantity(index, Math.max(1, Number(event.target.value) || 1))
                    }
                  />
                  <button type="button" onClick={() => onRemove(index)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p>
            <strong>Equipment subtotal: {formatPKR(total)}</strong>
          </p>
        </>
      )}
    </div>
  );
}
