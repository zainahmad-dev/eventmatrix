import { useEffect, useState } from "react";
import { fetchEquipment } from "../../api/equipment";

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function EquipmentBrowser({ eventDate, onAddToCart }) {
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadEquipment = async () => {
      setLoading(true);
      setError("");

      try {
        const payload = await fetchEquipment({
          startDate: eventDate,
          endDate: eventDate,
        });
        if (!active) return;
        setItems(Array.isArray(payload) ? payload : []);
      } catch (err) {
        if (!active) return;
        setItems([]);
        setError(err.message || "Unable to load equipment.");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (eventDate) {
      loadEquipment();
    } else {
      setItems([]);
      setError("");
    }

    return () => {
      active = false;
    };
  }, [eventDate]);

  const handleQuantityChange = (itemId, value) => {
    setQuantities((current) => ({
      ...current,
      [itemId]: value,
    }));
  };

  const handleAdd = (item) => {
    const requestedQuantity = Number.parseInt(quantities[item.id] ?? "1", 10);
    const safeQuantity = Number.isFinite(requestedQuantity)
      ? Math.min(Math.max(requestedQuantity, 1), Number(item.availableQuantity || 1))
      : 1;

    onAddToCart({
      id: item.id,
      name: item.name,
      pricePerDay: Number(item.pricePerDay || 0),
      quantity: safeQuantity,
      totalPrice: Number(item.pricePerDay || 0) * safeQuantity,
    });
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h3>Available Equipment</h3>
      </div>

      {loading ? <p>Loading equipment...</p> : null}
      {error ? <p className="availability-bad">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <div className="empty-state">
          <p>No equipment is currently available for the selected date.</p>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="dashboard-list">
          {items.map((item) => (
            <div key={item.id} className="overview-card">
              <p>{item.name}</p>
              <strong>{formatPKR(item.pricePerDay)} / day</strong>
              <p>Available: {item.availableQuantity ?? 0}</p>
              <div className="quick-actions">
                <input
                  type="number"
                  min="1"
                  max={String(Math.max(Number(item.availableQuantity || 1), 1))}
                  value={quantities[item.id] ?? "1"}
                  onChange={(event) =>
                    handleQuantityChange(item.id, event.target.value)
                  }
                  aria-label={`${item.name} quantity`}
                />
                <button type="button" onClick={() => handleAdd(item)}>
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
