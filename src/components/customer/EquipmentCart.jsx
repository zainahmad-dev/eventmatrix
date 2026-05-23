import { useMemo } from "react";

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function EquipmentCart({ items, onRemove, onUpdateQuantity }) {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    [items],
  );

  return (
    <article className="dashboard-card dashboard-card--wide">
      <div className="dashboard-card-header">
        <h3>Equipment Cart</h3>
      </div>

      {items.length ? (
        <>
          <div className="dashboard-list">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`}>
                <p>
                  <strong>{item.name}</strong>
                </p>
                <p>
                  {item.categoryName || "Equipment"} · {formatPKR(item.pricePerDay)}{" "}
                  / day
                </p>
                <label>
                  Quantity
                  <input
                    className="field-input"
                    aria-label={`Quantity for ${item.name}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      onUpdateQuantity(index, Math.max(1, Number(event.target.value) || 1))
                    }
                  />
                </label>
                <p>
                  Line total: <strong>{formatPKR(item.totalPrice)}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                >
                  Remove {item.name}
                </button>
              </div>
            ))}
          </div>
          <p>
            <strong>Equipment total: {formatPKR(total)}</strong>
          </p>
        </>
      ) : (
        <div className="empty-state">
          <p>🛒 Your equipment cart is empty.</p>
        </div>
      )}
    </article>
  );
}
